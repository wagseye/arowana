import pg from "pg";
const { Pool, Client } = pg;
import Settings, { SettingType } from "./settings";
import QueryFormatter from "./query_formatter";

export default class DatabaseConnector {
  static #pool;

  public static async query(q: object): Promise<object[]> {
    const sql = QueryFormatter.toSQL(q);
    return this.runSql(sql);
  }

  public static async runSql(sql: string) {
    try {
      await this.connect();
      console.log("About to execute query: " + sql);
      const res = await this.#pool.query(sql);
      if (res) {
        if (!("rows" in res))
          throw new Error('Query result does not have a "rows" value');
        const rows = res.rows;
        console.log("Query result: " + JSON.stringify(rows));
        return rows;
      } else {
        console.log(`Query did not return any results: ${JSON.stringify(res)}`);
      }
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

    console.log("We need to create a connection pool before executing query");

    try {
      let dbCreds: object = await Settings.getObjectValue(
        SettingType.DatabaseCredentials
      );
      console.log(`Retrieved secret, host=${dbCreds["host"]}`);

      this.validateDatabaseCredentials(dbCreds);

      this.#pool = new Pool({
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
}
