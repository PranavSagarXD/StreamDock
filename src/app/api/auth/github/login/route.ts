import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { authorizeUrl } from "@/lib/auth/github";
import { setOAuthState } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const state = randomBytes(16).toString("base64url");
  await setOAuthState(state);

  const siteUrl = env.SITE_URL();
  const redirectUri =
    siteUrl !== "http://localhost:3000"
      ? `${siteUrl}/api/auth/github/callback`
      : `${new URL(req.url).origin}/api/auth/github/callback`;

  return NextResponse.redirect(authorizeUrl(state, redirectUri));
}
