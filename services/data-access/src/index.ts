import express from "express";
const app = express();
app.use(express.json());
const port = 3000;

import DatabaseConnector from "./database";
import QueryFormatter from "./query_formatter";
import OrganizationSchema from "./org_schema";

// TODO: choose http methods for all 4 endpoints (GET/POST/PATCH/DELETE?)
// app.all("/(select|insert|update|delete)", async (req, res) => {
//   try {
//     console.log(`Request: ${JSON.stringify(req.body)}`);
//     const json = req.body;
//     const orgId = json["org_id"];
//     const query = json["query"];
//     if (!query) throw new Error("No query");
//     const queryType = query["type"];
//     if (!queryType) throw new Error("Query must provide a type");
//     if (req.path.replace("/", "") !== queryType)
//       throw new Error("Query type does not match path");
//     const schema: OrganizationSchema =
//       await OrganizationSchema.getOrganizationSchema(orgId);
//     const sql = QueryFormatter.toSql(query, schema);
//     if (sql instanceof Array) {
//       let count = 0;
//       // NB: we don't use sql.forEach() here because it is not async/await compatible
//       for (const q of sql) {
//         const itr = count++;
//         await DatabaseConnector.runSql(q);
//       }
//     } else {
//       await DatabaseConnector.runSql(sql);
//     }
//   } catch (err) {
//     logError(err);
//   }
//   res.send({ status: "Ran query" });
// });

app.get("/select", async (req, res) => {
  try {
    console.log(`Request: ${JSON.stringify(req.body)}`);
    const json = req.body;
    const orgId = json["org_id"];
    const query = json["query"];
    if (!query) throw new Error("No query");
    if (query["type"] !== "select")
      throw new Error("Query type does not match path");
    let rows = await DatabaseConnector.select(query, orgId);
    const resp = {
      type: "select",
      organization_id: orgId,
      count: rows.length,
      records: rows,
    };
    res.send({ resp });
  } catch (err) {
    logError(err);
    res.status(500).send("Error running select");
  }
});

app.post("/insert", async (req, res) => {
  try {
    console.log(`Request: ${JSON.stringify(req.body)}`);
    const json = req.body;
    const orgId = json["org_id"];
    const query = json["query"];
    if (!query) throw new Error("No query");
    if (query["type"] !== "insert")
      throw new Error("Query type does not match path");
    const newRecs = await DatabaseConnector.insert(query, orgId);
    const resp = {
      type: "insert",
      organization_id: orgId,
      count: newRecs.length,
      records: newRecs,
    };
    res.send({ resp });
  } catch (err) {
    logError(err);
    res.status(500).send("Error running insert");
  }
});

app.patch("/update", async (req, res) => {
  try {
    console.log(`Request: ${JSON.stringify(req.body)}`);
    const json = req.body;
    const orgId = json["org_id"];
    const query = json["query"];
    if (!query) throw new Error("No query");
    if (query["type"] !== "update")
      throw new Error("Query type does not match path");
    const updRecs = await DatabaseConnector.update(query, orgId);
    const resp = {
      type: "update",
      organization_id: orgId,
      count: updRecs.length,
      records: updRecs,
    };
    res.send({ resp });
  } catch (err) {
    logError(err);
    res.status(500).send("Error running update");
  }
});

app.delete("/delete", async (req, res) => {
  try {
    console.log(`Request: ${JSON.stringify(req.body)}`);
    const json = req.body;
    const orgId = json["org_id"];
    const query = json["query"];
    if (!query) throw new Error("No query");
    if (query["type"] !== "delete")
      throw new Error("Query type does not match path");
    const delRecs = await DatabaseConnector.delete(query, orgId);
    const resp = {
      type: "delete",
      organization_id: orgId,
      count: delRecs.length,
      records: delRecs,
    };
    res.send({ resp });
  } catch (err) {
    logError(err);
    res.status(500).send("Error running delete");
  }
});

function logError(err: unknown) {
  if (err instanceof Error) {
    console.log(`Caught error: ${err.message}\n${err.stack}`);
  } else {
    console.log(`Caught unknown error: ${err}`);
  }
}

app.listen(port, () => console.log(`Listening on port ${port}!`));
