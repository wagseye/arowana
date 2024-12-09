import Database from "database-connector";
import { Test } from "testing";

export default class TestAddIdTriggers {
  static async testProperIdsForDefaultRecords() {
    let res = await Database.runSql(
      `SELECT id FROM organizations WHERE name='admin'`
    );
    Test.assertEquals(1, res.length);
    let id = res[0].id;
    Test.assert(id.startsWith("001"));
    Test.assert(
      id.match(/^[0-9a-z]{15}$/),
      "Organization id has the wrong format"
    );

    res = await Database.runSql(`SELECT id FROM users WHERE username='admin'`);
    Test.assertEquals(1, res.length);
    id = res[0].id;
    Test.assert(id.startsWith("002"));
    Test.assert(id.match(/^[0-9a-z]{15}$/), "User id has the wrong format");

    res = await Database.runSql(
      `SELECT id FROM objects WHERE table_schema='public' AND table_name='objects'`
    );
    Test.assertEquals(1, res.length);
    id = res[0].id;
    Test.assert(id.startsWith("015"));
    Test.assert(id.match(/^[0-9a-z]{15}$/), "Object id has the wrong format");
  }

  static async testIdsGeneratedForNewRecords() {
    const test_name = `my_test_${Date.now().toString()}`;
    let res = await Database.runSql(
      `INSERT INTO organizations (name, table_schema, id_key) VALUES('${test_name}', '${test_name}', 'zzzz')`
    );
    res = await Database.runSql(
      `SELECT id FROM organizations WHERE name='${test_name}'`
    );
    Test.assertEquals(1, res.length);
    let org_id = res[0].id;
    Test.assert(org_id.startsWith("001"));
    Test.assert(
      org_id.match(/^[0-9a-z]{15}$/),
      "Organization id has the wrong format"
    );

    res = await Database.runSql(
      `INSERT INTO users (organization_id, username) VALUES('${org_id}', '${test_name}')`
    );
    res = await Database.runSql(
      `SELECT id FROM users WHERE username='${test_name}'`
    );
    Test.assertEquals(1, res.length);
    let user_id = res[0].id;
    Test.assert(user_id.startsWith("002"));
    Test.assert(
      user_id.match(/^[0-9a-z]{15}$/),
      "User id has the wrong format"
    );

    res = await Database.runSql(
      `INSERT INTO objects (organization_id, name, table_schema, table_name, label, label_plural) VALUES
      ('${org_id}', '${test_name}', '${test_name}', '${test_name}', '-', '-')`
    );
    res = await Database.runSql(
      `SELECT id FROM objects WHERE table_schema='${test_name}' AND table_name='${test_name}'`
    );
    Test.assertEquals(1, res.length);
    let obj_id = res[0].id;
    Test.assert(obj_id.startsWith("015"));
    Test.assert(
      obj_id.match(/^[0-9a-z]{15}$/),
      "Object id has the wrong format"
    );
  }

  static async testPopulateObjectPrefix() {
    // Create a test organization, which will automatically generate the object_sequence for object prefixes
    const test_name = `my_test_${Date.now().toString()}`;
    await Database.runSql(
      `INSERT INTO organizations (name) VALUES
      ('${test_name}')`
    );
    let res = await Database.runSql(
      `SELECT id, table_schema FROM organizations WHERE name='${test_name}'`
    );
    Test.assertEquals(1, res.length);
    const org_id = res[0].id;
    const org_schema = res[0].table_schema;

    await Database.runSql(
      `INSERT INTO objects (organization_id, name, table_schema, table_name, label, label_plural) VALUES
      ('${org_id}', '${test_name}', '${org_schema}', '${test_name}', '-', '-')`
    );
    res = await Database.runSql(
      `SELECT prefix FROM objects WHERE organization_id='${org_id}' AND table_name='${test_name}'`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquals("a00", res[0].prefix); // Custom objects should always start with a prefix of "a00"

    await Database.runSql(
      `INSERT INTO objects (organization_id, name, table_schema, table_name, label, label_plural) VALUES
      ('${org_id}', '${test_name}_2', '${org_schema}', '${test_name}_2', '-', '-')`
    );
    res = await Database.runSql(
      `SELECT prefix FROM objects WHERE organization_id='${org_id}' AND table_name='${test_name}_2'`
    );
    Test.assertEquals(1, res.length);
    Test.assertEquals("a01", res[0].prefix);
  }
}
