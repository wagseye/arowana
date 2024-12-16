import { validateSchema } from "./validation";
import { TrustedDatabaseInterface } from "database-interface";
import { init as schemaInit } from "./schema";

export init(dbConn: TrustedDatabaseInterface) {
    schemaInit(dbConn);
}

console.log(
  "Schema is valid: " +
    validateSchema({
      tables: [
        {
          name: "foo",
          fields: [
            {
              name: "foo",
              type: "string",
            },
            {
              name: "bar",
              type: "string",
            },
          ],
        },
        {
          name: "baz",
          fields: [
            {
              name: "baz",
              type: "string",
            },
            {
              name: "qux",
              type: "string",
            },
          ],
        },
      ],
    })
);
