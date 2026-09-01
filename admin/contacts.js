const PAGE_SIZE = "25";

const text = (element, value) => {
  element.textContent = value == null ? "—" : String(value);
};

const titleCase = value =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "—";

const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

export function startLeadInbox({
  document,
  window,
  fetch: fetcher = window.fetch.bind(window),
}) {
  const search = document.querySelector("[data-filter=search]");
  const type = document.querySelector("[data-filter=type]");
  const notification = document.querySelector("[data-filter=notification]");
  const from = document.querySelector("[data-filter=from]");
  const to = document.querySelector("[data-filter=to]");
  const status = document.querySelector("[data-lead-status]");
  const resultCount = document.querySelector("[data-result-count]");
  const results = document.querySelector("[data-lead-results]");
  const list = document.querySelector("[data-lead-list]");
  const reauthenticate = document.querySelector("[data-reauth]");
  const retry = document.querySelector("[data-retry]");
  const previous = document.querySelector("[data-page=previous]");
  const next = document.querySelector("[data-page=next]");
  const dialog = document.querySelector("[data-lead-dialog]");
  const closeDialogButton = document.querySelector("[data-dialog-close]");

  const urlFilters = new URL(window.location.href).searchParams;
  const state = {
    query: urlFilters.get("q") ?? "",
    type: urlFilters.get("type") ?? "",
    notification: urlFilters.get("notification") ?? "",
    from: urlFilters.get("from") ?? "",
    to: urlFilters.get("to") ?? "",
    cursor: null,
    previousCursors: [],
    loading: false,
  };

  search.value = state.query;
  type.value = state.type;
  notification.value = state.notification;
  from.value = state.from;
  to.value = state.to;

  let nextCursor = null;
  let listController;
  let detailController;
  let searchTimer;
  let returnFocus;

  const syncFilterUrl = () => {
    const url = new URL(window.location.href);
    for (const [key, value] of [
      ["q", state.query],
      ["type", state.type],
      ["notification", state.notification],
      ["from", state.from],
      ["to", state.to],
    ]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", url);
  };

  const buildListUrl = () => {
    const parameters = new URLSearchParams({ limit: PAGE_SIZE });
    for (const [key, value] of [
      ["q", state.query],
      ["type", state.type],
      ["notification", state.notification],
      ["from", state.from],
      ["to", state.to],
      ["cursor", state.cursor],
    ]) {
      if (value) parameters.set(key, value);
    }
    return `/api/admin/leads?${parameters}`;
  };

  const setStateMessage = (
    message,
    { reauth = false, canRetry = false } = {}
  ) => {
    text(status, message);
    reauthenticate.hidden = !reauth;
    retry.hidden = !canRetry;
  };

  const renderTotals = totals => {
    for (const key of ["all", "contact", "sponsorship", "failed"]) {
      text(document.querySelector(`[data-summary=${key}]`), totals[key] ?? 0);
    }
  };

  const cell = (label, value, className) => {
    const element = document.createElement("td");
    element.dataset.label = label;
    if (className) element.className = className;
    text(element, value);
    return element;
  };

  const renderRows = items => {
    list.replaceChildren();
    for (const lead of items) {
      const row = document.createElement("tr");
      row.dataset.leadRow = "";
      const enquiry = document.createElement("td");
      enquiry.dataset.label = "Enquiry";
      const name = document.createElement("strong");
      const email = document.createElement("span");
      const excerpt = document.createElement("span");
      text(name, lead.name);
      text(email, lead.email);
      text(excerpt, lead.messageExcerpt);
      enquiry.append(name, email, excerpt);

      row.append(
        enquiry,
        cell("Type", titleCase(lead.type), "lead-type"),
        cell("Received", formatDate(lead.createdAt)),
        cell(
          "Notification",
          titleCase(lead.notificationStatus),
          `lead-status lead-status--${lead.notificationStatus}`
        )
      );
      const action = document.createElement("td");
      action.dataset.label = "";
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.leadDetail = lead.id;
      text(button, "View details");
      action.append(button);
      row.append(action);
      list.append(row);
    }
  };

  const renderPage = page => {
    const items = Array.isArray(page.items) ? page.items : [];
    renderTotals(page.totals ?? {});
    renderRows(items);
    nextCursor = page.nextCursor ?? null;
    next.disabled = !nextCursor;
    previous.disabled = state.previousCursors.length === 0;
    results.hidden = items.length === 0;
    text(
      resultCount,
      `${items.length} ${items.length === 1 ? "enquiry" : "enquiries"}`
    );
    setStateMessage(
      items.length === 0
        ? "No enquiries match these filters."
        : `${items.length} ${items.length === 1 ? "enquiry" : "enquiries"} shown.`
    );
  };

  const loadPage = async () => {
    listController?.abort();
    const controller = new AbortController();
    listController = controller;
    state.loading = true;
    results.hidden = true;
    previous.disabled = true;
    next.disabled = true;
    setStateMessage("Loading enquiries…");
    text(resultCount, "Loading enquiries…");
    try {
      const response = await fetcher(buildListUrl(), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (response.status === 401) {
        setStateMessage("Your admin session has expired.", { reauth: true });
        text(resultCount, "Sign-in required");
        return;
      }
      if (response.status === 403) {
        setStateMessage("You do not have permission to view enquiries.");
        text(resultCount, "Access denied");
        return;
      }
      if (!response.ok) {
        setStateMessage("The enquiry service is temporarily unavailable.", {
          canRetry: true,
        });
        text(resultCount, "Unable to load");
        return;
      }
      renderPage(await response.json());
    } catch (error) {
      if (error?.name !== "AbortError") {
        setStateMessage("The enquiry service is temporarily unavailable.", {
          canRetry: true,
        });
        text(resultCount, "Unable to load");
      }
    } finally {
      if (listController === controller) state.loading = false;
    }
  };

  const resetPagination = () => {
    state.cursor = null;
    state.previousCursors = [];
    nextCursor = null;
  };
  const applyFilters = () => {
    resetPagination();
    syncFilterUrl();
    return loadPage();
  };

  const setDetailText = (selector, value) =>
    text(document.querySelector(selector), value);
  const closeDialog = () => {
    detailController?.abort();
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    dialog.hidden = true;
    returnFocus?.focus();
  };
  const showDialog = () => {
    dialog.hidden = false;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeDialogButton.focus();
  };
  const openDetail = async button => {
    returnFocus = button;
    for (const [selector, value] of [
      ["[data-lead-title]", "Loading enquiry…"],
      ["[data-lead-name]", "—"],
      ["[data-lead-email]", "—"],
      ["[data-lead-type]", "—"],
      ["[data-lead-created]", "—"],
      ["[data-lead-notification]", "—"],
      ["[data-lead-message]", "Loading complete message…"],
    ]) {
      setDetailText(selector, value);
    }
    document.querySelector("[data-lead-tier-row]").hidden = true;
    showDialog();
    detailController?.abort();
    const controller = new AbortController();
    detailController = controller;
    try {
      const response = await fetcher(
        `/api/admin/leads/${encodeURIComponent(button.dataset.leadDetail)}`,
        { headers: { Accept: "application/json" }, signal: controller.signal }
      );
      if (!response.ok) throw new Error("Detail unavailable");
      const lead = await response.json();
      setDetailText("[data-lead-title]", `${titleCase(lead.type)} enquiry`);
      setDetailText("[data-lead-name]", lead.name);
      setDetailText("[data-lead-email]", lead.email);
      setDetailText("[data-lead-type]", titleCase(lead.type));
      setDetailText("[data-lead-created]", formatDate(lead.createdAt));
      setDetailText(
        "[data-lead-notification]",
        titleCase(lead.notificationStatus)
      );
      setDetailText("[data-lead-message]", lead.message);
      const tierRow = document.querySelector("[data-lead-tier-row]");
      tierRow.hidden = !lead.sponsorshipTier;
      if (lead.sponsorshipTier)
        setDetailText("[data-lead-tier]", lead.sponsorshipTier);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setDetailText(
          "[data-lead-message]",
          "The complete message could not be loaded. Please try again."
        );
      }
    }
  };

  search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    state.query = search.value.trim();
    searchTimer = window.setTimeout(applyFilters, 250);
  });
  for (const [control, key] of [
    [type, "type"],
    [notification, "notification"],
    [from, "from"],
    [to, "to"],
  ]) {
    control.addEventListener("change", () => {
      state[key] = control.value;
      applyFilters();
    });
  }
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-lead-detail]");
    if (button) openDetail(button);
  });
  previous.addEventListener("click", () => {
    state.cursor = state.previousCursors.pop() ?? null;
    loadPage();
  });
  next.addEventListener("click", () => {
    if (!nextCursor) return;
    state.previousCursors.push(state.cursor);
    state.cursor = nextCursor;
    loadPage();
  });
  retry.addEventListener("click", loadPage);
  closeDialogButton.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
    }
  });

  return loadPage();
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  startLeadInbox({ document, window });
}
