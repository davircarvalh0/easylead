CREATE TABLE IF NOT EXISTS easylead_workspaces (
 id text PRIMARY KEY,
 state jsonb NOT NULL CHECK (state->>'version' = '1'),
 revision bigint NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS easylead_documents (
 id uuid PRIMARY KEY,
 workspace_id text NOT NULL REFERENCES easylead_workspaces(id),
 name text NOT NULL,
 mime text NOT NULL,
 content bytea NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS easylead_sessions (
 id uuid PRIMARY KEY,
 email text NOT NULL,
 expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS easylead_sessions_expiration ON easylead_sessions(expires_at);
CREATE TABLE IF NOT EXISTS easylead_rate_limits (
 key text PRIMARY KEY,
 window_start bigint NOT NULL,
 count integer NOT NULL
);

-- No browser/anonymous SQL policies: access is through the authenticated backend.
-- The connection used to initialize and run the app owns these tables.
ALTER TABLE easylead_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE easylead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE easylead_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE easylead_rate_limits ENABLE ROW LEVEL SECURITY;
