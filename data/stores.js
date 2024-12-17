import mongoose from "mongoose";
import validatorFuncs from "../utilities/dataValidator.js";
import { ObjectId } from "mongodb";

async function getAll() {
  const stores = await storesCollection.find({}).toArray();
  return stores;
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

async function getReviewsById(storeId) {
  try {
    const feedbacks = await ServiceRequest.find(
      {
        store_id: storeId,
        feedback: { $ne: undefined },
      },
      { feedback: 1, customer_id: 1 }
    )
      .populate("customer_id", "name email")
      .lean();
    return feedbacks;
  } catch (error) {
    throw new Error("Error fetching feedbacks: " + error.message);
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

  const { name, location, phone, storeManager, employees = [] } = storeDetails;

  // Validate Store name
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

  // Validate phone number
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

  // Validate employees array
  if (!Array.isArray(employees)) throw new Error("Employees must be an array.");

  // Check if all employee IDs are valid ObjectIds and correspond to valid "employee" users
  for (let employeeId of employees) {
    if (!validatorFuncs.validId(employeeId))
      throw new Error(`Invalid employee ID: ${employeeId}`);

    // Check if employee exists in the database
    const employeeUser = await User.findById(employeeId);
    if (!employeeUser)
      throw new Error(`Employee with ID ${employeeId} does not exist.`);

    // Check if the user has the "employee" role
    if (employeeUser.role !== "employee")
      throw new Error(`User with ID ${employeeId} is not an employee.`);

    // Check if the employee is already assigned to another store
    const existingStore = await Store.findOne({
      employees: employeeId,
    });
    if (existingStore) {
      throw new Error(
        `Employee with ID ${employeeId} already works at another store (${existingStore.name}).`
      );
    }
  }

  try {
    const newStore = await Store.create({
      name,
      location,
      phone,
      storeManager,
      employees,
    });
    return newStore;
  } catch (error) {
    throw new Error(error.message);
  }
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

async function addEmployeeToStore(storeId, employeeId) {
  // Validate input
  storeId = validatorFuncs.isValidString(
    storeId,
    "storeId",
    "addEmployeeToStore.storeId"
  );
  if (!validatorFuncs.validId(storeId)) {
    throw new Error(`${storeId} is not valid. Provide a Valid Object ID.`);
  }

  employeeId = validatorFuncs.isValidString(
    employeeId,
    "employeeId",
    "addEmployeeToStore.employeeId"
  );
  if (!validatorFuncs.validId(employeeId)) {
    throw new Error(`${employeeId} is not valid. Provide a Valid Object ID.`);
  }

  // Check if store exists
  const store = await Store.findById(storeId);
  if (!store) throw new Error(`Store with ID ${storeId} not found.`);

  // Check if employee exist in the database and has role of employee
  const employeeUser = await User.findById(employeeId);
  if (!employeeUser) {
    throw new Error(`Employee with ID ${employeeId} does not exist.`);
  }
  if (employeeUser.role !== "employee") {
    throw new Error(`User with ID ${employeeId} is not an employee.`);
  }

  // Check if the employee is already assigned to another store
  const existingStore = await Store.findOne({
    employees: employeeId,
  });
  if (existingStore) {
    throw new Error(
      `Employee with ID ${employeeId} already works at another store (${existingStore.name}).`
    );
  }

  // Check if  employee is already in  store employee list
  if (store.employees.includes(employeeId)) {
    throw new Error(
      `Employee with ID ${employeeId} is already part of this store.`
    );
  }

  // Add employee to store's employee array
  store.employees.push(employeeId);

  // Save updated store
  try {
    const updatedStore = await store.save();
    return updatedStore;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function removeEmployeeFromStore(storeId, employeeId) {
  // Validate storeId
  storeId = validatorFuncs.isValidString(
    storeId,
    "storeId",
    "removeEmployeeFromStore.storeId"
  );
  if (!validatorFuncs.validId(storeId)) {
    throw new Error(`${storeId} is not valid. Provide a Valid Object ID.`);
  }

  // Validate employeeId
  employeeId = validatorFuncs.isValidString(
    employeeId,
    "employeeId",
    "removeEmployeeFromStore.employeeId"
  );
  if (!validatorFuncs.validId(employeeId)) {
    throw new Error(`${employeeId} is not valid. Provide a Valid Object ID.`);
  }

  // Check if the store exists
  const store = await Store.findById(storeId);
  if (!store) throw new Error(`Store with ID ${storeId} not found.`);

  // Check if the employee exists in the store's employee list (looking at userId inside populated data)
  const employeeInStore = store.employees?.find(
    (employee) => employee._id.toString() === employeeId
  );

  if (!employeeInStore) {
    throw new Error(`Employee with ID ${employeeId} is not in the store.`);
  }

  // Check if the employee has any service request assigned
  const activeServiceRequest = await ServiceRequest.findOne({
    employee_id: employeeId,
  });

  if (activeServiceRequest) {
    throw new Error(
      `Employee with name ${employeeInStore.name} is assigned to a service request and cannot be removed.`
    );
  }

  // Remove the employee from the store's employee list
  store.employees = store.employees.filter(
    (employee) => employee._id.toString() !== employeeId
  );

  // Save the updated store
  try {
    const updatedStore = await store.save();
    return updatedStore;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function changeStoreManager(storeId, storeManagerId) {
  // Validate input
  storeId = validatorFuncs.isValidString(
    storeId,
    "storeId",
    "changeStoreManager.storeId"
  );
  if (!validatorFuncs.validId(storeId)) {
    throw new Error(`${storeId} is not valid. Provide a Valid Object ID.`);
  }

  // Validate
  storeManagerId = validatorFuncs.isValidString(
    storeManagerId,
    "storeManagerId",
    "changeStoreManager.storeManagerId"
  );
  if (!validatorFuncs.validId(storeManagerId)) {
    throw new Error(
      `${storeManagerId} is not valid. Provide a Valid Object ID.`
    );
  }

  // Check if the store exists
  const store = await Store.findById(storeId);
  if (!store) throw new Error(`Store with ID ${storeId} not found.`);

  // Check if the new store manager exists with role "store-manager"
  const newStoreManager = await User.findById(storeManagerId);
  if (!newStoreManager) {
    throw new Error(`Store Manager with ID ${storeManagerId} does not exist.`);
  }
  if (newStoreManager.role !== "store-manager") {
    throw new Error(`User with ID ${storeManagerId} is not a store manager.`);
  }

  // Check if the storeManagerId is different from the current manager's ID
  if (store.storeManager === storeManagerId) {
    throw new Error("The store is already managed by the provided user.");
  }

  // Update store manager
  store.storeManager = storeManagerId;

  // Save updated store
  try {
    const updatedStore = await store.save();
    return updatedStore;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Function to get employess and service_request count mapping for a give store_id
async function getEmployeesWithServiceRequestCount(store_id) {
  try {
    // Validate store_id
    if (!ObjectId.isValid(store_id)) {
      throw new Error("Invalid store ID");
    }

    // Get store by ID
    const store = await Store.findById(store_id).populate("employees");

    if (!store) {
      throw new Error("Store not found");
    }

    // count the number of service requests assigned to each employee
    const employeesWithRequestCount = await Promise.all(
      store.employees.map(async (employee) => {
        const requestCount = await ServiceRequest.countDocuments({
          employee_id: employee._id,
        });
        return {
          ...employee.toObject(),
          serviceRequestCount: requestCount,
        };
      })
    );

    return employeesWithRequestCount;
  } catch (error) {
    console.error(error);
    throw new Error("Error while fetching employees with service requests");
  }
}

// Function to get the store where an employee works
async function getStoreForEmployee(employee_id) {
  if (!mongoose.isValidObjectId(employee_id)) {
    throw new Error(
      `Invalid Employee ID: ${employee_id}. Please provide a valid Object ID.`
    );
  }

  try {
    const employee = await User.findById(employee_id);

    if (!employee) {
      throw new Error(`Employee with ID ${employee_id} not found.`);
    }

    if (employee.role !== "employee") {
      throw new Error(
        `User with ID ${employee_id} does not have the "employee" role.`
      );
    }

    const store = await Store.findOne({ employees: employee_id });

    // Return nothing if the employee is not found in any store
    if (!store) {
      return;
    }

    // Return store details
    return store;
  } catch (error) {
    throw new Error(error.message);
  }
}

export {
  getAll,
  getById,
  createStore,
  updateStore,
  deleteStore,
  addEmployeeToStore,
  removeEmployeeFromStore,
  changeStoreManager,
  getReviewsById,
  getEmployeesWithServiceRequestCount,
  getStoreForEmployee,
};
