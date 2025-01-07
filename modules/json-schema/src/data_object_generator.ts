import { validateSchema } from "./validation.js";
import {
  DbObject,
  DbObjectIdField,
  DbObjectStringField,
  DbObjectBooleanField,
  DbObjectReferenceField,
  DbObjectIntegerField,
  DbObjectNumberField,
  DbObjectDateField,
  DbObjectDateTimeField,
} from "data-abstraction";

export default class DataObjectGenerator {
  public static generateClasses(schema: object): { [key: string]: object } {
    if (!validateSchema(schema)) throw new Error("Schema format is invalid");
    let objects = {};
    schema["tables"].forEach((tblSchema) => {
      let newClass = this.generateClass(tblSchema);
      objects[tblSchema.name] = newClass;
    });
    return objects;
  }

  public static generateClass(schema: object): object {
    let newClass = class extends DbObject {
      constructor(props = undefined) {
        super(props);
      }
    };

    // In general, each test file generates its own schema based on its own needs. However, DbObject indexes
    // the dbFields based on class name, so we need some way to differentiate the different instances that get
    // created. The optional "test_scope" property on the table gets appended to the table name to deal with this.
    const className =
      schema["name"] + (schema["test_scope"] ? `_${schema["test_scope"]}` : "");
    this.setClassVariable(newClass, "name", className, {
      writable: false,
      enumerable: false,
      configurable: true,
    });

    // Create the static method "tableName" that will return the database name (if provided) or the common name
    newClass["tableName"] = () => {
      return schema["db_name"] || schema["name"];
    };

    // The "id" field is a special case. It should always be present, but we also need to remove it from
    // the table schema if it exists.
    this.setClassVariable(newClass, "Id", DbObject.Id, { enumerable: true });
    const fields = schema["fields"]?.filter((fld) => fld.name !== "id");

    fields.forEach((field) => {
      let staticField;
      switch (field.type) {
        case "id":
          staticField = new DbObjectIdField(field.name);
          break;
        case "string":
          staticField = new DbObjectStringField(field.name);
          break;
        // TODO: get this to work properly
        case "reference":
          staticField = new DbObjectReferenceField(
            field.name,
            "temp",
            field.name,
            "temp"
          );
          break;
        case "integer":
          staticField = new DbObjectIntegerField(field.name);
          break;
        case "boolean":
          staticField = new DbObjectBooleanField(field.name);
          break;
        case "number":
          staticField = new DbObjectNumberField(field.name);
          break;
        case "date":
          staticField = new DbObjectDateField(field.name);
          break;
        case "datetime":
          staticField = new DbObjectDateTimeField(field.name);
          break;
        default:
          throw new Error(`Unrecognized field type: ${field.type}`);
      }
      if (field.db_name) staticField.dbName = field.db_name;

      // Create the static variable that holds the DbObjectField
      const staticFldName =
        field.name.charAt(0).toUpperCase() + field.name.slice(1);
      this.setClassVariable(newClass, staticFldName, staticField, {
        writable: true,
        enumerable: true,
        configurable: false,
      });
      // Create the instance getter and setter for the property
      this.setInstancePropery(
        newClass,
        field.name,
        function () {
          return this.get(staticField);
        },
        function (value) {
          this.set(staticField, value);
        }
      );
    });
    return newClass;
  }

  private static setClassVariable(
    newClass: object,
    varName: string,
    value: unknown = undefined,
    options: object = {}
  ) {
    if (!newClass) throw new Error("Invalid class");
    const prop = this.getPropertyOptions(options);
    prop["value"] = value;
    Object.defineProperty(newClass, varName, prop);
  }

  private static setInstancePropery(
    newClass: object,
    propName: string,
    getter: object,
    setter: object | undefined = undefined,
    options: object = {}
  ) {
    this.setProperty(newClass["prototype"], propName, getter, setter, options);
  }

  private static setClassPropery(
    newClass: object,
    propName: string,
    getter: object | undefined,
    setter: object | undefined = undefined,
    options: object = {}
  ) {
    this.setProperty(newClass, propName, getter, setter, options);
  }

  private static setProperty(
    obj: object,
    propName: string,
    getter: object | undefined,
    setter: object | undefined,
    options: object = {}
  ) {
    if (!getter && !setter)
      throw new Error("Property must specify a getter, setter, or both");
    if (getter && typeof getter !== "function")
      throw new Error("Getter must be a function");
    if (setter && typeof setter !== "function")
      throw new Error("Setter must be a function");
    const prop = this.getPropertyOptions(options);
    delete prop["writable"];
    if (getter) prop["get"] = getter;
    if (setter) {
      prop["set"] = setter;
    } else {
      if (prop["writable"])
        throw new Error(
          "Property is marked as writable but does not provide a setter"
        );
    }
    Object.defineProperty(obj, propName, prop);
  }

  private static getPropertyOptions(options: object): object {
    const DEFAULT_ENUMERABLE = true;
    const DEFAULT_CONFIGURABLE = true;
    const DEFAULT_WRITABLE = true;

    const newOpts = {};
    newOpts["enumerable"] =
      typeof options["enumerable"] === "boolean"
        ? options["enumerable"]
        : DEFAULT_ENUMERABLE;
    newOpts["configurable"] =
      typeof options["configurable"] === "boolean"
        ? options["configurable"]
        : DEFAULT_CONFIGURABLE;
    newOpts["writable"] =
      typeof options["writable"] === "boolean"
        ? options["writable"]
        : DEFAULT_WRITABLE;

    return newOpts;
  }
}
