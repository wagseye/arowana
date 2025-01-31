import Database from "database-connector";
import { Test } from "testing";

export default class TestObjectSequence {
  static async testOrgKeySequence() {
    // Ensure that we have prepopulated the object sequence that is used to automatically set the prefix for new organizations
    const rows = await Database.runQuery(
      "SELECT organization_key, object_prefix, sequence_number FROM object_sequences WHERE organization_key IS NULL AND object_prefix IS NULL"
    );
    Test.assertEquals(1, rows.length);
  }

  static async testDefaultValues() {}

  static async testDuplicateContraints() {
    // We shouldn't be able to create another null/null record like we have checked above
    // Test.assertError(async () => {
    //   await Database.runQuery(
    //     "INSERT INTO object_sequences (organization_key, object_prefix, start, next, increment, max) VALUES (NULL, NULL, 0, 0, 1, 100)"
    //   );
    // });

    Test.assertNoError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, object_prefix, start, next, increment, max) VALUES ('0001', NULL, 0, 0, 1, 100)"
      );
    });

    // Test.assertError(async () => {
    //   await Database.runQuery(
    //     "INSERT INTO object_sequences (organization_key, object_prefix, start, next, increment, max) VALUES ('001', NULL, 0, 0, 1, 100)"
    //   );
    // });
  }

  static async testSequenceNumberContraint() {
    Test.assertNoError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, sequence_number, start, next, increment, max) VALUES ('0001', 1, 1, 1, 1, 100)"
      );
    });
    Test.assertError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, sequence_number, start, next, increment, max) VALUES ('0001', 101, 1, 1, 1, 100)"
      );
    });
  }

  static async testStartContraint() {
    Test.assertNoError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, start, next, increment, max) VALUES ('0001', 99, 1, 1, 100)"
      );
    });
    Test.assertError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, start, next, increment, max) VALUES ('0001', 100, 1, 1, 100)"
      );
    });
  }

  static async testNextContraint() {
    Test.assertNoError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, next, start, increment, max) VALUES ('0001', 10, 1, 1, 100)"
      );
    });
    Test.assertError(async () => {
      await Database.runQuery(
        "INSERT INTO object_sequences (organization_key, next, start, increment, max) VALUES ('0001', 110, 1, 1, 100)"
      );
    });
  }
}
