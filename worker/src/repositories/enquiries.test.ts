import { describe, expect, it } from "vitest";
import type { StoredEnquiry } from "../contracts";
import { EnquiryRepository } from "./enquiries";

class RecordingDatabase {
  readonly statements: string[] = [];
  readonly bindings: unknown[][] = [];
  readonly firstResults: unknown[] = [];
  readonly allResults: unknown[] = [];
  readonly runResults: unknown[] = [];

  get lastStatement(): string {
    return this.statements.at(-1) ?? "";
  }

  get lastBindings(): unknown[] {
    return this.bindings.at(-1) ?? [];
  }

  prepare(query: string): D1PreparedStatement {
    const statementIndex = this.statements.push(query) - 1;
    this.bindings[statementIndex] = [];
    const database = this;

    const statement = {
      bind(...values: unknown[]) {
        database.bindings[statementIndex] = values;
        return statement;
      },
      first() {
        return Promise.resolve(database.firstResults.shift() ?? null);
      },
      all() {
        return Promise.resolve(database.allResults.shift() ?? { results: [] });
      },
      run() {
        return Promise.resolve(
          database.runResults.shift() ?? { success: true, meta: { changes: 0 } }
        );
      },
    };

    return statement as unknown as D1PreparedStatement;
  }
}

const storedEnquiry: StoredEnquiry = {
  id: "id-1",
  idempotencyKey: "request-1",
  type: "sponsorship",
  name: "Ananya Sen",
  email: "ananya@example.com",
  message: "I would like to sponsor the next event.",
  sponsorshipTier: "Premium",
  sourcePage: "sponsors",
  notificationStatus: "pending",
  notificationAttemptedAt: null,
  notificationError: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  expiresAt: "2028-09-01T12:00:00.000Z",
};

const createRepository = () => {
  const database = new RecordingDatabase();
  const repository = new EnquiryRepository(database as unknown as D1Database);
  return { database, repository };
};

describe("EnquiryRepository", () => {
  it("finds an existing receipt using a bound idempotency key", async () => {
    const { database, repository } = createRepository();
    database.firstResults.push({ id: "id-1" });

    await expect(repository.findReceipt("request-1")).resolves.toEqual({
      id: "id-1",
    });
    expect(database.lastStatement).toMatch(/idempotency_key = \?/);
    expect(database.lastBindings).toEqual(["request-1"]);
  });

  it("inserts no IP address or Turnstile value", async () => {
    const { database, repository } = createRepository();

    await repository.create(storedEnquiry);

    expect(database.lastStatement).not.toMatch(/ip|turnstile/i);
    expect(database.lastBindings).not.toContain("test-turnstile-token");
    expect(database.lastBindings).toEqual([
      "id-1",
      "request-1",
      "sponsorship",
      "Ananya Sen",
      "ananya@example.com",
      "I would like to sponsor the next event.",
      "Premium",
      "sponsors",
      "pending",
      null,
      null,
      "2026-09-01T12:00:00.000Z",
      "2028-09-01T12:00:00.000Z",
    ]);
  });

  it("marks the notification outcome with bound values", async () => {
    const { database, repository } = createRepository();

    await repository.markNotification("id-1", {
      status: "failed",
      attemptedAt: "2026-09-01T12:01:00.000Z",
      error: "Provider unavailable",
    });

    expect(database.lastStatement).toMatch(
      /UPDATE enquiries[\s\S]*WHERE id = \?/
    );
    expect(database.lastBindings).toEqual([
      "failed",
      "2026-09-01T12:01:00.000Z",
      "Provider unavailable",
      "id-1",
    ]);
  });

  it("bounds page size and uses a stable created-at/id cursor", async () => {
    const { database, repository } = createRepository();
    database.firstResults.push({
      all_count: 0,
      contact_count: 0,
      sponsorship_count: 0,
      failed_count: 0,
    });
    database.allResults.push({ results: [] });

    await repository.list({
      limit: 500,
      cursor: "2026-09-01T10:00:00.000Z|id-7",
    });

    expect(database.lastBindings).toContain(100);
    expect(database.lastStatement).toMatch(/created_at.*id/is);
    expect(database.lastStatement).toMatch(/ORDER BY created_at DESC, id DESC/);
    expect(database.lastBindings).toEqual([
      "2026-09-01T10:00:00.000Z",
      "2026-09-01T10:00:00.000Z",
      "id-7",
      100,
    ]);
  });

  it("escapes LIKE metacharacters and binds every list filter", async () => {
    const { database, repository } = createRepository();
    database.firstResults.push({
      all_count: 0,
      contact_count: 0,
      sponsorship_count: 0,
      failed_count: 0,
    });
    database.allResults.push({ results: [] });

    await repository.list({
      limit: 10,
      query: "50%_off\\er",
      type: "sponsorship",
      notificationStatus: "failed",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-09-01T23:59:59.999Z",
    });

    expect(database.lastStatement).toMatch(/LIKE \? ESCAPE '\\'/);
    expect(database.lastBindings).toEqual([
      "%50\\%\\_off\\\\er%",
      "%50\\%\\_off\\\\er%",
      "%50\\%\\_off\\\\er%",
      "sponsorship",
      "failed",
      "2026-08-01T00:00:00.000Z",
      "2026-09-01T23:59:59.999Z",
      10,
    ]);
  });

  it("returns at most the requested rows with a cursor and totals", async () => {
    const { database, repository } = createRepository();
    database.firstResults.push({
      all_count: 4,
      contact_count: 2,
      sponsorship_count: 2,
      failed_count: 1,
    });
    database.allResults.push({
      results: [
        {
          id: "id-3",
          type: "contact",
          name: "First",
          email: "first@example.com",
          message_excerpt: "First message",
          sponsorship_tier: null,
          source_page: "home",
          notification_status: "sent",
          notification_attempted_at: "2026-09-01T12:03:00.000Z",
          notification_error: null,
          created_at: "2026-09-01T12:02:00.000Z",
          expires_at: "2028-09-01T12:02:00.000Z",
        },
        {
          id: "id-2",
          type: "sponsorship",
          name: "Second",
          email: "second@example.com",
          message_excerpt: "Second message",
          sponsorship_tier: "Premium",
          source_page: "sponsors",
          notification_status: "failed",
          notification_attempted_at: "2026-09-01T12:02:00.000Z",
          notification_error: "Provider unavailable",
          created_at: "2026-09-01T12:01:00.000Z",
          expires_at: "2028-09-01T12:01:00.000Z",
        },
        {
          id: "id-1",
          type: "contact",
          name: "Third",
          email: "third@example.com",
          message_excerpt: "Third message",
          sponsorship_tier: null,
          source_page: "home",
          notification_status: "pending",
          notification_attempted_at: null,
          notification_error: null,
          created_at: "2026-09-01T12:00:00.000Z",
          expires_at: "2028-09-01T12:00:00.000Z",
        },
      ],
    });

    await expect(repository.list({ limit: 2 })).resolves.toEqual({
      items: [
        {
          id: "id-3",
          type: "contact",
          name: "First",
          email: "first@example.com",
          messageExcerpt: "First message",
          sponsorshipTier: null,
          sourcePage: "home",
          notificationStatus: "sent",
          notificationAttemptedAt: "2026-09-01T12:03:00.000Z",
          notificationError: null,
          createdAt: "2026-09-01T12:02:00.000Z",
          expiresAt: "2028-09-01T12:02:00.000Z",
        },
        {
          id: "id-2",
          type: "sponsorship",
          name: "Second",
          email: "second@example.com",
          messageExcerpt: "Second message",
          sponsorshipTier: "Premium",
          sourcePage: "sponsors",
          notificationStatus: "failed",
          notificationAttemptedAt: "2026-09-01T12:02:00.000Z",
          notificationError: "Provider unavailable",
          createdAt: "2026-09-01T12:01:00.000Z",
          expiresAt: "2028-09-01T12:01:00.000Z",
        },
      ],
      nextCursor: "2026-09-01T12:01:00.000Z|id-2",
      totals: { all: 4, contact: 2, sponsorship: 2, failed: 1 },
    });
  });

  it("finds and maps a full enquiry by id", async () => {
    const { database, repository } = createRepository();
    database.firstResults.push({
      id: "id-1",
      idempotency_key: "request-1",
      type: "sponsorship",
      name: "Ananya Sen",
      email: "ananya@example.com",
      message: "I would like to sponsor the next event.",
      sponsorship_tier: "Premium",
      source_page: "sponsors",
      notification_status: "pending",
      notification_attempted_at: null,
      notification_error: null,
      created_at: "2026-09-01T12:00:00.000Z",
      expires_at: "2028-09-01T12:00:00.000Z",
    });

    await expect(repository.findById("id-1")).resolves.toEqual(storedEnquiry);
    expect(database.lastBindings).toEqual(["id-1"]);
  });

  it("deletes only records whose expiry is at or before now", async () => {
    const { database, repository } = createRepository();
    database.runResults.push({ success: true, meta: { changes: 3 } });

    await expect(
      repository.deleteExpired("2028-09-01T00:00:00.000Z")
    ).resolves.toBe(3);
    expect(database.lastStatement).toMatch(
      /DELETE FROM enquiries WHERE expires_at <= \?/
    );
    expect(database.lastBindings).toEqual(["2028-09-01T00:00:00.000Z"]);
  });
});
