import fs from "fs";
import path from "path";
import MigrationStatus from "./migration_status.mjs";
import { TestMethod, TestGroup, TestGroupResult } from "testing";

export default class Migration {
  static #UP_FILE_NAME = "up.sql";
  static #DOWN_FILE_NAME = "down.sql";
  static #TEST_FOLDER = "tests";
  static #db;
  static #testsConfigured: boolean = false;

  public static async up(db: unknown, dir: string, migrationName: string) {
    const fullFileName = this.getMigrationFileName(
      dir,
      migrationName,
      this.#UP_FILE_NAME
    );
    MigrationStatus.addUpMigration(migrationName);
    const result = await this.runMigration(db, fullFileName);
    const res: TestGroupResult = await this.runTests(db, dir, migrationName);
    if (res) {
      console.trace(
        `Tests complete: tests: ${res.tests} | errors: ${res.errors} | assertions: ${res.assertions} (${res.failedAssertions} failed)`
      );
      if (res.isError()) {
        throw new Error(`${res.errors} of ${res.tests} migration tests failed`);
      }
    }
    return result;
  }

  public static async down(db: any, dir: string, migrationName: string) {
    const fullFileName = this.getMigrationFileName(
      dir,
      migrationName,
      this.#DOWN_FILE_NAME
    );
    MigrationStatus.addDownMigration(migrationName);
    return await this.runMigration(db, fullFileName);
  }

  public static async query(query: string) {
    console.log("################## We're not supposed to be here!");
    if (!this.#db) {
      throw new Error(
        "No database connection. Are you trying to call runSql outside of a migration test file?"
      );
    }
    const res = await this.#db.runSql(query);
    return res.rows;
  }

  public static async runTests(
    dbConn: unknown,
    dir: string,
    migrationName: string
  ): TestGroupResult {
    await this.configureDatabase(dbConn);
    const testGroup: TestGroup = await this.loadTests(dir, migrationName);
    if (testGroup && testGroup.testCount) {
      return await testGroup.runTests();
    }
  }

  private static async loadTests(
    dir: string,
    migrationName: string
  ): Promise<TestGroup> {
    const testGroup: TestGroup = new TestGroup();
    const testFolder = this.getMigrationFileName(
      dir,
      migrationName,
      this.#TEST_FOLDER
    );
    if (!fs.existsSync(testFolder)) {
      console.log("No tests folder located, skipping");
      return null;
    }

    const testFiles = fs
      .readdirSync(testFolder, { withFileTypes: true })
      .filter((f) => !f.isDirectory() && path.extname(f.name) === ".mjs")
      .map((f) => f.name);
    for (const fileName of testFiles) {
      {
        const fullPath = path.join(testFolder, fileName);
        console.log("Attempting to load " + fullPath);
        const mod = await import(fullPath);
        const defaultExport = mod.default;
        if (!defaultExport) {
          throw new Error(`Test file ${fileName} has no default export`);
        }
        console.log("Found test class: " + defaultExport.name);
        console.log(
          `All props: ${JSON.stringify(
            Object.getOwnPropertyNames(defaultExport)
          )}`
        );
        const testNames = Object.getOwnPropertyNames(defaultExport).filter(
          (p) =>
            typeof defaultExport[p] === "function" &&
            p.toLowerCase().startsWith("test")
        );
        if (testNames && testNames.length) {
          const testClass = new TestGroup();
          testClass.name = defaultExport;
          testClass.fileName = fileName;
          testClass.fullPath = testFolder;
          testClass.testFunctions = testNames.forEach((methodName) => {
            testGroup.addTestMethod(new TestMethod(defaultExport, methodName));
          });
        }

        return testGroup;
      }
    }
  }

  private static async configureDatabase(dbConn: unknown) {
    if (!this.#testsConfigured) {
      // @ts-ignore
      // A bit of a hack to match the method name of our own db connection class
      dbConn.query = dbConn.runSql;
      console.log("Database: Attempting to load database module in DbMigrate");
      // The module name is defined separately from the import to avoid tsc compilation errors
      const module_name = "database-connector";
      const module = await import(module_name);
      let db = module.default;
      db.transactionType = module.ExternalTransaction;
      db.connection = dbConn;
      this.#db = db;

      this.#testsConfigured = true;
    }
  }

  private static getMigrationFileName(
    parentDir: string,
    migrationDir: string,
    name: string
  ) {
    return path.join(parentDir, migrationDir, name);
  }

  private static async runMigration(db: any, fullFileName: string) {
    console.log("Starting to run migration: " + fullFileName);
    const data = await this.readFile(fullFileName);
    //const val = await db.runSql(data);
    const result = await db.runSql(data);
    console.log("Finished running migration");
    return result;
  }

  private static async readFile(fullFileName: string) {
    return new Promise(function (resolve, reject) {
      fs.readFile(fullFileName, { encoding: "utf-8" }, function (err, data) {
        if (err) return reject(err);
        return resolve(data);
      });
    });
  }
}
