"use strict";

import Id from "./id.js";
import DbObjectField, {
  DbObjectIdField,
  FieldType,
} from "./db_object_field.js";
import { SelectQuery, InsertQuery, UpdateQuery } from "./query.js";
import { dbField } from "./db_decorators.js";

export interface PrototypeType<T> extends Function {
  prototype: T;
}

export interface ConstructorFunctionType<T = any> extends PrototypeType<T> {
  new (...args: any[]): T;
}

type ConstructorType<
  T = unknown,
  Static extends Record<string, any> = PrototypeType<T>
> = (ConstructorFunctionType<T> | PrototypeType<T>) & {
  [Key in keyof Static]: Static[Key];
};

export default class DbObject {
  @dbField
  static id: DbObjectField = new DbObjectIdField("id");

  #dbRecord: object | undefined;
  #cachedValues: Map<string, FieldType> | undefined;
  #dirtyKeys: Set<string> | undefined;
  #props = new Map();

  constructor() {
    if (this.constructor == DbObject) {
      throw new Error(
        "DbObject class is abstract and can not be instantiated."
      );
    }
  }

  static get class(): Object {
    return this;
  }

  get class(): Object {
    return Object.getPrototypeOf(this).constructor.class;
  }

  static newInstance<T extends DbObject>(dbRec: object): T {
    const proto: any = this.class;
    const newObj = new (proto.bind.apply(proto))();
    newObj.#dbRecord = dbRec;
    return newObj;
  }

  static idPrefix(): string {
    throw new Error('Static method "idPrefix" must be implemented by subclass');
  }

  static tableName(): string {
    throw new Error(
      'Static method "tableName" must be implemented by subclass'
    );
  }

  // Accessors for getting and setting properties
  public get(prop: string | DbObjectField): any {
    if (!(typeof prop === "string" || prop instanceof DbObjectField)) {
      throw new Error(
        "The specified property must be a string or DbObjectField"
      );
    }
    let propName: string, dbFieldObj: DbObjectField;
    if (prop instanceof DbObjectField) {
      propName = prop.fieldName;
      dbFieldObj = prop;
    } else {
      // prop is a string
      propName = prop;
      dbFieldObj = this.findDbFieldByName(propName);
    }
    // Try to get the value from our cached (previously accessed) values
    this.#cachedValues ||= new Map<string, FieldType>();
    let value: FieldType = this.#cachedValues.get(propName);
    // Otherwise if we have an underlying db record, pull it from there, perform any type conversions, and cache the value
    if (!value) {
      if (this.#dbRecord) {
        if (!(propName in this.#dbRecord))
          throw new Error(`Field not retrieved from database: "${propName}"`);
        let strValue: string = this.#dbRecord[propName];
        if (strValue) {
          value = dbFieldObj.coerceType(strValue);
        }
        this.#cachedValues.set(propName, value);
      }
    }
    return value;
  }

  public set(prop: string | DbObjectField, value: any): void {
    if (!(typeof prop === "string" || prop instanceof DbObjectField)) {
      throw new Error(
        "The specified property must be a string or DbObjectField"
      );
    }
    const propName = prop instanceof DbObjectField ? prop.fieldName : prop;

    this.#cachedValues ||= new Map<string, FieldType>();
    const dbFieldObj = this.findDbFieldByName(propName);
    const typedValue = dbFieldObj.coerceType(value);
    this.#cachedValues.set(propName, typedValue);

    this.#dirtyKeys ||= new Set<string>();
    this.#dirtyKeys.add(propName);
  }

  setString(prop: string | DbObjectField, value: any): void {
    if (value && typeof value !== "string" && !(value instanceof String)) {
      throw new Error("Property value must be a string");
    }
    this.#props.set(prop, value);
  }

  private findDbFieldByName(propName: string): DbObjectField {
    // This looks for the DbObjectField object on the class prototype by name, which works well enough
    // for now but I feel will not be reliable in the future. It would be better if we could use the @dbField
    // decorator mechanism to dynamically populate a list of fields at load time.
    const dbFieldObj =
      this.constructor[propName.charAt(0).toUpperCase() + propName.slice(1)];
    if (!dbFieldObj || !(dbFieldObj instanceof DbObjectField)) {
      throw new Error(
        `Unknown field on ${this.constructor.name} object: "${propName}"`
      );
    }
    return dbFieldObj;
  }

  // Shared fields
  get id(): Id {
    return this.get(DbObject.id) as Id;
  }

  set id(value) {
    this.set(DbObject.id, value);
  }

  public toJson(): string {
    // Eventually we'll probably want to filter out some of these values
    return JSON.stringify(Object.fromEntries(this.#props));
  }

  // Query-related methods
  static select<T extends DbObject>(
    this: ConstructorType<T, typeof DbObject>,
    ...fields: (DbObjectField | string)[]
  ): SelectQuery<T> {
    let q = new SelectQuery<T>(this.class);
    if (fields) {
      q.select(...fields);
    }
    return q;
  }

  static async insert<T extends DbObject>(recs: T | T[]): Promise<T[]> {
    const recsArr = Array.isArray(recs) ? recs : [recs];
    const q = new InsertQuery<T>(this.class);
    recsArr.forEach((rec) => q.addRecord(rec, rec.#dirtyKeys));

    const insertedRecs: T[] = await q.execute();
    recsArr.forEach((rec) => rec.#dirtyKeys.clear());
    return insertedRecs;
  }

  static async update<T extends DbObject>(recs: T | T[]): Promise<T[]> {
    const recsArr = Array.isArray(recs) ? recs : [recs];
    const q = new UpdateQuery<T>(this.class);
    recsArr.forEach((rec) => q.addRecord(rec, rec.#dirtyKeys));

    const updatedRecs: T[] = await q.execute();
    recsArr.forEach((rec) => rec.#dirtyKeys.clear());
    return updatedRecs;
  }

  // Potential future methods
  /*
  static load(field: DbObjectReferenceField): DbObject? {
    return undefined;
  } */
}
