import { dbConnection } from "./mongoConnection.js";

const collections = {};

export const getCollection = async (collectionName) => {
  if (!collections[collectionName]) {
    const db = await dbConnection();
    collections[collectionName] = db.collection(collectionName);
  }
  return collections[collectionName];
};

const storesCollection = await getCollection("stores");
const usersCollection = await getCollection("users");

export {storesCollection,usersCollection}
