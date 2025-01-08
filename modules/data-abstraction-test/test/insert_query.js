import { DataObjectGenerator } from "json-schema";

import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(chaiAsPromised);
chai.use(sinonChai);

const db = new (await import("database-connector")).default();
const dbSchema =
  // prettier-ignore
  {
      name: "User",
      db_name: "users",
      test_scope: "insertquery",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
          { name: "lastName", db_name: "last_name", type: "string", required: true, },
          { name: "age", type: "number", },
      ]
  };
const response =
  // prettier-ignore
  { "rows": [
    {  "id": "00100abcdefghij", "first_name": "John", "last_name": "Doe", "age": 30, },
    {  "id": "00200abcdefghij", "first_name": "Bob", "last_name": null, "age": 45, }
  ]};

const User = DataObjectGenerator.generateClass(dbSchema);
//await Database.connectClient();

describe("Insert Query", () => {
  const user1 = new User({ firstName: "John", lastName: "Doe", age: 30 });
  const user2 = new User({ firstName: "Bob", age: 45 });
  // prettier-ignore
  describe("a single record", async () => {
    // Sinon setup
    let dbStub;
    beforeEach(function () {
      // prettier-ignore
      dbStub = sinon.stub(db.__proto__, "query").returns({...response, rows: [response.rows[0]] });
    });
    afterEach(function () {
      dbStub.restore();
    });
  

    it("should run the correct query", async () => {
      let results = await User.insert(user1.clone());
        expect(dbStub).to.have.been.calledWith(
        //prettier-ignore
        { type: "insert", table: "users", records: [{ first_name: "John", last_name: "Doe", age: 30 }] }
      );
    });

    it("should populate the old record", async () => {
      const user = user1.clone();
      let results = await User.insert(user);
        expect(user.toJSON()).to.deep.equal(
        // prettier-ignore
        { "id": "00100abcdefghij", "firstName": "John", "lastName": "Doe", "age": 30, }
      );
    });

    describe("inserting the same record twice", () => {
      const user = user1.clone();
      describe("the first insert", () => {
        it("should succeed", async () => {
          await expect(User.insert(user)).to.be.eventually.fulfilled;
        });
      });
      describe("the second insert", () => {
        it("should throw an error", async () => {
        await expect(User.insert(user)).to.be.eventually.rejected;
        });
      });
    });
});

  describe("multiple records", () => {
    let dbStub;
    beforeEach(function () {
      // prettier-ignore
      dbStub = sinon.stub(db.__proto__, "query").returns(response);
    });
    afterEach(function () {
      dbStub.restore();
    });

    describe("inserted using separate parameters", () => {
      it("should insert all records", async () => {
        await User.insert(user1.clone(), user2.clone());
        expect(dbStub).to.have.been.calledWith(
          // prettier-ignore
          { type: "insert", table: "users", records: [{ first_name: "John", last_name: "Doe", age: 30 }, { first_name: "Bob", age: 45 }] }
        );
      });

      it("should not return anything", async () => {
        let results = await User.insert(user1.clone(), user2.clone());
        expect(results).to.not.exist;
      });

      it("should populate the old records", async () => {
        const u1 = user1.clone();
        const u2 = user2.clone();

        await User.insert(u1, u2);
        expect(u1.toJSON()).to.deep.equal(
          // prettier-ignore
          { "id": "00100abcdefghij", "firstName": "John", "lastName": "Doe", "age": 30, }
        );
        expect(u2.toJSON()).to.deep.equal(
          // prettier-ignore
          { "id": "00200abcdefghij", "firstName": "Bob", "lastName": undefined, "age": 45, }
        );
      });
    });

    describe("inserted as a list", () => {
      it("should insert all records", async () => {
        await User.insert([user1.clone(), user2.clone()]);
        expect(dbStub).to.have.been.calledWith(
          // prettier-ignore
          { type: "insert", table: "users", records: [{ first_name: "John", last_name: "Doe", age: 30 }, { first_name: "Bob", age: 45 }] }
        );
      });
    });
  });
});
