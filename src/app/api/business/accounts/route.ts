import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { ensureValidToken, listAccounts } from "@/lib/google";
import { withErrorHandler, createAuthError } from "@/lib/errors";

const handler = withErrorHandler(async () => {
  const user = await requireSession();

  if (!user.accessToken) {
    throw createAuthError("Not connected to Google");
  }

  const validToken = await ensureValidToken(user);
  const accounts = await listAccounts(validToken);

  return NextResponse.json({ accounts });
});

export const GET = handler;
