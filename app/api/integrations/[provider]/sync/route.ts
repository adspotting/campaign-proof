import { requireViewer } from "@/lib/auth";
import { syncConnection } from "@/lib/crm";
import type { CrmProvider } from "@/lib/runtime";

function providerFrom(value: string): CrmProvider | null {
  return value === "hubspot" || value === "salesforce" ? value : null;
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  try {
    const viewer = await requireViewer(request);
    const provider = providerFrom((await context.params).provider);
    if (!provider) return Response.json({ error: "Unknown CRM provider." }, { status: 404 });
    const body = await request.json() as { connection_id?: number };
    const connectionId = Number(body.connection_id);
    if (!Number.isSafeInteger(connectionId) || connectionId <= 0) return Response.json({ error: "A valid connection_id is required." }, { status: 400 });
    return Response.json(await syncConnection(viewer.userId, connectionId, provider));
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "The CRM sync failed." }, { status: 500 });
  }
}
