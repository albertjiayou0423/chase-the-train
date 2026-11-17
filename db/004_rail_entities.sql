CREATE TABLE IF NOT EXISTS rail_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('wikidata', 'osm')),
  external_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('station', 'line', 'stock', 'operator')),
  name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  source_url text NOT NULL,
  source_license text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS rail_entities_kind_name_idx ON rail_entities (kind, lower(name));
CREATE INDEX IF NOT EXISTS rail_entities_updated_idx ON rail_entities (updated_at DESC);
