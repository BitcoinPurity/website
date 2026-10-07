import test from "node:test";
import assert from "node:assert/strict";
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

const { initializeDatabase, ensureSchema, seedBoardsIfEmpty, getAuthorProfiles } = await import("../src/db.ts");
const { default: app } = await import("../src/index.ts");

function d1(sqlite) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      let values = [];
      const statement = {
        sql,
        bind(...args) { values = args; return statement; },
        async first() { calls.push([sql]); return sqlite.prepare(sql).get(...values) ?? null; },
        async all() { calls.push([sql]); return { results: sqlite.prepare(sql).all(...values) }; },
        async run() { calls.push([sql]); return statement.execute(); },
        execute() {
          if (/^\s*SELECT|RETURNING/i.test(sql)) return { results: sqlite.prepare(sql).all(...values) };
          const result = sqlite.prepare(sql).run(...values);
          return { meta: { changes: Number(result.changes) } };
        },
      };
      return statement;
    },
    async batch(statements) {
      calls.push(statements.map((statement) => statement.sql));
      sqlite.exec("BEGIN");
      try {
        const results = statements.map((statement) => statement.execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

async function fixture(t, authorCount = 2) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const db = d1(sqlite);
  await ensureSchema(db);
  await seedBoardsIfEmpty(db);
  sqlite.exec("INSERT INTO threads(id,board_id,title,created_at,last_post_at) VALUES(1,11,'Performance topic',1,1)");
  for (let id = 1; id <= authorCount; id++) {
    sqlite.prepare("INSERT INTO users(id,username,password_hash,points,created_at) VALUES(?,?,'unused',60,1)").run(id, `author-${id}`);
    sqlite.prepare("INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES(?,1,?,?,?,'Visible message',?)").run(id, id === 1 ? null : 1, id, `author-${id}`, id);
  }
  sqlite.exec("INSERT INTO sessions(token,user_id,expires_at) VALUES('reader',1,9999999999)");
  return { sqlite, db };
}

test("completed initialization takes one read across fresh database bindings and preserves moderator changes", async (t) => {
  const { sqlite, db } = await fixture(t);
  await initializeDatabase(db);
  sqlite.exec("UPDATE boards SET name='Renamed announcement',parent_id=2,is_archived=1 WHERE name='Announcement'");
  const before = sqlite.prepare("SELECT * FROM boards ORDER BY id").all();
  const freshBinding = d1(sqlite);
  await initializeDatabase(freshBinding);
  assert.equal(freshBinding.calls.length, 1);
  assert.match(freshBinding.calls[0][0], /^SELECT/);
  assert.deepEqual(sqlite.prepare("SELECT * FROM boards ORDER BY id").all(), before);
});

test("new database initialization retries an incomplete upgrade and propagates unrelated database errors", async (t) => {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const db = d1(sqlite);
  const batch = db.batch;
  db.batch = async (statements) => {
    if (statements.some((s) => s.sql.includes("INSERT INTO boards (id, parent_id"))) throw new Error("seed interrupted");
    return batch(statements);
  };
  await assert.rejects(() => initializeDatabase(db), /seed interrupted/);
  db.batch = batch;
  await initializeDatabase(db);
  assert.ok(sqlite.prepare("SELECT COUNT(*) n FROM boards").get().n > 0);
  db.calls.length = 0;
  await initializeDatabase(db);
  assert.equal(db.calls.length, 1);
  const prepare = db.prepare;
  db.prepare = (sql) => {
    const statement = prepare(sql);
    statement.first = async () => { throw new Error("database unavailable"); };
    return statement;
  };
  await assert.rejects(() => initializeDatabase(db), /database unavailable/);
});

test("author profiles use one database batch and preserve visible counts, levels and historical badges", async (t) => {
  const { sqlite, db } = await fixture(t);
  sqlite.exec(`
    INSERT INTO threads(id,board_id,title,created_at,last_post_at,is_deleted) VALUES
      (2,11,'Deleted topic',10,10,1), (3,21,'Archived board topic',10,10,0);
    INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at,is_deleted) VALUES
      (3,1,1,2,'author-2','Deleted reply',3,1),
      (4,2,NULL,1,'author-1','Deleted topic content',10,0),
      (5,3,NULL,1,'author-1','Archived board content',10,0);
    UPDATE boards SET is_archived=1 WHERE id=21;
    INSERT INTO user_badges(user_id,badge_id,earned_at) VALUES
      (1,'first_thread',20), (1,'registered',10), (2,'registered',11);
  `);
  db.calls.length = 0;
  const profiles = await getAuthorProfiles(db, ["AUTHOR-1", "author-1", "author-2", "missing"]);
  assert.equal(db.calls.length, 1, "author count must not add database round trips");
  assert.equal(db.calls[0].length, 2);
  assert.equal(profiles.size, 2);
  const first = profiles.get("author-1");
  assert.equal(first.username, "author-1");
  assert.equal(first.points, 60);
  assert.equal(first.level, "Member");
  assert.equal(first.post_count, 1);
  assert.equal(first.thread_count, 1);
  assert.deepEqual(first.badges.map((b) => [b.id, b.earned_at]), [["registered", 10], ["first_thread", 20]]);
  assert.equal(profiles.get("author-2").post_count, 1);
  assert.equal(profiles.get("author-2").thread_count, 0);
  assert.equal(profiles.get("author-2").badges.length, 1);
  db.calls.length = 0;
  assert.equal((await getAuthorProfiles(db, [])).size, 0);
  assert.equal(db.calls.length, 0);
});

test("thread request round trips stay bounded with 120 authors and account reading progress remains isolated", async (t) => {
  const { sqlite, db } = await fixture(t, 120);
  const warmed = await app.request("https://bbs.example/login", {}, { DB: db });
  assert.equal(warmed.status, 200);
  for (const signedIn of [false, true]) {
    const freshBinding = d1(sqlite);
    const response = await app.request("https://bbs.example/thread/1", {
      headers: signedIn ? { cookie: "bbs_session=reader" } : {},
    }, { DB: freshBinding });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const html = await response.text();
    assert.match(html, /author-1/);
    assert.match(html, /author-120/);
    assert.ok(freshBinding.calls.length <= (signedIn ? 7 : 5), `too many database round trips: ${freshBinding.calls.length}`);
    assert.ok(freshBinding.calls.flat().every((sql) => !/^\s*(CREATE|ALTER|PRAGMA|UPDATE posts|INSERT INTO boards)/i.test(sql)));
    assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM thread_reads").get().n, signedIn ? 1 : 0);
  }
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads WHERE user_id=1 AND thread_id=1").get().last_read_post_id, 120);
});

test("Server-Timing reports thread phases without exposing account data or adding database calls", async (t) => {
  const { db } = await fixture(t);
  await initializeDatabase(db);
  for (const signedIn of [false, true]) {
    db.calls.length = 0;
    const response = await app.request("https://bbs.example/thread/1", {
      headers: signedIn ? { cookie: "bbs_session=reader" } : {},
    }, { DB: db });
    assert.equal(response.status, 200);
    const timing = response.headers.get("server-timing");
    assert.ok(timing);
    const phases = ["init", "session", "thread", "board", "posts", "authors", "total"];
    if (signedIn) phases.push("read");
    for (const phase of phases) assert.match(timing, new RegExp(`(?:^|,)${phase};dur=\\d+(?:\\.\\d+)?(?:;|,|$)`));
    assert.doesNotMatch(timing, /author-1|author-2|bbs_session|reader|SELECT|Visible message/);
    if (!signedIn) assert.doesNotMatch(timing, /(?:^|,)read;/);
    assert.equal(db.calls.length, signedIn ? 7 : 5);
    assert.equal(response.headers.get("timing-allow-origin"), null);
  }
  for (const path of ["/login", "/thread/999"]) {
    const response = await app.request(`https://bbs.example${path}`, {}, { DB: db });
    assert.equal(response.status, path === "/login" ? 200 : 404);
    assert.match(response.headers.get("server-timing"), /(?:^|,)init;dur=/);
    assert.match(response.headers.get("server-timing"), /(?:^|,)total;dur=/);
  }
});
