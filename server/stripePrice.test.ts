import Stripe from "stripe";
import { describe, expect, it } from "vitest";

const priceId = process.env.MOTION_DRAFTING_PRICE_ID;
const secretKey = process.env.STRIPE_SECRET_KEY;

describe("Citizens Record Pro Stripe price", () => {
  it.skipIf(!priceId || !secretKey)("resolves the protected USD 19 monthly recurring price", async () => {
    const stripe = new Stripe(secretKey!);
    const price = await stripe.prices.retrieve(priceId!);
    expect(price.active).toBe(true);
    expect(price.currency).toBe("usd");
    expect(price.unit_amount).toBe(1900);
    expect(price.recurring?.interval).toBe("month");
  });
});
