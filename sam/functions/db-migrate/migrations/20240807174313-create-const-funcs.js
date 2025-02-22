"use strict";
const MIGRATION_NAME = "20240807174313-create-const-funcs";

exports.up = async function (db) {
  const { default: Migration } = await import("../migration.mjs");
  return await Migration.up(db, __dirname, MIGRATION_NAME);
};

exports.down = async function (db) {
  const { default: Migration } = await import("../migration.mjs");
  return await Migration.down(db, __dirname, MIGRATION_NAME);
};

exports._meta = {
  version: 1,
};
