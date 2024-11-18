CREATE FUNCTION public.create_table_from_new_object_record()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS %s.%s()', NEW.table_schema, NEW.table_name);
    INSERT INTO object_fields (object_id, name, label, type)
        VALUES (NEW.id, 'id', 'id', 'text');
    EXECUTE format('CREATE OR REPLACE TRIGGER populate_%s_%s_id BEFORE INSERT ON %s.%s FOR EACH ROW EXECUTE FUNCTION populate_new_record_id()',
        NEW.table_schema, NEW.table_name, NEW.table_schema, NEW.table_name);
    RETURN NEW;
END;
$function$;

CREATE TRIGGER create_table_from_new_object_record
    AFTER INSERT ON objects
    FOR EACH ROW
    EXECUTE FUNCTION create_table_from_new_object_record();


CREATE FUNCTION public.create_column_from_new_field_record()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    tbl_schema       text;
    tbl_name         text;
    ref_tbl_name   text;
    ref_tbl_schema text;
    ref_field_name   text;
BEGIN
    SELECT table_schema, table_name INTO tbl_schema, tbl_name FROM objects WHERE id=NEW.object_id;

    IF lower(NEW.type) = 'reference' THEN
        SELECT table_schema, table_name INTO ref_tbl_schema, ref_tbl_name FROM objects WHERE id=NEW.reference_object_id;
        IF count(ref_tbl_name) = 0 THEN
            RAISE EXCEPTION 'Did not find object with id=%', NEW.reference_object_id;
        END IF;

        IF tbl_schema != ref_tbl_schema THEN
            RAISE EXCEPTION 'Reference table must have the same schema name as referring table';
        END IF;

        SELECT name INTO ref_field_name FROM object_fields WHERE id=NEW.reference_field_id;
        IF count(ref_field_name) = 0 THEN
            RAISE EXCEPTION 'Did not find object field with id=%', NEW.reference_field_id;
        END IF;

        EXECUTE format('ALTER TABLE %s.%s ADD COLUMN IF NOT EXISTS %s text', tbl_schema, tbl_name, NEW.name);
        EXECUTE format('ALTER TABLE %s.%s ADD CONSTRAINT fk_%s FOREIGN KEY (%s) REFERENCES %s.%s(%s)',
          tbl_schema, tbl_name, ref_tbl_name, NEW.name, ref_tbl_schema, ref_tbl_name, ref_field_name);
    ELSE
        IF new.name = 'id' THEN
            EXECUTE format('ALTER TABLE %s.%s ADD COLUMN %s %s PRIMARY KEY', tbl_schema, tbl_name, NEW.name, NEW.type);
        ELSE
            EXECUTE format('ALTER TABLE %s.%s ADD COLUMN %s %s', tbl_schema, tbl_name, NEW.name, NEW.type);
        END IF;
    END IF;
    RAISE NOTICE 'table_name=(%.%)', tbl_schema, tbl_name;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER create_column_from_new_field_record
    AFTER INSERT ON object_fields
    FOR EACH ROW
    EXECUTE FUNCTION create_column_from_new_field_record();


CREATE FUNCTION populate_unset_reference_field_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    ref_field_id text;
BEGIN
    IF lower(NEW.type) = 'reference' THEN
        IF NEW.reference_object_id IS NULL OR NEW.reference_object_id = '' THEN
            RAISE EXCEPTION 'Column reference_object_id must be set for a reference field';
        END IF;
        IF NEW.reference_field_id IS NULL THEN
            -- If no field id is given, try to find the "id" field on the specified object
            SELECT id INTO ref_field_id FROM object_fields WHERE object_id=NEW.reference_object_id AND name='id';
            IF count(ref_field_id) = 0 THEN
                RAISE EXCEPTION 'Did not find an id field to default to for object with id=%', NEW.reference_object_id;
            END IF;
        END IF;
    END IF;

    -- Postgres field names will always be converted to lower case. To ensure our unique constraint on the name field will work,
    -- we need to ensure the value in the "name" field is lower case
    IF lower(NEW.name) != NEW.name THEN
        RAISE EXCEPTION 'The field name must be lower case';
    END IF;


    RETURN NEW;
END;
$function$;

CREATE TRIGGER populate_unset_reference_field_id
    BEFORE INSERT ON object_fields
    FOR EACH ROW
    EXECUTE FUNCTION populate_unset_reference_field_id();


CREATE FUNCTION public.update_column_from_field_record_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    tbl_schema text;
    tbl_name   text;
BEGIN
    RAISE NOTICE 'In trigger update_column_from_field_record_change';
    SELECT table_schema, table_name INTO tbl_schema, tbl_name FROM objects WHERE id=NEW.object_id;
    IF (NEW.default_value IS DISTINCT FROM OLD.default_value) THEN
      IF (NEW.default_value IS NOT NULL) THEN
        RAISE NOTICE 'Default value changed to %', NEW.default_value;
        EXECUTE format('ALTER TABLE %s.%s ALTER COLUMN %s SET DEFAULT ''%s''', tbl_schema, tbl_name, NEW.name, new.default_value);
--                     ALTER TABLE newobjs ALTER COLUMN othertext SET DEFAULT 'other'::text;
      ELSE
        RAISE NOTICE 'Default value removed: ALTER TABLE %.% ALTER COLUMN % DROP DEFAULT', tbl_schema, tbl_name, NEW.name;
        EXECUTE format('ALTER TABLE %s.%s ALTER COLUMN %s DROP DEFAULT', tbl_schema, tbl_name, NEW.name);
      END IF;
    END IF;

    IF (NEW.not_null IS DISTINCT FROM OLD.not_null) THEN
      IF (NEW.not_null) THEN
        RAISE NOTICE 'Not null constraint added: ALTER TABLE %.% ALTER COLUMN % SET NOT NULL', tbl_schema, tbl_name, NEW.name;
        EXECUTE format('ALTER TABLE %s.%s ALTER COLUMN %s SET NOT NULL', tbl_schema, tbl_name, NEW.name);
      ELSE
--        RAISE NOTICE 'Not null constraint removed';
        RAISE NOTICE 'Not null constraint removed: ALTER TABLE %.% ALTER COLUMN % DROP NOT NULL', tbl_schema, tbl_name, NEW.name;
        EXECUTE format('ALTER TABLE %s.%s ALTER COLUMN %s DROP NOT NULL', tbl_schema, tbl_name, NEW.name);
      END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_column_from_field_record_change
    AFTER UPDATE ON object_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_column_from_field_record_change();
