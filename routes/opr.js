import express, { Router } from "express";
import { collection, db } from "../lib/mongo.js";
import { update, updateData, updateAddWebhook } from "../lib/update.js";

const router = express.Router();

router.get("/api/performance/:type", async (req, res) => {
  let c = true;
  if (
    req.params.type &&
    !req.params.type.match(
      /^(opr|normalized|non_penalty|auto|teleop|end_game)$/
    )
  ) {
    c = false;
    req.status(400).json({
      ok: false,
      error: "Invalid type",
      reference: "http://localhost:3000/docs/selecting-data/opr#api-requests",
    });
  }
  if (
    req.body.operator &&
    req.body.value &&
    !req.body.operator.match(/^(\>|\<|\=\=|\!\=|\<\=|\>\=)$/)
  ) {
    c = false;
    res.status(400).json({
      ok: false,
      error: "Invalid operator",
      reference: "http://localhost:3000/docs/selecting-data/opr#api-requests",
    });
  }
  if (c) {
    let op;
    switch (req.body.operator) {
      case ">":
        op = "$gt";
        break;
      case "<":
        op = "$lt";
        break;
      case "=":
        op = "$eq";
        break;
      case "!=":
        op = "$ne";
        break;
      case "<=":
        op = "$lte";
        break;
      case ">=":
        op = "$gte";
        break;
      default:
        res.status(400).json({
          ok: false,
          error: "Invalid operator",
          reference:
            "http://localhost:3000/docs/selecting-data/opr#api-requests",
        });
        c = false;
        break;
    }
    if (c) {
      let type = `oprs.${req.params.type}`;
      let query = { [type]: { [op]: req.body.value } };
      let docs = await collection.find(query).toArray();
      res.json({ count: docs.length, entities: docs });
    }
  }
});

export default router;
