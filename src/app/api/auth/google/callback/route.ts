import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo } from "@/lib/google";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  try {
    // Exchange auth code for tokens
    const tokens = await exchangeCode(code);
    const userInfo = await getUserInfo(tokens.access_token!);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { googleId: userInfo.googleId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        email: userInfo.email,
        name: userInfo.name,
      },
      create: {
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.googleId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        plan: "FREE",
      },
      include: { businesses: true },
    });

    await setSession(user.id);

    // If user has no businesses connected yet, send to connect flow
    if (user.businesses.length === 0) {
      return NextResponse.redirect(new URL("/connect", req.url));
    }

    // Otherwise go straight to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", req.url));
  }
}
