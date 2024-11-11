"use strict";
import TestMethod from "./test_method.js"


export class TestMethodMapper {
  static #mapTestMethods = new Map();

  static getTestMethods(tests: string | string[] | undefined): TestMethod[] {
    if (tests) throw new Error('Specifying tests has not been implemented yet');
    const classes = Array.from(this.#mapTestMethods.keys());
    console.log(`classes: ${classes.length}`);
    const testMethods: TestMethod[] = [];
    classes.forEach((cls) => {
      const classMethods = this.#mapTestMethods.get(cls);
      console.log(`classMethods: ${classMethods.length}`);
      classMethods.forEach((methodName) => {
        testMethods.push(new TestMethod(cls, methodName));
      });
    });
    return testMethods;
  }

  // TODO: fix 'any' type here
  static addTestMethod(proto: any, method: string) {
    let methods: string[] = this.#mapTestMethods.get(proto);
    if (!methods) {
      methods = [];
      this.#mapTestMethods.set(proto, methods);
    }
    methods.push(method);
  }

  static setClass(proto: any) {
    const methods = this.#mapTestMethods.get(proto);
    console.log(`In setClass, found ${methods?.length} test methods`);
  }
}

export function testClass(target: any, propertyKey: any, descriptor?: any) {
  console.log(
    `In testClass function: ${JSON.stringify(target)}, ${target}, ${
      target.name
    }, ${
      Object.getPrototypeOf(target).name
    } (${typeof target}) / ${JSON.stringify(propertyKey)} / ${JSON.stringify(
      descriptor
    )}`
  );
  TestMethodMapper.setClass(target);
}

export function testMethod(target: any, propertyKey: any, descriptor?: any) {
  console.log(
    `In testMethod function: ${JSON.stringify(
      target
    )} (${typeof target}) / ${JSON.stringify(propertyKey)} / ${JSON.stringify(
      descriptor
    )}`
  );
  if (!target) return;
  // For static values, target is the class constructor
  const isStatic = typeof target === "function";
  const isMethod = descriptor ? true : false;
  /*
  console.log(`testMethod: isStatic=${isStatic} isMethod=${isMethod}`);
  const proto = Object.getPrototypeOf(target);
  console.log(`proto: ${JSON.stringify(Object.getPrototypeOf(target))}`);
  console.log("Attempting to call static method on class");
  target[propertyKey]();
  */
  TestMethodMapper.addTestMethod(target, propertyKey);
  /*
    let arr = mapFieldNames.get(target);
    console.log(`Array for ${target.name}: ${JSON.stringify(arr)}`);
    if (!arr) {
      arr = [];
      mapFieldNames.set(target, arr);
    }
    arr.push(propertyKey);
    */
}
