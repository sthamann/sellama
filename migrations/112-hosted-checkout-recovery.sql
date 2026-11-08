-- Retain a scoped recovery digest after a one-time hosted checkout ticket is consumed.
ALTER TABLE checkout_handoffs
    ADD COLUMN recovery_digest text,
    ADD COLUMN recovery_origin text,
    ADD COLUMN recovery_expires_at timestamptz,
    ADD COLUMN consumed_at timestamptz;
