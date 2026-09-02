# Bitcoin Purity BBS

Anonymous bulletin board at `bbs.bitcoinpurity.org`, styled after classic bitcointalk.org forums.

Built as a Cloudflare Worker with D1 (SQLite). **Username + password registration** — email is optional and only used for password reset. Browse boards without an account.

## Activity, levels, and badges

- **Points:** new topic +5, reply +2
- **Levels:** Newbie → Jr. Member → Member → Full Member → Sr. Member → Hero Member → Legendary (by activity points)
- **Badges:** auto-awarded milestones (registered, first topic, first reply, post counts, activity thresholds)
- **Profile:** `/user/:username` — public stats and badges

Levels and badges are display-only; they do not change posting permissions.

## Develop

```bash
cd bbs
npm install
npm run dev
```

Open http://localhost:8787. Local D1 is created automatically; boards are seeded on first request.

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

- Bitcoin Purity Discussion
- Mining
- Development
- Meta
