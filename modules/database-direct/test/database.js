import pkg from "pg";
const { Client } = pkg;
import db from "../dist/database.js";

import * as chai from "chai";
import { expect } from "chai";
//import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";
//chai.use(chaiAsPromised);
chai.use(sinonChai);

const response =
  // prettier-ignore
  { "rows": [
  {  "id": "00100abcdefghij", "first_name": "John", "last_name": "Doe", "age": 30, }
]};

describe("Database connector", () => {
  // Sinon setup
  let dbStub;
  beforeEach(function () {
    // prettier-ignore
    dbStub = sinon.stub(db, "runSql").returns(response);
  });
  afterEach(function () {
    dbStub.restore();
  });

  describe("a select query", () => {
    const query =
      // prettier-ignore
      { "type": "select", "fields": "*", "table": "test",
        "where": {left: "id", operator: "=", right: "00100abcdefghij"}};

    it("should run the correct query", async () => {
      await db.query(query);
      expect(dbStub).to.have.been.calledOnce;
      expect(dbStub).to.have.been.calledWith(
        "SELECT * FROM test WHERE id='00100abcdefghij'"
      );
    });
  });

  describe("an insert query", () => {
    const query =
      // prettier-ignore
      { "type": "insert", "table": "test",
      "records": [{first_name: "John"},
                  {last_name: "Doe"}]};

    describe("with one record", () => {
      it("should run the correct query", async () => {
        await db.query({ ...query, records: [query["records"][0]] });
        expect(dbStub).to.have.been.calledOnce;
        expect(dbStub).to.have.been.calledWith(
          "INSERT INTO test (first_name) VALUES('John') RETURNING *"
        );
      });
    });

    describe("with two records", () => {
      it("should run the correct queries", async () => {
        await db.query(query);
        expect(dbStub).to.have.been.calledTwice;
        expect(dbStub).to.have.been.calledWith(
          "INSERT INTO test (first_name) VALUES('John') RETURNING *"
        );
        expect(dbStub).to.have.been.calledWith(
          "INSERT INTO test (last_name) VALUES('Doe') RETURNING *"
        );
      });
    });
  });

  describe("an update query", () => {
    const query =
      // prettier-ignore
      { "type": "update", "table": "test",
        "records": [{updates: {first_name: "John"}, where: {left: "id", operator: "=", right: "00100abcdefghij"}},
                  {updates: {last_name: "Doe"}, where: {left: "id", operator: "=", right: "00200abcdefghij"}} ]};

    describe("with one record", () => {
      it("should run the correct query", async () => {
        await db.query({ ...query, records: [query["records"][0]] });
        expect(dbStub).to.have.been.calledOnce;
        expect(dbStub).to.have.been.calledWith(
          "UPDATE test SET first_name='John' WHERE (id='00100abcdefghij') RETURNING *"
        );
      });
    });

    describe("with two records", () => {
      it("should run the correct queries", async () => {
        await db.query(query);
        expect(dbStub).to.have.been.calledTwice;
        expect(dbStub).to.have.been.calledWith(
          "UPDATE test SET first_name='John' WHERE (id='00100abcdefghij') RETURNING *"
        );
        expect(dbStub).to.have.been.calledWith(
          "UPDATE test SET last_name='Doe' WHERE (id='00200abcdefghij') RETURNING *"
        );
      });
    });
  });

  describe("a delete query", () => {
    const query =
      // prettier-ignore
      { "type": "delete", "table": "test",
        "records": [{where: {left: "id", operator: "=", right: "00100abcdefghij"}},
                    {where: {left: "id", operator: "=", right: "00200abcdefghij"}} ]};

    describe("with one record", () => {
      it("should run the correct query", async () => {
        await db.query({ ...query, records: [query["records"][0]] });
        expect(dbStub).to.have.been.calledOnce;
        expect(dbStub).to.have.been.calledWith(
          "DELETE FROM test WHERE (id='00100abcdefghij') RETURNING *"
        );
      });
    });

    describe("with two records", () => {
      it("should run the correct queries", async () => {
        await db.query(query);
        expect(dbStub).to.have.been.calledTwice;
        expect(dbStub).to.have.been.calledWith(
          "DELETE FROM test WHERE (id='00100abcdefghij') RETURNING *"
        );
        expect(dbStub).to.have.been.calledWith(
          "DELETE FROM test WHERE (id='00200abcdefghij') RETURNING *"
        );
      });
    });
  });
});
