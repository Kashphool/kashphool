import type { EnquiryType, NotificationStatus, WorkerEnv } from "../contracts";
import { EnquiryRepository } from "../repositories/enquiries";
import {
  AccessAuthorizationError,
  verifyAccess,
  type AccessIdentity,
} from "../services/access-auth";

type AdminRepository = Pick<EnquiryRepository, "list" | "findById">;
type AccessVerifier = (
  request: Request,
  env: WorkerEnv
) => Promise<AccessIdentity>;

export interface AdminLeadDependencies {
  repository: AdminRepository;
  verifyAccess: AccessVerifier;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CURSOR_PATTERN =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\|([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUERY_LENGTH = 200;

const headers = (requestId: string): Headers =>
  new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  });

const jsonResponse = (
  body: unknown,
  status: number,
  requestId: string,
  extraHeaders?: Record<string, string>
): Response => {
  const responseHeaders = headers(requestId);
  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    responseHeaders.set(name, value);
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
};

const errorResponse = (
  code: string,
  status: number,
  requestId: string,
  extraHeaders?: Record<string, string>
): Response =>
  jsonResponse({ error: { code } }, status, requestId, extraHeaders);

const isValidDate = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const isCanonicalTimestamp = (value: string): boolean => {
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

const parseListFilters = (
  url: URL
): Parameters<EnquiryRepository["list"]>[0] | null => {
  const rawLimit = url.searchParams.get("limit") ?? "25";
  if (!/^\d+$/.test(rawLimit)) return null;
  const limit = Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) return null;

  const cursor = url.searchParams.get("cursor")?.trim();
  if (cursor) {
    const match = CURSOR_PATTERN.exec(cursor);
    if (cursor.length > 128 || !match || !isCanonicalTimestamp(match[1])) {
      return null;
    }
  }

  const query = url.searchParams.get("q")?.trim();
  if (query && query.length > MAX_QUERY_LENGTH) return null;

  const rawType = url.searchParams.get("type")?.trim();
  if (rawType && rawType !== "contact" && rawType !== "sponsorship") {
    return null;
  }

  const rawNotification = url.searchParams.get("notification")?.trim();
  if (
    rawNotification &&
    rawNotification !== "pending" &&
    rawNotification !== "sent" &&
    rawNotification !== "failed"
  ) {
    return null;
  }

  const fromDate = url.searchParams.get("from")?.trim();
  const toDate = url.searchParams.get("to")?.trim();
  if (
    (fromDate && !isValidDate(fromDate)) ||
    (toDate && !isValidDate(toDate))
  ) {
    return null;
  }
  if (fromDate && toDate && fromDate > toDate) return null;

  return {
    limit,
    ...(cursor ? { cursor } : {}),
    ...(query ? { query } : {}),
    ...(rawType ? { type: rawType as EnquiryType } : {}),
    ...(rawNotification
      ? { notificationStatus: rawNotification as NotificationStatus }
      : {}),
    ...(fromDate ? { from: `${fromDate}T00:00:00.000Z` } : {}),
    ...(toDate ? { to: `${toDate}T23:59:59.999Z` } : {}),
  };
};

const defaultDependencies = (env: WorkerEnv): AdminLeadDependencies => ({
  repository: new EnquiryRepository(env.DB),
  verifyAccess,
});

export async function handleAdminLeads(
  request: Request,
  env: WorkerEnv,
  dependencies: AdminLeadDependencies = defaultDependencies(env)
): Promise<Response> {
  const requestId = crypto.randomUUID();

  try {
    await dependencies.verifyAccess(request, env);
  } catch (error) {
    return error instanceof AccessAuthorizationError
      ? errorResponse("forbidden", 403, requestId)
      : errorResponse("unauthorized", 401, requestId);
  }

  if (request.method !== "GET") {
    return errorResponse("method_not_allowed", 405, requestId, {
      allow: "GET",
    });
  }

  const url = new URL(request.url);
  if (url.pathname === "/api/admin/leads") {
    const filters = parseListFilters(url);
    if (!filters) return errorResponse("invalid_request", 400, requestId);

    try {
      return jsonResponse(
        await dependencies.repository.list(filters),
        200,
        requestId
      );
    } catch {
      return errorResponse("service_unavailable", 503, requestId);
    }
  }

  const prefix = "/api/admin/leads/";
  const id = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length)
    : "";
  if (!UUID_PATTERN.test(id)) {
    return errorResponse("not_found", 404, requestId);
  }

  try {
    const lead = await dependencies.repository.findById(id);
    return lead
      ? jsonResponse(lead, 200, requestId)
      : errorResponse("not_found", 404, requestId);
  } catch {
    return errorResponse("service_unavailable", 503, requestId);
  }
}
