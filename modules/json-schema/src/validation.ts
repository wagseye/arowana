import Ajv, { JSONSchemaType } from "ajv";
import {
  OrgSchema,
  TableSchema,
  FieldSchema,
  ReferenceFieldSchema,
} from "./schema";

const orgSchema: JSONSchemaType<OrgSchema> = {
  $id: "orgSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    tables: {
      type: "array",
      items: { type: "object" } as JSONSchemaType<TableSchema>,
    },
  },
  required: ["tables"],
};

const tableSchema: JSONSchemaType<TableSchema> = {
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
    fields: {
      type: "array",
      items: { type: "object" } as JSONSchemaType<
        FieldSchema | ReferenceFieldSchema
      >,
    },
  },
  required: ["name", "fields"],
};

const fieldSchema: JSONSchemaType<FieldSchema> = {
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

const referenceFieldSchema: JSONSchemaType<ReferenceFieldSchema> = {
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
  console.log("Validating JSON: " + JSON.stringify(value));
  const ajv = new Ajv({ verbose: true });
  const validate = ajv
    .addSchema(fieldSchema)
    .addSchema(referenceFieldSchema)
    .addSchema(tableSchema)
    .compile(orgSchema);

  console.log("Compilation succeeded");

  if (validate(value)) {
    return true;
  } else {
    console.log("Validation errors: " + ajv.errorsText(validate.errors));
    return false;
  }
}
