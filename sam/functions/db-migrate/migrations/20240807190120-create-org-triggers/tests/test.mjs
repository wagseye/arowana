import Database from "database-connector";
import { Test } from "testing";

export default class TestOrganizationTriggers {
  static async testPopulateOrgKeyAndSchema() {
    // Get the object_sequence record for new organizations to check its status
    let res =
      await Database.runQuery(`SELECT sequence_number, next, increment FROM object_sequences
        WHERE organization_key IS NULL AND object_prefix IS NULL`);
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(0, res[0].sequence_number);
    Test.assertEquivalent(1000, res[0].next);

    // Insert two organizations to ensure trigger works for multiple records,
    // plus to check for uniqueness
    await Database.runQuery(
      "INSERT INTO organizations (id, name) VALUES\
      ('002', 'org2'),\
      ('003', 'org3')"
    );

    // Ensure the object_sequence record for new organizations has been updated
    res =
      await Database.runQuery(`SELECT sequence_number, next FROM object_sequences
        WHERE organization_key IS NULL AND object_prefix IS NULL`);
    Test.assertEquals(1, res.length);
    Test.assertEquivalent(2, res[0].sequence_number);
    Test.assertEquivalent(1002, res[0].next);

    // Retrieve the current values for the first record
    let org2 = await Database.runQuery(
      "SELECT id, name, id_key, table_schema FROM organizations WHERE id='002'"
    );
    Test.assertEquals(1, org2.length);
    org2 = org2[0];
    Test.assert(!!org2.id_key, "Id key was not set");
    Test.assert(
      /^([a-z0-9]{4})$/.test(org2.id_key),
      `id_key (${org2.id_key}) is the wrong format`
    );
    Test.assertIsSet(org2.table_schema, "Table schema was not set");
    Test.assertEquals(`org_${org2.id_key}`, org2.table_schema);
    res = await Database.runQuery(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name='${org2.table_schema}'`
    );
    Test.assertEquals(1, res.length);

    // Retrieve the current values for the second record
    let org3 = await Database.runQuery(
      "SELECT id, name, id_key, table_schema FROM organizations WHERE id='003'"
    );
    Test.assertEquals(1, org3.length);
    org3 = org3[0];
    Test.assertIsSet(org3.id_key, "Id key was not set");
    Test.assert(
      /^([a-z0-9]{4})$/.test(org3.id_key),
      `id_key (${org3.id_key}) is the wrong format`
    );
    Test.assertIsSet(org3.table_schema, "Table schema was not set");
    Test.assertEquals(`org_${org3.id_key}`, org3.table_schema);
    res = await Database.runQuery(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name='${org3.table_schema}'`
    );
    Test.assertEquals(1, res.length);

    // Ensure the values are unique
    Test.assertNotEquals(org2.id_key, org3.id_key);
    Test.assertNotEquals(org2.table_schema, org3.table_schema);
  }
}
