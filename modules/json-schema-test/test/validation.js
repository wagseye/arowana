import { expect } from "chai";
import { validateSchema } from "json-schema";

const dbSchema =
  // prettier-ignore
  {
    tables: [
        {
            name: "Organization",
            fields: [
                { name: "name", type: "string", },
                { name: "createdAt", db_name: "created_at", type: "datetime" }
            ],
        },
        {
            name: "User",
            namespace: "public",
            fields: [
                { name: "firstName", db_name: "first_name", type: "integer", required: true, },
                { name: "lastName", db_name: "last_name", type: "integer", required: true, },
                { name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
            ]
        },
  ]};

describe("validate succeeds for a large schema", () => {
  it("should validate a correct schema", () => {
    expect(validateSchema(dbSchema)).to.be.true;
  });
});

describe("validate succeeds for a simple schema", () => {
  it("should validate a correct schema", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{name: "field_name", "type": "string"}]}]}
      )
    ).to.be.true;
  });
});

describe("validate does not require any fields", () => {
  it("should pass if fields empty", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: []}]}
      )
    ).to.be.true;
  });
});

describe("validate requires a table name element", () => {
  it("should fail if table name missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{"fields": []}]}
      )
    ).to.be.false;
  });
});

describe("validate requires a tables element", () => {
  it("should fail if table name missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tabels: [{name: "table_name",
          fields: [{"name": "field_name", "type": "string"}]}]}
      )
    ).to.be.false;
  });
});

describe("validate does not allow additional org elements", () => {
  it("should fail if top level object contains invalid key", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
          fields: [{"name": "field_name", "type": "string"}]}],
          other: "value"}
      )
    ).to.be.false;
  });
});

describe("validate requires a fields element", () => {
  it("should fail if fields missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{names: "table_name"}]}
      )
    ).to.be.false;
  });
});

describe("validate field name is required", () => {
  it("should fail if field name is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{"type": "string"}]}]}
      )
    ).to.be.false;
  });
});

describe("validate field type is required", () => {
  it("should fail if field type is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{name: "field_name"}]}]}
      )
    ).to.be.false;
  });
});

describe("validate basic field allows db_name", () => {
  it("should pass if db_name is specified", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "firstName", db_name: "first_name", type: "integer", },
        ]}]}
      )
    ).to.be.true;
  });
});

describe("validate basic field allows required", () => {
  it("should pass if required is specified", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "firstName", type: "integer", required: true, },
        ]}]}
      )
    ).to.be.true;
  });
});

describe("validate basic field takes no additional properties", () => {
  it("should fail if an unrecognized property is specified", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "firstName", type: "integer", other: true, },
        ]}]}
      )
    ).to.be.false;
  });
});

describe("validate reference field is accepted", () => {
  it("should pass if a reference field is provided", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
        ]}]}
      )
    ).to.be.true;
  });
});

describe("validate reference field requires name", () => {
  it("should fail if name is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
        ]}]}
      )
    ).to.be.false;
  });
});

describe("validate reference field requires type", () => {
  it("should fail if type is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
        ]}]}
      )
    ).to.be.false;
  });
});

describe("validate reference field requires foreignObject", () => {
  it("should fail if foreignObject is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", type: "reference", foreignLookupField: "id", foreignRelationName: "foos" },
        ]}]}
      )
    ).to.be.false;
  });
});

describe("validate reference field requires foreignLookupField", () => {
  it("should fail if foreignLookupField is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", type: "reference", foreignObject: "baz", foreignRelationName: "foos" },
        ]}]}
      )
    ).to.be.false;
  });
});

describe("validate reference field requires foreignRelationName", () => {
  it("should fail if foreignRelationName is missing", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id" },
        ]}]}
      )
    ).to.be.false;
  });
});

describe("validate reference field allows db_name", () => {
  it("should pass if db_name is provided", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", db_name: "organization_id", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
        ]}]}
      )
    ).to.be.true;
  });
});

describe("validate reference field allows required", () => {
  it("should pass if required is provided", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
        fields: [{ name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos", required: true },
        ]}]}
      )
    ).to.be.true;
  });
});

describe("validate reference field takes no additional properties", () => {
  it("should fail if an unrecognized property is specified", () => {
    expect(
      validateSchema(
        //prettier-ignore
        {tables: [{name: "table_name",
          fields: [{ name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos", other: "fail" },
          ]}]}
      )
    ).to.be.false;
  });
});
