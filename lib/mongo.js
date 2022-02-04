import { MongoClient } from "mongodb";
import "dotenv/config";

const MONGO_URL = process.env.MONGO_URI;
const MONGO_CLIENT = new MongoClient(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
await MONGO_CLIENT.connect();
const db = MONGO_CLIENT.db("ftcstats");
const collection = db.collection("freight-frenzy");

export { MONGO_CLIENT, db, collection };
