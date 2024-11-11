CREATE TABLE object_fields (
  id                  text PRIMARY KEY,
  object_id           text NOT NULL,
  name                text NOT NULL,
  label               text NOT NULL,
  type                text NOT NULL,
  reference_object_id text,
  reference_field_id  text,
  description         text,
  not_null            boolean DEFAULT false,
  default_value       text,
  created_by          text,
  created_at          timestamp with time zone NOT NULL DEFAULT now(),
  last_modified_by    text,
  last_modified_at    timestamp with time zone,
  deleted_at          timestamp with time zone,
  -- Don't allow more than one undeleted record for each unique (object_id, name)
  EXCLUDE USING btree (
    object_id WITH =,
    name WITH =
  ) WHERE (deleted_at IS NULL)
);
ALTER TABLE object_fields ADD CONSTRAINT fk_object FOREIGN KEY (object_id) REFERENCES objects(id);
CREATE INDEX idx_object_fields_object_id ON object_fields(object_id);
CREATE INDEX idx_object_fields_object_id_name ON object_fields(object_id, name);
