declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    PAYSTACK_PUBLIC_KEY?: string;
    PAYSTACK_SECRET_KEY?: string;
    APP_BASE_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  }
}
