"use strict";

import DBMigrate from "db-migrate";
import MigrationStatus from "./migration_status.mjs";

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export const handler = async (event) => {
  console.log(`event: ${JSON.stringify(event)}`);
  MigrationStatus.reset();

  let result: object;
  try {
    let cfg = parseConfig(event);

    if (cfg.path === "migrate") {
      const dbmigrate = await initialize(cfg);
      if (cfg.direction === "down") {
        await dbmigrate.down(cfg.count);
        result = {
          direction: "down",
          migrations: MigrationStatus.downMigrations,
        };
      } else {
        await dbmigrate.up(cfg.count);
        result = {
          direction: "up",
          migrations: MigrationStatus.upMigrations,
        };
      }
    } else if (cfg.path === "reset") {
      const dbmigrate = await initialize(cfg);
      await dbmigrate.reset();
      result = {
        direction: "down",
        migrations: MigrationStatus.downMigrations,
      };
    } else {
      return generateErrorResponse(404, `Invalid path: "${cfg.path}"`);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(
        `Caught error: ${err.message} ${JSON.stringify(err.stack)}`
      );
      return generateErrorResponse(err["status"], err["message"]);
    }
  }
  return {
    statusCode: 200,
    body: result,
  };
};

class configObject {
  public path: string | undefined;
  public direction: "up" | "down" = "up";
  public count: number | undefined;
  public dryRun: boolean = false;
}

function generateErrorResponse(statusCode: number, message: string): object {
  let responseStatus = 500; // default to internal error
  let responseMessage = "An unknown error occured";
  if (statusCode && typeof statusCode === "number" && statusCode > 0) {
    responseStatus = statusCode;
  }
  if (message) {
    responseMessage = message;
  }
  return {
    statusCode: responseStatus,
    body: responseMessage,
  };
}

function parseConfig(event: object): configObject {
  const cfg = new configObject();
  cfg.path = event["path"]?.toLowerCase();
  if (cfg.path.startsWith("/")) {
    cfg.path = cfg.path.substring(1);
  }

  let data = event["body"];

  let direction = data?.direction?.toLowerCase() || "up";
  let count: unknown = data?.count;
  let dryRun: unknown = data?.dryRun;
  if (data) {
    // Convert all of the config keys to lower case
    data = Object.keys(data).reduce((newObj, key) => {
      newObj[key.toLowerCase()] = data[key];
      return newObj;
    }, {});
    // To prevent future headaches, validate all config options that are passed in
    const validConfigKeys = new Set(["direction", "count", "dryrun"]);
    const invalidConfigKeys = Object.keys(data).filter(
      (key) => !validConfigKeys.has(key)
    );
    if (invalidConfigKeys.length) {
      const err = new Error(
        `Invalid option(s): "${invalidConfigKeys.join('", "')}"`
      );
      err["status"] = 400;
      throw err;
      invalidConfigKeys;
    }
  }

  if (typeof direction !== "string" || !["up", "down"].includes(direction)) {
    const err = new Error(`Invalid direction: "${direction}"`);
    err["status"] = 400;
    throw err;
  }
  // @ts-ignore
  cfg.direction = direction;

  if (count !== undefined) {
    if (typeof count === "string" || count instanceof String) {
      const parsed = new Number(count).valueOf();
      if (!Number.isNaN(parsed)) {
        count = parsed;
      }
    }
    if (
      (typeof count !== "number" && !(count instanceof Number)) ||
      !Number.isInteger(count)
    ) {
      const err = new Error(`Invalid count: "${count}"`);
      err["status"] = 400;
      throw err;
    }
    if ((count as number) < 0) {
      const err = new Error("Count must be greater than 0");
      err["status"] = 400;
      throw err;
    } else if (count === 0) {
      // Setting count to "0" will do a dry run
      cfg.count = undefined;
      if (dryRun === undefined) {
        dryRun = true;
      }
    } else {
      cfg.count = count as number;
    }
  }

  if (dryRun !== undefined) {
    if (typeof dryRun === "string") {
      dryRun = dryRun.toLowerCase();
      if (dryRun === "true") {
        dryRun = true;
      } else if (dryRun === "false") {
        dryRun = false;
      }
    }
    if (typeof dryRun === "boolean") {
      cfg.dryRun = dryRun;
    } else {
      const err = new Error(`Invalid value for dryRun: "${dryRun}"`);
      err["status"] = 400;
      throw err;
    }
  }
  return cfg;
}

async function initialize(config: configObject) {
  const dbSecretName = process.env.DB_SECRET_NAME;
  if (!dbSecretName)
    throw new Error("Unable to retrieve the name of the database credentials");
  let secret: { [key: string]: string } = await getSecretValue(dbSecretName);

  const options = {
    config: {
      dev: {
        driver: "pg",
        host: getDatabaseCredential("host", secret),
        port: getDatabaseCredential("port", secret),
        database: getDatabaseCredential("database_name", secret),
        user: getDatabaseCredential("username", secret),
        password: getDatabaseCredential("password", secret),
        ssl: {
          rejectUnauthorized: true,
          ca: getDatabaseCredential("certificate", secret),
        },
      },
    },
    cmdOptions: {
      "migrations-dir": "./migrations",
      "sql-file": true,
      "dry-run": config.dryRun,
    },
  };
  console.log("Initializing db-migrate module");
  return DBMigrate.getInstance(true, options);
}

function getDatabaseCredential(
  fieldName: string,
  secret: { [key: string]: string }
): string {
  if (
    ![
      "username",
      "host",
      "port",
      "database_name",
      "password",
      "certificate",
    ].includes(fieldName)
  ) {
    throw new Error(`Unrecognized database credential field: "${fieldName}"`);
  }
  const ENV_VAR_NAME = `DB_SECRET_${fieldName.toUpperCase()}`;
  let value;
  if (process.env.hasOwnProperty(ENV_VAR_NAME)) {
    value = process.env[ENV_VAR_NAME];
    console.log(
      `DbMigrate: found local value for database credential field "${fieldName}"`
    );
  }
  if (!value) {
    value = secret[fieldName];
  }
  if (!value) {
    throw new Error(
      `Value for database credential field "${fieldName}" must be set`
    );
  }
  return value;
}

async function getSecretValue(
  secretName: string
): Promise<{ [key: string]: string }> {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );
  return JSON.parse(response.SecretString);
}
