import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { DatabaseSync } from "node:sqlite";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes("/bbs/src/") && specifier.startsWith("./")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const { ensureSchema, seedBoardsIfEmpty, getBoardIndex, getBoard, getCategory, markThreadRead } =
  await import("../src/db.ts");
const { default: app } = await import("../src/index.ts");
const { boardIndexPage, threadListPage } = await import("../src/html.ts");
const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const seed = readFileSync(new URL("../seed.sql", import.meta.url), "utf8");

function d1(sqlite) {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) {
          values = args;
          return statement;
        },
        async first() {
          return sqlite.prepare(sql).get(...values) ?? null;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...values) };
        },
        async run() {
          if (/^\s*SELECT|RETURNING/i.test(sql)) {
            const results = sqlite.prepare(sql).all(...values);
            return { results, meta: { changes: results.length } };
          }
          const result = sqlite.prepare(sql).run(...values);
          return { meta: { changes: Number(result.changes) } };
        },
      };
      return statement;
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  };
}

test("new BBS databases show Announcement first and expose its existing topic flow", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    const db = d1(sqlite);
    await ensureSchema(db);
    await seedBoardsIfEmpty(db);
    await ensureSchema(db);
    await seedBoardsIfEmpty(db);
    const sections = await getBoardIndex(db);
    const category = sections.find((section) => section.name === "Bitcoin Purity");
    assert.equal(category.slug, "bitcoin-purity");
    assert.equal(category.boards[0].name, "Announcement");
    assert.equal(category.boards.filter((board) => board.name === "Announcement").length, 1);
    const board = category.boards[0];
    assert.match(board.description, /Official announcements/);
    assert.ok(boardIndexPage(sections, null).includes(`href="/board/${board.slug}">Announcement`));
    const detail = await getBoard(db, board.id);
    assert.equal(detail.parent_id, category.id);
    const user = { id: 1, email: null, username: "publisher", points: 0, level: "Newbie" };
    assert.ok(threadListPage(detail, [], user).includes(`href="/board/${board.slug}/new"`));
  } finally {
    sqlite.close();
  }
});

test("category slug migration preserves existing board slugs, content and reading progress", async (t) => {
  const { sqlite, db } = await readingFixture(t);
  sqlite.exec("UPDATE boards SET slug=NULL WHERE parent_id IS NULL");
  sqlite.exec(`INSERT INTO boards(id,parent_id,name,description,sort_order) VALUES
    (60,NULL,'General Discussion','Duplicate',5), (61,NULL,'中文分类','Unicode',6)`);
  const boards = sqlite.prepare("SELECT * FROM boards WHERE parent_id IS NOT NULL ORDER BY id").all();
  const threads = sqlite.prepare("SELECT * FROM threads").all();
  const posts = sqlite.prepare("SELECT * FROM posts").all();
  await markThreadRead(db, 1, 1, 10);
  await ensureSchema(db);
  assert.equal((await getCategory(db, "bitcoin-purity")).id, 1);
  assert.equal((await getCategory(db, "general-discussion-2")).id, 60);
  assert.equal(await getCategory(db, "general-discussion"), null);
  const slugs = sqlite.prepare("SELECT id,slug FROM boards ORDER BY id").all();
  sqlite.exec("UPDATE boards SET name='Renamed category' WHERE id=1");
  await ensureSchema(db);
  assert.deepEqual(sqlite.prepare("SELECT id,slug FROM boards ORDER BY id").all(), slugs);
  assert.deepEqual(sqlite.prepare("SELECT * FROM boards WHERE parent_id IS NOT NULL ORDER BY id").all(), boards);
  assert.deepEqual(sqlite.prepare("SELECT * FROM threads").all(), threads);
  assert.deepEqual(sqlite.prepare("SELECT * FROM posts").all(), posts);
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads WHERE user_id=1 AND thread_id=1").get().last_read_post_id, 10);
  const encoded = encodeURIComponent("中文分类");
  assert.equal((await app.request(`https://bbs.example/category/${encoded}`, {}, { DB: db })).status, 200);
  const legacy = await app.request("https://bbs.example/category/61?q=1", {}, { DB: db });
  assert.equal(legacy.status, 301);
  assert.equal(legacy.headers.get("Location"), `/category/${encoded}?q=1`);
});

test("category links use slugs while thread links and replies retain IDs", async (t) => {
  const { db, request } = await readingFixture(t);
  for (const path of ["/", "/board/general-discussion", "/thread/1", "/thread/1?reply_to=10", "/board/general-discussion/new"]) {
    const html = await request(path);
    assert.match(html, /href="\/category\/bitcoin-purity"/);
    assert.doesNotMatch(html, /href="\/category\/\d/);
    if (path === "/" || path === "/board/general-discussion") assert.match(html, /href="\/thread\/1"/);
    if (path === "/thread/1?reply_to=10") assert.match(html, /action="\/thread\/1\/reply"/);
  }
  const response = await app.request("https://bbs.example/category/1?page=2", {}, { DB: db });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("Location"), "/category/bitcoin-purity?page=2");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  const alias = await app.request("https://bbs.example/board/1?page=2", {}, { DB: db });
  assert.equal(alias.headers.get("Location"), "/category/bitcoin-purity?page=2");
  for (const path of ["/category/missing", "/category/general-discussion"]) {
    assert.equal((await app.request(`https://bbs.example${path}`, {}, { DB: db })).status, 404);
  }
});

test("board slugs migrate existing content once and remain unique and stable", async (t) => {
  const { sqlite, db } = await readingFixture(t);
  sqlite.exec("DROP INDEX IF EXISTS idx_boards_slug; ALTER TABLE boards DROP COLUMN slug");
  sqlite.exec(`INSERT INTO boards(id,parent_id,name,description,sort_order) VALUES
    (49,4,'Memes','Images',3), (50,4,'Memes','More images',4),
    (51,4,'Memes-2','Existing suffix',5), (52,4,'123','Numeric',6),
    (53,4,'中文讨论','Unicode',7), (54,4,'!!!','Symbols',8)`);
  const threads = sqlite.prepare("SELECT * FROM threads").all();
  const posts = sqlite.prepare("SELECT * FROM posts").all();
  await markThreadRead(db, 1, 1, 10);
  await ensureSchema(db);
  const slugs = sqlite.prepare("SELECT id,slug FROM boards WHERE parent_id IS NOT NULL ORDER BY id").all();
  assert.equal(sqlite.prepare("SELECT slug FROM boards WHERE id=49").get().slug, "memes");
  assert.equal(sqlite.prepare("SELECT slug FROM boards WHERE id=52").get().slug, "board-123");
  assert.equal(sqlite.prepare("SELECT slug FROM boards WHERE id=53").get().slug, "中文讨论");
  assert.ok(slugs.every((b) => b.slug));
  assert.equal(new Set(slugs.map((b) => b.slug)).size, slugs.length);
  sqlite.exec("UPDATE boards SET name='Funny pictures',parent_id=1 WHERE id=49");
  await ensureSchema(db);
  assert.deepEqual(sqlite.prepare("SELECT id,slug FROM boards WHERE parent_id IS NOT NULL ORDER BY id").all(), slugs);
  assert.deepEqual(sqlite.prepare("SELECT * FROM threads").all(), threads);
  assert.deepEqual(sqlite.prepare("SELECT * FROM posts").all(), posts);
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads WHERE user_id=1 AND thread_id=1").get().last_read_post_id, 10);
  assert.throws(() => sqlite.exec("UPDATE boards SET slug='memes' WHERE id=50"), /UNIQUE/);
  const encoded = encodeURIComponent("中文讨论");
  const response = await app.request(`https://bbs.example/board/${encoded}`, {}, { DB: db });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /中文讨论/);
  const redirect = await app.request("https://bbs.example/board/53", {}, { DB: db });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("Location"), `/board/${encoded}`);
});

test("slug URLs render board links, posting forms and topic breadcrumbs", async (t) => {
  const { db, request } = await readingFixture(t);
  for (const path of ["/", "/category/bitcoin-purity", "/thread/1", "/board/general-discussion/new"]) {
    const html = await request(path);
    assert.match(html, /href="\/board\/general-discussion"/);
    assert.doesNotMatch(html, /(?:href|action)="\/board\/\d/);
    if (path.endsWith("/new")) assert.match(html, /action="\/board\/general-discussion\/new"/);
  }
  assert.match(await request("/board/general-discussion"), /href="\/board\/general-discussion\/new"/);
  const guest = await app.request("https://bbs.example/board/general-discussion/new", {}, { DB: db });
  assert.equal(guest.status, 303);
  assert.equal(guest.headers.get("Location"), "/login?next=%2Fboard%2Fgeneral-discussion%2Fnew");
  for (const suffix of ["", "/new"]) {
    const missing = await app.request(`https://bbs.example/board/missing${suffix}`, {}, { DB: db });
    assert.equal(missing.status, 404);
  }
});

test("legacy GET URLs redirect with queries and legacy POST still creates a topic", async (t) => {
  const { sqlite, db } = await readingFixture(t);
  for (const suffix of ["", "/new"]) {
    const response = await app.request(`https://bbs.example/board/11${suffix}?page=2`, {}, { DB: db });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("Location"), `/board/general-discussion${suffix}?page=2`);
  }
  for (const boardPath of ["general-discussion", "11"]) {
    const response = await app.request(`https://bbs.example/board/${boardPath}/new`, {
      method: "POST", headers: { cookie: "bbs_session=test-reader" },
      body: new URLSearchParams({ title: `From ${boardPath}`, body: "New opening message" }),
    }, { DB: db });
    assert.equal(response.status, 303);
    const thread = sqlite.prepare("SELECT id,board_id FROM threads WHERE title=?").get(`From ${boardPath}`);
    assert.equal(thread.board_id, 11);
    assert.equal(response.headers.get("Location"), `/thread/${thread.id}`);
  }
  sqlite.exec("UPDATE boards SET is_archived=1 WHERE id=11");
  for (const boardPath of ["general-discussion", "11"]) {
    for (const suffix of ["", "/new"]) {
      assert.equal((await app.request(`https://bbs.example/board/${boardPath}${suffix}`, {}, { DB: db })).status, 404);
    }
  }
});

test("existing BBS databases gain one Announcement without changing boards or topics", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(schema);
    sqlite.exec(seed);
    sqlite.exec("DELETE FROM boards WHERE name = 'Announcement'; DELETE FROM bbs_migrations");
    sqlite.exec("BEGIN; PRAGMA defer_foreign_keys = ON; UPDATE boards SET id = 101 WHERE id = 1; UPDATE boards SET parent_id = 101 WHERE parent_id = 1; COMMIT");
    sqlite.exec("INSERT INTO threads (id, board_id, title, created_at, last_post_at) VALUES (1, 11, 'Existing topic', 1, 1)");
    sqlite.exec("INSERT INTO posts (id, thread_id, author, body, created_at) VALUES (1, 1, 'guest', 'Existing post', 1)");
    const before = sqlite.prepare("SELECT * FROM boards ORDER BY id").all();
    const topics = sqlite.prepare("SELECT * FROM threads").all();
    const posts = sqlite.prepare("SELECT * FROM posts").all();
    const db = d1(sqlite);
    await ensureSchema(db);
    await seedBoardsIfEmpty(db);
    await ensureSchema(db);
    await seedBoardsIfEmpty(db);
    const announcements = sqlite.prepare("SELECT * FROM boards WHERE name = 'Announcement'").all();
    assert.equal(announcements.length, 1);
    assert.equal(announcements[0].parent_id, 101);
    assert.deepEqual(sqlite.prepare("SELECT * FROM boards WHERE name != 'Announcement' ORDER BY id").all(), before);
    assert.deepEqual(sqlite.prepare("SELECT * FROM threads").all(), topics);
    assert.deepEqual(sqlite.prepare("SELECT * FROM posts").all(), posts);
  } finally {
    sqlite.close();
  }
});

test("SQL seeding adds Announcement once and preserves subsequent administrator changes", () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(schema);
    sqlite.exec(seed);
    sqlite.exec(seed);
    let announcements = sqlite.prepare("SELECT * FROM boards WHERE name = 'Announcement'").all();
    assert.equal(announcements.length, 1);
    assert.equal(announcements[0].parent_id, 1);
    assert.equal(announcements[0].sort_order, 0);
    sqlite.exec("UPDATE boards SET name = 'Renamed announcement', parent_id=2, sort_order=8 WHERE name = 'Announcement'");
    sqlite.exec(seed);
    announcements = sqlite.prepare("SELECT * FROM boards WHERE name = 'Announcement'").all();
    assert.equal(announcements.length, 0);
    assert.equal(sqlite.prepare("SELECT parent_id FROM boards WHERE name = 'Renamed announcement'").get().parent_id, 2);
  } finally {
    sqlite.close();
  }
});

test("legacy flat boards gain Announcement under the migrated Bitcoin Purity category", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(schema);
    sqlite.exec("DROP TABLE boards; CREATE TABLE boards (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)");
    sqlite.exec("INSERT INTO boards (id, name, description, sort_order) VALUES (1, 'Bitcoin Purity Discussion', 'Discussion', 1), (2, 'Mining', 'Mining', 2), (3, 'Development', 'Development', 3), (4, 'Meta', 'Meta', 99)");
    sqlite.exec("INSERT INTO threads (id, board_id, title, created_at, last_post_at) VALUES (1, 1, 'Legacy topic', 1, 1)");
    const db = d1(sqlite);
    await ensureSchema(db);
    await seedBoardsIfEmpty(db);
    await ensureSchema(db);
    const category = (await getBoardIndex(db)).find((section) => section.name === "Bitcoin Purity");
    assert.notEqual(category.id, 1);
    assert.equal(category.slug, "bitcoin-purity");
    assert.equal(category.boards[0].name, "Announcement");
    assert.equal(category.boards.filter((board) => board.name === "Announcement").length, 1);
    assert.equal(sqlite.prepare("SELECT board_id FROM threads WHERE id = 1").get().board_id, 1);
  } finally {
    sqlite.close();
  }
});

async function readingFixture(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec(schema);
  sqlite.exec(seed);
  sqlite.exec(`
    INSERT INTO users (id, username, password_hash, points, created_at) VALUES
      (1, 'reader', 'unused', 10, 1),
      (2, 'other', 'unused', 10, 1),
      (3, 'writer', 'unused', 10, 1);
    INSERT INTO threads (id, board_id, title, created_at, last_post_at, reply_count) VALUES
      (1, 11, 'First topic', 100, 100, 0),
      (2, 11, 'Second topic', 100, 100, 1),
      (3, 21, 'Mining topic', 100, 100, 0);
    INSERT INTO posts (id, thread_id, parent_id, user_id, author, body, created_at) VALUES
      (10, 1, NULL, 3, 'writer', 'Opening post', 100),
      (20, 2, NULL, 3, 'writer', 'Opening post', 100),
      (21, 2, 20, 3, 'writer', 'Reply', 100),
      (30, 3, NULL, 3, 'writer', 'Mining post', 100);
  `);
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  sqlite.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run("test-reader", 1, expiry);
  sqlite.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run("test-other", 2, expiry);
  const db = d1(sqlite);
  await ensureSchema(db);
  return {
    sqlite,
    db,
    async request(path, username = "reader") {
      const headers = username ? { cookie: `bbs_session=test-${username}` } : {};
      const response = await app.request(`https://bbs.example${path}`, { headers }, { DB: db });
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("Cache-Control"), "private, no-store", path);
      return response.text();
    },
  };
}

test("new topics are counted once per unread thread across home, category and board pages", async (t) => {
  const { sqlite, db, request } = await readingFixture(t);
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 2);
  assert.equal((await getCategory(db, 1, 1)).boards.find((b) => b.id === 11).new_topic_count, 2);
  assert.equal((await getBoardIndex(db, 1))[0].boards.find((b) => b.id === 11).new_topic_count, 2);
  assert.match(await request("/"), /General Discussion<\/a>[^]*?2 new topics/);
  assert.match(await request("/category/bitcoin-purity"), /General Discussion<\/a>[^]*?2 new topics/);
  assert.match(await request("/board/general-discussion"), /General Discussion[^]*?2 new topics/);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM thread_reads").get().n, 0);

  await request("/thread/1");
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 1);
  assert.equal((await getBoard(db, 21, 1)).new_topic_count, 1);
  assert.equal((await getBoard(db, 11, 2)).new_topic_count, 2);
  await request("/thread/2");
  for (const path of ["/", "/category/bitcoin-purity", "/board/general-discussion"]) {
    assert.ok(!(await request(path)).includes("0 new topics"), `${path}: zero unread count`);
  }

  sqlite.exec(`INSERT INTO posts (id, thread_id, parent_id, user_id, author, body, created_at) VALUES
    (40, 1, 10, 3, 'writer', 'Same-second reply', 100),
    (41, 1, 10, 3, 'writer', 'Another reply', 100)`);
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 1);
  assert.match(await request("/"), /General Discussion<\/a>[^]*?1 new topic<\/span>/);
  await request("/thread/1");
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 0);
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads WHERE user_id = 1 AND thread_id = 1").get().last_read_post_id, 41);
});

test("a reply arriving after posts are fetched stays unread and older reads cannot move progress back", async (t) => {
  const { sqlite, db, request } = await readingFixture(t);
  await request("/thread/1");
  await request("/thread/2");
  const prepare = db.prepare;
  let injected = false;
  db.prepare = (sql) => {
    const statement = prepare(sql);
    if (sql.includes("AS body, created_at, is_deleted FROM posts WHERE thread_id")) {
      const all = statement.all;
      statement.all = async () => {
        const result = await all();
        if (!injected) {
          sqlite.exec("INSERT INTO posts (id, thread_id, parent_id, user_id, author, body, created_at) VALUES (40, 1, 10, 3, 'writer', 'Arrived during reading', 100)");
          injected = true;
        }
        return result;
      };
    }
    return statement;
  };
  const html = await request("/thread/1");
  assert.ok(!html.includes("Arrived during reading"));
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 1);
  await request("/thread/1");
  await markThreadRead(db, 1, 1, 10);
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 0);
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads WHERE user_id = 1 AND thread_id = 1").get().last_read_post_id, 40);
});

test("board counts include unread topics beyond the first 100 displayed threads", async (t) => {
  const { sqlite, db, request } = await readingFixture(t);
  for (let i = 0; i < 120; i++) {
    sqlite.prepare("INSERT INTO threads (id, board_id, title, created_at, last_post_at) VALUES (?, 11, 'Extra topic', 200, 200)").run(100 + i);
    sqlite.prepare("INSERT INTO posts (thread_id, user_id, author, body, created_at) VALUES (?, 3, 'writer', 'Extra post', 200)").run(100 + i);
  }
  assert.equal((await getBoard(db, 11, 1)).new_topic_count, 122);
  assert.match(await request("/board/general-discussion"), /122 new topics/);
});

test("guests get a login hint and never change another account's reading progress", async (t) => {
  const { sqlite, request } = await readingFixture(t);
  for (const path of ["/", "/category/bitcoin-purity", "/board/general-discussion"]) {
    const html = await request(path, null);
    assert.ok(html.includes("Login"));
    assert.ok(html.includes("track new topics"));
    assert.doesNotMatch(html, /\d+ new topics?<\/span>/);
  }
  await request("/thread/1", null);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM thread_reads").get().n, 0);
});

test("runtime migration adds reading records to an existing database without changing content", async (t) => {
  const { sqlite, db } = await readingFixture(t);
  const topics = sqlite.prepare("SELECT * FROM threads ORDER BY id").all();
  const posts = sqlite.prepare("SELECT * FROM posts ORDER BY id").all();
  sqlite.exec("DROP TABLE IF EXISTS thread_reads");
  await ensureSchema(db);
  await ensureSchema(db);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM thread_reads").get().n, 0);
  assert.deepEqual(sqlite.prepare("SELECT * FROM threads ORDER BY id").all(), topics);
  assert.deepEqual(sqlite.prepare("SELECT * FROM posts ORDER BY id").all(), posts);
});

test("BBS page heads link independent same-origin forum icons", async (t) => {
  const { db } = await readingFixture(t);
  for (const path of ["/", "/category/bitcoin-purity", "/board/general-discussion", "/thread/1", "/login", "/register", "/reset-password", "/user/reader", "/board/999999"]) {
    const response = await app.request(`https://bbs.example${path}`, {}, { DB: db });
    assert.equal(response.status, path === "/board/999999" ? 404 : 200, path);
    const html = await response.text();
    const head = html.slice(0, html.indexOf("</head>"));
    for (const [file, type, sizes] of [
      ["favicon.ico", "image/x-icon", "16x16 32x32"],
      ["favicon-32.png", "image/png", "32x32"],
      ["favicon-16.png", "image/png", "16x16"],
      ["favicon.svg", "image/svg+xml", "any"],
    ]) {
      assert.ok(
        head.includes(`<link rel="icon" href="/${file}" type="${type}" sizes="${sizes}">`),
        `${path}: ${file}`,
      );
    }
    assert.doesNotMatch(head, /https:\/\/bitcoinpurity\.org\/favicon/);
  }
});
