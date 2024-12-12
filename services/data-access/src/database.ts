import pg from "pg";
import format from "pg-format";
const { Pool, Client } = pg;
import Settings, { SettingType } from "./settings";
import {
  SelectQueryFormatter,
  InsertQueryFormatter,
  UpdateQueryFormatter,
  DeleteQueryFormatter,
} from "./query_formatter";
import OrganizationSchema from "./org_schema";

export default class DatabaseConnector {
  static #pool;

  public static async select(query: object, orgId: string): Promise<object[]> {
    const orgSchema = await OrganizationSchema.getOrganizationSchema(orgId);
    const sql = new SelectQueryFormatter(query, orgSchema).toSql();
    return await this.query(sql);
  }

  public static async insert(query: object, orgId: string): Promise<object[]> {
    const orgSchema = await OrganizationSchema.getOrganizationSchema(orgId);
    const sql = new InsertQueryFormatter(query, orgSchema).toSql();
    const rows = [];
    for (const q of sql) {
      const res = await this.runSql(q);
      if (res && res["rows"]) rows.push(...res["rows"]);
    }
    return rows;
  }

  public static async update(query: object, orgId: string): Promise<object[]> {
    const orgSchema = await OrganizationSchema.getOrganizationSchema(orgId);
    const sql = new UpdateQueryFormatter(query, orgSchema).toSql();
    const rows = [];
    for (const q of sql) {
      const res = await this.runSql(q);
      if (res && res["rows"]) rows.push(...res["rows"]);
    }
    return rows;
  }

  public static async delete(query: object, orgId: string): Promise<object[]> {
    const orgSchema = await OrganizationSchema.getOrganizationSchema(orgId);
    const sql = new DeleteQueryFormatter(query, orgSchema).toSql();
    const rows = [];
    for (const q of sql) {
      const res = await this.runSql(q);
      if (res && res["rows"]) rows.push(...res["rows"]);
    }
    return rows;
  }

  // query() is a wrapper function that runs the specified query and returns only the records (as opposed to the rest of the metadata from the db)
  public static async query(sql: string, args = undefined) {
    const res = await this.runSql(sql, args);
    const rows = res["rows"];
    if (!rows) throw new Error('Query result does not have a "rows" element');
    this.logQueryResult(rows);
    return rows;
  }

  public static async runSql(sql: string, args = undefined) {
    try {
      await this.connect();

      console.log("About to execute query: " + sql);
      let res;
      if (args) {
        res = await this.#pool.query(
          sql,
          args instanceof Array ? args : [args]
        );
      } else {
        res = await this.#pool.query(sql);
      }
      if (!res) {
        console.log(`Query did not return any results: ${JSON.stringify(res)}`);
      }
      return res;
    } catch (err) {
      if (err instanceof Error) {
        console.log(
          `Caught error querying database: ${err.message}\n${err.stack}`
        );
      } else {
        console.log(`Caught error querying database: ${err}`);
      }
    }
    return undefined;
  }

  public static async startTransaction(): Promise<void> {
    throw new Error("Not implemented");
  }

  public static async commitTransaction(): Promise<void> {
    throw new Error("Not implemented");
  }

  public static async rollbackTransaction(): Promise<void> {
    throw new Error("Not implemented");
  }

  private static async connect(): Promise<void> {
    if (this.#pool) return;

    console.log(
      "No connection pool exists, creating one before executing query"
    );

    try {
      let dbCreds: object = await Settings.getObjectValue(
        SettingType.DatabaseCredentials
      );

      this.validateDatabaseCredentials(dbCreds);

      this.#pool = await new Pool({
        user: dbCreds["username"],
        password: dbCreds["password"],
        host: dbCreds["host"],
        port: dbCreds["port"],
        database: dbCreds["database_name"],
        ssl: {
          rejectUnauthorized: false,
          ca: dbCreds["certificate"],
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log(
          `Caught error connecting to database: ${err.message}\n${err.stack}`
        );
      } else {
        console.log(`Caught error connecting to database: ${err}`);
      }
    }
  }

  private static validateDatabaseCredentials(dbCreds: object) {
    const DB_CRED_FIELDS = Object.freeze([
      "host",
      "port",
      "database_name",
      "username",
      "password",
      "certificate",
    ]);

    // Check that there are no unexpected keys in the credentials we received
    Object.keys(dbCreds).forEach((key) => {
      if (!DB_CRED_FIELDS.includes(key))
        throw new Error(`Unrecognized database credential field: "${key}"`);
    });

    // Check that there are no we received all expected keys and that they all the keys have values
    DB_CRED_FIELDS.forEach((fld) => {
      if (!(fld in dbCreds) || !dbCreds[fld])
        throw new Error(`Database credentials must contain a "${fld}" value`);
    });
  }

  private static logQueryResult(rows: object[]): void {
    const MAX_ROWS = 5;
    if (rows.length > MAX_ROWS) {
      console.log(
        `Query returned ${rows.length} rows: ${JSON.stringify(
          rows.slice(0, MAX_ROWS)
        )} [+ ${rows.length - MAX_ROWS} more]`
      );
    } else {
      console.log(
        `Query returned ${rows.length} rows: ${JSON.stringify(rows)}`
      );
    }
  }
}
