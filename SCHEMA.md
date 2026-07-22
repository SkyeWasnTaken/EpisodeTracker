# Cue — Data Schema Sketch (Prisma, SQLite dev → Supabase later)

Portable: use only Prisma features that map cleanly to Postgres.
Solo-first, but every row hangs off a `household` so multi-user is a later UI add, not a migration.

## Entities

### Household
- id
- name (e.g. "Isaac's flat")
- createdAt

### User (auth via NextAuth later; for P1 we seed a single solo user)
- id
- householdId -> Household
- email (nullable until auth)
- displayName
- createdAt

### Platform (the services a household subscribes to — DECLARED, not scraped)
- id
- householdId
- name  (Netflix, iPlayer, Disney+, etc.)
- type  (subscription | terrestrial | rental)
- region (e.g. "GB")

### Show (catalog entry, deduplicated by external id)
- id
- tvmazeId (unique)
- tmdbId (nullable)
- title
- network (nullable)
- type (scripted | reality | etc.)
- status (running | ended)
- genres (json / string[])
- posterUrl (nullable)

### Follow (a user follows a show)
- id
- userId
- showId
- addedAt
- priority (1..5, user-set; default from genre prefs)
- catchupFrom (nullable season/ep to start binge)

### Episode (denormalized airing data from TVMaze)
- id
- showId
- season, number
- title (nullable)
- airDate (datetime, nullable if TBA)
- runtime (nullable)
- Unique (showId, season, number)

### Preference (per user)
- id
- userId
- genresWeighted (json: { "drama": 3, "comedy": 1 })
- maxEpPerDay
- preferredSlots (json: ["20:00","21:00"]) // free-time windows
- bingeWeekend (bool)

### CalendarToken (Google OAuth, P4)
- userId, accessToken, refreshToken, expiry

### TraktToken (optional import, P2)
- userId, accessToken, refreshToken

## Query patterns we must support cheaply
- "Episodes airing this week for shows I follow" → Episode join Follow join User where airDate in [now, now+7d].
- "Build my week" → for each airing ep, score by genre weight * priority, then place into preferredSlots avoiding maxEpPerDay.
- "Binge candidates" → Follow with catchupFrom set AND show status ended/behind → backlog batches.

## Notes
- No provider-account table. We never store Netflix logins. Platform = a declared flag.
- TVMaze `network`/`webChannel` gives us terrestrial vs streaming signal for free.
