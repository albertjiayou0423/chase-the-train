CREATE TABLE IF NOT EXISTS catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('station', 'line', 'stock')),
  name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  source_name text NOT NULL,
  source_url text,
  source_license text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, name)
);

CREATE INDEX IF NOT EXISTS catalog_name_idx ON catalog (lower(name));

CREATE TABLE IF NOT EXISTS records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('ride', 'sighting')),
  occurred_on date NOT NULL,
  train_label text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  station text NOT NULL DEFAULT '',
  stock text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  image_url text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  moderation text NOT NULL DEFAULT 'pending' CHECK (moderation IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS records_owner_idx ON records (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS records_public_idx ON records (created_at DESC) WHERE visibility = 'public' AND moderation = 'approved';

CREATE TABLE IF NOT EXISTS favorites (
  owner_id text NOT NULL,
  catalog_id uuid NOT NULL REFERENCES catalog(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, catalog_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  owner_id text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  reporter_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL REFERENCES catalog(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
