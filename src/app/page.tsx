import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  formatDateISO,
  getSchedule,
  showNetwork,
  type TVMazeScheduleEntry,
} from "@/lib/tvmaze";
import { getActiveUserFollows } from "@/lib/user";
import { getCurrentUser } from "@/lib/auth";

interface ShowGroup {
  showId: number;
  title: string;
  posterUrl: string | null;
  network: string | null;
  status: string | null;
  episodes: TVMazeScheduleEntry[];
}

interface DayGroup {
  date: string;
  label: string;
  shows: ShowGroup[];
}

interface Recommendation {
  id: number;
  name: string;
  network: string | null;
  genres: string[];
  status: string;
  posterUrl: string | null;
  score: number;
  reason: string;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function buildWeekDays(start: Date): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return formatDateISO(day);
  });
}

function groupByShow(
  entries: Array<TVMazeScheduleEntry & { network: string | null }>,
): ShowGroup[] {
  const map = new Map<number, ShowGroup>();
  for (const entry of entries) {
    const id = entry.show.id;
    if (!map.has(id)) {
      map.set(id, {
        showId: id,
        title: entry.show.name,
        posterUrl: entry.show.image?.medium ?? entry.show.image?.original ?? null,
        network: entry.network,
        status: entry.show.status ?? null,
        episodes: [],
      });
    }
    map.get(id)!.episodes.push(entry);
  }
  return Array.from(map.values());
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const follows = await getActiveUserFollows();
  const followedIds = new Set(follows.map((follow) => follow.show.tvmazeId));
  const start = startOfToday();
  const weekDays = buildWeekDays(start);

  let scheduleEntries: TVMazeScheduleEntry[] = [];
  if (followedIds.size > 0) {
    const dates = weekDays;
    const results = await Promise.all(
      dates.map((date) => getSchedule(date, "GB")),
    );
    scheduleEntries = results.flat();
  }

  const filtered = scheduleEntries
    .filter((entry) => followedIds.has(entry.show.id))
    .map((entry) => ({
      ...entry,
      network: showNetwork(entry.show),
    }));

  const grouped: DayGroup[] = weekDays.map((date) => ({
    date,
    label: formatDayLabel(date),
    shows: groupByShow(
      filtered
        .filter((entry) => entry.airdate === date)
        .sort((a, b) => (a.airtime || "").localeCompare(b.airtime || "")),
    ),
  }));

  const totalAiring = filtered.length;
  const followedShowsCount = follows.length;

  // Fetch recommendations directly (server-side, same request context)
  let recommendations: Recommendation[] = [];
  try {
    const { getRecommendations } = await import("@/lib/recommendations");
    recommendations = await getRecommendations(user.id, user.householdId, 6);
  } catch {
    // Recommendations are optional — fail gracefully
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-500">
            EpisodeTrack
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Airing this week</h1>
          <p className="mt-1 text-zinc-600">
            Live TVMaze schedule for shows you follow (GB).
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Search & follow shows
        </Link>
      </header>

      {followedShowsCount === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <h2 className="text-lg font-semibold">No shows followed yet</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Search for a show and tap Follow to see this week's airings here.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-flex rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Find a show
          </Link>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Following ({followedShowsCount})
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {follows.map((follow) => (
                <li key={follow.id}>
                  <Link
                    href={`/shows/${follow.show.tvmazeId}`}
                    className="mr-2 mb-2 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm transition hover:border-blue-400"
                  >
                    {follow.show.posterUrl && (
                      <span className="relative h-6 w-4 overflow-hidden rounded-sm bg-zinc-200">
                        <Image
                          src={follow.show.posterUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="16px"
                        />
                      </span>
                    )}
                    {follow.show.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-zinc-500">
              {totalAiring} episode{totalAiring === 1 ? "" : "s"} airing in the
              next 7 days across {grouped.filter((d) => d.shows.length > 0).length} days.
            </p>
          </section>

          {recommendations.length > 0 && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-blue-600">
                Recommended for you
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Based on your genre ratings and streaming services.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/shows/${rec.id}`}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition hover:border-blue-400 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      {rec.posterUrl && (
                        <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded-sm bg-zinc-200">
                          <Image
                            src={rec.posterUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="28px"
                          />
                        </span>
                      )}
                      <span className="text-sm font-semibold text-zinc-900 leading-tight">
                        {rec.name}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-blue-600">{rec.reason}</span>
                      <p className="text-xs text-zinc-400">
                        {rec.network ?? "Unknown"} · {rec.status}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            {grouped.map((day) => (
              <article
                key={day.date}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <h2 className="border-b border-zinc-100 pb-3 text-lg font-semibold text-blue-600">
                  {day.label}
                </h2>

                {day.shows.length === 0 ? (
                  <p className="pt-3 text-sm text-zinc-500">
                    Nothing airing from your follows.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-4">
                    {day.shows.map((show) => (
                      <div key={show.showId}>
                        <div className="flex items-center gap-2 border-b border-zinc-50 pb-1">
                          {show.posterUrl && (
                            <span className="relative h-5 w-3.5 shrink-0 overflow-hidden rounded-sm bg-zinc-200">
                              <Image
                                src={show.posterUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="14px"
                              />
                            </span>
                          )}
                          <Link
                            href={`/shows/${show.showId}`}
                            className="text-sm font-semibold text-zinc-900 hover:text-blue-600"
                          >
                            {show.title}
                          </Link>
                          <span className="text-xs text-zinc-400">
                            {show.network}
                          </span>
                        </div>
                        <ul className="mt-1 flex flex-col gap-1">
                          {show.episodes.map((ep) => (
                            <li
                              key={ep.id}
                              className="rounded-lg bg-zinc-50 px-2.5 py-1.5"
                            >
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs font-medium text-zinc-800">
                                  S{ep.season}E{ep.number}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {ep.airtime || "TBA"}
                                </span>
                              </div>
                              {ep.name && (
                                <p className="mt-0.5 text-xs text-zinc-600 leading-tight">
                                  {ep.name}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}