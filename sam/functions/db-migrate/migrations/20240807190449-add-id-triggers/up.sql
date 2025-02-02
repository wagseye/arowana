DO $$
DECLARE
    org_prefix constant TEXT := '001';
    user_prefix constant TEXT := '002';
    obj_prefix constant TEXT := '015';
    obj_fld_prefix constant TEXT := '016';

    temp_obj_id constant TEXT := 'temp_obj_id';
    obj_id TEXT;

    temp_org_id TEXT;
    org_id TEXT;

    temp_user_id TEXT;
    user_id TEXT;
BEGIN
  SELECT id INTO temp_org_id FROM organizations WHERE name='admin' LIMIT 1;
  RAISE NOTICE 'temp_org_id=%', temp_org_id;

  SELECT id INTO temp_user_id FROM users LIMIT 1;
  RAISE NOTICE 'temp_user_id=%', temp_user_id;
  
  --Create the object record in the objects table
  INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, is_admin, prefix, created_by)
      VALUES (temp_obj_id, temp_org_id, 'object', 'object', 'objects', 'public', 'objects', true, obj_prefix, temp_user_id);

  --Generate a real id for our object id and create a trigger to handle it in the future
  obj_id := generate_new_record_id('public', 'objects');
  UPDATE objects SET id=obj_id WHERE id=temp_obj_id;
  CREATE OR REPLACE TRIGGER populate_public_objects_id
    BEFORE INSERT ON objects FOR EACH ROW
    EXECUTE FUNCTION populate_new_record_id();

  --Create the organization record in the objects table
  INSERT INTO objects (organization_id, name, label, label_plural, table_schema, table_name, is_admin, prefix, created_by)
      VALUES (temp_org_id, 'organization', 'organization', 'organizations', 'public', 'organizations', true, org_prefix, temp_user_id);
  org_id := generate_new_record_id('public', 'organizations');
  UPDATE organizations SET id=org_id WHERE id=temp_org_id;
  CREATE OR REPLACE TRIGGER populate_public_organizations_id
    BEFORE INSERT ON organizations FOR EACH ROW
    EXECUTE FUNCTION populate_new_record_id();


  --Create the user record in the objects table
  INSERT INTO objects (organization_id, name, label, label_plural, table_schema, table_name, is_admin, prefix, created_by)
      VALUES (org_id, 'user', 'user', 'users', 'public', 'users', true, user_prefix, temp_user_id);
  user_id := generate_new_record_id('public', 'users');
  UPDATE users SET id=user_id WHERE id=temp_user_id;
  CREATE OR REPLACE TRIGGER populate_public_users_id
    BEFORE INSERT ON users FOR EACH ROW
    EXECUTE FUNCTION populate_new_record_id();

  --Create the object_field record in the objects table.
  --This will automatically create the object_sequence for generating ids as well as setup the trigger to autogenerate the ids
  INSERT INTO objects (organization_id, name, label, label_plural, table_schema, table_name, is_admin, prefix, created_by)
      VALUES (org_id, 'object_field', 'object_field', 'object_fields', 'public', 'object_fields', true, obj_fld_prefix, user_id);
  CREATE OR REPLACE TRIGGER populate_public_object_fields_id
    BEFORE INSERT ON object_fields FOR EACH ROW
    EXECUTE FUNCTION populate_new_record_id();
END $$;
