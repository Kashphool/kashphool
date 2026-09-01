import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { startLeadInbox } from "./contacts.js";

const html = await readFile("admin/contacts.html", "utf8");

const firstLead = {
  id: "d95f48a8-bd88-4c57-bf02-306f75ccdd4a",
  type: "sponsorship",
  name: "Asha Sen",
  email: "asha@example.com",
  messageExcerpt: "A sponsorship enquiry",
  sponsorshipTier: "Gold",
  sourcePage: "sponsors",
  notificationStatus: "sent",
  notificationAttemptedAt: "2026-09-01T12:01:00.000Z",
  notificationError: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  expiresAt: "2028-09-01T12:00:00.000Z",
};

const secondLead = {
  ...firstLead,
  id: "26db0b1c-9f88-48bc-8d97-3571122bcf14",
  type: "contact",
  name: "Ravi Das",
  email: "ravi@example.com",
  messageExcerpt: "A general question",
  sponsorshipTier: null,
  sourcePage: "home",
  notificationStatus: "failed",
  notificationError: "provider timeout",
  createdAt: "2026-08-31T09:30:00.000Z",
};

const page = {
  items: [firstLead, secondLead],
  nextCursor: "2026-08-31T09:30:00.000Z|26db0b1c-9f88-48bc-8d97-3571122bcf14",
  totals: { all: 2, contact: 1, sponsorship: 1, failed: 1 },
};

const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const settled = () => new Promise(resolve => setTimeout(resolve, 0));
const apiUrl = value => new URL(value, "https://kashphool.co.uk");

function setup(fetchImpl, url = "https://kashphool.co.uk/admin/contacts.html") {
  const dom = new JSDOM(html, { pretendToBeVisual: true, url });
  const requests = [];
  const fetcher = async (requestUrl, options = {}) => {
    requests.push({ url: String(requestUrl), options });
    return fetchImpl(requestUrl, options, requests.length);
  };
  const ready = startLeadInbox({
    document: dom.window.document,
    window: dom.window,
    fetch: fetcher,
  });
  return { dom, document: dom.window.document, requests, ready };
}

test("renders lead summaries, totals and API strings as text", async () => {
  const maliciousPage = {
    ...page,
    items: [{ ...firstLead, name: '<img data-xss src="x">Asha' }, secondLead],
  };
  const { document, ready } = setup(async () => response(maliciousPage));

  await ready;

  assert.equal(document.querySelectorAll("[data-lead-row]").length, 2);
  assert.match(document.body.textContent, /Sponsorship/);
  assert.match(document.body.textContent, /2 enquiries/);
  assert.equal(document.querySelector("[data-xss]"), null);
  assert.equal(
    document.querySelector("[data-summary=failed]").textContent,
    "1"
  );
});

test("shows loading and empty states in the live region", async () => {
  let resolveFetch;
  const pending = new Promise(resolve => {
    resolveFetch = resolve;
  });
  const { document, ready } = setup(() => pending);

  assert.match(
    document.querySelector("[data-lead-status]").textContent,
    /Loading/i
  );
  resolveFetch(
    response({
      items: [],
      nextCursor: null,
      totals: { all: 0, contact: 0, sponsorship: 0, failed: 0 },
    })
  );
  await ready;

  assert.match(
    document.querySelector("[data-lead-status]").textContent,
    /No enquiries/i
  );
  assert.equal(document.querySelectorAll("[data-lead-row]").length, 0);
});

test("offers re-authentication after a 401 response", async () => {
  const { document, ready } = setup(async () =>
    response({ error: { code: "unauthorized" } }, 401)
  );

  await ready;

  assert.match(
    document.querySelector("[data-lead-status]").textContent,
    /session.*expired/i
  );
  assert.equal(document.querySelector("[data-reauth]").hidden, false);
});

test("distinguishes forbidden and unavailable responses", async t => {
  for (const [status, expected] of [
    [403, /permission/i],
    [503, /temporarily unavailable/i],
  ]) {
    await t.test(String(status), async () => {
      const { document, ready } = setup(async () =>
        response({ error: { code: "error" } }, status)
      );
      await ready;
      assert.match(
        document.querySelector("[data-lead-status]").textContent,
        expected
      );
    });
  }
});

test("hydrates filters from the URL and sends all filters", async () => {
  const { document, requests, ready } = setup(
    async () => response(page),
    "https://kashphool.co.uk/admin/contacts.html?q=festival&type=sponsorship&notification=failed&from=2026-08-01&to=2026-09-01"
  );

  await ready;

  assert.equal(
    document.querySelector("[data-filter=search]").value,
    "festival"
  );
  assert.equal(
    document.querySelector("[data-filter=type]").value,
    "sponsorship"
  );
  assert.equal(
    document.querySelector("[data-filter=notification]").value,
    "failed"
  );
  assert.match(
    requests[0].url,
    /\/api\/admin\/leads\?limit=25&q=festival&type=sponsorship&notification=failed&from=2026-08-01&to=2026-09-01$/
  );
});

test("debounces search for 250 ms, updates the URL and aborts the stale request", async () => {
  const resolvers = [];
  const { dom, document, requests, ready } = setup(
    () => new Promise(resolve => resolvers.push(resolve))
  );
  resolvers.shift()(response(page));
  await ready;

  const search = document.querySelector("[data-filter=search]");
  search.value = "pujo";
  search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));

  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(requests.length, 1);
  await new Promise(resolve => setTimeout(resolve, 70));
  assert.equal(requests.length, 2);
  assert.equal(apiUrl(requests[1].url).searchParams.get("q"), "pujo");
  assert.equal(new URL(dom.window.location.href).searchParams.get("q"), "pujo");

  search.value = "pujo 2026";
  search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 270));
  assert.equal(requests[1].options.signal.aborted, true);
  resolvers.at(-1)(response(page));
  await settled();
});

test("applies select and date filters immediately and clears the cursor", async () => {
  const { dom, document, requests, ready } = setup(async () => response(page));
  await ready;

  for (const [selector, value] of [
    ["[data-filter=type]", "contact"],
    ["[data-filter=notification]", "pending"],
    ["[data-filter=from]", "2026-08-01"],
    ["[data-filter=to]", "2026-09-01"],
  ]) {
    const control = document.querySelector(selector);
    control.value = value;
    control.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    await settled();
  }

  const finalUrl = apiUrl(requests.at(-1).url);
  assert.equal(finalUrl.searchParams.get("type"), "contact");
  assert.equal(finalUrl.searchParams.get("notification"), "pending");
  assert.equal(finalUrl.searchParams.get("from"), "2026-08-01");
  assert.equal(finalUrl.searchParams.get("to"), "2026-09-01");
  assert.equal(finalUrl.searchParams.has("cursor"), false);
});

test("moves through cursor pages and back to the previous page", async () => {
  const secondPage = {
    items: [secondLead],
    nextCursor: null,
    totals: page.totals,
  };
  const { document, requests, ready } = setup(async (_url, _options, count) =>
    response(count === 2 ? secondPage : page)
  );
  await ready;

  document.querySelector("[data-page=next]").click();
  await settled();
  assert.equal(
    apiUrl(requests[1].url).searchParams.get("cursor"),
    page.nextCursor
  );
  assert.equal(document.querySelector("[data-page=previous]").disabled, false);

  document.querySelector("[data-page=previous]").click();
  await settled();
  assert.equal(apiUrl(requests[2].url).searchParams.has("cursor"), false);
});

test("opens detail, renders the complete message and restores focus on Escape", async () => {
  const detail = {
    ...firstLead,
    message: "The complete message from the visitor.",
  };
  const { dom, document, ready } = setup(async url =>
    response(String(url).endsWith(`/${firstLead.id}`) ? detail : page)
  );
  await ready;

  const detailButton = document.querySelector("[data-lead-detail]");
  detailButton.focus();
  detailButton.click();
  await settled();

  const dialog = document.querySelector("[role=dialog]");
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  assert.equal(dialog.hidden, false);
  assert.match(
    document.querySelector("[data-lead-message]").textContent,
    /complete message/
  );

  dialog.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  assert.equal(dialog.hidden, true);
  assert.equal(document.activeElement, detailButton);
});
