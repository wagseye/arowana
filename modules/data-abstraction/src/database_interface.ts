"use strict";

export default interface DatabaseInterface {
  query(queryText: string): Promise<{ [index: string]: any }[]>;
  startTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}
