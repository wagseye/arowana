import { DataObjectGenerator } from "json-schema";

import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const module_name = "database-connector";
const { default: DatabaseConnection } = await import(module_name);
const db = new DatabaseConnection();

const dbSchema =
  // prettier-ignore
  {
      name: "User",
      db_name: "users",
      namespace: "public",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
          { name: "lastName", db_name: "last_name", type: "string", required: true, },
          { name: "age", type: "number", },
      ]
  };
db.setResponse(
  // prettier-ignore
  { "rows": [
    {  "id": "a00aaaaaaaaaaaa", "first_name": "John", "last_name": "Doe", "age": 30, },
    {  "id": "a00aaaaaaaaaaab", "first_name": "Bob", "last_name": null, "age": 45, }
  ]}
);

const User = DataObjectGenerator.generateClass(dbSchema);
//await Database.connectClient();

describe("Insert Query", () => {
  // prettier-ignore
  describe("a single record", async () => {
    const user = new User();
    user.firstName = "John";
    user.lastName = "Doe";
    user.age = 30;
    let results =await User.insert(user);

    it("should run the correct query", async () => {
      expect(db.getLastQuery()).to.deep.equal(
        // prettier-ignore
        { type: "insert", table: "users", records: [{ first_name: "John", last_name: "Doe", age: 30 }] }
      );
    });

    it("should populate the old record", async () => {
      console.log(`User id: ${user.id} ${user.firstName} ${user.lastName} ${user.age}`);
      expect(user.toJSON()).to.deep.equal(
        // prettier-ignore
        { "id": "a00aaaaaaaaaaaa", "first_name": "John", "last_name": "Doe", "age": 30, }
      );
    });

    describe("inserting the same record twice", () => {
      it("should throw an error", async () => {
        await expect(User.insert(user)).to.be.eventually.rejected;
      });
    });
  });

  describe("multiple records", () => {
    const u1Props = { firstName: "John", lastName: "Doe", age: 30 };
    const u2Props = { firstName: "Bob", age: 45 };

    describe("inserted using separate parameters", () => {
      it("should insert all records", async () => {
        await User.insert(new User(u1Props), new User(u2Props));
        expect(db.getLastQuery()).to.deep.equal(
          // prettier-ignore
          { type: "insert", table: "users", records: [{ first_name: "John", last_name: "Doe", age: 30 }, { first_name: "Bob", age: 45 }] }
        );
      });

      it("should not return anything", async () => {
        let results = await User.insert(new User(u1Props), new User(u2Props));
        expect(results).to.not.exist;
      });

      it("should populate the old records", async () => {
        const user1 = new User(u1Props);
        const user2 = new User(u2Props);

        await User.insert(user1, user2);
        expect(user1.toJSON()).to.deep.equal(
          // prettier-ignore
          { "id": "a00aaaaaaaaaaaa", "first_name": "John", "last_name": "Doe", "age": 30, }
        );
        expect(user2.toJSON()).to.deep.equal(
          // prettier-ignore
          { "id": "a00aaaaaaaaaaab", "first_name": "Bob", "last_name": null, "age": 45, }
        );
      });
    });
  });
});
