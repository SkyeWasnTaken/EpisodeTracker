"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface SearchShowResult {
  id: number;
  name: string;
  network: string | null;
  genres: string[];
  status: string;
  posterUrl: string | null;
  score: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchShowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/shows/search?q=${encodeURIComponent(trimmed)}`,
      );
      const data = (await response.json()) as {
        results?: SearchShowResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Search failed");
      }

      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-blue-500 hover:underline">
          ← Back to this week
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Search shows</h1>
        <p className="mt-1 text-zinc-600">
          Find a show on TVMaze and follow it to track this week&apos;s airings.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search e.g. arcane, doctor who…"
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base shadow-sm outline-none ring-blue-500 focus:ring-2"
        autoFocus
      />

      {loading && <p className="text-sm text-zinc-500">Searching…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {results.map((show) => (
          <li key={show.id}>
            <Link
              href={`/shows/${show.id}`}
              className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
            >
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {show.posterUrl ? (
                  <Image
                    src={show.posterUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    No art
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">{show.name}</h2>
                <p className="text-sm text-zinc-600">
                  {show.network ?? "Unknown network"} · {show.status}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {show.genres.join(", ") || "No genres listed"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && query.trim() && results.length === 0 && !error && (
        <p className="text-sm text-zinc-500">No shows found for &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
