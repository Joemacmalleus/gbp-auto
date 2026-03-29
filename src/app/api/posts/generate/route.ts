import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generatePostCalendar } from "@/lib/ai";

export async function POST() {
  try {
    const user = await requireSession();
    if (user.plan === "FREE") {
      return NextResponse.json({ error: "Upgrade to generate posts" }, { status: 403 });
    }

    const business = user.businesses[0];
    if (!business) {
      return NextResponse.json({ error: "No business" }, { status: 404 });
    }

    // Generate 4 posts for the coming month
    const calendar = await generatePostCalendar(
      business.name,
      business.category || "Business",
      business.description || undefined,
      4
    );

    // Map suggested days to actual dates
    const dayMap: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
      Friday: 5, Saturday: 6, Sunday: 0,
    };

    const now = new Date();
    const posts = await Promise.all(
      calendar.map(async (item, idx) => {
        // Schedule weekly, starting next week
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + 7 + idx * 7);

        // Try to match suggested day of week
        const targetDay = dayMap[item.suggestedDay];
        if (targetDay !== undefined) {
          const diff = (targetDay - scheduledDate.getDay() + 7) % 7;
          scheduledDate.setDate(scheduledDate.getDate() + diff);
        }
        scheduledDate.setHours(10, 0, 0, 0); // 10 AM

        const topicMap: Record<string, string> = {
          general: "GENERAL", offer: "OFFER", event: "EVENT",
          tip: "TIP", seasonal: "SEASONAL", product: "PRODUCT",
        };

        return prisma.post.create({
          data: {
            businessId: business.id,
            content: item.content,
            topicType: (topicMap[item.topic] as any) || "GENERAL",
            status: "DRAFT",
            scheduledFor: scheduledDate,
            aiGenerated: true,
            aiPrompt: `Generated as part of monthly content calendar`,
          },
        });
      })
    );

    await prisma.activity.create({
      data: {
        businessId: business.id,
        type: "POST_GENERATED",
        title: `${posts.length} new posts generated`,
        detail: "Review and approve them in the Posts tab",
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Generate posts error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
