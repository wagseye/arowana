import Ajv from "ajv/dist/jtd";
import { JTDSchemaType } from "ajv/dist/jtd";

class FieldSchema {
  name: string;
  type: string;
}

interface TableSchema {
  name: string;
  namespace: string | undefined;
  fields: FieldSchema[];
}

interface OrgSchema {
  tables: TableSchema[];
}

const schemaTypeDefinition = {
  definitions: {
    fieldSchema: {
      properties: {
        name: { type: "string" },
        type: { type: "string" },
      },
    },
    tableSchema: {
      properties: {
        name: { type: "string" },
        fields: {
          elements: { ref: "fieldSchema" },
        },
      },
      optionalProperties: {
        namespace: { type: "string" },
      },
    },
  },
  properties: {
    tables: {
      elements: { ref: "tableSchema" },
    },
  },
};

export function validateSchema(value: object) {
  const ajv = new Ajv();
  const validate = ajv.compile(schemaTypeDefinition);
  return validate(value);
}
