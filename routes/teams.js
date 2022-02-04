import express from "express";
import { collection } from "../lib/mongo.js";

const router = express.Router();

router.get("/team", async (req, res) => {
  if (req.body.name) {
    let docs = await collection
      .find({ "team.name": new RegExp(req.body.name, "i") })
      .toArray();
    res.json(docs);
  } else if (req.body.number) {
    let docs = await collection
      .find({ "team.number": req.body.number })
      .toArray();
    res.json(docs);
  } else {
    res.status(400).json({
      ok: false,
      error: "You need to specify a team name or number",
      reference:
        "http://localhost:3000/docs/teams#getting-all-records-for-a-team",
    });
  }
});

router.get("/list", async (req, res) => {
  let names = [];
  let docs = await collection.find({}).toArray();
  for (let doc of docs) {
    if (!names.includes(doc.team)) {
      names.push(doc.team.num);
    }
  }
  res.json(names);
});

router.get("/exchange", async (req, res) => {
  if (req.body.name) {
    let docs = await collection
      .find({ "team.name": new RegExp(req.body.name, "i") })
      .toArray();
    res.json({ ...docs[0].team, entities: docs });
  } else if (req.body.number) {
    let docs = await collection.find({ "team.num": req.body.number }).toArray();
    res.json({ ...docs[0].team, entities: docs });
  } else {
    res.status(400).json({
      ok: false,
      error: "You need to specify a team name or number",
      reference:
        "http://localhost:3000/docs/teams#getting-all-records-for-a-team",
    });
  }
});

export default router;
