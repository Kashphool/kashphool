import { describe, expect, it } from "vitest";
import { buildEmailMessage } from "./email-message";

describe("buildEmailMessage", () => {
  it("preserves the existing tier sponsorship format", () => {
    expect(
      buildEmailMessage({
        type: "sponsorship",
        name: " Asha ",
        message: " Please call me. ",
        sponsorshipTier: "Premium",
      })
    ).toBe("Asha is interested in Premium. Message: Please call me.");
  });

  it("preserves the existing tierless sponsorship format", () => {
    expect(
      buildEmailMessage({
        type: "sponsorship",
        name: "Asha",
        message: " We would like to discuss a bespoke package. ",
        sponsorshipTier: null,
      })
    ).toBe("Sponsorship lead: We would like to discuss a bespoke package.");
  });

  it("returns a general contact message trimmed and otherwise unchanged", () => {
    expect(
      buildEmailMessage({
        type: "contact",
        name: "Asha",
        message: " Please send event details. ",
        sponsorshipTier: null,
      })
    ).toBe("Please send event details.");
  });
});
