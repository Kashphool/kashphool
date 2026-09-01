// @vitest-environment jsdom

import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TurnstileWidget, { type TurnstileFailure } from "./TurnstileWidget";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

interface TurnstileOptions {
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  sitekey: string;
}

let container: HTMLDivElement;
let root: Root;
let options: TurnstileOptions;
const reset = vi.fn();
const remove = vi.fn();

beforeEach(() => {
  vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "public-site-key");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  window.turnstile = {
    render: vi.fn((_container, value) => {
      options = value;
      return "widget-1";
    }),
    reset,
    remove,
  };
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document
    .querySelectorAll('script[src*="challenges.cloudflare.com/turnstile"]')
    .forEach(script => script.remove());
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  delete window.turnstile;
});

describe("TurnstileWidget", () => {
  it("renders explicitly for enquiries and passes verified tokens upward", async () => {
    const tokens: Array<string | null> = [];

    await act(async () => {
      root.render(
        <TurnstileWidget onTokenChange={token => tokens.push(token)} />
      );
    });

    expect(window.turnstile?.render).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        sitekey: "public-site-key",
        action: "enquiry",
      })
    );

    act(() => options.callback("fresh-token"));
    expect(tokens).toEqual(["fresh-token"]);
  });

  it.each([
    ["expired-callback", "expired"],
    ["error-callback", "error"],
  ] as const)(
    "reports the %s outcome and clears the token",
    async (callback, failure) => {
      const tokens: Array<string | null> = ["existing-token"];
      const failures: TurnstileFailure[] = [];

      await act(async () => {
        root.render(
          <TurnstileWidget
            onTokenChange={token => tokens.push(token)}
            onFailure={reason => failures.push(reason)}
          />
        );
      });

      act(() => options[callback]());

      expect(tokens).toEqual(["existing-token", null]);
      expect(failures).toEqual([failure]);
    }
  );

  it("exposes a callback that resets the rendered challenge", async () => {
    let resetChallenge: (() => void) | null = null;
    const tokens: Array<string | null> = ["existing-token"];

    await act(async () => {
      root.render(
        <TurnstileWidget
          onTokenChange={token => tokens.push(token)}
          onResetReady={callback => {
            resetChallenge = callback;
          }}
        />
      );
    });

    act(() => resetChallenge?.());

    expect(reset).toHaveBeenCalledWith("widget-1");
    expect(tokens).toEqual(["existing-token", null]);
  });

  it("fails visibly instead of rendering when the site key is absent", async () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");

    await act(async () => {
      root.render(<TurnstileWidget onTokenChange={() => undefined} />);
    });

    expect(container.textContent).toContain("Verification is unavailable");
    expect(window.turnstile?.render).not.toHaveBeenCalled();
  });

  it("removes a failed script so a remount can load Turnstile successfully", async () => {
    delete window.turnstile;

    await act(async () => {
      root.render(<TurnstileWidget onTokenChange={() => undefined} />);
    });
    const failedScript = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    )!;

    await act(async () => {
      failedScript.dispatchEvent(new Event("error"));
    });

    expect(container.textContent).toContain("Verification is unavailable");
    act(() => root.unmount());
    root = createRoot(container);

    await act(async () => {
      root.render(<TurnstileWidget onTokenChange={() => undefined} />);
    });
    const retryScript = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    )!;
    expect(retryScript).not.toBe(failedScript);

    window.turnstile = {
      render: vi.fn(() => "widget-2"),
      reset,
      remove,
    };
    await act(async () => {
      retryScript.dispatchEvent(new Event("load"));
    });

    expect(window.turnstile.render).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ action: "enquiry" })
    );
  });
});
