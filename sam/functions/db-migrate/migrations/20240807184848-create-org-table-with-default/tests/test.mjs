import Database from "database-connector";
import { Test } from "testing";

export default class TestOrganizations {
  static async testDefaultOrg() {
    const rows = await Database.runSql(
      "SELECT id, name, id_key, table_schema FROM organizations WHERE name='admin'"
    );
    Test.assertEquals(1, rows.length);
    const rec = rows[0];
    Test.assertEquals("0001", rec.id_key);
    Test.assertEquals("public", rec.table_schema);
  }
}
