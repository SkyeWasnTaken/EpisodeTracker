# EpisodeTrack — Differentiation & Market Strategy

Context: TV Time (Whip Media), the dominant TV-tracking app with ~25-26M registered
users, permanently shut down on 2026-07-15 after its parent company pivoted to
enterprise AI. Millions of users are actively searching for a replacement right now.
Most existing alternatives (Trakt, Simkl, Serializd, Reelgood, JustWatch, TV Track,
Moviebase, Showly, Hobi, etc.) are repositioning as trackers or discovery tools —
logging what you've watched, or telling you where to stream something. Very few are
schedulers. That's the open lane EpisodeTrack is built for.

## What makes EpisodeTrack different

- **Forward-looking calendar, not a backward-looking log** — most competitors (Trakt,
  Serializd, Simkl) log what you've already watched. EpisodeTrack builds next week's
  watch plan before you've watched anything, synced straight to Google Calendar.

- **Time-aware scheduling** — slots episodes into your actual free time based on
  runtime, priority, and backlog, rather than just listing "new episodes out today"
  and leaving you to figure out when to watch them.

- **Subscription-value alerts** — flag when a paid platform has nothing scheduled for
  you this billing cycle ("you haven't watched anything on Max in 3 weeks — cancel or
  keep?"). None of the competitors researched do this; it directly targets subscription
  fatigue, which is a bigger pain point than "what should I watch."

- **Leaving-soon urgency nudges** — surface when a followed show is about to leave a
  platform and automatically bump it up the week's schedule, rather than a generic
  "new episode" push.

- **Household/shared scheduling** — coordinate a shared watch calendar for a couple or
  family (e.g. a "date night" slot). Schema already supports households; every
  competitor reviewed is single-user only.

- **Declared-platform honesty** — no fake "auto-detect your Netflix library" promises
  (not technically possible via any public API) — you tell it what you have, it works
  from real TVMaze/Trakt data. Builds trust versus apps that overpromise here.

- **TV Time refugee timing** — launching into a market where 25–26M users lost their
  tracker recently and are actively shopping for a replacement, with most existing
  alternatives repositioning as trackers rather than schedulers — leaves the
  scheduling angle comparatively open.
