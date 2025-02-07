CREATE OR REPLACE FUNCTION pg_temp.get_field_type_from_sql_type(field_name text, sql_type text)
  RETURNS text
  LANGUAGE plpgsql
AS $function$
BEGIN
  CASE LOWER(sql_type)
  WHEN 'text' THEN
    IF field_name = 'id' THEN
      RETURN 'id';
    ELSEIF RIGHT(field_name, 3) = '_id' THEN
      RETURN 'reference';
    END IF;
    RETURN 'text';
  WHEN 'boolean' THEN
    RETURN 'boolean';
  WHEN 'timestamp with time zone' THEN
    RETURN 'datetime';
  -- The custom enum types show up as "USER-DEFINED"
  WHEN 'sql_type' THEN
    RETURN 'text';
  WHEN 'field_type' THEN
    RETURN 'text';
  WHEN 'json' THEN
    RETURN 'json';
  ELSE
    RAISE EXCEPTION 'Unrecognized type: %', sql_type;
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION pg_temp.get_default_type(column_default text, data_type text)
  RETURNS text
  LANGUAGE plpgsql
AS $function$
BEGIN
  IF column_default IS NULL THEN
    return NULL;
  ELSEIF RIGHT(column_default, 1) = ')' THEN
    return 'formula';
  END IF;
  return data_type;
END;
$function$;

CREATE OR REPLACE FUNCTION pg_temp.populate_object_fields_from_table(tbl_schema name, tbl_name name)
  RETURNS void
  LANGUAGE plpgsql
AS $function$
DECLARE
  obj_id text;
BEGIN
  SELECT id INTO obj_id FROM objects WHERE table_schema=tbl_schema AND table_name=tbl_name;
   RAISE NOTICE 'table_name=%, obj_id=%', tbl_name, obj_id;

  INSERT INTO object_fields(object_id, name, label, type, sql_type, not_null, default_value, default_type)
    SELECT obj_id, column_name, column_name, pg_temp.get_field_type_from_sql_type(column_name, data_type), data_type, (is_nullable!='YES')::boolean, column_default, pg_temp.get_default_type(column_default, data_type)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name=tbl_name;
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

