import type { PostRow, ThreadRow } from "./html";
import {
  badgesEarned,
  BADGE_DEFINITIONS,
  computePointsFromCounts,
  levelFromPoints,
  pointsForAction,
} from "./reputation";

export type Env = {
  DB: D1Database;
};

export type UserBadge = {
  id: string;
  name: string;
  description: string;
  earned_at: number;
};

export type AuthorProfile = {
  username: string;
  points: number;
  level: string;
  post_count: number;
  thread_count: number;
  badges: UserBadge[];
};

export type UserProfile = AuthorProfile & {
  id: number;
  email: string | null;
  created_at: number;
};

const POST_WINDOW_SECONDS = 60;
const POST_LIMIT_PER_WINDOW = 5;

// Bump this marker when the schema, default boards or backfills need another upgrade.
const DATABASE_VERSION = "schema_2026_10_09";

export async function initializeDatabase(db: D1Database): Promise<void> {
  try {
    const completed = await db.prepare("SELECT name FROM bbs_migrations WHERE name = ?")
      .bind(DATABASE_VERSION).first();
    if (completed) return;
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("no such table: bbs_migrations")) throw error;
  }
  await ensureSchema(db);
  await seedBoardsIfEmpty(db);
  await db.prepare("INSERT OR IGNORE INTO bbs_migrations (name) VALUES (?)")
    .bind(DATABASE_VERSION).run();
}

export async function ensureSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'user',
      is_banned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      csrf_token TEXT,
      expires_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER REFERENCES boards(id),
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL REFERENCES boards(id),
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_post_at INTEGER NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      reply_count INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES threads(id),
      parent_id INTEGER REFERENCES posts(id),
      user_id INTEGER REFERENCES users(id),
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS post_edits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      edited_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_post_edits_post ON post_edits(post_id, id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS thread_reads (
      user_id INTEGER NOT NULL REFERENCES users(id),
      thread_id INTEGER NOT NULL REFERENCES threads(id),
      last_read_post_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, thread_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_badges (
      user_id INTEGER NOT NULL REFERENCES users(id),
      badge_id TEXT NOT NULL REFERENCES badges(id),
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, badge_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
      ip TEXT NOT NULL,
      action TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (ip, action, window_start)
    )`),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id)`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_threads_board ON threads(board_id, last_post_at DESC)`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id, created_at)`,
    ),
  ]);

  await db.prepare("CREATE TABLE IF NOT EXISTS bbs_migrations (name TEXT PRIMARY KEY)").run();
  await migrateLegacyUsers(db);
  await migrateBoardHierarchy(db);
  await seedAnnouncementBoard(db);
  await migrateReputationColumns(db);
  await migratePostParentId(db);
  await migrateAdminColumns(db);
  const boardColumns = await db.prepare("PRAGMA table_info(boards)").all<{ name: string }>();
  if (!(boardColumns.results ?? []).some((column) => column.name === "slug")) {
    await db.prepare("ALTER TABLE boards ADD COLUMN slug TEXT").run();
  }
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_boards_slug ON boards(slug)").run();
  await migrateBoardSlugs(db);
  await seedBadgesIfEmpty(db);
  await backfillReputationIfNeeded(db);

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_boards_parent ON boards(parent_id, sort_order)`,
    )
    .run();
  await db
    .prepare(`CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id)`)
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id, created_at)`,
    )
    .run();
}

async function migrateAdminColumns(db: D1Database): Promise<void> {
  const additions: Record<string, Record<string, string>> = {
    users: { role: "TEXT NOT NULL DEFAULT 'user'", is_banned: "INTEGER NOT NULL DEFAULT 0" },
    sessions: { csrf_token: "TEXT" },
    boards: { is_archived: "INTEGER NOT NULL DEFAULT 0" },
    threads: { is_deleted: "INTEGER NOT NULL DEFAULT 0", is_locked: "INTEGER NOT NULL DEFAULT 0", is_pinned: "INTEGER NOT NULL DEFAULT 0" },
    posts: { is_deleted: "INTEGER NOT NULL DEFAULT 0" },
  };
  for (const [table, columns] of Object.entries(additions)) {
    const existing = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
    for (const [name, definition] of Object.entries(columns)) {
      if (!(existing.results ?? []).some((column) => column.name === name)) {
        await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`).run();
      }
    }
  }
}

async function migrateLegacyUsers(db: D1Database): Promise<void> {
  const usersTable = await db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'",
    )
    .first<{ sql: string | null }>();

  if (!usersTable?.sql?.includes("email TEXT NOT NULL")) {
    const orphan = await db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users_v2'",
      )
      .first();
    if (orphan) await db.prepare("DROP TABLE users_v2").run();
    return;
  }

  await db.prepare("DELETE FROM sessions").run();

  const v2Exists = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users_v2'",
    )
    .first();

  if (!v2Exists) {
    await db.prepare(`CREATE TABLE users_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`).run();
    await db
      .prepare(
        `INSERT INTO users_v2 (id, email, username, password_hash, created_at)
         SELECT id, NULLIF(email, ''), username, password_hash, created_at FROM users`,
      )
      .run();
  }

  await db.prepare("DROP TABLE users").run();
  await db.prepare("ALTER TABLE users_v2 RENAME TO users").run();
}

export async function seedBoardsIfEmpty(db: D1Database): Promise<void> {
  const count = await db
    .prepare("SELECT COUNT(*) AS n FROM boards")
    .first<{ n: number }>();
  if (count && count.n > 0) return;

  const insert = (
    id: number,
    name: string,
    description: string,
    sortOrder: number,
    parentId: number | null,
  ) =>
    db
      .prepare(
        "INSERT INTO boards (id, parent_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(id, parentId, name, description, sortOrder);

  await db.batch([
    insert(1, "Bitcoin Purity", "Protocol, consensus, and the Purity vision.", 1, null),
    insert(2, "Mining", "Proof-of-work, pools, and hash rate.", 2, null),
    insert(3, "Development", "Node software and protocol implementation.", 3, null),
    insert(4, "Meta", "Forum feedback and off-topic conversation.", 99, null),
    insert(
      11,
      "General Discussion",
      "Community discussion about Bitcoin Purity.",
      1,
      1,
    ),
    insert(
      12,
      "Consensus & Protocol",
      "RDTS, hard fork rules, and consensus specification.",
      2,
      1,
    ),
    insert(
      13,
      "Roadmap",
      "Short-term tree and longer research direction.",
      3,
      1,
    ),
    insert(
      21,
      "Pool & Solo Mining",
      "Trial solo pool, stratum setup, and payout status.",
      1,
      2,
    ),
    insert(
      22,
      "Hashrate & ASERT",
      "Difficulty adjustment, hash rate, and block times.",
      2,
      2,
    ),
    insert(
      31,
      "Node & Builds",
      "Building and running Bitcoin Purity nodes.",
      1,
      3,
    ),
    insert(
      32,
      "Patches & PRs",
      "Code changes, reviews, and implementation work.",
      2,
      3,
    ),
    insert(41, "Forum Feedback", "Suggestions and issues about this BBS.", 1, 4),
    insert(42, "Off-topic", "Non-Purity conversation.", 2, 4),
  ]);

  await db.prepare("INSERT OR IGNORE INTO bbs_migrations (name) VALUES ('board_hierarchy')").run();
  await seedAnnouncementBoard(db);
  await migrateBoardSlugs(db);
}

export async function migrateBoardSlugs(db: D1Database): Promise<void> {
  const { results } = await db.prepare("SELECT id,name,slug FROM boards ORDER BY id")
    .all<{ id: number; name: string; slug: string | null }>();
  const boards = results ?? [];
  const used = new Set(boards.flatMap((board) => board.slug ? [board.slug] : []));
  const updates: D1PreparedStatement[] = [];
  for (const board of boards) {
    if (board.slug) continue;
    let base = board.name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "board";
    if (/^\d+$/.test(base)) base = `board-${base}`;
    let slug = base;
    for (let suffix = 2; used.has(slug); suffix++) slug = `${base}-${suffix}`;
    used.add(slug);
    updates.push(db.prepare("UPDATE boards SET slug=? WHERE id=? AND slug IS NULL").bind(slug, board.id));
  }
  if (updates.length) await db.batch(updates);
}

async function seedAnnouncementBoard(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      INSERT INTO boards (parent_id, name, description, sort_order)
      SELECT category.id, 'Announcement',
             'Official announcements, releases, and project updates.', 0
      FROM boards AS category
      WHERE category.parent_id IS NULL AND category.name = 'Bitcoin Purity'
        AND NOT EXISTS (SELECT 1 FROM bbs_migrations WHERE name = 'announcement')
        AND NOT EXISTS (SELECT 1 FROM boards WHERE parent_id = category.id AND name = 'Announcement')
    `),
    db.prepare(`INSERT OR IGNORE INTO bbs_migrations (name)
      SELECT 'announcement' WHERE EXISTS (SELECT 1 FROM boards WHERE parent_id IS NOT NULL)`),
  ]);
}

async function migrateBoardHierarchy(db: D1Database): Promise<void> {
  if (await db.prepare("SELECT name FROM bbs_migrations WHERE name = 'board_hierarchy'").first()) return;
  const columns = await db.prepare("PRAGMA table_info(boards)").all<{
    name: string;
  }>();
  const hasParentId = (columns.results ?? []).some((c) => c.name === "parent_id");
  if (!hasParentId) {
    await db.prepare("ALTER TABLE boards ADD COLUMN parent_id INTEGER").run();
  }

  const leafCount = await db
    .prepare("SELECT COUNT(*) AS n FROM boards WHERE parent_id IS NOT NULL")
    .first<{ n: number }>();
  if (leafCount && leafCount.n > 0) {
    await db.prepare("INSERT OR IGNORE INTO bbs_migrations (name) VALUES ('board_hierarchy')").run();
    return;
  }

  const flatCount = await db
    .prepare("SELECT COUNT(*) AS n FROM boards WHERE parent_id IS NULL")
    .first<{ n: number }>();
  if (!flatCount || flatCount.n === 0) return;

  const flatMigrations = [
    {
      boardId: 1,
      categoryName: "Bitcoin Purity",
      categoryDesc: "Protocol, consensus, and the Purity vision.",
      categoryOrder: 1,
      leafName: "General Discussion",
      leafDesc: "Community discussion about Bitcoin Purity.",
    },
    {
      boardId: 2,
      categoryName: "Mining",
      categoryDesc: "Proof-of-work, pools, and hash rate.",
      categoryOrder: 2,
      leafName: "Pool & Solo Mining",
      leafDesc: "Trial solo pool, stratum setup, and payout status.",
    },
    {
      boardId: 3,
      categoryName: "Development",
      categoryDesc: "Node software and protocol implementation.",
      categoryOrder: 3,
      leafName: "Node & Builds",
      leafDesc: "Building and running Bitcoin Purity nodes.",
    },
    {
      boardId: 4,
      categoryName: "Meta",
      categoryDesc: "Forum feedback and off-topic conversation.",
      categoryOrder: 99,
      leafName: "Forum Feedback",
      leafDesc: "Suggestions and issues about this BBS.",
    },
  ] as const;

  for (const item of flatMigrations) {
    const exists = await db
      .prepare("SELECT id FROM boards WHERE id = ?")
      .bind(item.boardId)
      .first();
    if (!exists) continue;

    const category = await db
      .prepare(
        "INSERT INTO boards (parent_id, name, description, sort_order) VALUES (NULL, ?, ?, ?) RETURNING id",
      )
      .bind(item.categoryName, item.categoryDesc, item.categoryOrder)
      .first<{ id: number }>();
    if (!category) continue;

    await db
      .prepare(
        "UPDATE boards SET parent_id = ?, name = ?, description = ? WHERE id = ?",
      )
      .bind(category.id, item.leafName, item.leafDesc, item.boardId)
      .run();
  }

  const extraLeaves = [
    {
      parentId: null as number | null,
      findCategory: "Bitcoin Purity",
      name: "Consensus & Protocol",
      description: "RDTS, hard fork rules, and consensus specification.",
      sortOrder: 2,
    },
    {
      parentId: null,
      findCategory: "Bitcoin Purity",
      name: "Roadmap",
      description: "Short-term tree and longer research direction.",
      sortOrder: 3,
    },
    {
      parentId: null,
      findCategory: "Mining",
      name: "Hashrate & ASERT",
      description: "Difficulty adjustment, hash rate, and block times.",
      sortOrder: 2,
    },
    {
      parentId: null,
      findCategory: "Development",
      name: "Patches & PRs",
      description: "Code changes, reviews, and implementation work.",
      sortOrder: 2,
    },
    {
      parentId: null,
      findCategory: "Meta",
      name: "Off-topic",
      description: "Non-Purity conversation.",
      sortOrder: 2,
    },
  ];

  for (const leaf of extraLeaves) {
    const category = await db
      .prepare("SELECT id FROM boards WHERE parent_id IS NULL AND name = ?")
      .bind(leaf.findCategory)
      .first<{ id: number }>();
    if (!category) continue;

    const duplicate = await db
      .prepare("SELECT id FROM boards WHERE parent_id = ? AND name = ?")
      .bind(category.id, leaf.name)
      .first();
    if (duplicate) continue;

    await db
      .prepare(
        "INSERT INTO boards (parent_id, name, description, sort_order) VALUES (?, ?, ?, ?)",
      )
      .bind(category.id, leaf.name, leaf.description, leaf.sortOrder)
      .run();
  }
  await db.prepare("INSERT OR IGNORE INTO bbs_migrations (name) VALUES ('board_hierarchy')").run();
}

async function migrateReputationColumns(db: D1Database): Promise<void> {
  const userCols = await db.prepare("PRAGMA table_info(users)").all<{ name: string }>();
  if (!(userCols.results ?? []).some((c) => c.name === "points")) {
    await db.prepare("ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0").run();
  }

  const postCols = await db.prepare("PRAGMA table_info(posts)").all<{ name: string }>();
  if (!(postCols.results ?? []).some((c) => c.name === "user_id")) {
    await db.prepare("ALTER TABLE posts ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
  }

  await db
    .prepare(
      `UPDATE posts
       SET user_id = (
         SELECT u.id FROM users u WHERE u.username = posts.author COLLATE NOCASE LIMIT 1
       )
       WHERE user_id IS NULL`,
    )
    .run();
}

async function migratePostParentId(db: D1Database): Promise<void> {
  const postCols = await db.prepare("PRAGMA table_info(posts)").all<{ name: string }>();
  if (!(postCols.results ?? []).some((c) => c.name === "parent_id")) {
    await db
      .prepare("ALTER TABLE posts ADD COLUMN parent_id INTEGER REFERENCES posts(id)")
      .run();
  }

  // Existing flat replies become top-level comments under the opening post.
  await db
    .prepare(
      `UPDATE posts
       SET parent_id = (
         SELECT p0.id FROM posts p0
         WHERE p0.thread_id = posts.thread_id
         ORDER BY p0.created_at ASC, p0.id ASC
         LIMIT 1
       )
       WHERE parent_id IS NULL
         AND id != (
           SELECT p0.id FROM posts p0
           WHERE p0.thread_id = posts.thread_id
           ORDER BY p0.created_at ASC, p0.id ASC
           LIMIT 1
         )`,
    )
    .run();
}

async function backfillReputationIfNeeded(db: D1Database): Promise<void> {
  const needsBackfill = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM users u
       WHERE u.points = 0
         AND EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id)`,
    )
    .first<{ n: number }>();
  if (needsBackfill && needsBackfill.n > 0) {
    await backfillReputation(db);
  }
}

export async function seedBadgesIfEmpty(db: D1Database): Promise<void> {
  const count = await db
    .prepare("SELECT COUNT(*) AS n FROM badges")
    .first<{ n: number }>();
  if (count && count.n > 0) return;

  await db.batch(
    BADGE_DEFINITIONS.map((badge) =>
      db
        .prepare(
          "INSERT INTO badges (id, name, description, sort_order) VALUES (?, ?, ?, ?)",
        )
        .bind(badge.id, badge.name, badge.description, badge.sortOrder),
    ),
  );
}

async function getUserActivityCounts(
  db: D1Database,
  userId: number,
  visibleOnly = false,
): Promise<{ postCount: number; threadCount: number; replyCount: number }> {
  const postVisibility = visibleOnly ? `AND p.is_deleted=0 AND EXISTS (
    SELECT 1 FROM threads t JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
    WHERE t.id=p.thread_id AND t.is_deleted=0 AND b.is_archived=0 AND c.is_archived=0
  )` : "";
  const threadVisibility = visibleOnly ? `AND t.is_deleted=0 AND EXISTS (
    SELECT 1 FROM boards b JOIN boards c ON c.id=b.parent_id
    WHERE b.id=t.board_id AND b.is_archived=0 AND c.is_archived=0
  )` : "";
  const postCount = await db.prepare(`SELECT COUNT(*) AS n FROM posts p WHERE p.user_id=? ${postVisibility}`)
    .bind(userId).first<{ n: number }>();
  const threadCount = await db.prepare(`SELECT COUNT(*) AS n FROM threads t WHERE (
    SELECT p.user_id FROM posts p WHERE p.thread_id=t.id ORDER BY p.created_at,p.id LIMIT 1
  )=? ${threadVisibility}`).bind(userId).first<{ n: number }>();
  const posts = postCount?.n ?? 0;
  const threads = threadCount?.n ?? 0;
  return { postCount: posts, threadCount: threads, replyCount: Math.max(0, posts - threads) };
}

async function getExistingBadgeIds(
  db: D1Database,
  userId: number,
): Promise<Set<string>> {
  const { results } = await db
    .prepare("SELECT badge_id FROM user_badges WHERE user_id = ?")
    .bind(userId)
    .all<{ badge_id: string }>();
  return new Set((results ?? []).map((r) => r.badge_id));
}

export async function syncUserBadges(db: D1Database, userId: number): Promise<void> {
  const user = await db
    .prepare("SELECT points FROM users WHERE id = ?")
    .bind(userId)
    .first<{ points: number }>();
  if (!user) return;

  const counts = await getUserActivityCounts(db, userId);
  const existing = await getExistingBadgeIds(db, userId);
  const newBadges = badgesEarned(
    {
      points: user.points,
      postCount: counts.postCount,
      threadCount: counts.threadCount,
      replyCount: counts.replyCount,
    },
    existing,
  );

  if (newBadges.length === 0) return;
  const now = Math.floor(Date.now() / 1000);
  await db.batch(
    newBadges.map((badgeId) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)",
        )
        .bind(userId, badgeId, now),
    ),
  );
}

export async function awardRegisteredBadge(db: D1Database, userId: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      "INSERT OR IGNORE INTO user_badges (user_id, badge_id, earned_at) VALUES (?, 'registered', ?)",
    )
    .bind(userId, now)
    .run();
}

async function backfillReputation(db: D1Database): Promise<void> {
  const { results: users } = await db
    .prepare("SELECT id FROM users WHERE points = 0")
    .all<{ id: number }>();

  for (const user of users ?? []) {
    const counts = await getUserActivityCounts(db, user.id);
    const points = computePointsFromCounts(counts.threadCount, counts.replyCount);
    await db
      .prepare("UPDATE users SET points = ? WHERE id = ?")
      .bind(points, user.id)
      .run();
    await syncUserBadges(db, user.id);
  }
}

export async function getUserBadges(
  db: D1Database,
  userId: number,
): Promise<UserBadge[]> {
  const { results } = await db
    .prepare(
      `SELECT b.id, b.name, b.description, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY b.sort_order, ub.earned_at`,
    )
    .bind(userId)
    .all<UserBadge>();
  return results ?? [];
}

export async function getUserProfile(
  db: D1Database,
  username: string,
): Promise<UserProfile | null> {
  const user = await db
    .prepare(
      "SELECT id, username, email, points, created_at FROM users WHERE username = ? COLLATE NOCASE",
    )
    .bind(username)
    .first<{
      id: number;
      username: string;
      email: string | null;
      points: number;
      created_at: number;
    }>();
  if (!user) return null;

  const counts = await getUserActivityCounts(db, user.id, true);
  const badges = await getUserBadges(db, user.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    points: user.points,
    level: levelFromPoints(user.points),
    post_count: counts.postCount,
    thread_count: counts.threadCount,
    badges,
    created_at: user.created_at,
  };
}

export async function getAuthorProfiles(
  db: D1Database,
  usernames: string[],
): Promise<Map<string, AuthorProfile>> {
  const map = new Map<string, AuthorProfile>();
  if (usernames.length === 0) return map;

  const requestedAuthors = JSON.stringify([...new Set(usernames)]);
  const [profiles, badges] = await db.batch([
    db.prepare(`SELECT u.id, u.username, u.points,
      (SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id AND p.is_deleted=0 AND EXISTS (
        SELECT 1 FROM threads t JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
        WHERE t.id=p.thread_id AND t.is_deleted=0 AND b.is_archived=0 AND c.is_archived=0
      )) AS post_count,
      (SELECT COUNT(*) FROM threads t WHERE (
        SELECT p.user_id FROM posts p WHERE p.thread_id=t.id ORDER BY p.created_at,p.id LIMIT 1
      )=u.id AND t.is_deleted=0 AND EXISTS (
        SELECT 1 FROM boards b JOIN boards c ON c.id=b.parent_id
        WHERE b.id=t.board_id AND b.is_archived=0 AND c.is_archived=0
      )) AS thread_count
      FROM users u WHERE u.username COLLATE NOCASE IN (SELECT value FROM json_each(?))`)
      .bind(requestedAuthors),
    db.prepare(`SELECT u.id AS user_id, b.id, b.name, b.description, ub.earned_at
      FROM users u JOIN user_badges ub ON ub.user_id=u.id JOIN badges b ON b.id=ub.badge_id
      WHERE u.username COLLATE NOCASE IN (SELECT value FROM json_each(?))
      ORDER BY b.sort_order, ub.earned_at`).bind(requestedAuthors),
  ]);
  const badgesByUser = new Map<number, UserBadge[]>();
  for (const row of badges.results as (UserBadge & { user_id: number })[]) {
    const { user_id, ...badge } = row;
    const list = badgesByUser.get(user_id) ?? [];
    list.push(badge);
    badgesByUser.set(user_id, list);
  }
  for (const profile of profiles.results as (Omit<AuthorProfile, "level" | "badges"> & { id: number })[]) {
    map.set(profile.username.toLowerCase(), {
      username: profile.username,
      points: profile.points,
      level: levelFromPoints(profile.points),
      post_count: profile.post_count,
      thread_count: profile.thread_count,
      badges: badgesByUser.get(profile.id) ?? [],
    });
  }
  return map;
}

export async function createUser(
  db: D1Database,
  email: string | null,
  username: string,
  passwordHash: string,
): Promise<number | null> {
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      "INSERT INTO users (email, username, password_hash, created_at) VALUES (?, ?, ?, ?) RETURNING id",
    )
    .bind(email, username, passwordHash, now)
    .first<{ id: number }>();
  return row?.id ?? null;
}

export async function getUserByUsername(
  db: D1Database,
  username: string,
): Promise<{
  id: number;
  email: string | null;
  username: string;
  password_hash: string;
  is_banned: number;
} | null> {
  return db
    .prepare(
      "SELECT id, email, username, password_hash, is_banned FROM users WHERE username = ? COLLATE NOCASE",
    )
    .bind(username)
    .first<{
      id: number;
      email: string | null;
      username: string;
      password_hash: string;
      is_banned: number;
    }>();
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<{
  id: number;
  email: string | null;
  username: string;
  password_hash: string;
  is_banned: number;
} | null> {
  return db
    .prepare(
      "SELECT id, email, username, password_hash, is_banned FROM users WHERE email = ?",
    )
    .bind(email.toLowerCase())
    .first<{
      id: number;
      email: string | null;
      username: string;
      password_hash: string;
      is_banned: number;
    }>();
}

export async function updateUserPassword(
  db: D1Database,
  userId: number,
  passwordHash: string,
): Promise<void> {
  await db
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, userId)
    .run();
}

export async function createPasswordResetToken(
  db: D1Database,
  userId: number,
  token: string,
  expiresAt: number,
): Promise<void> {
  await db
    .prepare("DELETE FROM password_reset_tokens WHERE user_id = ?")
    .bind(userId)
    .run();
  await db
    .prepare(
      "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .bind(token, userId, expiresAt)
    .run();
}

export async function getPasswordReset(
  db: D1Database,
  token: string,
): Promise<{ user_id: number; expires_at: number } | null> {
  const now = Math.floor(Date.now() / 1000);
  return db
    .prepare(
      "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ? AND expires_at > ?",
    )
    .bind(token, now)
    .first<{ user_id: number; expires_at: number }>();
}

export async function deletePasswordResetToken(
  db: D1Database,
  token: string,
): Promise<void> {
  await db
    .prepare("DELETE FROM password_reset_tokens WHERE token = ?")
    .bind(token)
    .run();
}

export async function createSession(
  db: D1Database,
  token: string,
  userId: number,
  expiresAt: number,
): Promise<boolean> {
  const result = await db.prepare(`INSERT INTO sessions (token, user_id, expires_at)
    SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND is_banned=0)`)
    .bind(token, userId, expiresAt, userId).run();
  return result.meta.changes > 0;
}

export async function deleteSession(
  db: D1Database,
  token: string,
): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export type BoardStats = {
  id: number;
  slug: string;
  name: string;
  description: string;
  thread_count: number;
  post_count: number;
  new_topic_count: number;
  last_post_at: number | null;
  last_thread_id: number | null;
  last_thread_title: string | null;
};

export type CategorySection = {
  id: number;
  slug: string;
  name: string;
  description: string;
  boards: BoardStats[];
};

const newTopicCountQuery = `
  (SELECT COUNT(*) FROM threads t_new
   LEFT JOIN thread_reads r ON r.thread_id = t_new.id AND r.user_id = ?
   WHERE t_new.board_id = b.id AND t_new.is_deleted = 0 AND ? IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM posts p_new
       WHERE p_new.thread_id = t_new.id AND p_new.is_deleted = 0
         AND p_new.id > COALESCE(r.last_read_post_id, 0)
     ))`;

const boardStatsQuery = `
  SELECT
    b.id, b.slug, b.name, b.description,
    COUNT(DISTINCT t.id) AS thread_count,
    COUNT(p.id) AS post_count,
    ${newTopicCountQuery} AS new_topic_count,
    MAX(t.last_post_at) AS last_post_at,
    (SELECT t2.id FROM threads t2 WHERE t2.board_id = b.id AND t2.is_deleted = 0 ORDER BY t2.last_post_at DESC LIMIT 1) AS last_thread_id,
    (SELECT t2.title FROM threads t2 WHERE t2.board_id = b.id AND t2.is_deleted = 0 ORDER BY t2.last_post_at DESC LIMIT 1) AS last_thread_title
  FROM boards b
  LEFT JOIN threads t ON t.board_id = b.id AND t.is_deleted = 0
  LEFT JOIN posts p ON p.thread_id = t.id AND p.is_deleted = 0`;

export async function getBoardIndex(
  db: D1Database,
  userId: number | null = null,
): Promise<CategorySection[]> {
  const [hierarchy, stats] = await db.batch([
    db.prepare("SELECT id, parent_id, slug, name, description FROM boards WHERE is_archived = 0 ORDER BY sort_order, id"),
    db.prepare(`${boardStatsQuery}
      WHERE b.parent_id IS NOT NULL AND b.is_archived = 0 AND EXISTS (
        SELECT 1 FROM boards category WHERE category.id = b.parent_id
          AND category.parent_id IS NULL AND category.is_archived = 0
      ) GROUP BY b.id`).bind(userId, userId),
  ]);
  const boards = hierarchy.results as (Omit<CategorySection, "boards"> & { parent_id: number | null })[];
  const sections = new Map<number, CategorySection>();
  for (const board of boards) {
    if (board.parent_id === null) {
      sections.set(board.id, { id: board.id, slug: board.slug, name: board.name, description: board.description, boards: [] });
    }
  }
  const statsByBoard = new Map((stats.results as BoardStats[]).map((board) => [board.id, board]));
  for (const board of boards) {
    if (board.parent_id === null) continue;
    const section = sections.get(board.parent_id);
    const boardStats = statsByBoard.get(board.id);
    if (section && boardStats) section.boards.push(boardStats);
  }
  return [...sections.values()];
}

export async function getCategory(
  db: D1Database,
  id: number | string,
  userId: number | null = null,
): Promise<CategorySection | null> {
  const column = typeof id === "number" ? "id" : "slug";
  const [categories, boards] = await db.batch([
    db.prepare(`SELECT id, slug, name, description FROM boards
      WHERE ${column} = ? AND parent_id IS NULL AND is_archived = 0`).bind(id),
    db.prepare(`${boardStatsQuery}
      WHERE b.is_archived = 0 AND b.parent_id = (
        SELECT id FROM boards WHERE ${column} = ? AND parent_id IS NULL AND is_archived = 0
      ) GROUP BY b.id ORDER BY b.sort_order, b.id`).bind(userId, userId, id),
  ]);
  const category = (categories.results as Omit<CategorySection, "boards">[])[0];
  if (!category) return null;

  return { ...category, boards: boards.results as BoardStats[] };
}

export async function getBoard(
  db: D1Database,
  id: number | string,
  userId: number | null = null,
): Promise<{
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  parent_slug: string | null;
  new_topic_count: number;
} | null> {
  return db
    .prepare(
      `SELECT b.id, b.slug, b.name, b.parent_id, p.name AS parent_name, p.slug AS parent_slug,
              ${newTopicCountQuery} AS new_topic_count
       FROM boards b
       LEFT JOIN boards p ON p.id = b.parent_id
       WHERE b.${typeof id === "number" ? "id" : "slug"} = ? AND b.is_archived = 0 AND (b.parent_id IS NULL OR p.is_archived = 0)`,
    )
    .bind(userId, userId, id)
    .first<{
      id: number;
      slug: string;
      name: string;
      parent_id: number | null;
      parent_name: string | null;
      parent_slug: string | null;
      new_topic_count: number;
    }>();
}

export function isLeafBoard(
  board: { parent_id: number | null } | null,
): board is { parent_id: number; name: string; id: number; slug: string; parent_name: string | null; parent_slug: string } {
  return board != null && board.parent_id != null;
}

export async function getThreads(
  db: D1Database,
  boardId: number,
): Promise<ThreadRow[]> {
  const { results } = await db
    .prepare(
      `SELECT
        t.id, t.title, t.created_at, t.last_post_at, t.reply_count, t.is_locked, t.is_pinned,
        (SELECT p.author FROM posts p WHERE p.thread_id = t.id ORDER BY p.created_at ASC LIMIT 1) AS author
      FROM threads t
      WHERE t.board_id = ? AND t.is_deleted = 0
      ORDER BY t.is_pinned DESC, t.last_post_at DESC, t.id DESC
      LIMIT 100`,
    )
    .bind(boardId)
    .all<ThreadRow>();
  return results ?? [];
}

export async function getThread(
  db: D1Database,
  id: number,
): Promise<{ id: number; board_id: number; title: string; is_locked: number } | null> {
  return db
    .prepare(`SELECT t.id, t.board_id, t.title, t.is_locked FROM threads t
      JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
      WHERE t.id = ? AND t.is_deleted=0 AND b.is_archived=0 AND c.is_archived=0`)
    .bind(id)
    .first<{ id: number; board_id: number; title: string; is_locked: number }>();
}

export async function getPosts(
  db: D1Database,
  threadId: number,
): Promise<PostRow[]> {
  const { results } = await db
    .prepare(
      `WITH opening_post AS (
         SELECT id FROM posts WHERE thread_id = ? ORDER BY created_at, id LIMIT 1
       )
       SELECT p.id, p.parent_id, p.user_id, p.author,
        CASE WHEN p.is_deleted = 1 THEN 'Post deleted' ELSE p.body END AS body,
        p.created_at, p.is_deleted,
        CASE WHEN p.id = (SELECT id FROM opening_post) AND p.is_deleted = 0 THEN
          (SELECT json_group_array(edited_at) FROM (
            SELECT edited_at FROM post_edits WHERE post_id = (SELECT id FROM opening_post) ORDER BY id
          ))
        ELSE '[]' END AS edit_times_json
       FROM posts p WHERE p.thread_id = ? ORDER BY p.created_at ASC, p.id ASC`,
    )
    .bind(threadId, threadId)
    .all<PostRow & { edit_times_json: string }>();
  return (results ?? []).map(({ edit_times_json, ...post }) => ({
    ...post, edit_times: JSON.parse(edit_times_json) as number[],
  }));
}

export async function updateThread(
  db: D1Database,
  threadId: number,
  userId: number,
  title: string,
  body: string,
): Promise<boolean> {
  const results = await db.batch<{ id: number }>([
    db.prepare(`INSERT INTO post_edits (post_id, edited_at)
      SELECT p.id, ? FROM posts p
      JOIN threads t ON t.id=p.thread_id
      JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
      JOIN users u ON u.id=p.user_id
      WHERE t.id=? AND p.user_id=? AND p.parent_id IS NULL
        AND p.id=(SELECT id FROM posts WHERE thread_id=t.id ORDER BY created_at,id LIMIT 1)
        AND p.is_deleted=0 AND t.is_deleted=0 AND b.is_archived=0 AND c.is_archived=0 AND u.is_banned=0
        AND (t.title<>? OR p.body<>?) RETURNING id`)
      .bind(Math.floor(Date.now() / 1000), threadId, userId, title, body),
    // The audit insert authorizes this edit; all three statements commit together.
    db.prepare(`UPDATE posts SET body=? WHERE thread_id=? AND changes()>0
      AND id=(SELECT post_id FROM post_edits WHERE id=last_insert_rowid())`)
      .bind(body, threadId),
    db.prepare("UPDATE threads SET title=? WHERE id=? AND changes()>0").bind(title, threadId),
  ]);
  return results[0].results.length > 0;
}

export async function markThreadRead(
  db: D1Database,
  userId: number,
  threadId: number,
  lastReadPostId: number,
): Promise<void> {
  await db.prepare(`
    INSERT INTO thread_reads (user_id, thread_id, last_read_post_id)
    VALUES (?, ?, ?)
    ON CONFLICT (user_id, thread_id) DO UPDATE SET
      last_read_post_id = MAX(thread_reads.last_read_post_id, excluded.last_read_post_id)
  `).bind(userId, threadId, lastReadPostId).run();
}

export async function getPostInThread(
  db: D1Database,
  threadId: number,
  postId: number,
): Promise<{ id: number; parent_id: number | null; is_deleted: number } | null> {
  return db
    .prepare(
      "SELECT id, parent_id, is_deleted FROM posts WHERE id = ? AND thread_id = ?",
    )
    .bind(postId, threadId)
    .first<{ id: number; parent_id: number | null; is_deleted: number }>();
}

/** Depth of a post in the reply tree (opening post = 0). */
export async function getPostDepth(
  db: D1Database,
  threadId: number,
  postId: number,
): Promise<number> {
  let depth = 0;
  let currentId: number | null = postId;
  const seen = new Set<number>();

  while (currentId != null && depth < 32) {
    if (seen.has(currentId)) break;
    seen.add(currentId);

    const row: { parent_id: number | null } | null = await db
      .prepare("SELECT parent_id FROM posts WHERE id = ? AND thread_id = ?")
      .bind(currentId, threadId)
      .first<{ parent_id: number | null }>();

    if (!row || row.parent_id == null) break;
    depth += 1;
    currentId = row.parent_id;
  }

  return depth;
}

export const MAX_REPLY_DEPTH = 5;

export async function checkRateLimit(
  db: D1Database,
  ip: string,
  action: string,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % POST_WINDOW_SECONDS);

  const row = await db
    .prepare(
      "SELECT count FROM rate_limits WHERE ip = ? AND action = ? AND window_start = ?",
    )
    .bind(ip, action, windowStart)
    .first<{ count: number }>();

  if (!row) {
    await db
      .prepare(
        "INSERT INTO rate_limits (ip, action, window_start, count) VALUES (?, ?, ?, 1)",
      )
      .bind(ip, action, windowStart)
      .run();
    return true;
  }

  if (row.count >= POST_LIMIT_PER_WINDOW) return false;

  await db
    .prepare(
      "UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND action = ? AND window_start = ?",
    )
    .bind(ip, action, windowStart)
    .run();
  return true;
}

export async function createThread(
  db: D1Database,
  boardId: number,
  userId: number,
  author: string,
  body: string,
  title: string,
): Promise<number | null> {
  const now = Math.floor(Date.now() / 1000);
  const results = await db.batch<{ id: number }>([
    db.prepare(`INSERT INTO threads (board_id, title, created_at, last_post_at, reply_count)
      SELECT ?, ?, ?, ?, 0 WHERE EXISTS (
        SELECT 1 FROM boards b JOIN boards p ON p.id=b.parent_id
        WHERE b.id=? AND b.is_archived=0 AND p.is_archived=0
      ) AND EXISTS (SELECT 1 FROM users WHERE id=? AND is_banned=0) RETURNING id`)
      .bind(boardId, title.trim().slice(0, 120), now, now, boardId, userId),
    // D1 batch keeps these statements in one transaction on the same connection.
    db.prepare(`INSERT INTO posts (thread_id, parent_id, user_id, author, body, created_at)
      SELECT last_insert_rowid(), NULL, ?, ?, ?, ? WHERE changes()>0`)
      .bind(userId, author, body.trim().slice(0, 10000), now),
    db.prepare("UPDATE users SET points=points+? WHERE id=? AND changes()>0").bind(pointsForAction("new_thread"), userId),
  ]);
  const id = results[0].results[0]?.id ?? null;
  if (id !== null) await syncUserBadges(db, userId);
  return id;
}

export async function createReply(
  db: D1Database,
  threadId: number,
  userId: number,
  author: string,
  body: string,
  parentId: number,
): Promise<number | null> {
  const now = Math.floor(Date.now() / 1000);
  const results = await db.batch<{ id: number }>([
    db.prepare(`INSERT INTO posts (thread_id, parent_id, user_id, author, body, created_at)
      SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (
        SELECT 1 FROM threads t JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
        WHERE t.id=? AND t.is_deleted=0 AND t.is_locked=0 AND b.is_archived=0 AND c.is_archived=0
      ) AND EXISTS (SELECT 1 FROM users WHERE id=? AND is_banned=0)
        AND EXISTS (SELECT 1 FROM posts WHERE id=? AND thread_id=? AND is_deleted=0) RETURNING id`)
      .bind(threadId, parentId, userId, author, body.trim().slice(0, 10000), now, threadId, userId, parentId, threadId),
    db.prepare("UPDATE users SET points=points+? WHERE id=? AND changes()>0").bind(pointsForAction("reply"), userId),
    db.prepare(`UPDATE threads SET
      reply_count=MAX(0,(SELECT COUNT(*) FROM posts WHERE thread_id=threads.id AND is_deleted=0)-1),
      last_post_at=COALESCE((SELECT MAX(created_at) FROM posts WHERE thread_id=threads.id AND is_deleted=0),created_at)
      WHERE id=? AND changes()>0`).bind(threadId),
  ]);
  const id = results[0].results[0]?.id ?? null;
  if (id !== null) await syncUserBadges(db, userId);
  return id;
}
