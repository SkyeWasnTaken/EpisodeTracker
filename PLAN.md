# Cue — Build Plan

> Working name. Renames freely. Path: `C:\Users\Isaac\OneDrive\Desktop\cue`

## Vision (decoded from Skye's notes)
Universal TV Guide + personal scheduler + recommendation engine.
User tells the app what platforms they have; the app does the brainwork:
tracks every followed show's air dates across all services, builds a weekly
watch calendar around the user's free time, and notifies on drops.

## v1 scope (what we WILL build)
- Web app (PWA — installs on phone).
- Show search + follow (TVMaze).
- "Airing this week" view (live data, free).
- Onboarding: declare platforms + genre prefs (Trakt import optional).
- Weekly schedule engine: ranks episodes by prefs/recency/backlog, slots into free calendar windows.
- Google Calendar sync + drop notifications.
- Solo-first, but DB schema supports households later (no UI yet).

## v1 OUT of scope (the fantasy half — cut)
- Auto-linking Netflix/Disney+/Prime accounts (no APIs exist).
- Reading a user's subscription/library from providers.
- Real-time "what's on right now" terrestrial EPG (that's a different, heavier data contract).

## Tech decisions
| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js App Router + TS + Tailwind | Web + PWA, Cursor-friendly |
| Data | TVMaze (free, no key) + TMDB (art) | Solved, zero-cost |
| Dev DB | Prisma + SQLite | Portable to Supabase later |
| Auth | NextAuth email/magic | Simple, extensible |
| Calendar | Google Calendar API OAuth | "Never decide, just show up" |
| Notify | Web push / email (Resend) | Drop alerts |

## Milestones
- [ ] P0 — repo scaffolds & builds clean
- [ ] P1 — can search a show, follow it, see this week's eps (LIVE TVMaze)
- [ ] P2 — onboarding + prefs + optional Trakt
- [ ] P3 — weekly engine produces a real schedule
- [ ] P4 — calendar events + notifications land
- [ ] P5 — household schema exercise (optional)

## Definition of done (per phase)
Code runs, `npm run build` + `typecheck` pass, and a real data path is exercised
(not mocked) before the phase is called complete.
