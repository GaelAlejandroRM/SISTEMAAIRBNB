ALTER TABLE users ADD COLUMN avatar text;
ALTER TABLE listings ADD COLUMN latitude double precision, ADD COLUMN longitude double precision;
ALTER TABLE listings ADD CONSTRAINT listings_location_pair CHECK (
 (latitude IS NULL AND longitude IS NULL) OR
 (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);
