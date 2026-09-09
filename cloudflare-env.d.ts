declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PUBLIC_SITE_URL?: string;
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SECRET_KEY?: string;
    CRM_TOKEN_ENCRYPTION_KEY?: string;
    CRM_STATE_SECRET?: string;
    HUBSPOT_CLIENT_ID?: string;
    HUBSPOT_CLIENT_SECRET?: string;
    SALESFORCE_CLIENT_ID?: string;
    SALESFORCE_CLIENT_SECRET?: string;
    SALESFORCE_LOGIN_URL?: string;
    STRIPE_RESTRICTED_KEY?: string;
    STRIPE_PRICE_ID?: string;
    STRIPE_WEBHOOK_SECRET?: string;
  }
}
