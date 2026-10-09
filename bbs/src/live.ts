import type { SessionUser } from "./auth";
import { authorProfileQueries, authorProfilesFromRows, boardStatsQuery, newTopicCountQuery, postsFromRows, postsQuery, threadsQuery, type BoardStats, type CategorySection } from "./db";
import { boardIndexPage, categoryPage, threadListPage, threadPage, type PostRow, type ThreadRow } from "./html";
import { levelFromPoints } from "./reputation";

const viewerQuery = `SELECT u.id, u.email, u.username, u.points, u.role, s.csrf_token
  FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>? AND u.is_banned=0`;
const visibleThreadQuery = `SELECT t.id,t.title,t.is_locked,b.id AS board_id,b.slug,b.name,
  b.parent_id,c.name AS parent_name,c.slug AS parent_slug
  FROM threads t JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
  WHERE t.id=? AND t.is_deleted=0 AND b.is_archived=0 AND c.is_archived=0`;
export type LiveKind = "index" | "category" | "board" | "thread";
export type LiveSnapshot = { title: string; viewerId: number | null; regions: { id: string; html: string; hash: string }[]; lastPostId: number; locked: boolean; posts: { id: number; parentId: number | null; deleted: boolean }[] };
type LiveThread = { id: number; title: string; is_locked: number; board_id: number; slug: string; name: string; parent_id: number; parent_name: string; parent_slug: string };

export async function readLivePage(db: D1Database, kind: LiveKind, key: string, token: string | undefined, replyToId: number | null): Promise<LiveSnapshot | null> {
  const now = Math.floor(Date.now()/1000);
  const viewer = token ?? "";
  const prefix = `WITH viewer AS (${viewerQuery}) `;
  const statements = [db.prepare(viewerQuery).bind(viewer, now)];
  if (kind === "index") {
    statements.push(
      db.prepare("SELECT id,parent_id,slug,name,description FROM boards WHERE is_archived=0 ORDER BY sort_order,id"),
      db.prepare(`${prefix}${boardStatsQuery("(SELECT id FROM viewer)")} WHERE b.parent_id IS NOT NULL AND b.is_archived=0
        AND EXISTS (SELECT 1 FROM boards c WHERE c.id=b.parent_id AND c.parent_id IS NULL AND c.is_archived=0) GROUP BY b.id`).bind(viewer, now),
    );
  } else if (kind === "category") {
    statements.push(
      db.prepare("SELECT id,slug,name,description FROM boards WHERE slug=? AND parent_id IS NULL AND is_archived=0").bind(key),
      db.prepare(`${prefix}${boardStatsQuery("(SELECT id FROM viewer)")}
        WHERE b.is_archived=0 AND b.parent_id=(SELECT id FROM boards WHERE slug=? AND parent_id IS NULL AND is_archived=0)
        GROUP BY b.id ORDER BY b.sort_order,b.id`).bind(viewer, now, key),
    );
  } else if (kind === "board") {
    statements.push(
      db.prepare(`${prefix}SELECT b.id,b.slug,b.name,b.parent_id,c.name AS parent_name,c.slug AS parent_slug,
        ${newTopicCountQuery("(SELECT id FROM viewer)")} AS new_topic_count FROM boards b JOIN boards c ON c.id=b.parent_id
        WHERE b.slug=? AND b.is_archived=0 AND c.is_archived=0`).bind(viewer, now, key),
      db.prepare(threadsQuery.replace("t.board_id = ?", "t.board_id = (SELECT id FROM boards WHERE slug=?)")).bind(key),
    );
  } else {
    const id = Number(key);
    statements.push(db.prepare(visibleThreadQuery).bind(id), db.prepare(postsQuery).bind(id,id));
    statements.push(...authorProfileQueries("SELECT DISTINCT author FROM posts WHERE thread_id=?").map(sql=>db.prepare(sql).bind(id)));
  }
  const results = await db.batch(statements);
  const row = results[0].results[0] as Omit<SessionUser,"level"> | undefined;
  const user: SessionUser | null = row ? {...row,level:levelFromPoints(row.points)} : null;
  let html: string;
  let title: string;
  let lastPostId = 0;
  let locked = false;
  let topology: LiveSnapshot["posts"] = [];
  if (kind === "index") {
    const hierarchy = results[1].results as {id:number;parent_id:number|null;slug:string;name:string;description:string}[];
    const stats = new Map((results[2].results as BoardStats[]).map(board=>[board.id,board]));
    const categories = new Map<number,CategorySection>();
    for (const board of hierarchy) if (board.parent_id === null) categories.set(board.id,{...board,boards:[]});
    for (const board of hierarchy) if (board.parent_id !== null && categories.has(board.parent_id) && stats.has(board.id)) categories.get(board.parent_id)!.boards.push(stats.get(board.id)!);
    html = boardIndexPage([...categories.values()],user);
    title = "Board index";
  } else if (kind === "category") {
    const section = results[1].results[0] as Omit<CategorySection,"boards"> | undefined;
    if (!section) return null;
    html = categoryPage({...section,boards:results[2].results as BoardStats[]},user);
    title = section.name;
  } else if (kind === "board") {
    const board = results[1].results[0] as Parameters<typeof threadListPage>[0] | undefined;
    if (!board) return null;
    html = threadListPage(board,results[2].results as ThreadRow[],user);
    title = board.name;
  } else {
    const thread = results[1].results[0] as LiveThread | undefined;
    if (!thread) return null;
    const posts = postsFromRows(results[2].results as (PostRow & {edit_times_json:string})[]);
    const profiles = authorProfilesFromRows(results[3].results,results[4].results);
    const target = posts.some(post=>post.id === replyToId) ? replyToId : null;
    html = threadPage({...thread,id:thread.board_id},thread,posts,user,profiles,undefined,target);
    title = thread.title;
    topology = posts.map(post => ({ id: post.id, parentId: post.parent_id, deleted: !!post.is_deleted }));
    lastPostId = posts.reduce((max,post)=>Math.max(max,post.id),0);
    locked = !!thread.is_locked;
  }
  const regions = await Promise.all([...html.matchAll(/<!--live:(navigation|content):start-->([\s\S]*?)<!--live:\1:end-->/g)]
    .map(async match=>({id:`live-${match[1]}`,html:match[2],hash:await digest(match[2])})));
  return {title,viewerId:user?.id ?? null,regions,lastPostId,locked,posts:topology};
}

export async function digest(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
  return Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");
}

export async function acknowledgeRead(db: D1Database, threadId: number, lastPostId: number, token: string | undefined, csrf: string): Promise<204|400|401|403|404> {
  const now = Math.floor(Date.now()/1000);
  const results = await db.batch([
    db.prepare(viewerQuery).bind(token ?? "",now),
    db.prepare(visibleThreadQuery).bind(threadId),
    db.prepare("SELECT id FROM posts WHERE thread_id=? AND id=?").bind(threadId,lastPostId),
    db.prepare(`INSERT INTO thread_reads (user_id,thread_id,last_read_post_id)
      SELECT u.id,?,? FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token=? AND s.expires_at>? AND u.is_banned=0 AND s.csrf_token=? AND s.csrf_token<>'' AND EXISTS (
        SELECT 1 FROM threads t JOIN boards b ON b.id=t.board_id JOIN boards c ON c.id=b.parent_id
        WHERE t.id=? AND t.is_deleted=0 AND b.is_archived=0 AND c.is_archived=0
      ) AND EXISTS (SELECT 1 FROM posts WHERE thread_id=? AND id=?)
      ON CONFLICT (user_id,thread_id) DO UPDATE SET last_read_post_id=excluded.last_read_post_id
      WHERE excluded.last_read_post_id>thread_reads.last_read_post_id`)
      .bind(threadId,lastPostId,token ?? "",now,csrf,threadId,threadId,lastPostId),
  ]);
  const viewer = results[0].results[0] as {csrf_token:string|null} | undefined;
  if (!viewer) return 401;
  if (!csrf || viewer.csrf_token !== csrf) return 403;
  if (!results[1].results.length) return 404;
  if (!results[2].results.length) return 400;
  return 204;
}
