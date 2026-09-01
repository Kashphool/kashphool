import type { WorkerEnv } from "./contracts";
import { handleAdminLeads } from "./routes/admin-leads";
import { handlePublicEnquiry } from "./routes/public-enquiries";

const ADMIN_LEAD_DETAIL_PATTERN =
  /^\/api\/admin\/leads\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const securityHeaders = (requestId: string): Headers =>
  new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  });

const errorResponse = (
  code: string,
  status: number,
  extraHeaders?: Record<string, string>
): Response => {
  const headers = securityHeaders(crypto.randomUUID());
  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    headers.set(name, value);
  }
  return new Response(JSON.stringify({ error: { code } }), {
    status,
    headers,
  });
};

const worker = {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/enquiries") {
      if (request.method !== "POST") {
        return errorResponse("method_not_allowed", 405, { allow: "POST" });
      }
      return handlePublicEnquiry(request, env);
    }

    if (
      pathname === "/api/admin/leads" ||
      ADMIN_LEAD_DETAIL_PATTERN.test(pathname)
    ) {
      return handleAdminLeads(request, env);
    }

    if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
      return errorResponse("not_found", 404);
    }

    return errorResponse("not_found", 404);
  },

  scheduled(_controller, _env, _context): void {
    // Reserved for the retention task implemented in a later slice.
  },
} satisfies ExportedHandler<WorkerEnv>;

export default worker;
