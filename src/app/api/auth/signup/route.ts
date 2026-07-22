import { NextResponse } from "next/server";
import { signup, login } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, displayName, securityAnswer } = (await request.json()) as {
      email: string;
      password: string;
      displayName: string;
      securityAnswer?: string;
    };

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    const result = await signup(email, password, displayName, securityAnswer);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const loginResult = await login(email, password);

    if ("error" in loginResult) {
      return NextResponse.json({ error: loginResult.error }, { status: 500 });
    }

    const response = NextResponse.json({ user: result.user });
    const maxAge = 7 * 24 * 60 * 60;
    const isProd = process.env.NODE_ENV === "production";
    response.headers.set(
      "Set-Cookie",
      `episodetrack_session=${encodeURIComponent(loginResult.sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${isProd ? "; Secure" : ""}`,
    );
    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}