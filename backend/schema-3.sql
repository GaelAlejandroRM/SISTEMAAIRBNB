CREATE TABLE password_resets (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 requested_at timestamptz NOT NULL DEFAULT now()
);
