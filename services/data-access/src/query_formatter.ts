import format from "pg-format";
import OrganizationSchema, { SchemaTable } from "./org_schema";

export default abstract class QueryFormatter {
  static #standardAttributes = Object.freeze(
    new Set<string>(["type", "table"])
  );
  #query: object;
  #tableSchema: SchemaTable | undefined;

  abstract toSql(): string | string[];

  protected constructor(query: object, orgSchema: OrganizationSchema) {
    if (!query) throw new Error("No query provided");
    this.#query = query;
    if (!orgSchema) throw new Error("No organization schema provided");
    const tableName = query["table"];
    if (!tableName) throw new Error("Query does not specify a table");
    if (!this.validateIdentifier(tableName))
      throw new Error(`Invalid table name: ${tableName}`);
    this.#tableSchema = orgSchema.getTable(tableName);
    if (!this.#tableSchema) throw new Error(`Invalid table: ${tableName}`);
  }

  protected get query() {
    return this.#query;
  }

  protected formatTableName(tableName: string) {
    if (this.#tableSchema.namespace)
      return `${this.#tableSchema.namespace}.${this.#tableSchema.name}`;
    return this.#tableSchema.name;
  }

  protected hasField(fldName: string): boolean {
    return this.#tableSchema.hasField(fldName);
  }

  protected getAllFields(): string[] {
    return this.#tableSchema.getAllFieldNames();
  }

  protected validateIdentifier(name: string): boolean {
    return (
      name && typeof name === "string" && !!name.match(/^[a-z][a-z0-9_]*$/)
    );
  }

  protected validateQueryComponents(
    query: object,
    required: Set<string>,
    optional: Set<string>
  ) {
    const queryKeys: Set<string> = new Set();
    Object.keys(query).forEach((key) => {
      if (
        !QueryFormatter.#standardAttributes.has(key) &&
        (!required || !required.has(key)) &&
        (!optional || !optional.has(key))
      ) {
        throw new Error(`Invalid query component: "${key}"`);
      }
      queryKeys.add(key);
    });
    required.forEach((key) => {
      if (!queryKeys.has(key))
        throw new Error(`Query is missing required component: ${key}`);
    });
  }

  protected substituteSanitizedValue(
    template: string,
    value: string | number | Date | (string | number | Date)[]
  ): string {
    if (value instanceof Array) {
      return format(template, ...value); // format expects multiple arguments, not an array of values so we spread it here
    }
    return format(template, value);
  }

  protected formatFieldList(clause: unknown): string {
    if (clause) {
      let fieldList = clause instanceof Array ? clause : Object.keys(clause);
      if (!(fieldList instanceof Array))
        throw new Error(
          "Could not extract the field list from the query clause"
        );
      fieldList.forEach((fld: string) => {
        if (!fld || !this.validateIdentifier(fld) || !this.hasField(fld))
          throw new Error(`Invalid field: ${fld}`);
      });
      return fieldList.join(", ");
    }
    return "";
  }

  protected formatValueList(clause: object): string {
    if (clause) {
      if (typeof clause !== "object")
        throw new Error("Unexpected type passed to formatValueList");
      let values: any[] = Object.values(clause);
      let template = new Array(values.length).fill("%L").join(", ");
      return this.substituteSanitizedValue(template, values);
    }
    return "";
  }

  protected formatFieldAndValueList(clause: object): string {
    if (clause) {
      if (typeof clause !== "object")
        throw new Error("Unexpected type passed to formatValueList");
      const templates: any[] = [];
      const values: any[] = [];
      Object.keys(clause).forEach((fldName) => {
        if (
          !fldName ||
          !this.validateIdentifier(fldName) ||
          !this.hasField(fldName)
        )
          throw new Error(`Invalid field: ${fldName}`);
        templates.push(`${fldName}=%L`);
        values.push(clause[fldName]);
      });
      return this.substituteSanitizedValue(templates.join(", "), values);
    }
    return "";
  }

  protected validateIdSpefication(clause: object): boolean {
    if (!clause) return false;
    const keys = Object.keys(clause);
    if (!keys) return false;
    if (keys.length != 3) return false;

    if (!("left" in clause)) return false;
    if (clause["left"] !== "id") return false;

    if (!("operator" in clause)) return false;
    if (clause["operator"] !== "=") return false;

    if (!("right" in clause)) return false;
    const right = clause["right"];
    if (typeof right !== "string") return false;
    if (!new RegExp("^[0-9a-zA-Z]{15}$").test(right)) return false;

    return true;
  }

  protected formatFilters(condition: object): string {
    return this.formatFiltersRecursive(condition);
  }

  private formatFiltersRecursive(condition: object): string {
    if (!condition) return undefined;
    const elements: string[] = [];

    // Analyze each element individually. If we're down to just strings, we need to make sure "left" is a valid field and
    // "right" is sanitized. If we're not yet looking at strings, process the values recursively.
    const left = condition["left"];
    if (!left) throw new Error("All conditions must provide a left expression");
    if (typeof left !== "object") {
      if (typeof left !== "string")
        throw new Error("Left expression must be a string");
      if (!this.hasField(left)) throw new Error(`Unknown field: ${left}`);
      elements.push(left);
    } else {
      elements.push(this.formatFiltersRecursive(left));
    }

    const operator: string = condition["operator"];
    if (!operator) throw new Error("All conditions must provide an operator");
    elements.push(operator);

    const right = condition["right"];
    if (right) {
      if (typeof right !== "object") {
        elements.push(this.substituteSanitizedValue("%L", right));
      } else {
        elements.push(this.formatFiltersRecursive(right));
      }
    }

    // If we're looking at a comparison expression, format it without parentheses or spaces
    if (new RegExp("^[<>=(!=)]+$").test(operator)) {
      return `${elements.join("")}`;
    }
    // If it's a boolean expression, format it with parentheses and spaces
    if (new RegExp("^(AND|OR)$").test(operator)) {
      return `(${elements.join(" ")})`;
    }
    // Otherwise, format with spaces but no parentheses
    return `${elements.join(" ")}`;
  }
}

export class SelectQueryFormatter extends QueryFormatter {
  static #requiredAttributes = Object.freeze(new Set<string>(["fields"]));
  static #optionalAttributes = Object.freeze(
    new Set<string>(["where", "orderBy", "limit"])
  );

  public constructor(query: object, orgSchema: OrganizationSchema) {
    if (query["type"] !== "select") throw new Error("Incorrect query type");
    super(query, orgSchema);
  }

  public toSql(): string {
    const query = this.query;
    this.validateQueryComponents(
      query,
      SelectQueryFormatter.#requiredAttributes,
      SelectQueryFormatter.#optionalAttributes
    );

    let fields = query["fields"];
    if (fields.includes("*")) {
      // Since this service should only be used by untrusted queries, instead of retrieving all fields when * is
      // specified, we only retrieve the fields specified in the org schema (so we could have hidden fields on the table)
      if (fields.length > 1) throw new Error("Invalid select fields");
      fields = this.getAllFields();
    } else {
      // Since id is always required to update or delete a record, make sure it is always queried
      if (!fields.includes("id")) fields.push("id");
    }

    let sql = `SELECT ${this.formatFieldList(
      fields
    )} FROM ${this.formatTableName(query["table"])}`;

    const where = this.formatFilters(query["where"]);
    if (where) sql += ` WHERE ${where}`;

    const orderBy = this.formatOrderBy(query["orderBy"]);
    if (orderBy) sql += ` ${orderBy}`;

    const limit = this.formatLimit(query["limit"]);
    if (limit) sql += ` ${limit}`;

    return sql;
  }

  private formatOrderBy(clause: object) {
    if (clause) {
      if (!(clause instanceof Array))
        throw new Error("Order by must be a list");
      let flds = [];
      clause.forEach((fld) => {
        const components: string[] = fld.split(" ");
        switch (components.length) {
          case 2:
            if (components[1].toUpperCase() != "DESC")
              throw new Error("Invalid format for ORDER BY");
          case 1:
            // Intentional fall through from above
            if (!this.hasField(components[0])) {
              throw new Error(`Invalid field: "${components[0]}"`);
            }
            flds.push(fld);
            break;
          default:
            throw new Error("Invalid format for ORDER BY");
        }
        return `ORDER BY ${flds.join(", ")}`;
      });
    }
    return undefined;
  }

  private formatLimit(clause: object) {
    if (clause) {
      if (typeof clause !== "number") throw new Error("Limit must be a number");
      return this.substituteSanitizedValue("LIMIT %L", clause);
    }
    return undefined;
  }
}

export class InsertQueryFormatter extends QueryFormatter {
  static #requiredAttributes = Object.freeze(new Set<string>(["records"]));

  public constructor(query: object, orgSchema: OrganizationSchema) {
    if (query["type"] !== "insert") throw new Error("Incorrect query type");
    super(query, orgSchema);
  }

  public toSql(): string[] {
    const query = this.query;
    this.validateQueryComponents(
      query,
      InsertQueryFormatter.#requiredAttributes,
      null
    );
    const queries: string[] = [];
    const records = query["records"];
    if (!(records instanceof Array))
      throw new Error("Records element must specify an array");
    records.forEach((rec) => {
      // NB: this code assumes that Object.keys and Object.values will return fields in the same order
      const sql = `INSERT INTO ${this.formatTableName(
        query["table"]
      )} (${this.formatFieldList(rec)}) VALUES(${this.formatValueList(
        rec
      )}) RETURNING ${this.formatFieldList(this.getAllFields())}`;
      queries.push(sql);
    });
    return queries;
  }
}

export class UpdateQueryFormatter extends QueryFormatter {
  static #requiredAttributes = Object.freeze(new Set<string>(["records"]));

  public constructor(query: object, orgSchema: OrganizationSchema) {
    if (query["type"] !== "update") throw new Error("Incorrect query type");
    super(query, orgSchema);
  }

  public toSql(): string[] {
    const query = this.query;
    this.validateQueryComponents(
      query,
      UpdateQueryFormatter.#requiredAttributes,
      null
    );
    const queries: string[] = [];
    const records = query["records"];
    if (!(records instanceof Array))
      throw new Error("Records element must specify an array");
    records.forEach((rec) => {
      if (!this.validateIdSpefication(rec["where"]))
        throw new Error(
          'Updates must specify a "where" condition with an id for each record'
        );

      const sql = `UPDATE ${this.formatTableName(
        query["table"]
      )} SET ${this.formatFieldAndValueList(
        rec["updates"]
      )} WHERE (${this.formatFilters(
        rec["where"]
      )}) RETURNING ${this.formatFieldList(this.getAllFields())}`;
      queries.push(sql);
    });
    return queries;
  }
}

export class DeleteQueryFormatter extends QueryFormatter {
  static #requiredAttributes = Object.freeze(new Set<string>(["records"]));

  public constructor(query: object, orgSchema: OrganizationSchema) {
    if (query["type"] !== "delete") throw new Error("Incorrect query type");
    super(query, orgSchema);
  }

  public toSql(): string[] {
    const query = this.query;
    this.validateQueryComponents(
      query,
      DeleteQueryFormatter.#requiredAttributes,
      null
    );
    const queries: string[] = [];
    const records = query["records"];
    if (!(records instanceof Array))
      throw new Error("Records element must specify an array");
    records.forEach((rec) => {
      if (!this.validateIdSpefication(rec["where"]))
        throw new Error(
          'Updates must specify a "where" condition with an id for each record'
        );

      const sql = `DELETE FROM ${this.formatTableName(
        query["table"]
      )} WHERE (${this.formatFilters(
        rec["where"]
      )}) RETURNING ${this.formatFieldList(this.getAllFields())}`;
      queries.push(sql);
    });

    return queries;
  }
}
