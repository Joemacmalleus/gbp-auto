import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listAccounts } from "@/lib/google";

export async function GET() {
  try {
    const user = await requireSession();
    if (!user.accessToken) {
      return NextResponse.json({ error: "Not connected to Google" }, { status: 401 });
    }
    const accounts = await listAccounts(user.accessToken);
    return NextResponse.json({ accounts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
