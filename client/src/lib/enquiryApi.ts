export type EnquiryErrorCategory =
  | "verification"
  | "validation"
  | "temporary"
  | "unknown";

export interface EnquiryInput {
  type: "contact" | "sponsorship";
  name: string;
  email: string;
  message: string;
  sponsorshipTier: string | null;
  sourcePage: "home" | "sponsors";
  turnstileToken: string;
  idempotencyKey: string;
}

export type EnquiryPayload = Omit<
  EnquiryInput,
  "turnstileToken" | "idempotencyKey"
>;

export interface EnquiryAttempt {
  idempotencyKey: string;
  payloadFingerprint: string;
}

export interface EnquiryReceipt {
  id: string;
  status: "received";
}

export class EnquirySubmissionError extends Error {
  constructor(public readonly category: EnquiryErrorCategory) {
    super(`Enquiry submission failed: ${category}`);
    this.name = "EnquirySubmissionError";
  }
}

export const enquiryAttemptFor = (
  payload: EnquiryPayload,
  current: EnquiryAttempt | null
): EnquiryAttempt => {
  const payloadFingerprint = JSON.stringify(payload);
  if (current?.payloadFingerprint === payloadFingerprint) return current;
  return { idempotencyKey: crypto.randomUUID(), payloadFingerprint };
};

const categoryForStatus = (status: number): EnquiryErrorCategory => {
  if (status === 403) return "verification";
  if (status === 422) return "validation";
  if (status === 503) return "temporary";
  return "unknown";
};

const isReceipt = (value: unknown): value is EnquiryReceipt => {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Record<string, unknown>;
  return typeof receipt.id === "string" && receipt.status === "received";
};

export async function submitEnquiry(
  input: EnquiryInput
): Promise<EnquiryReceipt> {
  let response: Response;
  try {
    response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new EnquirySubmissionError("temporary");
  }

  if (!response.ok) {
    throw new EnquirySubmissionError(categoryForStatus(response.status));
  }

  try {
    const receipt: unknown = await response.json();
    if (isReceipt(receipt)) return receipt;
  } catch {
    // Treat malformed success responses as an unknown safe failure.
  }

  throw new EnquirySubmissionError("unknown");
}
