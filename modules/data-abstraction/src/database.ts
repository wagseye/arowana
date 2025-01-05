import DatabaseInterface from "./database_interface.js";
import Timer from "./timer.js";

export default class Database {
  static #connection: DatabaseInterface;

  public static async startTransaction(): Promise<void> {
    this.connectClient();
    await this.#connection.startTransaction();
  }

  public static async commitTransaction(): Promise<void> {
    this.connectClient();
    await this.#connection.commitTransaction();
  }

  public static async rollbackTransaction(): Promise<void> {
    this.connectClient();
    await this.#connection.rollbackTransaction();
  }
  /*
  private static async runQuery(q: string): Promise<any>
  {
    if (!this.#database) {
      await this.loadDatabase();
    }
    if (this.#database)
    {
      return await this.#database.query(q);
    }
  }
*/
  static async connectClient() {
    if (!this.#connection) {
      try {
        // The module name is defined separately from the import to avoid tsc compilation errors
        console.log("Database: Attempting to load database module");
        const module_name = "database-connector";
        const t: Timer = new Timer().start();
        const { default: DatabaseConnection } = await import(module_name);
        console.log(`Loaded module in ${t.stop().elapsedTime()}`);
        this.#connection = new DatabaseConnection();
      } catch (ex: unknown) {
        if (ex instanceof Error) {
          console.log(
            `Database: Unable to load database module: ${ex.message}`
          );
        } else {
          console.log("Database: Unable to load database module");
        }
      }
    }
    console.log("Database: Exiting loadDatabase");
  }
}
