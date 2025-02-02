CREATE TABLE organizations (
  id            text PRIMARY KEY,
  name          text UNIQUE NOT NULL,
  id_key        text UNIQUE NOT NULL,
  table_schema  text UNIQUE NULLS NOT DISTINCT,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at    timestamp with time zone,
  UNIQUE NULLS NOT DISTINCT (id, id_key, table_schema)
);
-- Create the admin organization
INSERT INTO organizations (id, name, id_key, table_schema)
  VALUES ('temp_org_id', 'admin', '0001', 'public');
