// ADD functions
// getById, getAll, createStore, Updatetore, DeleteStore
import { ReturnDocument } from "mongodb";
import { storesCollection } from "../config/mongoCollections.js";
import validatorFuncs from "../utilities/dataValidator.js";
import { ObjectId } from "mongodb";

async function getAll() {
  const stores = await storesCollection.find({}).toArray();
  return stores;
}
async function getById(id) {
  id = validatorFuncs.validId(id);
  const store = await storesCollection.findOne({ _id: new ObjectId(id) });
  //   if (!store) throw new Error("No store found with the given ID.");
  return store;
}

async function createStore(storeDetails) {
  const { name, location, phone, storeManager } =
    validatorFuncs.validStore(storeDetails);
  const newStore = new Store({ name, location, phone, storeManager });
  const result = await storesCollection.insertOne(newStore);
  return result.insertId;
}

async function updateStore(storeId, storeDetails) {
  storeId = validatorFuncs.validId(storeId);
  const store = await storesCollection.findOne({
    _id: new ObjectId(storeId),
  });
  // console.log(store)
  if (!store) throw `Store with id ${storeId} not found!`;

  const updatedStoreObject = {};
  if (storeDetails.hasOwnProperty("name"))
    updatedStoreObject.name = validatorFuncs.validName(storeDetails.name);
  if (storeDetails.hasOwnProperty("location"))
    updatedStoreObject.location = validatorFuncs.validLocation(
      storeDetails.location
    );
  if (storeDetails.hasOwnProperty("phone"))
    updatedStoreObject.phone = validatorFuncs.validPhone(storeDetails.phone);
  if (storeDetails.hasOwnProperty("storeManager"))
    updatedStoreObject.storeManager = validatorFuncs.validId(
      storeDetails.storeManager
    );

  const updatedStore = await storesCollection.findOneAndUpdate(
    { _id: new ObjectId(storeId) },
    { $set: updatedStoreObject },
    { returnDocument: "after" }
  );

  if (!updatedStore) throw `Store with id ${storeId} couldn't be updated!`;
  return updatedStore;
}

async function deleteStore(storeId) {
  storeId = validatorFuncs.validId(storeId);
  const deletedStore = storesCollection.findOneAndDelete({
    _id: new ObjectId(storeId),
  });
  return deletedStore
}
export { getAll, getById, createStore, updateStore, deleteStore };
