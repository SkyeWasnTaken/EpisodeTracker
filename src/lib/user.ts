// User helpers — gets the logged-in user from the session.

import { getDb, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getActiveUser(): Promise<{
  id: string;
  email: string;
  displayName: string;
  householdId: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated. Sign in first.");
  }
  return user;
}

export async function getActiveUserFollows() {
  const db = await getDb();
  const user = await getActiveUser();

  const followRows = query(
    db,
    `SELECT follow.id as id, follow.show_id as showId, follow.added_at as addedAt,
            follow.priority as priority, follow.catchup_from as catchupFrom
     FROM follow WHERE follow.user_id = ?`,
    [user.id],
  );

  const rows: any[] = [];
  for (const follow of followRows[0]?.values ?? []) {
    const [fId, showId, addedAt, priority, catchupFrom] = follow as any[];
    const showRows = query(
      db,
      `SELECT id, tvmaze_id, tmdb_id, title, network, type, status, genres, poster_url
       FROM show WHERE id = ?`,
      [showId],
    );
    const showRow = showRows[0]?.values[0];
    rows.push({
      id: fId,
      showId,
      addedAt,
      priority,
      catchupFrom,
      show: showRow
        ? {
            id: showRow[0],
            tvmazeId: Number(showRow[1]),
            tmdbId: showRow[2],
            title: showRow[3],
            network: showRow[4],
            type: showRow[5],
            status: showRow[6],
            genres: showRow[7],
            posterUrl: showRow[8],
          }
        : {
            id: showId,
            tvmazeId: 0,
            title: "Unknown show",
            network: null,
            genres: "[]",
            status: null,
            posterUrl: null,
          },
    });
  }

  return rows;
}

export async function isFollowingShow(tvmazeId: number): Promise<boolean> {
  const db = await getDb();
  const user = await getActiveUser();

  const showRows = query(
    db,
    `SELECT id FROM show WHERE tvmaze_id = ?`,
    [tvmazeId],
  );
  const showRow = showRows[0]?.values?.[0];
  if (!showRow || !showRow[0]) return false;

  const followRows = query(
    db,
    `SELECT 1 as ok FROM follow WHERE user_id = ? AND show_id = ?`,
    [user.id, showRow[0]],
  );

  return (followRows[0]?.values[0] ?? [])[0] === 1;
}
