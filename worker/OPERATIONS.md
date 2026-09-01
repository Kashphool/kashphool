# Lead Worker operations

Run commands from the repository root. Production commands require an authenticated Wrangler session and an explicit change approval. Never paste secret values into a command, terminal history, ticket or log.

Production is the explicit named Wrangler environment. Never deploy the default local profile. The approved deployment form is:

```sh
pnpm exec wrangler deploy --config worker/wrangler.jsonc --env production
```

## Local development

Copy the safe examples once, then start the full local stack:

```sh
cp worker/.dev.vars.example worker/.dev.vars
printf '%s\n' 'KASHPHOOL_LOCAL_ADMIN_TOKEN=local-development-only-change-me' > .env.local
pnpm exec wrangler d1 migrations apply kashphool-local --local --config worker/wrangler.jsonc
pnpm dev
```

The local D1 database and `.dev.vars` are ignored. `pnpm check:leads-worker` instead uses isolated temporary D1 state and removes it after the bounded smoke test.

## Production migrations

Review pending migrations and the SQL file before applying anything:

```sh
pnpm exec wrangler d1 migrations list kashphool --remote --config worker/wrangler.jsonc --env production
sed -n '1,240p' worker/migrations/0001_create_enquiries.sql
pnpm exec wrangler d1 migrations apply kashphool --remote --config worker/wrangler.jsonc --env production
```

The final command mutates production and must be run only after approval. New use cases receive new tables and migrations; do not add unrelated data to `enquiries`.

## Secret rotation

Wrangler prompts without exposing the value in the process list:

```sh
pnpm exec wrangler secret put TURNSTILE_SECRET --config worker/wrangler.jsonc --env production
pnpm exec wrangler secret put EMAILJS_PRIVATE_KEY --config worker/wrangler.jsonc --env production
```

If EmailJS does not use a private key, omit the second command. Rotate one provider credential at a time, submit a synthetic enquiry, check its notification status, and only then revoke the old credential.

## Privacy-safe record lookup

Wrangler's SQL CLI has no bind-parameter flag. Never interpolate raw operator input into SQL. Hex-encode it first; the resulting value contains only hexadecimal characters. The lookup below returns operational metadata, not names, email addresses or messages:

```sh
read -r "TARGET_EMAIL?Verified requester email: "
EMAIL_HEX=$(printf %s "$TARGET_EMAIL" | xxd -p -c 999 | tr -d '\n')
pnpm exec wrangler d1 execute kashphool --remote --config worker/wrangler.jsonc --env production --command "SELECT id, type, source_page, notification_status, created_at, expires_at FROM enquiries WHERE email = lower(CAST(X'$EMAIL_HEX' AS TEXT)) ORDER BY created_at DESC LIMIT 100"
unset TARGET_EMAIL EMAIL_HEX
```

Verify the returned ID against the authenticated data-subject request through a second channel. Then encode the exact UUID, preview its metadata, and delete only that record after approval:

```sh
read -r "RECORD_ID?Verified enquiry UUID: "
case "$RECORD_ID" in (*[!0-9a-fA-F-]*|'') echo 'Invalid UUID' >&2; exit 1;; esac
ID_HEX=$(printf %s "$RECORD_ID" | xxd -p -c 999 | tr -d '\n')
pnpm exec wrangler d1 execute kashphool --remote --config worker/wrangler.jsonc --env production --command "SELECT id, type, source_page, created_at, expires_at FROM enquiries WHERE id = CAST(X'$ID_HEX' AS TEXT) LIMIT 1"
read -r "CONFIRM?Type DELETE to remove this one verified record: "
[ "$CONFIRM" = DELETE ] && pnpm exec wrangler d1 execute kashphool --remote --config worker/wrangler.jsonc --env production --command "DELETE FROM enquiries WHERE id = CAST(X'$ID_HEX' AS TEXT)"
unset RECORD_ID ID_HEX CONFIRM
```

## Usage and notification checks

These checks do not return personal fields:

```sh
pnpm exec wrangler d1 info kashphool --config worker/wrangler.jsonc --env production
pnpm exec wrangler d1 execute kashphool --remote --config worker/wrangler.jsonc --env production --command "SELECT notification_status, COUNT(*) AS records FROM enquiries GROUP BY notification_status ORDER BY notification_status"
pnpm exec wrangler d1 execute kashphool --remote --config worker/wrangler.jsonc --env production --command "SELECT substr(notification_attempted_at, 1, 10) AS attempted_day, notification_error, COUNT(*) AS failures FROM enquiries WHERE notification_status = 'failed' GROUP BY attempted_day, notification_error ORDER BY attempted_day DESC LIMIT 30"
```

## Frontend form rollback

Identify the last frontend form commit, inspect its parent, and use a signed revert so history remains auditable:

```sh
git log --oneline -- client/src/components/sections/ContactSection.tsx client/src/components/sponsors/SponsorEnquiryModal.tsx client/src/lib/enquiryApi.ts
git show --stat <frontend-commit>
git revert -S <frontend-commit>
pnpm check
```

Push and GitHub Pages deployment still require the normal review and approval. The Worker and D1 remain intact during a frontend-only rollback.
