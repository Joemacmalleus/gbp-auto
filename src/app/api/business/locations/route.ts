import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { ensureValidToken, listLocations, parseLocation } from "@/lib/google";
import { withErrorHandler, createValidationError, createAuthError } from "@/lib/errors";

const handler = withErrorHandler(async (req: NextRequest) => {
  const user = await requireSession();
  const accountId = req.nextUrl.searchParams.get("account");

  if (!accountId) {
    throw createValidationError("Missing account parameter");
  }

  if (!user.accessToken) {
    throw createAuthError("Not connected to Google");
  }

  const validToken = await ensureValidToken(user);
  const rawLocations = await listLocations(validToken, accountId);
  const locations = rawLocations.map(parseLocation);

  return NextResponse.json({ locations });
});

export const GET = handler;
