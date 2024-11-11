CREATE OR REPLACE FUNCTION pg_temp.populate_object_fields_from_table(tbl_schema name, tbl_name name)
  RETURNS void
  LANGUAGE plpgsql
AS $function$
DECLARE
  obj_id text;
BEGIN
  SELECT id INTO obj_id FROM objects WHERE table_schema=tbl_schema AND table_name=tbl_name;
   RAISE NOTICE 'table_name=%, obj_id=%', tbl_name, obj_id;

  INSERT INTO object_fields(object_id, name, label, type, not_null, default_value) SELECT obj_id, column_name, column_name, data_type, (is_nullable!='YES')::boolean, column_default from INFORMATION_SCHEMA.COLUMNS where table_name=tbl_name;
END;
$function$;

SELECT pg_temp.populate_object_fields_from_table('public', 'organizations');
SELECT pg_temp.populate_object_fields_from_table('public', 'users');
SELECT pg_temp.populate_object_fields_from_table('public', 'objects');
SELECT pg_temp.populate_object_fields_from_table('public', 'object_fields');

--Create a record in the object_sequences table for new objects prefixes
DO $$
DECLARE org_key TEXT;
BEGIN
  SELECT id_key INTO org_key FROM organizations WHERE name='admin';
  IF count(org_key) = 0 THEN
      RAISE EXCEPTION 'Did not find organization';
  END IF;

  --  Our top object id should be 016 in base36 (decimal 42), set the next value to be a little above that (50)
  --  46655 is 'zzz' in base36
  INSERT INTO object_sequences (organization_key, object_prefix, start, next, increment, max)
      VALUES (org_key, null, 1, 50, 1, 46655);
END $$;

