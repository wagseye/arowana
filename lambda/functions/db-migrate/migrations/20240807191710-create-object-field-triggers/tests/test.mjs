import Database from "database-connector";
import { Test } from "testing";

export default class TestCreateObjectFieldTriggers {
  static async testNewTableForNewObjects() {
    let res = await Database.query(
      `SELECT count(*) as count FROM PG_CATALOG.PG_TABLES`
    );
    const existingTables = parseInt(res[0].count);

    res = await Database.query(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const ORG_ID = res[0].id;

    await Database.query(
      `INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
      ('id1', '${ORG_ID}', 'obj1', '-', '-', 'public', 'object1', 'a00'),
      ('id2', '${ORG_ID}', 'obj2', '-', '-', 'public', 'object2', 'a11')`
    );

    res = await Database.query(
      `SELECT id FROM objects where table_schema='public' AND table_name IN ('object1', 'object2')`
    );
    const objIds = res.map((x) => x.id);
    Test.assertEquals(2, objIds.length);

    res = await Database.query(
      `SELECT count(*) as count FROM PG_CATALOG.PG_TABLES`
    );
    Test.assertEquals(existingTables + 2, parseInt(res[0].count));

    res = await Database.query(
      `SELECT count(*) as count FROM PG_CATALOG.PG_TABLES WHERE schemaname='public' AND tablename IN ('object1', 'object2')`
    );
    Test.assertEquals(2, parseInt(res[0].count));

    // Make sure object_fields records were created for ids for the new tables
    res = await Database.query(
      `SELECT name, type FROM object_fields WHERE object_id IN ('${objIds[0]}', '${objIds[1]}')`
    );
    Test.assertEquals(2, res.length);
    Test.assertEquals("id", res[0].name);
    Test.assertEquals("text", res[0].type);
    Test.assertEquals("id", res[1].name);
    Test.assertEquals("text", res[1].type);

    // Make sure id columns were generated on the new tables
    res = await Database.query(
      `SELECT table_name, column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema='public' AND table_name IN ('object1', 'object2') ORDER BY table_name`
    );
    Test.assertEquals(2, res.length);
    Test.assertEquals("object1", res[0].table_name);
    Test.assertEquals("id", res[0].column_name);
    Test.assertEquals("text", res[0].data_type);
    Test.assertEquals("object2", res[1].table_name);
    Test.assertEquals("id", res[1].column_name);
    Test.assertEquals("text", res[1].data_type);

    // Make sure no actual records were created in the new table
    res = await Database.query(`SELECT count(*) as count FROM public.object1`);
    Test.assertEquals(0, parseInt(res[0].count));

    res = await Database.query(`SELECT count(*) as count FROM public.object2`);
    Test.assertEquals(0, parseInt(res[0].count));
  }

  static async testCreateColumnFromObjectFieldRecord() {
    let res = await Database.query(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const ORG_ID = res[0].id;

    res = await Database.query(
      `SELECT table_schema, table_name FROM INFORMATION_SCHEMA.TABLES WHERE table_schema='public' AND table_name='my_test_object'`
    );
    Test.assertEquals(0, res.length);

    res = await Database.query(
      `INSERT INTO objects (organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
      ('${ORG_ID}', 'my_test_object', '-', '-', 'public', 'my_test_object', 'zzz')
      RETURNING id`
    );
    Test.assertEquals(1, res.length);
    const OBJ_ID = res[0].id;

    res = await Database.query(
      `SELECT table_schema, table_name FROM INFORMATION_SCHEMA.TABLES WHERE table_schema='public' AND table_name='my_test_object'`
    );
    Test.assertEquals(1, res.length);

    // Ensure we only have the id field so far
    res = await Database.query(
      `SELECT name, type FROM object_fields WHERE object_id='${OBJ_ID}'`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquals("id", res[0].name);

    // Ensure the table only has 1 column (id)
    res = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema='public' AND table_name='my_test_object'`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquals("id", res[0].column_name);

    await Database.query(
      `INSERT INTO object_fields (object_id, name, label, type) VALUES
      ('${OBJ_ID}', 'num', '-', 'integer')`
    );

    // Check that the column now exists on our test table
    res = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema='public' AND table_name='my_test_object' AND column_name!='id'`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquals("num", res[0].column_name);
    Test.assertEquals("integer", res[0].data_type);
  }

  static async testCreateReferenceColumnFromObjectFieldRecord() {
    let res = await Database.query(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const ORG_ID = res[0].id;

    res = await Database.query(
      `INSERT INTO objects (organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
      ('${ORG_ID}', 'test_object_a', '-', '-', 'public', 'test_object_a', 'zzy'),
      ('${ORG_ID}', 'test_object_b', '-', '-', 'public', 'test_object_b', 'zzz')
       RETURNING id`
    );
    const OBJ_A_ID = res[0].id;
    const OBJ_B_ID = res[1].id;

    res = await Database.query(
      `SELECT id FROM object_fields where object_id='${OBJ_B_ID}'`
    );
    Test.assertEquals(1, res.length);
    const OBJ_B_FLD_ID = res[0].id;

    await Database.query(
      `INSERT INTO object_fields (object_id, name, label, type, reference_object_id, reference_field_id) VALUES
      ('${OBJ_A_ID}', 'ref_to_b', '-', 'reference', '${OBJ_B_ID}', '${OBJ_B_FLD_ID}')`
    );

    // Ensure the reference field was created on object A
    res = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema='public' AND table_name='test_object_a'`
    );
    Test.assertEquals(2, res.length);

    // Ensure the object B doens't have any new fields
    res = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema='public' AND table_name='test_object_b'`
    );
    Test.assertEquals(1, res.length);

    // NB: I wanted to test the foreign key constraint by attempting to insert an invalid record, but this causes the Postgres
    // transaction to enter into a failed state and all subsequent commands fail. Instead I query the constraints table to
    // verify the fk constraint has been created
    res = await Database.query(
      `select pgc.conname as name, pg_get_constraintdef(pgc.oid) as constraint
         from pg_constraint pgc
         join pg_namespace nsp on nsp.oid = pgc.connamespace
         left join information_schema.constraint_column_usage ccu
           on pgc.conname = ccu.constraint_name and nsp.nspname = ccu.constraint_schema
         where ccu.table_schema='public' and ccu.table_name='test_object_a'`
      // `SELECT constraint_name, constraint_type FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE table_schema='public' AND table_name='STUDENT_INFO';`
    );
    Test.assertEquals(1, res.length);

    res = await Database.query(
      `INSERT INTO test_object_b (id) VALUES(NULL) RETURNING id`
    );
    const B_OBJ_ID = res[0].id;
    res = await Database.query(
      `INSERT INTO test_object_a (ref_to_b) VALUES ('${B_OBJ_ID}') returning id`
    );
    const A_OBJ_ID = res[0].id;

    // Finally, do a join to ensure everything seems to be working...
    res = await Database.query(
      `SELECT a.id AS a_id, b.id AS b_id FROM test_object_a a FULL OUTER JOIN test_object_b b ON a.ref_to_b=b.id`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquals(A_OBJ_ID, res[0].a_id);
    Test.assertEquals(B_OBJ_ID, res[0].b_id);
  }

  /********************************************************
   * Since this migration marks the end of the core interdependencies, do some additional tests to ensure
   * everything looks like it's working correctly
   ********************************************************/

  // Make sure we have all of the manually created records that we expect
  static async testExistingRecords() {
    const orgs = await Database.query(
      "SELECT * FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, orgs.length);
    const org = orgs[0];
    Test.assertEquals("0001", org.id_key);
    Test.assertEquals("public", org.table_schema);
    Test.assertIsSet(org.created_at);
    Test.assertIsUnset(org.deleted_at);

    const users = await Database.query(
      `SELECT * FROM users WHERE organization_id='${org.id}' AND username='admin'`
    );
    Test.assertEquals(1, users.length);
    Test.assertIsUnset(users[0].deactivated_at);

    const objs = await Database.query(
      `SELECT * FROM objects WHERE organization_id='${org.id}'`
    );
    Test.assertEquals(4, objs.length);
    const objsByName = objs.reduce((newMap, obj) => {
      newMap[obj.name] = obj;
      return newMap;
    }, {});

    let objObj = objsByName["object"];
    Test.assertIsNotNull(objObj);
    let objPrefix = objObj.prefix;
    Test.assertIsSet(objPrefix);
    Test.assert(objObj.is_admin);

    let fldObj = objsByName["object_field"];
    Test.assertIsNotNull(fldObj);
    let fldPrefix = fldObj.prefix;
    Test.assertIsSet(fldPrefix);
    Test.assert(fldObj.is_admin);

    let orgObj = objsByName["organization"];
    Test.assertIsNotNull(orgObj);
    let orgPrefix = orgObj.prefix;
    Test.assertIsSet(orgPrefix);
    Test.assert(orgObj.is_admin);

    let usrObj = objsByName["user"];
    Test.assertIsNotNull(usrObj);
    let usrPrefix = usrObj.prefix;
    Test.assertIsSet(usrPrefix);
    Test.assert(usrObj.is_admin);

    const seqs = await Database.query(
      `SELECT * FROM object_sequences WHERE organization_key='${org.id_key}'`
    );
    Test.assertEquals(5, seqs.length);
    const seqsByPrefix = seqs.reduce((newMap, seq) => {
      newMap[seq.object_prefix] = seq;
      return newMap;
    }, {});
    let seq = seqsByPrefix[null];
    Test.assertEquivalent(1, seq.increment);
    Test.assertEquivalent(46655, seq.max);

    seq = seqsByPrefix[objPrefix];
    Test.assertEquivalent(2222222033, seq.increment);
    Test.assertEquivalent(78364164096, seq.max);

    seq = seqsByPrefix[fldPrefix];
    Test.assertEquivalent(2222222033, seq.increment);
    Test.assertEquivalent(78364164096, seq.max);

    seq = seqsByPrefix[orgPrefix];
    Test.assertEquivalent(2222222033, seq.increment);
    Test.assertEquivalent(78364164096, seq.max);

    seq = seqsByPrefix[usrPrefix];
    Test.assertEquivalent(2222222033, seq.increment);
    Test.assertEquivalent(78364164096, seq.max);

    const allFlds = await Database.query(
      `SELECT flds.* FROM object_fields flds JOIN objects objs ON flds.object_id=objs.id WHERE objs.organization_id='${org.id}'`
    );
    console.log(`object id: ${objObj.id}`);
    // "objects" fields
    let flds = allFlds.filter((fld) => fld.object_id === objObj.id);
    Test.assert(flds.length >= 15);

    // "object_fields" fields
    flds = allFlds.filter((fld) => fld.object_id === fldObj.id);
    Test.assert(flds.length >= 15);

    // "organizations" fields
    flds = allFlds.filter((fld) => fld.object_id === orgObj.id);
    Test.assert(flds.length >= 6);

    // "users" fields
    flds = allFlds.filter((fld) => fld.object_id === usrObj.id);
    Test.assert(flds.length >= 9);
  }

  // Make sure as we create new records, all of the trigger automation (populating fields, creating related records)
  // is working correctlyu
  static async testNewRecords() {
    let orgs = await Database.query(
      "INSERT INTO organizations (name) VALUES('test_org') RETURNING id, id_key, table_schema"
    );
    Test.assertEquals(1, orgs.length);
    const org = orgs[0];
    Test.assertIsSet(org.id);
    Test.assertIsSet(org.id_key);
    Test.assertIsSet(org.table_schema);

    let seqs = await Database.query(
      `SELECT * FROM object_sequences WHERE organization_key='${org.id_key}'`
    );
    Test.assertEquals(1, seqs.length);
    Test.assertIsUnset(seqs[0].object_prefix);

    let users = await Database.query(
      `INSERT INTO users (username, organization_id) VALUES('test_user', '${org.id}') RETURNING id`
    );
    Test.assertEquals(1, users.length);
    const usr = users[0];
    Test.assertIsSet(usr.id);

    const objs = await Database.query(
      `INSERT INTO objects (organization_id, name, label, label_plural, table_name) VALUES('${org.id}', 'testObj', 'testObj', 'testObjs', 'test_objs') RETURNING id, prefix, table_schema, created_at, deleted_at`
    );
    Test.assertEquals(1, objs.length);
    const obj = objs[0];
    Test.assertIsSet(obj.id);
    Test.assertIsSet(obj.prefix);
    Test.assertIsSet(obj.table_schema);
    Test.assertIsSet(obj.created_at);
    Test.assertIsUnset(obj.deleted_at);

    seqs = await Database.query(
      `SELECT * FROM object_sequences WHERE organization_key='${org.id_key}'`
    );
    Test.assertEquals(2, seqs.length);
    Test.assertIsUnset(seqs[0].object_prefix);
    const seqsByPrefix = seqs.reduce((newMap, seq) => {
      newMap[seq.object_prefix] = seq;
      return newMap;
    }, {});
    Test.assertIsNotNull(seqsByPrefix[null]);
    let seq = seqsByPrefix[obj.prefix];
    Test.assertIsNotNull(seq);

    const flds = await Database.query(
      `SELECT * FROM object_fields WHERE object_id='${obj.id}'`
    );
    Test.assertEquals(1, flds.length);
    const fld = flds[0];
    Test.assertEquals("id", fld.name);

    await Database.query(
      `INSERT INTO object_fields (object_id, name, label, type) VALUES
      ('${obj.id}', 'new_field', '-', 'text')`
    );

    // Note that the table_name is in lower case here. This is required because that is how it is stored in Postgres
    let cols = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_schema='${org.table_schema}' AND table_name='test_objs';`
    );

    Test.assertEquals(2, cols.length);
    const colsByName = cols.reduce((newMap, col) => {
      newMap[col.column_name] = col;
      return newMap;
    }, {});
    Test.assertIsNotNull(colsByName["id"]);
    let col = colsByName["new_field"];
    Test.assertIsNotNull(col);
    Test.assertEquals("text", col.data_type);
  }
}
