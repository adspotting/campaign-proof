# Campaign Proof

Campaign Proof is the evidence layer for B2B campaign reporting. It connects CRM and campaign records to a versioned, deal-cycle-aware attribution model and preserves the source lineage behind every report.

## Included in this repository

- Public product site and “Campaign Proof vs. a generic AI prompt” positioning
- Authenticated integration workspace
- HubSpot OAuth connection and deal sync
- Salesforce OAuth connection and opportunity/campaign sync
- Campaign Proof REST API with hashed, revocable API keys
- Idempotent imports based on `source + external_id`
- Encrypted CRM tokens and auditable sync history
- Versioned 90-day attribution output
- Supabase migration with least-privilege grants and RLS enabled
- OpenAPI 3.1 contract at `/openapi.json`

## Required environment variables

Copy `.env.example` to a local environment file and populate it through your hosting provider. Never commit credentials.

The application needs Supabase URL, publishable and secret keys; two random high-entropy secrets for OAuth state and token encryption; and OAuth app credentials from HubSpot and Salesforce.

## Provider callback URLs

Register these exact production callbacks in each provider application:

- `https://campaignproof.app/api/integrations/hubspot/callback`
- `https://campaignproof.app/api/integrations/salesforce/callback`

## Data model

Apply `supabase/migrations/20260909000000_crm_integrations.sql` to the Campaign Proof Supabase project. All product tables are server-only: `anon` and `authenticated` have no direct table grants, and the backend validates the signed-in user or Campaign Proof API key before using the secret key.

## Local commands

```bash
npm install
npm run build
```

The hosted Worker must receive runtime secrets through its environment. Do not add secrets to GitHub Actions, committed files, browser bundles, or OAuth redirect URLs.
