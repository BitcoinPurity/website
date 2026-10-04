import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createSessionToken, getSessionUser, SESSION_COOKIE, type SessionUser } from "./auth";
import { getBoard, isLeafBoard, migrateBoardSlugs, type Env } from "./db";
import { errorPage } from "./html";
import { adminHomePage, adminThreadsPage, adminThreadPage, adminUsersPage, adminBoardsPage, type AdminBoard, type AdminThread, type AdminPost, type AdminUser } from "./admin-html";

type AdminContext = { Bindings: Env; Variables: { user: SessionUser; csrf: string } };
const admin = new Hono<AdminContext>();
const PAGE_SIZE = 50;

function idFrom(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new HTTPException(400, { message: "Invalid ID." });
  return id;
}

function pageFrom(value: string | undefined): number {
  const page = value === undefined ? 1 : idFrom(value);
  if (page > 1_000_000) throw new HTTPException(400, { message: "Invalid page." });
  return page;
}

admin.use("*", async (c, next) => {
  c.header("Cache-Control", "private, no-store");
  const user = await getSessionUser(c.env.DB, getCookie(c, SESSION_COOKIE));
  if (!user) {
    const url = new URL(c.req.url);
    return c.redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`, 303);
  }
  if (user.role !== "admin") return c.html(errorPage("Administrator access required.", user), 403);
  c.set("user", user);
  const sessionToken = getCookie(c, SESSION_COOKIE)!;
  if (c.req.method === "GET") {
    await c.env.DB.prepare("UPDATE sessions SET csrf_token = COALESCE(csrf_token, ?) WHERE token = ?")
      .bind(createSessionToken(), sessionToken).run();
  }
  const session = await c.env.DB.prepare("SELECT csrf_token FROM sessions WHERE token = ?").bind(sessionToken).first<{ csrf_token: string | null }>();
  const csrf = session?.csrf_token ?? "";
  c.set("csrf", csrf);
  if (c.req.method === "POST") {
    const origin = c.req.header("Origin");
    const form = await c.req.parseBody();
    if (!csrf || form.csrf_token !== csrf || (origin !== undefined && origin !== new URL(c.req.url).origin)) {
      return c.html(errorPage("Invalid request. Reload the page and try again.", user), 403);
    }
  }
  await next();
});

admin.onError((error, c) => {
  if (error instanceof HTTPException) return c.html(errorPage(error.message, c.get("user")), error.status);
  console.error(error);
  return c.html(errorPage("Unable to complete the operation.", c.get("user")), 500);
});

admin.get("/", async (c) => {
  const counts = await c.env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM threads) AS threads,
    (SELECT COUNT(*) FROM posts WHERE parent_id IS NOT NULL) AS replies`).first<{ users: number; threads: number; replies: number }>();
  return c.html(adminHomePage(counts!, c.get("user")));
});

admin.get("/threads", async (c) => {
  const page = pageFrom(c.req.query("page"));
  const q = (c.req.query("q") ?? "").slice(0, 120);
  const boardId = c.req.query("board_id") ? idFrom(c.req.query("board_id")!) : null;
  const status = c.req.query("status") ?? "active";
  if (!["active", "deleted", "all"].includes(status)) throw new HTTPException(400, { message: "Invalid status." });
  const deleted = status === "all" ? null : Number(status === "deleted");
  const where = "WHERE instr(lower(t.title), lower(?)) > 0 AND (? IS NULL OR t.board_id = ?) AND (? IS NULL OR t.is_deleted = ?)";
  const values = [q, boardId, boardId, deleted, deleted];
  const count = await c.env.DB.prepare(`SELECT COUNT(*) n FROM threads t ${where}`).bind(...values).first<{ n: number }>();
  const rows = await c.env.DB.prepare(`SELECT t.*, b.name AS board_name FROM threads t JOIN boards b ON b.id=t.board_id ${where} ORDER BY t.last_post_at DESC, t.id DESC LIMIT ? OFFSET ?`)
    .bind(...values, PAGE_SIZE, (page - 1) * PAGE_SIZE).all<AdminThread>();
  const boards = await c.env.DB.prepare("SELECT * FROM boards ORDER BY sort_order,id").all<AdminBoard>();
  return c.html(adminThreadsPage(rows.results ?? [], boards.results ?? [], { page, total: count!.n, q, boardId, status }, c.get("user")));
});

admin.get("/threads/:id", async (c) => {
  const id = idFrom(c.req.param("id"));
  const page = pageFrom(c.req.query("page"));
  const thread = await c.env.DB.prepare("SELECT t.*, b.name AS board_name FROM threads t JOIN boards b ON b.id=t.board_id WHERE t.id=?").bind(id).first<AdminThread>();
  if (!thread) throw new HTTPException(404, { message: "Topic not found." });
  const posts = await c.env.DB.prepare("SELECT * FROM posts WHERE thread_id=? ORDER BY created_at,id LIMIT ? OFFSET ?").bind(id, PAGE_SIZE, (page - 1) * PAGE_SIZE).all<AdminPost>();
  const count = await c.env.DB.prepare("SELECT COUNT(*) n FROM posts WHERE thread_id=?").bind(id).first<{ n: number }>();
  const boards = await c.env.DB.prepare(`SELECT b.* FROM boards b JOIN boards p ON p.id=b.parent_id WHERE b.is_archived=0 AND p.is_archived=0 ORDER BY p.sort_order,b.sort_order,b.id`).all<AdminBoard>();
  return c.html(adminThreadPage(thread, posts.results ?? [], boards.results ?? [], page, count!.n, c.get("csrf"), c.get("user")));
});

admin.post("/threads/:id/:action", async (c) => {
  const id = idFrom(c.req.param("id"));
  const thread = await c.env.DB.prepare("SELECT id FROM threads WHERE id=?").bind(id).first();
  if (!thread) throw new HTTPException(404, { message: "Topic not found." });
  const action = c.req.param("action");
  const fields: Record<string, [string, number]> = {
    delete: ["is_deleted", 1], restore: ["is_deleted", 0], lock: ["is_locked", 1], unlock: ["is_locked", 0], pin: ["is_pinned", 1], unpin: ["is_pinned", 0],
  };
  if (action === "move") {
    const form = await c.req.parseBody();
    const boardId = idFrom(String(form.board_id ?? ""));
    const board = await getBoard(c.env.DB, boardId);
    if (!isLeafBoard(board)) throw new HTTPException(400, { message: "Choose an active sub-board." });
    const result = await c.env.DB.prepare(`UPDATE threads SET board_id=? WHERE id=? AND EXISTS (
      SELECT 1 FROM boards b JOIN boards p ON p.id=b.parent_id WHERE b.id=? AND b.is_archived=0 AND p.is_archived=0)`)
      .bind(boardId, id, boardId).run();
    if (!result.meta.changes) throw new HTTPException(409, { message: "Destination is no longer available." });
  } else {
    if (!Object.hasOwn(fields, action)) throw new HTTPException(400, { message: "Invalid topic action." });
    const [field, value] = fields[action];
    await c.env.DB.prepare(`UPDATE threads SET ${field}=? WHERE id=?`).bind(value, id).run();
  }
  return c.redirect(`/admin/threads/${id}`, 303);
});

admin.post("/posts/:id/:action", async (c) => {
  const id = idFrom(c.req.param("id"));
  const action = c.req.param("action");
  if (!["delete", "restore"].includes(action)) throw new HTTPException(400, { message: "Invalid post action." });
  const post = await c.env.DB.prepare(`SELECT p.thread_id, p.id=(SELECT p0.id FROM posts p0 WHERE p0.thread_id=p.thread_id ORDER BY p0.created_at,p0.id LIMIT 1) AS is_op FROM posts p WHERE p.id=?`).bind(id).first<{ thread_id: number; is_op: number }>();
  if (!post) throw new HTTPException(404, { message: "Post not found." });
  const deleted = Number(action === "delete");
  if (post.is_op) {
    await c.env.DB.prepare("UPDATE threads SET is_deleted=? WHERE id=?").bind(deleted, post.thread_id).run();
  } else {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE posts SET is_deleted=? WHERE id=?").bind(deleted, id),
      c.env.DB.prepare(`UPDATE threads SET
        reply_count=MAX(0,(SELECT COUNT(*) FROM posts WHERE thread_id=threads.id AND is_deleted=0)-1),
        last_post_at=COALESCE((SELECT MAX(created_at) FROM posts WHERE thread_id=threads.id AND is_deleted=0),created_at)
        WHERE id=?`).bind(post.thread_id),
    ]);
  }
  return c.redirect(`/admin/threads/${post.thread_id}`, 303);
});

admin.get("/users", async (c) => {
  const page = pageFrom(c.req.query("page"));
  const q = (c.req.query("q") ?? "").slice(0, 32);
  const users = await c.env.DB.prepare("SELECT id,username,role,is_banned,created_at FROM users WHERE instr(lower(username),lower(?))>0 ORDER BY id LIMIT ? OFFSET ?")
    .bind(q, PAGE_SIZE, (page - 1) * PAGE_SIZE).all<AdminUser>();
  const count = await c.env.DB.prepare("SELECT COUNT(*) n FROM users WHERE instr(lower(username),lower(?))>0").bind(q).first<{ n: number }>();
  return c.html(adminUsersPage(users.results ?? [], page, count!.n, q, c.get("csrf"), c.get("user")));
});

admin.post("/users/:id/:action", async (c) => {
  const id = idFrom(c.req.param("id"));
  const action = c.req.param("action");
  const actorId = c.get("user").id;
  if (!["ban", "unban", "grant-admin", "revoke-admin"].includes(action)) throw new HTTPException(400, { message: "Invalid user action." });
  if (!await c.env.DB.prepare("SELECT id FROM users WHERE id=?").bind(id).first()) throw new HTTPException(404, { message: "User not found." });
  if (id === actorId) throw new HTTPException(409, { message: "You cannot change your own access." });
  const actor = "EXISTS (SELECT 1 FROM users actor WHERE actor.id=? AND actor.role='admin' AND actor.is_banned=0)";
  let changed: number;
  if (action === "ban") {
    const results = await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE users SET is_banned=1 WHERE id=? AND role='user' AND ${actor}`).bind(id, actorId),
      c.env.DB.prepare("DELETE FROM sessions WHERE user_id=? AND EXISTS (SELECT 1 FROM users WHERE id=? AND is_banned=1)").bind(id, id),
    ]);
    changed = results[0].meta.changes;
  } else if (action === "unban") {
    const result = await c.env.DB.prepare(`UPDATE users SET is_banned=0 WHERE id=? AND ${actor}`).bind(id, actorId).run();
    changed = result.meta.changes;
  } else {
    const role = action === "grant-admin" ? "admin" : "user";
    const guard = action === "grant-admin" ? "is_banned=0" : "role='admin' AND (is_banned=1 OR (SELECT COUNT(*) FROM users WHERE role='admin' AND is_banned=0)>1)";
    const result = await c.env.DB.prepare(`UPDATE users SET role=? WHERE id=? AND ${guard} AND ${actor}`).bind(role, id, actorId).run();
    changed = result.meta.changes;
  }
  if (!changed) throw new HTTPException(409, { message: "Access changed or operation would remove the last administrator. Administrators must be demoted before banning." });
  return c.redirect("/admin/users", 303);
});

admin.get("/boards", async (c) => {
  const page = pageFrom(c.req.query("page"));
  const rows = await c.env.DB.prepare("SELECT b.*,p.name AS parent_name FROM boards b LEFT JOIN boards p ON p.id=b.parent_id ORDER BY COALESCE(b.parent_id,b.id),b.parent_id IS NOT NULL,b.sort_order,b.id LIMIT ? OFFSET ?")
    .bind(PAGE_SIZE, (page - 1) * PAGE_SIZE).all<AdminBoard>();
  const categories = await c.env.DB.prepare("SELECT * FROM boards WHERE parent_id IS NULL ORDER BY sort_order,id").all<AdminBoard>();
  const count = await c.env.DB.prepare("SELECT COUNT(*) n FROM boards").first<{ n: number }>();
  return c.html(adminBoardsPage(rows.results ?? [], categories.results ?? [], page, count!.n, c.get("csrf"), c.get("user")));
});

admin.post("/boards", async (c) => {
  const form = await c.req.parseBody();
  const fields = await boardFields(c.env.DB, form);
  await c.env.DB.prepare("INSERT INTO boards(name,description,sort_order,parent_id) VALUES(?,?,?,?)").bind(...fields).run();
  await migrateBoardSlugs(c.env.DB);
  return c.redirect("/admin/boards", 303);
});

admin.post("/boards/:id/:action", async (c) => {
  const id = idFrom(c.req.param("id"));
  const board = await c.env.DB.prepare("SELECT * FROM boards WHERE id=?").bind(id).first<AdminBoard>();
  if (!board) throw new HTTPException(404, { message: "Board not found." });
  const action = c.req.param("action");
  if (action === "update") {
    const form = await c.req.parseBody();
    const fields = await boardFields(c.env.DB, form);
    if ((board.parent_id === null) !== (fields[3] === null)) throw new HTTPException(400, { message: "Categories and boards cannot change type." });
    await c.env.DB.prepare("UPDATE boards SET name=?,description=?,sort_order=?,parent_id=? WHERE id=?").bind(...fields, id).run();
  } else if (action === "archive" || action === "restore") {
    await c.env.DB.prepare("UPDATE boards SET is_archived=? WHERE id=?").bind(Number(action === "archive"), id).run();
  } else throw new HTTPException(400, { message: "Invalid board action." });
  return c.redirect("/admin/boards", 303);
});

async function boardFields(db: D1Database, form: Record<string, string | File>): Promise<[string, string, number, number | null]> {
  const name = String(form.name ?? "").trim();
  const description = String(form.description ?? "").trim();
  const sortValue = String(form.sort_order ?? "").trim();
  const sort = Number(sortValue);
  if (!name || name.length > 120 || description.length > 1000 || !sortValue || !Number.isSafeInteger(sort) || Math.abs(sort) > 2147483647) {
    throw new HTTPException(400, { message: "Name (1–120 characters), description (up to 1000 characters), and integer sort order are required." });
  }
  const parentId = form.parent_id ? idFrom(String(form.parent_id)) : null;
  if (parentId !== null && !await db.prepare("SELECT id FROM boards WHERE id=? AND parent_id IS NULL").bind(parentId).first()) {
    throw new HTTPException(400, { message: "Choose a category as the parent." });
  }
  return [name, description, sort, parentId];
}

export default admin;
