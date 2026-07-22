import { cookies } from "next/headers";
import { getDb, exec, query, persist } from "@/lib/db";
import { scryptSync, randomUUID } from "node:crypto";

const SESSION_COOKIE = "episodetrack_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function hashPassword(password: string): string {
  const salt = randomUUID().slice(0, 16);
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const check = scryptSync(password, salt, 64).toString("hex");
  return hash === check;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  householdId: string;
}

function makeUser(row: any[]): CurrentUser {
  return {
    id: row[0],
    email: row[1],
    displayName: row[2],
    householdId: row[3],
  };
}

export async function signup(
  email: string,
  password: string,
  displayName: string,
  securityAnswer?: string,
): Promise<{ user: CurrentUser } | { error: string }> {
  const db = await getDb();
  const existing = query(db, `SELECT id FROM user_account WHERE email = ?`, [email]);
  if (existing && existing.length > 0 && (existing[0]?.values?.length ?? 0) > 0) {
    return { error: "Email already registered" };
  }

  const userId = randomUUID();
  const householdId = `hh-${userId}`;
  const pwHash = password ? hashPassword(password) : null;

  exec(db, `INSERT INTO household (id, name) VALUES (?, ?)`, [householdId, `${displayName}'s home`]);
  exec(db, `INSERT INTO user_account (id, household_id, email, display_name, password_hash, security_answer) VALUES (?, ?, ?, ?, ?, ?)`, [userId, householdId, email, displayName, pwHash, securityAnswer ?? null]);
  exec(db, `INSERT OR IGNORE INTO preference (id, user_id) VALUES (?, ?)`, [randomUUID(), userId]);
  await persist();

  return { user: { id: userId, email, displayName, householdId } };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: CurrentUser; sessionId: string } | { error: string }> {
  const db = await getDb();
  const rows = query(
    db,
    `SELECT id, email, display_name, household_id, password_hash FROM user_account WHERE email = ?`,
    [email],
  );
  const row = rows?.[0]?.values?.[0];
  if (!row || !row[4]) return { error: "Invalid email or password" };
  if (!verifyPassword(password, row[4])) return { error: "Invalid email or password" };

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();
  exec(db, `INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)`, [sessionId, row[0], expiresAt]);
  await persist();

  return { user: { id: row[0], email: row[1], displayName: row[2], householdId: row[3] }, sessionId };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;
  if (sid) {
    const db = await getDb();
    exec(db, `DELETE FROM session WHERE id = ?`, [sid]);
    await persist();
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid) return null;

    const db = await getDb();
    const rows = query(
      db,
      `SELECT u.id, u.email, u.display_name, u.household_id FROM session s JOIN user_account u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime('now')`,
      [sid],
    );
    const row = rows?.[0]?.values?.[0];
    if (!row) return null;

    return makeUser(row);
  } catch {
    return null;
  }
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS / 1000,
    path: "/",
  });
}

export async function deleteAccount(userId: string): Promise<void> {
  const db = await getDb();
  const rows = query(db, `SELECT household_id FROM user_account WHERE id = ?`, [userId]);
  const hhId = rows?.[0]?.values?.[0]?.[0];
  if (hhId) {
    exec(db, `DELETE FROM session WHERE user_id = ?`, [userId]);
    exec(db, `DELETE FROM preference WHERE user_id = ?`, [userId]);
    exec(db, `DELETE FROM follow WHERE user_id = ?`, [userId]);
    exec(db, `DELETE FROM user_account WHERE id = ?`, [userId]);
    exec(db, `DELETE FROM household WHERE id = ?`, [hhId]);
    await persist();
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function linkGoogle(userId: string, googleId: string): Promise<void> {
  const db = await getDb();
  exec(db, `UPDATE user_account SET google_id = ? WHERE id = ?`, [googleId, userId]);
  await persist();
}

export async function getUserByGoogleId(googleId: string): Promise<CurrentUser | null> {
  const db = await getDb();
  const rows = query(db, `SELECT id, email, display_name, household_id FROM user_account WHERE google_id = ?`, [googleId]);
  const row = rows?.[0]?.values?.[0];
  if (!row) return null;
  return makeUser(row);
}
