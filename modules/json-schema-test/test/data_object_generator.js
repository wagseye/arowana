import { expect } from "chai";
import { DataObjectGenerator } from "json-schema";
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

describe("generateClasses method", () => {
  it("creates exactly two classes", () => {
    expect(Object.keys(objTypes).length).to.equal(2);
  });

  it("creates an Organization class", () => {
    expect(Organization).to.exist;
  });

  it("creates a User class", () => {
    expect(User).to.exist;
  });
});

describe("Organization", () => {
  const org = new Organization();

  it("is an instance of DbObject", () => {
    expect(org).to.be.instanceOf(DbObject);
  });

  describe("class", () => {
    let props = Object.getOwnPropertyNames(Organization);
    const defaultProps = new Set(["length", "name", "prototype"]);
    props = props.filter((item) => !defaultProps.has(item));

    it('is named "Organization"', () => {
      expect(Organization.name).to.equal("Organization");
    });

    it("has a name property of type DbObjectStringField", () => {
      expect(Organization.Name).to.be.instanceOf(DbObjectStringField);
    });

    it("has a createdAt of type DbObjectDateTimeField property", () => {
      expect(Organization.CreatedAt).to.be.instanceOf(DbObjectDateTimeField);
    });
  });

  describe("instance", () => {
    const props = Object.getOwnPropertyNames(Object.getPrototypeOf(org));

    it("has exactly three own properties", () => {
      expect(props.length).to.equal(3);
    });

    describe("name property", () => {
      it("exists", () => {
        expect(props.includes("name")).to.be.true;
      });

      it("can be set", () => {
        org.name = "AnyCorp";
        //        expect((user.name = "Joe")).to.not.throw();
      });

      it("can be read", () => {
        expect(org.name).to.equal("AnyCorp");
      });
    });

    describe("createdAt property", () => {
      it("exists", () => {
        expect(props.includes("createdAt")).to.be.true;
      });

      const now = new Date();
      it("can be set", () => {
        org.createdAt = now;
      });

      it("can be read", () => {
        expect(org.createdAt).to.equal(now);
      });
    });
  });
});

describe("User", () => {
  describe("class", () => {
    let props = Object.getOwnPropertyNames(User);
    const defaultProps = new Set(["length", "name", "prototype"]);
    props = props.filter((item) => !defaultProps.has(item));

    it('is named "User"', () => {
      expect(User.name).to.equal("User");
    });

    it("has exactly eight own properties", () => {
      expect(props.length).to.equal(8);
    });

    it("has a name property of type DbObjectStringField", () => {
      expect(User.Name).to.be.instanceOf(DbObjectStringField);
    });

    it("has an age property of type DbObjectIntegerField", () => {
      expect(User.Age).to.be.instanceOf(DbObjectIntegerField);
    });

    it("has an amountPaid of type DbObjectNumberField property", () => {
      expect(User.AmountPaid).to.be.instanceOf(DbObjectNumberField);
    });

    it("has a createdOn of type DbObjectDateField property", () => {
      expect(User.CreatedOn).to.be.instanceOf(DbObjectDateField);
    });

    it("has a modifiedAt of type DbObjectDateTimeField property", () => {
      expect(User.ModifiedAt).to.be.instanceOf(DbObjectDateTimeField);
    });
  });

  const user = new User();
  describe("instance", () => {
    describe('created with "new"', () => {
      it("is an instance of DbObject", () => {
        expect(user).to.be.instanceOf(DbObject);
      });
      const props = Object.getOwnPropertyNames(Object.getPrototypeOf(user));

      it("has exactly seven own properties", () => {
        expect(props.length).to.equal(7);
      });

      it("has a constructor", () => {
        expect(props.includes("constructor")).to.be.true;
      });

      describe("name property", () => {
        it("exists", () => {
          expect(props.includes("name")).to.be.true;
        });

        it("can be set", () => {
          user.name = "Joe";
          //        expect((user.name = "Joe")).to.not.throw();
        });

        it("can be read", () => {
          expect(user.name).to.equal("Joe");
        });
      });

      describe("age property", () => {
        it("exists", () => {
          expect(props.includes("age")).to.be.true;
        });

        it("can be set", () => {
          user.age = 21;
        });

        it("can be read", () => {
          expect(user.age).to.equal(21);
        });
      });

      describe("organizationId property", () => {
        it("exists", () => {
          expect(props.includes("organizationId")).to.be.true;
        });

        it("can be set", () => {
          user.organizationId = "abcdefghijklmno";
        });

        it("can be read", () => {
          expect(user.organizationId.toString()).to.equal("abcdefghijklmno");
        });
      });

      describe("createdOn property", () => {
        it("exists", () => {
          expect(props.includes("createdOn")).to.be.true;
        });

        const now = new Date();
        it("can be set", () => {
          user.createdOn = now;
        });

        it("can be read", () => {
          expect(user.createdOn).to.equal(now);
        });
      });

      describe("modifiedAt property", () => {
        it("exists", () => {
          expect(props.includes("modifiedAt")).to.be.true;
        });

        const now = new Date();
        it("can be set", () => {
          user.modifiedAt = now;
        });

        it("can be read", () => {
          expect(user.modifiedAt).to.equal(now);
        });
      });
    });

    describe('created with "new({properties})"', () => {
      describe("with some properties set", () => {
        const now = Date.now();
        const user2 = new User({
          name: "Joe",
          amountPaid: 3.14,
          createdOn: now,
        });

        it("is an instance of DbObject", () => {
          expect(user2).to.be.instanceOf(DbObject);
        });

        it("has exactly seven own properties", () => {
          expect(
            Object.getOwnPropertyNames(Object.getPrototypeOf(user2)).length
          ).to.equal(7);
        });

        it("has the name property set", () => {
          expect(user2.name).to.equal("Joe");
        });

        it("has the amountPaid property set", () => {
          expect(user2.amountPaid).to.equal(3.14);
        });

        it("has the createdOn property set", () => {
          // A little massaging due to timestamp/Date conversions
          expect(user2.createdOn.getTime()).to.equal(now);
        });

        it("has the age property unset", () => {
          expect(user2.age).to.not.exist;
        });

        it("has the organizationId property unset", () => {
          expect(user2.organizationId).to.not.exist;
        });

        it("has the modifiedAt property unset", () => {
          expect(user2.modifiedAt).to.not.exist;
        });
      });

      describe("with an invalid property set", () => {
        it("throws an error", () => {
          // prettier-ignore
          expect(() => { new User({ thename: "Joe" })}).to.throw();
        });
      });
    });

    describe('created with "newInstance()"', () => {
      const user2 = user.class.newInstance();

      it("is an instance of DbObject", () => {
        expect(user2).to.be.instanceOf(DbObject);
      });

      it("has exactly seven own properties", () => {
        expect(
          Object.getOwnPropertyNames(Object.getPrototypeOf(user2)).length
        ).to.equal(7);
      });

      it("has a constructor", () => {
        expect(user2).to.have.property("constructor");
      });

      describe("name property", () => {
        it("exists", () => {
          expect(user2).to.have.property("name");
        });

        it("can be set", () => {
          user2.name = "Bob";
          //        expect((user.name = "Joe")).to.not.throw();
        });

        it("can be read", () => {
          expect(user2.name).to.equal("Bob");
        });
      });
    });
  });
});
