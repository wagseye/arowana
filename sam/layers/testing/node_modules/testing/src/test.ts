export default class Test {
  static #isTestRunning: boolean = false;
  static #totalAssertions = 0;
  static #failedAssertions = 0;

  // TODO: ensure startTest and stopTest are not available outside of the module
  public static startTest() {
    this.#isTestRunning = true;
    this.#totalAssertions = 0;
    this.#failedAssertions = 0;
  }

  public static stopTest() {
    this.#isTestRunning = false;
  }

  public static isTestRunning() {
    return this.#isTestRunning
  }

  public static get totalAssertions() { return this.#totalAssertions; }
  public static get failedAssertions() { return this.#failedAssertions; }

  public static assert(expr: boolean, msg: string = undefined) {
    this.#totalAssertions++;
    if (!expr) {
      this.#failedAssertions++;
      throw new Error(msg || "An assertion failed");
    }
  }

  public static assertEquals<type>(
    val1: type,
    val2: type,
    msg: string = undefined
  ) {
    this.assert((val1 === val2), msg || `Expected value (${val1}) does not match real value (${val2})`);
  }

  public static assertNotEquals<type>(
    val1: type,
    val2: type,
    msg: string = undefined
  ) {
    this.assert((val1 !== val2), msg || `Expected value (${val1}) matches real value (${val2})`);
  }

  // These "equivalent" methods use the loose equality operators to allow automatic JS type conversions while comparing
  public static assertEquivalent<type>(
    val1: type,
    val2: type,
    msg: string = undefined
  ) {
    this.assert((val1 == val2), msg || `Expected value (${val1}) does not match real value (${val2})`);
  }

  public static assertNotEquivalent<type>(
    val1: type,
    val2: type,
    msg: string = undefined
  ) {
    this.assert((val1 != val2), msg || `Expected value (${val1}) matches real value (${val2})`);
  }

  public static assertIsNull<type>(val: type, msg: string = undefined) {
    this.assert((val === null) || (val === undefined), msg || `Value is supposed to be null`)
  }

  public static assertIsNotNull<type>(val: type, msg: string = undefined) {
    this.assert((val !== null) && (val !== undefined), msg || `Value is supposed to be not null`)
  }

  // isSet methods are distinct from isNull methods because in the future the methods can check values
  // based on type. For example: {string}.assertIsSet("") would throw an error. TODO
  public static assertIsSet<type>(val: type, msg: string = undefined) {
    this.assert((val !== null) && (val !== undefined), msg || `Value is supposed to be set`)
  }

  public static assertIsUnset<type>(val: type, msg: string = undefined) {
    this.assert((val === null) || (val === undefined), msg || `Value is supposed to be unset`)
  }

  public static async assertError(func: any, msg: string = undefined) {
    if (!func) throw new Error('No function provided for execution');
    if (typeof func !== "function") throw new Error('The first parameter must be a function to execute');
    let isError = false;
    try {
      await func();
    } catch (err) {
      isError = true;
    }
    this.assert(isError, msg || 'Expected an error to be thrown, but none was');
  }

  public static async assertNoError(func: any, msg: string = undefined) {
    if (!func) throw new Error('No function provided for execution');
    if (typeof func !== "function") throw new Error('The first parameter must be a function to execute');
    let isError = false;
    try {
      await func();
    } catch (err) {
      isError = true;
    }
    this.assert(!isError, msg || 'Expected no errors, but one was caught');
  }
}
