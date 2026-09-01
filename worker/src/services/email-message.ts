import type { PublicEnquiryInput } from "../contracts";

type EmailMessageInput = Pick<
  PublicEnquiryInput,
  "type" | "name" | "message" | "sponsorshipTier"
>;

export function buildEmailMessage(input: EmailMessageInput): string {
  const message = input.message.trim();

  if (input.type === "contact") return message;

  if (input.sponsorshipTier) {
    return `${input.name.trim()} is interested in ${input.sponsorshipTier}. Message: ${message}`;
  }

  return `Sponsorship lead: ${message}`;
}
