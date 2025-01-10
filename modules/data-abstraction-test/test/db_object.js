import { DataObjectGenerator } from "json-schema";
import { Id } from "data-abstraction";

import { expect } from "chai";

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
            test_scope: "dbobject",
            fields: [
              { name: "name", db_name: "name", type: "string", required: true, },
              { name: "active", db_name: "is_active", type: "boolean", required: true, },
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

describe("DbObject class", () => {
  describe("properties", () => {
    describe("a string property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("Name");
      });

      it("can be set to a string", () => {
        expect(() => {
          user.name = "Joe";
        }).to.not.throw();
        expect(user.name).to.equal("Joe");
      });

      it("can be set to an Id", () => {
        expect(() => {
          user.name = new Id("00100abcdefghij");
        }).to.not.throw();
        expect(user.name).to.equal("00100abcdefghij");
      });

      it("can be set to an empty string", () => {
        expect(() => {
          user.name = "";
        }).to.not.throw();
        expect(user.name).to.equal("");
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.name = undefined;
        }).to.not.throw();
        expect(user.name).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          user.name = null;
        }).to.not.throw();
        expect(user.name).to.be.undefined;
      });

      it("can not be set to a number", () => {
        expect(() => {
          user.name = 3;
        }).to.throw();
      });

      it("can not be set to an object", () => {
        expect(() => {
          user.name = {};
        }).to.throw();
      });
    });

    describe("a boolean property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("Name");
      });

      it("can be set to a string", () => {
        expect(() => {
          user.name = "Joe";
        }).to.not.throw();
        expect(user.name).to.equal("Joe");
      });

      it("can be set to an Id", () => {
        expect(() => {
          user.name = new Id("00100abcdefghij");
        }).to.not.throw();
        expect(user.name).to.equal("00100abcdefghij");
      });

      it("can be set to an empty string", () => {
        expect(() => {
          user.name = "";
        }).to.not.throw();
        expect(user.name).to.equal("");
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.name = undefined;
        }).to.not.throw();
        expect(user.name).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          user.name = null;
        }).to.not.throw();
        expect(user.name).to.be.undefined;
      });
    });

    describe("an id property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("Id");
      });

      it("can be set to an id", () => {
        expect(() => {
          user.id = new Id("00100abcdefghij");
        }).to.not.throw();
        expect(user.id).to.deep.equal(new Id("00100abcdefghij"));
      });

      it("can be set to a string that contains a valid id", () => {
        expect(() => {
          user.id = "00100abcdefghij";
        }).to.not.throw();
        expect(user.id).to.deep.equal(new Id("00100abcdefghij"));
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.id = undefined;
        }).to.not.throw();
        expect(user.id).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          user.id = null;
        }).to.not.throw();
        expect(user.id).to.be.undefined;
      });

      it("can not be set to a string that contains an invalid id", () => {
        expect(() => {
          user.id = "00100";
        }).to.throw();
      });

      it("can not be set to an object", () => {
        expect(() => {
          user.id = {};
        }).to.throw();
      });

      it("can not be set to an empty string", () => {
        expect(() => {
          user.id = "";
        }).to.throw();
      });
    });

    describe("an integer property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("Age");
      });

      it("can be set to an integer", () => {
        expect(() => {
          user.age = 20;
        }).to.not.throw();
        expect(user.age).to.equal(20);
      });

      it("can be set to a decimal (truncated)", () => {
        expect(() => {
          user.age = 3.14;
        }).to.not.throw();
        expect(user.age).to.equal(3);
      });

      it("can be set to a string that contains an integer", () => {
        expect(() => {
          user.age = "123";
        }).to.not.throw();
        expect(user.age).to.equal(123);
      });

      it("can be set to a string that contains a decimal", () => {
        expect(() => {
          user.age = "3.14";
        }).to.not.throw();
        expect(user.age).to.equal(3);
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.age = undefined;
        }).to.not.throw();
        expect(user.age).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          user.age = null;
        }).to.not.throw();
        expect(user.age).to.be.undefined;
      });

      it("can not be set to the empty string", () => {
        expect(() => {
          user.age = "";
        }).to.throw();
      });

      it("can not be set to a string that contains an integer with trailing chars", () => {
        expect(() => {
          user.age = "123 ";
        }).to.throw();
      });

      it("can not be set to a string that contains a decimal with trailing chars", () => {
        expect(() => {
          user.age = "3.14abc";
        }).to.throw();
      });

      it("can not be set to an object", () => {
        expect(() => {
          user.age = {};
        }).to.throw();
      });
    });

    describe("a number property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("AmountPaid");
      });

      it("can be set to a decimal", () => {
        expect(() => {
          user.amountPaid = 3.14;
        }).to.not.throw();
        expect(user.amountPaid).to.equal(3.14);
      });

      it("can be set to an integer", () => {
        expect(() => {
          user.amountPaid = 7;
        }).to.not.throw();
        expect(user.amountPaid).to.equal(7);
      });

      it("can be set to a string that contains a decimal", () => {
        expect(() => {
          user.amountPaid = "3.14";
        }).to.not.throw();
        expect(user.amountPaid).to.equal(3.14);
      });

      it("can be set to a string that contains an integer", () => {
        expect(() => {
          user.amountPaid = "123";
        }).to.not.throw();
        expect(user.amountPaid).to.equal(123);
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.amountPaid = undefined;
        }).to.not.throw();
        expect(user.amountPaid).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          user.amountPaid = null;
        }).to.not.throw();
        expect(user.amountPaid).to.be.undefined;
      });

      it("can not be set to the empty string", () => {
        expect(() => {
          user.amountPaid = "";
        }).to.throw();
      });

      it("can not be set to a string that contains an integer with trailing chars", () => {
        expect(() => {
          user.amountPaid = "123 ";
        }).to.throw();
      });

      it("can not be set to a string that contains a decimal with trailing chars", () => {
        expect(() => {
          user.amountPaid = "3.14abc";
        }).to.throw();
      });

      it("can not be set to an object", () => {
        expect(() => {
          user.amountPaid = {};
        }).to.throw();
      });
    });

    describe("a date property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("CreatedOn");
      });

      it("can be set to a Date", () => {
        const date = new Date("2012-10-04");
        expect(() => {
          user.createdOn = date;
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(date);
      });

      it("can be set to an integer", () => {
        expect(() => {
          user.createdOn = 1349308800000;
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-10-04"));
      });

      it("can be set to a string formatted YYYY-MM-DD", () => {
        expect(() => {
          user.createdOn = "2012-10-04";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-10-04"));
      });

      it("can be set to a string formatted YYYY-M-D", () => {
        expect(() => {
          user.createdOn = "2012-1-4";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-01-04"));
      });

      it("can be set to a string formatted MM-DD-YYYY", () => {
        expect(() => {
          user.createdOn = "10-04-2012";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-10-04"));
      });

      it("can be set to a string formatted MM-DD-YYYY", () => {
        expect(() => {
          user.createdOn = "10-04-2012";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-10-04"));
      });

      it("can be set to a string formatted M-D-YYYY", () => {
        expect(() => {
          user.createdOn = "1-4-2012";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-01-04"));
      });

      it("can be set to a string formatted MM/DD/YYYY", () => {
        expect(() => {
          user.createdOn = "10/04/2012";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-10-04"));
      });

      it("can be set to a string formatted M/D/YY", () => {
        expect(() => {
          user.createdOn = "1/4/12";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-01-04"));
      });

      it("can be set to a string in ISO format", () => {
        expect(() => {
          user.createdOn = "2012-10-04T00:00:00.000Z";
        }).to.not.throw();
        expect(user.createdOn).to.deep.equal(new Date("2012-10-04"));
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.createdOn = undefined;
        }).to.not.throw();
        expect(user.createdOn).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          try {
            user.createdOn = null;
          } catch (e) {
            console.log(JSON.stringify(e.stack));
          }
        }).to.not.throw();
        expect(user.createdOn).to.be.undefined;
      });

      it("can not be set to the empty string", () => {
        expect(() => {
          user.createdOn = "";
        }).to.throw();
        expect(user.createdOn).to.be.undefined;
      });

      it("can not be set to a string formatted YYYY/MM/DD", () => {
        expect(() => {
          user.createdOn = "2012/10/04";
        }).to.throw();
      });

      it("can not be set to a string formatted YY-MM-DD", () => {
        expect(() => {
          user.createdOn = "12-10-04";
        }).to.throw();
      });

      it("can not be set to a decimal", () => {
        expect(() => {
          user.createdOn = 1349308800000.25;
        }).to.throw();
      });
    });

    describe("a datetime property", () => {
      const user = new User();
      it("should have a corresponding static property", () => {
        expect(User).to.have.property("ModifiedAt");
      });

      it("can be set to a Date", () => {
        const date = new Date("2012-10-04 11:11:11.11");
        expect(() => {
          user.modifiedAt = date;
        }).to.not.throw();
        expect(user.modifiedAt).to.deep.equal(date);
      });

      it("can be set to an integer", () => {
        expect(() => {
          user.modifiedAt = 1349374271110;
        }).to.not.throw();
        expect(user.modifiedAt).to.deep.equal(
          new Date("2012-10-04 11:11:11.11")
        );
      });

      it("can be set to a string formatted YYYY-MM-DD HH:MM", () => {
        expect(() => {
          user.modifiedAt = "2012-10-04 11:11";
        }).to.not.throw();
        expect(user.modifiedAt).to.deep.equal(
          new Date("2012-10-04 11:11:00.00")
        );
      });

      it("can be set to a string formatted YYYY-MM-DD HH:MM:SS", () => {
        expect(() => {
          user.modifiedAt = "2012-10-04 11:11:11";
        }).to.not.throw();
        expect(user.modifiedAt).to.deep.equal(
          new Date("2012-10-04 11:11:11.00")
        );
      });

      it("can be set to a string formatted YYYY-M-D HH:MM:SS.MM", () => {
        expect(() => {
          user.modifiedAt = "2012-1-4 11:11:11.11";
        }).to.not.throw();
        expect(user.modifiedAt).to.deep.equal(
          new Date("2012-01-04 11:11:11.11")
        );
      });

      it("can be set to undefined", () => {
        expect(() => {
          user.modifiedAt = undefined;
        }).to.not.throw();
        expect(user.modifiedAt).to.be.undefined;
      });

      it("can be set to null", () => {
        expect(() => {
          try {
            user.modifiedAt = null;
          } catch (e) {
            console.log(JSON.stringify(e.stack));
          }
        }).to.not.throw();
        expect(user.modifiedAt).to.be.undefined;
      });

      it("can be set to a string formatted YYYY-MM-DD HH:M", () => {
        expect(() => {
          user.modifiedAt = "2012-10-04 11:1";
        }).to.throw();
      });
      it("can not be set to a string formatted YYYY-M-D HH:MM:SS:MM", () => {
        expect(() => {
          user.modifiedAt = "2012-1-4 11:11:11:11";
        }).to.throw();
      });
    });
  });
});
