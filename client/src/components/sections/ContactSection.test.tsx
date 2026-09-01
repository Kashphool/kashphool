// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { submitEnquiry, resetChallenge, nextToken, resetTokenSequence } =
  vi.hoisted(() => {
    let tokenSequence = 0;
    return {
      submitEnquiry: vi.fn(),
      resetChallenge: vi.fn(),
      nextToken: () => `token-${++tokenSequence}`,
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

vi.mock("@/hooks/useInView", () => ({
  useInView: () => ({ ref: { current: null }, isInView: true }),
}));

import { EnquirySubmissionError } from "@/lib/enquiryApi";
import ContactSection from "./ContactSection";

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

const click = (selector: string) => {
  container.querySelector<HTMLButtonElement>(selector)!.click();
};

const submit = async () => {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
};

beforeEach(async () => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  resetTokenSequence();
  submitEnquiry.mockReset();
  resetChallenge.mockReset();
  await act(async () => root.render(<ContactSection />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ContactSection enquiry submission", () => {
  it("requires verification and submits the contact mapping without authentication", async () => {
    let resolveSubmission!: (receipt: {
      id: string;
      status: "received";
    }) => void;
    submitEnquiry.mockReturnValue(
      new Promise(resolve => {
        resolveSubmission = resolve;
      })
    );
    const submitButton = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    )!;
    expect(submitButton.disabled).toBe(true);

    await act(async () => {
      change('input[name="name"]', " Asha ");
      change('input[name="email"]', " asha@example.com ");
      change('textarea[name="message"]', " Hello Kashphool ");
      click('[data-testid="turnstile"]');
    });
    expect(submitButton.disabled).toBe(false);

    await submit();
    expect(submitButton.disabled).toBe(true);
    await act(async () => {
      resolveSubmission({ id: "lead-1", status: "received" });
    });

    expect(submitEnquiry).toHaveBeenCalledWith({
      type: "contact",
      name: "Asha",
      email: "asha@example.com",
      message: "Hello Kashphool",
      sponsorshipTier: null,
      sourcePage: "home",
      turnstileToken: "token-1",
      idempotencyKey: expect.any(String),
    });
    expect(submitEnquiry.mock.calls[0][0]).not.toHaveProperty("authorization");
    expect(resetChallenge).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')).toMatchObject({
      textContent: "Your message has been sent!",
    });
    expect(
      container.querySelector('[role="status"]')?.getAttribute("aria-live")
    ).toBe("polite");
  });

  it("reuses its idempotency key only for a temporary retry with a fresh token", async () => {
    submitEnquiry
      .mockRejectedValueOnce(new EnquirySubmissionError("temporary"))
      .mockResolvedValueOnce({ id: "lead-1", status: "received" })
      .mockResolvedValueOnce({ id: "lead-2", status: "received" });

    await act(async () => {
      change('input[name="name"]', "Asha");
      change('input[name="email"]', "asha@example.com");
      change('textarea[name="message"]', "Hello");
      click('[data-testid="turnstile"]');
    });
    await submit();
    const firstKey = submitEnquiry.mock.calls[0][0].idempotencyKey;
    expect(resetChallenge).toHaveBeenCalledTimes(1);
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled
    ).toBe(true);

    await act(async () => click('[data-testid="turnstile"]'));
    await submit();
    expect(submitEnquiry.mock.calls[1][0]).toMatchObject({
      idempotencyKey: firstKey,
      turnstileToken: "token-2",
    });

    await act(async () => {
      change('input[name="name"]', "Mira");
      change('input[name="email"]', "mira@example.com");
      change('textarea[name="message"]', "Again");
      click('[data-testid="turnstile"]');
    });
    await submit();
    expect(submitEnquiry.mock.calls[2][0].idempotencyKey).not.toBe(firstKey);
  });

  it("replaces a retained idempotency key when the normalized contact payload changes", async () => {
    submitEnquiry
      .mockRejectedValueOnce(new EnquirySubmissionError("temporary"))
      .mockResolvedValueOnce({ id: "lead-1", status: "received" });

    await act(async () => {
      change('input[name="name"]', "Asha");
      change('input[name="email"]', "asha@example.com");
      change('textarea[name="message"]', "Original message");
      click('[data-testid="turnstile"]');
    });
    await submit();
    const firstKey = submitEnquiry.mock.calls[0][0].idempotencyKey;

    await act(async () => {
      change('textarea[name="message"]', "Changed message");
      click('[data-testid="turnstile"]');
    });
    await submit();

    expect(submitEnquiry.mock.calls[1][0]).toMatchObject({
      message: "Changed message",
      turnstileToken: "token-2",
    });
    expect(submitEnquiry.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
  });

  it.each([
    ["verification", "Verification failed. Please try again."],
    ["validation", "Please check your details and try again."],
    ["temporary", "Failed to send message. Please try again."],
  ] as const)("shows a safe %s failure message", async (category, message) => {
    submitEnquiry.mockRejectedValue(new EnquirySubmissionError(category));
    await act(async () => {
      change('input[name="name"]', "Asha");
      change('input[name="email"]', "asha@example.com");
      change('textarea[name="message"]', "Hello");
      click('[data-testid="turnstile"]');
    });

    await submit();

    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      message
    );
    expect(container.textContent).not.toContain("server");
  });
});
