import { MongoClient } from "mongodb";
import { localMongoConfig } from "./settings.js";

let _connection = undefined;
let _db = undefined;

const dbConnection = async () => {
  if (!_connection) {
    _connection = await MongoClient.connect(localMongoConfig.serverUrl);
    _db = _connection.db(localMongoConfig.database);
  }

  return _db;
};
const closeConnection = async () => {
  await _connection.close();
};

export { dbConnection, closeConnection };
