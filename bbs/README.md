# Bitcoin Purity BBS

Anonymous bulletin board at `bbs.bitcoinpurity.org`, styled after classic bitcointalk.org forums.

Built as a Cloudflare Worker with D1 (SQLite). **Username + password registration** — email is optional and only used for password reset. Browse boards without an account.

## Activity, levels, and badges

- **Points:** new topic +5, reply +2
- **Levels:** Newbie → Jr. Member → Member → Full Member → Sr. Member → Hero Member → Legendary (by activity points)
- **Badges:** auto-awarded milestones (registered, first topic, first reply, post counts, activity thresholds)
- **Profile:** `/user/:username` — public stats and badges

Levels and badges are display-only; they do not change posting permissions.

## New topic counts

Signed-in users see each board's new topic count on the board index, category pages, and board pages. Each unread topic counts once, including previously read topics with new replies. Topics without a reading record count as unread; listing a board does not mark its topics read.

Opening a topic records the posts displayed in that response. New replies make it unread again. Reading progress is stored per account and shared across devices; guests are prompted to log in. Counts include the whole board, beyond the 100 topics shown in the list. Existing databases gain the reading-record table automatically after deployment.

## Develop

The BBS has its own navy speech-bubble Bitcoin favicon, separate from the main site's gold coin. `public/favicon.svg` is the vector source; the 16px/32px PNGs and two-size ICO are generated from it. Wrangler serves these same-origin assets directly, and the shared page template uses them across public and administration pages.

```bash
cd bbs
npm install
npm run dev
```

Open http://localhost:8787. Local D1 is created automatically; boards are seeded on first request.

Initialization saves a version marker in `bbs_migrations` only after schema upgrades and board seeding succeed. Subsequent page requests read that marker once instead of repeating migration work, including on fresh Worker instances. Bump `DATABASE_VERSION` in `src/db.ts` whenever schema, default boards, or backfills change. Topic author profiles and badges are fetched in one D1 batch, regardless of author count.

Dynamic responses include `Server-Timing` for initialization and total Worker handler time. Topic responses also report session, thread, board, posts, authors, and signed-in reading-progress stages. Compare these milliseconds with Chrome's Waiting for server response to distinguish handler waits from delays outside the handler. Workers timers advance with I/O, so these metrics identify I/O waits rather than precise CPU duration. Headers contain no account, session, or SQL content.

Smart Placement is enabled in `wrangler.jsonc` to reduce repeated Worker-to-D1 round trips. After deployment, Cloudflare may need up to 15 minutes and consistent traffic from multiple locations to choose a placement. Check the Worker placement status in Cloudflare and compare `Server-Timing` from the same client location before and after; a local dry run cannot confirm a production placement decision.

Run board initialization, moderation, permissions and migration tests with Node.js 24:

```bash
npm test
npm run typecheck
```

## Deploy

1. Create the D1 database (once):

```bash
npx wrangler d1 create bitcoinpurity-bbs
```

Copy the `database_id` into `wrangler.jsonc`.

2. For a **new installation only**, apply schema and seed to production:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

3. Deploy the worker:

```bash
npm run deploy
```

The existing production Worker is named `bbs` and serves `bbs.bitcoinpurity.org/*`. To update that installation, override the default Worker name:

```bash
npm run deploy -- --name bbs
```

4. In Cloudflare DNS, add a CNAME or route `bbs.bitcoinpurity.org` to the worker. In the Cloudflare dashboard, add a custom domain or route:

```jsonc
"routes": [
  { "pattern": "bbs.bitcoinpurity.org/*", "zone_name": "bitcoinpurity.org" }
]
```

## Boards

Public categories use `/category/:slug`, boards use `/board/:slug` and new topics use `/board/:slug/new`. Slugs are generated from board names and stored with a unique index; duplicate names receive a numeric suffix. Renaming a board or moving it to another category keeps its URL. Legacy numeric GET URLs redirect permanently with query parameters preserved; existing numeric POST forms still work. Topic URLs retain their IDs. Category links and breadcrumbs use stored slugs; renaming a category preserves its URL. Categories and boards share the unique slug index, and existing board slugs are preserved during category backfill.

Existing databases gain and backfill the slug column automatically after deployment. Do not rerun schema or seed scripts to upgrade an existing installation.

- Announcement — official announcements, releases, and project updates; listed first under Bitcoin Purity. Added automatically to existing databases on the first request after deployment.
- Bitcoin Purity Discussion
- Mining
- Development
- Meta

## Administration

`/admin` uses the existing forum login. Only administrators see the Admin navigation link or can access the management routes. It provides totals, topic/reply moderation, user bans and administrator access, and two-level category/board management. Lists have 50 results per page.

Topics can be deleted/restored, locked/unlocked, pinned/unpinned, or moved to an active board. Deleted replies show a placeholder while retaining their descendants; deleting the opening post deletes the topic. Original content remains available in the administration view and cannot be edited. Activity points, badges and reading progress are retained. Locked topics reject replies from everyone. Archived categories hide their boards; restoring a category preserves each board's individual archive status.

Bans revoke existing sessions and prevent login and posting. Banned users may browse public pages as guests. Administrators must be demoted before banning; administrators cannot change their own access or remove the final administrator. POST forms require a session-bound CSRF token and, when supplied, a matching Origin.

### Existing database upgrade and first administrator

For an existing installation, deploy the Worker and open the forum once. Runtime migration adds the new columns and records completed default-board upgrades without changing existing content. Do not reinitialize the existing database with schema/seed commands as an upgrade procedure.

During the first administration deployment, inspect the earliest existing account (smallest ID):

```bash
cd bbs
npx wrangler d1 execute bitcoinpurity-bbs --remote --command "SELECT id, username, is_banned FROM users ORDER BY id LIMIT 1;"
```

Grant this account administrator access when no administrator exists:

```bash
npx wrangler d1 execute bitcoinpurity-bbs --remote --command "UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users) AND is_banned = 0 AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');"
```

This command is explicitly part of deployment, not automatic registration behavior. It does nothing for an empty database, a banned first account, or a database that already has an administrator. Verify the first account and resolve those conditions before running it; do not repeat bootstrap to override later access decisions. Sign in with that account and open `/admin`, then grant additional administrators through Users.

For local validation, replace `--remote` with `--local` and use the same `--persist-to` directory as `wrangler dev`, if specified. Production migration, bootstrap and deployment require separate execution; local tests do not apply them.
