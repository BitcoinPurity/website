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

```bash
cd bbs
npm install
npm run dev
```

Open http://localhost:8787. Local D1 is created automatically; boards are seeded on first request.

Run board initialization and migration tests with Node.js 24:

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

2. Apply schema and seed to production:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

3. Deploy the worker:

```bash
npm run deploy
```

4. In Cloudflare DNS, add a CNAME or route `bbs.bitcoinpurity.org` to the worker. In the Cloudflare dashboard, add a custom domain or route:

```jsonc
"routes": [
  { "pattern": "bbs.bitcoinpurity.org/*", "zone_name": "bitcoinpurity.org" }
]
```

## Boards

- Announcement — official announcements, releases, and project updates; listed first under Bitcoin Purity. Added automatically to existing databases on the first request after deployment.
- Bitcoin Purity Discussion
- Mining
- Development
- Meta
