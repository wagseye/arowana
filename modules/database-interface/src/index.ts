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
  query(query: Query): Promise<QueryResponse>;
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

export interface UntrustedDatabaseInterface extends DatabaseInterface {
  set organizationId(string);
  set databaseToken(string);
  set databaseAddress(string);
  get transactionId(): string;
}

export interface TestDatabaseInterface extends DatabaseInterface {
  setResponse(resp: object): void;
  getLastQuery(): object;
}
