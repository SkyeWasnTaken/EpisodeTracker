// Show + episode persistence against the sql.js schema in src/lib/db.ts.

import type { TVMazeEpisode, TVMazeShow } from "@/lib/tvmaze";
import { getDb, persist, exec, query } from "@/lib/db";

export function mapShowFromTVMaze(show: TVMazeShow) {
  return {
    id: String(show.id),
    tvmazeId: show.id,
    tmdbId: null,
    title: show.name,
    network: show.network?.name ?? show.webChannel?.name ?? null,
    type: show.type ?? null,
    status: show.status ?? null,
    genres: JSON.stringify(show.genres ?? []),
    posterUrl: show.image?.medium ?? show.image?.original ?? null,
  };
}

export async function upsertShowFromTVMaze(show: TVMazeShow) {
  const db = await getDb();
  const mapped = mapShowFromTVMaze(show);

  exec(
    db,
    `INSERT INTO show (id, tvmaze_id, tmdb_id, title, network, type, status, genres, poster_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(tvmaze_id) DO UPDATE SET
       tmdb_id = excluded.tmdb_id,
       title = excluded.title,
       network = excluded.network,
       type = excluded.type,
       status = excluded.status,
       genres = excluded.genres,
       poster_url = excluded.poster_url`,
    [
      mapped.id,
      mapped.tvmazeId,
      mapped.tmdbId,
      mapped.title,
      mapped.network,
      mapped.type,
      mapped.status,
      mapped.genres,
      mapped.posterUrl,
    ],
  );

  await persist();
  return mapped;
}

export async function syncEpisodesForShow(
  showDbId: string,
  episodes: TVMazeEpisode[],
) {
  const db = await getDb();

  for (const ep of episodes) {
    const epId = `${showDbId}-s${String(ep.season).padStart(2, "0")}e${String(ep.number).padStart(2, "0")}`;
    exec(
      db,
      `INSERT INTO episode (id, show_id, season, number, title, air_date, runtime)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(show_id, season, number) DO UPDATE SET
         title = excluded.title,
         air_date = excluded.air_date,
         runtime = excluded.runtime`,
      [
        epId,
        showDbId,
        Number(ep.season),
        Number(ep.number),
        ep.name ?? null,
        ep.airdate ?? null,
        Number(ep.runtime ?? 0),
      ],
    );
  }

  await persist();
}
