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

const { initializeDatabase } = await import("../src/db.ts");
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
          if (/^\s*(SELECT|WITH)|RETURNING/i.test(sql)) return { results: sqlite.prepare(sql).all(...values) };
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


async function fixture(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const db = d1(sqlite);
  await initializeDatabase(db);
  sqlite.exec(`INSERT INTO users(id,username,password_hash,points,created_at) VALUES(1,'owner','unused',10,1),(2,'other','unused',10,1);
    INSERT INTO sessions(token,user_id,csrf_token,expires_at) VALUES('owner-session',1,'owner-csrf',9999999999),('other-session',2,'other-csrf',9999999999);
    INSERT INTO threads(id,board_id,title,created_at,last_post_at,reply_count) VALUES(1,11,'Live topic',100,200,1);
    INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES(10,1,NULL,1,'owner','Opening body',100),(11,1,10,2,'other','Reply body',200);
    INSERT INTO thread_reads(user_id,thread_id,last_read_post_id) VALUES(1,1,10);`);
  const request = (path, token = 'owner-session', init = {}) => app.request(`https://bbs.example${path}`, {
    ...init, headers: {...(token ? {cookie:`bbs_session=${token}`} : {}), ...init.headers},
  }, {DB:db});
  return {sqlite,db,request};
}

test('live snapshots use one read-only batch, private caching, bounded calls and conditional responses', async t => {
  const {sqlite,db,request} = await fixture(t);
  for (let id=12; id<132; id++) {
    sqlite.prepare("INSERT INTO users(id,username,password_hash,created_at) VALUES(?,?,'unused',1)").run(id,`author-${id}`);
    sqlite.prepare("INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES(?,1,10,?,?,'Extra reply',?)").run(id,id,`author-${id}`,300+id);
  }
  for (const token of [null,'owner-session']) for (const query of ['kind=index','kind=category&key=bitcoin-purity','kind=board&key=general-discussion','kind=thread&key=1']) {
    db.calls.length=0;
    const before=sqlite.prepare('SELECT * FROM thread_reads').all();
    const response=await request(`/api/live?${query}`,token);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    const snapshot=await response.json();
    assert.equal(snapshot.viewerId,token?1:null);
    assert.equal(snapshot.regions.length,2);
    assert.ok(snapshot.regions.every(r=>r.id && r.html && r.hash));
    assert.equal(db.calls.length,2);
    assert.ok(db.calls.flat().every(sql=>!/^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER)/i.test(sql)));
    assert.deepEqual(sqlite.prepare('SELECT * FROM thread_reads').all(),before);
    if (query.startsWith('kind=thread')) {
      assert.equal(snapshot.lastPostId,131);
      assert.match(snapshot.regions[1].html,/author-131/);
    }
    db.calls.length=0;
    const same=await request(`/api/live?${query}`,token,{headers:{'if-none-match':response.headers.get('etag')}});
    assert.equal(same.status,304);
    assert.equal(await same.text(),'');
    assert.equal(db.calls.length,2);
  }
});

test('snapshots detect edits, deletion, locks, archives and account changes without leaking deleted content', async t=>{
  const {sqlite,request}=await fixture(t);
  const first=await request('/api/live?kind=thread&key=1');
  const etag=first.headers.get('etag');
  sqlite.exec("UPDATE posts SET body='Changed opening' WHERE id=10; INSERT INTO post_edits(post_id,edited_at) VALUES(10,400); UPDATE threads SET is_locked=1 WHERE id=1; UPDATE posts SET is_deleted=1 WHERE id=11");
  const response=await request('/api/live?kind=thread&key=1',undefined,{headers:{'if-none-match':etag}});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.locked,true);
  for(const text of ['Changed opening','Edited:','Post deleted']) assert.ok(body.regions[1].html.includes(text));
  assert.doesNotMatch(body.regions[1].html,/Reply body/);
  sqlite.exec("INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES(12,1,11,2,'other','Visible descendant',300)");
  const nested=await(await request('/api/live?kind=thread&key=1')).json();
  assert.match(nested.regions[1].html,/Visible descendant/);
  assert.deepEqual(nested.posts.find(post=>post.id===12),{id:12,parentId:11,deleted:false});
  sqlite.exec("UPDATE sessions SET expires_at=1 WHERE token='owner-session'");
  assert.equal((await(await request('/api/live?kind=thread&key=1')).json()).viewerId,null);
  sqlite.exec('UPDATE users SET is_banned=1 WHERE id=1');
  assert.equal((await (await request('/api/live?kind=thread&key=1')).json()).viewerId,null);
  sqlite.exec('UPDATE boards SET is_archived=1 WHERE id=1');
  assert.equal((await request('/api/live?kind=thread&key=1')).status,404);
  for(const query of ['kind=admin','kind=thread&key=0','kind=thread&key=9007199254740992']) assert.equal((await request(`/api/live?${query}`)).status,400);
});

test('displayed read acknowledgements enforce ownership of session, CSRF, origin and monotonic valid progress', async t=>{
  const {sqlite,request}=await fixture(t);
  const ack=(values={},headers={},token='owner-session')=>request('/thread/1/read',token,{method:'POST',headers:{'content-type':'application/json',origin:'https://bbs.example',...headers},body:JSON.stringify({lastPostId:11,csrf_token:'owner-csrf',...values})});
  assert.equal((await ack()).status,204);
  assert.equal(sqlite.prepare('SELECT last_read_post_id FROM thread_reads WHERE user_id=1').get().last_read_post_id,11);
  assert.equal((await ack({lastPostId:10})).status,204);
  assert.equal((await ack({lastPostId:99999})).status,400);
  assert.equal((await ack({csrf_token:'other-csrf'})).status,403);
  assert.equal((await ack({}, {origin:'https://evil.example'})).status,403);
  assert.equal((await ack({}, {}, null)).status,401);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM thread_reads WHERE user_id=2').get().n,0);
  sqlite.exec('UPDATE threads SET is_deleted=1 WHERE id=1');
  assert.equal((await ack()).status,404);
});

test('only public reading pages opt into the configured timer and thread CSRF initializes once',async t=>{
  const {sqlite,request}=await fixture(t);
  for(const path of ['/','/category/bitcoin-purity','/board/general-discussion','/thread/1']) {
    const html=await (await request(path)).text();
    assert.match(html,/src="\/live-refresh.js"/);
    assert.match(html,/data-live-interval="180000"/);
  }
  for(const path of ['/login','/register','/board/general-discussion/new','/thread/1/edit','/user/owner']) assert.doesNotMatch(await(await request(path)).text(),/src="\/live-refresh.js"/);
  sqlite.exec("UPDATE sessions SET csrf_token=NULL WHERE token='owner-session'");
  const page=await(await request('/thread/1')).text();
  const token=sqlite.prepare("SELECT csrf_token FROM sessions WHERE token='owner-session'").get().csrf_token;
  assert.ok(token);
  assert.ok(page.includes(token));
  await request('/thread/1');
  assert.equal(sqlite.prepare("SELECT csrf_token FROM sessions WHERE token='owner-session'").get().csrf_token,token);
});

test('snapshots match ordinary page rendering and isolate account unread counts across larger board sets',async t=>{
  const {sqlite,db,request}=await fixture(t);
  for(let id=200;id<300;id++) sqlite.prepare("INSERT INTO boards(id,parent_id,name,slug,description,sort_order) VALUES(?,1,?,?,'Extra board',?)").run(id,`Extra board ${id}`,`extra-${id}`,id);
  const pages=[['/','kind=index'],['/category/bitcoin-purity','kind=category&key=bitcoin-purity'],['/board/general-discussion','kind=board&key=general-discussion'],['/thread/1?reply_to=10','kind=thread&key=1&reply_to=10']];
  for(const [path,query] of pages) {
    const html=await(await request(path)).text();
    db.calls.length=0;
    const snapshot=await(await request(`/api/live?${query}`)).json();
    assert.equal(db.calls.length,2);
    for(const region of snapshot.regions) {
      const name=region.id.replace('live-','');
      const expected=html.match(new RegExp(`<!--live:${name}:start-->([\\s\\S]*?)<!--live:${name}:end-->`))[1];
      assert.equal(region.html,expected);
    }
  }
  const owner=await(await request('/api/live?kind=board&key=general-discussion')).json();
  const other=await(await request('/api/live?kind=board&key=general-discussion','other-session')).json();
  assert.doesNotMatch(owner.regions[1].html,/new-topics/);
  assert.match(other.regions[1].html,/1 new topic/);
});

test('read acknowledgements write only on progress and cannot consume replies arriving after the displayed snapshot',async t=>{
  const {sqlite,db,request}=await fixture(t);
  sqlite.exec('CREATE TABLE read_writes(n INTEGER); CREATE TRIGGER read_probe AFTER UPDATE ON thread_reads BEGIN INSERT INTO read_writes VALUES(1); END');
  const snapshot=await(await request('/api/live?kind=thread&key=1')).json();
  sqlite.exec("INSERT INTO posts(id,thread_id,parent_id,user_id,author,body,created_at) VALUES(12,1,11,2,'other','Arrived later',300)");
  const ack=lastPostId=>request('/thread/1/read','owner-session',{method:'POST',headers:{origin:'https://bbs.example','content-type':'application/json'},body:JSON.stringify({lastPostId,csrf_token:'owner-csrf'})});
  db.calls.length=0;
  assert.equal((await ack(snapshot.lastPostId)).status,204);
  assert.equal(db.calls.length,2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM read_writes').get().n,1);
  assert.equal((await ack(snapshot.lastPostId)).status,204);
  assert.equal((await ack(10)).status,204);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM read_writes').get().n,1);
  const board=await(await request('/api/live?kind=board&key=general-discussion')).json();
  assert.match(board.regions[1].html,/1 new topic/);
  assert.equal(sqlite.prepare('SELECT last_read_post_id FROM thread_reads WHERE user_id=1').get().last_read_post_id,11);
});

test('live board lists retain pinned ordering and the 100 topic limit as content changes',async t=>{
  const {sqlite,db,request}=await fixture(t);
  for(let id=2;id<108;id++) {
    sqlite.prepare("INSERT INTO threads(id,board_id,title,created_at,last_post_at) VALUES(?,11,?,1,?)").run(id,`Topic ${id}`,id);
    sqlite.prepare("INSERT INTO posts(id,thread_id,user_id,author,body,created_at) VALUES(?,?,1,'owner','Opening',1)").run(1000+id,id);
  }
  sqlite.exec('UPDATE threads SET is_pinned=1 WHERE id=2');
  const topicIds=snapshot=>[...snapshot.regions[1].html.matchAll(/id="live-topic-(\d+)"/g)].map(match=>Number(match[1]));
  const first=await(await request('/api/live?kind=board&key=general-discussion')).json();
  const before=topicIds(first);assert.equal(before.length,100);assert.equal(before[0],2);
  sqlite.exec('UPDATE threads SET is_deleted=1 WHERE id=2; UPDATE threads SET last_post_at=999 WHERE id=3');
  db.calls.length=0;
  const after=topicIds(await(await request('/api/live?kind=board&key=general-discussion')).json());
  assert.equal(after.length,100);assert.equal(after[0],3);assert.ok(!after.includes(2));assert.equal(db.calls.length,2);
});
