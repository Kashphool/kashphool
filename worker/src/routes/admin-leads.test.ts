import { describe, expect, it } from "vitest";
import type { LeadPage, StoredEnquiry, WorkerEnv } from "../contracts";
import type { EnquiryRepository } from "../repositories/enquiries";
import {
  AccessAuthenticationError,
  AccessAuthorizationError,
  type AccessIdentity,
} from "../services/access-auth";
import { handleAdminLeads, type AdminLeadDependencies } from "./admin-leads";

const env = {
  ACCESS_TEAM_DOMAIN: "kashphool.cloudflareaccess.com",
  ACCESS_AUD: "admin-audience",
  ENVIRONMENT: "production",
} as WorkerEnv;

const page: LeadPage = {
  items: [],
  nextCursor: null,
  totals: { all: 0, contact: 0, sponsorship: 0, failed: 0 },
};

const lead: StoredEnquiry = {
  id: "d95f48a8-bd88-4c57-bf02-306f75ccdd4a",
  idempotencyKey: "30d90187-8e87-4dd3-95ce-6098bd2598b7",
  type: "contact",
  name: "Asha Sen",
  email: "asha@example.com",
  message: "Please tell me about the next event.",
  sponsorshipTier: null,
  sourcePage: "home",
  notificationStatus: "sent",
  notificationAttemptedAt: "2026-09-01T12:01:00.000Z",
  notificationError: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  expiresAt: "2028-09-01T12:00:00.000Z",
};

type AdminRepository = Pick<EnquiryRepository, "list" | "findById">;

class RecordingRepository implements AdminRepository {
  listCalls: Parameters<EnquiryRepository["list"]>[] = [];
  detailCalls: string[] = [];
  pageResult: LeadPage = page;
  detailResult: StoredEnquiry | null = null;

  async list(filters: Parameters<EnquiryRepository["list"]>[0]) {
    this.listCalls.push([filters]);
    return this.pageResult;
  }

  async findById(id: string) {
    this.detailCalls.push(id);
    return this.detailResult;
  }
}

const identity: AccessIdentity = {
  email: "admin@kashphool.co.uk",
  subject: "access-user-123",
};

const createDependencies = (
  repository = new RecordingRepository()
): AdminLeadDependencies & { repository: RecordingRepository } => ({
  repository,
  verifyAccess: async () => identity,
});

const call = (
  path: string,
  dependencies: AdminLeadDependencies,
  method = "GET"
): Promise<Response> =>
  handleAdminLeads(
    new Request(`https://kashphool.co.uk${path}`, { method }),
    env,
    dependencies
  );

describe("handleAdminLeads", () => {
  it("does not access the repository before authentication succeeds", async () => {
    const repository = new RecordingRepository();
    const dependencies: AdminLeadDependencies = {
      repository,
      verifyAccess: async () => {
        throw new AccessAuthenticationError();
      },
    };

    const response = await call("/api/admin/leads", dependencies);

    expect(response.status).toBe(401);
    expect(repository.listCalls).toEqual([]);
    expect(repository.detailCalls).toEqual([]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 403 without repository access for a verified identity without email", async () => {
    const repository = new RecordingRepository();
    const response = await call("/api/admin/leads", {
      repository,
      verifyAccess: async () => {
        throw new AccessAuthorizationError();
      },
    });

    expect(response.status).toBe(403);
    expect(repository.listCalls).toEqual([]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("passes normalized bounded filters to the repository", async () => {
    const dependencies = createDependencies();

    const response = await call(
      "/api/admin/leads?limit=25&type=sponsorship&notification=failed&q=%20festival%20",
      dependencies
    );

    expect(response.status).toBe(200);
    expect(dependencies.repository.listCalls).toEqual([
      [
        {
          limit: 25,
          query: "festival",
          type: "sponsorship",
          notificationStatus: "failed",
        },
      ],
    ]);
    await expect(response.json()).resolves.toEqual(page);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    "cursor=not-a-cursor",
    "cursor=2026-99-01T12:00:00.000Z|d95f48a8-bd88-4c57-bf02-306f75ccdd4a",
    "cursor=2026-02-30T12:00:00.000Z|d95f48a8-bd88-4c57-bf02-306f75ccdd4a",
    "from=not-a-date",
    "to=2026-02-30",
    "type=donation",
    "notification=unknown",
    "limit=0",
    `q=${"x".repeat(201)}`,
  ])(
    "rejects invalid list filter %s without querying the repository",
    async query => {
      const dependencies = createDependencies();

      const response = await call(`/api/admin/leads?${query}`, dependencies);

      expect(response.status).toBe(400);
      expect(dependencies.repository.listCalls).toEqual([]);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  );

  it("returns a lead for an exact UUID detail route", async () => {
    const dependencies = createDependencies();
    dependencies.repository.detailResult = lead;

    const response = await call(`/api/admin/leads/${lead.id}`, dependencies);

    expect(response.status).toBe(200);
    expect(dependencies.repository.detailCalls).toEqual([lead.id]);
    await expect(response.json()).resolves.toEqual(lead);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 404 when an exact UUID detail route has no record", async () => {
    const dependencies = createDependencies();

    const response = await call(
      "/api/admin/leads/d95f48a8-bd88-4c57-bf02-306f75ccdd4a",
      dependencies
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each(["POST", "PATCH", "DELETE"])(
    "returns 405 for authenticated %s requests without repository access",
    async method => {
      const dependencies = createDependencies();

      const response = await call("/api/admin/leads", dependencies, method);

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET");
      expect(dependencies.repository.listCalls).toEqual([]);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  );
});
