import { randomUUID } from "node:crypto";
import { redirect } from "@remix-run/node";
import {
  commitSession,
  getSession,
  type SessionUser,
} from "./session.server";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";

interface GoogleTokens {
  access_token: string;
}

interface GoogleUserInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

/**
 * Emails allowed to sign in to /admin via Google. Comma-separated
 * ADMIN_EMAILS env var. When unset, any verified Google account can
 * sign in — set ADMIN_EMAILS in production.
 */
function allowedEmails(): string[] | null {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || !raw.trim()) return null;
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  const allowlist = allowedEmails();
  if (!allowlist) return true;
  return allowlist.includes(email.toLowerCase());
}

export function buildGoogleAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/auth/google/callback`,
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function startGoogleAuth(request: Request): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));
  const state = randomUUID();
  session.set("oauth:state", state);
  return redirectWithSession(
    buildGoogleAuthUrl(new URL(request.url).origin, state),
    session
  );
}

async function redirectWithSession(
  to: string,
  session: Awaited<ReturnType<typeof getSession>>
): Promise<Response> {
  return redirect(to, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }
  return (await response.json()) as GoogleTokens;
}

export async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`User info request failed: ${response.status}`);
  }
  return (await response.json()) as GoogleUserInfo;
}

export async function completeGoogleSignIn(
  request: Request,
  code: string | null,
  state: string | null,
  oauthError: string | null
): Promise<{ user?: SessionUser; error?: "auth_failed" | "not_authorized" }> {
  const session = await getSession(request.headers.get("Cookie"));
  const expectedState = session.get("oauth:state") as string | undefined;
  session.unset("oauth:state");

  try {
    if (
      oauthError ||
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState
    ) {
      throw new Error("invalid_oauth_response");
    }

    const tokens = await exchangeCodeForTokens(
      code,
      `${new URL(request.url).origin}/auth/google/callback`
    );
    const userInfo = await fetchUserInfo(tokens.access_token);

    if (!userInfo.email || !userInfo.email_verified) {
      throw new Error("email_unavailable");
    }
    if (!isAllowedEmail(userInfo.email)) {
      // Persist the cleared state cookie even on rejection.
      await commitSession(session);
      return { error: "not_authorized" };
    }

    const user: SessionUser = {
      email: userInfo.email,
      name: userInfo.name ?? "",
    };
    session.set("user", user);
    await commitSession(session);
    return { user };
  } catch {
    await commitSession(session);
    return { error: "auth_failed" };
  }
}
