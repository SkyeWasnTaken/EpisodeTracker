import { NextResponse } from "next/server";
import { getCurrentUser, deleteAccount } from "@/lib/auth";
import { getDb, persist, exec, query } from "@/lib/db";

function generateId(): string {
  const { randomUUID } = require("node:crypto");
  return randomUUID();
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();

  // Get platforms
  const platformRows = query(
    db,
    `SELECT id, name, type, region FROM platform WHERE household_id = ? ORDER BY name`,
    [user.householdId],
  );
  const platforms = (platformRows?.[0]?.values ?? []).map((r: any[]) => ({
    id: r[0],
    name: r[1],
    type: r[2],
    region: r[3],
  }));

  // Get preferences
  const prefRows = query(
    db,
    `SELECT genres_weighted, max_ep_per_day, preferred_slots, binge_weekend
     FROM preference WHERE user_id = ?`,
    [user.id],
  );
  const prefRow = prefRows?.[0]?.values?.[0];
  const preferences = prefRow
    ? {
        genresWeighted: JSON.parse(prefRow[0] || "{}"),
        maxEpPerDay: prefRow[1],
        preferredSlots: JSON.parse(prefRow[2] || "[]"),
        bingeWeekend: prefRow[3] === 1,
      }
    : {
        genresWeighted: {},
        maxEpPerDay: 3,
        preferredSlots: [],
        bingeWeekend: true,
      };

  return NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
    platforms,
    preferences,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const body = (await request.json()) as {
    displayName?: string;
    platforms?: { name: string; type: string }[];
    preferences?: {
      genresWeighted?: Record<string, number>;
      maxEpPerDay?: number;
      preferredSlots?: string[];
      bingeWeekend?: boolean;
    };
  };

  if (body.displayName) {
    exec(
      db,
      `UPDATE user_account SET display_name = ? WHERE id = ?`,
      [body.displayName, user.id],
    );
  }

  if (body.platforms !== undefined) {
    // Delete existing platforms
    exec(
      db,
      `DELETE FROM platform WHERE household_id = ?`,
      [user.householdId],
    );
    // Insert new platforms
    for (const p of body.platforms) {
      exec(
        db,
        `INSERT INTO platform (id, household_id, name, type) VALUES (?, ?, ?, ?)`,
        [generateId(), user.householdId, p.name, p.type],
      );
    }
  }

  if (body.preferences) {
    const p = body.preferences;
    exec(
      db,
      `INSERT INTO preference (id, user_id, genres_weighted, max_ep_per_day, preferred_slots, binge_weekend)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         genres_weighted = excluded.genres_weighted,
         max_ep_per_day = excluded.max_ep_per_day,
         preferred_slots = excluded.preferred_slots,
         binge_weekend = excluded.binge_weekend`,
      [
        generateId(),
        user.id,
        JSON.stringify(p.genresWeighted ?? {}),
        p.maxEpPerDay ?? 3,
        JSON.stringify(p.preferredSlots ?? []),
        p.bingeWeekend ? 1 : 0,
      ],
    );
  }

  await persist();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await deleteAccount(user.id);
  return NextResponse.json({ ok: true });
}
