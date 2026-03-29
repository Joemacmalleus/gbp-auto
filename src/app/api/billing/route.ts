import { NextResponse } from "next/server";

// POST /api/billing — disabled for beta
export async function POST() {
  return NextResponse.json(
    { error: "Billing is not enabled in beta" },
    { status: 501 }
  );
}
