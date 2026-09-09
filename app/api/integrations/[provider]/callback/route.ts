import { completeOAuth } from "@/lib/crm";
import { publicOrigin, type CrmProvider } from "@/lib/runtime";

function providerFrom(value: string): CrmProvider | null {
  return value === "hubspot" || value === "salesforce" ? value : null;
}

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const provider = providerFrom((await context.params).provider);
  const origin = publicOrigin(request);
  if (!provider) return Response.redirect(`${origin}/integrations?error=unknown_provider`);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return Response.redirect(`${origin}/integrations?error=oauth_cancelled`);
  try {
    await completeOAuth(provider, code, state, request);
    return Response.redirect(`${origin}/integrations?connected=${provider}`);
  } catch (error) {
    console.error("OAuth callback failed", error instanceof Error ? error.message : error);
    return Response.redirect(`${origin}/integrations?error=oauth_failed`);
  }
}
