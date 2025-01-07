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
  static Id: DbObjectField = new DbObjectIdField("id");
  static #propsByName: Map<string, Map<string, DbObjectField>> = new Map();
  static #propsByDbName: Map<string, Map<string, DbObjectField>> = new Map();

  // #dbRecord is only present if this record was retrieved by the database (or copied from another record that was)
  #dbRecord: { [key: string]: FieldType | undefined } | undefined;
  // #cachedValues is instantiated because any time an object is used (i.e. a field is read) it will be needed
  #cachedValues: Map<string, FieldType> = new Map();
  // #dirtyKeys are not instantiated because it is only needed when an object is updated, which should be the unusual case
  #dirtyKeys: Set<string> | undefined;

  constructor(props: { [key: string]: any } | undefined = undefined) {
    if (this.constructor == DbObject) {
      throw "DbObject class is abstract and can not be instantiated.";
    }
    this.copyProperties(props);
  }

  static get class(): typeof DbObject {
    return this;
  }

  get class(): typeof DbObject {
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
    let value: FieldType = this.#cachedValues.get(dbFieldObj.dbName);
    // Otherwise if we have an underlying db record, pull it from there, perform any type conversions, and cache the value
    if (!value) {
      if (this.#dbRecord) {
        if (!(dbFieldObj.dbName in this.#dbRecord))
          throw new Error(`Field not retrieved from database: "${propName}"`);
        let strValue: string = this.#dbRecord[dbFieldObj.dbName];
        value =
          // The empty string is a permissible value, so we explicitly test against undefined/null here
          strValue !== undefined && strValue !== null
            ? dbFieldObj.coerceType(strValue)
            : undefined;
        this.#cachedValues.set(dbFieldObj.dbName, value);
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
    if (!dbFieldObj) throw new Error(`Property not found: "${propName}"`);
    const typedValue =
      // The empty string is a permissible value, so we explicitly test against undefined/null here
      value !== undefined && value !== null
        ? dbFieldObj.coerceType(value)
        : undefined;
    this.#cachedValues.set(dbFieldObj.dbName, typedValue);

    this.#dirtyKeys ||= new Set<string>();
    this.#dirtyKeys.add(dbFieldObj.dbName);
  }

  // TODO: add opts field to Typescript
  public copy(other: DbObject, opts: object | undefined = undefined): void {
    if (!other) throw "No record to copy";
    if (!(other instanceof DbObject))
      throw "Record to copy must be of a type that inherits DbObject";
    if (other.class !== this.class)
      throw "Record to copy must be of the same type as the current object";

    // Copy over the underlying db record and mark all properties as "dirty"
    if (!opts["onlyChanges"]) {
      for (let propName in other.#dbRecord) {
        this.#cachedValues.set(propName, other.#dbRecord[propName]);
        this.#dirtyKeys.add(propName);
      }
    }

    // Copy over the all "dirty" props on other and mark them as "dirty"
    for (let propName in other.#dirtyKeys) {
      this.#cachedValues.set(propName, other.#dbRecord[propName]);
      this.#dirtyKeys.add(propName);
    }
  }

  public toJSON(): { [key: string]: any } {
    let obj = {};
    // First copy the underlying database record
    if (this.#dbRecord) {
      for (let propName in this.#dbRecord) {
        obj[propName] = this.#dbRecord[propName];
      }
    }
    // Next copy over the values that have been explicitly set on the object, possibly overwriting some of the previous values
    this.#dirtyKeys.forEach((propName) => {
      obj[propName] = this.#cachedValues.get(propName);
    });
    return obj;
  }

  private copyProperties(
    props: { [key: string]: any } | undefined = undefined
  ): void {
    if (props) {
      for (let propName in props) {
        this.set(propName, props[propName]);
      }
    }
  }

  private findDbFieldByName(fldName: string): DbObjectField | undefined {
    const className = this.class.name;
    if (
      !DbObject.#propsByName.has(className) ||
      !DbObject.#propsByDbName.has(className)
    ) {
      this.class.indexFields();
    }
    return DbObject.#propsByName.get(className)?.get(fldName);
  }

  // TODO: figure out if we actually need this. It seems like it could be useful but I found a workaround
  // for the original use case.
  private findDbFieldByDbName<T>(dbName: string): DbObjectField | undefined {
    const className = this.class.name;
    if (
      !DbObject.#propsByName.has(className) ||
      !DbObject.#propsByDbName.has(className)
    ) {
      this.class.indexFields();
    }
    return DbObject.#propsByDbName.get(className)?.get(dbName);
  }

  private static indexFields() {
    const className = this.name;
    const byName = new Map<string, DbObjectField>();
    const byDbName = new Map<string, DbObjectField>();
    Object.getOwnPropertyNames(this).forEach((propName) => {
      const prop = this[propName];
      if (prop instanceof DbObjectField) {
        byName.set(prop.fieldName, prop);
        byDbName.set(prop.dbName, prop);
      }
    });
    DbObject.#propsByName.set(className, byName);
    DbObject.#propsByDbName.set(className, byDbName);
  }

  // Shared fields
  get id(): Id {
    let id = this.get(DbObject.Id);
    return id;
  }

  set id(value) {
    this.set(DbObject.Id, value);
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

  static async insert<T extends DbObject>(...recs: (T | T[])[]): Promise<void> {
    if (!recs || !recs.length) {
      throw new Error("No records provided to insert");
    }
    const recsToInsert = recs.flat();
    const q = new InsertQuery<T>(this.class);
    recsToInsert.forEach((rec) => {
      if (rec.id) throw "Records with id set can not be inserted";
      if (rec.class !== this)
        throw `Objects to insert must be of type ${this.name}`;
      const recUpdates: { [key: string]: any } = {};
      for (const propName of rec.#dirtyKeys) {
        recUpdates[propName] = rec.#cachedValues.get(propName);
      }
      q.addRecord(rec, recUpdates);
    });

    const insertedRecs: T[] = await q.execute();
    for (let i = 0; i < recsToInsert.length; i++) {
      let oldRec = recsToInsert[i];
      let newRec = insertedRecs[i];
      oldRec.#dbRecord = newRec.#dbRecord;
      oldRec.#cachedValues.clear();
      oldRec.#dirtyKeys.clear();
    }
  }

  static async update<T extends DbObject>(...recs: (T | T[])[]): Promise<void> {
    if (!recs || !recs.length) {
      throw new Error("No records provided to insert");
    }
    const recsToUpdate = recs.flat();
    const q = new UpdateQuery<T>(this.class);
    recsToUpdate.forEach((rec) => {
      if (!rec.id) throw "Records without id set can not be updated";
      if (rec.class !== this)
        throw `Objects to update must be of type ${this.name}`;
      const recUpdates: { [key: string]: any } = {};
      for (const propName of rec.#dirtyKeys) {
        recUpdates[propName] = rec.#cachedValues.get(propName);
      }
      q.addRecord(rec, recUpdates);
    });

    const updatedRecs: T[] = await q.execute();
    for (let i = 0; i < recsToUpdate.length; i++) {
      let oldRec = recsToUpdate[i];
      let newRec = updatedRecs[i];
      oldRec.#dbRecord = newRec.#dbRecord;
      oldRec.#cachedValues.clear();
      oldRec.#dirtyKeys.clear();
    }
  }

  // Potential future methods
  /*
  static load(field: DbObjectReferenceField): DbObject? {
    return undefined;
  } */
}
