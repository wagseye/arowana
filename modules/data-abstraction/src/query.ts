"use strict";

import DbObject from "./db_object.js";
import DbObjectField, { FieldType } from "./db_object_field.js";
import Timer from "./timer.js";

export class QueryResult {}

// export class AggregateQueryResult extends QueryResult {}

// export class ObjectQueryResult extends QueryResult {
//   #records: DbObject[] = [];

//   public constructor(proto: Object) {
//     super();
//   }
// }

export class ConditionalExpression {
  public left: string | ConditionalExpression;
  public operator: string;
  public right: FieldType | ConditionalExpression;

  public constructor(
    left: string | ConditionalExpression,
    operator: string,
    right: FieldType | ConditionalExpression
  ) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

export abstract class Query<T extends DbObject> {
  static #database: any;

  #proto: Object;

  constructor(proto: Object) {
    if (!proto) {
      throw new Error(
        "An object prototype must be specified in Query.constructor"
      );
    }

    this.#proto = proto;
  }

  public abstract toJSON();

  protected async queryObjects(): Promise<T[]> {
    const resp: { [index: string]: any } = await Query.execute(this.toJSON());
    if (!("rows" in resp))
      throw 'Database results do not contain a "rows" element';
    const dbRows = resp["rows"];
    if (!Array.isArray(dbRows))
      throw '"Row" element of list is expected to be a list';
    const objs = [];
    for (const row of dbRows) {
      const newObj = (this.#proto as typeof DbObject).newInstance(row);
      objs.push(newObj);
    }
    return objs;
  }

  protected static async execute(q: object): Promise<{ [index: string]: any }> {
    if (!this.#database) {
      await this.loadDatabase();
    }
    const t = new Timer().start();
    const resp: { [index: string]: any }[] = await Query.#database!.query(q);
    if (!resp) throw "Query response is empty";

    return resp;
  }

  private static async loadDatabase() {
    try {
      // The module name is defined separately from the import to avoid tsc compilation errors
      const module_name = "database-connector";
      const t: Timer = new Timer().start();
      const { default: Database } = await import(module_name);
      this.#database = new Database();
    } catch (ex: unknown) {
      if (ex instanceof Error) {
        console.log(`Unable to load database module: ${ex.message}`);
      } else {
        console.log("Unable to load database module");
      }
    }
  }
}

export class SelectQuery<T extends DbObject> extends Query<T> {
  #queryObject: object = {};

  constructor(proto: Object) {
    super(proto);

    this.#queryObject["type"] = "select";
    this.#queryObject["table"] = proto["tableName"]();
    this.#queryObject["fields"] = "*";
  }

  select(
    ...fields: (DbObjectField | string | DbObjectField[] | string[])[]
  ): Query<T> {
    if (fields && fields.length) {
      const fieldNames: string[] = fields.reduce((list: string[], fld) => {
        if (typeof fld === "string") {
          // String should be used as-is
          list.push(fld);
        } else if (fld instanceof DbObjectField) {
          // DbObject fields should be dereferenced to get the name
          list.push(fld.dbName);
        } else if (fld instanceof Array) {
          // Arrays should be interpreted same as above
          fld.forEach((item) => {
            if (typeof item === "string") {
              list.push(item);
            } else if (item instanceof DbObjectField) {
              list.push(item.dbName);
            } else {
              throw new Error(
                "Provided list fields must be strings or instances of DbObjectField"
              );
            }
          });
        } else {
          throw new Error(
            "Provided fields must be strings or instances of DbObjectField"
          );
        }
        return list;
      }, []) as string[]; // [] is the initial accumulator for reduce method, not sure why TS needs the typecast either

      if (this.#queryObject["fields"] === "*") {
        this.#queryObject["fields"] = fieldNames;
      } else {
        this.#queryObject["fields"].push(...fieldNames);
      }
    }
    return this;
  }

  public where(expr: ConditionalExpression): Query<T> {
    if (!("where" in this.#queryObject) || !this.#queryObject["where"]) {
      this.#queryObject["where"] = expr;
    } else {
      const andExpr = new ConditionalExpression(
        this.#queryObject["where"] as ConditionalExpression,
        "AND",
        expr
      );
      this.#queryObject["where"] = andExpr;
    }
    return this;
  }

  sort(...fields: string[] | DbObjectField[]): Query<T> {
    this.#queryObject["orderBy"] ||= [];
    this.#queryObject["orderBy"].push(...fields.map((fld) => fld.dbName));
    return this;
  }

  sortDown(...fields: string[] | DbObjectField[]): Query<T> {
    this.#queryObject["orderBy"] ||= [];
    this.#queryObject["orderBy"].push(
      ...fields.map((fld) => `${fld.dbName} DESC`)
    );
    return this;
  }

  limit(count: number): Query<T> {
    if (typeof count !== "number" || (count | 0) !== count || count <= 0) {
      throw new Error("Value passed to limit must be a positive integer");
    }
    this.#queryObject["limit"] = count;
    return this;
  }

  async all(): Promise<T[]> {
    return await this.queryObjects();
  }

  async count(): Promise<number> {
    const queryCopy = JSON.parse(JSON.stringify(this.#queryObject));
    queryCopy["fields"] = "COUNT(*)";
    let res: { [index: string]: any } = await Query.execute(queryCopy);
    if (!res || !res.length || !res[0] || !("count" in res[0])) {
      throw new Error("Unknown error while counting records");
    }
    return parseInt(res[0]["count"]);
  }

  public toJSON() {
    return this.#queryObject;
  }
}

export class InsertQuery<T extends DbObject> extends Query<T> {
  #queryObject = {};

  constructor(proto: Object) {
    super(proto);

    this.#queryObject["type"] = "insert";
    this.#queryObject["table"] = proto["tableName"]();
    this.#queryObject["records"] = [];
  }

  public addRecord(rec: DbObject, updates: { [key: string]: any }) {
    if (!rec) throw new Error("No record provided");
    this.#queryObject["records"].push(updates);
  }

  public async execute(): Promise<T[]> {
    return await this.queryObjects();
  }

  public toJSON() {
    return this.#queryObject;
  }
}

export class UpdateQuery<T extends DbObject> extends Query<T> {
  #queryObject = {};

  constructor(proto: Object) {
    super(proto);

    this.#queryObject["type"] = "update";
    this.#queryObject["table"] = proto["tableName"]();
    this.#queryObject["records"] = [];
  }

  public addRecord(rec: DbObject, updates: { [key: string]: any }) {
    if (!rec) throw new Error("No record provided");

    // Since we are referencing the record by the id, we do not want it to appear in the list of updates
    delete updates.id;

    // We need to go through and convert any objects into strings, or the text will not render correctly in our query
    for (const propName in updates) {
      const value = updates[propName];
      if (typeof value === "object") {
        updates[propName] = value.toString();
      }
    }
    const recordJson = {
      where: { left: "id", operator: "=", right: rec.id.toString() },
      updates: updates,
    };
    this.#queryObject["records"].push(recordJson);
  }

  public async execute(): Promise<T[]> {
    return await this.queryObjects();
  }

  public toJSON() {
    return this.#queryObject;
  }
}

export class DeleteQuery<T extends DbObject> extends Query<T> {
  #queryObject = {};

  constructor(proto: Object) {
    super(proto);

    this.#queryObject["type"] = "delete";
    this.#queryObject["table"] = proto["tableName"]();
    this.#queryObject["records"] = [];
  }

  public addRecord(rec: DbObject) {
    if (!rec) throw new Error("No record provided");

    const recordJson = {
      where: { left: "id", operator: "=", right: rec.id.toString() },
    };
    this.#queryObject["records"].push(recordJson);
  }

  public async execute(): Promise<T[]> {
    return await this.queryObjects();
  }

  public toJSON() {
    return this.#queryObject;
  }
}
