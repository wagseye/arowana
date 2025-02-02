CREATE FUNCTION public.create_prefix_sequence_for_new_org()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    org_key text;
    uid bigint;
BEGIN
    -- 12960 is "a00" in base36, the first allowable prefix for user objects. 46655 is 'zzz' in base36
    INSERT INTO object_sequences (organization_key, object_prefix, start, next, increment, max)
        VALUES (NEW.id_key, null, 12960, 12960, 1, 46655);
    RETURN NEW;

END;
$function$;

CREATE TRIGGER create_prefix_sequence_for_new_org
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION create_prefix_sequence_for_new_org();


CREATE FUNCTION public.create_sequence_from_new_object()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    org_key text;
    start_uid bigint;
BEGIN
    SELECT organizations.id_key into org_key FROM organizations WHERE id = NEW.organization_id;
    start_uid := CAST((random() * const_uid_increment()) AS bigint);
    INSERT INTO object_sequences (organization_key, object_prefix, start, next, increment, max)
        VALUES (org_key, NEW.prefix, start_uid, start_uid, const_uid_increment(), const_uid_max());
    RETURN NEW;
END;
$function$;

CREATE TRIGGER create_sequence_from_new_object
    AFTER INSERT ON objects
    FOR EACH ROW
    EXECUTE FUNCTION create_sequence_from_new_object();


CREATE FUNCTION public.generate_new_record_id(tbl_schema name, tbl_name name)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    obj_prefix text;
    org_key    text;
    uid_seq    bigint;
    uid_next   bigint;
    uid_incr   bigint;
    uid_max    bigint;
BEGIN
    SELECT obj.prefix, org.id_key INTO obj_prefix, org_key
        FROM objects obj
        JOIN organizations org ON obj.organization_id=org.id
        WHERE obj.table_schema=tbl_schema AND obj.table_name=tbl_name;
    IF count(obj_prefix) = 0
        THEN RAISE EXCEPTION 'Did not find object/organization corresponding to %.%', tbl_schema, tbl_name;
    END IF;

    SELECT sequence_number, next, increment, max INTO uid_seq, uid_next, uid_incr, uid_max FROM object_sequences
        WHERE organization_key=org_key AND object_prefix=obj_prefix
        FOR UPDATE;
    UPDATE object_sequences SET sequence_number=(uid_seq + 1), next=MOD(uid_next + uid_incr, uid_max)
        WHERE organization_key=org_key AND object_prefix=obj_prefix;
    return CONCAT(obj_prefix,
                  base36_encode(const_id_api_version(), const_id_api_version_len()),
                  org_key,
                  base36_encode(uid_next, const_id_uid_len()));
END;
$function$;

CREATE FUNCTION public.populate_new_record_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    obj_prefix text;
    org_key    text;
    next_uid   bigint;
    uid        bigint;
BEGIN
    NEW.id = public.generate_new_record_id(TG_TABLE_SCHEMA, TG_TABLE_NAME);
    RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.populate_object_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    org_key     text;
    org_schema  text;
    prfx_seq     bigint;
    prfx_next    bigint;
    prfx_incr    bigint;
BEGIN

    -- First copy the organization key if it is not set
    IF NEW.organization_key IS NULL OR NEW.organization_key='' THEN
        SELECT id_key INTO org_key FROM organizations WHERE id=NEW.organization_id;
        NEW.organization_key = org_key;
    END IF;

    -- Auto-populate the object prefix (if not set)
    IF NEW.prefix IS NULL OR NEW.prefix='' THEN
        SELECT sequence_number, next, increment INTO prfx_seq, prfx_next, prfx_incr FROM object_sequences
            WHERE organization_key=NEW.organization_key AND object_prefix IS NULL
            FOR UPDATE;
        IF prfx_seq IS NULL THEN
            RAISE EXCEPTION 'Did not find object prefix sequence for org with id=%', NEW.organization_id;
        END IF;
        UPDATE object_sequences SET sequence_number=(prfx_seq + 1), next=(prfx_next + prfx_incr)
            WHERE organization_key=NEW.organization_key AND object_prefix IS NULL;

        NEW.prefix := base36_encode(prfx_next, const_id_obj_prefix_len());
    END IF;

    -- Copy the table schema name from the organization if it has not been set
    IF NEW.table_schema IS NULL OR NEW.table_schema='' THEN
        SELECT table_schema INTO org_schema FROM organizations WHERE id=NEW.organization_id;
        NEW.table_schema := org_schema;
    END IF;

    -- Finally, populate (if not set) and validate the table name
    IF NEW.table_name IS NULL OR NEW.table_name='' THEN
        NEW.table_name := LOWER(NEW.label_plural);
    END IF;
    -- Postgres table names will always be converted to lower case. To ensure our unique constraint on the table_name field will work,
    -- we need to ensure the value in the "table_name" field is lower case
    IF lower(NEW.table_name) != NEW.table_name THEN
        RAISE EXCEPTION 'The table name must be lower case';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER populate_object_fields
    BEFORE INSERT ON objects
    FOR EACH ROW
    EXECUTE FUNCTION populate_object_fields();
