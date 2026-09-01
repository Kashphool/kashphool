import { describe, expect, it, vi } from "vitest";
import type { PublicEnquiryInput, WorkerEnv } from "../contracts";
import { sendEnquiryEmail } from "./emailjs";

const config: Pick<
  WorkerEnv,
  | "EMAILJS_SERVICE_ID"
  | "EMAILJS_TEMPLATE_ID"
  | "EMAILJS_PUBLIC_KEY"
  | "EMAILJS_PRIVATE_KEY"
  | "EMAILJS_ORIGIN"
  | "EMAILJS_SEND_URL"
> = {
  EMAILJS_SERVICE_ID: "service-existing",
  EMAILJS_TEMPLATE_ID: "template-existing",
  EMAILJS_PUBLIC_KEY: "public-existing",
  EMAILJS_ORIGIN: "https://www.kashphool.co.uk",
  EMAILJS_SEND_URL: "https://api.emailjs.com/api/v1.0/email/send",
};

const enquiry: PublicEnquiryInput = {
  idempotencyKey: "request-1",
  type: "sponsorship",
  name: "Asha",
  email: "asha@example.com",
  message: "Please call me.",
  sponsorshipTier: "Premium",
  sourcePage: "sponsors",
  turnstileToken: "turnstile-token",
};

describe("sendEnquiryEmail", () => {
  it("sends the existing EmailJS identifiers and template parameter names", async () => {
    let request: Request | undefined;
    const fetcher: typeof fetch = async (input, init) => {
      request = new Request(input, init);
      return new Response("OK", { status: 200 });
    };

    await expect(sendEnquiryEmail(enquiry, config, fetcher)).resolves.toEqual({
      ok: true,
    });

    expect(request?.url).toBe(config.EMAILJS_SEND_URL);
    expect(request?.method).toBe("POST");
    expect(request?.headers.get("content-type")).toBe("application/json");
    expect(request?.headers.get("origin")).toBe(
      "https://www.kashphool.co.uk"
    );
    expect(JSON.parse((await request?.text()) ?? "")).toEqual({
      service_id: "service-existing",
      template_id: "template-existing",
      user_id: "public-existing",
      template_params: {
        name: "Asha",
        email: "asha@example.com",
        message: "Asha is interested in Premium. Message: Please call me.",
      },
    });
  });

  it("includes the private access token only when configured", async () => {
    let payload: Record<string, unknown> | undefined;
    const fetcher: typeof fetch = async (_input, init) => {
      payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response("OK", { status: 200 });
    };

    await sendEnquiryEmail(
      enquiry,
      { ...config, EMAILJS_PRIVATE_KEY: "private-existing" },
      fetcher
    );

    expect(payload).toMatchObject({ accessToken: "private-existing" });
  });

  it("returns a status-only error without reading or logging an upstream body", async () => {
    let bodyRead = false;
    const consoleSpies = [
      vi.spyOn(console, "debug").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
    ];
    const fetcher: typeof fetch = async () => {
      const upstream = new Response("busy-private-body", { status: 503 });
      return new Proxy(upstream, {
        get(target, property, receiver) {
          if (property === "text" || property === "json") bodyRead = true;
          return Reflect.get(target, property, receiver);
        },
      });
    };

    const result = await sendEnquiryEmail(enquiry, config, fetcher);

    expect(result).toEqual({ ok: false, error: "emailjs_http_503" });
    expect(bodyRead).toBe(false);
    expect(JSON.stringify(result)).not.toContain("busy-private-body");
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("returns a stable unavailable error when the request fails", async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error("private-existing full-request-payload");
    };

    await expect(sendEnquiryEmail(enquiry, config, fetcher)).resolves.toEqual({
      ok: false,
      error: "emailjs_unavailable",
    });
  });
});
