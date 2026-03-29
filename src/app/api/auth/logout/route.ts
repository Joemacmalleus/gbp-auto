import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("gbp_session");

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_URL || "https://gbp-auto.vercel.app"));
}
