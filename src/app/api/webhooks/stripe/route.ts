import { NextResponse } from "next/server";

// POST /api/webhooks/stripe — disabled for beta
export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhooks not enabled in beta" },
    { status: 501 }
  );
}
