CREATE TABLE enquiries (
  id TEXT PRIMARY KEY NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('contact', 'sponsorship')),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 5000),
  sponsorship_tier TEXT,
  source_page TEXT NOT NULL CHECK (source_page IN ('home', 'sponsors')),
  notification_status TEXT NOT NULL CHECK (notification_status IN ('pending', 'sent', 'failed')),
  notification_attempted_at TEXT,
  notification_error TEXT CHECK (notification_error IS NULL OR length(notification_error) <= 240),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  CHECK (
    (type = 'contact' AND sponsorship_tier IS NULL) OR
    (type = 'sponsorship' AND sponsorship_tier IS NOT NULL AND length(sponsorship_tier) BETWEEN 1 AND 120)
  )
);

CREATE INDEX enquiries_created_at_id_idx ON enquiries(created_at DESC, id DESC);
CREATE INDEX enquiries_expires_at_idx ON enquiries(expires_at);
CREATE INDEX enquiries_type_created_idx ON enquiries(type, created_at DESC);
CREATE INDEX enquiries_notification_created_idx ON enquiries(notification_status, created_at DESC);
