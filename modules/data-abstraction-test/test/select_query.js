import { DataObjectGenerator } from "json-schema";
import { expect } from "chai";

const dbSchema =
  // prettier-ignore
  {
      name: "User",
      db_name: "users",
      test_scope: "selectquery",
      fields: [
          { name: "firstName", db_name: "first_name", type: "string", required: true, },
          { name: "lastName", db_name: "last_name", type: "string", required: true, },
          { name: "age", type: "number", },
      ]
  };
const User = DataObjectGenerator.generateClass(dbSchema);

describe("Select Query", () => {
  describe("query components", () => {
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
          expect(query.toJSON()["fields"]).to.deep.equal(["first_name"]);
        });
      });

      describe("multiple select fields specified as separate arguments", () => {
        it("should list the specified fields", () => {
          const query = User.select(User.FirstName, User.LastName);
          expect(query.toJSON()["fields"]).to.deep.equal([
            "first_name",
            "last_name",
          ]);
        });
      });

      describe("mixed select fields specified as separate arguments", () => {
        it("should list the specified fields", () => {
          const query = User.select("firstName", User.LastName);
          expect(query.toJSON()["fields"]).to.deep.equal([
            "firstName",
            "last_name",
          ]);
        });
      });

      describe("multiple select fields specified in a list", () => {
        it("should list the specified fields", () => {
          const query = User.select([User.FirstName, User.LastName]);
          expect(query.toJSON()["fields"]).to.deep.equal([
            "first_name",
            "last_name",
          ]);
        });
      });

      describe("mixed select fields specified in a list", () => {
        it("should list the specified fields", () => {
          const query = User.select(["firstName", User.LastName]);
          expect(query.toJSON()["fields"]).to.deep.equal([
            "firstName",
            "last_name",
          ]);
        });
      });

      describe("multiple select fields specified separately", () => {
        it("should list the specified fields", () => {
          const query = User.select(User.FirstName).select(User.LastName);
          expect(query.toJSON()["fields"]).to.deep.equal([
            "first_name",
            "last_name",
          ]);
        });
      });

      describe("no select fields", () => {
        it("should specify * fields", () => {
          expect(User.select().toJSON()["fields"]).to.equal("*");
        });
      });
    });

    describe("where clause", () => {
      describe("operators", () => {
        describe("equals", () => {
          const query = User.select().where(User.FirstName.equals("Joe"));
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("first_name");
          });
          it('sets the operator to "="', () => {
            expect(where["operator"]).to.equal("=");
          });
          it("sets the right element to the provided value", () => {
            expect(where["right"]).to.equal("Joe");
          });
        });

        describe("notEquals", () => {
          const query = User.select().where(User.FirstName.notEquals("Joe"));
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("first_name");
          });
          it('sets the operator to "<>"', () => {
            expect(where["operator"]).to.equal("<>");
          });
          it("sets the right element to the provided value", () => {
            expect(where["right"]).to.equal("Joe");
          });
        });

        describe("greaterThan", () => {
          const query = User.select().where(User.Age.greaterThan(35));
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("age");
          });
          it('sets the operator to ">"', () => {
            expect(where["operator"]).to.equal(">");
          });
          it("sets the right element to the provided value", () => {
            expect(where["right"]).to.equal(35);
          });
        });

        describe("greaterOrEqualThan", () => {
          const query = User.select().where(User.Age.greaterOrEqualThan(35));
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("age");
          });
          it('sets the operator to ">="', () => {
            expect(where["operator"]).to.equal(">=");
          });
          it("sets the right element to the provided value", () => {
            expect(where["right"]).to.equal(35);
          });
        });

        describe("lessThan", () => {
          const query = User.select().where(User.Age.lessThan(35));
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("age");
          });
          it('sets the operator to "<"', () => {
            expect(where["operator"]).to.equal("<");
          });
          it("sets the right element to the provided value", () => {
            expect(where["right"]).to.equal(35);
          });
        });

        describe("lessOrEqualThan", () => {
          const query = User.select().where(User.Age.lessOrEqualThan(35));
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("age");
          });
          it('sets the operator to "<="', () => {
            expect(where["operator"]).to.equal("<=");
          });
          it("sets the right element to the provided value", () => {
            expect(where["right"]).to.equal(35);
          });
        });

        describe("isNull", () => {
          const query = User.select().where(User.LastName.isNull());
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("last_name");
          });
          it('sets the operator to "IS NULL"', () => {
            expect(where["operator"]).to.equal("IS NULL");
          });
          it("does not set right element", () => {
            expect(where["right"]).to.not.exist;
          });
        });

        describe("isNotNull", () => {
          const query = User.select().where(User.LastName.isNotNull());
          const where = query.toJSON()["where"];
          it("sets the left element to the field name", () => {
            expect(where["left"]).to.equal("last_name");
          });
          it('sets the operator to "IS NOT NULL"', () => {
            expect(where["operator"]).to.equal("IS NOT NULL");
          });
          it("does not set right element", () => {
            expect(where["right"]).to.not.exist;
          });
        });
      });

      describe("compound statements", () => {
        describe("with two comparisons", () => {
          // prettier-ignore
          const query = User.select().where(User.FirstName.equals("Joe")).where(User.LastName.notEquals("Smith"));
          const where = query.toJSON()["where"];
          it("correctly builds the JSON condition", () => {
            expect(where).to.deep.equal(
              // prettier-ignore
              {
              left: { left: "first_name", operator: "=", right: "Joe", },
              operator: "AND",
              right: { left: "last_name", operator: "<>", right: "Smith", },
            }
            );
          });
        });

        describe("with three comparisons", () => {
          // prettier-ignore
          const query = User.select().where(User.FirstName.equals("Joe")).where(User.LastName.notEquals("Smith")).where(User.Age.greaterThan(18));
          const where = query.toJSON()["where"];
          it("correctly builds the JSON condition", () => {
            // NB: as more conditions are added, they are "front loaded", meaning they are pushed onto the left side of the condition
            expect(where).to.deep.equal(
              // prettier-ignore
              {left: { left: { left: "first_name", operator: "=", right:"Joe" },
                     operator: "AND",
                     right: { left: "last_name", operator: "<>", right: "Smith" }},
             operator: "AND",
             right: {left: "age", operator: ">", right: 18 }}
            );
          });
        });

        describe("order by", () => {
          describe("single ascending", () => {
            const query = User.select().sort(User.FirstName);
            const orderBy = query.toJSON()["orderBy"];
            it("should list the field", () => {
              expect(orderBy).to.deep.equal(["first_name"]);
            });
          });

          describe("single descending", () => {
            const query = User.select().sortDown(User.FirstName);
            const orderBy = query.toJSON()["orderBy"];
            it("should list the field as DESC", () => {
              expect(orderBy).to.deep.equal(["first_name DESC"]);
            });
          });

          describe("multiple ascending", () => {
            const query = User.select()
              .sort(User.FirstName)
              .sort(User.LastName);
            const orderBy = query.toJSON()["orderBy"];
            it("should list the fields", () => {
              expect(orderBy).to.deep.equal(["first_name", "last_name"]);
            });
          });

          describe("multiple descending", () => {
            const query = User.select()
              .sortDown(User.FirstName)
              .sortDown(User.LastName);
            const orderBy = query.toJSON()["orderBy"];
            it("should list the fields as DESC", () => {
              expect(orderBy).to.deep.equal([
                "first_name DESC",
                "last_name DESC",
              ]);
            });
          });

          describe("multiple mixed", () => {
            const query = User.select()
              .sortDown(User.FirstName)
              .sort(User.LastName);
            const orderBy = query.toJSON()["orderBy"];
            it("should list the fields properly", () => {
              expect(orderBy).to.deep.equal(["first_name DESC", "last_name"]);
            });
          });
        });

        describe("limit", () => {
          describe("basic", () => {
            const query = User.select().limit(3);
            const limit = query.toJSON()["limit"];
            it("should use the number provided", () => {
              expect(limit).to.equal(3);
            });
          });

          describe("multiple", () => {
            const query = User.select().limit(3).limit(5);
            const limit = query.toJSON()["limit"];
            it("should use the last number provided", () => {
              expect(limit).to.equal(5);
            });
          });

          describe("error", () => {
            it("should throw an error when given a string", () => {
              expect(() => User.select().limit("a")).to.throw();
            });
            it("should throw an error when given a decimal", () => {
              expect(() => User.select().limit(3.5)).to.throw();
            });
            it("should throw an error when given a negative number", () => {
              expect(() => User.select().limit(-1)).to.throw();
            });
          });
        });
      });
    });
  });

  describe("full queries", () => {
    describe("a full query", () => {
      it("should contain all of the proper components", () => {
        // prettier-ignore
        const query = User.select(User.FirstName).where(User.FirstName.equals("Joe")).where(User.LastName.notEquals("Smith")).sort(User.Age).limit(3);
        expect(query.toJSON()).to.deep.equal(
          // prettier-ignore
          { type: "select",
            table: "users",
            fields: [ "first_name" ],
            where: {
              left: { left: "first_name", operator: "=", right: "Joe" },
              operator: "AND",
              right: { left: "last_name", operator: "<>", right: "Smith" }
            },
            orderBy: [ "age" ],
            limit: 3
          }
        );
      });
    });
  });
});
