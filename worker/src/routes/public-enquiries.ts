import type {
  PublicEnquiryInput,
  StoredEnquiry,
  WorkerEnv,
} from "../contracts";
import { EnquiryRepository } from "../repositories/enquiries";
import { sendEnquiryEmail, type EmailResult } from "../services/emailjs";
import { verifyTurnstile, type TurnstileResult } from "../services/turnstile";
import { parsePublicEnquiry } from "../validation/enquiry";

const MAX_BODY_BYTES = 16 * 1024;

type EnquiryStore = Pick<
  EnquiryRepository,
  "findReceipt" | "create" | "markNotification"
>;

export interface PublicEnquiryDependencies {
  repository: EnquiryStore;
  verifyTurnstile: (
    input: { token: string; remoteIp: string },
    env: WorkerEnv
  ) => Promise<TurnstileResult>;
  sendEnquiryEmail: (
    input: PublicEnquiryInput,
    env: WorkerEnv
  ) => Promise<EmailResult>;
  now: () => Date;
}

const responseHeaders = (requestId: string): Headers =>
  new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  });

const jsonResponse = (
  body: unknown,
  status: number,
  requestId: string
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(requestId),
  });

const errorResponse = (
  code: string,
  status: number,
  requestId: string
): Response => jsonResponse({ error: { code } }, status, requestId);

const isAllowedOrigin = (origin: string | null, configured: string): boolean =>
  origin !== null &&
  configured
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .includes(origin);

const isJsonContentType = (value: string | null): boolean =>
  value?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";

const exceedsDeclaredLimit = (request: Request): boolean => {
  const header = request.headers.get("content-length");
  if (header === null) return false;
  const length = Number(header);
  return Number.isFinite(length) && length > MAX_BODY_BYTES;
};

const addUtcMonthsSafely = (source: Date, months: number): Date => {
  const result = new Date(source.getTime());
  const sourceDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(sourceDay, lastDay));
  return result;
};

const buildStoredEnquiry = (
  input: PublicEnquiryInput,
  now: Date
): StoredEnquiry => ({
  id: crypto.randomUUID(),
  idempotencyKey: input.idempotencyKey,
  type: input.type,
  name: input.name,
  email: input.email,
  message: input.message,
  sponsorshipTier: input.sponsorshipTier,
  sourcePage: input.sourcePage,
  notificationStatus: "pending",
  notificationAttemptedAt: null,
  notificationError: null,
  createdAt: now.toISOString(),
  expiresAt: addUtcMonthsSafely(now, 24).toISOString(),
});

const defaultDependencies = (env: WorkerEnv): PublicEnquiryDependencies => ({
  repository: new EnquiryRepository(env.DB),
  verifyTurnstile,
  sendEnquiryEmail,
  now: () => new Date(),
});

export async function handlePublicEnquiry(
  request: Request,
  env: WorkerEnv,
  dependencies: PublicEnquiryDependencies = defaultDependencies(env)
): Promise<Response> {
  const requestId = crypto.randomUUID();

  if (!isAllowedOrigin(request.headers.get("origin"), env.ALLOWED_ORIGINS)) {
    return errorResponse("origin_forbidden", 403, requestId);
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return errorResponse("unsupported_media_type", 415, requestId);
  }

  if (exceedsDeclaredLimit(request)) {
    return errorResponse("payload_too_large", 413, requestId);
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await request.arrayBuffer();
  } catch {
    return errorResponse("invalid_request", 422, requestId);
  }

  if (bytes.byteLength > MAX_BODY_BYTES) {
    return errorResponse("payload_too_large", 413, requestId);
  }

  let input: PublicEnquiryInput;
  try {
    input = parsePublicEnquiry(
      JSON.parse(new TextDecoder().decode(bytes)) as unknown
    );
  } catch {
    return errorResponse("invalid_request", 422, requestId);
  }

  let receipt: { id: string } | null;
  try {
    receipt = await dependencies.repository.findReceipt(input.idempotencyKey);
  } catch {
    return errorResponse("service_unavailable", 503, requestId);
  }

  if (receipt) {
    return jsonResponse({ id: receipt.id, status: "received" }, 200, requestId);
  }

  let verification: TurnstileResult;
  try {
    verification = await dependencies.verifyTurnstile(
      {
        token: input.turnstileToken,
        remoteIp: request.headers.get("cf-connecting-ip") ?? "",
      },
      env
    );
  } catch {
    return errorResponse("service_unavailable", 503, requestId);
  }

  if (!verification.ok) {
    return verification.reason === "unavailable"
      ? errorResponse("service_unavailable", 503, requestId)
      : errorResponse("verification_failed", 403, requestId);
  }

  const enquiry = buildStoredEnquiry(input, dependencies.now());
  try {
    await dependencies.repository.create(enquiry);
  } catch {
    try {
      receipt = await dependencies.repository.findReceipt(input.idempotencyKey);
    } catch {
      return errorResponse("service_unavailable", 503, requestId);
    }

    if (receipt) {
      return jsonResponse(
        { id: receipt.id, status: "received" },
        200,
        requestId
      );
    }

    return errorResponse("service_unavailable", 503, requestId);
  }

  let emailResult: EmailResult;
  try {
    emailResult = await dependencies.sendEnquiryEmail(input, env);
  } catch {
    emailResult = { ok: false, error: "emailjs_unavailable" };
  }

  const attemptedAt = dependencies.now().toISOString();
  const outcome = emailResult.ok
    ? { status: "sent" as const, attemptedAt, error: null }
    : {
        status: "failed" as const,
        attemptedAt,
        error: emailResult.error.slice(0, 240),
      };

  try {
    await dependencies.repository.markNotification(enquiry.id, outcome);
  } catch {
    // Storage already succeeded, so the public receipt remains successful.
  }

  return jsonResponse({ id: enquiry.id, status: "received" }, 201, requestId);
}
