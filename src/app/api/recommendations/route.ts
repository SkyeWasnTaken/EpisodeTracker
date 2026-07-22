import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const recommendations = await getRecommendations(user.id, user.householdId, 8);
    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}