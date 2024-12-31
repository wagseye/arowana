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
    const dbRows: { [index: string]: any }[] = await Query.execute(
      this.toJSON()
    );

    const objs = [];
    dbRows.forEach((row: { [index: string]: any }) => {
      // @ts-ignore
      const newObj = this.#proto.newInstance(row);
      objs.push(newObj);
    });
    return objs;
  }

  protected static async execute(
    q: object
  ): Promise<{ [index: string]: any }[]> {
    if (!this.#database) {
      await this.loadDatabase();
    }
    const t = new Timer().start();
    const dbRows: { [index: string]: any }[] = await Query.#database!.query(q);
    console.log(`Executed query in ${t.stop().elapsedTime()}`);

    return dbRows;
  }

  private static async loadDatabase() {
    try {
      // The module name is defined separately from the import to avoid tsc compilation errors
      console.log("Attempting to load database module");
      const module_name = "database-connector";
      const t: Timer = new Timer().start();
      const { default: Database } = await import(module_name);
      console.log(`Loaded module in ${t.stop().elapsedTime()}`);
      this.#database = Database;
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
  #queryObject = {};

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
          list.push(fld.fieldName);
        } else if (fld instanceof Array) {
          // Arrays should be interpreted same as above
          fld.forEach((item) => {
            if (typeof item === "string") {
              list.push(item);
            } else if (item instanceof DbObjectField) {
              list.push(item.fieldName);
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
    this.#queryObject["orderBy"].push(...fields.map((fld) => fld.toString()));
    return this;
  }

  sortDown(...fields: string[] | DbObjectField[]): Query<T> {
    this.#queryObject["orderBy"] ||= [];
    this.#queryObject["orderBy"].push(
      ...fields.map((fld) => `${fld.toString()} DESC`)
    );
    return this;
  }

  limit(count: number): Query<T> {
    if (typeof count !== "number" || (count | 0) !== count || count <= 0) {
      throw new Error("Value passed to limit must be a positive integer");
    }
    this.#queryObject["limit"] = count;
    //this.#limitClause.setLimit(count);
    return this;
  }

  async all(): Promise<T[]> {
    return await this.queryObjects();
  }

  async count(): Promise<number> {
    const queryCopy = JSON.parse(JSON.stringify(this.#queryObject));
    queryCopy["fields"] = "COUNT(*)";
    let res: { [index: string]: any }[] = await Query.execute(queryCopy);
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

  public addRecord(rec: DbObject, changedFields: Set<string>) {
    // Not yet implemented
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
    this.#queryObject["table"] = proto["tableName"];
  }

  public addRecord(rec: DbObject, changedFields: Set<string>) {
    if (!rec) throw new Error("No record provided");
    if (!rec.id) throw new Error("Records to be updated must have an id");

    this.#queryObject["records"] ||= [];
    const record = {};
    record["where"] = new ConditionalExpression(
      this.#queryObject["id"],
      "=",
      rec.id
    );
    const updates = {};
    record["updates"] = updates;
    changedFields.forEach((fld) => {
      if (!fld) throw new Error("Invalid field specified in update list");
      if (fld !== "id") {
        updates[fld] = rec.get(fld);
      }
    });
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
  public toJSON() {
    return this.#queryObject;
  }
}
