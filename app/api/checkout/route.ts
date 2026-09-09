import { requireViewer } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/stripe";

export async function POST(request: Request) {
  try { const viewer = await requireViewer(request); return Response.json({ url: await createSubscriptionCheckout(request, viewer.userId, viewer.email) }); }
  catch (error) { if (error instanceof Response) return error; return Response.json({ error: error instanceof Error ? error.message : "Checkout is unavailable." }, { status: 503 }); }
}
