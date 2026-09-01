import { z } from "zod";
import type { PublicEnquiryInput } from "../contracts";

const publicEnquiryFields = {
  idempotencyKey: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform(value => value.toLowerCase()),
  message: z.string().trim().min(1).max(5000),
  sourcePage: z.enum(["home", "sponsors"]),
  turnstileToken: z.string().min(1),
};

const publicEnquirySchema = z.discriminatedUnion("type", [
  z.object({
    ...publicEnquiryFields,
    type: z.literal("contact"),
    sponsorshipTier: z.null().optional().default(null),
  }),
  z.object({
    ...publicEnquiryFields,
    type: z.literal("sponsorship"),
    sponsorshipTier: z.string().trim().min(1),
  }),
]);

export function parsePublicEnquiry(value: unknown): PublicEnquiryInput {
  return publicEnquirySchema.parse(value);
}
