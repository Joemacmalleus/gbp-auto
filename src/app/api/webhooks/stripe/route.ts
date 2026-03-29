import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const subscription = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "ACTIVE",
            stripeId: session.customer,
            subscriptionId: session.subscription,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const user = await prisma.user.findFirst({
        where: { subscriptionId: subscription.id },
      });
      if (user) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: isActive ? "ACTIVE" : "CANCELLED" },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const user = await prisma.user.findFirst({
        where: { subscriptionId: subscription.id },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "CANCELLED", subscriptionId: null },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
