import express from "express";
const app = express();
const port = 3000;

import DatabaseConnector from "./database";

app.get("/status", async (req, res) => {
  res.send({ status: "Express server is running" });
});

app.get("/select", async (req, res) => {
  console.log(`Received request at ${Date.now()}`);

  try {
    DatabaseConnector.runSql("SELECT * FROM users");
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
