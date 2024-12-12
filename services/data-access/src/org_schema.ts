import DatabaseConnector from "./database";

export default class OrganizationSchema {
  static #cachedSchemas: Map<string, OrganizationSchema> = new Map<
    string,
    OrganizationSchema
  >();

  #orgnizationId: string;
  #id_key: string;
  #mapTables: Map<string, SchemaTable>;

  public static async getOrganizationSchema(
    orgId: string
  ): Promise<OrganizationSchema | undefined> {
    if (!orgId) throw new Error("No organization id provided");
    let schema = this.#cachedSchemas.get(orgId);
    if (!schema) {
      schema = await this.loadSchema(orgId);
      this.#cachedSchemas.set(orgId, schema);
    }
    return schema;
  }

  public constructor(orgId: string, idKey: string) {
    if (!orgId) throw new Error("No organization id provided");
    this.#orgnizationId = orgId;
    this.#id_key = idKey;
    this.#mapTables = new Map<string, SchemaTable>();
  }
  public get organizationId() {
    return this.#orgnizationId;
  }
  public get idKey() {
    return this.#id_key;
  }

  public addTable(name: string, namespace): SchemaTable {
    if (this.hasTable(name))
      throw new Error(`Organization already has table named "${name}"`);
    const tbl: SchemaTable = new SchemaTable(name, namespace);
    this.#mapTables.set(name, tbl);
    return tbl;
  }

  public getTable(name: string): SchemaTable {
    if (!name) throw new Error("No table name provided");
    return this.#mapTables.get(name);
  }

  public hasTable(name: string): boolean {
    if (!name) throw new Error("No table name provided");
    return this.#mapTables.has(name);
  }

  private static async loadSchema(
    orgId: string
  ): Promise<OrganizationSchema | undefined> {
    if (!orgId) throw new Error("No organization id provided");

    const dbData = await DatabaseConnector.query(
      `SELECT org.id_key AS org_key, obj.table_name AS tablename, obj.table_schema as tableschema, fld.name AS fldname, fld.type AS fldtype
      FROM organizations org LEFT OUTER JOIN objects obj ON org.id=obj.organization_id LEFT OUTER JOIN object_fields fld ON obj.id=fld.object_id
      WHERE obj.organization_id=$1`,
      orgId
    );

    if (dbData && dbData.length) {
      const orgSchema = new OrganizationSchema(orgId, dbData[0].org_key);
      dbData.forEach((row) => {
        const tableName = row["tablename"];
        let table = orgSchema.getTable(tableName);
        table ||= orgSchema.addTable(tableName, row["tableschema"]);
        // See if there's a value in either field. If one is set but not the other, addField will catch it
        if (row["fldname"] || row["fldtype"]) {
          table.addField(row["fldname"], row["fldtype"]);
        }
      });
      return orgSchema;
    }
    return undefined;
  }
}

export class SchemaTable {
  #name: string;
  #namespace: string | undefined;
  #mapFields: Map<string, SchemaField>;

  public constructor(name: string, namespace: string | undefined) {
    this.#name = name;
    this.#namespace = namespace;
    this.#mapFields = new Map<string, SchemaField>();
  }

  public get name() {
    return this.#name;
  }

  public get namespace() {
    return this.#namespace;
  }

  public addField(name: string, type: string): SchemaField {
    if (this.hasField(name))
      throw new Error(`Table already has field named "${name}"`);
    const fld: SchemaField = new SchemaField(name, type);
    this.#mapFields.set(name, fld);
    return fld;
  }

  public hasField(name: string): boolean {
    if (!name) throw new Error("No field name provided");
    return this.#mapFields.has(name);
  }

  public getAllFieldNames(): string[] {
    return Array.from(this.#mapFields.keys());
  }
}

export class SchemaField {
  #name: string;
  #type: string;

  public constructor(name: string, type: string) {
    if (!name) throw new Error("No field name provided");
    if (!type) throw new Error("No field type provided");

    this.#name = name;
    this.#type = type;
  }

  public get name() {
    return this.#name;
  }
  public get type() {
    return this.#type;
  }
}
