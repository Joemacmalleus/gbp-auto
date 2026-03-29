import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireSession();
    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: "No business" }, { status: 404 });
    }

    const posts = await prisma.post.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
