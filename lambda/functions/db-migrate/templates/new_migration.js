"use strict";
const MIGRATION_NAME = "__MIGRATION_NAME__";

exports.up = async function (db) {
  const mod = await import("../migration.mjs");
  return await mod.Migration.up(db, __dirname, MIGRATION_NAME);
};

exports.down = async function (db) {
  const mod = await import("../migration.mjs");
  return await mod.Migration.down(db, __dirname, MIGRATION_NAME);
};

exports._meta = {
  version: 1,
};
