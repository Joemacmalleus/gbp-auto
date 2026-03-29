/**
 * Lightweight cookie-based session management.
 * In production, replace with NextAuth or a proper JWT strategy.
 */

import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "gbp_session";

export async function setSession(userId: string) {
  // Simple signed cookie — swap for JWT in production
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
