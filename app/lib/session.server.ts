import { createCookieSessionStorage } from "@remix-run/node";

export interface SessionUser {
  email: string;
  name: string;
}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be set in production.");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret ?? "dev-only-insecure-secret"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

export function getUserFromSession(
  session: Awaited<ReturnType<typeof getSession>>
): SessionUser | null {
  const user = session.get("user") as SessionUser | undefined;
  return user?.email ? user : null;
}
