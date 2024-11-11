import TestMethod from "./test_method.js";
import Test from "./test.js";

export class TestError {
  public testName: string;
  public errorMessage: string;
  public stackTrace: string;
}

export class TestResult {
  public isSuccess: boolean;
  public testsRun: number;
  public testsFailed: number = 0;
  public errors: TestError[] | undefined;
  public elapsedSeconds: number;
}

export class TestMethodResult {
  #testMethod: TestMethod;
  #error: Error;
  #totalAssertions: number;
  #failedAssertions: number;

  constructor(testMethod: TestMethod, err: Error = undefined) {
    if (!testMethod) throw new Error('No test method provided');
    if (!(testMethod instanceof TestMethod)) throw new Error('The provided test method is not a TestMethod object');
    this.#testMethod = testMethod;
    this.#error = err;
    this.#totalAssertions = Test.totalAssertions;
    this.#failedAssertions = Test.failedAssertions;
    }

  public get method(): TestMethod { return this.#testMethod; }
  public get error(): Error { return this.#error; }
  public get totalAssertions(): number { return this.#totalAssertions; }
  public get failedAssertions(): number { return this.#failedAssertions; }
}

export class TestGroupResult {
  #testCount: number = 0;
  #errorCount: number = 0;
  #methodResults: TestMethodResult[] = [];

  public constructor(methodResults: TestMethodResult[] | undefined = undefined) {
    this.#methodResults = methodResults;
  }

  public isError(): boolean {
    return this.#errorCount > 0;
  }

  public get errors(): number { return this.#errorCount; }
  public get tests(): number { return this.#testCount; }
  public get assertions(): number {
    return this.#methodResults.reduce((sum, val) => sum + val.totalAssertions, 0);
  }
  public get failedAssertions(): number {
    return this.#methodResults.reduce((sum, val) => sum + val.failedAssertions, 0);
  }

  public addTestResult(result: TestMethodResult): void
  {
    if (!this.#methodResults) this.#methodResults = [];
    if (!result) throw new Error('No test result provided');
    if (!(result instanceof TestMethodResult)) throw new Error('Provided test result is not a TestMethodResult object');
    this.#testCount++;
    if (result.error) this.#errorCount++;
    this.#methodResults.push(result);
  }

  public 
  public fullResults(): TestResult {
    const res: TestResult = new TestResult();
    res.isSuccess = true;
    res.testsRun = this.#methodResults.length;
    const errors: TestError[] = [];
    this.#methodResults.forEach(methodRes => {
      const err = methodRes.error;
      if (err) {
        const newErr = new TestError();
        newErr.testName = methodRes.method.methodName;
        newErr.errorMessage = err.message;
        newErr.stackTrace = err.stack;
        errors.push(newErr);
      }
    });
    if (errors.length) {
      res.isSuccess = false;
      res.testsFailed = errors.length;
      res.errors = errors;
    }
    return res;
  }
}