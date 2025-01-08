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
      test_scope: "updatequery",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
          { name: "lastName", db_name: "last_name", type: "string", required: true, },
          { name: "age", type: "number", },
          { name: "extra", type: "boolean", },
      ]
  };
const response =
  // Note that the "extra" property is added to the response. This is to verify that the records get repopulated by the update query
  // prettier-ignore
  { "rows": [
    {  "id": "00100abcdefghij", "first_name": "John", "last_name": "Doe", "age": 30, extra: true},
    {  "id": "00200abcdefghij", "first_name": "Bob", "last_name": null, "age": 45, extra: true }
  ]};

const User = DataObjectGenerator.generateClass(dbSchema);

describe("Update Query", () => {
  const user1 = new User(
    // prettier-ignore
    { id: "00100abcdefghij", firstName: "John", lastName: "Doe", age: 30, }
  );
  const user2 = new User(
    // prettier-ignore
    { id: "00200abcdefghij", firstName: "Bob", age: 45 }
  );
  const u2 = user1.clone();
  // prettier-ignore
  describe("a single record", () => {
    // Sinon setup
    let dbStub;
    beforeEach(function() {
      // prettier-ignore
      dbStub = sinon.stub(db.__proto__, "query").returns({...response, rows: [response.rows[0]] });
    });
    afterEach(function() {
      dbStub.restore();
    });

    it("should run the correct query", async () => {
      await User.update(user1.clone());
      expect(dbStub).to.have.been.calledWith(
        //prettier-ignore
        { type: "update", table: "users", records: [{ where: {left: "id", operator: "=", right: "00100abcdefghij"}, updates: { first_name: "John", last_name: "Doe", age: 30 }}] }
      );
    });

    it("should not return anything", async () => {
      let results = await User.update(user1.clone());
      expect(results).to.not.exist;
    });

    it("updates the original object", async () => {
      const user =user1.clone();
      await User.update(user);
      expect(user.toJSON()).to.deep.equal({ id: "00100abcdefghij", firstName: "John", lastName: "Doe", age: 30, extra: true});
    });

    it("throw an error if the record does not have an id", async () => {
      const user = new User(user1.clone());
      user.id = null;
      await expect(User.update(user)).to.be.eventually.rejected;
    });
  });

  describe("multiple records", () => {
    // Sinon setup
    let dbStub;
    beforeEach(function () {
      // prettier-ignore
      dbStub = sinon.stub(db.__proto__, "query").returns(response);
    });
    afterEach(function () {
      dbStub.restore();
    });

    describe("updated using separate parameters", async () => {
      it("should run the correct query", async () => {
        let results = await User.update(user1.clone(), user2.clone());
        expect(db.__proto__.query).to.have.been.calledWith(
          //prettier-ignore
          { type: "update", table: "users", records: [
            { where: {left: "id", operator: "=", right: "00100abcdefghij"}, updates: { first_name: "John", last_name: "Doe", age: 30 }},
            { where: {left: "id", operator: "=", right: "00200abcdefghij"}, updates: { first_name: "Bob", age: 45 }}
        ]}
        );
      });

      it("updates the original objects", async () => {
        const u1 = user1.clone();
        const u2 = user2.clone();
        await User.update(u1, u2);
        expect(u1.toJSON()).to.deep.equal(
          // prettier-ignore
          { id: "00100abcdefghij", firstName: "John", lastName: "Doe", age: 30, extra: true}
        );
        expect(u2.toJSON()).to.deep.equal(
          // prettier-ignore
          { id: "00200abcdefghij", firstName: "Bob", lastName: undefined, age: 45, extra: true}
        );
      });
    });

    describe("updated using a list", async () => {
      it("should run the correct query", async () => {
        let results = await User.update([user1.clone(), user2.clone()]);
        expect(db.__proto__.query).to.have.been.calledWith(
          //prettier-ignore
          { type: "update", table: "users", records: [
            { where: {left: "id", operator: "=", right: "00100abcdefghij"}, updates: { first_name: "John", last_name: "Doe", age: 30 }},
            { where: {left: "id", operator: "=", right: "00200abcdefghij"}, updates: { first_name: "Bob", age: 45 }}
        ]}
        );
      });

      it("updates the original objects", async () => {
        const u1 = user1.clone();
        const u2 = user2.clone();
        await User.update([u1, u2]);
        expect(u2.lastName).to.be.undefined;
        expect(u1.toJSON()).to.deep.equal(
          // prettier-ignore
          { id: "00100abcdefghij", firstName: "John", lastName: "Doe", age: 30, extra: true}
        );
        expect(u2.toJSON()).to.deep.equal(
          // prettier-ignore
          { id: "00200abcdefghij", firstName: "Bob", lastName: undefined, age: 45, extra: true}
        );
      });
    });

    describe("With duplicate records to update", () => {
      it("throws an error", async () => {
        await expect(User.update(user1.clone(), user1.clone())).to.be.eventually
          .rejected;
      });
    });
  });
});
