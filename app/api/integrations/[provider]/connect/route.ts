import { requireViewer } from "@/lib/auth";
import { authorizationUrl } from "@/lib/crm";
import { providerConfigured, type CrmProvider } from "@/lib/runtime";

function providerFrom(value: string): CrmProvider | null {
  return value === "hubspot" || value === "salesforce" ? value : null;
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  try {
    const viewer = await requireViewer(request);
    const provider = providerFrom((await context.params).provider);
    if (!provider) return Response.json({ error: "Unknown CRM provider." }, { status: 404 });
    if (!providerConfigured(provider)) return Response.json({ error: `${provider === "hubspot" ? "HubSpot" : "Salesforce"} OAuth credentials are not configured yet.` }, { status: 503 });
    return Response.json({ url: await authorizationUrl(provider, viewer.userId, request) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Could not start the CRM connection." }, { status: 500 });
  }
}
