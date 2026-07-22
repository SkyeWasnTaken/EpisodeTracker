"use client";

import { useState, useTransition } from "react";
import { followShow, unfollowShow } from "@/app/shows/[id]/actions";

interface FollowButtonProps {
  tvmazeId: number;
  initialFollowing: boolean;
}

export function FollowButton({
  tvmazeId,
  initialFollowing,
}: FollowButtonProps) {
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  function handleClick() {
    startTransition(async () => {
      if (following) {
        await unfollowShow(tvmazeId);
        setFollowing(false);
      } else {
        await followShow(tvmazeId);
        setFollowing(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
        following
          ? "border border-blue-500 bg-white text-blue-600 hover:bg-blue-50"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } disabled:opacity-60`}
    >
      {pending ? "Saving…" : following ? "Following" : "Follow"}
    </button>
  );
}
