import express from "express";
const app = express();
const port = 3000;

app.get('/status', (req, res) => res.send({status: "Express server is running"}));

app.listen(port, () => console.log(`Listening on port ${port}!`));
