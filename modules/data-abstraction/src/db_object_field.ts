"use strict";

import { ConditionalExpression } from "./query.js";
import { DbObjectMapper } from "./db_decorators.js";
import DbObject from "./db_object.js";
import Id from "./id.js";

export type FieldType = string | number | Id | Date;

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
    throw new Error("Value of an string must be a string");
  }
}

export class DbObjectNumberField extends DbObjectField {
  #decimalPlaces;
  public constructor(fieldName: string, decimalPlaces: number = undefined) {
    super(fieldName);
    this.#decimalPlaces = decimalPlaces;
  }
  public coerceType(value: FieldType): number {
    if (typeof value === "number") return value;
    try {
      if (typeof value === "string") {
        if (this.#decimalPlaces) {
          // If we need to round, I think the best way for our purposes is to go from string => num => string => num.
          // Another way is to multiply by 10^numdigits, round and divide back, but then you run into danger of overflow
          // if you have a lot of decimal places you want to represent
          const strRep = Number.parseFloat(value).toFixed(this.#decimalPlaces);
          return Number.parseFloat(strRep);
        }
        return Number.parseFloat(value);
      }
    } catch (err: unknown) {
      throw new Error("Invalid number format");
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
    try {
      if (typeof value === "string") return Number.parseInt(value);
    } catch (err: unknown) {
      throw new Error("Invalid integer format");
    }
    throw new Error("Value of an integer field must be a number");
  }
}

export class DbObjectDateField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }
  public coerceType(value: FieldType): Date {
    if (value instanceof Date) return value;
    if (typeof value === "number") {
      // TODO: add additional checks here?
      return new Date(value);
    }
    try {
      if (typeof value === "string") return new Date(value);
    } catch (err: unknown) {
      throw new Error("Invalid date format");
    }
    throw new Error("Value can not be stored in a date field");
  }
}

export class DbObjectDateTimeField extends DbObjectField {
  public constructor(fieldName: string) {
    super(fieldName);
  }
  public coerceType(value: FieldType): Date {
    if (value instanceof Date) return value;
    if (typeof value === "number") {
      // TODO: add additional checks here?
      return new Date(value);
    }
    try {
      if (typeof value === "string") return new Date(value);
    } catch (err: unknown) {
      throw new Error("Invalid date format");
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
