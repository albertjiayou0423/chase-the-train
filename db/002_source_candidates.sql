CREATE TABLE IF NOT EXISTS source_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('wikidata', 'osm')),
  external_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('station', 'line', 'stock', 'operator', 'other')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  retrieved_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS source_candidates_owner_idx ON source_candidates (owner_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS source_candidates_status_idx ON source_candidates (status, submitted_at DESC);
