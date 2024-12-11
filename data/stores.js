import validatorFuncs from "../utilities/dataValidator.js";
import { ObjectId } from "mongodb";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";

async function getAll() {
  const stores = await Store.find();
  const plainStores = stores.map((store) => store.toObject());
  return plainStores;
}

async function getById(id) {
  id = validatorFuncs.isValidString(id, "Id", getById.id);
  if (!validatorFuncs.validId(id)) {
    throw new Error(`${id} is not valid. Provide a Valid Object ID.`);
  }
  try {
    const store = await Store.findById(id);
    const plainStore = store.toObject();
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

  // if (!validatorFuncs.validName(name))
  //   throw new Error("Please enter valid Name!");
  const nameRegex = /^[a-zA-Z0-9\s\-',.]+$/;
  if (!nameRegex.test(name))
    throw new Error(
      "Store name can only contain alphabets, numbers, spaces, hyphens, apostrophes, and commas."
    );

  // Validate location type
  if (typeof location !== "object" || location === null)
    throw new Error("Location must be an object.");
  if (Array.isArray(location))
    throw new Error("Location must not be an array.");
  location.type = location.type.trim();
  location.address = location.address.trim();
  if (location.type !== "Point")
    throw new Error('Location "type" must be "Point".');
  if (!validatorFuncs.validLocation(location))
    throw new Error("Please enter valid Location!");

  if (!validatorFuncs.isValidPhoneNumber(phone))
    throw new Error("Please enter valid Phone!");

  // Validate Store Manager ID
  if (!validatorFuncs.validId(storeManager))
    throw new Error("Please enter valid Store Manager ID!");
  // Check if the store manager exists in the database and has the role "store-manager"
  const storeManagerUser = await User.findById(storeManager);
  if (!storeManagerUser)
    throw new Error("Store Manager with the provided ID does not exist.");
  if (storeManagerUser.role !== "store-manager")
    throw new Error("The user is not a store manager.");

  try {
    const newStore = await Store.create({
      name,
      location,
      phone,
      storeManager,
    });
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

  // Check for changes
  if (storeDetails.hasOwnProperty("name")) {
    storeDetails.name = validatorFuncs.isValidString(
      storeDetails.name,
      "name",
      "updateStore.storeDetails.name"
    );
    const nameRegex = /^[a-zA-Z0-9\s\-',.]+$/;
    if (!nameRegex.test(storeDetails.name))
      throw new Error(
        "Store name can only contain alphabets, numbers, spaces, hyphens, apostrophes, and commas."
      );
    // Only update if the name has changed
    if (store.name !== storeDetails.name) {
      updatedStoreObject.name = storeDetails.name;
    }
  }

  if (storeDetails.hasOwnProperty("location")) {
    if (
      typeof storeDetails.location !== "object" ||
      storeDetails.location === null
    )
      throw new Error("Location must be an object.");
    if (Array.isArray(storeDetails.location))
      throw new Error("Location must not be an array.");
    storeDetails.location.type = storeDetails.location.type.trim();
    storeDetails.location.address = storeDetails.location.address.trim();
    if (storeDetails.location.type !== "Point")
      throw new Error('Location "type" must be "Point".');
    if (!validatorFuncs.validLocation(storeDetails.location))
      throw new Error("Please enter valid Location!");

    // Only update if the location has changed
    if (
      JSON.stringify(store.location) !== JSON.stringify(storeDetails.location)
    ) {
      updatedStoreObject.location = storeDetails.location;
    }
  }

  if (storeDetails.hasOwnProperty("phone")) {
    if (!validatorFuncs.isValidPhoneNumber(storeDetails.phone))
      throw new Error("Please enter valid Phone!");
    // Only update if the phone has changed
    if (store.phone !== storeDetails.phone.trim()) {
      updatedStoreObject.phone = storeDetails.phone.trim();
    }
  }

  if (storeDetails.hasOwnProperty("storeManager")) {
    storeDetails.storeManager = validatorFuncs.isValidString(
      storeDetails.storeManager,
      "storeManager",
      "updateStore.storeDetails.storeManager"
    );
    if (!validatorFuncs.validId(storeDetails.storeManager))
      throw new Error("Please enter valid Store Manager ID!");

    // Check if the store manager exists in user collection and is of correct role
    const storeManagerUser = await User.findById(storeDetails.storeManager);
    if (!storeManagerUser)
      throw new Error("Store Manager with the provided ID does not exist.");
    if (storeManagerUser.role !== "store-manager")
      throw new Error("The user is not a store manager.");

    // Only update if the storeManager has changed
    if (store.storeManager !== storeDetails.storeManager) {
      updatedStoreObject.storeManager = storeDetails.storeManager;
    }
  }

  // If no fields updated, error
  if (Object.keys(updatedStoreObject).length === 0) {
    throw new Error("No changes detected to update the store.");
  }

  // If changes, update the store
  try {
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      updatedStoreObject,
      {
        new: true,
        runValidators: true,
      }
    );
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
