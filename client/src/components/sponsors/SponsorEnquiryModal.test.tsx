import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

import SponsorEnquiryModal from "./SponsorEnquiryModal";

describe("SponsorEnquiryModal", () => {
  it("presents the selected package with its name, price, and description", () => {
    const html = renderToStaticMarkup(
      <SponsorEnquiryModal
        open
        tier="Title Sponsor"
        tierDetails={{
          name: "Title Sponsor",
          guide: "£800",
          description: "Take the leading sponsorship position for Kashphool's 2026 Durga Pujo.",
        } as never}
        onOpenChange={() => undefined}
      />,
    );

    expect(html).toContain("Selected sponsorship package");
    expect(html).toContain("Title Sponsor");
    expect(html).toContain("£800");
    expect(html).toContain(
      "Take the leading sponsorship position for Kashphool&#x27;s 2026 Durga Pujo.",
    );
    expect(html).not.toContain("Selected: Title Sponsor");
  });
});
