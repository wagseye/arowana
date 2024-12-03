import express from "express";
const app = express();
const port = 3000;

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { fromInstanceMetadata } from "@aws-sdk/credential-providers"; // ES6 import

import dotenv from "dotenv";
dotenv.config();

async function getSecretValue(
  secretName: string
): Promise<{ [key: string]: string }> {
  const client = new SecretsManagerClient({
    credentials: fromInstanceMetadata({
      maxRetries: 3, // Optional
      timeout: 0, // Optional
    }),
    region: process.env.AWS_REGION || "us-west-2",
  });
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );
  return JSON.parse(response.SecretString);
}
/*
//const dbSecretName = process.env.DB_SECRET_NAME;
const dbSecretName = "database_credentials_dev";
if (!dbSecretName) {
  throw new Error("Unable to retrieve the name of the database credentials");
}
try {
  let secret: { [key: string]: string } = await getSecretValue(dbSecretName);
  console.log(`Retrieved secret host: ${secret["host"]}`);
} catch (err) {
  if (err instanceof Error) {
    console.log(`Caught error: ${err.message}\n${err.stack}`);
  } else {
    console.log(`Caught unknown error: ${err}`);
  }
}
*/
//if (!('host' in secret) || !secret['host']) throw new Error('Database credentials must contain a "host" value');

app.get("/status", async (req, res) => {
  console.log(`Received request at ${Date.now()}`);

  try {
    let secret: { [key: string]: string } = await getSecretValue(
      "database_credentials_dev"
    );
    console.log(`Retrieved secret host: ${secret["host"]}`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Caught error: ${err.message}\n${err.stack}`);
    } else {
      console.log(`Caught unknown error: ${err}`);
    }
  }
  res.send({ status: "Express server is running" });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
