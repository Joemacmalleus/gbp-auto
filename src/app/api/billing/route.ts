import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";

// POST /api/billing — create checkout session or portal session
export async function POST() {
  try {
    const user = await requireSession();

    // If already subscribed, send to billing portal
    if (user.stripeId) {
      const portal = await createPortalSession(user.stripeId);
      return NextResponse.json({ url: portal.url });
    }

    // Otherwise, create a new checkout session
    const session = await createCheckoutSession(user.id, user.email);
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
