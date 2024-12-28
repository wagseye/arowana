import { expect } from "chai";
import DataObjectGenerator from "../dist/data_object_generator.js";
import {
  DbObject,
  DbObjectStringField,
  DbObjectIntegerField,
  DbObjectNumberField,
  DbObjectDateField,
  DbObjectDateTimeField,
} from "data-abstraction";

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
                { name: "name", db_name: "name", type: "string", required: true, },
                { name: "age", db_name: "age", type: "integer", required: true, },
                { name: "amountPaid", db_name: "amount_paid", type: "number", required: true, },
                { name: "organizationId", type: "reference", foreignObject: "baz", foreignLookupField: "id", foreignRelationName: "foos" },
                { name: "createdOn", db_name: "created_on", type: "date" },
                { name: "modifiedAt", db_name: "modified_at", type: "datetime" },
            ]
        },
  ]};
const objTypes = DataObjectGenerator.generateClasses(dbSchema);
const Organization = objTypes["Organization"];
const User = objTypes["User"];

describe("generateClasses method", function () {
  it("creates exactly two classes", function () {
    expect(Object.keys(objTypes).length).to.equal(2);
  });

  it("creates an Organization class", function () {
    expect(Organization).to.exist;
  });

  it("creates a User class", function () {
    expect(User).to.exist;
  });
});

describe("Organization", function () {
  const org = new Organization();

  it("is an instance of DbObject", function () {
    expect(org).to.be.instanceOf(DbObject);
  });

  describe("class", function () {
    let props = Object.getOwnPropertyNames(Organization);
    const defaultProps = new Set(["length", "name", "prototype"]);
    props = props.filter((item) => !defaultProps.has(item));

    it('is named "Organization"', function () {
      expect(Organization.name).to.equal("Organization");
    });

    it("has a name property of type DbObjectStringField", function () {
      expect(Organization.Name).to.be.instanceOf(DbObjectStringField);
    });

    it("has a createdAt of type DbObjectDateTimeField property", function () {
      expect(Organization.CreatedAt).to.be.instanceOf(DbObjectDateTimeField);
    });
  });

  describe("instance", function () {
    const props = Object.getOwnPropertyNames(Object.getPrototypeOf(org));

    it("has exactly three own properties", function () {
      expect(props.length).to.equal(3);
    });

    describe("name property", function () {
      it("exists", function () {
        expect(props.includes("name")).to.be.true;
      });

      it("can be set", function () {
        org.name = "AnyCorp";
        //        expect((user.name = "Joe")).to.not.throw();
      });

      it("can be read", function () {
        expect(org.name).to.equal("AnyCorp");
      });
    });

    describe("createdAt property", function () {
      it("exists", function () {
        expect(props.includes("createdAt")).to.be.true;
      });

      const now = new Date();
      it("can be set", function () {
        org.createdAt = now;
      });

      it("can be read", function () {
        expect(org.createdAt).to.equal(now);
      });
    });
  });
});

describe("User", function () {
  describe("class", function () {
    let props = Object.getOwnPropertyNames(User);
    const defaultProps = new Set(["length", "name", "prototype"]);
    props = props.filter((item) => !defaultProps.has(item));

    it('is named "User"', function () {
      expect(User.name).to.equal("User");
    });

    it("has exactly seven own properties", function () {
      expect(props.length).to.equal(7);
    });

    it("has a name property of type DbObjectStringField", function () {
      expect(User.Name).to.be.instanceOf(DbObjectStringField);
    });

    it("has an age property of type DbObjectIntegerField", function () {
      expect(User.Age).to.be.instanceOf(DbObjectIntegerField);
    });

    it("has an amountPaid of type DbObjectNumberField property", function () {
      expect(User.AmountPaid).to.be.instanceOf(DbObjectNumberField);
    });

    it("has a createdOn of type DbObjectDateField property", function () {
      expect(User.CreatedOn).to.be.instanceOf(DbObjectDateField);
    });

    it("has a modifiedAt of type DbObjectDateTimeField property", function () {
      expect(User.ModifiedAt).to.be.instanceOf(DbObjectDateTimeField);
    });
  });

  const user = new User();

  it("is an instance of DbObject", function () {
    expect(user).to.be.instanceOf(DbObject);
  });

  describe("instance", function () {
    const props = Object.getOwnPropertyNames(Object.getPrototypeOf(user));

    it("has exactly seven own properties", function () {
      expect(props.length).to.equal(7);
    });

    it("has a constructor", function () {
      expect(props.includes("constructor")).to.be.true;
    });

    describe("name property", function () {
      it("exists", function () {
        expect(props.includes("name")).to.be.true;
      });

      it("can be set", function () {
        user.name = "Joe";
        //        expect((user.name = "Joe")).to.not.throw();
      });

      it("can be read", function () {
        expect(user.name).to.equal("Joe");
      });
    });

    describe("age property", function () {
      it("exists", function () {
        expect(props.includes("age")).to.be.true;
      });

      it("can be set", function () {
        user.age = 21;
      });

      it("can be read", function () {
        expect(user.age).to.equal(21);
      });
    });

    describe("organizationId property", function () {
      it("exists", function () {
        expect(props.includes("organizationId")).to.be.true;
      });

      it("can be set", function () {
        user.organizationId = "abcdefghijklmno";
      });

      it("can be read", function () {
        expect(user.organizationId.toString()).to.equal("abcdefghijklmno");
      });
    });

    describe("createdOn property", function () {
      it("exists", function () {
        expect(props.includes("createdOn")).to.be.true;
      });

      const now = new Date();
      it("can be set", function () {
        user.createdOn = now;
      });

      it("can be read", function () {
        expect(user.createdOn).to.equal(now);
      });
    });

    describe("modifiedAt property", function () {
      it("exists", function () {
        expect(props.includes("modifiedAt")).to.be.true;
      });

      const now = new Date();
      it("can be set", function () {
        user.modifiedAt = now;
      });

      it("can be read", function () {
        expect(user.modifiedAt).to.equal(now);
      });
    });
  });
});
