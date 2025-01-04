export type DatabasePrimitive = string | number | Date;
export type QueryKeys = "type" | "table" | "where" | "order" | "limit";

export type Query = {
  [key in QueryKeys]: any;
};

export type SqlKeys = "rows" | "error" | "loading";
export type SqlResponse = {
  [key in SqlKeys]: any;
};
export type QueryResponse = {
  [index: string]: any;
}[];

export default interface DatabaseInterface {
  query(query: object): Promise<QueryResponse>;
}

export interface TrustedDatabaseInterface extends DatabaseInterface {
  runSql(
    sql: string,
    args: DatabasePrimitive | DatabasePrimitive[]
  ): SqlResponse;
  runQuery(
    sql: string,
    args: DatabasePrimitive | DatabasePrimitive[]
  ): QueryResponse;
}

export interface TestDatabaseInterface extends DatabaseInterface {
  setResponse(resp: object): void;
  getLastQuery(): object;
}
