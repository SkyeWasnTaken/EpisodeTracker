const TVMAZE_BASE = "https://api.tvmaze.com";

export interface TVMazeImage {
  medium?: string;
  original?: string;
}

export interface TVMazeNetwork {
  id: number;
  name: string;
  country?: { code: string; name: string };
}

export interface TVMazeShow {
  id: number;
  name: string;
  type?: string;
  language?: string;
  genres: string[];
  status: string;
  runtime?: number;
  premiered?: string;
  network?: TVMazeNetwork | null;
  webChannel?: TVMazeNetwork | null;
  image?: TVMazeImage | null;
  summary?: string | null;
  _embedded?: {
    episodes?: TVMazeEpisode[];
  };
}

export interface TVMazeSearchResult {
  score: number;
  show: TVMazeShow;
}

export interface TVMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate?: string | null;
  airtime?: string | null;
  airstamp?: string | null;
  runtime?: number | null;
  summary?: string | null;
}

export interface TVMazeScheduleEntry {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  airstamp?: string | null;
  runtime?: number | null;
  show: TVMazeShow;
}

export class TVMazeError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "TVMazeError";
  }
}

async function tvmazeFetch<T>(path: string): Promise<T> {
  const url = `${TVMAZE_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
  } catch {
    throw new TVMazeError(`Network error fetching ${path}`);
  }

  if (response.status === 404) {
    return [] as T;
  }

  if (!response.ok) {
    throw new TVMazeError(
      `TVMaze API error: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const text = await response.text();
  if (!text) {
    return [] as T;
  }

  return JSON.parse(text) as T;
}

export function showNetwork(show: TVMazeShow): string | null {
  return show.network?.name ?? show.webChannel?.name ?? null;
}

export async function searchShows(query: string): Promise<TVMazeSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const encoded = encodeURIComponent(trimmed);
  const results = await tvmazeFetch<TVMazeSearchResult[]>(
    `/search/shows?q=${encoded}`,
  );

  return Array.isArray(results) ? results : [];
}

export async function getShow(id: number): Promise<TVMazeShow | null> {
  try {
    return await tvmazeFetch<TVMazeShow>(`/shows/${id}?embed=episodes`);
  } catch (error) {
    if (error instanceof TVMazeError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getEpisodes(id: number): Promise<TVMazeEpisode[]> {
  const episodes = await tvmazeFetch<TVMazeEpisode[]>(`/shows/${id}/episodes`);
  return Array.isArray(episodes) ? episodes : [];
}

export async function getSchedule(
  date: string,
  country = "GB",
): Promise<TVMazeScheduleEntry[]> {
  const entries = await tvmazeFetch<TVMazeScheduleEntry[]>(
    `/schedule?country=${country}&date=${date}`,
  );
  return Array.isArray(entries) ? entries : [];
}

export function parseAirDate(
  airdate?: string | null,
  airtime?: string | null,
  airstamp?: string | null,
): Date | null {
  if (airstamp) {
    const parsed = new Date(airstamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (!airdate) {
    return null;
  }

  const time = airtime && airtime.length > 0 ? airtime : "00:00";
  const parsed = new Date(`${airdate}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getScheduleRange(
  startDate: Date,
  days: number,
  country = "GB",
): Promise<TVMazeScheduleEntry[]> {
  const all: TVMazeScheduleEntry[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const iso = formatDateISO(date);
    const dayEntries = await getSchedule(iso, country);
    all.push(...dayEntries);

    if (i < days - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return all;
}
