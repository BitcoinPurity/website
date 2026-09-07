import type { PostRow, ThreadRow } from "./html";
import {
  badgesEarned,
  BADGE_DEFINITIONS,
  computePointsFromCounts,
  levelFromPoints,
  pointsForAction,
  type ActivityAction,
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

export async function ensureSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
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
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL REFERENCES boards(id),
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_post_at INTEGER NOT NULL,
      reply_count INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES threads(id),
      parent_id INTEGER REFERENCES posts(id),
      user_id INTEGER REFERENCES users(id),
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
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

  await migrateLegacyUsers(db);
  await migrateBoardHierarchy(db);
  await migrateReputationColumns(db);
  await migratePostParentId(db);
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
}

async function migrateBoardHierarchy(db: D1Database): Promise<void> {
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
  if (leafCount && leafCount.n > 0) return;

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
): Promise<{ postCount: number; threadCount: number; replyCount: number }> {
  const postCount = await db
    .prepare("SELECT COUNT(*) AS n FROM posts WHERE user_id = ?")
    .bind(userId)
    .first<{ n: number }>();

  const threadCount = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM threads t
       WHERE (
         SELECT p.user_id FROM posts p
         WHERE p.thread_id = t.id
         ORDER BY p.created_at ASC
         LIMIT 1
       ) = ?`,
    )
    .bind(userId)
    .first<{ n: number }>();

  const posts = postCount?.n ?? 0;
  const threads = threadCount?.n ?? 0;
  return {
    postCount: posts,
    threadCount: threads,
    replyCount: Math.max(0, posts - threads),
  };
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

export async function awardActivity(
  db: D1Database,
  userId: number,
  action: ActivityAction,
): Promise<void> {
  const delta = pointsForAction(action);
  await db
    .prepare("UPDATE users SET points = points + ? WHERE id = ?")
    .bind(delta, userId)
    .run();
  await syncUserBadges(db, userId);
}

async function backfillReputation(db: D1Database): Promise<void> {
  const { results: users } = await db
    .prepare("SELECT id FROM users")
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

  const counts = await getUserActivityCounts(db, user.id);
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

  const unique = [...new Set(usernames)];
  for (const username of unique) {
    const profile = await getUserProfile(db, username);
    if (profile) {
      map.set(username.toLowerCase(), {
        username: profile.username,
        points: profile.points,
        level: profile.level,
        post_count: profile.post_count,
        thread_count: profile.thread_count,
        badges: profile.badges,
      });
    }
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
} | null> {
  return db
    .prepare(
      "SELECT id, email, username, password_hash FROM users WHERE username = ? COLLATE NOCASE",
    )
    .bind(username)
    .first<{
      id: number;
      email: string | null;
      username: string;
      password_hash: string;
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
} | null> {
  return db
    .prepare(
      "SELECT id, email, username, password_hash FROM users WHERE email = ?",
    )
    .bind(email.toLowerCase())
    .first<{
      id: number;
      email: string | null;
      username: string;
      password_hash: string;
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
): Promise<void> {
  await db
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expiresAt)
    .run();
}

export async function deleteSession(
  db: D1Database,
  token: string,
): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export type BoardStats = {
  id: number;
  name: string;
  description: string;
  thread_count: number;
  post_count: number;
  last_post_at: number | null;
  last_thread_id: number | null;
  last_thread_title: string | null;
};

export type CategorySection = {
  id: number;
  name: string;
  description: string;
  boards: BoardStats[];
};

const boardStatsQuery = `
  SELECT
    b.id, b.name, b.description,
    COUNT(DISTINCT t.id) AS thread_count,
    COUNT(p.id) AS post_count,
    MAX(t.last_post_at) AS last_post_at,
    (SELECT t2.id FROM threads t2 WHERE t2.board_id = b.id ORDER BY t2.last_post_at DESC LIMIT 1) AS last_thread_id,
    (SELECT t2.title FROM threads t2 WHERE t2.board_id = b.id ORDER BY t2.last_post_at DESC LIMIT 1) AS last_thread_title
  FROM boards b
  LEFT JOIN threads t ON t.board_id = b.id
  LEFT JOIN posts p ON p.thread_id = t.id
  WHERE b.id = ?
  GROUP BY b.id`;

export async function getBoardIndex(db: D1Database): Promise<CategorySection[]> {
  const { results: categories } = await db
    .prepare(
      "SELECT id, name, description FROM boards WHERE parent_id IS NULL ORDER BY sort_order, id",
    )
    .all<{ id: number; name: string; description: string }>();

  const sections: CategorySection[] = [];
  for (const category of categories ?? []) {
    const { results: children } = await db
      .prepare(
        "SELECT id FROM boards WHERE parent_id = ? ORDER BY sort_order, id",
      )
      .bind(category.id)
      .all<{ id: number }>();

    const boards: BoardStats[] = [];
    for (const child of children ?? []) {
      const stats = await db
        .prepare(boardStatsQuery)
        .bind(child.id)
        .first<BoardStats>();
      if (stats) boards.push(stats);
    }

    sections.push({ ...category, boards });
  }
  return sections;
}

export async function getCategory(
  db: D1Database,
  id: number,
): Promise<CategorySection | null> {
  const category = await db
    .prepare(
      "SELECT id, name, description FROM boards WHERE id = ? AND parent_id IS NULL",
    )
    .bind(id)
    .first<{ id: number; name: string; description: string }>();
  if (!category) return null;

  const { results: children } = await db
    .prepare("SELECT id FROM boards WHERE parent_id = ? ORDER BY sort_order, id")
    .bind(id)
    .all<{ id: number }>();

  const boards: BoardStats[] = [];
  for (const child of children ?? []) {
    const stats = await db
      .prepare(boardStatsQuery)
      .bind(child.id)
      .first<BoardStats>();
    if (stats) boards.push(stats);
  }

  return { ...category, boards };
}

export async function getBoard(
  db: D1Database,
  id: number,
): Promise<{
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
} | null> {
  return db
    .prepare(
      `SELECT b.id, b.name, b.parent_id, p.name AS parent_name
       FROM boards b
       LEFT JOIN boards p ON p.id = b.parent_id
       WHERE b.id = ?`,
    )
    .bind(id)
    .first<{
      id: number;
      name: string;
      parent_id: number | null;
      parent_name: string | null;
    }>();
}

export function isLeafBoard(
  board: { parent_id: number | null } | null,
): board is { parent_id: number; name: string; id: number; parent_name: string | null } {
  return board != null && board.parent_id != null;
}

export async function getThreads(
  db: D1Database,
  boardId: number,
): Promise<ThreadRow[]> {
  const { results } = await db
    .prepare(
      `SELECT
        t.id, t.title, t.created_at, t.last_post_at, t.reply_count,
        (SELECT p.author FROM posts p WHERE p.thread_id = t.id ORDER BY p.created_at ASC LIMIT 1) AS author
      FROM threads t
      WHERE t.board_id = ?
      ORDER BY t.last_post_at DESC
      LIMIT 100`,
    )
    .bind(boardId)
    .all<ThreadRow>();
  return results ?? [];
}

export async function getThread(
  db: D1Database,
  id: number,
): Promise<{ id: number; board_id: number; title: string } | null> {
  return db
    .prepare("SELECT id, board_id, title FROM threads WHERE id = ?")
    .bind(id)
    .first<{ id: number; board_id: number; title: string }>();
}

export async function getPosts(
  db: D1Database,
  threadId: number,
): Promise<PostRow[]> {
  const { results } = await db
    .prepare(
      "SELECT id, parent_id, author, body, created_at FROM posts WHERE thread_id = ? ORDER BY created_at ASC, id ASC",
    )
    .bind(threadId)
    .all<PostRow>();
  return results ?? [];
}

export async function getPostInThread(
  db: D1Database,
  threadId: number,
  postId: number,
): Promise<{ id: number; parent_id: number | null } | null> {
  return db
    .prepare(
      "SELECT id, parent_id FROM posts WHERE id = ? AND thread_id = ?",
    )
    .bind(postId, threadId)
    .first<{ id: number; parent_id: number | null }>();
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
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const cleanTitle = title.trim().slice(0, 120);
  const cleanBody = body.trim().slice(0, 10000);

  const thread = await db
    .prepare(
      "INSERT INTO threads (board_id, title, created_at, last_post_at, reply_count) VALUES (?, ?, ?, ?, 0) RETURNING id",
    )
    .bind(boardId, cleanTitle, now, now)
    .first<{ id: number }>();

  if (!thread) throw new Error("Failed to create thread");

  await db
    .prepare(
      "INSERT INTO posts (thread_id, parent_id, user_id, author, body, created_at) VALUES (?, NULL, ?, ?, ?, ?)",
    )
    .bind(thread.id, userId, author, cleanBody, now)
    .run();

  await awardActivity(db, userId, "new_thread");

  return thread.id;
}

export async function createReply(
  db: D1Database,
  threadId: number,
  userId: number,
  author: string,
  body: string,
  parentId: number,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const cleanBody = body.trim().slice(0, 10000);

  const inserted = await db
    .prepare(
      "INSERT INTO posts (thread_id, parent_id, user_id, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
    )
    .bind(threadId, parentId, userId, author, cleanBody, now)
    .first<{ id: number }>();

  if (!inserted) throw new Error("Failed to create reply");

  await db
    .prepare(
      "UPDATE threads SET last_post_at = ?, reply_count = reply_count + 1 WHERE id = ?",
    )
    .bind(now, threadId)
    .run();

  await awardActivity(db, userId, "reply");
  return inserted.id;
}
