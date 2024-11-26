import Database from "database-connector";
import { Test } from "testing";

export default class TestInsertExistingObjectFields {
  static async testOrganizationFields() {
    let res1 = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='organizations'`
    );
    let res2 = await Database.query(
      `SELECT of.name, of.type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='organizations'`
    );
    Test.assertEquals(6, res1.length);
    Test.assertEquals(6, res2.length);
    const fieldNames = res2.reduce((map, val) => {
      map[val.name] = val.type;
      return map;
    }, {});
    // Just test the most important fields
    Test.assert("id" in fieldNames);
    Test.assertEquals("text", fieldNames.id);
    Test.assert("name" in fieldNames);
    Test.assertEquals("text", fieldNames.name);
    Test.assert("id_key" in fieldNames);
    Test.assertEquals("text", fieldNames.id_key);
    Test.assert("table_schema" in fieldNames);
    Test.assertEquals("text", fieldNames.table_schema);
  }

  static async testUserFields() {
    let res1 = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='users'`
    );
    let res2 = await Database.query(
      `SELECT of.name, of.type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='users'`
    );
    Test.assertEquals(9, res1.length);
    Test.assertEquals(9, res2.length);
    const fieldNames = res2.reduce((map, val) => {
      map[val.name] = val.type;
      return map;
    }, {});
    // Just test the most important fields
    Test.assert("id" in fieldNames);
    Test.assertEquals("text", fieldNames.id);
    Test.assert("username" in fieldNames);
    Test.assertEquals("text", fieldNames.username);
    Test.assert("email" in fieldNames);
    Test.assertEquals("text", fieldNames.email);
    Test.assert("organization_id" in fieldNames);
    Test.assertEquals("text", fieldNames.organization_id);
  }

  static async testObjectFields() {
    let res1 = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='objects'`
    );
    let res2 = await Database.query(
      `SELECT of.name, of.type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='objects'`
    );
    Test.assertEquals(15, res1.length);
    Test.assertEquals(15, res2.length);
    const fieldNames = res2.reduce((map, val) => {
      map[val.name] = val.type;
      return map;
    }, {});
    // Just test the most important fields
    Test.assert("id" in fieldNames);
    Test.assertEquals("text", fieldNames.id);
    Test.assert("organization_id" in fieldNames);
    Test.assertEquals("text", fieldNames.organization_id);
    Test.assert("name" in fieldNames);
    Test.assertEquals("text", fieldNames.name);
    Test.assert("label" in fieldNames);
    Test.assertEquals("text", fieldNames.label);
    Test.assert("label_plural" in fieldNames);
    Test.assertEquals("text", fieldNames.label_plural);
    Test.assert("table_schema" in fieldNames);
    Test.assertEquals("text", fieldNames.table_schema);
    Test.assert("table_name" in fieldNames);
    Test.assertEquals("text", fieldNames.table_name);
    Test.assert("is_admin" in fieldNames);
    Test.assertEquals("boolean", fieldNames.is_admin);
    Test.assert("prefix" in fieldNames);
    Test.assertEquals("text", fieldNames.prefix);
  }

  static async testObjectFieldsFields() {
    let res1 = await Database.query(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='object_fields'`
    );
    let res2 = await Database.query(
      `SELECT of.name, of.type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='object_fields'`
    );
    Test.assertEquals(15, res1.length);
    Test.assertEquals(15, res2.length);
    Test.assertEquals(res1.length, res2.length);
    const fieldNames = res2.reduce((map, val) => {
      map[val.name] = val.type;
      return map;
    }, {});
    // Just test the most important fields
    Test.assert("id" in fieldNames);
    Test.assertEquals("text", fieldNames.id);
    Test.assert("object_id" in fieldNames);
    Test.assertEquals("text", fieldNames.object_id);
    Test.assert("name" in fieldNames);
    Test.assertEquals("text", fieldNames.name);
    Test.assert("label" in fieldNames);
    Test.assertEquals("text", fieldNames.label);
    Test.assert("type" in fieldNames);
    Test.assertEquals("text", fieldNames.type);
    Test.assert("not_null" in fieldNames);
    Test.assertEquals("boolean", fieldNames.not_null);
    Test.assert("default_value" in fieldNames);
    Test.assertEquals("text", fieldNames.default_value);
    Test.assert("reference_field_id" in fieldNames);
    Test.assertEquals("text", fieldNames.default_value);
    Test.assert("reference_object_id" in fieldNames);
    Test.assertEquals("text", fieldNames.default_value);
  }
}
