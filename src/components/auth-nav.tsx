"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthNavUser {
  id: string;
  email: string;
  displayName: string;
  householdId: string;
}

export function AuthNav({ user }: { user: AuthNavUser | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-600"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings"
        className="text-zinc-700 hover:text-blue-600"
      >
        Settings
      </Link>
      <span className="text-sm text-zinc-400">{user.displayName}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-zinc-500 hover:text-red-600"
      >
        Sign out
      </button>
    </div>
  );
}