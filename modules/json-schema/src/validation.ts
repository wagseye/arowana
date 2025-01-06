import Ajv, { JSONSchemaType } from "ajv";
import {
  OrgSchema,
  TableSchema,
  FieldSchema,
  ReferenceFieldSchema,
} from "./schema.js";

const orgSchema = {
  $id: "orgSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    tables: {
      type: "array",
      items: { $ref: "tableSchema" },
    },
  },
  required: ["tables"],
};

const tableSchema = {
  $id: "tableSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    namespace: {
      type: "string",
      nullable: true,
    },
    test_scope: {
      type: "string",
    },
    db_name: {
      type: "string",
      nullable: true,
    },
    fields: {
      type: "array",
      items: {
        anyOf: [{ $ref: "fieldSchema" }, { $ref: "referenceFieldSchema" }],
      },
    },
  },
  required: ["name", "fields"],
};

const fieldSchema = {
  $id: "fieldSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    db_name: { type: "string" },
    type: {
      type: "string",
      enum: ["id", "string", "number", "integer", "date", "datetime"],
    },
    required: { type: "boolean" },
  },
  required: ["name", "type"],
};

const referenceFieldSchema = {
  $id: "referenceFieldSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    db_name: { type: "string" },
    type: {
      type: "string",
      enum: ["reference"],
    },
    foreignObject: { type: "string" },
    foreignLookupField: { type: "string" },
    foreignRelationName: { type: "string" },
    required: { type: "boolean" },
  },
  required: [
    "name",
    "type",
    "foreignObject",
    "foreignLookupField",
    "foreignRelationName",
  ],
};

export function validateSchema(value: object) {
  const ajv = new Ajv({ verbose: true });
  const validate = ajv
    .addSchema(fieldSchema)
    .addSchema(referenceFieldSchema)
    .addSchema(tableSchema)
    .compile(orgSchema);

  if (validate(value)) {
    return true;
  } else {
    return false;
  }
}
