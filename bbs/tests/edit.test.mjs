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
const database = await import("../src/db.ts");

function d1(sqlite) {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() { return sqlite.prepare(sql).get(...values) ?? null; },
        async all() { return { results: sqlite.prepare(sql).all(...values) }; },
        run() {
          if (/^\s*SELECT|RETURNING/i.test(sql)) {
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
  await database.initializeDatabase(db);
  sqlite.exec(`
    INSERT INTO users(id,username,password_hash,points,role,created_at) VALUES
      (1,'owner','unused',10,'user',1), (2,'other','unused',10,'user',1), (3,'admin','unused',10,'admin',1);
    INSERT INTO sessions(token,user_id,csrf_token,expires_at) VALUES
      ('owner-session',1,'owner-csrf',9999999999), ('other-session',2,'other-csrf',9999999999), ('admin-session',3,'admin-csrf',9999999999);
    INSERT INTO threads(id,board_id,title,created_at,last_post_at,reply_count) VALUES(1,11,'Original title',100,300,2);
    INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES
      (10,1,NULL,1,'owner','Opening message',100), (11,1,10,1,'owner','Owner reply',200), (12,1,11,2,'other','Other reply',300);
    INSERT INTO thread_reads(user_id,thread_id,last_read_post_id) VALUES(1,1,11),(2,1,12);
    INSERT INTO user_badges(user_id,badge_id,earned_at) VALUES(1,'registered',1);
  `);
  const request = (path, token = 'owner-session', init = {}) => app.request(`https://bbs.example${path}`, {
    ...init, headers: { ...(token ? { cookie: `bbs_session=${token}` } : {}), ...init.headers },
  }, { DB: db });
  const save = (values = {}, token = 'owner-session', headers = {}) => request('/thread/1/edit', token, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams({ csrf_token: 'owner-csrf', title: 'Edited title', body: 'Edited body', ...values }),
  });
  return { sqlite, db, request, save };
}

test('only the opening post owner sees Edit and may access its prefilled form', async (t) => {
  const { sqlite, request } = await fixture(t);
  for (const token of [null, 'other-session', 'admin-session']) {
    const html = await (await request('/thread/1', token)).text();
    assert.doesNotMatch(html, /href="\/thread\/1\/edit"/);
    const edit = await request('/thread/1/edit', token);
    assert.equal(edit.status, token ? 403 : 303);
    if (!token) assert.equal(edit.headers.get('location'), '/login?next=%2Fthread%2F1%2Fedit');
  }
  const html = await (await request('/thread/1')).text();
  assert.equal((html.match(/href="\/thread\/1\/edit"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /class="fb-edit-history"/);
  const response = await request('/thread/1/edit');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const form = await response.text();
  assert.match(form, /value="Original title"/);
  assert.match(form, />Opening message<\/textarea>/);
  assert.match(form, /name="csrf_token" value="owner-csrf"/);
  assert.match(form, /href="\/thread\/1#post-10">Cancel/);
  sqlite.exec("UPDATE posts SET user_id=NULL WHERE id=10");
  assert.equal((await request('/thread/1/edit')).status, 403);
});

test('editing records every server timestamp below the opening body before replies without changing other state', async (t) => {
  const { sqlite, request, save } = await fixture(t);
  const untouched = () => ({
    posts: sqlite.prepare('SELECT id,parent_id,user_id,author,created_at,is_deleted FROM posts ORDER BY id').all(),
    replies: sqlite.prepare('SELECT body FROM posts WHERE parent_id IS NOT NULL ORDER BY id').all(),
    thread: sqlite.prepare('SELECT board_id,created_at,last_post_at,reply_count,is_locked,is_pinned,is_deleted FROM threads').all(),
    users: sqlite.prepare('SELECT * FROM users').all(), badges: sqlite.prepare('SELECT * FROM user_badges').all(), reads: sqlite.prepare('SELECT * FROM thread_reads').all(),
  });
  const before = untouched();
  const now = Math.floor(Date.now()/1000);
  for (const body of ['First edit', 'Second edit']) {
    const response = await save({ body, parent_id: '11', post_id: '11', edited_at: '1' });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), '/thread/1#post-10');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  assert.deepEqual(untouched(), before);
  assert.equal(sqlite.prepare('SELECT title FROM threads').get().title, 'Edited title');
  assert.equal(sqlite.prepare('SELECT body FROM posts WHERE id=10').get().body, 'Second edit');
  const edits = sqlite.prepare('SELECT * FROM post_edits ORDER BY id').all();
  assert.equal(edits.length, 2);
  assert.ok(edits.every(e => e.post_id === 10 && e.edited_at >= now && e.edited_at <= Math.floor(Date.now()/1000)));
  const html = await (await request('/thread/1', null)).text();
  const history = html.indexOf('class="fb-edit-history"');
  assert.ok(history > html.indexOf('Second edit'));
  assert.ok(history < html.indexOf('id="post-11"'));
  assert.equal((html.match(/<li>Edited: /g) ?? []).length, 2);
  assert.match(html, /\.fb-edit-history\s*\{[^}]*margin-top:\s*24px/);
  assert.match(html, /Edited: [^<]* UTC/);
  assert.equal((await save({body: 'Second edit'})).status, 303);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 2);
  assert.equal((await request('/posts/11/edit', 'owner-session', {method:'POST'})).status, 404);
});

test('edit submissions enforce ownership, current sessions, CSRF and same origin', async (t) => {
  const { sqlite, request, save } = await fixture(t);
  for (const token of ['other-session','admin-session']) assert.equal((await save({}, token)).status, 403);
  assert.equal((await save({}, null)).status, 303);
  for (const csrf_token of ['', 'wrong', 'other-csrf']) assert.equal((await save({csrf_token})).status, 403);
  assert.equal((await save({}, 'owner-session', {origin:'https://evil.example'})).status, 403);
  assert.equal((await save({}, 'owner-session', {origin:'https://bbs.example'})).status, 303);
  sqlite.exec('UPDATE users SET is_banned=1 WHERE id=1');
  assert.equal((await save()).status, 303);
  assert.equal((await request('/thread/1/edit')).status, 303);
});

test('invalid edits preserve escaped inputs and create no changes or history', async (t) => {
  const { sqlite, request, save } = await fixture(t);
  for (const values of [{title:' '}, {body:' '}, {title:'x'.repeat(121)}, {body:'x'.repeat(10001)}]) {
    assert.equal((await save(values)).status, 400);
  }
  const response = await save({title:'<script>"subject', body:''});
  assert.match(await response.text(), /value="&lt;script&gt;&quot;subject"/);
  assert.equal(sqlite.prepare('SELECT title FROM threads').get().title, 'Original title');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 0);
  for (const id of ['0','abc','9007199254740992']) assert.equal((await request(`/thread/${id}/edit`)).status, 400);
  assert.equal((await request('/thread/999/edit')).status, 404);
});

test('deleted or archived content cannot be edited and locked topics allow owner edits', async (t) => {
  const { sqlite, request, save } = await fixture(t);
  for (const [table, column, id] of [['threads','is_deleted',1],['posts','is_deleted',10],['boards','is_archived',11],['boards','is_archived',1]]) {
    sqlite.prepare(`UPDATE ${table} SET ${column}=1 WHERE id=?`).run(id);
    assert.equal((await request('/thread/1/edit')).status, 404);
    assert.equal((await save()).status, 404);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 0);
    sqlite.prepare(`UPDATE ${table} SET ${column}=0 WHERE id=?`).run(id);
  }
  sqlite.exec('UPDATE threads SET is_locked=1 WHERE id=1');
  assert.equal((await save()).status, 303);
  sqlite.exec('UPDATE posts SET is_deleted=1 WHERE id=10');
  const html = await (await request('/thread/1', null)).text();
  assert.doesNotMatch(html, /Edited body|class="fb-edit-history"|href="\/thread\/1\/edit"/);
});

test('atomic edit writes recheck moderation and owner state and roll back partial failures', async (t) => {
  const { sqlite, db } = await fixture(t);
  for (const sql of ['UPDATE threads SET is_deleted=1 WHERE id=1', 'UPDATE boards SET is_archived=1 WHERE id=11', 'UPDATE boards SET is_archived=1 WHERE id=1', 'UPDATE posts SET is_deleted=1 WHERE id=10', 'UPDATE posts SET user_id=2 WHERE id=10', 'UPDATE users SET is_banned=1 WHERE id=1']) {
    sqlite.exec(sql);
    assert.equal(await database.updateThread(db,1,1,'Changed','Changed'), false);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 0);
    sqlite.exec('UPDATE threads SET is_deleted=0; UPDATE boards SET is_archived=0; UPDATE posts SET is_deleted=0,user_id=1 WHERE id=10; UPDATE users SET is_banned=0');
  }
  const prepare = db.prepare;
  db.prepare = sql => {
    const statement = prepare(sql);
    if (sql.includes('UPDATE threads SET title')) statement.run = () => {throw new Error('write interrupted');};
    return statement;
  };
  await assert.rejects(() => database.updateThread(db,1,1,'Changed','Changed'), /write interrupted/);
  assert.equal(sqlite.prepare('SELECT body FROM posts WHERE id=10').get().body, 'Opening message');
  assert.equal(sqlite.prepare('SELECT title FROM threads').get().title, 'Original title');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 0);
});

test('new SQL schema and existing completed databases gain edit history idempotently without data loss', async (t) => {
  const fresh = new DatabaseSync(':memory:');
  t.after(() => fresh.close());
  fresh.exec(readFileSync(new URL('../schema.sql', import.meta.url),'utf8'));
  assert.ok(fresh.prepare("SELECT name FROM sqlite_master WHERE name='post_edits'").get());
  const { sqlite, db } = await fixture(t);
  const before = sqlite.prepare('SELECT * FROM posts').all();
  sqlite.exec("DROP TABLE IF EXISTS post_edits; DELETE FROM bbs_migrations WHERE name LIKE 'schema_%'; INSERT INTO bbs_migrations(name) VALUES('schema_2026_10_07')");
  await database.initializeDatabase(db);
  assert.ok(sqlite.prepare("SELECT name FROM sqlite_master WHERE name='post_edits'").get());
  await database.updateThread(db,1,1,'Changed','Changed');
  await database.ensureSchema(db);
  await database.initializeDatabase(db);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 1);
  assert.deepEqual(sqlite.prepare('SELECT * FROM posts WHERE id<>10').all(), before.filter(p => p.id !== 10));
});

test('opening an edit form initializes a missing CSRF token without writing reading progress', async (t) => {
  const { sqlite, request } = await fixture(t);
  const before = sqlite.prepare('SELECT * FROM thread_reads').all();
  sqlite.exec("UPDATE sessions SET csrf_token=NULL WHERE token='owner-session'");
  const response = await request('/thread/1/edit');
  assert.equal(response.status, 200);
  const token = sqlite.prepare("SELECT csrf_token FROM sessions WHERE token='owner-session'").get().csrf_token;
  assert.ok(token && token.length === 64);
  assert.match(await response.text(), new RegExp(`name="csrf_token" value="${token}"`));
  assert.deepEqual(sqlite.prepare('SELECT * FROM thread_reads').all(), before);
});


test('title-only and body-only edits are recorded while database no-ops cannot reuse a previous audit insert', async (t) => {
  const { sqlite, db, save } = await fixture(t);
  assert.equal((await save({body:'Opening message'})).status, 303);
  assert.equal(sqlite.prepare('SELECT body FROM posts WHERE id=10').get().body, 'Opening message');
  assert.equal((await save({body:'Body only'})).status, 303);
  assert.equal(await database.updateThread(db,1,1,'Edited title','Body only'), false);
  assert.equal(await database.updateThread(db,1,2,'Unauthorized','Unauthorized'), false);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 2);
  assert.equal(sqlite.prepare('SELECT title FROM threads').get().title, 'Edited title');
  assert.equal(sqlite.prepare('SELECT body FROM posts WHERE id=10').get().body, 'Body only');
});

test('moderation between form validation and the edit transaction returns a conflict without writing content', async (t) => {
  const { sqlite, db, save } = await fixture(t);
  const batch = db.batch;
  db.batch = async statements => {
    sqlite.exec('UPDATE boards SET is_archived=1 WHERE id=11');
    return batch(statements);
  };
  assert.equal((await save()).status, 409);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM post_edits').get().n, 0);
  assert.equal(sqlite.prepare('SELECT title FROM threads').get().title, 'Original title');
  assert.equal(sqlite.prepare('SELECT body FROM posts WHERE id=10').get().body, 'Opening message');
});

test('thread posts fetch opening edit history once regardless of reply count in one database call', async (t) => {
  const { sqlite, db } = await fixture(t);
  for (let id = 13; id <= 132; id++) {
    sqlite.prepare("INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES(?,1,10,2,'other','Reply',?)").run(id, 400 + id);
  }
  sqlite.exec('INSERT INTO post_edits(post_id,edited_at) VALUES(10,500),(10,600),(10,700)');
  let historyReads = 0;
  sqlite.function('observe_edit_post', id => { historyReads++; return id; });
  sqlite.exec(`ALTER TABLE post_edits RENAME TO stored_post_edits;
    CREATE VIEW post_edits AS SELECT id, observe_edit_post(post_id) AS post_id, edited_at FROM stored_post_edits`);
  const prepare = db.prepare;
  let calls = 0;
  db.prepare = sql => { calls++; return prepare(sql); };
  const posts = await database.getPosts(db, 1);
  assert.equal(posts.length, 123);
  assert.deepEqual(posts[0].edit_times, [500,600,700]);
  assert.ok(posts.slice(1).every(post => post.edit_times.length === 0));
  assert.equal(calls, 1, 'posts and edit history share one database query');
  assert.equal(historyReads, 3, 'history is evaluated once, not once for each reply');
});
