ALTER TABLE users ADD COLUMN city text NOT NULL DEFAULT '';
ALTER TABLE reservations ADD COLUMN notes text NOT NULL DEFAULT '';
ALTER TABLE reservations ADD COLUMN fee_cents integer NOT NULL DEFAULT 0 CHECK(fee_cents>=0);
CREATE TABLE favorites (
 user_id uuid NOT NULL REFERENCES users(id),
 listing_id uuid NOT NULL REFERENCES listings(id),
 PRIMARY KEY(user_id,listing_id)
);
