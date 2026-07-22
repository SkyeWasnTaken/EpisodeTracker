import { NextResponse } from "next/server";
import { searchShows, showNetwork, TVMazeError } from "@/lib/tvmaze";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchShows(q);
    const shows = results.map(({ score, show }) => ({
      score,
      id: show.id,
      name: show.name,
      network: showNetwork(show),
      genres: show.genres ?? [],
      status: show.status,
      posterUrl: show.image?.medium ?? show.image?.original ?? null,
    }));

    return NextResponse.json({ results: shows });
  } catch (error) {
    if (error instanceof TVMazeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }

    return NextResponse.json(
      { error: "Failed to search shows" },
      { status: 500 },
    );
  }
}
