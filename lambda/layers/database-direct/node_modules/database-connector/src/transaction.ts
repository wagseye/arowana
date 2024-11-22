"use strict"

import DatabaseConnector from "./database.js";

export default interface Transaction {
  isOpen(): boolean;
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  end(): Promise<void>;
}

export class BasicTransaction implements Transaction{
  #isOpen: boolean = false;

  public isOpen(): boolean {
    return this.#isOpen;
  }

  public async start(): Promise<void> {
    if (this.isOpen()) throw new Error('This transaction is already open');
    try {
      console.log('Opening top-level transaction');
      await DatabaseConnector.runSql('START TRANSACTION');
      this.#isOpen = true;
    } catch(err) {
      let msg = (err instanceof Error) ? err.message : 'Unknown error';
      console.error(`Error starting transaction: ${msg}`);
    }
  }

  public async commit(): Promise<void> {
    if (!this.isOpen()) return;
    console.log('Committing top-level transaction');
    await DatabaseConnector.runSql('COMMIT TRANSACTION');
  }

  public async rollback(): Promise<void> {
    if (!this.isOpen()) return;
    console.log('Rolling back top-level transaction');
    await DatabaseConnector.runSql('ROLLBACK TRANSACTION');
  }

  // The "end" method is a single method that is meant to do all of the cleanup in case we are
  // done with the transaction entirely. This is mostly needed for nested transactions.
  public async end(): Promise<void> {
    await this.rollback();
  }
}

export class NestedTransaction extends BasicTransaction {
  static #SLUG_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  static #SLUG_LENGTH  = 8;

  #savepoints: string[] = [];
  #maxDepth: number = 2;

  public get depth() { return this.isOpen() ? (this.#savepoints.length + 1) : 0; }
  public get maxDepth() { return this.#maxDepth; }
  public set maxDepth(value: number) {
    if (this.isOpen()) throw new Error('maxDepth can not be set for an open transaction');
    if (!value) throw new Error('No value specified');
    if ((typeof value !== "number") || !Number.isInteger(value)) throw new Error('maxDepth must be an integer');
    this.maxDepth = value;
  }

  public async start(): Promise<void> {
    if (!this.isOpen()) {
      super.start();
    } else {
      if (this.#savepoints.length === (this.#maxDepth - 1)) throw new Error(`Maximum transaction depth of ${this.#maxDepth} has already been reached`);
      const spName = this.generateSavepointName();
      try {
        console.log('Creating savepoint ' + spName);
        await DatabaseConnector.runSql(`SAVEPOINT ${spName}`);
        this.#savepoints.push(spName);
      } catch(err) {
        let msg = (err instanceof Error) ? err.message : 'Unknown error';
        console.error(`Error creating savepoint: ${msg}`);
      }
    }
  }

  public async commit(): Promise<void> {
    if (!this.#savepoints.length) {
      super.commit();
      return;
    }
    else
    {
      const spName = this.#savepoints.pop();
      if (!spName) throw new Error('Store savepoint name is null!');
      try {
        console.log('Releasing savepoint ' + spName);
        await DatabaseConnector.runSql(`RELEASE SAVEPOINT ${spName}`);
     } catch (err) {
        let msg = (err instanceof Error) ? err.message : 'Unknown error';
        console.error(`Error releasing savepoint: ${msg}`);
      }
    }
  }

  public async rollback(): Promise<void> {
    if (!this.#savepoints.length) {
      super.commit();
      return;
    }
    else
    {
      const spName = this.#savepoints.pop();
      if (!spName) throw new Error('Store savepoint name is null!');
      try {
        console.log('Rolling back to savepoint ' + spName);
        await DatabaseConnector.runSql(`ROLLBACK TO SAVEPOINT ${spName}`);
       } catch (err) {
        let msg = (err instanceof Error) ? err.message : 'Unknown error';
        console.error(`Error rolling back to savepoint: ${msg}`);
      }
    }
  }

  public async end(): Promise<void> {
    let count = 0;
    while (this.#savepoints) {
      await this.rollback();
      count++;
      if (count >= this.#maxDepth) throw new Error('There was an error cleaning up the nested transaction');
    }
    super.end();
  }

  private generateSavepointName(): string {
    let slug = '';
    const charsLen = NestedTransaction.#SLUG_CHARSET.length;
    for (let i = 0; i < NestedTransaction.#SLUG_LENGTH; i++) {
        slug += NestedTransaction.#SLUG_CHARSET.charAt(Math.floor(Math.random() * charsLen));
    }
    return `${slug}_${Date.now()}`;
  }
}

export class ExternalTransaction extends NestedTransaction {
  public isOpen(): boolean { return true; }

  public async commit(): Promise<void> {
    if (this.depth < 1) throw new Error('Tried to commit an external transaction');
    await super.commit();
  }

  public async rollback(): Promise<void> {
    if (this.depth < 1) throw new Error('Tried to rollback an external transaction');
    await super.rollback();
  }

  public async end(): Promise<void> {
    let count: number = 0;
    // Rollback all savepoints, but don't run ROLLBACK on the top-level transaction
    while (this.depth > 1) {
      await super.rollback();
      count++;
      if (count > this.maxDepth) throw new Error('There was an error cleaning up the nested transaction');
    }
  }

}