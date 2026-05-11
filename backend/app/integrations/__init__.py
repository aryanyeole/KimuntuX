# Integration clients package.
# Each module exposes a client class + factory helpers.
# Pattern: get_platform_client() uses env-var credentials;
#          get_tenant_client(db, tenant_id) uses encrypted DB credentials.
