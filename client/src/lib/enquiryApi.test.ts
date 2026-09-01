import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EnquirySubmissionError,
  submitEnquiry,
  type EnquiryInput,
} from "./enquiryApi";

const input: EnquiryInput = {
  type: "sponsorship",
  name: "Asha",
  email: "asha@example.com",
  message: "Premium package please",
  sponsorshipTier: "Premium",
  sourcePage: "sponsors",
  turnstileToken: "token",
  idempotencyKey: "30d90187-8e87-4dd3-95ce-6098bd2598b7",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitEnquiry", () => {
  it("posts the exact public enquiry contract and returns its receipt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "lead-123", status: "received" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitEnquiry(input)).resolves.toEqual({
      id: "lead-123",
      status: "received",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it.each([
    [403, "verification"],
    [422, "validation"],
    [503, "temporary"],
    [500, "unknown"],
  ] as const)(
    "maps HTTP %s to the stable %s category",
    async (status, category) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response("sensitive server details", { status })
          )
      );

      const error = await submitEnquiry(input).catch(value => value);

      expect(error).toBeInstanceOf(EnquirySubmissionError);
      expect(error).toMatchObject({ category });
      expect(String(error)).not.toContain("sensitive server details");
    }
  );

  it("maps a network failure to the temporary category without exposing it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private upstream hostname"))
    );

    const error = await submitEnquiry(input).catch(value => value);

    expect(error).toMatchObject({ category: "temporary" });
    expect(String(error)).not.toContain("private upstream hostname");
  });
});
