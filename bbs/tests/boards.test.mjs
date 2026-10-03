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

const { ensureSchema, seedBoardsIfEmpty, getBoardIndex, getBoard } =
  await import("../src/db.ts");
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
          return sqlite.prepare(sql).run(...values);
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
    assert.equal(category.boards[0].name, "Announcement");
    assert.equal(category.boards.filter((board) => board.name === "Announcement").length, 1);
    const board = category.boards[0];
    assert.match(board.description, /Official announcements/);
    assert.ok(boardIndexPage(sections, null).includes(`href="/board/${board.id}">Announcement`));
    const detail = await getBoard(db, board.id);
    assert.equal(detail.parent_id, category.id);
    const user = { id: 1, email: null, username: "publisher", points: 0, level: "Newbie" };
    assert.ok(threadListPage(detail, [], user).includes(`href="/board/${board.id}/new"`));
  } finally {
    sqlite.close();
  }
});

test("existing BBS databases gain one Announcement without changing boards or topics", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(schema);
    sqlite.exec(seed);
    sqlite.exec("DELETE FROM boards WHERE name = 'Announcement'");
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

test("SQL seeding adds Announcement once on fresh and already seeded databases", () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(schema);
    sqlite.exec(seed);
    sqlite.exec(seed);
    let announcements = sqlite.prepare("SELECT * FROM boards WHERE name = 'Announcement'").all();
    assert.equal(announcements.length, 1);
    assert.equal(announcements[0].parent_id, 1);
    assert.equal(announcements[0].sort_order, 0);
    sqlite.exec("DELETE FROM boards WHERE name = 'Announcement'");
    sqlite.exec(seed);
    announcements = sqlite.prepare("SELECT * FROM boards WHERE name = 'Announcement'").all();
    assert.equal(announcements.length, 1);
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
    assert.equal(category.boards[0].name, "Announcement");
    assert.equal(category.boards.filter((board) => board.name === "Announcement").length, 1);
    assert.equal(sqlite.prepare("SELECT board_id FROM threads WHERE id = 1").get().board_id, 1);
  } finally {
    sqlite.close();
  }
});
