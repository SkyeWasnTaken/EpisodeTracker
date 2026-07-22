# EpisodeTrack — TV Concierge (project rules for AI builders)

## What this is
A cross-platform "TV concierge": one app that knows every streaming + terrestrial
service the user is on, tracks every show's release schedule, and auto-builds a
weekly watch calendar so the user never forgets a drop and never has to decide
"what do I watch tonight."

## Stack (decided, v1)
- **Next.js (App Router) + TypeScript + Tailwind CSS** — web app, also installable PWA (next-pwa) for phone.
- **Data**: TVMaze API (free, no key — episodes/air dates/network) + TMDB (art/catalog).
- **Local dev DB**: SQLite via Prisma. Schema must stay portable to Supabase/Postgres later.
- **Auth**: NextAuth (magic link/email) — added P2. Solo-first, but schema allows households (see schema notes).
- **Calendar**: Google Calendar API OAuth (P4). **Watch import**: Trakt OAuth (optional, P2).

## Hard constraints
- Write REAL, RUNNABLE code. No stubs, no "TODO" placeholders that don't execute.
- Keep files <500 lines. Logic in `src/lib`, routes in `src/app`.
- ALWAYS verify with `npm run build` + `npm run typecheck` before declaring done.
- Blue theme for UI accents (primary ≈ #3b82f6).
- Skye prefers WHOLE-FILE dumps when reviewing, not incremental diffs.
- OneDrive path only: `C:\Users\Isaac\OneDrive\Desktop\cue`.

## Workflow (Zora + Cursor)
- Zora (Hermes) = planning / architecture / verifies artifacts actually run.
- Cursor AI = in-editor building.
- Paste whole files; avoid silent partial edits.

## Phases
- P0 Scaffold (this repo, Next+TS+Tailwind+Prisma, git init, AGENTS/PLAN).
- P1 Data: show search + add; "episodes airing this week" from TVMaze (live, free).
- P2 You-model: onboarding (platforms, genres, Trakt optional); prefs persisted.
- P3 Engine: weekly builder — rank by prefs + recency + backlog, slot into free calendar time.
- P4 Sync: Google Calendar events + drop notifications + "binge this weekend" batches.
- P5 Polish / shared household (schema already ready).

## Known impossibilities (manage expectations)
- No public API/OAuth to read a user's Netflix/Disney+/Prime subscription or library.
  Users DECLARE what platforms they have; app uses metadata, not account scraping.
- Trakt is the only legit "real link" to a streaming life (API + OAuth exist).
