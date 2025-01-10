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
      test_scope: "deletequery",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
      ]
  };
const response =
  // prettier-ignore
  { "rows": [
    {  "id": "00100abcdefghij", "first_name": "John" },
    {  "id": "00200abcdefghij", "first_name": "Bob" },
    {  "id": "00300abcdefghij", "first_name": "Frank" }
  ]};

const User = DataObjectGenerator.generateClass(dbSchema);

describe("Delete Query", () => {
  const user1 = new User({ id: "00100abcdefghij", firstName: "John" });
  const user2 = new User({ id: "00200abcdefghij", firstName: "Bob" });
  const user3 = new User({ id: "00300abcdefghij", firstName: "Frank" });

  // prettier-ignore
  describe("a single record", () => {
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
      let user = user1.clone();
      let results = await User.delete(user);

      expect(dbStub).to.have.been.calledWith(
        // prettier-ignore
        { type: "delete", table: "users", records: [{ where: {left: "id", operator: "=", right: "00100abcdefghij"}}] }
      );
    });

    it("should not return anything", async () => {
      let results = await User.delete(user1.clone());
      expect(results).to.not.exist;
    });

    it("throws an error if the record does not have an id", async () => {
      const user = user1.clone();
      user.id = null;
      await expect(User.delete(user)).to.be.eventually.rejected;
    });
  });

  describe("multiple records", async () => {
    // Sinon setup
    let dbStub;
    beforeEach(function () {
      // prettier-ignore
      dbStub = sinon.stub(db.__proto__, "query").returns({...response, rows: response.rows.slice(0,2) });
    });
    afterEach(function () {
      dbStub.restore();
    });

    describe("deleted as separate parameters", () => {
      it("should run the correct query", async () => {
        let results = await User.delete(user1.clone(), user2.clone());
        expect(dbStub).to.have.been.calledWith(
          // prettier-ignore
          { type: "delete", table: "users", records: [{ where: {left: "id", operator: "=", right: "00100abcdefghij"}}, { where: {left: "id", operator: "=", right: "00200abcdefghij"}}] }
        );
      });
    });

    describe("deleted as a list", () => {
      it("should run the correct query", async () => {
        let results = await User.delete([user1.clone(), user2.clone()]);
        expect(dbStub).to.have.been.calledWith(
          // prettier-ignore
          { type: "delete", table: "users", records: [{ where: {left: "id", operator: "=", right: "00100abcdefghij"}}, { where: {left: "id", operator: "=", right: "00200abcdefghij"}}] }
        );
      });
    });

    // This hopefully captures the mixed behaviour for update and insert queries as well
    describe("deleted as a mix", () => {
      it("should run the correct query", async () => {
        dbStub.returns(response);
        let results = await User.delete(
          [user1.clone(), user2.clone()],
          user3.clone()
        );
        expect(dbStub).to.have.been.calledWith(
          // prettier-ignore
          { type: "delete", table: "users", records: [{ where: {left: "id", operator: "=", right: "00100abcdefghij"}},
              { where: {left: "id", operator: "=", right: "00200abcdefghij"}},
              { where: {left: "id", operator: "=", right: "00300abcdefghij"}}] }
        );
      });
    });

    describe("With duplicate records to delete", () => {
      it("throws an error", async () => {
        await expect(User.delete(user1.clone(), user1.clone())).to.be.eventually
          .rejected;
      });
    });
  });

  describe("invalid database response", async () => {
    // Sinon setup
    let dbStub;
    beforeEach(function () {
      // prettier-ignore
      dbStub = sinon.stub(db.__proto__, "query").returns({});
    });
    afterEach(function () {
      dbStub.restore();
    });

    describe("an empty response", () => {
      it("should fail gracefully", async () => {
        await expect(User.delete(user1.clone())).to.be.eventually.rejected;
      });
    });
  });
});
