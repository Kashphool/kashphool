interface SponsorEnquiryMessageInput {
  name: string;
  note: string;
  tier: string | null;
}

export function buildSponsorEnquiryMessage(
  input: SponsorEnquiryMessageInput,
): string {
  const note = input.note.trim();

  if (input.tier) {
    return `${input.name.trim()} is interested in ${input.tier}. Message: ${note}`;
  }

  return `Sponsorship lead: ${note}`;
}
