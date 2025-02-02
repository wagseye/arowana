DROP TRIGGER populate_public_object_fields_id ON object_fields;
DELETE FROM object_sequences WHERE organization_key='0001' AND object_prefix='016';
DELETE FROM objects WHERE table_schema='public' AND table_name='object_fields';

DROP TRIGGER populate_public_users_id ON users;
DELETE FROM object_sequences WHERE organization_key='0001' AND object_prefix='002';
DELETE FROM objects WHERE table_schema='public' AND table_name='users';

DROP TRIGGER populate_public_organizations_id ON organizations;
DELETE FROM object_sequences WHERE organization_key='0001' AND object_prefix='001';
DELETE FROM objects WHERE table_schema='public' AND table_name='organizations';

DROP TRIGGER populate_public_objects_id ON objects;
DELETE FROM object_sequences WHERE organization_key='0001' AND object_prefix='015';
DELETE FROM objects WHERE table_schema='public' AND table_name='objects';
