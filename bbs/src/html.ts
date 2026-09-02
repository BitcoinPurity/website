import type { SessionUser } from "./auth";

export type AuthorDisplay = {
  username: string;
  points: number;
  level: string;
  post_count: number;
  thread_count: number;
  badges: { id: string; name: string; description: string }[];
};

export type ProfileDisplay = AuthorDisplay & {
  id: number;
  email: string | null;
  created_at: number;
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toUTCString().replace("GMT", "UTC");
}

const STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Verdana, Arial, Helvetica, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    color: #000;
    background: #e8e8e8;
  }
  a { color: #003366; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .topbar {
    background: linear-gradient(#2a4a6b, #1a3a5c);
    color: #fff;
    padding: 6px 12px;
    border-bottom: 2px solid #0d2840;
  }
  .topbar a { color: #cce0ff; }
  .topbar strong { color: #fff; font-size: 14px; }
  .nav { padding: 4px 12px; background: #d4d4d4; border-bottom: 1px solid #aaa; font-size: 11px; }
  .nav-user { float: right; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 8px 12px 24px; }
  table.forum { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 12px; }
  table.forum th {
    background: #6b8cae;
    color: #fff;
    text-align: left;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #4a6a8c;
  }
  table.forum td {
    padding: 6px 8px;
    border: 1px solid #ccc;
    vertical-align: top;
  }
  table.forum tr.alt td { background: #f5f5f5; }
  .category-head td {
    background: #d8e4f0;
    font-weight: bold;
    font-size: 13px;
    color: #1a3a5c;
    border: 1px solid #4a6a8c;
  }
  .category-desc { font-weight: normal; font-size: 11px; color: #555; margin-top: 2px; }
  .board-name { font-size: 13px; font-weight: bold; }
  .board-desc { color: #555; font-size: 11px; margin-top: 2px; }
  .stats { text-align: center; white-space: nowrap; font-size: 11px; }
  .lastpost { font-size: 11px; }
  .thread-title { font-size: 13px; }
  .postbox { margin-bottom: 8px; border: 1px solid #ccc; background: #fff; }
  .postbox .header {
    background: #6b8cae;
    color: #fff;
    padding: 4px 8px;
    font-size: 11px;
    border-bottom: 1px solid #4a6a8c;
  }
  .postbox .body { display: table; width: 100%; }
  .postbox .author {
    display: table-cell;
    width: 160px;
    padding: 8px;
    background: #f0f0f0;
    border-right: 1px solid #ccc;
    vertical-align: top;
    font-size: 11px;
  }
  .postbox .author .name { font-weight: bold; font-size: 12px; color: #003366; }
  .postbox .content {
    display: table-cell;
    padding: 10px 12px;
    vertical-align: top;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .formbox {
    background: #fff;
    border: 1px solid #ccc;
    padding: 12px;
    margin-top: 12px;
  }
  .formbox label { display: block; margin-bottom: 4px; font-weight: bold; }
  .formbox input[type="text"],
  .formbox input[type="email"],
  .formbox input[type="password"],
  .formbox textarea {
    width: 100%;
    font-family: Verdana, Arial, sans-serif;
    font-size: 12px;
    padding: 4px 6px;
    border: 1px solid #999;
    margin-bottom: 10px;
  }
  .formbox textarea { min-height: 120px; resize: vertical; }
  .btn {
    background: #6b8cae;
    color: #fff;
    border: 1px solid #4a6a8c;
    padding: 5px 14px;
    font-size: 12px;
    cursor: pointer;
  }
  .btn:hover { background: #5a7c9e; }
  .notice {
    background: #fff8dc;
    border: 1px solid #daa520;
    padding: 8px 12px;
    margin-bottom: 12px;
    font-size: 11px;
  }
  .error {
    background: #ffe0e0;
    border: 1px solid #c00;
    padding: 8px 12px;
    margin-bottom: 12px;
    color: #800;
  }
  .breadcrumb { font-size: 11px; margin-bottom: 8px; color: #555; }
  .footer {
    text-align: center;
    font-size: 10px;
    color: #888;
    padding: 16px;
    border-top: 1px solid #ccc;
    margin-top: 20px;
  }
  h2.page-title { font-size: 16px; margin: 8px 0 12px; color: #1a3a5c; }
  .auth-narrow { max-width: 420px; }
  .author-meta { margin-top: 8px; color: #555; line-height: 1.5; }
  .author-level { color: #1a3a5c; font-weight: bold; margin-top: 6px; }
  .badge-pill {
    display: inline-block;
    background: #e8f0f8;
    border: 1px solid #6b8cae;
    color: #1a3a5c;
    font-size: 10px;
    padding: 1px 5px;
    margin: 2px 2px 0 0;
  }
  .profile-header {
    background: #fff;
    border: 1px solid #ccc;
    padding: 16px;
    margin-bottom: 16px;
  }
  .profile-stats { margin-top: 10px; color: #555; }
  .badge-grid { margin-top: 16px; }
  .badge-item {
    display: inline-block;
    background: #fff;
    border: 1px solid #ccc;
    padding: 8px 10px;
    margin: 0 8px 8px 0;
    min-width: 140px;
    vertical-align: top;
  }
  .badge-item strong { display: block; color: #1a3a5c; margin-bottom: 4px; }
  .badge-item span { color: #666; font-size: 11px; }
`;

function renderAuthorSidebar(author: string, profile: AuthorDisplay | undefined): string {
  if (!profile) {
    return `<div class="author">
          <div class="name">${escapeHtml(author)}</div>
        </div>`;
  }

  const badges = profile.badges
    .map((b) => `<span class="badge-pill" title="${escapeHtml(b.description)}">${escapeHtml(b.name)}</span>`)
    .join("");

  return `<div class="author">
          <div class="name"><a href="/user/${escapeHtml(profile.username)}">${escapeHtml(profile.username)}</a></div>
          <div class="author-level">${escapeHtml(profile.level)}</div>
          <div class="author-meta">
            Activity: ${profile.points}<br>
            Posts: ${profile.post_count}<br>
            Topics: ${profile.thread_count}
          </div>
          ${badges ? `<div style="margin-top:8px">${badges}</div>` : ""}
        </div>`;
}

function navBar(user: SessionUser | null): string {
  const authLinks = user
    ? `<span class="nav-user"><a href="/user/${escapeHtml(user.username)}">${escapeHtml(user.username)}</a> · ${escapeHtml(user.level)} · ${user.points} pts &nbsp;|&nbsp; <a href="/logout">Logout</a></span>`
    : `<span class="nav-user"><a href="/login">Login</a> &nbsp;|&nbsp; <a href="/register">Register</a></span>`;

  return `<div class="nav">
    <a href="/">Board index</a>
    &nbsp;|&nbsp;
    Registration required to post
    ${authLinks}
  </div>`;
}

export function layout(
  title: string,
  body: string,
  user: SessionUser | null = null,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Bitcoin Purity BBS</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="topbar">
    <strong>Bitcoin Purity BBS</strong>
    &nbsp;·&nbsp;
    <a href="/">bbs.bitcoinpurity.org</a>
    &nbsp;·&nbsp;
    <a href="https://bitcoinpurity.org">bitcoinpurity.org</a>
  </div>
  ${navBar(user)}
  <div class="wrap">
    ${body}
  </div>
  <div class="footer">
    Bitcoin Purity BBS · Username login · Optional email for password reset
  </div>
</body>
</html>`;
}

export function breadcrumb(items: { label: string; href?: string }[]): string {
  const parts = items.map((item) =>
    item.href
      ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
      : escapeHtml(item.label),
  );
  return `<div class="breadcrumb">${parts.join(" &raquo; ")}</div>`;
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

function boardStatsCells(b: BoardStats): string {
  const lastPost = b.last_post_at
    ? `<div class="lastpost"><a href="/thread/${b.last_thread_id}">${escapeHtml(b.last_thread_title ?? "")}</a><br>${formatDate(b.last_post_at)}</div>`
    : `<span style="color:#999">No posts yet</span>`;
  return `<td>
      <div class="board-name"><a href="/board/${b.id}">${escapeHtml(b.name)}</a></div>
      <div class="board-desc">${escapeHtml(b.description)}</div>
    </td>
    <td class="stats">${b.thread_count}<br><span style="color:#888">${b.post_count} posts</span></td>
    <td class="lastpost">${lastPost}</td>`;
}

export function boardIndexPage(
  sections: CategorySection[],
  user: SessionUser | null,
): string {
  const tables = sections
    .map((section) => {
      const rows =
        section.boards.length === 0
          ? `<tr><td colspan="3" style="color:#888;padding:12px">No sub-boards yet.</td></tr>`
          : section.boards
              .map(
                (b, i) =>
                  `<tr class="${i % 2 ? "alt" : ""}">${boardStatsCells(b)}</tr>`,
              )
              .join("");

      return `<table class="forum">
      <tr class="category-head">
        <td colspan="3">
          <a href="/category/${section.id}">${escapeHtml(section.name)}</a>
          <div class="category-desc">${escapeHtml(section.description)}</div>
        </td>
      </tr>
      <tr>
        <th style="width:55%">Board</th>
        <th style="width:12%">Topics</th>
        <th style="width:33%">Last post</th>
      </tr>
      ${rows}
    </table>`;
    })
    .join("");

  const loginHint = user
    ? ""
    : `<div class="notice"><a href="/register">Register</a> with a username to start posting. Email is optional — add one to enable password reset.</div>`;

  return layout(
    "Board index",
    `
    <h2 class="page-title">Bitcoin Purity — Board Index</h2>
    ${loginHint}
    ${tables}
  `,
    user,
  );
}

export function categoryPage(
  section: CategorySection,
  user: SessionUser | null,
): string {
  const rows =
    section.boards.length === 0
      ? `<tr><td colspan="3" style="text-align:center;color:#888;padding:20px">No sub-boards in this category.</td></tr>`
      : section.boards
          .map(
            (b, i) =>
              `<tr class="${i % 2 ? "alt" : ""}">${boardStatsCells(b)}</tr>`,
          )
          .join("");

  return layout(
    section.name,
    `
    ${breadcrumb([
      { label: "Board index", href: "/" },
      { label: section.name },
    ])}
    <h2 class="page-title">${escapeHtml(section.name)}</h2>
    <p style="margin:0 0 12px;color:#555">${escapeHtml(section.description)}</p>
    <table class="forum">
      <tr>
        <th style="width:55%">Board</th>
        <th style="width:12%">Topics</th>
        <th style="width:33%">Last post</th>
      </tr>
      ${rows}
    </table>
  `,
    user,
  );
}

export type ThreadRow = {
  id: number;
  title: string;
  author: string;
  created_at: number;
  last_post_at: number;
  reply_count: number;
};

export function threadListPage(
  board: { id: number; name: string; parent_id: number; parent_name: string | null },
  threads: ThreadRow[],
  user: SessionUser | null,
): string {
  const newTopicLink = user
    ? `<p style="margin-bottom:10px"><a href="/board/${board.id}/new" class="btn" style="display:inline-block;text-decoration:none">+ New topic</a></p>`
    : `<p style="margin-bottom:10px"><a href="/login">Login</a> to start a new topic.</p>`;

  const rows =
    threads.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#888;padding:20px">No topics yet.${user ? ` <a href="/board/${board.id}/new">Start one</a>.` : ""}</td></tr>`
      : threads
          .map((t, i) => {
            const replies = t.reply_count > 0 ? t.reply_count : 0;
            return `<tr class="${i % 2 ? "alt" : ""}">
          <td class="thread-title"><a href="/thread/${t.id}">${escapeHtml(t.title)}</a></td>
          <td>${escapeHtml(t.author)}</td>
          <td class="stats">${replies}</td>
          <td class="lastpost">${formatDate(t.last_post_at)}</td>
        </tr>`;
          })
          .join("");

  return layout(
    board.name,
    `
    ${breadcrumb([
      { label: "Board index", href: "/" },
      ...(board.parent_name
        ? [{ label: board.parent_name, href: `/category/${board.parent_id}` }]
        : []),
      { label: board.name },
    ])}
    <h2 class="page-title">${escapeHtml(board.name)}</h2>
    ${newTopicLink}
    <table class="forum">
      <tr>
        <th style="width:50%">Topic</th>
        <th style="width:18%">Started by</th>
        <th style="width:10%">Replies</th>
        <th style="width:22%">Last post</th>
      </tr>
      ${rows}
    </table>
  `,
    user,
  );
}

export type PostRow = {
  id: number;
  author: string;
  body: string;
  created_at: number;
};

export function threadPage(
  board: { id: number; name: string; parent_id: number; parent_name: string | null },
  thread: { id: number; title: string },
  posts: PostRow[],
  user: SessionUser | null,
  authorProfiles: Map<string, AuthorDisplay>,
  error?: string,
): string {
  const postHtml = posts
    .map(
      (p) => `<div class="postbox">
      <div class="header">${formatDate(p.created_at)}</div>
      <div class="body">
        ${renderAuthorSidebar(p.author, authorProfiles.get(p.author.toLowerCase()))}
        <div class="content">${escapeHtml(p.body)}</div>
      </div>
    </div>`,
    )
    .join("");

  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : "";

  const replyForm = user
    ? `<div class="formbox">
      <form method="post" action="/thread/${thread.id}/reply">
        <p style="margin:0 0 10px;color:#555">Posting as <strong>${escapeHtml(user.username)}</strong></p>
        <label>Message</label>
        <textarea name="body" required maxlength="10000"></textarea>
        <button type="submit" class="btn">Post reply</button>
      </form>
    </div>`
    : `<div class="notice"><a href="/login">Login</a> or <a href="/register">register</a> to reply.</div>`;

  return layout(
    thread.title,
    `
    ${breadcrumb([
      { label: "Board index", href: "/" },
      ...(board.parent_name
        ? [{ label: board.parent_name, href: `/category/${board.parent_id}` }]
        : []),
      { label: board.name, href: `/board/${board.id}` },
      { label: thread.title },
    ])}
    <h2 class="page-title">${escapeHtml(thread.title)}</h2>
    ${postHtml}
    ${errorHtml}
    ${replyForm}
  `,
    user,
  );
}

export function newThreadPage(
  board: { id: number; name: string; parent_id: number; parent_name: string | null },
  user: SessionUser,
  error?: string,
): string {
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : "";

  return layout(
    `New topic — ${board.name}`,
    `
    ${breadcrumb([
      { label: "Board index", href: "/" },
      ...(board.parent_name
        ? [{ label: board.parent_name, href: `/category/${board.parent_id}` }]
        : []),
      { label: board.name, href: `/board/${board.id}` },
      { label: "New topic" },
    ])}
    <h2 class="page-title">New topic in ${escapeHtml(board.name)}</h2>
    ${errorHtml}
    <div class="formbox">
      <form method="post" action="/board/${board.id}/new">
        <p style="margin:0 0 10px;color:#555">Posting as <strong>${escapeHtml(user.username)}</strong></p>
        <label>Subject</label>
        <input type="text" name="title" required maxlength="120">
        <label>Message</label>
        <textarea name="body" required maxlength="10000"></textarea>
        <button type="submit" class="btn">Post topic</button>
      </form>
    </div>
  `,
    user,
  );
}

export function loginPage(error?: string, next?: string): string {
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : "";
  const nextField = next
    ? `<input type="hidden" name="next" value="${escapeHtml(next)}">`
    : "";

  return layout(
    "Login",
    `
    <h2 class="page-title">Login</h2>
    ${errorHtml}
    <div class="formbox auth-narrow">
      <form method="post" action="/login">
        ${nextField}
        <label>Username</label>
        <input type="text" name="username" required minlength="2" maxlength="32" autocomplete="username">
        <label>Password</label>
        <input type="password" name="password" required minlength="8" autocomplete="current-password">
        <button type="submit" class="btn">Login</button>
      </form>
      <p style="margin-top:12px">No account? <a href="/register">Register</a> · <a href="/reset-password">Forgot password</a></p>
    </div>
  `,
  );
}

export function registerPage(error?: string): string {
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : "";

  return layout(
    "Register",
    `
    <h2 class="page-title">Register</h2>
    <div class="notice">Register with a username and password. Email is optional — only used to reset your password.</div>
    ${errorHtml}
    <div class="formbox auth-narrow">
      <form method="post" action="/register">
        <label>Username <span style="font-weight:normal;color:#666">(display name)</span></label>
        <input type="text" name="username" required minlength="2" maxlength="32" autocomplete="username">
        <label>Email <span style="font-weight:normal;color:#666">(optional, for password reset)</span></label>
        <input type="email" name="email" maxlength="254" autocomplete="email">
        <label>Password</label>
        <input type="password" name="password" required minlength="8" autocomplete="new-password">
        <label>Confirm password</label>
        <input type="password" name="password_confirm" required minlength="8" autocomplete="new-password">
        <button type="submit" class="btn">Create account</button>
      </form>
      <p style="margin-top:12px">Already registered? <a href="/login">Login</a></p>
    </div>
  `,
  );
}

export function forgotPasswordPage(error?: string): string {
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : "";

  return layout(
    "Reset password",
    `
    <h2 class="page-title">Reset password</h2>
    <div class="notice">Enter the email address on your account. Password reset only works if you added an email when registering.</div>
    ${errorHtml}
    <div class="formbox auth-narrow">
      <form method="post" action="/reset-password">
        <label>Email</label>
        <input type="email" name="email" required maxlength="254" autocomplete="email">
        <button type="submit" class="btn">Send reset link</button>
      </form>
      <p style="margin-top:12px"><a href="/login">Back to login</a></p>
    </div>
  `,
  );
}

export function forgotPasswordSentPage(
  resetUrl?: string,
  isLocal = false,
): string {
  const devLink =
    isLocal && resetUrl
      ? `<div class="notice">Local dev — reset link: <a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></div>`
      : "";

  return layout(
    "Reset password",
    `
    <h2 class="page-title">Check your email</h2>
    <div class="notice">If an account with that email exists, a password reset link has been sent.</div>
    ${devLink}
    <p><a href="/login">Back to login</a></p>
  `,
  );
}

export function resetPasswordPage(
  token: string,
  error?: string,
): string {
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : "";

  return layout(
    "Choose new password",
    `
    <h2 class="page-title">Choose new password</h2>
    ${errorHtml}
    <div class="formbox auth-narrow">
      <form method="post" action="/reset-password/${escapeHtml(token)}">
        <label>New password</label>
        <input type="password" name="password" required minlength="8" autocomplete="new-password">
        <label>Confirm new password</label>
        <input type="password" name="password_confirm" required minlength="8" autocomplete="new-password">
        <button type="submit" class="btn">Update password</button>
      </form>
    </div>
  `,
  );
}

export function resetPasswordDonePage(): string {
  return layout(
    "Password updated",
    `
    <h2 class="page-title">Password updated</h2>
    <div class="notice">Your password has been changed. You can now log in.</div>
    <p><a href="/login">Login</a></p>
  `,
  );
}

export function profilePage(profile: ProfileDisplay, user: SessionUser | null): string {
  const badges =
    profile.badges.length === 0
      ? `<p style="color:#888">No badges yet.</p>`
      : profile.badges
          .map(
            (b) =>
              `<div class="badge-item"><strong>${escapeHtml(b.name)}</strong><span>${escapeHtml(b.description)}</span></div>`,
          )
          .join("");

  return layout(
    profile.username,
    `
    ${breadcrumb([{ label: "Board index", href: "/" }, { label: profile.username }])}
    <div class="profile-header">
      <h2 class="page-title" style="margin-top:0">${escapeHtml(profile.username)}</h2>
      <p class="author-level">${escapeHtml(profile.level)} · ${profile.points} activity points</p>
      <div class="profile-stats">
        Posts: ${profile.post_count} · Topics: ${profile.thread_count}<br>
        Member since ${formatDate(profile.created_at)}
      </div>
    </div>
    <h3 style="font-size:14px;color:#1a3a5c">Badges</h3>
    <div class="badge-grid">${badges}</div>
  `,
    user,
  );
}

export function errorPage(
  message: string,
  user: SessionUser | null = null,
): string {
  return layout(
    "Error",
    `<div class="error">${escapeHtml(message)}</div><p><a href="/">Return to board index</a></p>`,
    user,
  );
}
