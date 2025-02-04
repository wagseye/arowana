import Database from "database-connector";
import { Test } from "testing";

export default class TestInsertExistingObjectFields {
  static async testOrganizationFields() {
    let res = await Database.runQuery(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='organizations'`
    );
    let res2 = await Database.runQuery(
      `SELECT of.name, of.type, of.sql_type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='organizations'`
    );
    Test.assertEquals(6, res.length);
    Test.assertEquals(res.length, res2.length);

    const fields = res2.reduce((map, val) => {
      map[val.name] = val;
      return map;
    }, {});

    // Just test the most important fields
    Test.assertIsSet(fields["id"]);
    Test.assertEquals("id", fields["id"].type);
    Test.assertEquals("text", fields["id"].sql_type);

    Test.assertIsSet(fields["name"]);
    Test.assertEquals("text", fields["name"].type);
    Test.assertEquals("text", fields["name"].sql_type);

    Test.assertIsSet(fields["id_key"]);
    Test.assertEquals("text", fields["id_key"].type);
    Test.assertEquals("text", fields["id_key"].sql_type);

    Test.assertIsSet(fields["table_schema"]);
    Test.assertEquals("text", fields["table_schema"].type);
    Test.assertEquals("text", fields["table_schema"].sql_type);
  }

  static async testUserFields() {
    let res = await Database.runQuery(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='users'`
    );
    let res2 = await Database.runQuery(
      `SELECT of.name, of.type, of.sql_type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='users'`
    );
    Test.assertEquals(9, res.length);
    Test.assertEquals(res.length, res2.length);

    const fields = res2.reduce((map, val) => {
      map[val.name] = val;
      return map;
    }, {});

    // Just test the most important fields
    Test.assertIsSet(fields["id"]);
    Test.assertEquals("id", fields["id"].type);
    Test.assertEquals("text", fields["id"].sql_type);

    Test.assertIsSet(fields["username"]);
    Test.assertEquals("text", fields["username"].type);
    Test.assertEquals("text", fields["username"].sql_type);

    Test.assertIsSet(fields["email"]);
    Test.assertEquals("text", fields["email"].type);
    Test.assertEquals("text", fields["email"].sql_type);

    Test.assertIsSet(fields["organization_id"]);
    Test.assertEquals("reference", fields["organization_id"].type);
    Test.assertEquals("text", fields["organization_id"].sql_type);
  }

  static async testObjectFields() {
    let res = await Database.runQuery(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='objects'`
    );
    let res2 = await Database.runQuery(
      `SELECT of.name, of.type, of.sql_type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='objects'`
    );
    Test.assertEquals(16, res.length);
    Test.assertEquals(res.length, res2.length);

    const fields = res2.reduce((map, val) => {
      map[val.name] = val;
      return map;
    }, {});

    // Just test the most important fields
    Test.assertIsSet(fields["id"]);
    Test.assertEquals("id", fields["id"].type);
    Test.assertEquals("text", fields["id"].sql_type);

    Test.assertIsSet(fields["organization_id"]);
    Test.assertEquals("reference", fields["organization_id"].type);
    Test.assertEquals("text", fields["organization_id"].sql_type);

    Test.assertIsSet(fields["name"]);
    Test.assertEquals("text", fields["name"].type);
    Test.assertEquals("text", fields["name"].sql_type);

    Test.assertIsSet(fields["label"]);
    Test.assertEquals("text", fields["label"].type);
    Test.assertEquals("text", fields["label"].sql_type);

    Test.assertIsSet(fields["label_plural"]);
    Test.assertEquals("text", fields["label_plural"].type);
    Test.assertEquals("text", fields["label_plural"].sql_type);

    Test.assertIsSet(fields["table_schema"]);
    Test.assertEquals("text", fields["table_schema"].type);
    Test.assertEquals("text", fields["table_schema"].sql_type);

    Test.assertIsSet(fields["table_name"]);
    Test.assertEquals("text", fields["table_name"].type);
    Test.assertEquals("text", fields["table_name"].sql_type);

    Test.assertIsSet(fields["is_admin"]);
    Test.assertEquals("boolean", fields["is_admin"].type);
    Test.assertEquals("boolean", fields["is_admin"].sql_type);

    Test.assertIsSet(fields["prefix"]);
    Test.assertEquals("text", fields["prefix"].type);
    Test.assertEquals("text", fields["prefix"].sql_type);
  }

  static async testObjectFieldsFields() {
    let res = await Database.runQuery(
      `SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='object_fields'`
    );
    let res2 = await Database.runQuery(
      `SELECT of.name, of.type, of.sql_type FROM object_fields of
      INNER JOIN objects o ON of.object_id=o.id
      AND o.table_schema='public' AND o.table_name='object_fields'`
    );
    Test.assertEquals(18, res.length);
    Test.assertEquals(res.length, res2.length);

    const fields = res2.reduce((map, val) => {
      map[val.name] = val;
      return map;
    }, {});

    // Just test the most important fields
    Test.assertIsSet(fields["id"]);
    Test.assertEquals("id", fields["id"].type);
    Test.assertEquals("text", fields["id"].sql_type);

    Test.assertIsSet(fields["object_id"]);
    Test.assertEquals("reference", fields["object_id"].type);
    Test.assertEquals("text", fields["object_id"].sql_type);

    Test.assertIsSet(fields["name"]);
    Test.assertEquals("text", fields["name"].type);
    Test.assertEquals("text", fields["name"].sql_type);

    Test.assertIsSet(fields["label"]);
    Test.assertEquals("text", fields["label"].type);
    Test.assertEquals("text", fields["label"].sql_type);

    Test.assertIsSet(fields["type"]);
    Test.assertEquals("text", fields["type"].type);
    Test.assertEquals("text", fields["type"].sql_type);

    Test.assertIsSet(fields["sql_type"]);
    Test.assertEquals("text", fields["sql_type"].type);
    Test.assertEquals("text", fields["sql_type"].sql_type);

    Test.assertIsSet(fields["not_null"]);
    Test.assertEquals("boolean", fields["not_null"].type);
    Test.assertEquals("boolean", fields["not_null"].sql_type);

    Test.assertIsSet(fields["default_value"]);
    Test.assertEquals("text", fields["default_value"].type);
    Test.assertEquals("text", fields["default_value"].sql_type);
  }
}
