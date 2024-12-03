export default class QueryFormatter
{
  public static toSQL(query: object): string {
    if (query["type"] === "select") return this.formatSelect(query);
    throw new Error(`Queries of type "${query["type"]}" not supported`);
  }

  private static formatSelect(query: object): string {
    // TODO: a bunch of validation
    let sql = `SELECT ${this.retrieveRequiredField(query, "fields")} FROM ${this.retrieveRequiredField(query, "from")}`;

    const where = this.buildWhereClauseRecursive(query["where"], false);
    if (where) sql += ` WHERE ${where}`;

    const orderBy = this.buildOptionalClause(query, "orderBy", "ORDER BY");
    if (orderBy) sql += ` ${orderBy}`;

    const limit = this.buildOptionalClause(query, "limit", "LIMIT");
    if (limit) sql += ` ${limit}`;

    return sql;
  }

  private static retrieveRequiredField(query: object, fldName: string): unknown {
    if (!(fldName in query)) throw new Error(`Query is missing required attribute "${fldName}"`);
    let value = query[fldName];
    if (value instanceof Array) value = value.join(', ');
    return value;
  }

  private static buildOptionalClause(query: object, fldName: string, keyword: string): unknown | undefined {
    if (!(fldName in query)) return null;
    let value = query[fldName];
    if (!value) return null;

    if (value instanceof Array) value = value.join(', ');
    return `${keyword} ${value}`;
  }

  private static buildWhereClauseRecursive(condition: object, useQuotes: boolean = false): string {
    console.log('In recursive func, object=' + JSON.stringify(condition));
    if (!condition) return "";
    const type = typeof condition;
    if (type !== "object") {
      if ((typeof condition === "string") && useQuotes) {
        return `'${condition}'`;
      }
      return condition.toString();
    }

    const operator: string = condition["operator"]?.toUpperCase();
    if (!operator) throw new Error('Found a conditional expression without an operator');
    const isBooleaan = !!operator.match('^(AND|OR)$');
    const isComparison = !!operator.match('^[<>=]+$');

    // Some where clauses might not have all items set so we need to filter out unset values before rendering text
    let elements: string[] = [];
    elements.push(this.buildWhereClauseRecursive(condition["left"], false));
    if (condition["operator"]) elements.push(condition["operator"]);
    elements.push(this.buildWhereClauseRecursive(condition["right"], true));
    elements = elements.filter(element => !!element);
    if (isComparison) return `${elements.join('')}`; // No parentheses, no spaces
    if (isBooleaan) return `(${elements.join(' ')})`; // Parentheses, spaces
    return `${elements.join(' ')}`; // No parentheses, spaces
  }
}