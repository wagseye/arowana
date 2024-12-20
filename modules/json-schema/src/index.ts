import { validateSchema } from "./validation";
import { TrustedDatabaseInterface } from "database-interface";
import { init as schemaInit, TableSchema, FieldSchema } from "./schema";
import DataObjectGenerator from "./data_object_generator";

export function init(dbConn: TrustedDatabaseInterface) {
  schemaInit(dbConn);
}
const dbSchema =
  // prettier-ignore
  {
    tables: [
        {
            name: "Organization",
            fields: [
                { name: "name", type: "string", },
                { name: "createdAt", db_name: "created_at", type: "datetime" }
            ],
        },
        {
            name: "User",
            namespace: "public",
            fields: [
                { name: "firstName", db_name: "first_name", type: "integer", required: true, },
                { name: "lastName", db_name: "last_name", type: "integer", required: true, },
                { name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
            ]
    },
  ]};

console.log("Schema is valid: " + validateSchema(dbSchema));

//const tableSchema = new TableSchema("Person", null);
//tableSchema.fields.push(new FieldSchema("id", "id", "id", true));
//tableSchema.fields.push(new FieldSchema("firstName", "first_name", "string"));
//tableSchema.fields.push(new FieldSchema("lastName", "last_name", "string"));
let objMap = DataObjectGenerator.generateClasses(dbSchema);
const User = objMap["User"] as new () => any;
const Organization = objMap["Organization"] as new () => any;
let usr = new User();
let org = new Organization();

import inspect from "object-inspect";
console.log(`User object: ${inspect(User)}`);
console.log(`Organization object: ${inspect(Organization)}`);

console.log(
  "User Query: " +
    JSON.stringify(
      User.select()
        .where(User.firstName.equals(["Eric", "Reed", "Bryce"]))
        .where(User.lastName.equals("Wagner"))
    )
);
/*
console.log(
  `Person proto: ${JSON.stringify(
    Object.getOwnPropertyNames(Person.prototype)
  )}`
);
console.log(`Person proto.proto: ${Object.getPrototypeOf(Person)}`);
console.log(`Person instance: ${inspect(b)}`);
b.firstName = "Eric";
b.lastName = "Wagner";
console.log("New Person: " + JSON.stringify(b));
*/
/*
console.log(
  `User prototype: ${Object.getPrototypeOf(User)},
  DynUser: ${Object.getPrototypeOf(DynUser)},
  equal: ${Object.getPrototypeOf(User) === Object.getPrototypeOf(DynUser)}`
);
console.log(
  `User prototype: ${Object.getPrototypeOf(User)},
    DynUser: ${Object.getPrototypeOf(DynUser)},
    equal: ${Object.getPrototypeOf(User) === Object.getPrototypeOf(DynUser)}`
);

console.log("New class: " + b.class);
console.log("Class full name: " + DynUser.fullName);
console.log("Instance full name: " + b.fullName);
b.age = 10;
console.log(`Current age: ${b.age}`);
b.age = 15;
console.log(`Current age: ${b.age}`);
console.log(`id property: ${DynUser.id}`);
b.id = "001100010gkf63s";
console.log(`Current id: ${b.id}`);

let c = User.newInstance();
console.log("New User instance: " + inspect(c));

let d = DynUser.newInstance();
console.log("New DynUser instance: " + inspect(d));
*/
