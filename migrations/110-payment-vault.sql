-- One shared native instrument registry; provider tokens remain in the private adapter.
CREATE TABLE payment_instruments (
 tenant text NOT NULL, id text NOT NULL, customer_id text NOT NULL,
 provider text NOT NULL, adapter_version text NOT NULL, account_ref text NOT NULL,
 environment text NOT NULL CHECK(environment IN ('sandbox','live','simulation','contract-fixture')),
 method text NOT NULL, reference text NOT NULL, attempt_id text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}', consent_version text NOT NULL,
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
 PRIMARY KEY(tenant,id), FOREIGN KEY(tenant,customer_id) REFERENCES customers(tenant,id),
 FOREIGN KEY(tenant,attempt_id) REFERENCES payment_attempts(tenant,id),
 UNIQUE(tenant,provider,environment,account_ref,reference),
 CHECK(length(reference) BETWEEN 1 AND 200 AND length(consent_version) BETWEEN 1 AND 50)
);
CREATE INDEX payment_instruments_customer ON payment_instruments(tenant,customer_id,state,created_at);
ALTER TABLE payment_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_instruments FORCE ROW LEVEL SECURITY;
CREATE POLICY core_tenant_scope ON payment_instruments USING(tenant=current_setting('rac.tenant',true) OR current_setting('rac.system',true)='on') WITH CHECK(tenant=current_setting('rac.tenant',true) OR current_setting('rac.system',true)='on');
CREATE POLICY authenticated_scope ON payment_instruments AS RESTRICTIVE USING(coalesce((SELECT (public.veyndo_scope_guard()->>'system')::boolean),false) OR tenant=(SELECT public.veyndo_scope_guard()->>'tenant')) WITH CHECK(coalesce((SELECT (public.veyndo_scope_guard()->>'system')::boolean),false) OR tenant=(SELECT public.veyndo_scope_guard()->>'tenant'));
DO $fn$ DECLARE r name; BEGIN
 FOR r IN SELECT system_role FROM veyndo_authority.configuration UNION SELECT tenant_login FROM veyndo_authority.configuration LOOP
  IF r IS NOT NULL THEN EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE,REFERENCES ON payment_instruments TO %I',r); END IF;
 END LOOP;
END $fn$;
