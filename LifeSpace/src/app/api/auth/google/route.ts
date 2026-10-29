import { cookies } from "next/headers";
import { isGoogleConfigured, newOAuthState, OAUTH_STATE_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The public origin, honouring reverse-proxy headers. */
function publicOrigin(request: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

function relative(path: string): Response {
  return new Response(null, { status: 307, headers: { Location: path } });
}

function callbackUrl(request: Request): string {
  return `${publicOrigin(request)}/api/auth/google/callback`;
}

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return relative("/login?error=google_not_configured");
  }

  const state = newOAuthState();
  const jar = await cookies();
  jar.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: callbackUrl(request),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    302,
  );
}
