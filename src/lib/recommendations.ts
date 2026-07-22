// Free AI-powered recommendations using genre-preference scoring.
// No external API calls — scores TVMaze shows against user's genre weights.

import { getDb, query } from "@/lib/db";
import { searchShows, type TVMazeSearchResult } from "@/lib/tvmaze";

export interface ScoredShow {
  id: number;
  name: string;
  network: string | null;
  genres: string[];
  status: string;
  posterUrl: string | null;
  score: number;
  reason: string;
}

export async function getRecommendations(
  userId: string,
  householdId: string,
  limit = 10,
): Promise<ScoredShow[]> {
  const db = await getDb();

  // Get user's genre preferences
  const prefRows = query(
    db,
    `SELECT genres_weighted FROM preference WHERE user_id = ?`,
    [userId],
  );
  const prefRow = prefRows?.[0]?.values?.[0];
  const genresWeighted: Record<string, number> = prefRow
    ? JSON.parse(prefRow[0] || "{}")
    : {};

  // Get user's followed show IDs to exclude
  const followRows = query(
    db,
    `SELECT show_id FROM follow WHERE user_id = ?`,
    [userId],
  );
  const followedShowIds = new Set(
    (followRows[0]?.values ?? []).map((r: any[]) => r[0]),
  );

  // Get user's platforms
  const platformRows = query(
    db,
    `SELECT name FROM platform WHERE household_id = ?`,
    [householdId],
  );
  const userPlatforms = new Set<string>(
    (platformRows[0]?.values ?? []).map((r: any[]) => String(r[0]).toLowerCase()),
  );

  // If no genre preferences set, use popular search terms
  const searchTerms = getSearchTerms(genresWeighted);

  const seenIds = new Set<number>();
  const scored: ScoredShow[] = [];

  for (const term of searchTerms) {
    if (scored.length >= limit * 3) break;
    try {
      const results = await searchShows(term);
      for (const { show } of results) {
        if (seenIds.has(show.id)) continue;
        seenIds.add(show.id);

        const showDbId = String(show.id);
        if (followedShowIds.has(showDbId)) continue;

        const showGenres = show.genres ?? [];
        const showNetwork = show.network?.name ?? show.webChannel?.name ?? null;

        // Score based on genre match
        let score = 0;
        let matchedGenres: string[] = [];
        for (const genre of showGenres) {
          const weight = genresWeighted[genre] ?? 0;
          if (weight > 0) {
            score += weight;
            matchedGenres.push(genre);
          }
        }

        // Bonus for platform match
        if (showNetwork && userPlatforms.size > 0) {
          const networkLower = showNetwork.toLowerCase();
          for (const platform of userPlatforms) {
            if (networkLower.includes(platform) || platform.includes(networkLower)) {
              score += 2;
              break;
            }
          }
        }

        // Bonus for running shows (actively airing)
        if (show.status === "Running") {
          score += 1;
        }

        if (score > 0) {
          const reason = matchedGenres.length > 0
            ? `Matches your interest in ${matchedGenres.slice(0, 2).join(", ")}`
            : "Popular show you might enjoy";
          scored.push({
            id: show.id,
            name: show.name,
            network: showNetwork,
            genres: showGenres,
            status: show.status,
            posterUrl: show.image?.medium ?? show.image?.original ?? null,
            score,
            reason,
          });
        }
      }
    } catch {
      // Skip failed searches
    }
  }

  // Sort by score descending, return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getSearchTerms(genresWeighted: Record<string, number>): string[] {
  // If user has genre preferences, search by top genres
  const sorted = Object.entries(genresWeighted)
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length > 0) {
    return sorted.slice(0, 4).map(([genre]) => genre);
  }

  // Default popular searches
  return [
    "the",
    "doctor",
    "game of",
    "star",
    "house of",
    "stranger",
    "last of",
    "lord of",
  ];
}