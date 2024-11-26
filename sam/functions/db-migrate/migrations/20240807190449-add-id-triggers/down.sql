DROP TRIGGER populate_public_object_fields_id ON object_fields;
DELETE FROM objects WHERE table_schema='public' AND table_name='object_field';

DROP TRIGGER populate_public_users_id ON users;
DELETE FROM objects WHERE table_schema='public' AND table_name='user';

DROP TRIGGER populate_public_organizations_id ON organizations;
DELETE FROM objects WHERE table_schema='public' AND table_name='organization';

DROP TRIGGER populate_public_objects_id ON objects;
DELETE FROM objects WHERE table_schema='public' AND table_name='object';
