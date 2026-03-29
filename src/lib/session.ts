/**
 * Lightweight cookie-based session management with validation.
 * In production, replace with NextAuth or a proper JWT strategy.
 */

import { cookies } from "next/headers";
import { prisma } from "./db";
import { createAuthError } from "./errors";

const SESSION_COOKIE = "gbp_session";
const SESSION_TIMEOUT_MS = 60 * 60 * 24 * 30 * 1000; // 30 days

export interface SessionData {
  userId: string;
  createdAt: number; // Timestamp when session was created
}

/**
 * Validate session data format and expiry
 */
function validateSessionData(data: unknown): SessionData | null {
  if (!data || typeof data !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("userId" in parsed) ||
      !("createdAt" in parsed)
    ) {
      return null;
    }

    const sessionData = parsed as { userId?: unknown; createdAt?: unknown };
    if (typeof sessionData.userId !== "string") return null;
    if (typeof sessionData.createdAt !== "number") return null;

    // Check expiry
    const now = Date.now();
    if (now - sessionData.createdAt > SESSION_TIMEOUT_MS) {
      return null; // Session expired
    }

    return sessionData as SessionData;
  } catch {
    return null; // Malformed session data
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  const sessionData: SessionData = {
    userId,
    createdAt: Date.now(),
  };

  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionValue) {
    return null;
  }

  // Validate session data
  const sessionData = validateSessionData(sessionValue);
  if (!sessionData) {
    // Invalid or expired session
    await clearSession();
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionData.userId },
    include: {
      businesses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return user;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) {
    throw createAuthError("Not authenticated");
  }
  return user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
