-- Note that the plan is for object_sequences to be the only table that doesn't have corresponding entries
-- in the objects/object_fields tables
CREATE TABLE object_sequences(
  id serial PRIMARY KEY,
  organization_key  text,
  object_prefix     text,
  sequence_number   bigint NOT NULL DEFAULT 0 CHECK (sequence_number < max),
  start             bigint NOT NULL CHECK (start < max),
  next              bigint NOT NULL CHECK (next < max),
  increment         bigint NOT NULL,
  max               bigint NOT NULL,
  UNIQUE NULLS NOT DISTINCT (organization_key, object_prefix)
);
ALTER TABLE object_sequences ADD CONSTRAINT fk_organizations_id_key FOREIGN KEY (organization_key) REFERENCES organizations(id_key) ON UPDATE CASCADE;
ALTER TABLE object_sequences ADD CONSTRAINT fk_objects_organization_key_object_prefix FOREIGN KEY (organization_key, object_prefix) REFERENCES objects(organization_key, object_prefix) ON UPDATE CASCADE;

--We insert a special record into obj_seq to keep track the org_key sequence. This is identified by having both
--organization_key and object_prefix set to NULL.  We set next=1000 to reserve 1-999 for admin orgs.
--Since the org_key has 4 alphanumeric characters the max is (36^4)-1 which equals 1679615
INSERT INTO object_sequences(organization_key, object_prefix, start, next, increment, max)
  VALUES(null, null, 1, 1000, 1, 1679615);
