import type { SessionUser } from "./auth";
import { escapeHtml, layout } from "./html";

export type AdminBoard = { id: number; parent_id: number | null; name: string; description: string; sort_order: number; is_archived: number; parent_name?: string };
export type AdminThread = { id: number; title: string; board_id: number; board_name: string; is_deleted: number; is_locked: number; is_pinned: number; reply_count: number };
export type AdminPost = { id: number; parent_id: number | null; author: string; body: string; is_deleted: number };
export type AdminUser = { id: number; username: string; role: string; is_banned: number };

function page(title: string, body: string, user: SessionUser): string {
  return layout(title, `<style>
    .admin-nav,.admin-actions,.admin-filter,.admin-pages {display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;align-items:center}
    .admin-actions form {margin:0}.admin-table {overflow-x:auto;margin:12px 0}.admin-table table {min-width:560px}
    .admin-post {white-space:pre-wrap;overflow-wrap:anywhere}.admin-field {display:flex;flex-direction:column;gap:4px;margin:8px 0}
    .admin-field input,.admin-field textarea,.admin-field select {box-sizing:border-box;max-width:100%;padding:6px}
    .admin-panel {border:1px solid #b8cbdc;padding:12px;margin:12px 0;background:#f7f9fb}.admin-panel h3 {margin-top:0}
    @media(max-width:600px) {.admin-filter>label {width:100%}.admin-panel {padding:10px}}
    </style><nav class="admin-nav" aria-label="Administration"><a href="/admin">Overview</a><a href="/admin/threads">Topics &amp; replies</a><a href="/admin/users">Users</a><a href="/admin/boards">Categories &amp; boards</a></nav><h2 class="page-title">${escapeHtml(title)}</h2>${body}`, user);
}
function tokenField(csrf: string): string {
  return `<input type="hidden" name="csrf_token" value="${escapeHtml(csrf)}">`;
}
function actionForm(url: string, label: string, csrf: string): string {
  return `<form method="post" action="${escapeHtml(url)}">${tokenField(csrf)}<button class="btn" type="submit">${escapeHtml(label)}</button></form>`;
}
function pagination(path: string, page: number, total: number, filters: Record<string, string> = {}): string {
  const pages = Math.max(1, Math.ceil(total / 50));
  const url = (number: number) => escapeHtml(`${path}?${new URLSearchParams({ ...filters, page: String(number) })}`);
  return `<nav class="admin-pages" aria-label="Pagination">${page > 1 ? `<a href="${url(page - 1)}">Previous</a>` : ""}<span>Page ${page} of ${pages} · ${total} results</span>${page < pages ? `<a href="${url(page + 1)}">Next</a>` : ""}</nav>`;
}
export function adminHomePage(counts: { users: number; threads: number; replies: number }, user: SessionUser): string {
  return page("Administration", `<p>Manage forum content, accounts and boards.</p><div class="admin-panel"><p>${counts.users} users · ${counts.threads} topics · ${counts.replies} replies</p><p>Totals include deleted content and archived boards. Deletion is reversible; activity points and badges are retained.</p></div>`, user);
}
export function adminThreadsPage(threads: AdminThread[], boards: AdminBoard[], filter: { page: number; total: number; q: string; boardId: number | null; status: string }, user: SessionUser): string {
  const options = boards.filter((b) => b.parent_id !== null).map((b) => `<option value="${b.id}"${b.id === filter.boardId ? " selected" : ""}>${escapeHtml(b.name)}</option>`).join("");
  const rows = threads.map((t) => `<tr><td><a href="/admin/threads/${t.id}">${escapeHtml(t.title)}</a></td><td>${escapeHtml(t.board_name)}</td><td>${t.is_deleted ? "Deleted" : "Active"}${t.is_locked ? " · Locked" : ""}${t.is_pinned ? " · Pinned" : ""}</td><td>${t.reply_count}</td></tr>`).join("");
  return page("Topics & replies", `<form class="admin-filter" method="get" action="/admin/threads"><label class="admin-field">Title<input name="q" value="${escapeHtml(filter.q)}" maxlength="120"></label><label class="admin-field">Board<select name="board_id"><option value="">All boards</option>${options}</select></label><label class="admin-field">Status<select name="status">${["active", "deleted", "all"].map((s) => `<option value="${s}"${s === filter.status ? " selected" : ""}>${s}</option>`).join("")}</select></label><button class="btn" type="submit">Filter</button></form><div class="admin-table"><table class="forum"><tr><th>Topic</th><th>Board</th><th>Status</th><th>Replies</th></tr>${rows || '<tr><td colspan="4">No topics found.</td></tr>'}</table></div>${pagination("/admin/threads", filter.page, filter.total, { q: filter.q, board_id: filter.boardId ? String(filter.boardId) : "", status: filter.status })}`, user);
}
export function adminThreadPage(thread: AdminThread, posts: AdminPost[], boards: AdminBoard[], pageNumber: number, total: number, csrf: string, user: SessionUser): string {
  const actions = [[thread.is_deleted ? "restore" : "delete", thread.is_deleted ? "Restore topic" : "Delete topic"], [thread.is_locked ? "unlock" : "lock", thread.is_locked ? "Unlock" : "Lock"], [thread.is_pinned ? "unpin" : "pin", thread.is_pinned ? "Unpin" : "Pin"]].map(([a, label]) => actionForm(`/admin/threads/${thread.id}/${a}`, label, csrf)).join("");
  const options = boards.map((b) => `<option value="${b.id}"${b.id === thread.board_id ? " selected" : ""}>${escapeHtml(b.name)}</option>`).join("");
  const postHtml = posts.map((p) => {
    const deleted = p.parent_id === null ? thread.is_deleted : p.is_deleted;
    return `<section class="admin-panel" id="post-${p.id}"><h3>Post #${p.id} · ${escapeHtml(p.author)}${p.is_deleted ? " · Deleted" : ""}</h3><p>${p.parent_id === null ? "Opening post: deletion affects the entire topic." : `Reply to #${p.parent_id}`}</p><div class="admin-post">${escapeHtml(p.body)}</div><div class="admin-actions">${actionForm(`/admin/posts/${p.id}/${deleted ? "restore" : "delete"}`, `${deleted ? "Restore" : "Delete"} ${p.parent_id === null ? "topic" : "post"}`, csrf)}</div></section>`;
  }).join("");
  return page(thread.title, `<p>Board: ${escapeHtml(thread.board_name)} · ${thread.is_deleted ? "Deleted" : "Active"}${thread.is_locked ? " · Locked" : ""}${thread.is_pinned ? " · Pinned" : ""}</p><p><a href="/thread/${thread.id}">View public topic</a></p><div class="admin-actions">${actions}</div><form method="post" action="/admin/threads/${thread.id}/move" class="admin-actions">${tokenField(csrf)}<label>Destination <select name="board_id" required>${options}</select></label><button class="btn" type="submit">Move topic</button></form>${postHtml || "<p>No posts.</p>"}${pagination(`/admin/threads/${thread.id}`, pageNumber, total)}`, user);
}
export function adminUsersPage(users: AdminUser[], pageNumber: number, total: number, q: string, csrf: string, user: SessionUser): string {
  const rows = users.map((a) => {
    const actions = a.id === user.id ? "Your account" : a.role === "admin" ? actionForm(`/admin/users/${a.id}/revoke-admin`, "Revoke admin", csrf) : actionForm(`/admin/users/${a.id}/${a.is_banned ? "unban" : "ban"}`, a.is_banned ? "Unban" : "Ban", csrf) + (a.is_banned ? "" : actionForm(`/admin/users/${a.id}/grant-admin`, "Grant admin", csrf));
    return `<tr><td><a href="/user/${encodeURIComponent(a.username)}">${escapeHtml(a.username)}</a></td><td>${escapeHtml(a.role)}</td><td>${a.is_banned ? "Banned" : "Active"}</td><td><div class="admin-actions">${actions}</div></td></tr>`;
  }).join("");
  return page("Users", `<form class="admin-filter" method="get" action="/admin/users"><label class="admin-field">Username<input name="q" value="${escapeHtml(q)}" maxlength="32"></label><button class="btn" type="submit">Search</button></form><p>Demote administrators before banning. You cannot change your own access or remove the last administrator.</p><div class="admin-table"><table class="forum"><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr>${rows || '<tr><td colspan="4">No users found.</td></tr>'}</table></div>${pagination("/admin/users", pageNumber, total, { q })}`, user);
}
function boardFields(board: AdminBoard | null, categories: AdminBoard[]): string {
  const options = categories.map((c) => `<option value="${c.id}"${board?.parent_id === c.id ? " selected" : ""}>${escapeHtml(c.name)}${c.is_archived ? " (archived)" : ""}</option>`).join("");
  const parent = board?.parent_id === null ? '<input type="hidden" name="parent_id" value=""><p>Category</p>' : `<label class="admin-field">${board ? "Category" : "Type / category"}<select name="parent_id">${board ? "" : '<option value="">New category</option>'}${options}</select></label>`;
  return `<label class="admin-field">Name<input name="name" required maxlength="120" value="${escapeHtml(board?.name ?? "")}"></label><label class="admin-field">Description<textarea name="description" maxlength="1000">${escapeHtml(board?.description ?? "")}</textarea></label><label class="admin-field">Sort order<input name="sort_order" type="number" step="1" min="-2147483647" max="2147483647" required value="${board?.sort_order ?? 0}"></label>${parent}`;
}
export function adminBoardsPage(boards: AdminBoard[], categories: AdminBoard[], pageNumber: number, total: number, csrf: string, user: SessionUser): string {
  const panels = boards.map((b) => `<section class="admin-panel"><h3>${escapeHtml(b.name)} · ${b.parent_id === null ? "Category" : `Board in ${escapeHtml(b.parent_name ?? "")}`}${b.is_archived ? " · Archived" : ""}</h3><form method="post" action="/admin/boards/${b.id}/update">${tokenField(csrf)}${boardFields(b, categories)}<button class="btn" type="submit">Save</button></form><div class="admin-actions">${actionForm(`/admin/boards/${b.id}/${b.is_archived ? "restore" : "archive"}`, b.is_archived ? "Restore" : "Archive", csrf)}</div></section>`).join("");
  return page("Categories & boards", `<p>Archiving hides content and blocks posting. Restoring a category preserves each board's own archive status.</p><section class="admin-panel"><h3>Add category or board</h3><form method="post" action="/admin/boards">${tokenField(csrf)}${boardFields(null, categories)}<button class="btn" type="submit">Create</button></form></section>${panels}${pagination("/admin/boards", pageNumber, total)}`, user);
}
