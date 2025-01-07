"use strict";

const OBJECT_PREFIX_WIDTH = 2;
const API_VERSION_WIDTH = 1;
const ORGANIZATION_WIDTH = 4;
const UNIQUE_ID_WIDTH = 7;

/*
The Id format is as follows:
  2 chars (1.3k) are object prefix
    Numeric starting characters are built-in objects
    Letter startings characters are custom objects
  1 chars (36) is API version
  4 chars (1.7M) are org id
  7 chars (78B) are uid
*/

export default class Id {
  #id: string;

  public static isId(val: string) {
    if (!(typeof val === "string")) return false;
    return new RegExp("[A-Za-z0-9]{15}").test(val);
  }

  constructor(id: string) {
    if (!Id.isId(id)) throw new Error(`Invalid id: ${id}`);

    this.#id = id;
  }

  [Symbol.toPrimitive](hint) {
    return this.toString();
  }

  public toString(): string {
    return this.#id;
  }

  public getOrganizationId(): string {
    return this.#id.substring(0, OBJECT_PREFIX_WIDTH);
  }

  public getApiVersion(): string {
    const START = OBJECT_PREFIX_WIDTH;
    return this.#id.substring(START, START + API_VERSION_WIDTH);
  }

  public getOrganization(): string {
    const START = OBJECT_PREFIX_WIDTH + API_VERSION_WIDTH;
    return this.#id.substring(START, START + ORGANIZATION_WIDTH);
  }

  public getUniqueId(): string {
    const START = OBJECT_PREFIX_WIDTH + API_VERSION_WIDTH + ORGANIZATION_WIDTH;
    return this.#id.substring(START, START + UNIQUE_ID_WIDTH);
  }
}
