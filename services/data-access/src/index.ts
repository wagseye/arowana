import express from "express";
const app = express();
const port = 3000;

import Settings, { SettingType } from "./settings";

app.get("/status", async (req, res) => {
  console.log(`Received request at ${Date.now()}`);

  try {
    let dbCreds: object = await Settings.getObjectValue(
      SettingType.DatabaseCredentials
    );
    console.log(`Retrieved secret, host=${dbCreds["host"]}`);
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
