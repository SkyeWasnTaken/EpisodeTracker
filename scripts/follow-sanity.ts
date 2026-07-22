import initSqlJs from "sql.js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DB_PATH = path.resolve("dev.db");

async function main() {
  const SQL = await initSqlJs();
  const bytes = await readFile(DB_PATH);
  const db = new SQL.Database(new Uint8Array(bytes));

  const showInsert = db.prepare("INSERT OR REPLACE INTO show (id, tvmaze_id, tmdb_id, title, network, type, status, genres, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  showInsert.run(["55138", 55138, null, "Arcane: League of Legends", "Netflix", "Scripted", "Ended", JSON.stringify(["Action","Adventure","Fantasy"]), "https://static.tvmaze.com/uploads/images/medium_portrait/536/1340287.jpg"]);

  const epInsert = db.prepare("INSERT OR REPLACE INTO episode (id, show_id, season, number, title, air_date, runtime) VALUES (?, ?, ?, ?, ?, ?, ?)");
  epInsert.run(["55138-s01e01", "55138", 1, 1, "The Beginning", "2021-11-06", 60]);

  const followUpsert = db.prepare("INSERT OR REPLACE INTO follow (id, user_id, show_id, priority) VALUES (?, ?, ?, ?)");
  followUpsert.run(["u-skye-55138", "u-skye", "55138", 3]);

  const rows = db.exec("SELECT id, user_id, show_id, priority FROM follow WHERE user_id = 'u-skye'");
  console.log("follow rows:", JSON.stringify(rows));

  await writeFile(DB_PATH, Buffer.from(db.export().buffer));
  db.close();
  console.log("persisted");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
