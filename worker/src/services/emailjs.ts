import type { PublicEnquiryInput, WorkerEnv } from "../contracts";
import { buildEmailMessage } from "./email-message";

export type EmailResult = { ok: true } | { ok: false; error: string };

type EmailJsConfig = Pick<
  WorkerEnv,
  | "EMAILJS_SERVICE_ID"
  | "EMAILJS_TEMPLATE_ID"
  | "EMAILJS_PUBLIC_KEY"
  | "EMAILJS_PRIVATE_KEY"
  | "EMAILJS_SEND_URL"
>;

export async function sendEnquiryEmail(
  input: PublicEnquiryInput,
  config: EmailJsConfig,
  fetcher: typeof fetch = fetch
): Promise<EmailResult> {
  const payload = {
    service_id: config.EMAILJS_SERVICE_ID,
    template_id: config.EMAILJS_TEMPLATE_ID,
    user_id: config.EMAILJS_PUBLIC_KEY,
    template_params: {
      name: input.name,
      email: input.email,
      message: buildEmailMessage(input),
    },
    ...(config.EMAILJS_PRIVATE_KEY
      ? { accessToken: config.EMAILJS_PRIVATE_KEY }
      : {}),
  };

  try {
    const response = await fetcher(config.EMAILJS_SEND_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.status === 200
      ? { ok: true }
      : { ok: false, error: `emailjs_http_${response.status}` };
  } catch {
    return { ok: false, error: "emailjs_unavailable" };
  }
}
