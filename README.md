# Campaign Proof

Campaign Proof is the evidence layer for B2B campaign reporting. It connects CRM and campaign records to a versioned, deal-cycle-aware attribution model and preserves the source lineage behind every report.

## Included in this repository

- Free B2B campaign ROI calculator
- $39/month Campaign Proof Pro report builder
- Branded PDF customization and saved report history
- Public “Campaign Proof vs. a generic AI prompt” positioning
- Google OAuth and email/password registration through Supabase Auth
- Stripe Checkout subscriptions with webhook-driven Pro entitlements
- Authenticated integration workspace
- HubSpot OAuth connection and deal sync
- Salesforce OAuth connection and opportunity/campaign sync
- Campaign Proof REST API with hashed, revocable API keys
- Idempotent imports based on `source + external_id`
- Encrypted CRM tokens and auditable sync history
- Versioned 90-day attribution output
- Supabase migrations with least-privilege grants and RLS enabled
- OpenAPI 3.1 contract at `/openapi.json`

## Required environment variables

Copy `.env.example` to a local environment file and populate values through the hosting provider. Never commit credentials.

The browser uses:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The server uses:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `STRIPE_RESTRICTED_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `CRM_TOKEN_ENCRYPTION_KEY`
- `CRM_STATE_SECRET`

HubSpot and Salesforce credentials are required only when those optional CRM connections are activated.

## Authentication

In Supabase Auth, enable email/password and Google. Add these URLs to the redirect allowlist:

- `https://getcampaignproof.com/auth/callback`
- `https://www.getcampaignproof.com/auth/callback`

Google’s OAuth client secret belongs in Supabase, not in this repository or the browser environment.

For production email confirmation and password recovery, configure Resend as Supabase custom SMTP. Keep the Resend API key in Supabase’s SMTP settings rather than GitHub.

## Pro subscriptions

Campaign Proof Pro uses the recurring Stripe Price stored in `STRIPE_PRICE_ID`. The production restricted key requires write access to Checkout Sessions.

Register the production webhook endpoint:

`https://getcampaignproof.com/api/stripe/webhook`

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`

The webhook records Stripe subscription status in Supabase. Only `active` and `trialing` subscriptions receive Pro access.

## Provider callback URLs

Register these exact production callbacks in each provider application:

- `https://getcampaignproof.com/api/integrations/hubspot/callback`
- `https://getcampaignproof.com/api/integrations/salesforce/callback`

## Data model

Apply both migrations in `supabase/migrations/` to the Campaign Proof Supabase project, in filename order. Product tables are server-only: `anon` and `authenticated` have no direct table grants, and the backend validates the signed-in user or Campaign Proof API key before using the secret key.

## Local commands

```bash
npm install
npm run build
```

The hosted Worker must receive runtime secrets through its environment. Do not add secrets to GitHub Actions, committed files, browser bundles, OAuth redirect URLs, or issue comments.
