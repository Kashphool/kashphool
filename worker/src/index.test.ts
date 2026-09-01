import { describe, expect, it } from "vitest";
import type { PublicEnquiryInput, WorkerEnv } from "./contracts";
import worker from "./index";

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

  it.each(["/api/enquiries/", "/api/anything-else", "/api/admin/leads"])(
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
});
