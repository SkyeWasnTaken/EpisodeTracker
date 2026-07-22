import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "@/app/shows/[id]/follow-button";
import { getShow, showNetwork } from "@/lib/tvmaze";
import { isFollowingShow } from "@/lib/user";
import { getCurrentUser } from "@/lib/auth";

interface ShowPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowPage({ params }: ShowPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const tvmazeId = Number(id);

  if (!Number.isFinite(tvmazeId)) {
    notFound();
  }

  const show = await getShow(tvmazeId);
  if (!show) {
    notFound();
  }

  const following = await isFollowingShow(tvmazeId);
  const network = showNetwork(show);
  const posterUrl = show.image?.medium ?? show.image?.original ?? null;
  const summary = show.summary?.replace(/<[^>]+>/g, "") ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <Link href="/search" className="text-sm text-blue-500 hover:underline">
        ← Back to search
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative mx-auto h-72 w-48 shrink-0 overflow-hidden rounded-xl bg-zinc-100 shadow-sm sm:mx-0">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={show.name}
              fill
              className="object-cover"
              sizes="192px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No poster
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{show.name}</h1>
            <p className="mt-1 text-zinc-600">
              {network ?? "Unknown network"} · {show.status}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {show.genres?.join(", ") || "No genres listed"}
            </p>
          </div>

          {summary && (
            <p className="text-sm leading-6 text-zinc-700">{summary}</p>
          )}

          <FollowButton tvmazeId={tvmazeId} initialFollowing={following} />
        </div>
      </div>
    </div>
  );
}