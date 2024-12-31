import { DataObjectGenerator } from "json-schema";
import { expect } from "chai";

const dbSchema =
  // prettier-ignore
  {
      name: "User",
      namespace: "public",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
          { name: "lastName", db_name: "last_name", type: "string", required: true, },
      ]
  };

const User = DataObjectGenerator.generateClass(dbSchema);
let query = User.select(User.FirstName)
  .where(User.LastName.equals("Wagner"))
  .toJSON();
describe("Select Query", () => {
  it("should generate a select query", () => {
    expect(query).to.deep.equal({
      type: "select",
      table: "users",
      where: { left: "lasttName", operator: "=", right: "Wagner" },
    });
  });
});
