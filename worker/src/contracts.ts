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

export type WorkerEnv = Omit<Env, "ENVIRONMENT"> & {
  ENVIRONMENT: "development" | "production";
  EMAILJS_PRIVATE_KEY?: string;
  LOCAL_ADMIN_TOKEN?: string;
};
