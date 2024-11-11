import Test from "./test.js";
import { TestMethodResult, TestGroupResult, TestResult } from "./test_result.js";
import { TestMethodMapper } from "./test_decorators.js";


export default class TestMethod {
  static #database;

  #class: object;
  #methodName: string;
  #result: TestMethodResult | undefined;

  public static async runTests(tests: string | string[] | undefined = undefined): Promise<TestResult> {
    const testMethods = TestMethodMapper.getTestMethods(tests);
    const result: TestGroupResult = new TestGroupResult();
    const methodResults: TestMethodResult[] = [];
    for (const testMethod of testMethods) {
      const res = await testMethod.invoke();
      result.addTestResult(res);
    }
    return result.fullResults();
  }

  public get class(): object {
    return this.#class;
  }
  public get methodName(): string {
    return this.#methodName;
  }
  public get result(): TestMethodResult {
    return this.#result;
  }

  public constructor(cls: object, methodName: string) {
    this.#class = cls;
    this.#methodName = methodName;
  }

  public async invoke(): Promise<TestMethodResult> {
    if (!TestMethod.#database) { await this.loadDataModule(); }
    let res: TestMethodResult;
    try {
      await TestMethod.#database.startTransaction();
      Test.startTest();
      await this.#class[this.#methodName]();
    } catch (err: unknown) {
      console.log(`We caught a test error: ${JSON.stringify(err)}, stack: ${err["stack"]}`);
      if (err instanceof Error) {
        res = new TestMethodResult(this, err);
      } else {
        res = new TestMethodResult(this, new Error("Unknown error"));
      }
    } finally {
      Test.stopTest();
      await TestMethod.#database.rollbackTransaction();
    }
    if (!res) res = new TestMethodResult(this);
    this.#result = res;
    return this.#result;
  }

  private async loadDataModule() {
    if (TestMethod.#database) throw new Error('Data module already loaded');
    const module_name = "database-connector";
    const { default: Database } = await import(module_name);
    console.log('Loaded class: ' + Database.name);
    TestMethod.#database = Database;
  }
}

export class TestGroup {
  #tests: TestMethod[] = [];

  public get testCount() { return this.#tests.length; }
  public addTestMethod(test: TestMethod) {
    if (!test) throw new Error('No test provided');
    if (!(test instanceof TestMethod)) throw new Error('Test to be added must be a TestMethod');
    this.#tests.push(test);
  }

  public async runTests(): Promise<TestGroupResult>{
    const groupRes: TestGroupResult = new TestGroupResult();
    for (const test of this.#tests) {
      const res: TestMethodResult = await test.invoke();
      groupRes.addTestResult(res);
    }
    return groupRes;
  }
}