import validatorFuncs from "../utilities/dataValidator.js";
import { ObjectId } from "mongodb";
import Store from "../models/storeModel.js";

async function getAll() {
  const stores = await Store.find();
  const plainStores = stores.map(store => store.toObject());
  return plainStores
}
async function getById(id) {
  id = validatorFuncs.isValidString(id, "Id", getById.id);
  if (!validatorFuncs.validId(id)) {
    throw new Error(`${id} is not valid. Provide a Valid Object ID.`);
  }
  try {
    const store = await Store.findById(id);
    const plainStore =  store.toObject();
    if (!plainStore) throw new Error(`Store with ID ${id} not found.`);
    return plainStore;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function createStore(storeDetails) {
  storeDetails.name = validatorFuncs.isValidString(
    storeDetails.name,
    "name",
    "createStore.storeDetails.name"
  );
  storeDetails.phone = validatorFuncs.isValidString(
    storeDetails.phone,
    "phone",
    "createStore.storeDetails.phone"
  );
  storeDetails.storeManager = validatorFuncs.isValidString(
    storeDetails.storeManager,
    "storeManager",
    "createStore.storeDetails.storeManager"
  );

  const { name, location, phone, storeManager } = storeDetails;
  if (!validatorFuncs.validName(name))
    throw new Error("Please enter valid Name!");
  if (!validatorFuncs.validLocation(location))
    throw new Error("Please enter valid Location!");
  if (!validatorFuncs.isValidPhoneNumber(phone))
    throw new Error("Please enter valid Phone!");
  if (!validatorFuncs.validId(storeManager))
    throw new Error("Please enter valid Store Manager ID!");

  location.type = location.type.trim();
  location.address = location.address.trim();

  try {
    const newStore = await Store.create({ name, location, phone, storeManager }); 
    return newStore;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateStore(storeId, storeDetails) {
  storeId = validatorFuncs.isValidString(
    storeId,
    "storeId",
    updateStore.storeId
  );
  if (!validatorFuncs.validId(storeId)) {
    throw new Error(`${storeId} is not valid. Provide a Valid Object ID.`);
  }
  const store = await Store.findById({
    _id: new ObjectId(storeId),
  });
  
  if (!store) throw new Error(`Store with id ${storeId} not found!`);

  const updatedStoreObject = {};
  if (storeDetails.hasOwnProperty("name")) {
    if (!validatorFuncs.isValidString(storeDetails.name))
      throw new Error("Please enter valid Name!");
    updatedStoreObject.name = storeDetails.name.trim();
  }

  if (storeDetails.hasOwnProperty("location")) {
    if (!validatorFuncs.validLocation(storeDetails.location))
      throw new Error("Please enter valid Location!");
    storeDetails.location.type = storeDetails.location.type.trim();
    storeDetails.location.address = storeDetails.location.address.trim();
    updatedStoreObject.location = storeDetails.location;
  }

  if (storeDetails.hasOwnProperty("phone")) {
    if (!validatorFuncs.isValidPhoneNumber(storeDetails.phone))
      throw new Error("Please enter valid Phone!");
    updatedStoreObject.phone = storeDetails.phone.trim();
  }

  if (storeDetails.hasOwnProperty("storeManager")) {
    if (!validatorFuncs.validId(storeManager))
      throw new Error("Please enter valid Store Manager ID!");
    updatedStoreObject.storeManager = storeDetails.storeManager.trim();
  }

  try {
    const updatedStore = await Store.findByIdAndUpdate(storeId, updatedStoreObject, {
      new: true,
      runValidators: true,
    });
    if (!updatedStore) throw new Error(`Store with ID ${storeId} not found.`);
    return updatedStore;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteStore(storeId) {
  storeId = validatorFuncs.isValidString(
    storeId,
    "storeId",
    updateStore.storeId
  );
  if (!validatorFuncs.validId(storeId)) {
    throw new Error(`${storeId} is not valid. Provide a Valid Object ID.`);
  }
  try {
    const deletedStore = await Store.findByIdAndDelete(storeId);
    if (!deletedStore) throw new Error(`Store with ID ${storeId} not found.`);
    return deletedStore;
  } catch (error) {
    throw new Error(error.message);
  }
}
export { getAll, getById, createStore, updateStore, deleteStore };
