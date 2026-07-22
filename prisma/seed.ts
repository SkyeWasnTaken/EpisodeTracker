import { getDb, persist, closeDb, exec } from "../src/lib/db";
import { scryptSync, randomUUID } from "node:crypto";

const SEED_HOUSEHOLD_ID = "hh-skye";
const SEED_EMAIL = "skye@episodetrack.local";
const SEED_PASSWORD = "cue123";
const SEED_DISPLAY_NAME = "Skye";
const SEED_HOUSEHOLD_NAME = "Skye's home";

function hashPassword(password: string): string {
  const salt = randomUUID().slice(0, 16);
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const db = await getDb();

  exec(
    db,
    `INSERT OR REPLACE INTO household (id, name) VALUES (?, ?)`,
    [SEED_HOUSEHOLD_ID, SEED_HOUSEHOLD_NAME],
  );

  exec(
    db,
    `INSERT OR REPLACE INTO user_account (id, email, display_name, household_id, password_hash)
     VALUES ('u-skye', ?, ?, ?, ?)`,
    [SEED_EMAIL, SEED_DISPLAY_NAME, SEED_HOUSEHOLD_ID, hashPassword(SEED_PASSWORD)],
  );

  exec(
    db,
    `INSERT OR IGNORE INTO preference (id, user_id) VALUES (?, ?)`,
    [`pref-skye`, `u-skye`],
  );

  await persist();
  await closeDb();
  console.log(`Seeded user "${SEED_DISPLAY_NAME}" (${SEED_EMAIL})`);
  console.log(`Password: ${SEED_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});