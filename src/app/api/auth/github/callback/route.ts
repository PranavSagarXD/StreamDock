import { NextResponse } from "next/server";
import { exchangeCodeForToken, getCurrentUser, getRepoPermission, isAdminPermission } from "@/lib/auth/github";
import { createSession, consumeOAuthState } from "@/lib/auth/session";
import { db, COLLECTIONS } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl(req: Request): string {
  const fromEnv = env.SITE_URL();
  if (fromEnv !== "http://localhost:3000") return fromEnv;
  const origin = new URL(req.url).origin;
  console.log("OAuth: SITE_URL not set, using request origin:", origin);
  return origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");

  const home = siteUrl(req);

  if (errParam) {
    return NextResponse.redirect(`${home}/admin-panel/login?error=${encodeURIComponent(errParam)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${home}/admin-panel/login?error=missing_code`);
  }
  if (!(await consumeOAuthState(state))) {
    console.warn("OAuth state mismatch: expected cookie not found or doesn't match");
    return NextResponse.redirect(`${home}/admin-panel/login?error=bad_state`);
  }

  try {
    const { token } = await exchangeCodeForToken(code);
    console.log("OAuth: token exchanged successfully");
    const user = await getCurrentUser(token);
    console.log("OAuth: authenticated as", user.login);
    const perm = await getRepoPermission(token, user.login);
    console.log("OAuth: repo permission for", user.login, "is", perm);

    if (!isAdminPermission(perm)) {
      return NextResponse.redirect(`${home}/admin-panel/unauthorized?login=${encodeURIComponent(user.login)}`);
    }

    await createSession({
      githubLogin: user.login,
      githubId: user.id,
      avatarUrl: user.avatar_url,
      token,
      permission: perm,
    });
    console.log("OAuth: session created");

    // Upsert into admins collection
    const d = await db();
    await d.collection(COLLECTIONS.admins).updateOne(
      { githubLogin: user.login },
      {
        $set: {
          githubLogin: user.login,
          avatarUrl: user.avatar_url,
          permission: perm,
          lastLoginAt: new Date(),
        },
        $setOnInsert: { addedAt: new Date() },
      },
      { upsert: true },
    );

    console.log("OAuth: login complete, redirecting to /admin-panel");
    return NextResponse.redirect(`${home}/admin-panel`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("OAuth callback error:", msg);
    return NextResponse.redirect(`${home}/admin-panel/login?error=${encodeURIComponent(msg)}`);
  }
}
