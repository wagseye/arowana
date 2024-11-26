DROP TRIGGER populate_object_fields ON objects;
DROP FUNCTION populate_object_fields;

DROP FUNCTION populate_new_record_id CASCADE;
DROP FUNCTION generate_new_record_id;

DROP TRIGGER create_sequence_from_new_object ON objects;
DROP FUNCTION create_sequence_from_new_object;

DROP TRIGGER create_prefix_sequence_for_new_org ON organizations;
DROP FUNCTION create_prefix_sequence_for_new_org;
