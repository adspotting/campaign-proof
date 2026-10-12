import { verifyStripeEvent } from "@/lib/stripe";
import { supabaseRest } from "@/lib/supabase-rest";

type StripeObject = { id: string; status?: string; payment_status?: string; customer?: string; subscription?: string; current_period_end?: number; metadata?: { user_id?: string }; client_reference_id?: string };
export async function POST(request: Request) {
  const body = await request.text();
  if (!await verifyStripeEvent(body, request.headers.get("stripe-signature"))) return Response.json({ error: "Invalid signature." }, { status: 400 });
  const event = JSON.parse(body) as { id: string; type: string; data: { object: StripeObject } };
  const object = event.data.object;
  const userId = object.metadata?.user_id ?? object.client_reference_id;
  const checkoutEvent = event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
  const paidCheckout = checkoutEvent && (object.payment_status === "paid" || object.payment_status === "no_payment_required");
  if (userId && (event.type.startsWith("customer.subscription.") || paidCheckout)) {
    const subscriptionId = checkoutEvent ? object.subscription : object.id;
    const subscriptionStatus = checkoutEvent ? "active" : object.status ?? "active";
    if (subscriptionId) await supabaseRest("subscriptions?on_conflict=stripe_subscription_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: userId, stripe_subscription_id: subscriptionId, stripe_customer_id: object.customer ?? null, status: subscriptionStatus, current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null, updated_at: new Date().toISOString() }) });
  }
  return Response.json({ received: true });
}
