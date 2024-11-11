CREATE FUNCTION public.get_org_schema_name(org_prefix text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT CONCAT('org_', org_prefix);
$function$;


CREATE OR REPLACE FUNCTION public.populate_org_key_and_schema()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_key bigint;
    new_schema text;
BEGIN
    IF NEW.id_key IS NULL OR NEW.id_key='' THEN
        UPDATE object_sequences _new SET next=(_new.next + 1)
            FROM object_sequences _old
            WHERE _old.organization_key IS NULL and _old.object_prefix IS NULL
              AND _new.organization_key IS NULL and _new.object_prefix IS NULL
            RETURNING _old.next INTO next_key;
        NEW.id_key := base36_encode(next_key, const_id_org_key_len());
    END IF;
    IF NEW.table_schema IS NULL OR NEW.table_schema='' THEN
        new_schema := get_org_schema_name(NEW.id_key);
        NEW.table_schema := new_schema;
        EXECUTE format('CREATE SCHEMA IF NOT EXISTS %s', new_schema);
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER populate_org_key_and_schema
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION populate_org_key_and_schema();
