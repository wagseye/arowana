import { TrustedDatabaseInterface, QueryResponse } from "database-interface";
import { validateSchema } from "./validation";

export class FieldSchema {
  name: string;
  db_name: string;
  type: "id" | "string" | "number" | "integer" | "date" | "datetime";
  required: boolean;

  public constructor(
    name: string,
    db_name: string,
    type: "id" | "string" | "number" | "integer" | "date" | "datetime",
    required: boolean = false
  ) {
    this.name = name;
    this.db_name = db_name || name;
    this.type = type;
    this.required = required;
  }
}

export class ReferenceFieldSchema {
  name: string;
  db_name: string;
  type: "reference";
  foreignObject: string;
  foreignLookupField: string;
  foreignRelationName: string;
  required: boolean;

  public constructor(
    name: string,
    db_name: string,
    foreignObject: string,
    foreignLookupField: string,
    foreignRelationName: string,
    required: boolean = false
  ) {
    this.type = "reference";
    this.name = name;
    this.db_name = db_name || name;
    this.foreignObject = foreignObject;
    this.foreignLookupField = foreignLookupField;
    this.foreignRelationName = foreignRelationName;
    this.required = required;
  }
}

export class TableSchema {
  name: string;
  namespace: string | undefined;
  fields: (FieldSchema | ReferenceFieldSchema)[];

  public constructor(name: string, namespace: string | undefined) {
    this.name = name;
    this.namespace = namespace;
    this.fields = [];
  }
}

export class OrgSchema {
  tables: TableSchema[];
  public constructor() {
    this.tables = [];
  }
}

let dbConnection: TrustedDatabaseInterface | undefined;

export function init(dbConn: TrustedDatabaseInterface) {
  if (!dbConn) throw new Error("You must provide a database connection");
  if (!("runQuery" in dbConn) || typeof dbConn.runQuery !== "function")
    throw new Error("Invalid database connection");

  dbConnection = dbConn;
}
export async function fromDatabaseSchema(orgId: string): Promise<OrgSchema> {
  if (!dbConnection)
    throw new Error("You must first call init() before calling this method");

  const res: QueryResponse = await dbConnection.runQuery(
    "SELECT tbl.table_schema AS table_schema, tbl.table_name AS table_name, col.column_name AS field_name, col.data_type, AS field_type (col.is_nullable!='YES')::boolean AS field_required " +
      "FROM public.organizations org " +
      "LEFT OUTER JOIN information_schema.tables tbl ON tbl.table_schema=org.table_schema " +
      "LEFT OUTER JOIN information_schema.columns col ON col.table_schema=tbl.table_schema AND col.table_name=tbl.table_name " +
      "WHERE org.id='%'" +
      "ORDER BY tbl.table_schema, tbl.table_name, col.column_name",
    orgId
  );
  return buildSchema(res);
}

export async function fromDatabaseObjects(orgId: string): Promise<OrgSchema> {
  if (!dbConnection)
    throw new Error("You must first call init() before calling this method");
  const res = await dbConnection.runQuery(
    "SELECT obj.table_schema AS table_schema, obj.table_name AS table_name, fld.name AS field_name, fld.type AS field_type, fld.not_null AS field_required" +
      "FROM organizations org INNER JOIN objects obj ON obj.organization_id=org.id " +
      "LEFT OUTER JOIN object_fields fld ON fld.object_id=obj.id " +
      "WHERE org.id='%'" +
      "ORDER BY obj.table_schema, obj.table_name, fld.name",
    orgId
  );
  return buildSchema(res);
}

function buildSchema(flds: QueryResponse): OrgSchema {
  const schema = new OrgSchema();
  const mapTables = new Map<String, TableSchema>();
  flds.forEach((fld) => {
    let table = mapTables.get(fld.table_name);
    if (!table) {
      table = new TableSchema(fld["table_name"], fld["table_schema"]);
      mapTables.set(fld["table_name"], table);
      schema.tables.push(table);
    }
    table.fields.push(
      new FieldSchema(
        fld["fieldName"],
        fld["field_type"],
        fld["field_required"]
      )
    );
  });

  // Do a sanity check to ensure what we've generated matches our expected output format
  if (!validateSchema(schema)) {
    throw new Error("Generated schema is invalid: " + JSON.stringify(schema));
  }
  return schema;
}
