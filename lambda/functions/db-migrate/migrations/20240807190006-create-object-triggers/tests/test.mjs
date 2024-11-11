import Database from "database-connector";
import { Test } from "testing";

export default class TestObjectSequenceTriggers {
  static async testObjSequenceForNewOrgs() {
    let res = await Database.query(
      `SELECT count(*) as count FROM object_sequences`
    );
    const existingSeqs = parseInt(res[0].count);

    await Database.query(
      `INSERT INTO organizations (id, name, id_key, table_schema) VALUES
      ('org2', 'org2', 'zzzy', '0002'),
      ('org3', 'org3', 'zzzz', '0003')`
    );

    res = await Database.query(
      `SELECT count(*) as count FROM object_sequences`
    );
    Test.assertEquals(existingSeqs + 2, parseInt(res[0].count));

    res =
      await Database.query(`SELECT organization_key, object_prefix, start, next, increment, max 
      FROM object_sequences WHERE organization_key='zzzy'`);
    Test.assertEquals(1, res.length);
    Test.assertIsUnset(res[0].objectPrefix);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");

    res =
      await Database.query(`SELECT organization_key, object_prefix, start, next, increment, max 
      FROM object_sequences WHERE organization_key='zzzz'`);
    Test.assertEquals(1, res.length);
    Test.assertIsUnset(res[0].objectPrefix);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");
  }

  static async testObjSequenceForNewObjects() {
    let res = await Database.query(
      `SELECT count(*) as count FROM object_sequences`
    );
    const existingSeqs = parseInt(res[0].count);

    res = await Database.query(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const org_id = res[0].id;
    const org_key = res[0].id_key;

    await Database.query(
      `INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
      ('id1', '${org_id}', 'obj1', '-', '-', 'public', 'object1', 'a00'),
      ('id2', '${org_id}', 'obj2', '-', '-', 'public', 'object2', 'a11')`
    );

    res = await Database.query(
      `SELECT count(*) as count FROM object_sequences`
    );
    Test.assertEquals(existingSeqs + 2, parseInt(res[0].count));

    res =
      await Database.query(`SELECT organization_key, object_prefix, start, next, increment, max 
      FROM object_sequences WHERE organization_key='${org_key}' and object_prefix='a00'`);
    Test.assertEquals(1, res.length);
    Test.assertIsUnset(res[0].objectPrefix);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");

    res =
      await Database.query(`SELECT organization_key, object_prefix, start, next, increment, max 
      FROM object_sequences WHERE organization_key='${org_key}' and object_prefix='a11'`);
    Test.assertEquals(1, res.length);
    Test.assertIsUnset(res[0].objectPrefix);
    Test.assertIsSet(res[0].start, "Start value is not set");
    Test.assertIsSet(res[0].next, "Next value is not set");
    Test.assertIsSet(res[0].increment, "Increment value is not set");
    Test.assertIsSet(res[0].max, "Max value is not set");
  }

  static async testGenerateNewRecordId() {
    let res = await Database.query(
      "SELECT id, id_key FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, res.length); // sanity check
    const org_id = res[0].id;
    const org_key = res[0].id_key;

    // Insert two object records. Note that this will automatically generate object_sequence records as well
    await Database.query(`INSERT INTO objects (id, organization_id, name, label, label_plural, table_schema, table_name, prefix) VALUES
    ('id1', '${org_id}', 'obj1', '-', '-', 'public', 'object1', '999'),
    ('id2', '${org_id}', 'obj2', '-', '-', 'public', 'object2', 'zzz')`);

    // Update the object_sequence records with our own values for testing
    await Database.query(
      `UPDATE object_sequences SET start=1, next=1, increment=1000, max=1000000 WHERE organization_key='${org_key}' AND object_prefix='999'`
    );
    await Database.query(
      `UPDATE object_sequences SET start=1, next=1000, increment=2222222033, max=78364164096 WHERE organization_key='${org_key}' AND object_prefix='zzz'`
    );

    // Run 2 tests on object1 to ensure "next" and "increment" are being updated correctly
    res = await Database.query(
      `SELECT generate_new_record_id('public', 'object1') AS result`
    );
    Test.assertEquals("999" + "1" + org_key + "0000001", res[0].result);
    // Check the state of the object_sequence record after the first call
    res = await Database.query(
      `SELECT start, next, increment, max FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix='999'`
    );
    Test.assertEquals(1, res.length); // sanity check
    Test.assertEquals(1, parseInt(res[0].start)); // unchanged
    Test.assertEquals(1001, parseInt(res[0].next));
    Test.assertEquals(1000, parseInt(res[0].increment)); // unchanged
    Test.assertEquals(1000000, parseInt(res[0].max)); // unchanged
    res = await Database.query(
      `SELECT generate_new_record_id('public', 'object1') AS result`
    );
    Test.assertEquals("999" + "1" + org_key + "00000rt", res[0].result);

    // Run 2 tests on object2 to ensure "next" and "increment" are being updated correctly
    res = await Database.query(
      `SELECT generate_new_record_id('public', 'object2') AS result`
    );
    Test.assertEquals("zzz" + "1" + org_key + "00000rs", res[0].result);
    res = await Database.query(
      `SELECT generate_new_record_id('public', 'object2') AS result`
    );
    Test.assertEquals("zzz" + "1" + org_key + "10r1y9l", res[0].result);
    // Check the state after 2 calls this time
    res = await Database.query(
      `SELECT start, next, increment, max FROM object_sequences WHERE organization_key='${org_key}' AND object_prefix='zzz'`
    );
    Test.assertEquals(1, res.length); // sanity check
    Test.assertEquals(1, parseInt(res[0].start)); // unchanged
    Test.assertEquals(4444445066, parseInt(res[0].next));
    Test.assertEquals(2222222033, parseInt(res[0].increment)); // unchanged
    Test.assertEquals(78364164096, parseInt(res[0].max)); // unchanged

    // Finally, test that if we provide arguments for an object that doesn't exist and error will be thrown
    await Test.assertError(async () => {
      await Database.query(
        `SELECT generate_new_record_id('public', 'object3')`
      );
    }, "Function generate_new_record_id did not throw the expected error");
  }
}
