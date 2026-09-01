import type {
  EnquiryType,
  LeadPage,
  LeadSummary,
  NotificationStatus,
  StoredEnquiry,
} from "../contracts";

interface EnquiryRow {
  id: string;
  idempotency_key: string;
  type: EnquiryType;
  name: string;
  email: string;
  message: string;
  sponsorship_tier: string | null;
  source_page: "home" | "sponsors";
  notification_status: NotificationStatus;
  notification_attempted_at: string | null;
  notification_error: string | null;
  created_at: string;
  expires_at: string;
}

type LeadSummaryRow = Omit<EnquiryRow, "idempotency_key" | "message"> & {
  message_excerpt: string;
};

interface TotalsRow {
  all_count: number;
  contact_count: number;
  sponsorship_count: number;
  failed_count: number;
}

const clampPageSize = (limit: number): number =>
  Math.min(100, Math.max(1, Math.trunc(limit)));

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, "\\$&");

const mapEnquiry = (row: EnquiryRow): StoredEnquiry => ({
  id: row.id,
  idempotencyKey: row.idempotency_key,
  type: row.type,
  name: row.name,
  email: row.email,
  message: row.message,
  sponsorshipTier: row.sponsorship_tier,
  sourcePage: row.source_page,
  notificationStatus: row.notification_status,
  notificationAttemptedAt: row.notification_attempted_at,
  notificationError: row.notification_error,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
});

const mapLeadSummary = (row: LeadSummaryRow): LeadSummary => ({
  id: row.id,
  type: row.type,
  name: row.name,
  email: row.email,
  messageExcerpt: row.message_excerpt,
  sponsorshipTier: row.sponsorship_tier,
  sourcePage: row.source_page,
  notificationStatus: row.notification_status,
  notificationAttemptedAt: row.notification_attempted_at,
  notificationError: row.notification_error,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
});

export class EnquiryRepository {
  constructor(private readonly db: D1Database) {}

  async findReceipt(idempotencyKey: string): Promise<{ id: string } | null> {
    return this.db
      .prepare("SELECT id FROM enquiries WHERE idempotency_key = ? LIMIT 1")
      .bind(idempotencyKey)
      .first<{ id: string }>();
  }

  async create(enquiry: StoredEnquiry): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO enquiries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        enquiry.id,
        enquiry.idempotencyKey,
        enquiry.type,
        enquiry.name,
        enquiry.email,
        enquiry.message,
        enquiry.sponsorshipTier,
        enquiry.sourcePage,
        enquiry.notificationStatus,
        enquiry.notificationAttemptedAt,
        enquiry.notificationError,
        enquiry.createdAt,
        enquiry.expiresAt
      )
      .run();
  }

  async markNotification(
    id: string,
    outcome: {
      status: "sent" | "failed";
      attemptedAt: string;
      error: string | null;
    }
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE enquiries
         SET notification_status = ?,
             notification_attempted_at = ?,
             notification_error = ?
         WHERE id = ?`
      )
      .bind(outcome.status, outcome.attemptedAt, outcome.error, id)
      .run();
  }

  async list(filters: {
    limit: number;
    cursor?: string;
    query?: string;
    type?: EnquiryType;
    notificationStatus?: NotificationStatus;
    from?: string;
    to?: string;
  }): Promise<LeadPage> {
    const totals = await this.db
      .prepare(
        `SELECT
           COUNT(*) AS all_count,
           SUM(CASE WHEN type = 'contact' THEN 1 ELSE 0 END) AS contact_count,
           SUM(CASE WHEN type = 'sponsorship' THEN 1 ELSE 0 END) AS sponsorship_count,
           SUM(CASE WHEN notification_status = 'failed' THEN 1 ELSE 0 END) AS failed_count
         FROM enquiries`
      )
      .first<TotalsRow>();

    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (filters.cursor) {
      const separator = filters.cursor.lastIndexOf("|");
      if (separator <= 0 || separator === filters.cursor.length - 1) {
        throw new Error("Invalid enquiry cursor");
      }
      const createdAt = filters.cursor.slice(0, separator);
      const id = filters.cursor.slice(separator + 1);
      conditions.push("(created_at < ? OR (created_at = ? AND id < ?))");
      bindings.push(createdAt, createdAt, id);
    }

    if (filters.query) {
      const pattern = `%${escapeLike(filters.query)}%`;
      conditions.push(
        "(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')"
      );
      bindings.push(pattern, pattern, pattern);
    }

    if (filters.type) {
      conditions.push("type = ?");
      bindings.push(filters.type);
    }

    if (filters.notificationStatus) {
      conditions.push("notification_status = ?");
      bindings.push(filters.notificationStatus);
    }

    if (filters.from) {
      conditions.push("created_at >= ?");
      bindings.push(filters.from);
    }

    if (filters.to) {
      conditions.push("created_at <= ?");
      bindings.push(filters.to);
    }

    const pageSize = clampPageSize(filters.limit);
    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.db
      .prepare(
        `SELECT
           id,
           type,
           name,
           email,
           substr(message, 1, 240) AS message_excerpt,
           sponsorship_tier,
           source_page,
           notification_status,
           notification_attempted_at,
           notification_error,
           created_at,
           expires_at
         FROM enquiries
         ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ? + 1`
      )
      .bind(...bindings, pageSize)
      .all<LeadSummaryRow>();

    const hasNextPage = result.results.length > pageSize;
    const rows = result.results.slice(0, pageSize);
    const lastRow = rows.at(-1);

    return {
      items: rows.map(mapLeadSummary),
      nextCursor:
        hasNextPage && lastRow ? `${lastRow.created_at}|${lastRow.id}` : null,
      totals: {
        all: totals?.all_count ?? 0,
        contact: totals?.contact_count ?? 0,
        sponsorship: totals?.sponsorship_count ?? 0,
        failed: totals?.failed_count ?? 0,
      },
    };
  }

  async findById(id: string): Promise<StoredEnquiry | null> {
    const row = await this.db
      .prepare(
        `SELECT
           id,
           idempotency_key,
           type,
           name,
           email,
           message,
           sponsorship_tier,
           source_page,
           notification_status,
           notification_attempted_at,
           notification_error,
           created_at,
           expires_at
         FROM enquiries
         WHERE id = ?
         LIMIT 1`
      )
      .bind(id)
      .first<EnquiryRow>();

    return row ? mapEnquiry(row) : null;
  }

  async deleteExpired(now: string): Promise<number> {
    const result = await this.db
      .prepare("DELETE FROM enquiries WHERE expires_at <= ?")
      .bind(now)
      .run();
    return result.meta.changes;
  }
}
