import { describe, expect, it, vi } from "vitest";
import type {
  PublicEnquiryInput,
  StoredEnquiry,
  WorkerEnv,
} from "../contracts";
import type { EmailResult } from "../services/emailjs";
import type { TurnstileResult } from "../services/turnstile";
import {
  handlePublicEnquiry,
  type PublicEnquiryDependencies,
} from "./public-enquiries";

const allowedOrigin = "https://kashphool.co.uk";

const env = {
  DB: {} as D1Database,
  ALLOWED_ORIGINS: `${allowedOrigin}, https://www.kashphool.co.uk`,
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

const request = (
  body: string = JSON.stringify(input),
  headers: Record<string, string> = {}
): Request =>
  new Request("https://kashphool.co.uk/api/enquiries", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: allowedOrigin,
      "cf-connecting-ip": "203.0.113.10",
      ...headers,
    },
    body,
  });

const dependencies = (
  calls: string[],
  overrides: Partial<PublicEnquiryDependencies> = {}
): PublicEnquiryDependencies => ({
  repository: {
    async findReceipt() {
      calls.push("findReceipt");
      return null;
    },
    async create() {
      calls.push("create");
    },
    async markNotification(_id, outcome) {
      calls.push(`mark:${outcome.status}`);
    },
  },
  async verifyTurnstile(): Promise<TurnstileResult> {
    calls.push("turnstile");
    return { ok: true };
  },
  async sendEnquiryEmail(): Promise<EmailResult> {
    calls.push("email");
    return { ok: true };
  },
  now: () => new Date("2026-09-01T12:00:00.000Z"),
  ...overrides,
});

describe("handlePublicEnquiry", () => {
  it("stores a new enquiry before notifying and records a sent outcome", async () => {
    const calls: string[] = [];

    const response = await handlePublicEnquiry(
      request(),
      env,
      dependencies(calls)
    );

    expect(calls).toEqual([
      "findReceipt",
      "turnstile",
      "create",
      "email",
      "mark:sent",
    ]);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ),
      status: "received",
    });
  });

  it("returns an existing receipt without repeating verification or notification", async () => {
    const duplicateCalls: string[] = [];
    const deps = dependencies(duplicateCalls);
    deps.repository.findReceipt = async () => {
      duplicateCalls.push("findReceipt");
      return { id: "existing-enquiry-id" };
    };

    const duplicateResponse = await handlePublicEnquiry(request(), env, deps);

    expect(duplicateCalls).toEqual(["findReceipt"]);
    expect(duplicateResponse.status).toBe(200);
    await expect(duplicateResponse.json()).resolves.toEqual({
      id: "existing-enquiry-id",
      status: "received",
    });
  });

  it("keeps a stored enquiry received when notification delivery fails", async () => {
    const emailFailureCalls: string[] = [];
    const deps = dependencies(emailFailureCalls, {
      async sendEnquiryEmail() {
        emailFailureCalls.push("email");
        return { ok: false, error: "emailjs_http_503" };
      },
    });

    const emailFailureResponse = await handlePublicEnquiry(
      request(),
      env,
      deps
    );

    expect(emailFailureCalls).toEqual([
      "findReceipt",
      "turnstile",
      "create",
      "email",
      "mark:failed",
    ]);
    expect(emailFailureResponse.status).toBe(201);
    await expect(emailFailureResponse.json()).resolves.toEqual({
      id: expect.any(String),
      status: "received",
    });
  });

  it("rejects failed Turnstile verification before storing or notifying", async () => {
    const calls: string[] = [];
    const deps = dependencies(calls, {
      async verifyTurnstile() {
        calls.push("turnstile");
        return { ok: false, reason: "rejected" };
      },
    });

    const response = await handlePublicEnquiry(request(), env, deps);

    expect(calls).toEqual(["findReceipt", "turnstile"]);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "verification_failed" },
    });
  });

  it("does not notify when storing the enquiry fails", async () => {
    const calls: string[] = [];
    const consoleSpies = [
      vi.spyOn(console, "debug").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
    ];
    const deps = dependencies(calls);
    deps.repository.create = async () => {
      calls.push("create");
      throw new Error(
        "Asha Sen asha@example.com Please tell me about the next event. upstream-body"
      );
    };

    const response = await handlePublicEnquiry(request(), env, deps);
    const body = JSON.stringify(await response.json());

    expect(calls).toEqual(["findReceipt", "turnstile", "create"]);
    expect(response.status).toBe(503);
    expect(body).toBe('{"error":{"code":"service_unavailable"}}');
    expect(body).not.toMatch(/Asha|asha@example|next event|upstream-body/);
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("expires a leap-day enquiry on the last day of February 24 months later", async () => {
    const calls: string[] = [];
    let stored: StoredEnquiry | undefined;
    const deps = dependencies(calls, {
      now: () => new Date("2028-02-29T15:30:45.123Z"),
    });
    deps.repository.create = async enquiry => {
      calls.push("create");
      stored = enquiry;
    };

    await handlePublicEnquiry(request(), env, deps);

    expect(stored?.createdAt).toBe("2028-02-29T15:30:45.123Z");
    expect(stored?.expiresAt).toBe("2030-02-28T15:30:45.123Z");
    expect(stored).not.toHaveProperty("turnstileToken");
  });

  it.each([
    {
      name: "unsupported media types",
      request: () => request(undefined, { "content-type": "text/plain" }),
      status: 415,
      code: "unsupported_media_type",
    },
    {
      name: "unapproved origins",
      request: () => request(undefined, { origin: "https://example.com" }),
      status: 403,
      code: "origin_forbidden",
    },
    {
      name: "invalid JSON or fields",
      request: () => request("not-json"),
      status: 422,
      code: "invalid_request",
    },
  ])("returns a stable safe error for $name", async testCase => {
    const calls: string[] = [];

    const response = await handlePublicEnquiry(
      testCase.request(),
      env,
      dependencies(calls)
    );

    expect(response.status).toBe(testCase.status);
    expect(await response.json()).toEqual({ error: { code: testCase.code } });
    expect(calls).toEqual([]);
  });

  it("rejects bodies larger than 16 KiB before attempting JSON parsing", async () => {
    const calls: string[] = [];
    const oversizedInvalidJson = "x".repeat(16 * 1024 + 1);

    const response = await handlePublicEnquiry(
      request(oversizedInvalidJson),
      env,
      dependencies(calls)
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: { code: "payload_too_large" },
    });
    expect(calls).toEqual([]);
  });

  it("adds no-store, nosniff and a request ID to every response", async () => {
    const response = await handlePublicEnquiry(
      request(undefined, { origin: "https://example.com" }),
      env,
      dependencies([])
    );

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/i
    );
  });
});
