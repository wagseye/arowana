"use strict";

import { ConditionalExpression } from "./query.js";
import { DbObjectMapper } from "./db_decorators.js";
import DbObject from "./db_object.js";
import Id from "./id.js";

export type FieldType = string | boolean | number | Id | Date;

export default abstract class DbObjectField {
  #fieldName: string;
  #dbName: string;

  public get fieldName() {
    return this.#fieldName;
  }

  public get dbName() {
    return this.#dbName || this.#fieldName;
  }

  public set dbName(value: string) {
    this.#dbName = value;
  }

  public constructor(fieldName: string) {
    if (!fieldName) throw new Error("A field name must be provided");
    this.#fieldName = fieldName;
  }

  public abstract coerceType(value: FieldType): FieldType;

  public equals(value: any): ConditionalExpression {
    return new ConditionalExpression(this.dbName, "=", value);
  }

  public notEquals(value: any): ConditionalExpression {
    return new ConditionalExpression(this.dbName, "<>", value);
  }

  public greaterThan(value: any): ConditionalExpression {
    return new ConditionalExpression(this.dbName, ">", value);
  }

  public greaterOrEqualThan(value: any): ConditionalExpression {
    return new ConditionalExpression(this.dbName, ">=", value);
  }

  public lessThan(value: any): ConditionalExpression {
    return new ConditionalExpression(this.dbName, "<", value);
  }

  public lessOrEqualThan(value: any): ConditionalExpression {
    return new ConditionalExpression(this.dbName, "<=", value);
  }

  public isNull(): ConditionalExpression {
    return new ConditionalExpression(this.dbName, "IS NULL", null);
  }

  public isNotNull(): ConditionalExpression {
    return new ConditionalExpression(this.dbName, "IS NOT NULL", null);
  }

  public toString() {
    return this.#dbName;
  }
}

export class DbObjectIdField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }

  public coerceType(value: FieldType): Id {
    if (value instanceof Id) return value;
    if (typeof value === "string") return new Id(value);
    throw new Error("Value of an id field must be an Id or string");
  }
}

export class DbObjectStringField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }

  public coerceType(value: FieldType): string {
    if (typeof value === "string") return value;
    if (value instanceof Id) return value.toString();
    throw new Error("Value of a string field must be a string");
  }
}

export class DbObjectBooleanField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }

  public coerceType(value: FieldType): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value === "true") return true;
      if (value === "false") return false;
    }
    throw new Error("Value of a boolean field must be a boolean");
  }
}

export class DbObjectNumberField extends DbObjectField {
  #decimalPlaces;
  public constructor(fieldName: string, decimalPlaces: number = undefined) {
    super(fieldName);
    this.#decimalPlaces = decimalPlaces;
  }
  public coerceType(value: FieldType): number {
    if (typeof value === "string") {
      const val = Number.parseFloat(value);
      // We only want to allow strings where the whole thing is the number, so we compare back to original string we had
      if (!isNaN(val) && val.toString() === value) {
        value = val;
      }
    }
    if (typeof value === "number") {
      if (this.#decimalPlaces !== undefined && this.#decimalPlaces !== null) {
        return Number.parseFloat(value.toFixed(this.#decimalPlaces));
      }
      return value;
    }
    throw new Error("Value of an number field must be a number");
  }
}

// This could extend DbObjectNumberField, but we're never going to need it for polymorphism, it
// doesn't simplify the code, and it could throw off our unit tests when type checking
export class DbObjectIntegerField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }
  public coerceType(value: FieldType): number {
    if (typeof value === "number") return Math.floor(value);
    if (typeof value === "string") {
      const val = Number.parseFloat(value);
      // We only want to allow strings where the whole thing is the number, so we compare back to original string we had
      if (val !== Number.NaN && val.toString() === value)
        return Math.floor(val);
    }
    throw new Error("Value of an integer field must be a number");
  }
}

function validateDateStringFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") {
    throw "Parameter must be a valid string";
  }

  const timeRE = `(\\d{1,2}:\\d{2}(:\\d{2}(\\.\\d{1,2})?)?)?`;
  const re1 = `\\d{4}-\\d{1,2}-\\d{1,2}( ${timeRE})?`; // YYYY-MM?-DD?
  const re2 = `\\d{1,2}-\\d{1,2}-\\d{4}( ${timeRE})?`; // MM?-DD?-YYYY
  const re3 = `\\d{1,2}\\/\\d{1,2}\\/\\d{2}(\\d{2})?( ${timeRE})?`; // MM?/DD?/YYYY -or- MM?/DD?/YY
  const re4 = //ISO format (e.g. 2012-10-04T00:00:00.000Z)
    "(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d.\\d+([+-][0-2]\\d:[0-5]\\d|Z))";

  const re = new RegExp(`^((${re1})|(${re2})|(${re3})|(${re4}))$`);
  return re.test(dateStr);
}

export class DbObjectDateField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }

  public coerceType(value: FieldType): Date {
    if (typeof value === "number") {
      // Make sure the number is an integer
      if (Math.floor(value) == value) {
        // I've thought about checking that the value is within a particular range, but that gets weird pretty fast
        // so we'll just let any ol' number through here
        value = new Date(value);
      }
    }
    if (typeof value === "string") {
      if (validateDateStringFormat(value)) {
        const val = Date.parse(value);
        if (!isNaN(val)) {
          value = new Date(val);
        }
      }
    }
    if (value instanceof Date) {
      // I don't know if this is exactly correct, but it makes the tests pass. It may need revisiting later.
      // prettier-ignore
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0));
    }
    throw new Error("Value can not be stored in a date field");
  }
}

export class DbObjectDateTimeField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }
  public coerceType(value: FieldType): Date {
    if (typeof value === "number") {
      // Make sure the number is an integer
      if (Math.floor(value) == value) {
        // We'll just let people provide any number here...
        value = new Date(value);
      }
    }
    if (typeof value === "string") {
      if (validateDateStringFormat(value)) {
        const val = Date.parse(value);
        if (!isNaN(val)) {
          value = new Date(val);
        }
      }
    }
    if (value instanceof Date) {
      // I don't know if this is exactly correct, but it makes the tests pass. It may need revisiting later.
      // prettier-ignore
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds(), value.getUTCMilliseconds()));
    }
    throw new Error("Value can not be stored in a datetime field");
  }
}

export class DbObjectReferenceField extends DbObjectIdField {
  #proto: Object | undefined;
  #proto_name: string;
  #relationName: string;
  #foreignFieldName: string;
  #foreignRelationName: string | undefined;

  public constructor(
    fieldName: string,
    proto_name: string,
    relationName: string,
    foreignRelation: string | undefined = undefined,
    foreignField: string = "id"
  ) {
    if (!proto_name) {
      throw new Error(
        "Object prototype name must be provided to create a DbObjectReferenceField object"
      );
    }
    if (!foreignField) {
      throw new Error(
        "Reference field must be provided to create a DbObjectReferenceField object"
      );
    }
    super(fieldName);
    this.#proto_name = proto_name;
    this.#relationName = relationName;
    this.#foreignFieldName = foreignField;
    this.#foreignRelationName = foreignRelation;
  }

  public get referenceType(): Object {
    if (!this.#proto) {
      this.#proto = DbObjectMapper.getObject(this.#proto_name);
      if (!this.#proto)
        throw new Error(
          `Could not resolve class with name ${this.#proto_name}`
        );
    }
    return this.#proto;
  }

  public get foreignField(): string {
    return this.#foreignFieldName;
  }

  public get relationName(): string {
    return this.#relationName;
  }

  public get foreignRelationName(): string | undefined {
    return this.#foreignRelationName;
  }

  // NB: How do we store the actual reference to the related object?

  // protected coerceType(value: unknown) : unknown {
  //   if (value instanceof DbObject) return value;
  //   throw new Error("Value of an id field must be an Id or string");
  // }
}
