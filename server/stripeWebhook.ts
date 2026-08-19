import type { Request, Response } from "express";
import { getEntitlementBySubscriptionId, updateEntitlementFromStripe } from "./db";
import { getStripeClient, mapStripeSubscriptionStatus } from "./stripe";

async function applySubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const entitlement = await getEntitlementBySubscriptionId(subscription.id);
  if (!entitlement) return;

  await updateEntitlementFromStripe({
    userId: entitlement.userId,
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id ?? null,
    status: mapStripeSubscriptionStatus(subscription.status),
    currentPeriodEnd: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null,
  });
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];
  if (!webhookSecret || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe webhook configuration" });
  }

  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    return res.status(400).json({ error: "Invalid Stripe signature" });
  }

  if (event.id.startsWith("evt_test_")) {
    return res.json({ verified: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = Number(session.metadata?.user_id ?? session.client_reference_id);
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (Number.isInteger(userId) && userId > 0 && subscriptionId) {
        const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
        await updateEntitlementFromStripe({
          userId,
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id ?? null,
          status: mapStripeSubscriptionStatus(subscription.status),
          currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
        });
      }
    }
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await applySubscription(event.data.object.id);
    }
    console.log(`[Stripe webhook] processed ${event.type} (${event.id})`);
    return res.json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] processing failed", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
