import express from "express";

const app = express();
const port = 3001;

import expressWs from "express-ws";
let _ws = expressWs(app);

import { router as update, socketHandler } from "./routes/update.js";
import teams from "./routes/teams.js";
import opr from "./routes/opr.js";

app.use(express.json());

app.ws("/api/update/subscribe", socketHandler);
app.use("/api/update", update);
app.use("/api/teams", teams);
app.use("/api/performance", opr);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
