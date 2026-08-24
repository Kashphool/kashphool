import { describe, expect, it } from "vitest";
import { buildSponsorEnquiryMessage } from "./sponsorEnquiry";

describe("buildSponsorEnquiryMessage", () => {
  it("includes the visitor name, selected tier, and note for a tier lead", () => {
    expect(
      buildSponsorEnquiryMessage({
        name: "Anika",
        note: "We would like to discuss availability.",
        tier: "Food / non-food stalls",
      }),
    ).toBe(
      "Anika is interested in Food / non-food stalls. Message: We would like to discuss availability.",
    );
  });

  it("labels a conversation without a selected tier as a sponsorship lead", () => {
    expect(
      buildSponsorEnquiryMessage({
        name: "Anika",
        note: "  We would like to discuss a bespoke package.  ",
        tier: null,
      }),
    ).toBe("Sponsorship lead: We would like to discuss a bespoke package.");
  });
});
