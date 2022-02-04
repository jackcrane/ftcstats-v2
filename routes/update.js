import express from "express";
import { collection, db } from "../lib/mongo.js";
import { update, updateData, updateAddWebhook } from "../lib/update.js";

const router = express.Router();

const socketHandler = (ws, req) => {
  let timelooper = 100;
  let interval;
  ws.on("connect", function (msg) {
    // ws.send(msg);
  });
  ws.on("message", function (msg) {
    if (parseFloat(msg)) {
      let _timelooper = parseFloat(msg);
      if (_timelooper >= 0.1 && _timelooper <= 5000) {
        timelooper = _timelooper;
        clearInterval(interval);
        interval = setInterval(() => {
          ws.send(JSON.stringify({ type: "update", ...updateData() }));
        }, timelooper);
        ws.send(
          JSON.stringify({
            type: "timelooper",
            ok: true,
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "timelooper",
            ok: false,
            error: "Invalid timeloop. Timeloop must be between 0.1 and 5000.",
          })
        );
      }
    } else {
      ws.send(
        JSON.stringify({
          type: "timelooper",
          ok: false,
          error:
            "Invalid timeloop. Timeloop must be a number between 0.1 and 5000",
        })
      );
    }
  });
  interval = setInterval(() => {
    ws.send(JSON.stringify({ type: "update", ...updateData() }));
  }, timelooper);
};

router.get("/", async (req, res) => {
  if (!updateData().processing) {
    res.json({
      ok: true,
      new: true,
      note: "Processing. Check the /api/update/status endpoint for progress.",
    });
    update();
  } else {
    res.json({
      ok: true,
      new: false,
      note: "Already processing. Check the /api/update/status endpoint for progress.",
    });
  }
});

router.get("/status", (req, res) => {
  res.json(updateData());
});

router.get("/last", (req, res) => {
  db.collection("updates")
    .find({})
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray((err, docs) => {
      res.json(docs[0]);
    });
});

router.post("/webhook", (req, res) => {
  // Verify req.body.wh_url is a valid URL
  let t = req.body.wh_url;
  let c = true;
  if (!t.match(/^(http|https):\/\/[^ "]+$/)) {
    res.status(400).json({
      ok: false,
      error: "Invalid webhook URL",
    });
    c = false;
  }
  // Verify req.body.wh_method is one of: GET, POST, PUT, DELETE
  if (!req.body.wh_method.match(/^(GET|POST|PUT|DELETE)$/)) {
    res.status(400).json({
      ok: false,
      error: "Invalid webhook method",
    });
    c = false;
  }
  if (c) {
    updateAddWebhook(req.body);
    res.json({
      ok: true,
    });
  }
});

export { router, socketHandler };
