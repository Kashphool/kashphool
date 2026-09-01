import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { eventsContent, homePageContent, sponsorsContent } from "@/content";
import Home from "./Home";

describe("home page hash navigation", () => {
  it("scrolls to the section named by the current hash after the home page mounts", async () => {
    const homeModule = await import("./Home");
    const scrollToHashTarget = Reflect.get(homeModule, "scrollToHashTarget");
    const scrollIntoView = vi.fn();
    const findElement = vi.fn((id: string) =>
      id === "about" ? { scrollIntoView } : null
    );

    expect(scrollToHashTarget).toBeTypeOf("function");
    if (typeof scrollToHashTarget !== "function") return;

    expect(scrollToHashTarget("#about", findElement)).toBe(true);
    expect(findElement).toHaveBeenCalledWith("about");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });
});

describe("homepage CMS content", () => {
  it("renders configured event and sponsor content without a runtime loading state", () => {
    const html = renderToStaticMarkup(<Home />);
    const nextEvent = eventsContent.events.find(
      event => event.id === eventsContent.nextEventId
    );

    expect(nextEvent).toBeDefined();
    expect(html).toContain(nextEvent?.name);
    expect(html).toContain(sponsorsContent.sponsors[0].name);
    expect(html).toContain(homePageContent.sponsors.cta);
  });
});
