//import Migration from "../../../migration.mjs";
import Database from "database-connector";
import { Test } from "testing";

export default class TestMigration {
  static async testBase36Encode() {
    let res = await this.querySingleValue(
      `SELECT public.base36_encode(62784625132)` // Magic number! 62784625132 is "success" in base36
    );
    Test.assertEquals("success", res);
  }
  static async testApiVersionLength() {
    let res = await this.querySingleValue("SELECT const_id_api_version_len()");
    Test.assertEquals(1, parseInt(res));
  }
  static async testApiVersion() {
    let res = await this.querySingleValue("SELECT const_id_api_version()");
    Test.assertEquals(1, parseInt(res));
  }
  static async testObjectPrefixLength() {
    let res = await this.querySingleValue("SELECT const_id_obj_prefix_len()");
    Test.assertEquals(3, parseInt(res));
  }
  static async testOrgKeyLength() {
    let res = await this.querySingleValue("SELECT const_id_org_key_len()");
    Test.assertEquals(4, parseInt(res));
  }
  static async testUidLength() {
    let res = await this.querySingleValue("SELECT const_id_uid_len()");
    Test.assertEquals(7, parseInt(res));
  }
  static async testUidIncrement() {
    let res = await this.querySingleValue("SELECT const_uid_increment()");
    Test.assertEquals(2222222033, parseInt(res));
  }
  static async testUidMax() {
    let res = await this.querySingleValue("SELECT const_uid_max()");
    Test.assertEquals(78364164096, parseInt(res));
  }

  static async querySingleValue(q) {
    const res = await Database.runSql(q);
    if (res && res.length) {
      if (res.length > 1) {
        throw new Error(
          `Query that was expected to return a single value returned ${res.length} rows`
        );
      }
      const propNames = Object.getOwnPropertyNames(res[0]);
      if (!propNames && !propNames.length)
        throw new Error("Record returned from the database has no fields");
      if (propNames.length > 1)
        throw new Error(
          `Query that was expected to return a single value returned ${propNames.length} fields`
        );
      return res[0][propNames[0]];
    }
  }
}
