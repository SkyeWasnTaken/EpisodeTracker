import { NextResponse } from "next/server";
import { getDb, query, exec, persist } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, securityAnswer, newPassword } = (await request.json()) as {
      email: string;
      securityAnswer: string;
      newPassword: string;
    };

    if (!email || !securityAnswer || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const rows = query(
      db,
      `SELECT id, security_answer FROM user_account WHERE email = ?`,
      [email],
    );
    const row = rows?.[0]?.values?.[0];
    if (!row) {
      return NextResponse.json(
        { error: "No account found with that email" },
        { status: 404 },
      );
    }

    const storedAnswer = row[1];
    if (!storedAnswer || storedAnswer !== securityAnswer) {
      return NextResponse.json(
        { error: "Incorrect security answer" },
        { status: 401 },
      );
    }

    const { scryptSync, randomUUID } = await import("node:crypto");
    const salt = randomUUID().slice(0, 16);
    const hash = scryptSync(newPassword, salt, 64).toString("hex");
    const pwHash = `${salt}:${hash}`;

    exec(db, `UPDATE user_account SET password_hash = ? WHERE id = ?`, [pwHash, row[0]]);
    await persist();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
