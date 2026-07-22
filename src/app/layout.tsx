import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { AuthNav } from "@/components/auth-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EpisodeTrack — TV Concierge",
  description: "Track shows you follow and see what's airing this week.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-blue-600">
              EpisodeTrack
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-zinc-700 hover:text-blue-600">
                This week
              </Link>
              <Link
                href="/calendar"
                className="text-zinc-700 hover:text-blue-600"
              >
                Calendar
              </Link>
              <Link
                href="/search"
                className="text-zinc-700 hover:text-blue-600"
              >
                Search
              </Link>
              <Link
                href="/recommendations"
                className="text-zinc-700 hover:text-blue-600"
              >
                For you
              </Link>
              <AuthNav user={user} />
            </div>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}