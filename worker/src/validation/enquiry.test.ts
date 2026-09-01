import { describe, expect, it } from "vitest";
import { parsePublicEnquiry } from "./enquiry";

const contact = {
  idempotencyKey: "30d90187-8e87-4dd3-95ce-6098bd2598b7",
  type: "contact",
  name: "  Ananya Sen  ",
  email: "  ANANYA@example.com ",
  message: "  Please tell me about the next community event.  ",
  sourcePage: "home",
  turnstileToken: "test-turnstile-token",
};

describe("parsePublicEnquiry", () => {
  it("normalizes a public contact without changing its meaning", () => {
    expect(parsePublicEnquiry(contact)).toMatchObject({
      type: "contact",
      name: "Ananya Sen",
      email: "ananya@example.com",
      message: "Please tell me about the next community event.",
      sponsorshipTier: null,
      sourcePage: "home",
    });
  });

  it("rejects a sponsorship tier on a general contact", () => {
    expect(() =>
      parsePublicEnquiry({ ...contact, sponsorshipTier: "Premium" })
    ).toThrow();
  });

  it.each([
    ["name", "x".repeat(121)],
    ["email", `${"x".repeat(250)}@example.com`],
    ["message", "x".repeat(5001)],
  ])("rejects an overlong %s", (field, value) => {
    expect(() => parsePublicEnquiry({ ...contact, [field]: value })).toThrow();
  });
});
