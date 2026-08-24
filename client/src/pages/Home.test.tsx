import { describe, expect, it, vi } from "vitest";

describe("home page hash navigation", () => {
  it("scrolls to the section named by the current hash after the home page mounts", async () => {
    const homeModule = await import("./Home");
    const scrollToHashTarget = Reflect.get(homeModule, "scrollToHashTarget");
    const scrollIntoView = vi.fn();
    const findElement = vi.fn((id: string) =>
      id === "about" ? { scrollIntoView } : null,
    );

    expect(scrollToHashTarget).toBeTypeOf("function");
    if (typeof scrollToHashTarget !== "function") return;

    expect(scrollToHashTarget("#about", findElement)).toBe(true);
    expect(findElement).toHaveBeenCalledWith("about");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });
});
