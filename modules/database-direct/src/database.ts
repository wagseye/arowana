import pkg from "pg";
const { Client } = pkg;

import Transaction, { BasicTransaction } from "./transaction.js";
import {
  SelectQueryFormatter,
  InsertQueryFormatter,
  UpdateQueryFormatter,
  DeleteQueryFormatter,
} from "./query_formatter.js";

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
export class DatabaseConfig {
  public organizationId: string;
}

export default class DatabaseConnector {
  static #connection;
  static #createdConnection: boolean = false;
  static #transactionType: any = BasicTransaction;
  static #transaction: Transaction;
  static #orgId;
  static #namespace;

  public async init(config: DatabaseConfig): Promise<void> {
    if (!config || !(config instanceof DatabaseConfig))
      throw new Error("Invalid configuration object");
    if (!config.organizationId) throw new Error("");
    if (DatabaseConnector.#orgId !== config.organizationId) {
      let res = await DatabaseConnector.runQuery(
        "SELECT table_schema FROM organizations WHERE id=%",
        config.organizationId
      );
      if (res.length == 0)
        throw new Error(
          `Did not find organization with id="${config.organizationId}"`
        );
      if (res.length != 1)
        throw new Error(
          `Found ${res.length} organizations with id="${config.organizationId}"`
        );
      DatabaseConnector.#orgId = config.organizationId;
      DatabaseConnector.#namespace = res["rows"][0]["table_schema"];
    }
  }

  public static set connection(value: any) {
    console.log("Setting database connection manually");
    if (this.#connection && this.#createdConnection) {
      console.log("Found existing connection, ending it");
      this.#connection.end();
    }
    this.#connection = value;
    this.#createdConnection = false;
  }

  public static set transactionType(value: any) {
    if (this.#transaction && this.#transaction.isOpen())
      throw new Error(
        "Transaction type can not be set when there is already an open transaction"
      );
    if (this.#transactionType !== value) {
      console.log(`Setting transaction type to ${value.name}`);
      this.#transaction = undefined;
      this.#transactionType = value;
    }
  }

  public static async query(q: object): Promise<object[]> {
    let sqls;
    switch (q["type"]) {
      case "select":
        sqls = new SelectQueryFormatter(q, this.#namespace).toSql();
        break;
      case "insert":
        sqls = new InsertQueryFormatter(q, this.#namespace).toSql();
        break;
      case "update":
        sqls = new UpdateQueryFormatter(q, this.#namespace).toSql();
        break;
      case "delete":
        sqls = new DeleteQueryFormatter(q, this.#namespace).toSql();
        break;
      default:
        throw new Error(`Invalid query type: "${q["type"]}"`);
    }
    if (!(sqls instanceof Array)) sqls = [sqls];
    let objs = [];
    for (const sql of sqls) {
      const res = await this.runQuery(sql);
      objs.push(...res);
    }
    return objs;
  }

  // runQuery() is a wrapper function that runs the specified query and returns only the records (as opposed to the rest of the metadata from the db)
  public static async runQuery(
    sql: string,
    args = undefined
  ): Promise<object[]> {
    const res = await this.runSql(sql, args);
    const rows = res["rows"];
    if (!rows) throw new Error('Query result does not have a "rows" element');
    this.logQueryResult(rows);
    return rows;
  }

  public static async runSql(
    sql: string,
    args = undefined
  ): Promise<object | undefined> {
    await this.connect();

    console.log("About to execute query: " + sql);
    let res;
    if (args) {
      res = await this.#connection.query(
        sql,
        args instanceof Array ? args : [args]
      );
    } else {
      res = await this.#connection.query(sql);
    }
    if (!res) {
      console.log(`Query did not return any results: ${JSON.stringify(res)}`);
    }
    return res;
  }

  public static async startTransaction(): Promise<void> {
    await this.transaction?.start();
  }

  public static async commitTransaction(): Promise<void> {
    await this.transaction?.commit();
  }

  public static async rollbackTransaction(): Promise<void> {
    await this.transaction?.rollback();
  }

  private static get transaction(): Transaction | undefined {
    if (!this.#transaction) {
      if (!this.#transactionType)
        throw new Error(
          "Transactions have been disabled for this database connection"
        );
      this.#transaction = new this.#transactionType();
    }
    return this.#transaction;
  }
  private static async connect() {
    if (!this.#connection) {
      const dbSecretName = process.env.DB_SECRET_NAME;
      if (!dbSecretName)
        throw new Error(
          "Unable to retrieve the name of the database credentials"
        );
      let secret: { [key: string]: string } = await getSecretValue(
        dbSecretName
      );

      if (!("host" in secret) || !secret["host"])
        throw new Error('Database credentials must contain a "host" value');
      if (!("port" in secret) || !secret["port"])
        throw new Error('Database credentials must contain a "port" value');
      if (!("database_name" in secret) || !secret["database_name"])
        throw new Error(
          'Database credentials must contain a "database_name" value'
        );
      if (!("username" in secret) || !secret["username"])
        throw new Error('Database credentials must contain a "username" value');
      if (!("password" in secret) || !secret["password"])
        throw new Error('Database credentials must contain a "password" value');
      if (!("certificate" in secret) || !secret["certificate"])
        throw new Error(
          'Database credentials must contain a "certificate" value'
        );

      const pgClient = new Client({
        host: getDatabaseCredential("host", secret),
        port: parseInt(getDatabaseCredential("port", secret)),
        database: getDatabaseCredential("database_name", secret),
        user: getDatabaseCredential("username", secret),
        password: getDatabaseCredential("password", secret),
        ssl: {
          rejectUnauthorized: false,
          ca: getDatabaseCredential("certificate", secret),
        },
      });
      try {
        await pgClient.connect();
        this.#connection = pgClient;
        this.#createdConnection = true;
        console.info("Succesfully connected to database");
      } catch (err) {
        console.error(`Error connecting to database: ${err.message}`);
      }
    }
  }

  private static logQueryResult(rows: object[]): void {
    const MAX_ROWS = 5;
    // This has been commented out until we come up with a better logging situation
    // if (rows.length > MAX_ROWS) {
    //   console.log(
    //     `Query returned ${rows.length} rows: ${JSON.stringify(
    //       rows.slice(0, MAX_ROWS)
    //     )} [+ ${rows.length - MAX_ROWS} more]`
    //   );
    // } else {
    //   console.log(
    //     `Query returned ${rows.length} rows: ${JSON.stringify(rows)}`
    //   );
    // }
  }
}

function getDatabaseCredential(
  fieldName: string,
  secret: { [key: string]: string }
): string {
  if (
    ![
      "username",
      "host",
      "port",
      "database_name",
      "password",
      "certificate",
    ].includes(fieldName)
  ) {
    throw new Error(`Unrecognized database credential field: "${fieldName}"`);
  }
  const ENV_VAR_NAME = `DB_SECRET_${fieldName.toUpperCase()}`;
  let value;
  if (process.env.hasOwnProperty(ENV_VAR_NAME)) {
    value = process.env[ENV_VAR_NAME];
    console.log(
      `DbConnect: found local value for database credential field "${fieldName}"`
    );
  }
  if (!value) {
    value = secret[fieldName];
  }
  if (!value) {
    throw new Error(
      `Value for database credential field "${fieldName}" must be set`
    );
  }
  return value;
}

async function getSecretValue(
  secretName: string
): Promise<{ [key: string]: string }> {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );
  return JSON.parse(response.SecretString);
}
