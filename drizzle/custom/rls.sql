-- Enable RLS on the table (Example for a theoretical Dynamic Schema)
-- This file serves as a template for what must be applied to EVERY new tenant schema.

-- 1. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy
-- The policy checks if the 'app.tenant_id' session variable matches the row's tenant_id column.
-- Even though they are in a private schema, this double-checks that the connection context is correct.
-- If 'app.tenant_id' is NOT set (e.g. leaking query outside middleware), this returns false.

CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.tenant_id'));

CREATE POLICY tenant_isolation_policy ON projects
    USING (tenant_id = current_setting('app.tenant_id'));

CREATE POLICY tenant_isolation_policy ON tasks
    USING (tenant_id = current_setting('app.tenant_id'));
