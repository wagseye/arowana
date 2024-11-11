CREATE TABLE objects (
  id               text PRIMARY KEY,
  organization_id  text NOT NULL,
  name             text NOT NULL,
  label            text NOT NULL,
  label_plural     text NOT NULL,
  table_schema     text,
  table_name       text NOT NULL,
  is_admin         boolean DEFAULT false,
  prefix           text NOT NULL,
  description      text,
  created_by       text,
  created_at       timestamp with time zone NOT NULL DEFAULT now(),
  last_modified_by text,
  last_modified_at timestamp with time zone,
  deleted_at       timestamp with time zone,
  UNIQUE (organization_id, prefix),
  -- Don't allow more than one undeleted record for each unique (table_schema, table_name)
  EXCLUDE USING btree (
    table_schema WITH =,
    table_name WITH =
  ) WHERE (deleted_at IS NULL)
);
ALTER TABLE objects ADD CONSTRAINT fk_organization FOREIGN KEY (organization_id, table_schema) REFERENCES organizations(id, table_schema) ON UPDATE CASCADE;
ALTER TABLE objects ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE;
ALTER TABLE objects ADD CONSTRAINT fk_last_modified_by FOREIGN KEY (last_modified_by) REFERENCES users(id) ON UPDATE CASCADE;

CREATE INDEX idx_objects_organization_id ON objects(organization_id);
CREATE INDEX idx_objects_organization_id_prefix ON objects(organization_id, prefix);
