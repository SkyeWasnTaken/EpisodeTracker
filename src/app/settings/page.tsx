"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const UK_PLATFORMS = [
  "BBC iPlayer",
  "ITVX",
  "Channel 4",
  "My5",
  "Sky Go",
  "Now TV",
  "Netflix",
  "Disney+",
  "Amazon Prime Video",
  "Apple TV+",
  "Paramount+",
  "Discovery+",
  "UKTV Play",
  "All 4",
  "STV Player",
];

const ALL_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Children",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "Food",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Nature",
  "Reality",
  "Romance",
  "Science-Fiction",
  "Sport",
  "Suspense",
  "Thriller",
  "Travel",
  "War",
  "Western",
];

interface Preferences {
  genresWeighted: Record<string, number>;
  maxEpPerDay: number;
  preferredSlots: string[];
  bingeWeekend: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ displayName: string; email: string } | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    genresWeighted: {},
    maxEpPerDay: 3,
    preferredSlots: [],
    bingeWeekend: true,
  });
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/auth/login");
          return;
        }
        setUser(data.user);
        setDisplayName(data.user.displayName);
        setPlatforms(data.platforms.map((p: { name: string }) => p.name));
        setPreferences(data.preferences);
        setLoading(false);
      })
      .catch(() => {
        router.push("/auth/login");
      });
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          platforms: platforms.map((name) => ({ name, type: "subscription" })),
          preferences,
        }),
      });
      if (res.ok) {
        setMessage({ text: "Settings saved!", ok: true });
      } else {
        const data = await res.json();
        setMessage({ text: data.error ?? "Failed to save", ok: false });
      }
    } catch {
      setMessage({ text: "Network error", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    if (!confirm("Are you really sure? All your follows and data will be lost.")) return;

    try {
      await fetch("/api/settings", { method: "DELETE" });
      router.push("/auth/login");
      router.refresh();
    } catch {
      setMessage({ text: "Failed to delete account", ok: false });
    }
  }

  function togglePlatform(name: string) {
    setPlatforms((prev) =>
      prev.includes(name)
        ? prev.filter((p) => p !== name)
        : [...prev, name].sort(),
    );
  }

  function setGenreWeight(genre: string, weight: number) {
    setPreferences((prev) => ({
      ...prev,
      genresWeighted: { ...prev.genresWeighted, [genre]: weight },
    }));
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-blue-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        {user && (
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        )}
        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </section>

      {/* Streaming Platforms */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Your streaming services</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select the UK services you subscribe to. Recommendations will prefer shows on these platforms.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {UK_PLATFORMS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => togglePlatform(name)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                platforms.includes(name)
                  ? "bg-blue-500 text-white shadow-sm"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-blue-400"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Genre Preferences */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Genre preferences</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Rate how much you like each genre (0 = not interested, 5 = love it).
          Your ratings power AI recommendations.
        </p>
        <div className="mt-4 flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {ALL_GENRES.map((genre) => (
            <div key={genre} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-zinc-50">
              <span className="text-sm text-zinc-700">{genre}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setGenreWeight(genre, w)}
                    className={`h-7 w-7 rounded-full text-xs font-medium transition ${
                      (preferences.genresWeighted[genre] ?? 0) === w
                        ? w === 0
                          ? "border border-red-300 bg-red-50 text-red-500"
                          : "bg-blue-500 text-white shadow-sm"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-blue-300"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Limits */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Watch limits</h2>
        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Max episodes per day
        </label>
        <select
          value={preferences.maxEpPerDay}
          onChange={(e) =>
            setPreferences((prev) => ({ ...prev, maxEpPerDay: Number(e.target.value) }))
          }
          className="mt-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.bingeWeekend}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, bingeWeekend: e.target.checked }))
            }
            className="h-4 w-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-zinc-700">
            Binge weekends (unlimited on Sat/Sun)
          </span>
        </label>
      </section>

      {message && (
        <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>

      <hr className="border-zinc-200" />

      <button
        type="button"
        onClick={handleDelete}
        className="self-start text-sm text-red-500 hover:underline"
      >
        Delete account
      </button>
    </div>
  );
}