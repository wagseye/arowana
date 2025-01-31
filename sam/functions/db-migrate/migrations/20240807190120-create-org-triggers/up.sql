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
    new_schema text;
    key_seq    bigint;
    key_next   bigint;
    key_incr   bigint;
BEGIN
    IF NEW.id_key IS NULL OR NEW.id_key='' THEN
        SELECT sequence_number, next, increment INTO key_seq, key_next, key_incr FROM object_sequences
            WHERE organization_key IS NULL AND object_prefix IS NULL
            FOR UPDATE;
        UPDATE object_sequences SET sequence_number=(key_seq + 1), next=(key_next + key_incr)
            WHERE organization_key IS NULL AND object_prefix IS NULL;
        NEW.id_key := base36_encode(key_next, const_id_org_key_len());
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
