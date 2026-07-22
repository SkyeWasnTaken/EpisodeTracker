# EpisodeTrack — Claude Project Brief

## Project Identity
- **Name:** EpisodeTrack
- **Repo:** https://github.com/SkyeWasnTaken/EpisodeTracker
- **Local path:** `C:\Users\Isaac\OneDrive\Desktop\EpisodeTracker`
- **Brand color:** Blue `#3b82f6`
- **Version:** 0.1.0 (P1 active)

## What This Is
A solo-first TV companion app that tracks shows you follow, surfaces what’s airing this week, and eventually schedules viewing onto your calendar. Built for Skye’s actual TV watching habits first; household support is planned later.

## What’s Already Built (P0 → P1)

### Stack
- Next.js 16 App Router + TypeScript + Tailwind
- Dev DB: sql.js (`dev.db`, pure WASM, Prisma schema exists but is not the runtime path)
- TV data: TVMaze (free, no API key); default region `GB`
- Local dev uses `npm run dev`; production build uses `npm run build`

### Data model (sql.js runtime)
- `household`: `id`, `name`, `invite_code`
- `user_account`: `id`, `email`, `display_name`, `household_id`
- `show`: `id`, `tvmaze_id`, `tmdb_id`, `title`, `network`, `type`, `status`, `genres`, `poster_url`
- `episode`: `id`, `show_id`, `season`, `number`, `title`, `air_date`, `runtime`
- `follow`: `id`, `user_id`, `show_id`, `added_at`, `priority`, `catchup_from`

### File map (source of truth)
- Show search via TVMaze (`/search`, `/api/shows/search`)
- Show detail page with Follow/Unfollow server action (`/shows/[id]`)
- Follow persistence in local sql.js DB
- Homepage “Airing this week” dashboard pulling TVMaze schedule for followed IDs
- Branding renamed to EpisodeTrack across layout, homepage, AGENTS.md, package.json

### File map (source of truth)
- `src/app/layout.tsx` — root layout + metadata
- `src/app/page.tsx` — homepage with weekly grid
- `src/app/search/page.tsx` — search UI
- `src/app/shows/[id]/page.tsx` — show detail
- `src/app/shows/[id]/actions.ts` — follow/unfollow/getFollowState
- `src/lib/db.ts` — sql.js DB helpers
- `src/lib/user.ts` — active user + follows
- `src/lib/shows.ts` — upsert/sync show + episodes
- `src/lib/tvmaze.ts` — TVMaze client
- `prisma/seed.ts` — standalone sql.js seed
- `AGENTS.md` — project rules + roadmap

## Known Constraints & Rules
- **sql.js API surface:** use `db.exec(sql)` and `db.prepare(sql).run(paramsArray)` for writes; `db.prepare(sql).all(paramsArray)` is NOT supported in the current runtime. `query()` should use `db.exec(sql)` for reads without params; do not call `.all()`/`.get()` on prepared statements here.
- **Never use `bake()` for SQL interpolation in production code.** Parameterized queries only.
- **OneDrive path only:** project lives under `C:\Users\Isaac\OneDrive\Desktop\EpisodeTracker`.
- **No secrets/credentials in repo.**
- **Keep files under 500 lines.**
- **Auth is deferred to P2** — current user is fixed to the seeded solo user.
- **Brand:** always use EpisodeTrack, not Cue/TrackTV/other aliases.

## Known Issues / Open Bugs
- Dev server cache: `.next` can hold stale artifacts; if runtime disagrees with source, kill node processes, delete `.next`, reseed, restart.
- Login/auth: not implemented yet; do not scaffold OAuth/magic-link flows unless explicitly asked.
- Calendar: not started.
- Questionaire/preferences: not started.

## Future Ideas (prioritized roughly)

### P1-ish (close to current flow)
- Calendar needs to show exact **timing** and **channel/network** for each episode
- One-tap “Add to calendar” from show page or episode row
- Scheduling titles/titles-on-card that tell you **when to watch it**
- Smart prompt: *“X comes out every Thursday — do you want to schedule it in calendar?”*
- Revisit **login**; Skye said login is currently an issue. Decide: keep solo-first longer, or ship household auth?

### P2
- Onboarding questionnaire:
  - TV platform availability (Netflix, Disney+, Prime, iPlayer, etc.)
  - Show preferences: genres, tone, ongoing vs limited
  - Shows already being watched (seed follows from import/manual entry)
- Trakt import/export (optional)
- Recommendation engine based on prefs + watch history
- Backlog episode sorting (catch-up mode)

### P3+
- Google Calendar sync (OAuth)
- Drop notifications for upcoming episodes
- Household switching + shared follow lists
- PWA polish + mobile install

## Prompt Guidance for Future Claude Sessions
When resuming work, treat `AGENTS.md` as the operating constraints for this repo, and use this file as the product brief.

### If asked to implement calendar
1. Use TVMaze `airtime` + `network` values already present in schedule entries.
2. Show time + channel directly on calendar event cards.
3. Add a prompt/action to schedule specific shows as repeating weekly events.

### If asked to implement login
1. Do not invent OAuth providers unless Skye asks for specific ones.
2. Keep the solo-user fallback if auth is optional.
3. Prefer magic link or passcode local-first, not social login.

### If asked to implement questionnaire
1. Make it short and skippable.
2. Persist answers to sql.js; same schema can migrate to Postgres later.
3. Use answers to drive homepage ranking and “recommended to follow” suggestions.

## Source-of-Truth Command
```powershell
cd C:\Users\Isaac\OneDrive\Desktop\EpisodeTracker
npm run typecheck
npm run build
npx tsx prisma/seed.ts
npm run dev
```

## GitHub
- Remote: `https://github.com/SkyeWasnTaken/EpisodeTracker.git`
- Branch: `main`
- Latest pushed commit: `9912fef`
