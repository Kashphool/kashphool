import type { WorkerEnv } from "../contracts";

export type TurnstileResult =
  | { ok: true }
  | {
      ok: false;
      reason: "rejected" | "hostname" | "action" | "unavailable";
    };

type TurnstileConfig = Pick<
  WorkerEnv,
  "TURNSTILE_SECRET" | "TURNSTILE_EXPECTED_HOSTNAME" | "TURNSTILE_VERIFY_URL"
>;

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
    if (result.hostname !== config.TURNSTILE_EXPECTED_HOSTNAME) {
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
