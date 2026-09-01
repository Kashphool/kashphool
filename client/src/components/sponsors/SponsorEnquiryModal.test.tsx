// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sponsorPageContent } from "@/content";

const { submitEnquiry, resetChallenge, nextToken, resetTokenSequence } =
  vi.hoisted(() => {
    let tokenSequence = 0;
    return {
      submitEnquiry: vi.fn(),
      resetChallenge: vi.fn(),
      nextToken: () => `sponsor-token-${++tokenSequence}`,
      resetTokenSequence: () => {
        tokenSequence = 0;
      },
    };
  });

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/enquiryApi", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/enquiryApi")>();
  return { ...actual, submitEnquiry };
});

vi.mock("@/components/shared/TurnstileWidget", async () => {
  const React = await import("react");
  return {
    default: ({
      onTokenChange,
      onResetReady,
    }: {
      onTokenChange: (token: string | null) => void;
      onResetReady?: (reset: (() => void) | null) => void;
    }) => {
      React.useEffect(() => {
        onResetReady?.(resetChallenge);
        return () => onResetReady?.(null);
      }, [onResetReady]);
      return (
        <button
          type="button"
          data-testid="turnstile"
          onClick={() => onTokenChange(nextToken())}
        >
          Verify
        </button>
      );
    },
  };
});

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

import SponsorEnquiryModal from "./SponsorEnquiryModal";

let container: HTMLDivElement;
let root: Root;

const change = (selector: string, value: string) => {
  const element = container.querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >(selector)!;
  const setter = Object.getOwnPropertyDescriptor(
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype,
    "value"
  )!.set!;
  setter.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const submit = async () => {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
};

beforeEach(() => {
  submitEnquiry.mockReset();
  resetChallenge.mockReset();
  resetTokenSequence();
});

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
});

describe("SponsorEnquiryModal", () => {
  it("presents the selected package with its name, price, and description", () => {
    const html = renderToStaticMarkup(
      <SponsorEnquiryModal
        open
        tier="Title Sponsor"
        tierDetails={
          {
            name: "Title Sponsor",
            guide: "£800",
            description:
              "Take the leading sponsorship position for Kashphool's 2026 Durga Pujo.",
          } as never
        }
        onOpenChange={() => undefined}
      />
    );

    expect(html).toContain(
      sponsorPageContent.enquiryModal.selectedPackageLabel
    );
    expect(html).toContain("Title Sponsor");
    expect(html).toContain("£800");
    expect(html).toContain(
      "Take the leading sponsorship position for Kashphool&#x27;s 2026 Durga Pujo."
    );
    expect(html).not.toContain("Selected: Title Sponsor");
  });

  it("uses the configured enquiry field labels", () => {
    const html = renderToStaticMarkup(
      <SponsorEnquiryModal
        open
        tier={null}
        tierDetails={null}
        onOpenChange={() => undefined}
      />
    );
    const { enquiryModal } = sponsorPageContent;

    expect(html).toContain(enquiryModal.nameLabel);
    expect(html).toContain(enquiryModal.emailLabel);
    expect(html).toContain(enquiryModal.messageLabel);
  });

  it("requires verification and submits the selected sponsorship mapping", async () => {
    let resolveSubmission!: (receipt: {
      id: string;
      status: "received";
    }) => void;
    submitEnquiry.mockReturnValueOnce(
      new Promise(resolve => {
        resolveSubmission = resolve;
      })
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <SponsorEnquiryModal
          open
          tier="Premium"
          tierDetails={null}
          onOpenChange={() => undefined}
        />
      );
    });
    const submitButton = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    )!;
    expect(submitButton.disabled).toBe(true);

    await act(async () => {
      change("#sponsor-name", " Asha ");
      change("#sponsor-email", " asha@example.com ");
      change("#sponsor-note", " Premium package please ");
      container
        .querySelector<HTMLButtonElement>('[data-testid="turnstile"]')!
        .click();
    });
    await submit();
    expect(submitButton.disabled).toBe(true);
    await act(async () => {
      resolveSubmission({ id: "lead-1", status: "received" });
    });

    expect(submitEnquiry).toHaveBeenCalledWith({
      type: "sponsorship",
      name: "Asha",
      email: "asha@example.com",
      message: "Asha is interested in Premium. Message: Premium package please",
      sponsorshipTier: "Premium",
      sourcePage: "sponsors",
      turnstileToken: "sponsor-token-1",
      idempotencyKey: expect.any(String),
    });
    expect(resetChallenge).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Your sponsorship enquiry has been sent!"
    );
    expect(
      container.querySelector('[role="status"]')?.getAttribute("aria-live")
    ).toBe("polite");
    expect(
      container.querySelector<HTMLInputElement>("#sponsor-name")?.value
    ).toBe("");

    const firstKey = submitEnquiry.mock.calls[0][0].idempotencyKey;
    submitEnquiry.mockResolvedValueOnce({ id: "lead-2", status: "received" });
    await act(async () => {
      change("#sponsor-name", "Mira");
      change("#sponsor-email", "mira@example.com");
      change("#sponsor-note", "Another enquiry");
      container
        .querySelector<HTMLButtonElement>('[data-testid="turnstile"]')!
        .click();
    });
    await submit();
    expect(submitEnquiry.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
  });

  it("reuses its idempotency key for a temporary retry with a fresh token", async () => {
    const { EnquirySubmissionError } = await import("@/lib/enquiryApi");
    submitEnquiry
      .mockRejectedValueOnce(new EnquirySubmissionError("temporary"))
      .mockResolvedValueOnce({ id: "lead-1", status: "received" });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <SponsorEnquiryModal
          open
          tier="Premium"
          tierDetails={null}
          onOpenChange={() => undefined}
        />
      );
    });
    await act(async () => {
      change("#sponsor-name", "Asha");
      change("#sponsor-email", "asha@example.com");
      change("#sponsor-note", "Premium package please");
      container
        .querySelector<HTMLButtonElement>('[data-testid="turnstile"]')!
        .click();
    });
    await submit();
    const firstKey = submitEnquiry.mock.calls[0][0].idempotencyKey;
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled
    ).toBe(true);

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="turnstile"]')!
        .click();
    });
    await submit();

    expect(submitEnquiry.mock.calls[1][0]).toMatchObject({
      idempotencyKey: firstKey,
      turnstileToken: "sponsor-token-2",
    });
    expect(resetChallenge).toHaveBeenCalledTimes(2);
  });

  it("replaces a retained idempotency key when the normalized sponsorship payload changes", async () => {
    const { EnquirySubmissionError } = await import("@/lib/enquiryApi");
    submitEnquiry
      .mockRejectedValueOnce(new EnquirySubmissionError("temporary"))
      .mockResolvedValueOnce({ id: "lead-1", status: "received" });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <SponsorEnquiryModal
          open
          tier="Premium"
          tierDetails={null}
          onOpenChange={() => undefined}
        />
      );
    });
    await act(async () => {
      change("#sponsor-name", "Asha");
      change("#sponsor-email", "asha@example.com");
      change("#sponsor-note", "Original note");
      container
        .querySelector<HTMLButtonElement>('[data-testid="turnstile"]')!
        .click();
    });
    await submit();
    const firstKey = submitEnquiry.mock.calls[0][0].idempotencyKey;

    await act(async () => {
      change("#sponsor-note", "Changed note");
      container
        .querySelector<HTMLButtonElement>('[data-testid="turnstile"]')!
        .click();
    });
    await submit();

    expect(submitEnquiry.mock.calls[1][0]).toMatchObject({
      message: "Asha is interested in Premium. Message: Changed note",
      turnstileToken: "sponsor-token-2",
    });
    expect(submitEnquiry.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
  });
});
