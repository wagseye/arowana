import DatabaseInterface, { QueryResponse } from "database-interface";

let lastQuery: object | undefined;
let response: QueryResponse | undefined;

export default class DatabaseConnector implements DatabaseInterface {
  public setResponse(resp: QueryResponse): void {
    response = resp;
  }

  public getLastQuery(): object | undefined {
    return lastQuery;
  }

  public query(query: object): Promise<QueryResponse> {
    lastQuery = query;
    // @ts-ignore  (Here we can't be sure response is set but I don't want to change the interface to accommodate it)
    return response;
  }
}
