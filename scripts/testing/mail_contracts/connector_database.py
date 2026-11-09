"""Provision an isolated connector namespace and non-owner runtime for the native mail journey."""
import secrets
import subprocess
from urllib.parse import urlsplit

from testing.database import psql


def independent_database(case, container, suffix, bridge, binary, core_url):
    database = 'mail_connectors_' + suffix
    role = 'mail_connector_login_' + suffix
    password = secrets.token_hex(24)

    def sql(statement, db='postgres'):
        subprocess.run(
            psql(container, 'commerce', db, '-X', '-v', 'ON_ERROR_STOP=1'),
            input=statement, text=True, check=True, capture_output=True,
        )

    sql(f"CREATE DATABASE {database};")
    case.addCleanup(sql, f"DROP DATABASE {database} WITH (FORCE); DROP ROLE IF EXISTS {role};")
    sql(f"CREATE ROLE {role} LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '{password}';")
    sql(subprocess.check_output([binary, '--print-schema'], text=True), database)
    sql(f"""
        GRANT USAGE ON SCHEMA public TO {role};
        GRANT SELECT ON connector_namespaces, connector_access TO {role};
        GRANT SELECT, INSERT, UPDATE, DELETE ON connector_config, connector_limits,
          connector_jobs, connector_oauth, connector_sources, connector_changes TO {role};
        GRANT USAGE, SELECT, UPDATE ON SEQUENCE connector_changes_seq_seq TO {role};
    """, database)
    url = urlsplit(core_url)
    endpoint = url._replace(
        netloc=f'{role}:{password}@{url.hostname}:{url.port or 5432}', path='/' + database,
    ).geturl()
    return {
        'CONNECTOR_PROFILE': 'standalone',
        'CONNECTOR_DATABASE_URL': endpoint,
        'CONNECTOR_CORE_BRIDGE_TOKEN': bridge,
    }, lambda tenant: sql(f"INSERT INTO connector_namespaces(tenant) VALUES ('{tenant}');", database)
