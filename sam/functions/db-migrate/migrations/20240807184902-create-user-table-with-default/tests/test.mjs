//import Migration from "../../../migration.mjs";
import Database from "database-connector";
import { Test } from "testing";

export default class TestUsers {
  static async testDefaultUser() {
    const rows = await Database.runQuery(
      "SELECT username, email FROM users WHERE username='admin'"
    );
    Test.assertEquals(1, rows.length);
    const rec = rows[0];
    Test.assertEquals("wagseye@gmail.com", rec.email);
  }
}
