CREATE TABLE IF NOT EXISTS collector_jobs (
  key text PRIMARY KEY,
  source text NOT NULL CHECK (source IN ('wikidata', 'osm')),
  query text,
  kind text,
  bbox text,
  next_due timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  last_success timestamptz,
  last_count integer NOT NULL DEFAULT 0,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO collector_jobs (key, source, query, kind, bbox) VALUES
  ('wikidata-tokyo-station', 'wikidata', '東京駅', 'station', NULL),
  ('wikidata-osaka-station', 'wikidata', '大阪駅', 'station', NULL),
  ('wikidata-kyoto-station', 'wikidata', '京都駅', 'station', NULL),
  ('wikidata-jr-east', 'wikidata', '東日本旅客鉄道', 'operator', NULL),
  ('wikidata-tokyo-metro', 'wikidata', '東京地下鉄', 'operator', NULL),
  ('wikidata-yamanote', 'wikidata', '山手線', 'line', NULL),
  ('osm-tokyo', 'osm', NULL, 'station', '35.67,139.75,35.69,139.78'),
  ('osm-osaka', 'osm', NULL, 'station', '34.69,135.48,34.72,135.52')
ON CONFLICT (key) DO NOTHING;
