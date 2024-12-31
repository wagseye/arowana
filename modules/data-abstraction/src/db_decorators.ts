"use strict";

import DbObject from "./db_object.js";
import DbObjectField from "./db_object_field.js";
import { inspect } from "util";
const mapFieldNames = new WeakMap();

export class DbObjectMapper {
  static #objectsByName: Map<string, Object> = new Map();
  static addObject(obj: Object) {
    if (!obj) throw new Error("No object specified");
    const objName = obj["name"];
    if (!objName)
      throw new Error("Object does not have name. It is probably not a class");
    this.#objectsByName.set(objName, obj);
  }

  static getObject(objName: string): Object | undefined {
    if (!objName) throw new Error("No object name provided");
    return this.#objectsByName.get(objName);
  }
}

export class DbFieldMapper {
  static #fieldsByObjType: Map<object, Map<string, DbObjectField>> = new Map();

  static getFields(proto: object): Map<string, DbObjectField> | undefined {
    if (!proto) {
      throw new Error("No object specified");
    }
    let flds = this.#fieldsByObjType.get(proto);
    return flds;
  }

  static addField(proto: object, fld: DbObjectField) {
    let flds = this.#fieldsByObjType.get(proto);
    if (flds == null) {
      flds = new Map();
      this.#fieldsByObjType.set(proto, flds);
    }
    flds.set(fld.fieldName, fld);
  }
}

export function dbObject(tableName: string, idPrefix: string): Function {
  if (!tableName) throw new Error("No tableName provided");
  if (!idPrefix) throw new Error("No idPrefix provided");
  return function (target: any, propertyKey: string, descriptor?: object) {
    // console.log(
    //   `In dbObject function: ${target}(${target.name}) / ${propertyKey} / ${descriptor}`
    // );
    const fieldNames = getDbFields(target);
    const fieldMap: { [key: string]: any } = {};
    fieldNames.forEach((fldName: string) => {
      const dbField = target[fldName];
      // console.log(`dbObject fieldMap: ${JSON.stringify(fieldMap)}, fldName: ${fldName}, dbField: ${JSON.stringify(dbField)}, fieldName:${dbField?.fieldName}`);
      if (!dbField)
        throw new Error(`Could not find field with name ${fldName}`);
      // Freeze each field as they are added to the map so that they can not be manipulated later
      fieldMap[dbField.fieldName] = Object.freeze(dbField);
      DbFieldMapper.addField(target, dbField);
    });
    DbObjectMapper.addObject(target);
    console.log(`dbOject target: ${inspect(target)}`);
    console.log(
      `dbOject constructor: ${inspect(
        Object.getPrototypeOf(Object.getPrototypeOf(target.constructor))
      )}`
    );
    target.test1 = function () {
      console.log("prototype test1");
    };

    Object.getPrototypeOf(target).test2 = function () {
      console.log("constructor test2");
    };

    // Dynamically generate the tableName function for the new class
    target.tableName = tableName;
    /*function () {
      console.log(`Got into ${target.name}.tableName()`);
      return tableName;
    }*/

    // Dynamically generate the idPrefix function for the new class
    target.idPrefix = idPrefix;
    /*function () {
      console.log(`Got into ${target.name}.idPrefix()`);
      return idPrefix;
    }*/
  };
}

export function dbField(target: any, propertyKey: any, descriptor?: any) {
  // console.log(
  //   `In dbField function: ${target}(${typeof target}) / ${JSON.stringify(
  //     propertyKey
  //   )} / ${descriptor}`
  // );
  if (!target) return;
  // For static values, target is the class constructor
  const isStatic = typeof target === "function";
  const isMethod = descriptor ? true : false;
  if (!isStatic || isMethod) {
    throw new Error("@dbField decorator can only be used on static fields");
  }
  let arr = mapFieldNames.get(target);
  // console.log(`Array for ${target.name}: ${JSON.stringify(arr)}`);
  if (!arr) {
    arr = [];
    mapFieldNames.set(target, arr);
  }
  arr.push(propertyKey);
}
/*
export function dbStringField(fldName: string): Function {
  if (!fldName) throw new Error("An object type must be provided");
  //console.log(`Generating serializable function: ${type}`);
  return function (target: any, propertyKey: string, descriptor?: object) {
    target[propertyKey] = function () {
      console.log(`In ${propertyKey} getter`);
    };
  };
}

export function dbRefField(
  fldName: string,
  type: DbObjectType,
  refFldName: string = "id"
): Function {
  if (!fldName) throw new Error("An object type must be provided");
  if (!type) throw new Error("An object type must be provided");
  if (!refFldName)
    throw new Error("An reference object field must be provided");
  //console.log(`Generating serializable function: ${type}`);
  return function (target: any, propertyKey: string, descriptor?: object) {};
}
*/

/*
function createObjectType(
  target: any,
  dbFields: { [key: string]: any },
  idPrefix: string,
  tableName: string
) {
  return {
    idPrefix: idPrefix,
    tableName: tableName,
    newInstance: function () {
      return new target();
    },
    dbFields: function () {
      return dbFields;
    },
  };
}
*/

function getDbFields(proto: any): any[] {
  if (proto) {
    const values = [];
    // Use head recursion so hierarchically higher object fields end up first
    values.push(...getDbFields(Object.getPrototypeOf(proto)));
    //    console.log(`getDbFields: class=${proto.name}`);
    const arr = mapFieldNames.get(proto);
    if (arr) values.push(...arr);
    return values;
  }
  return [];
}
