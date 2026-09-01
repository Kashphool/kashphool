export type EnquiryType = "contact" | "sponsorship";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface PublicEnquiryInput {
  idempotencyKey: string;
  type: EnquiryType;
  name: string;
  email: string;
  message: string;
  sponsorshipTier: string | null;
  sourcePage: "home" | "sponsors";
  turnstileToken: string;
}

export interface StoredEnquiry
  extends Omit<PublicEnquiryInput, "turnstileToken"> {
  id: string;
  notificationStatus: NotificationStatus;
  notificationAttemptedAt: string | null;
  notificationError: string | null;
  createdAt: string;
  expiresAt: string;
}

export type LeadSummary = Omit<StoredEnquiry, "message" | "idempotencyKey"> & {
  messageExcerpt: string;
};

export interface LeadPage {
  items: LeadSummary[];
  nextCursor: string | null;
  totals: { all: number; contact: number; sponsorship: number; failed: number };
}

export interface WorkerEnv {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_EXPECTED_HOSTNAME: string;
  TURNSTILE_VERIFY_URL: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  EMAILJS_PRIVATE_KEY?: string;
  EMAILJS_SEND_URL: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  ENVIRONMENT: "development" | "production";
  LOCAL_ADMIN_TOKEN?: string;
}
