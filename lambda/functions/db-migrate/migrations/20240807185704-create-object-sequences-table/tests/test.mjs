import Database from "database-connector";
import { Test } from "testing";

export default class TestObjectSequence {
  static async testOrgKeySequence() {
    const rows = await Database.query(
      "SELECT organization_key, object_prefix FROM object_sequences WHERE organization_key IS NULL AND object_prefix IS NULL"
    );
    Test.assertEquals(1, rows.length);
  }
}
