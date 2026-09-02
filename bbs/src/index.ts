import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  isValidEmail,
  readSessionUser,
  sanitizeUsername,
  sessionExpiry,
  setSessionCookie,
  verifyPassword,
  SESSION_COOKIE,
} from "./auth";
import {
  awardRegisteredBadge,
  checkRateLimit,
  createPasswordResetToken,
  createReply,
  createSession,
  createThread,
  createUser,
  deletePasswordResetToken,
  deleteSession,
  ensureSchema,
  getAuthorProfiles,
  getBoard,
  getBoardIndex,
  getCategory,
  getPasswordReset,
  getPosts,
  getThread,
  getThreads,
  getUserByEmail,
  getUserByUsername,
  getUserProfile,
  isLeafBoard,
  seedBoardsIfEmpty,
  updateUserPassword,
  type Env,
} from "./db";
import {
  boardIndexPage,
  categoryPage,
  errorPage,
  forgotPasswordPage,
  forgotPasswordSentPage,
  loginPage,
  newThreadPage,
  profilePage,
  registerPage,
  resetPasswordDonePage,
  resetPasswordPage,
  threadListPage,
  threadPage,
  type AuthorDisplay,
} from "./html";

const app = new Hono<{ Bindings: Env }>();
const RESET_TOKEN_HOURS = 1;

app.use("*", async (c, next) => {
  await ensureSchema(c.env.DB);
  await seedBoardsIfEmpty(c.env.DB);
  await next();
});

function safeNextPath(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

function isLocalHost(c: { req: { url: string } }): boolean {
  const host = new URL(c.req.url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  return isValidEmail(email) ? email : null;
}

function toAuthorDisplayMap(
  profiles: Map<string, { username: string; points: number; level: string; post_count: number; thread_count: number; badges: { id: string; name: string; description: string }[] }>,
): Map<string, AuthorDisplay> {
  const map = new Map<string, AuthorDisplay>();
  for (const [key, profile] of profiles) {
    map.set(key, profile);
  }
  return map;
}

async function authorProfilesForPosts(
  db: D1Database,
  posts: { author: string }[],
): Promise<Map<string, AuthorDisplay>> {
  const usernames = posts.map((p) => p.author);
  const profiles = await getAuthorProfiles(db, usernames);
  return toAuthorDisplayMap(profiles);
}

app.get("/user/:username", async (c) => {
  const sessionUser = await readSessionUser(c);
  const username = sanitizeUsername(c.req.param("username"));
  if (username.length < 2) {
    return c.html(errorPage("Invalid username.", sessionUser), 400);
  }

  const profile = await getUserProfile(c.env.DB, username);
  if (!profile) return c.html(errorPage("User not found.", sessionUser), 404);

  return c.html(profilePage(profile, sessionUser));
});

app.get("/", async (c) => {
  const user = await readSessionUser(c);
  const sections = await getBoardIndex(c.env.DB);
  return c.html(boardIndexPage(sections, user));
});

app.get("/category/:id", async (c) => {
  const user = await readSessionUser(c);
  const categoryId = Number(c.req.param("id"));
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return c.html(errorPage("Invalid category.", user), 400);
  }

  const section = await getCategory(c.env.DB, categoryId);
  if (!section) return c.html(errorPage("Category not found.", user), 404);

  return c.html(categoryPage(section, user));
});

app.get("/register", async (c) => {
  const user = await readSessionUser(c);
  if (user) return c.redirect("/", 303);
  return c.html(registerPage());
});

app.post("/register", async (c) => {
  const user = await readSessionUser(c);
  if (user) return c.redirect("/", 303);

  const form = await c.req.parseBody();
  const emailRaw = String(form.email ?? "").trim();
  const username = sanitizeUsername(String(form.username ?? ""));
  const password = String(form.password ?? "");
  const passwordConfirm = String(form.password_confirm ?? "");

  if (username.length < 2) {
    return c.html(registerPage("Username must be at least 2 characters."), 400);
  }
  if (password.length < 8) {
    return c.html(registerPage("Password must be at least 8 characters."), 400);
  }
  if (password !== passwordConfirm) {
    return c.html(registerPage("Passwords do not match."), 400);
  }

  let email: string | null = null;
  if (emailRaw) {
    if (!isValidEmail(emailRaw)) {
      return c.html(registerPage("Enter a valid email address or leave it blank."), 400);
    }
    email = emailRaw.toLowerCase();
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, ip, "register");
  if (!allowed) {
    return c.html(registerPage("Too many attempts. Please wait a minute."), 429);
  }

  const existingUser = await getUserByUsername(c.env.DB, username);
  if (existingUser) {
    return c.html(registerPage("That username is already taken."), 409);
  }

  if (email) {
    const existingEmail = await getUserByEmail(c.env.DB, email);
    if (existingEmail) {
      return c.html(registerPage("That email is already registered."), 409);
    }
  }

  const passwordHash = await hashPassword(password);
  const userId = await createUser(c.env.DB, email, username, passwordHash);
  if (!userId) {
    return c.html(registerPage("Registration failed. Try again."), 500);
  }

  await awardRegisteredBadge(c.env.DB, userId);

  const token = createSessionToken();
  const expiresAt = sessionExpiry();
  await createSession(c.env.DB, token, userId, expiresAt);
  setSessionCookie(c, token, expiresAt);
  return c.redirect("/", 303);
});

app.get("/login", async (c) => {
  const user = await readSessionUser(c);
  if (user) return c.redirect("/", 303);
  const next = c.req.query("next");
  return c.html(loginPage(undefined, next));
});

app.post("/login", async (c) => {
  const user = await readSessionUser(c);
  if (user) return c.redirect("/", 303);

  const form = await c.req.parseBody();
  const username = sanitizeUsername(String(form.username ?? ""));
  const password = String(form.password ?? "");
  const next = safeNextPath(String(form.next ?? ""));

  if (username.length < 2 || !password) {
    return c.html(loginPage("Invalid username or password.", next), 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, ip, "login");
  if (!allowed) {
    return c.html(loginPage("Too many attempts. Please wait a minute.", next), 429);
  }

  const account = await getUserByUsername(c.env.DB, username);
  if (!account || !(await verifyPassword(password, account.password_hash))) {
    return c.html(loginPage("Invalid username or password.", next), 401);
  }

  const token = createSessionToken();
  const expiresAt = sessionExpiry();
  await createSession(c.env.DB, token, account.id, expiresAt);
  setSessionCookie(c, token, expiresAt);
  return c.redirect(next, 303);
});

app.get("/reset-password", async (c) => {
  const user = await readSessionUser(c);
  if (user) return c.redirect("/", 303);
  return c.html(forgotPasswordPage());
});

app.post("/reset-password", async (c) => {
  const user = await readSessionUser(c);
  if (user) return c.redirect("/", 303);

  const form = await c.req.parseBody();
  const email = normalizeEmail(String(form.email ?? ""));

  if (!email) {
    return c.html(forgotPasswordPage("Enter a valid email address."), 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, ip, "reset");
  if (!allowed) {
    return c.html(forgotPasswordPage("Too many attempts. Please wait a minute."), 429);
  }

  const account = await getUserByEmail(c.env.DB, email);
  let resetUrl: string | undefined;
  if (account?.email) {
    const token = createSessionToken();
    const expiresAt = Math.floor(Date.now() / 1000) + RESET_TOKEN_HOURS * 3600;
    await createPasswordResetToken(c.env.DB, account.id, token, expiresAt);
    resetUrl = `/reset-password/${token}`;
    // TODO: send email with reset link in production
  }

  const origin = new URL(c.req.url).origin;
  return c.html(
    forgotPasswordSentPage(
      resetUrl ? `${origin}${resetUrl}` : undefined,
      isLocalHost(c),
    ),
  );
});

app.get("/reset-password/:token", async (c) => {
  const token = c.req.param("token");
  const reset = await getPasswordReset(c.env.DB, token);
  if (!reset) {
    return c.html(errorPage("This reset link is invalid or has expired."), 400);
  }
  return c.html(resetPasswordPage(token));
});

app.post("/reset-password/:token", async (c) => {
  const token = c.req.param("token");
  const reset = await getPasswordReset(c.env.DB, token);
  if (!reset) {
    return c.html(errorPage("This reset link is invalid or has expired."), 400);
  }

  const form = await c.req.parseBody();
  const password = String(form.password ?? "");
  const passwordConfirm = String(form.password_confirm ?? "");

  if (password.length < 8) {
    return c.html(resetPasswordPage(token, "Password must be at least 8 characters."), 400);
  }
  if (password !== passwordConfirm) {
    return c.html(resetPasswordPage(token, "Passwords do not match."), 400);
  }

  const passwordHash = await hashPassword(password);
  await updateUserPassword(c.env.DB, reset.user_id, passwordHash);
  await deletePasswordResetToken(c.env.DB, token);
  return c.html(resetPasswordDonePage());
});

app.get("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await deleteSession(c.env.DB, token);
  clearSessionCookie(c);
  return c.redirect("/", 303);
});

app.post("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await deleteSession(c.env.DB, token);
  clearSessionCookie(c);
  return c.redirect("/", 303);
});

app.get("/board/:id", async (c) => {
  const user = await readSessionUser(c);
  const boardId = Number(c.req.param("id"));
  if (!Number.isInteger(boardId) || boardId < 1) {
    return c.html(errorPage("Invalid board.", user), 400);
  }

  const board = await getBoard(c.env.DB, boardId);
  if (!board) return c.html(errorPage("Board not found.", user), 404);
  if (!isLeafBoard(board)) {
    return c.redirect(`/category/${board.id}`, 303);
  }

  const threads = await getThreads(c.env.DB, boardId);
  return c.html(threadListPage(board, threads, user));
});

app.get("/board/:id/new", async (c) => {
  const user = await readSessionUser(c);
  if (!user) {
    const boardId = c.req.param("id");
    return c.redirect(`/login?next=${encodeURIComponent(`/board/${boardId}/new`)}`, 303);
  }

  const boardId = Number(c.req.param("id"));
  if (!Number.isInteger(boardId) || boardId < 1) {
    return c.html(errorPage("Invalid board.", user), 400);
  }

  const board = await getBoard(c.env.DB, boardId);
  if (!board) return c.html(errorPage("Board not found.", user), 404);
  if (!isLeafBoard(board)) {
    return c.html(errorPage("Choose a sub-board to post in.", user), 400);
  }

  return c.html(newThreadPage(board, user));
});

app.post("/board/:id/new", async (c) => {
  const user = await readSessionUser(c);
  if (!user) return c.redirect("/login", 303);

  const boardId = Number(c.req.param("id"));
  if (!Number.isInteger(boardId) || boardId < 1) {
    return c.html(errorPage("Invalid board.", user), 400);
  }

  const board = await getBoard(c.env.DB, boardId);
  if (!board) return c.html(errorPage("Board not found.", user), 404);
  if (!isLeafBoard(board)) {
    return c.html(errorPage("Choose a sub-board to post in.", user), 400);
  }

  const form = await c.req.parseBody();
  const title = String(form.title ?? "");
  const body = String(form.body ?? "");

  if (!title.trim() || !body.trim()) {
    return c.html(newThreadPage(board, user, "Subject and message are required."), 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, ip, "post");
  if (!allowed) {
    return c.html(
      newThreadPage(board, user, "Rate limit exceeded. Please wait a minute."),
      429,
    );
  }

  const threadId = await createThread(
    c.env.DB,
    boardId,
    user.id,
    user.username,
    body,
    title,
  );
  return c.redirect(`/thread/${threadId}`, 303);
});

app.get("/thread/:id", async (c) => {
  const user = await readSessionUser(c);
  const threadId = Number(c.req.param("id"));
  if (!Number.isInteger(threadId) || threadId < 1) {
    return c.html(errorPage("Invalid thread.", user), 400);
  }

  const thread = await getThread(c.env.DB, threadId);
  if (!thread) return c.html(errorPage("Thread not found.", user), 404);

  const board = await getBoard(c.env.DB, thread.board_id);
  if (!board) return c.html(errorPage("Board not found.", user), 404);
  if (!isLeafBoard(board)) {
    return c.html(errorPage("Board not found.", user), 404);
  }

  const posts = await getPosts(c.env.DB, threadId);
  const authorProfiles = await authorProfilesForPosts(c.env.DB, posts);
  return c.html(threadPage(board, thread, posts, user, authorProfiles));
});

app.post("/thread/:id/reply", async (c) => {
  const user = await readSessionUser(c);
  if (!user) return c.redirect("/login", 303);

  const threadId = Number(c.req.param("id"));
  if (!Number.isInteger(threadId) || threadId < 1) {
    return c.html(errorPage("Invalid thread.", user), 400);
  }

  const thread = await getThread(c.env.DB, threadId);
  if (!thread) return c.html(errorPage("Thread not found.", user), 404);

  const board = await getBoard(c.env.DB, thread.board_id);
  if (!board) return c.html(errorPage("Board not found.", user), 404);
  if (!isLeafBoard(board)) {
    return c.html(errorPage("Board not found.", user), 404);
  }

  const form = await c.req.parseBody();
  const body = String(form.body ?? "");

  if (!body.trim()) {
    const posts = await getPosts(c.env.DB, threadId);
    const authorProfiles = await authorProfilesForPosts(c.env.DB, posts);
    return c.html(
      threadPage(board, thread, posts, user, authorProfiles, "Message cannot be empty."),
      400,
    );
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env.DB, ip, "post");
  if (!allowed) {
    const posts = await getPosts(c.env.DB, threadId);
    const authorProfiles = await authorProfilesForPosts(c.env.DB, posts);
    return c.html(
      threadPage(board, thread, posts, user, authorProfiles, "Rate limit exceeded. Please wait a minute."),
      429,
    );
  }

  await createReply(c.env.DB, threadId, user.id, user.username, body);
  return c.redirect(`/thread/${threadId}`, 303);
});

export default app;
