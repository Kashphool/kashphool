import { describe, expect, it, vi } from "vitest";
import type { WorkerEnv } from "../contracts";
import { verifyTurnstile } from "./turnstile";

const config: Pick<
  WorkerEnv,
  | "ENVIRONMENT"
  | "TURNSTILE_SECRET"
  | "TURNSTILE_EXPECTED_HOSTNAME"
  | "TURNSTILE_VERIFY_URL"
> = {
  ENVIRONMENT: "production",
  TURNSTILE_SECRET: "turnstile-secret",
  TURNSTILE_EXPECTED_HOSTNAME: "kashphool.co.uk",
  TURNSTILE_VERIFY_URL:
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
};

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("verifyTurnstile", () => {
  it("accepts a successful verification for the configured hostname and action", async () => {
    let request: Request | undefined;
    const fetcher: typeof fetch = async (input, init) => {
      request = new Request(input, init);
      return response({
        success: true,
        hostname: "kashphool.co.uk",
        action: "enquiry",
      });
    };

    await expect(
      verifyTurnstile(
        { token: "turnstile-token", remoteIp: "203.0.113.10" },
        config,
        fetcher
      )
    ).resolves.toEqual({ ok: true });

    expect(request?.url).toBe(config.TURNSTILE_VERIFY_URL);
    expect(request?.method).toBe("POST");
    const body = new URLSearchParams(await request?.text());
    expect(Object.fromEntries(body)).toMatchObject({
      secret: "turnstile-secret",
      response: "turnstile-token",
      remoteip: "203.0.113.10",
    });
    expect(body.get("idempotency_key")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("rejects a Siteverify response that is unsuccessful", async () => {
    const fetcher: typeof fetch = async () =>
      response({
        success: false,
        hostname: "kashphool.co.uk",
        action: "enquiry",
        "error-codes": ["invalid-input-response"],
      });

    await expect(
      verifyTurnstile(
        { token: "turnstile-token", remoteIp: "203.0.113.10" },
        config,
        fetcher
      )
    ).resolves.toEqual({ ok: false, reason: "rejected" });
  });

  it("rejects a successful response for another hostname", async () => {
    const fetcher: typeof fetch = async () =>
      response({ success: true, hostname: "example.com", action: "enquiry" });

    await expect(
      verifyTurnstile(
        { token: "turnstile-token", remoteIp: "203.0.113.10" },
        config,
        fetcher
      )
    ).resolves.toEqual({ ok: false, reason: "hostname" });
  });

  it.each(["kashphool.co.uk", "www.kashphool.co.uk"])(
    "accepts the exact production hostname %s from the configured host list",
    async hostname => {
      const fetcher: typeof fetch = async () =>
        response({ success: true, hostname, action: "enquiry" });

      await expect(
        verifyTurnstile(
          { token: "turnstile-token", remoteIp: "203.0.113.10" },
          {
            ...config,
            TURNSTILE_EXPECTED_HOSTNAME: "kashphool.co.uk,www.kashphool.co.uk",
          },
          fetcher
        )
      ).resolves.toEqual({ ok: true });
    }
  );

  it("rejects a suffix-match hostname outside the exact configured host list", async () => {
    const fetcher: typeof fetch = async () =>
      response({
        success: true,
        hostname: "attacker.www.kashphool.co.uk",
        action: "enquiry",
      });

    await expect(
      verifyTurnstile(
        { token: "turnstile-token", remoteIp: "203.0.113.10" },
        {
          ...config,
          TURNSTILE_EXPECTED_HOSTNAME: "kashphool.co.uk,www.kashphool.co.uk",
        },
        fetcher
      )
    ).resolves.toEqual({ ok: false, reason: "hostname" });
  });

  it("accepts Cloudflare's always-pass test response only in development", async () => {
    const fetcher: typeof fetch = async () =>
      response({ success: true, hostname: "example.com" });
    const testConfig = {
      ...config,
      ENVIRONMENT: "development",
      TURNSTILE_SECRET: "1x0000000000000000000000000000000AA",
      TURNSTILE_EXPECTED_HOSTNAME: "localhost",
    } satisfies Pick<
      WorkerEnv,
      | "ENVIRONMENT"
      | "TURNSTILE_SECRET"
      | "TURNSTILE_EXPECTED_HOSTNAME"
      | "TURNSTILE_VERIFY_URL"
    >;

    await expect(
      verifyTurnstile(
        { token: "XXXX.DUMMY.TOKEN.XXXX", remoteIp: "127.0.0.1" },
        testConfig,
        fetcher
      )
    ).resolves.toEqual({ ok: true });

    await expect(
      verifyTurnstile(
        { token: "XXXX.DUMMY.TOKEN.XXXX", remoteIp: "127.0.0.1" },
        { ...testConfig, ENVIRONMENT: "production" },
        fetcher
      )
    ).resolves.toEqual({ ok: false, reason: "hostname" });
  });

  it("rejects a successful response for another action", async () => {
    const fetcher: typeof fetch = async () =>
      response({
        success: true,
        hostname: "kashphool.co.uk",
        action: "login",
      });

    await expect(
      verifyTurnstile(
        { token: "turnstile-token", remoteIp: "203.0.113.10" },
        config,
        fetcher
      )
    ).resolves.toEqual({ ok: false, reason: "action" });
  });

  it("reports an unavailable verifier without exposing or logging sensitive values", async () => {
    const consoleSpies = [
      vi.spyOn(console, "debug").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
    ];
    const fetcher: typeof fetch = async () => {
      throw new Error(
        "turnstile-secret turnstile-token 203.0.113.10 upstream-body"
      );
    };

    const result = await verifyTurnstile(
      { token: "turnstile-token", remoteIp: "203.0.113.10" },
      config,
      fetcher
    );

    expect(result).toEqual({ ok: false, reason: "unavailable" });
    expect(JSON.stringify(result)).not.toMatch(
      /turnstile-secret|turnstile-token|203\.0\.113\.10|upstream-body/
    );
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
