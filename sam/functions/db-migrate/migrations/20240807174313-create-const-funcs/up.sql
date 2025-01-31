--Create a number of functions that return constant values. All of these are for generating 16 character object ids:
--  * base36_encode: used to convert individual components of the id into (case insensitive)
--    alphanumeric representation
--  * const_id_api_version_len: the version length is now 1 alphanumeric character
--  * const_id_api_version: "1" to start
--  * const_id_obj_prefix_len: 3 alphanumeric characters. Built-in prefixes begin with a number, custom
--    objects begin with a letter
--  * const_id_org_key_len: An alphanumeric number corresponding to an organization's id_key that
--    definitively marks which organization a record was created by (an belongs to)
--  * const_uid_increment: a prime number picked to be about 1/36th of const_uid_max so that *most*
--    consecutive generated alphanumeric uids will have a different leading character
--  * const_uid_max: picked to be the largest prime number below the maximum of 36^7

CREATE FUNCTION public.base36_encode(digits bigint, min_width integer DEFAULT 0)
 RETURNS character varying
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    chars char[];
    ret varchar;
    val bigint;
BEGIN
    chars := ARRAY['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    val := digits;
    ret := '';
    IF val < 0 THEN
        val := val * -1;
    END IF;
    WHILE val != 0 LOOP
        ret := chars[(val % 36)+1] || ret;
        val := val / 36;
    END LOOP;

    IF min_width > 0 AND char_length(ret) < min_width THEN
        ret := lpad(ret, min_width, '0');
    END IF;

    RETURN ret;
END;
$function$;

CREATE FUNCTION public.const_id_api_version_len()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 1;
$function$;

CREATE FUNCTION public.const_id_api_version()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 1;
$function$;

CREATE OR REPLACE FUNCTION public.const_id_obj_prefix_len()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 3;
$function$;

CREATE FUNCTION public.const_id_org_key_len()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 4;
$function$;

CREATE FUNCTION public.const_id_uid_len()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 8;
$function$;

CREATE FUNCTION public.const_uid_increment()
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 222222222007;
$function$;

-- I had to use this website to find a large prime close to 36^8. This number is only 19 shy of the max!
-- https://www.numberempire.com/primenumbers.php
CREATE FUNCTION public.const_uid_max()
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
AS $function$
    SELECT 2821109907437;
$function$;