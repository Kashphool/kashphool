import type { WorkerEnv } from "./contracts";
import { handlePublicEnquiry } from "./routes/public-enquiries";

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
