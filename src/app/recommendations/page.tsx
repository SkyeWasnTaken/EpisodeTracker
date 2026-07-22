import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { getRecommendations, type ScoredShow } from "@/lib/recommendations";

function scoreColor(score: number) {
  if (score >= 6) return "bg-blue-600";
  if (score >= 4) return "bg-blue-500";
  if (score >= 2) return "bg-blue-400";
  return "bg-blue-300";
}

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const recommendations = await getRecommendations(user.id, user.householdId, 12);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-blue-500 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Recommended for you</h1>
        <p className="mt-1 text-zinc-600">
          Based on your genre ratings, watch limits, and streaming services.
        </p>
        {recommendations.length === 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            Rate some genres in settings to unlock personalised picks.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec: ScoredShow) => (
          <Link
            key={rec.id}
            href={`/shows/${rec.id}`}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              {rec.posterUrl ? (
                <span className="relative h-16 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  <Image src={rec.posterUrl} alt="" fill className="object-cover" sizes="40px" />
                </span>
              ) : (
                <span className="h-16 w-10 rounded-md bg-zinc-100 text-xs text-zinc-400" />
              )}
              <span className="text-sm font-semibold text-zinc-900 leading-tight">{rec.name}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${scoreColor(rec.score)}`} />
                <span className="text-xs text-zinc-700">{rec.reason}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {rec.network ?? "Unknown"} · {rec.status} · {rec.genres.slice(0, 3).join(", ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}