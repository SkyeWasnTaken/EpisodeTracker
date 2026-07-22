import { NextResponse } from "next/server";
import { signup } from "@/lib/auth";
import { getDb, exec, persist, query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "Missing Google token" }, { status: 400 });
    }

    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const email = payload.email;
    const googleId = payload.sub;
    const name = payload.name || (email ? email.split("@")[0] : "");

    if (!email || !googleId) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const db = await getDb();

    const rows = query(
      db,
      `SELECT id, email, display_name, household_id FROM user_account WHERE google_id = ?`,
      [googleId],
    );
    const row = rows?.[0]?.values?.[0];

    if (row) {
      const { randomUUID } = await import("node:crypto");
      const sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      exec(db, `INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)`, [sessionId, row[0], expiresAt]);
      await persist();

      const response = NextResponse.json({ user: { id: row[0], email: row[1], displayName: row[2], householdId: row[3] } });
      const maxAge = 7 * 24 * 60 * 60;
      response.headers.set("Set-Cookie", `episodetrack_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
      return response;
    }

    const result = await signup(email, "", name);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    exec(db, `UPDATE user_account SET google_id = ? WHERE id = ?`, [googleId, result.user.id]);
    await persist();

    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Verifies a Google ID token by asking Google's tokeninfo endpoint to check
// the signature, expiry, and audience — rather than trusting a locally
// decoded (and therefore forgeable) JWT payload.
async function verifyGoogleToken(
  idToken: string,
): Promise<{ email: string; sub: string; name?: string } | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) return null;

    const payload = (await res.json()) as {
      email?: string;
      email_verified?: string | boolean;
      sub?: string;
      name?: string;
      aud?: string;
      exp?: string;
    };

    if (!payload.sub || !payload.email) return null;
    if (payload.email_verified === "false" || payload.email_verified === false) {
      return null;
    }
    if (payload.exp && Number(payload.exp) * 1000 < Date.now()) return null;

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) return null;

    return { email: payload.email, sub: payload.sub, name: payload.name };
  } catch {
    return null;
  }
}
