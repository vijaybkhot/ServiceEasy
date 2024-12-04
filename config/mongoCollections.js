import { dbConnection } from "./mongoConnection.js";

const collections = {};

export const getCollection = async (collectionName) => {
  if (!collections[collectionName]) {
    const db = await dbConnection();
    collections[collectionName] = db.collection(collectionName);
  }
  return collections[collectionName];
};

export const storesCollection = await getCollection("servicerequests");