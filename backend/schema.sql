CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE users (
 id uuid PRIMARY KEY,
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
 email text NOT NULL UNIQUE CHECK(email=lower(email)),
 phone text NOT NULL DEFAULT '',
 password_hash text NOT NULL,
 salt text NOT NULL,
 role text NOT NULL CHECK(role IN ('huesped','anfitrion','administrador')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 expires_at timestamptz NOT NULL
);
CREATE TABLE listings (
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES users(id),
 title text NOT NULL,
 description text NOT NULL,
 location text NOT NULL,
 category text NOT NULL DEFAULT 'all',
 price_cents integer NOT NULL CHECK(price_cents>0),
 capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 100),
 services jsonb NOT NULL DEFAULT '[]',
 features text NOT NULL DEFAULT '',
 images jsonb NOT NULL DEFAULT '[]',
 published boolean NOT NULL DEFAULT false,
 moderated boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reservations (
 id uuid PRIMARY KEY,
 listing_id uuid NOT NULL REFERENCES listings(id),
 guest_id uuid NOT NULL REFERENCES users(id),
 arrival date NOT NULL,
 departure date NOT NULL CHECK(departure>arrival),
 guests integer NOT NULL CHECK(guests BETWEEN 1 AND 100),
 nightly_cents integer NOT NULL CHECK(nightly_cents>0),
 total_cents integer NOT NULL CHECK(total_cents>0),
 status text NOT NULL DEFAULT 'pendiente'
   CHECK(status IN ('pendiente','confirmada','rechazada','cancelada','finalizada')),
 operation_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(guest_id,operation_key)
);
-- Un solo calendario protege tanto reservas como bloqueos del anfitrión.
-- [) permite salida y entrada de distintas estancias en el mismo día.
CREATE TABLE calendar (
 id uuid PRIMARY KEY,
 listing_id uuid NOT NULL REFERENCES listings(id),
 reservation_id uuid UNIQUE REFERENCES reservations(id),
 arrival date NOT NULL,
 departure date NOT NULL CHECK(departure>arrival),
 kind text NOT NULL CHECK(kind IN ('reserva','bloqueo')),
 CHECK ((kind='reserva')=(reservation_id IS NOT NULL)),
 EXCLUDE USING gist (listing_id WITH =, daterange(arrival,departure,'[)') WITH &&)
);
CREATE FUNCTION sync_calendar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status IN ('pendiente','confirmada','finalizada') THEN
   INSERT INTO calendar(id,listing_id,reservation_id,arrival,departure,kind)
   VALUES(NEW.id,NEW.listing_id,NEW.id,NEW.arrival,NEW.departure,'reserva')
   ON CONFLICT(reservation_id) DO UPDATE
     SET arrival=EXCLUDED.arrival,departure=EXCLUDED.departure;
 ELSE
   DELETE FROM calendar WHERE reservation_id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER reservation_calendar AFTER INSERT OR UPDATE ON reservations
 FOR EACH ROW EXECUTE FUNCTION sync_calendar();
CREATE TABLE payments (
 id uuid PRIMARY KEY,
 reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id),
 amount_cents integer NOT NULL CHECK(amount_cents>0),
 status text NOT NULL CHECK(status IN ('aprobado','rechazado')),
 simulated boolean NOT NULL DEFAULT true CHECK(simulated),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reviews (
 id uuid PRIMARY KEY,
 reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id),
 score integer NOT NULL CHECK(score BETWEEN 1 AND 5),
 comment text NOT NULL CHECK(length(trim(comment)) BETWEEN 1 AND 2000),
 visible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE notifications (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 message text NOT NULL,
 read boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id uuid REFERENCES users(id),
 action text NOT NULL,
 target_id uuid,
 details jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listings_owner ON listings(owner_id);
CREATE INDEX reservations_guest ON reservations(guest_id);
CREATE INDEX reservations_listing ON reservations(listing_id);
CREATE INDEX notifications_user ON notifications(user_id,created_at DESC);
