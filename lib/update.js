import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { MongoClient } from "mongodb";
import { readFileSync, writeFileSync } from "fs";

const MONGO_URL =
  "mongodb+srv://apps:Guro6297@cluster0.6m26g.mongodb.net/test?authSource=admin&replicaSet=atlas-halo6h-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true&authMechanism=SCRAM-SHA-1";
const MONGO_CLIENT = new MongoClient(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let iterated = 0;
let running = false;
let total = 0;
let stage = "loading";
let beginningTime = 0;
let expectedTotalTime = 99999999;
const updateData = () => {
  if (running) {
    return {
      processing: true,
      inserted: iterated,
      total,
      percentage: (iterated / total) * 100 || 0,
      stage,
      timing: {
        elapsed: Math.floor((performance.now() - beginningTime) / 1000),
        remaining:
          expectedTotalTime === 99999999
            ? 99999999
            : Math.floor(
                (expectedTotalTime - (performance.now() - beginningTime)) / 1000
              ),
      },
    };
  } else {
    return {
      processing: false,
    };
  }
};

const fetchExpectedMTBI = () => {
  let json = readFileSync("times.json", "utf8");
  json = JSON.parse(json);
  let avg = json.reduce((acc, c) => acc + c, 0) / json.length;
  return avg;
};

let webhooks = [];
const updateAddWebhook = (webhook) => {
  webhooks.push(webhook);
};

const update = async () => {
  beginningTime = performance.now();
  stage = "Connecting to database";
  running = true;
  iterated = 0;
  await MONGO_CLIENT.connect();
  const db = MONGO_CLIENT.db("ftcstats");
  let collection = db.collection("freight-frenzy");
  collection.drop();

  stage = "Fetching data from ftcstats.org";
  const idata = await fetch("http://ftcstats.org/2022/qualifiers.html");
  stage = "Parsing data";
  const data = await idata.text();
  const root = parse(data);

  stage = "Selecting data";
  const table = root.querySelector(".sortable").querySelector("tbody");
  const rows = table.querySelectorAll("tr");

  let lastrank = 0;
  // rows.forEach(async (row, i) => {
  total = rows.length;
  expectedTotalTime = total * fetchExpectedMTBI();
  stage = "Processing...";
  let processingTimes = [];
  for (let i = 0; i < rows.length; i++) {
    let btime = performance.now();
    iterated = i;
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    let rank = 0;
    if (parseInt(cells[0].rawText) && parseInt(cells[0].rawText) !== 99999) {
      rank = parseInt(cells[0].rawText);
      lastrank = rank;
    } else {
      rank = lastrank;
    }
    const entry = {
      rank: rank,
      abrank: i + 1,
      team: {
        num: cells[1].rawText,
        name: cells[2].rawText,
        details: cells[1].querySelector("a").attributes.href,
      },
      oprs: {
        opr: parseFloat(cells[4].rawText),
        normalized: parseFloat(cells[3].rawText),
        non_penalty: parseFloat(cells[5].rawText),
        auto: parseFloat(cells[6].rawText),
        teleop: parseFloat(cells[7].rawText),
        endgame: parseFloat(cells[8].rawText),
      },
      np: parseFloat(cells[16].rawText),
      average: parseFloat(cells[17].rawText),
      max_np: parseInt(cells[18].rawText),
      details: {
        auto: {
          freight: parseInt(cells[9].rawText),
        },
        teleop: {
          high: parseInt(cells[10].rawText),
          mid: parseInt(cells[11].rawText),
          shared: parseInt(cells[12].rawText),
        },
        endgame: {
          ducks: parseInt(cells[13].rawText),
          shared: parseInt(cells[14].rawText),
          cap: parseInt(cells[15].rawText),
        },
      },
      event: {
        name: cells[20].rawText,
        state: cells[20].querySelector("a")?.rawText,
      },
      quals_rank: parseInt(cells[21].rawText),
      avg_rp: parseFloat(cells[22].rawText),
      avg_opp: cells[23].rawText !== "" ? parseFloat(cells[23].rawText) : null,
      matches_played: parseInt(cells[24].rawText),
      event_type: cells[25].rawText == "REMOTE" ? "remote" : "local",
      record: {
        w:
          cells[25].rawText == "REMOTE"
            ? null
            : parseInt(cells[25].text.split("‑")[0]), // NOTE: This is not the normal minus sign. It's the non-breaking hyphen (https://www.toptal.com/designers/htmlarrows/punctuation/non-breaking-hyphen/)
        l:
          cells[25].rawText == "REMOTE"
            ? null
            : parseInt(cells[25].text.split("‑")[1]), // NOTE: This is not the normal minus sign. It's the non-breaking hyphen (https://www.toptal.com/designers/htmlarrows/punctuation/non-breaking-hyphen/)
        t:
          cells[25].rawText == "REMOTE"
            ? null
            : parseInt(cells[25].text.split("‑")[2]), // NOTE: This is not the normal minus sign. It's the non-breaking hyphen (https://www.toptal.com/designers/htmlarrows/punctuation/non-breaking-hyphen/)
      },
    };
    await collection.insertOne(entry);
    let etime = performance.now();
    processingTimes.push(etime - btime);
  }
  writeFileSync("times.json", JSON.stringify(processingTimes));
  db.collection("updates").insertOne({
    timestamp: new Date(),
    total,
  });
  stage = "Finished";
  running = false;
  webhooks.forEach((wh) => {
    fetch(wh.wh_url, {
      method: wh_method,
    });
  });
  webhooks = [];
  return true;
};

export { update, updateData, updateAddWebhook };
