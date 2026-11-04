-- La cola conserva solo un mensaje cifrado; los enlaces no se guardan en texto plano.
CREATE TABLE recovery_mail_jobs (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 token_hash text NOT NULL,
 payload text NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 leased_until timestamptz,
 expires_at timestamptz NOT NULL,
 completed_at timestamptz,
 result text CHECK(result IN ('enviado','vencido','fallido')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recovery_mail_pending ON recovery_mail_jobs(next_attempt_at) WHERE completed_at IS NULL;
