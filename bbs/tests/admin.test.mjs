import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { DatabaseSync } from "node:sqlite";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes("/bbs/src/") && specifier.startsWith("./")) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { default: app } = await import("../src/index.ts");
const { ensureSchema, seedBoardsIfEmpty, getBoard, getThreads } = await import("../src/db.ts");
const { hashPassword } = await import("../src/auth.ts");

function d1(sqlite) {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() { return sqlite.prepare(sql).get(...values) ?? null; },
        async all() { return { results: sqlite.prepare(sql).all(...values) }; },
        run() {
          if (/RETURNING/i.test(sql)) {
            const results = sqlite.prepare(sql).all(...values);
            return { success: true, results, meta: { changes: results.length } };
          }
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
      };
      return statement;
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const result = [];
        for (const statement of statements) result.push(statement.run());
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

async function fixture(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const db = d1(sqlite);
  await ensureSchema(db);
  await seedBoardsIfEmpty(db);
  sqlite.exec(`
    INSERT INTO users (id, username, password_hash, points, role, created_at) VALUES
      (1, 'admin', 'unused', 10, 'admin', 1), (2, 'member', 'unused', 10, 'user', 1),
      (3, 'second-admin', 'unused', 10, 'admin', 1);
    INSERT INTO sessions (token, user_id, expires_at) VALUES
      ('admin-session', 1, 9999999999), ('member-session', 2, 9999999999), ('second-session', 3, 9999999999);
    INSERT INTO threads (id, board_id, title, created_at, last_post_at, reply_count) VALUES
      (1, 11, 'Original topic', 100, 300, 2), (2, 11, 'Recent topic', 400, 400, 0);
    INSERT INTO posts (id, thread_id, parent_id, user_id, author, body, created_at) VALUES
      (10, 1, NULL, 2, 'member', 'Opening message', 100),
      (11, 1, 10, 2, 'member', 'SECRET REMOVED BODY', 200),
      (12, 1, 11, 2, 'member', 'Nested reply', 300),
      (20, 2, NULL, 2, 'member', 'Recent message', 400);
    INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (2, 'registered', 1);
  `);
  const request = (path, token = "admin-session", init = {}) => app.request(`https://bbs.example${path}`, {
    ...init, headers: { ...(token ? { cookie: `bbs_session=${token}` } : {}), ...init.headers },
  }, { DB: db });
  const csrf = async (token = "admin-session") => {
    const response = await request("/admin/users", token);
    assert.equal(response.status, 200);
    const html = await response.text();
    const value = html.match(/name="csrf_token" value="([^"]+)"/)?.[1];
    assert.ok(value, "admin forms include CSRF token");
    return value;
  };
  const post = async (path, values = {}, token = "admin-session") => request(path, token, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrf_token: await csrf(token), ...values }),
  });
  return { sqlite, db, request, csrf, post };
}

test("admin pages enforce current roles, private caching and session-bound CSRF", async (t) => {
  const { sqlite, request, csrf, post } = await fixture(t);
  for (const path of ["/admin", "/admin/threads", "/admin/threads/1", "/admin/users", "/admin/boards"]) {
    const guest = await request(path, null);
    assert.equal(guest.status, 303);
    assert.equal(guest.headers.get("location"), `/login?next=${encodeURIComponent(path)}`);
    assert.equal((await request(path, "member-session")).status, 403);
    const admin = await request(path);
    assert.equal(admin.status, 200);
    assert.equal(admin.headers.get("cache-control"), "private, no-store");
    assert.match(await admin.text(), /<link rel="icon" href="\/favicon.svg" type="image\/svg\+xml" sizes="any">/);
  }
  assert.match(await (await request("/")).text(), /href="\/admin"/);
  assert.doesNotMatch(await (await request("/", "member-session")).text(), /href="\/admin"/);
  const attack = (body, headers = {}, token = "admin-session") => request("/admin/threads/1/delete", token, {
    method: "POST", body: new URLSearchParams(body), headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
  });
  assert.equal((await attack({})).status, 403);
  assert.equal((await attack({ csrf_token: "wrong" })).status, 403);
  assert.equal((await attack({ csrf_token: await csrf() }, { origin: "https://evil.example" })).status, 403);
  assert.equal((await attack({ csrf_token: await csrf("second-session") })).status, 403);
  assert.equal((await attack({ csrf_token: await csrf() }, {}, "member-session")).status, 403);
  assert.equal(sqlite.prepare("SELECT is_deleted FROM threads WHERE id=1").get().is_deleted, 0);
  assert.equal((await post("/admin/users/3/revoke-admin")).status, 303);
  assert.equal((await request("/admin", "second-session")).status, 403);
});

test("topic moderation hides content, pins, locks, moves and restores without new rewards", async (t) => {
  const { sqlite, db, request, post } = await fixture(t);
  assert.equal((await post("/admin/threads/1/pin")).status, 303);
  assert.deepEqual((await getThreads(db, 11)).map((r) => r.id), [1, 2]);
  assert.equal((await post("/admin/threads/1/lock")).status, 303);
  const html = await (await request("/thread/1")).text();
  assert.match(html, /locked/i);
  assert.doesNotMatch(html, /action="\/thread\/1\/reply"|reply_to=/);
  assert.equal((await request("/thread/1/reply", "member-session", { method: "POST", body: new URLSearchParams({ body: "blocked", parent_id: "10" }) })).status, 403);
  assert.equal((await post("/admin/threads/1/unlock")).status, 303);
  assert.equal((await post("/admin/threads/1/unpin")).status, 303);
  assert.equal((await post("/admin/threads/1/move", { board_id: "21" })).status, 303);
  assert.equal(sqlite.prepare("SELECT board_id FROM threads WHERE id=1").get().board_id, 21);
  assert.equal((await post("/admin/threads/1/move", { board_id: "1" })).status, 400);
  assert.equal((await post("/admin/threads/1/delete")).status, 303);
  assert.equal((await request("/thread/1")).status, 404);
  assert.equal((await request("/thread/1/reply", "member-session", { method: "POST" })).status, 404);
  assert.doesNotMatch(await (await request("/board/21")).text(), /Original topic/);
  assert.match(await (await request("/admin/threads/1")).text(), /SECRET REMOVED BODY/);
  assert.equal((await post("/admin/threads/1/restore")).status, 303);
  assert.equal((await request("/thread/1")).status, 200);
  assert.equal(sqlite.prepare("SELECT points FROM users WHERE id=2").get().points, 10);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM user_badges WHERE user_id=2").get().n, 1);
});

test("deleted replies preserve descendants, statistics and account reading progress", async (t) => {
  const { sqlite, db, request, post } = await fixture(t);
  await request("/thread/1", "member-session");
  sqlite.exec("INSERT INTO posts (id,thread_id,parent_id,user_id,author,body,created_at) VALUES (30,1,10,2,'member','NEW SECRET',500); UPDATE threads SET reply_count=3,last_post_at=500 WHERE id=1");
  assert.equal((await getBoard(db, 11, 2)).new_topic_count, 2);
  assert.equal((await post("/admin/posts/30/delete")).status, 303);
  assert.equal((await getBoard(db, 11, 2)).new_topic_count, 1);
  assert.equal((await post("/admin/posts/11/delete")).status, 303);
  const html = await (await request("/thread/1")).text();
  assert.doesNotMatch(html, /SECRET REMOVED BODY|NEW SECRET/);
  assert.match(html, /Post deleted/);
  assert.match(html, /Nested reply/);
  assert.equal(sqlite.prepare("SELECT reply_count,last_post_at FROM threads WHERE id=1").get().reply_count, 1);
  assert.equal(sqlite.prepare("SELECT last_post_at FROM threads WHERE id=1").get().last_post_at, 300);
  assert.equal((await post("/admin/posts/11/restore")).status, 303);
  assert.equal((await post("/admin/posts/30/restore")).status, 303);
  assert.equal(sqlite.prepare("SELECT reply_count FROM threads WHERE id=1").get().reply_count, 3);
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads WHERE user_id=2 AND thread_id=1").get().last_read_post_id, 12);
  assert.equal((await post("/admin/posts/10/delete")).status, 303);
  assert.equal((await request("/thread/1")).status, 404);
  assert.equal((await post("/admin/posts/10/restore")).status, 303);
  assert.equal((await request("/thread/1")).status, 200);
});

test("bans invalidate existing sessions, prevent login and allow guest reading and unban", async (t) => {
  const { sqlite, request, post } = await fixture(t);
  sqlite.prepare("UPDATE users SET password_hash=? WHERE id=2").run(await hashPassword("test-password"));
  assert.equal((await post("/admin/users/2/ban")).status, 303);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=2").get().n, 0);
  assert.equal((await request("/board/11/new", "member-session")).status, 303);
  assert.equal((await request("/thread/1", "member-session")).status, 200);
  const login = () => request("/login", null, { method: "POST", body: new URLSearchParams({ username: "member", password: "test-password" }) });
  assert.equal((await login()).status, 401);
  assert.equal((await post("/admin/users/2/unban")).status, 303);
  assert.equal((await login()).status, 303);
  assert.equal((await post("/admin/users/2/grant-admin")).status, 303);
  assert.equal((await post("/admin/users/2/ban")).status, 409);
  assert.equal((await post("/admin/users/1/ban")).status, 409);
  assert.equal((await post("/admin/users/1/revoke-admin")).status, 409);
});

test("concurrent administrators cannot revoke each other and leave zero admins", { timeout: 5000 }, async (t) => {
  const { sqlite, db, request, csrf } = await fixture(t);
  const first = await csrf();
  const second = await csrf("second-session");
  // Both requests reach the role-changing SQL before either is executed.
  const prepare = db.prepare;
  let waiting = 0;
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  db.prepare = (sql) => {
    const statement = prepare(sql);
    if (/UPDATE users SET role/.test(sql)) {
      const run = statement.run;
      statement.run = async () => {
        if (++waiting === 2) release();
        await barrier;
        return run();
      };
    }
    return statement;
  };
  const responses = await Promise.all([
    request("/admin/users/3/revoke-admin", "admin-session", { method: "POST", body: new URLSearchParams({ csrf_token: first }) }),
    request("/admin/users/1/revoke-admin", "second-session", { method: "POST", body: new URLSearchParams({ csrf_token: second }) }),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [303, 409]);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND is_banned=0").get().n, 1);
});

test("board management preserves two levels and independent archive states", async (t) => {
  const { sqlite, request, post } = await fixture(t);
  assert.equal((await post("/admin/boards", { name: "New category", description: "description", sort_order: "5", parent_id: "" })).status, 303);
  const category = sqlite.prepare("SELECT id FROM boards WHERE name='New category'").get().id;
  assert.equal((await post("/admin/boards", { name: "New board", description: "description", sort_order: "1", parent_id: String(category) })).status, 303);
  assert.equal((await post("/admin/boards", { name: "Bad child", description: "description", sort_order: "1", parent_id: "11" })).status, 400);
  assert.equal((await post("/admin/boards/11/update", { name: "Moved board", description: "updated", sort_order: "9", parent_id: String(category) })).status, 303);
  assert.equal((await post("/admin/boards/11/update", { name: "Invalid category", description: "updated", sort_order: "1", parent_id: "" })).status, 400);
  assert.equal((await post(`/admin/boards/${category}/archive`)).status, 303);
  for (const path of [`/category/${category}`, "/board/11", "/board/11/new", "/thread/1"]) assert.equal((await request(path)).status, 404, path);
  assert.equal((await request("/board/11/new", "member-session", { method: "POST" })).status, 404);
  assert.equal((await post("/admin/threads/2/move", { board_id: "11" })).status, 400);
  assert.equal((await post("/admin/boards/11/archive")).status, 303);
  assert.equal((await post(`/admin/boards/${category}/restore`)).status, 303);
  assert.equal((await request(`/category/${category}`)).status, 200);
  assert.equal((await request("/board/11")).status, 404);
  assert.equal((await post("/admin/boards/11/restore")).status, 303);
  assert.equal((await request("/thread/1")).status, 200);
});

test("admin lists paginate and preserve title, board, deletion and username filters", async (t) => {
  const { sqlite, request, post } = await fixture(t);
  for (let i = 100; i < 155; i++) sqlite.prepare("INSERT INTO threads(id,board_id,title,created_at,last_post_at) VALUES (?,11,?,1,1)").run(i, `Paged ${i}`);
  let html = await (await request("/admin/threads?q=Paged&board_id=11&status=active")).text();
  assert.equal((html.match(/href="\/admin\/threads\/\d+"/g) ?? []).length, 50);
  assert.match(html, /page=2/);
  html = await (await request("/admin/threads?q=Paged&board_id=11&status=active&page=2")).text();
  assert.equal((html.match(/href="\/admin\/threads\/\d+"/g) ?? []).length, 5);
  await post("/admin/threads/1/delete");
  html = await (await request("/admin/threads?q=Original&status=deleted")).text();
  assert.match(html, /Original topic/);
  assert.doesNotMatch(html, /Recent topic/);
  html = await (await request("/admin/users?q=second")).text();
  assert.match(html, /second-admin/);
  assert.doesNotMatch(html, /\/admin\/users\/2\//);
  for (const path of ["/admin/threads/999", "/admin/threads/invalid"]) assert.equal((await request(path)).status, path.endsWith("invalid") ? 400 : 404);
  assert.equal((await post("/admin/threads/1/unknown")).status, 400);
});

test("runtime migration preserves old data and defaults all existing users to ordinary accounts", async (t) => {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const oldSchema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8")
    .replace(/^.*(?:role TEXT|is_banned INTEGER|is_deleted INTEGER|is_locked INTEGER|is_pinned INTEGER|is_archived INTEGER|csrf_token TEXT).*\n/gm, "");
  sqlite.exec(oldSchema);
  sqlite.exec(readFileSync(new URL("../seed.sql", import.meta.url), "utf8"));
  sqlite.exec("INSERT INTO users (id,username,password_hash,points,created_at) VALUES(1,'old-user','hash',10,1); INSERT INTO threads(id,board_id,title,created_at,last_post_at) VALUES(1,11,'old-topic',1,1); INSERT INTO posts(id,thread_id,user_id,author,body,created_at) VALUES(1,1,1,'old-user','original',1); INSERT INTO thread_reads VALUES(1,1,1)");
  const db = d1(sqlite);
  await ensureSchema(db);
  await ensureSchema(db);
  assert.equal(sqlite.prepare("SELECT role FROM users").get().role, "user");
  assert.equal(sqlite.prepare("SELECT points FROM users").get().points, 10);
  assert.equal(sqlite.prepare("SELECT body,is_deleted FROM posts").get().body, "original");
  assert.equal(sqlite.prepare("SELECT is_deleted FROM posts").get().is_deleted, 0);
  assert.equal(sqlite.prepare("SELECT last_read_post_id FROM thread_reads").get().last_read_post_id, 1);
  sqlite.exec("UPDATE boards SET name='Renamed announcement',parent_id=2,sort_order=8 WHERE name='Announcement'");
  await ensureSchema(db);
  await seedBoardsIfEmpty(db);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM boards WHERE name='Announcement'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT parent_id FROM boards WHERE name='Renamed announcement'").get().parent_id, 2);
});

test("posting rechecks moderation at write time and does not leave content or rewards on failure", async (t) => {
  const { sqlite, db, request } = await fixture(t);
  const prepare = db.prepare;
  let mode = "lock";
  db.prepare = (sql) => {
    const statement = prepare(sql);
    if (sql.includes("INSERT INTO posts")) {
      for (const method of ["first", "run"]) {
        const original = statement[method];
        statement[method] = (...args) => {
          if (mode === "lock") sqlite.exec("UPDATE threads SET is_locked=1 WHERE id=1");
          return original(...args);
        };
      }
    }
    if (sql.includes("INSERT INTO threads")) {
      for (const method of ["first", "run"]) {
        const original = statement[method];
        statement[method] = (...args) => {
          if (mode === "archive") sqlite.exec("UPDATE boards SET is_archived=1 WHERE id=11");
          return original(...args);
        };
      }
    }
    return statement;
  };
  let response = await request("/thread/1/reply", "member-session", { method: "POST", body: new URLSearchParams({ parent_id: "10", body: "Must not appear" }) });
  assert.equal(response.status, 409);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM posts WHERE body='Must not appear'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT reply_count FROM threads WHERE id=1").get().reply_count, 2);
  mode = "archive";
  response = await request("/board/11/new", "member-session", { method: "POST", body: new URLSearchParams({ title: "Must not appear", body: "Must not appear" }) });
  assert.equal(response.status, 409);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM threads WHERE title='Must not appear'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT points FROM users WHERE id=2").get().points, 10);
});

test("reply creation and restore races recalculate visible counts without double rewards", async (t) => {
  const { sqlite, request, post } = await fixture(t);
  await post("/admin/posts/11/delete");
  const response = await request("/thread/1/reply", "member-session", { method: "POST", body: new URLSearchParams({ parent_id: "12", body: "Valid new reply" }) });
  assert.equal(response.status, 303);
  assert.equal(sqlite.prepare("SELECT reply_count FROM threads WHERE id=1").get().reply_count, 2);
  assert.equal(sqlite.prepare("SELECT points FROM users WHERE id=2").get().points, 12);
  await post("/admin/posts/11/restore");
  await post("/admin/posts/11/restore");
  assert.equal(sqlite.prepare("SELECT reply_count FROM threads WHERE id=1").get().reply_count, 3);
  assert.equal(sqlite.prepare("SELECT points FROM users WHERE id=2").get().points, 12);
});

test("all admin lists paginate and escaped input never becomes executable markup", async (t) => {
  const { sqlite, request } = await fixture(t);
  for (let i = 100; i < 155; i++) {
    sqlite.prepare("INSERT INTO users(id,username,password_hash,points,created_at) VALUES(?,?,'unused',10,1)").run(i, `extra-user-${i}`);
    sqlite.prepare("INSERT INTO boards(id,parent_id,name,description,sort_order) VALUES(?,1,?,'description',?)").run(1000 + i, `Extra board ${i}`, i);
    sqlite.prepare("INSERT INTO posts(thread_id,parent_id,user_id,author,body,created_at) VALUES(1,10,2,'member',?,?)").run(`Extra reply ${i}`, i + 500);
  }
  let html = await (await request("/admin/users?q=extra-user")).text();
  assert.equal((html.match(/>extra-user-\d+<\/a>/g) ?? []).length, 50);
  html = await (await request("/admin/users?q=extra-user&page=2")).text();
  assert.equal((html.match(/>extra-user-\d+<\/a>/g) ?? []).length, 5);
  html = await (await request("/admin/boards")).text();
  assert.equal((html.match(/action="\/admin\/boards\/\d+\/update"/g) ?? []).length, 50);
  html = await (await request("/admin/threads/1?page=2")).text();
  assert.equal((html.match(/id="post-\d+"/g) ?? []).length, 8);
  sqlite.exec("UPDATE threads SET title='<script>unsafe()</script>' WHERE id=1; UPDATE posts SET body='<img src=x onerror=unsafe()>' WHERE id=11");
  html = await (await request("/admin/threads/1")).text();
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  for (const path of ["/admin/threads?page=0", "/admin/users?page=-1", "/admin/boards?page=9007199254740992", "/admin/threads?status=invalid"]) assert.equal((await request(path)).status, 400);
});

test("a failed D1 batch rolls back reply content, points and summary", async (t) => {
  const { sqlite, db, request } = await fixture(t);
  t.mock.method(console, "error", () => {});
  const prepare = db.prepare;
  db.prepare = (sql) => {
    const statement = prepare(sql);
    if (sql.includes("UPDATE threads SET") && sql.includes("reply_count=")) statement.run = () => { throw new Error("Simulated storage failure"); };
    return statement;
  };
  const response = await request("/thread/1/reply", "member-session", { method: "POST", body: new URLSearchParams({ parent_id: "10", body: "Atomic reply" }) });
  assert.equal(response.status, 500);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM posts WHERE body='Atomic reply'").get().n, 0);
  assert.equal(sqlite.prepare("SELECT points FROM users WHERE id=2").get().points, 10);
  assert.equal(sqlite.prepare("SELECT reply_count FROM threads WHERE id=1").get().reply_count, 2);
});

test("deep replies skip a deleted ancestor when enforcing the existing nesting limit", async (t) => {
  const { sqlite, request } = await fixture(t);
  sqlite.exec(`INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,is_deleted,created_at) VALUES
    (31,1,12,2,'member','depth 3',0,400), (32,1,31,2,'member','deleted depth 4',1,500),
    (33,1,32,2,'member','depth 5',0,600), (34,1,33,2,'member','depth 6',0,700)`);
  const response = await request("/thread/1/reply", "member-session", { method: "POST", body: new URLSearchParams({ parent_id: "34", body: "Deep reply" }) });
  assert.equal(response.status, 303);
  assert.equal(sqlite.prepare("SELECT parent_id FROM posts WHERE body='Deep reply'").get().parent_id, 31);
  assert.equal((await request("/thread/1/reply", "member-session", { method: "POST", body: new URLSearchParams({ parent_id: "32", body: "Cannot directly reply to deleted post" }) })).status, 400);
});

test("repeated initialization preserves moderation, permissions and existing points during legacy backfill", async (t) => {
  const { sqlite, db, post } = await fixture(t);
  await post("/admin/threads/1/delete");
  await post("/admin/threads/2/lock");
  await post("/admin/boards/21/archive");
  sqlite.exec("UPDATE users SET points=123 WHERE id=2; INSERT INTO users(id,username,password_hash,created_at) VALUES(4,'legacy-zero','unused',1); INSERT INTO posts(thread_id,parent_id,user_id,author,body,created_at) VALUES(2,20,4,'legacy-zero','old reply',500)");
  await ensureSchema(db);
  await ensureSchema(db);
  assert.equal(sqlite.prepare("SELECT points FROM users WHERE id=2").get().points, 123);
  assert.equal(sqlite.prepare("SELECT role FROM users WHERE id=1").get().role, "admin");
  assert.equal(sqlite.prepare("SELECT is_deleted FROM threads WHERE id=1").get().is_deleted, 1);
  assert.equal(sqlite.prepare("SELECT is_locked FROM threads WHERE id=2").get().is_locked, 1);
  assert.equal(sqlite.prepare("SELECT is_archived FROM boards WHERE id=21").get().is_archived, 1);
});

test("a ban during password verification cannot create a replacement session", async (t) => {
  const { sqlite, db, request } = await fixture(t);
  sqlite.prepare("UPDATE users SET password_hash=? WHERE id=2").run(await hashPassword("test-password"));
  const prepare = db.prepare;
  db.prepare = (sql) => {
    const statement = prepare(sql);
    if (sql.includes("INSERT INTO sessions")) {
      const run = statement.run;
      statement.run = () => {
        sqlite.exec("UPDATE users SET is_banned=1 WHERE id=2; DELETE FROM sessions WHERE user_id=2");
        return run();
      };
    }
    return statement;
  };
  const response = await request("/login", null, { method: "POST", body: new URLSearchParams({ username: "member", password: "test-password" }) });
  assert.equal(response.status, 401);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id=2").get().n, 0);
});

test("public profile counts exclude deleted and archived content while rewards remain historical", async (t) => {
  const { request, post } = await fixture(t);
  assert.match(await (await request("/user/member", null)).text(), /Posts: 4 · Topics: 2/);
  await post("/admin/posts/11/delete");
  assert.match(await (await request("/user/member", null)).text(), /Posts: 3 · Topics: 2/);
  await post("/admin/threads/1/delete");
  assert.match(await (await request("/user/member", null)).text(), /Posts: 1 · Topics: 1/);
  await post("/admin/boards/11/archive");
  const html = await (await request("/user/member", null)).text();
  assert.match(html, /Posts: 0 · Topics: 0/);
  assert.match(html, /10 activity points/);
  assert.match(html, /Registered/);
});
