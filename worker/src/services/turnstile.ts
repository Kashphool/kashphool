import type { WorkerEnv } from "../contracts";

export type TurnstileResult =
  | { ok: true }
  | {
      ok: false;
      reason: "rejected" | "hostname" | "action" | "unavailable";
    };

type TurnstileConfig = Pick<
  WorkerEnv,
  | "ENVIRONMENT"
  | "TURNSTILE_SECRET"
  | "TURNSTILE_EXPECTED_HOSTNAME"
  | "TURNSTILE_VERIFY_URL"
>;

const CLOUDFLARE_ALWAYS_PASS_SECRET = "1x0000000000000000000000000000000AA";
const CLOUDFLARE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

interface TurnstileResponse {
  success?: unknown;
  hostname?: unknown;
  action?: unknown;
}

export async function verifyTurnstile(
  input: { token: string; remoteIp: string },
  config: TurnstileConfig,
  fetcher: typeof fetch = fetch
): Promise<TurnstileResult> {
  const body = new URLSearchParams({
    secret: config.TURNSTILE_SECRET,
    response: input.token,
    remoteip: input.remoteIp,
    idempotency_key: crypto.randomUUID(),
  });

  try {
    const response = await fetcher(config.TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
    });

    if (!response.ok) return { ok: false, reason: "unavailable" };

    const result = (await response.json()) as TurnstileResponse;
    if (result.success !== true) return { ok: false, reason: "rejected" };
    if (
      config.ENVIRONMENT === "development" &&
      config.TURNSTILE_SECRET === CLOUDFLARE_ALWAYS_PASS_SECRET &&
      input.token === CLOUDFLARE_DUMMY_TOKEN
    ) {
      return { ok: true };
    }
    const expectedHostnames = config.TURNSTILE_EXPECTED_HOSTNAME.split(",")
      .map(hostname => hostname.trim())
      .filter(Boolean);
    if (
      typeof result.hostname !== "string" ||
      !expectedHostnames.includes(result.hostname)
    ) {
      return { ok: false, reason: "hostname" };
    }
    if (result.action !== "enquiry") {
      return { ok: false, reason: "action" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
