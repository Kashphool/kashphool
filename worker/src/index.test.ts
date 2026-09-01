import { describe, expect, it, vi } from "vitest";
import type { PublicEnquiryInput, WorkerEnv } from "./contracts";
import worker, { createWorker } from "./index";

const input: PublicEnquiryInput = {
  idempotencyKey: "30d90187-8e87-4dd3-95ce-6098bd2598b7",
  type: "contact",
  name: "Asha Sen",
  email: "asha@example.com",
  message: "Please tell me about the next event.",
  sponsorshipTier: null,
  sourcePage: "home",
  turnstileToken: "turnstile-token",
};

const duplicateDatabase = {
  prepare() {
    return {
      bind() {
        return this;
      },
      first() {
        return Promise.resolve({ id: "existing-enquiry-id" });
      },
    };
  },
} as unknown as D1Database;

const env = {
  DB: duplicateDatabase,
  ALLOWED_ORIGINS: "https://kashphool.co.uk,https://www.kashphool.co.uk",
  TURNSTILE_SECRET: "turnstile-secret",
  TURNSTILE_EXPECTED_HOSTNAME: "kashphool.co.uk",
  TURNSTILE_VERIFY_URL:
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  EMAILJS_SERVICE_ID: "service-id",
  EMAILJS_TEMPLATE_ID: "template-id",
  EMAILJS_PUBLIC_KEY: "public-key",
  EMAILJS_SEND_URL: "https://api.emailjs.com/api/v1.0/email/send",
  ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
  ACCESS_AUD: "audience",
  ENVIRONMENT: "production",
} satisfies WorkerEnv;

const executionContext = {
  waitUntil() {},
  passThroughOnException() {},
  props: {},
} as ExecutionContext;

const fetchWorker = (request: Request): Promise<Response> =>
  worker.fetch(request, env, executionContext);

const adminDatabase = {
  prepare(query: string) {
    const statement = {
      bind() {
        return statement;
      },
      first() {
        return Promise.resolve(
          query.includes("WHERE id = ?")
            ? null
            : {
                all_count: 0,
                contact_count: 0,
                sponsorship_count: 0,
                failed_count: 0,
              }
        );
      },
      all() {
        return Promise.resolve({ results: [] });
      },
    };
    return statement;
  },
} as unknown as D1Database;

const localAdminEnv = {
  ...env,
  DB: adminDatabase,
  ENVIRONMENT: "development",
  LOCAL_ADMIN_TOKEN: "local-admin-token",
} satisfies WorkerEnv;

const fetchLocalAdmin = (path: string, method = "GET"): Promise<Response> =>
  worker.fetch(
    new Request(`http://localhost:8787${path}`, {
      method,
      headers: { "X-Kashphool-Local-Admin": "local-admin-token" },
    }),
    localAdminEnv,
    executionContext
  );

describe("Worker router", () => {
  it("accepts a public enquiry without authentication", async () => {
    const response = await fetchWorker(
      new Request("https://kashphool.co.uk/api/enquiries", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          origin: "https://kashphool.co.uk",
        },
        body: JSON.stringify(input),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "existing-enquiry-id",
      status: "received",
    });
  });

  it("returns 405 for a non-POST method on the public route", async () => {
    const response = await fetchWorker(
      new Request("https://kashphool.co.uk/api/enquiries", { method: "GET" })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    await expect(response.json()).resolves.toEqual({
      error: { code: "method_not_allowed" },
    });
  });

  it.each(["/api/enquiries/", "/api/anything-else"])(
    "returns 404 for the unimplemented route %s",
    async pathname => {
      const response = await fetchWorker(
        new Request(`https://kashphool.co.uk${pathname}`, { method: "POST" })
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: { code: "not_found" },
      });
    }
  );

  it("adds security headers to router errors", async () => {
    const response = await fetchWorker(
      new Request("https://kashphool.co.uk/not-found")
    );

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/i
    );
  });

  it("routes the exact admin list path through protected read handling", async () => {
    const response = await fetchLocalAdmin("/api/admin/leads");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [],
      nextCursor: null,
      totals: { all: 0, contact: 0, sponsorship: 0, failed: 0 },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("requires authentication on the exact admin list path", async () => {
    const response = await fetchWorker(
      new Request("https://kashphool.co.uk/api/admin/leads")
    );

    expect(response.status).toBe(401);
  });

  it("routes an exact UUID detail path and returns 404 when absent", async () => {
    const response = await fetchLocalAdmin(
      "/api/admin/leads/d95f48a8-bd88-4c57-bf02-306f75ccdd4a"
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 405 for authenticated writes to the admin list path", async () => {
    const response = await fetchLocalAdmin("/api/admin/leads", "POST");

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });

  it.each([
    "/api/admin/leads/",
    "/api/admin/leads/not-a-uuid",
    "/api/admin/leads/d95f48a8-bd88-4c57-bf02-306f75ccdd4a/extra",
  ])("does not route the inexact admin path %s", async pathname => {
    const response = await fetchLocalAdmin(pathname);

    expect(response.status).toBe(404);
  });
});

describe("Worker retention schedule", () => {
  it("deletes enquiries expired at the fixed execution time exactly once", async () => {
    const deleteExpired = vi.fn(async () => 2);
    const retentionWorker = createWorker({
      now: () => new Date("2026-09-01T02:17:00.000Z"),
      createEnquiryRepository: () => ({ deleteExpired }),
    });

    await retentionWorker.scheduled?.(
      { cron: "17 2 * * *", scheduledTime: 1_788_228_220_000 },
      env,
      executionContext
    );

    expect(deleteExpired).toHaveBeenCalledOnce();
    expect(deleteExpired).toHaveBeenCalledWith("2026-09-01T02:17:00.000Z");
  });

  it("logs a retention failure with only the event name and event ID", async () => {
    const privateRecord = "asha@example.com Please delete this message";
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const retentionWorker = createWorker({
      now: () => new Date("2026-09-01T02:17:00.000Z"),
      createEventId: () => "9c8f278f-af94-4a5b-b4b3-fdb34497fe58",
      createEnquiryRepository: () => ({
        deleteExpired: async () => {
          throw new Error(privateRecord);
        },
      }),
    });

    const scheduled = retentionWorker.scheduled?.(
      { cron: "17 2 * * *", scheduledTime: 1_788_228_220_000 },
      env,
      executionContext
    );

    await expect(scheduled).rejects.toThrow(
      /^Retention purge failed \(9c8f278f-af94-4a5b-b4b3-fdb34497fe58\)$/
    );

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        event: "retention_purge_failed",
        eventId: "9c8f278f-af94-4a5b-b4b3-fdb34497fe58",
      })
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(privateRecord);
    errorSpy.mockRestore();
  });
});
