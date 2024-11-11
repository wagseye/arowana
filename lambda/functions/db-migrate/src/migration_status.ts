export default class MigrationStatus {
  static #upMigrations: string[] = [];
  static #downMigrations: string[] = [];

  public static get upMigrations(): string[] {
    return this.#upMigrations;
  }

  public static get downMigrations(): string[] {
    return this.#downMigrations;
  }

  public static reset() {
    this.#upMigrations = [];
    this.#downMigrations = [];
  }

  public static addUpMigration(name: string) {
    this.#upMigrations.push(name);
  }

  public static addDownMigration(name: string) {
    this.#downMigrations.push(name);
  }
}
