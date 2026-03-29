import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listLocations, parseLocation } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession();
    const accountId = req.nextUrl.searchParams.get("account");
    if (!accountId || !user.accessToken) {
      return NextResponse.json({ error: "Missing account or token" }, { status: 400 });
    }
    const rawLocations = await listLocations(user.accessToken, accountId);
    const locations = rawLocations.map(parseLocation);
    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
