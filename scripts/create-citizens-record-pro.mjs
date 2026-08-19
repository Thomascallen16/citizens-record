import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured.");
}

const stripe = new Stripe(secretKey);
const product = await stripe.products.create(
  {
    name: "Citizens Record Pro",
    description: "Source-linked motion drafting and subscription access for Citizens Record.",
    metadata: { application: "citizens-record", entitlement: "motion-drafting" },
  },
  { idempotencyKey: "citizens-record-pro-product-v1" },
);

const price = await stripe.prices.create(
  {
    product: product.id,
    currency: "usd",
    unit_amount: 1900,
    recurring: { interval: "month" },
    metadata: { application: "citizens-record", entitlement: "motion-drafting" },
  },
  { idempotencyKey: "citizens-record-pro-price-usd-monthly-v1" },
);

console.log(JSON.stringify({ productId: product.id, priceId: price.id }));
