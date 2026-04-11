import Stripe from "stripe";

export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  async createCheckoutSession({ line_items = [] } :Stripe.Checkout.SessionCreateParams) {
    return await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      line_items,
    });
  }

  async refundPayment(
    chargeId: string,
    reason: Stripe.RefundCreateParams["reason"]
  ) {
    return await this.stripe.refunds.create({
      payment_intent: chargeId,
      reason,
    });
  }
}
