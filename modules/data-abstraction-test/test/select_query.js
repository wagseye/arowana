import { DataObjectGenerator } from "json-schema";
import { expect } from "chai";

const dbSchema =
  // prettier-ignore
  {
      name: "User",
      db_name: "users",
      namespace: "public",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
          { name: "lastName", db_name: "last_name", type: "string", required: true, },
      ]
  };
const User = DataObjectGenerator.generateClass(dbSchema);

describe("Select Query", () => {
  describe("select fields", () => {
    describe("provided a string", () => {
      it("should list the specified field", () => {
        const query = User.select("firstName");
        expect(query.toJSON()["fields"]).to.deep.equal(["firstName"]);
      });
    });

    describe("provided a DbObjectField", () => {
      it("should list the specified field", () => {
        const query = User.select(User.FirstName);
        expect(query.toJSON()["fields"]).to.deep.equal(["firstName"]);
      });
    });

    describe("multiple select fields specified as separate arguments", () => {
      it("should list the specified fields", () => {
        const query = User.select(User.FirstName, User.LastName);
        expect(query.toJSON()["fields"]).to.deep.equal([
          "firstName",
          "lastName",
        ]);
      });
    });

    describe("mixed select fields specified as separate arguments", () => {
      it("should list the specified fields", () => {
        const query = User.select("firstName", User.LastName);
        expect(query.toJSON()["fields"]).to.deep.equal([
          "firstName",
          "lastName",
        ]);
      });
    });

    describe("multiple select fields specified in a list", () => {
      it("should list the specified fields", () => {
        const query = User.select([User.FirstName, User.LastName]);
        expect(query.toJSON()["fields"]).to.deep.equal([
          "firstName",
          "lastName",
        ]);
      });
    });

    describe("mixed select fields specified in a list", () => {
      it("should list the specified fields", () => {
        const query = User.select(["firstName", User.LastName]);
        expect(query.toJSON()["fields"]).to.deep.equal([
          "firstName",
          "lastName",
        ]);
      });
    });

    describe("multiple select fields specified separately", () => {
      it("should list the specified fields", () => {
        const query = User.select(User.FirstName).select(User.LastName);
        expect(query.toJSON()["fields"]).to.deep.equal([
          "firstName",
          "lastName",
        ]);
      });
    });

    describe("no select fields", () => {
      it("should specify * fields", () => {
        expect(User.select().toJSON()["fields"]).to.equal("*");
      });
    });
  });
});
