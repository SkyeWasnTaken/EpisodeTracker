import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, query } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();

  const showRows = query(
    db,
    `SELECT show_id FROM follow WHERE user_id = ?`,
    [user.id],
  );
  const showIds = (showRows[0]?.values ?? []).map((r: any[]) => r[0]);

  if (showIds.length === 0) {
    return NextResponse.json({ episodes: [] });
  }

  const placeholders = showIds.map(() => "?").join(",");
  const rows = query(
    db,
    `SELECT e.id, e.show_id, e.season, e.number, e.title, e.air_date, s.title as show_title
     FROM episode e
     JOIN show s ON e.show_id = s.id
     WHERE e.show_id IN (${placeholders})
     ORDER BY e.air_date, e.season, e.number`,
    showIds,
  );

  const episodes = (rows[0]?.values ?? []).map((r: any[]) => ({
    id: r[0],
    showId: r[1],
    season: r[2],
    number: r[3],
    title: r[4],
    airdate: r[5],
    showTitle: r[6],
  }));

  return NextResponse.json({ episodes });
}
