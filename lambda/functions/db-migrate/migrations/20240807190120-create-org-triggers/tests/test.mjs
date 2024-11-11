import Database from "database-connector";
import { Test } from "testing";

export default class TestOrganizationTriggers {
  static async testPopulateOrgKeyAndSchema() {
    // Insert two organizations to ensure trigger works for multiple records,
    // plus to check for uniqueness
    await Database.query(
      "INSERT INTO organizations (id, name) VALUES\
      ('002', 'org2'),\
      ('003', 'org3')"
    );

    // Retrieve the current values for the first record
    let org2 = await Database.query(
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
    let res = await Database.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name='${org2.table_schema}'`
    );
    Test.assertEquals(1, res.length);

    // Retrieve the current values for the second record
    let org3 = await Database.query(
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
    res = await Database.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name='${org3.table_schema}'`
    );
    Test.assertEquals(1, res.length);

    // Ensure the values are unique
    Test.assertNotEquals(org2.id_key, org3.id_key);
    Test.assertNotEquals(org2.table_schema, org3.table_schema);
  }
}
