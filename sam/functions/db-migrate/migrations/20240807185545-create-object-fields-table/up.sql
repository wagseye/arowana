CREATE TABLE object_fields (
  id                  text PRIMARY KEY,
  object_id           text NOT NULL,
  name                text NOT NULL,
  label               text NOT NULL,
  type                text NOT NULL,
  sql_type            text NOT NULL,
  field_type_id       text,
  reference_object_id text,
  reference_field_id  text,
  description         text,
  not_null            boolean DEFAULT false,
  default_value       text CHECK ((default_value IS NULL) = (default_type IS NULL)), --both or neither must be set
  default_type        text CHECK (default_type IS NULL OR default_type=sql_type OR default_type='formula'),
  options             json,
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
