-- Explicit simulated provider environment retains the same immutable native account and payment owners.
ALTER TABLE payment_provider_accounts DROP CONSTRAINT payment_provider_accounts_environment_check;
ALTER TABLE payment_provider_accounts ADD CONSTRAINT payment_provider_accounts_environment_check CHECK(environment IN ('sandbox','live','simulation','contract-fixture'));
