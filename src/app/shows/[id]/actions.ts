"use server";

import { revalidatePath } from "next/cache";
import { getEpisodes, getShow } from "@/lib/tvmaze";
import { syncEpisodesForShow, upsertShowFromTVMaze } from "@/lib/shows";
import { getActiveUser, isFollowingShow } from "@/lib/user";
import { getDb, persist, exec, query } from "@/lib/db";

export async function followShow(tvmazeId: number) {
  const user = await getActiveUser();
  const remoteShow = await getShow(tvmazeId);

  if (!remoteShow) {
    throw new Error("Show not found on TVMaze");
  }

  const show = await upsertShowFromTVMaze(remoteShow);
  const episodes =
    remoteShow._embedded?.episodes ?? (await getEpisodes(tvmazeId));
  await syncEpisodesForShow(show.id, episodes);

  const db = await getDb();
  exec(
    db,
    `INSERT OR IGNORE INTO follow (id, user_id, show_id, priority)
     VALUES (?, ?, ?, 3)`,
    [`${user.id}-${show.id}`, user.id, show.id],
  );
  await persist();

  revalidatePath("/");
  revalidatePath(`/shows/${tvmazeId}`);
}

export async function unfollowShow(tvmazeId: number) {
  const user = await getActiveUser();
  const db = await getDb();
  const showRows = query(
    db,
    `SELECT id FROM show WHERE tvmaze_id = ?`,
    [tvmazeId],
  );
  const showRow = showRows[0]?.values?.[0];
  if (!showRow || !showRow[0]) return;

  await exec(
    db,
    `DELETE FROM follow WHERE user_id = ? AND show_id = ?`,
    [user.id, String(showRow[0])],
  );
  await persist();

  revalidatePath("/");
  revalidatePath(`/shows/${tvmazeId}`);
}

export async function getFollowState(tvmazeId: number) {
  return isFollowingShow(tvmazeId);
}
