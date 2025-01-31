import Database from "database-connector";
import { Test } from "testing";

export default class TestObjectSequenceTriggers {
  static async testObjSequenceForNewOrgs() {
    let res = await Database.runQuery(
      `SELECT count(*) as count FROM object_sequences`
    );
    const existingSeqs = parseInt(res[0].count);

    await Database.runQuery(
      `INSERT INTO organizations (id, name, id_key, table_schema) VALUES
      ('org2', 'org2', 'zzzy', '0002'),
      ('org3', 'org3', 'zzzz', '0003')`
    );

    res = await Database.runQuery(
      `SELECT count(*) as count FROM object_sequences`
    );
    Test.assertEquivalent(existingSeqs + 2, res[0].count);

    res =
      await Database.runQuery(`SELECT organization_key, object_prefix, start, next, increment, max 
      FROM object_sequences WHERE organization_key='zzzy'`);
    Test.assertEquals(1, res.length);
    Test.assertIsUnset(res[0].objectPrefix);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");

    res =
      await Database.runQuery(`SELECT organization_key, object_prefix, start, next, increment, max 
      FROM object_sequences WHERE organization_key='zzzz'`);
    Test.assertEquals(1, res.length);
    Test.assertIsUnset(res[0].objectPrefix);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");
  }

  static async testObjSequenceForNewObjects() {
    const org_id = "org1";
    const org_key = "zzzy";
    const org_schema = "0001";
    await Database.runQuery(
      `INSERT INTO organizations (id, name, id_key, table_schema) VALUES ('${org_id}', 'org1', '${org_key}', '${org_schema}')`
    );

    let res = await Database.runQuery(
      `SELECT sequence_number, next FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix IS NULL`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(0, res[0].sequence_number);
    Test.assertEquivalent(12960, res[0].next);

    res = await Database.runQuery(
      `SELECT count(*) as count FROM object_sequences`
    );
    const existingSeqs = parseInt(res[0].count);

    await Database.runQuery(
      `INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name) VALUES
      ('id1', '${org_id}', 'obj1', '-', '-', '${org_schema}', 'object1'),
      ('id2', '${org_id}', 'obj2', '-', '-', '${org_schema}', 'object2')`
    );

    res = await Database.runQuery(
      `SELECT sequence_number, next FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix IS NULL`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(2, res[0].sequence_number);
    Test.assertEquivalent(12962, res[0].next);

    res = await Database.runQuery(
      `SELECT count(*) as count FROM object_sequences`
    );
    Test.assertEquivalent(existingSeqs + 2, res[0].count);

    res =
      await Database.runQuery(`SELECT organization_key, object_prefix, sequence_number, start, next, increment, max 
      FROM object_sequences WHERE organization_key='${org_key}' and object_prefix='a00'`);
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(0, res[0].sequence_number);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");

    res =
      await Database.runQuery(`SELECT organization_key, object_prefix, sequence_number, start, next, increment, max 
      FROM object_sequences WHERE organization_key='${org_key}' and object_prefix='a01'`);
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(0, res[0].sequence_number);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");

    // Make sure that if we specify the prefix, our object_sequence does not get updated
    await Database.runQuery(
      `INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
      ('id3', '${org_id}', 'obj3', '-', '-', '${org_schema}', 'object3', 'zzz')`
    );
    res = await Database.runQuery(
      `SELECT sequence_number, next FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix IS NULL`
    );
    // These should be the same as when we last tested them
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(2, res[0].sequence_number);
    Test.assertEquivalent(12962, res[0].next);
  }

  static async testGenerateNewRecordId() {
    let res = await Database.runQuery(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const org_id = res[0].id;
    const org_key = res[0].id_key;

    // Insert two object records. Note that this will automatically generate object_sequence records as well
    await Database.runQuery(`INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
    ('id1', '${org_id}', 'obj1', '-', '-', 'public', 'object1', '999'),
    ('id2', '${org_id}', 'obj2', '-', '-', 'public', 'object2', 'zzz')`);

    // Update the object_sequence records with our own values for testing
    await Database.runQuery(
      `UPDATE object_sequences SET start=1, next=1, increment=1000, max=1000000 WHERE organization_key='${org_key}' AND object_prefix='999'`
    );
    await Database.runQuery(
      `UPDATE object_sequences SET start=1, next=1000, increment=2222222033, max=2821109907437 WHERE organization_key='${org_key}' AND object_prefix='zzz'`
    );

    // Run 2 tests on object1 to ensure "next" and "increment" are being updated correctly
    res = await Database.runQuery(
      `SELECT generate_new_record_id('public', 'object1') AS result`
    );
    Test.assertEquals("999" + "1" + org_key + "00000001", res[0].result);
    // Check the state of the object_sequence record after the first call
    res = await Database.runQuery(
      `SELECT sequence_number, start, next, increment, max FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix='999'`
    );
    Test.assertEquals(1, res.length); // sanity check
    Test.assertEquivalent(1, res[0].sequence_number);
    Test.assertEquivalent(1, res[0].start); // unchanged
    Test.assertEquivalent(1001, res[0].next);
    Test.assertEquivalent(1000, res[0].increment); // unchanged
    Test.assertEquivalent(1000000, res[0].max); // unchanged
    res = await Database.runQuery(
      `SELECT generate_new_record_id('public', 'object1') AS result`
    );
    Test.assertEquals("999" + "1" + org_key + "000000rt", res[0].result);

    // Run 2 tests on object2 to ensure "next" and "increment" are being updated correctly
    res = await Database.runQuery(
      `SELECT generate_new_record_id('public', 'object2') AS result`
    );
    Test.assertEquals("zzz" + "1" + org_key + "000000rs", res[0].result);
    res = await Database.runQuery(
      `SELECT generate_new_record_id('public', 'object2') AS result`
    );
    Test.assertEquals("zzz" + "1" + org_key + "010r1y9l", res[0].result);
    // Check the state after 2 calls this time
    res = await Database.runQuery(
      `SELECT sequence_number, start, next, increment, max FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix='zzz'`
    );
    Test.assertEquals(1, res.length); // sanity check
    Test.assertEquivalent(2, res[0].sequence_number);
    Test.assertEquivalent(1, res[0].start); // unchanged
    Test.assertEquivalent(4444445066, res[0].next);
    Test.assertEquivalent(2222222033, res[0].increment); // unchanged
    Test.assertEquivalent(2821109907437, res[0].max); // unchanged

    // Finally, test that if we provide arguments for an object that doesn't exist and error will be thrown
    await Test.assertError(async () => {
      await Database.runQuery(
        `SELECT generate_new_record_id('public', 'object3')`
      );
    }, "Function generate_new_record_id did not throw the expected error");
  }

  static async testTableName() {
    let res = await Database.runQuery(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const org_id = res[0].id;

    // If we don't specify a table_name it should use LOWER(label_plural)
    const objs =
      await Database.runQuery(`INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, prefix) VALUES
    ('id2', '${org_id}', 'obj2', '-', 'MyTestObjects', 'public', 'zzz') RETURNING table_name`);
    Test.assertEquals(1, objs.length);
    Test.assertEquals("mytestobjects", objs[0].table_name);

    // Specifying a non-lowercase table name should throw an error
    // This will spoil our transaction so this statement should be performed last
    Test.assertError(async () => {
      await Database.runQuery(`INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
        ('test_id', '${org_id}', 'obj2', '-', '-', 'public', 'MyTestObject', 'zzz')`);
    });
  }
}
