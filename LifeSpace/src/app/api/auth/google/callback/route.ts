import { cookies } from "next/headers";
import { seedStarterSheet } from "@/db/sheet-data";
import {
  createSession,
  createUser,
  findUserByEmail,
  isGoogleConfigured,
  OAUTH_STATE_COOKIE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

type GoogleClaims = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};

function decodeIdToken(idToken: string): GoogleClaims | null {
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64");
    return JSON.parse(payload.toString("utf8")) as GoogleClaims;
  } catch {
    return null;
  }
}

function relative(path: string): Response {
  return new Response(null, { status: 307, headers: { Location: path } });
}

function fail(_request: Request, reason: string) {
  return relative(`/login?error=${reason}`);
}

function publicOrigin(request: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  if (!isGoogleConfigured()) return fail(request, "google_not_configured");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return fail(request, "google_cancelled");
  if (!code || !state) return fail(request, "google_failed");

  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) return fail(request, "google_state");

  try {
    const redirectUri = `${publicOrigin(request)}/api/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed", await tokenResponse.text());
      return fail(request, "google_failed");
    }

    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokens.id_token) return fail(request, "google_failed");

    const claims = decodeIdToken(tokens.id_token);
    if (!claims?.email || claims.email_verified === false) return fail(request, "google_email");

    const email = claims.email.toLowerCase();
    const name = claims.name || claims.given_name || email.split("@")[0];
    const avatarUrl = claims.picture ?? null;

    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({ email, name, provider: "google", avatarUrl });
    }
    await seedStarterSheet(user.id);
    await createSession(user.id);

    return relative("/");
  } catch (error) {
    console.error("GET /api/auth/google/callback failed", error);
    return fail(request, "google_failed");
  }
}
