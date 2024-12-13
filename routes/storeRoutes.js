import express from "express";
import validatorFuncs from "../utilities/dataValidator.js";
import {
  getAll,
  getById,
  createStore,
  updateStore,
  deleteStore,
  addEmployeeToStore,
  removeEmployeeFromStore,
  changeStoreManager,
} from "../data/stores.js";
import {
  isAuthenticated,
  hasRole,
} from "../utilities/middlewares/authenticationMiddleware.js";
import { getUsersByRole } from "../data/user.js";

const router = express.Router();

// Route to render the "Add Store" page
router.get("/add", isAuthenticated, hasRole("admin"), async (req, res) => {
  try {
    const storeManagers = await getUsersByRole("store-manager");
    return res.status(200).render("stores/add-store", {
      title: "Add Store",
      storeManagers: storeManagers,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Route to fetch all stores
router.get("/", async (req, res) => {
  try {
    const stores = await getAll();
    // console.log(stores)
    return res.status(200).render("stores/all-stores", {
      title: "List of all Stores",
      stores: stores,
      json: JSON.stringify,
      errors: [],
      user: req.session.user,
    });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
});

// Route to fetch all stores in JSON
router.get("/jsonStores", async (req, res) => {
  try {
    const stores = await getAll();

    if (!stores) {
      return res.status(404).json({ error: "No stores found" });
    }

    return res.status(200).json({
      success: true,
      stores: stores,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Route to fetch a specific store by ID
router.get("/:id", async (req, res) => {
  let errors = [];
  try {
    const id = validatorFuncs.isValidString(
      req.params.id,
      "id",
      "/get Store Route"
    );
    if (!validatorFuncs.validId(id)) {
      errors.push("Please provide a valid Store ID!");
    }
    if (errors.length > 0) {
      return res.status(400).render("stores/store", {
        title: "Store Details",
        errors,
      });
    }
    const store = await getById(id);
    return res.status(200).render("stores/store", {
      title: "Store Details",
      json: JSON.stringify,
      store,
      errors: [],
      user: req.session.user,
    });
  } catch (error) {
    errors.push("An unexpected error occurred. Please try again later.");
    // console.log(error);
    return res.status(500).render("stores/store", {
      title: "Store Details",
      errors,
    });
  }
});

// Route to add a store
router.post("/", isAuthenticated, hasRole("admin"), async (req, res) => {
  let errors = [];
  let { name, longitude, latitude, address, phone, storeManager, employees } =
    req.body;

  // Prepare location object
  const location = {
    type: "Point",
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
    address: address.trim(),
  };

  // Validation for the store name
  const nameRegex = /^[a-zA-Z0-9\s\-',.]+$/;
  if (!nameRegex.test(name)) {
    throw new Error(
      "Store name can only contain alphabets, numbers, spaces, hyphens, apostrophes, and commas."
    );
  }

  // Validate location, phone number, and storeManager ID
  if (!validatorFuncs.validLocation(location)) {
    errors.push("Enter a valid location!");
  }

  if (!validatorFuncs.isValidPhoneNumber(phone)) {
    errors.push("Enter a valid phone number!");
  }

  if (!validatorFuncs.validId(storeManager)) {
    errors.push("Enter a valid Store Manager ID!");
  }

  // Validate employees array and ensure each employee ID is valid
  if (employees && Array.isArray(employees)) {
    employees.forEach((employeeId) => {
      if (!validatorFuncs.validId(employeeId)) {
        errors.push(`Invalid employee ID: ${employeeId}`);
      }
    });
  }

  // If there are validation errors, return the response with errors
  if (errors.length > 0) {
    const storeManagers = await getUsersByRole("store-manager");
    return res.status(400).render("stores/add-store", {
      title: "Add Store",
      storeManagers: storeManagers,
      errors: errors,
    });
  }

  try {
    // Prepare the store details to be created
    const storeDetails = {
      name: name,
      location: location,
      phone: phone,
      storeManager: storeManager,
      employees: employees || [], // Default to an empty array if no employees are provided
    };

    // Call createStore function to add the store to the database
    const result = await createStore(storeDetails);

    // Redirect to the stores page if successful
    if (result) {
      return res.status(200).redirect("/stores");
    } else {
      throw new Error("Failed to add the store");
    }
  } catch (error) {
    // Return an error if any exception occurs
    return res.status(400).json({ error: error.message });
  }
});

// Route to update a store
router.patch("/:id", async (req, res) => {
  let errors = [];

  // Validate employees array if provided
  let { employees } = req.body;
  if (employees && Array.isArray(employees)) {
    employees.forEach((employeeId) => {
      if (!validatorFuncs.validId(employeeId)) {
        errors.push(`Invalid employee ID: ${employeeId}`);
      }
    });
  }

  // If there are validation errors, return a 400 response with the errors
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const result = await updateStore(req.params.id, req.body);
    if (result) {
      return res
        .status(200)
        .json({ message: "Store updated successfully", store: result });
    } else {
      throw new Error("Failed to update the store!");
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
});

// Route to delete a store
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteStore(req.params.id);
    if (result) {
      return res
        .status(201)
        .json({ message: "Store deleted successfully", store: result });
    } else {
      throw new Error("Failed to delete the store!");
    }
  } catch (error) {
    // console.log(error);
    return res.status(400).json({ error: error.message });
  }
});

// Route to add an employee to a store
router.post(
  "/:storeId/employees/:employeeId",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    let { storeId, employeeId } = req.params;
    let errors = [];

    // Validate storeId
    storeId = validatorFuncs.isValidString(
      storeId,
      "storeId",
      "addEmployeeToStore.storeId"
    );
    if (!validatorFuncs.validId(storeId)) {
      errors.push(`${storeId} is not valid. Provide a Valid Object ID.`);
    }

    // Validate employeeId
    employeeId = validatorFuncs.isValidString(
      employeeId,
      "employeeId",
      "addEmployeeToStore.employeeId"
    );
    if (!validatorFuncs.validId(employeeId)) {
      errors.push(`${employeeId} is not valid. Provide a Valid Object ID.`);
    }

    // If there are validation errors, return them as JSON
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Call the function to add the employee to the store
      let updatedStore = await addEmployeeToStore(storeId, employeeId);

      // If the employee was successfully added, return a success message as JSON
      return res.status(200).json({
        message: `Employee with ID ${employeeId} successfully added to store ${storeId}`,
        store: updatedStore,
      });
    } catch (error) {
      // Return any errors as JSON with a 400 status code
      return res.status(400).json({ error: error.message });
    }
  }
);

// Route to remove an employee from a store
router.delete(
  "/:storeId/employees/:employeeId",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    let { storeId, employeeId } = req.params;
    let errors = [];

    // Validate storeId
    storeId = validatorFuncs.isValidString(
      storeId,
      "storeId",
      "removeEmployeeFromStore.storeId"
    );
    if (!validatorFuncs.validId(storeId)) {
      errors.push(`${storeId} is not valid. Provide a Valid Object ID.`);
    }

    // Validate employeeId
    employeeId = validatorFuncs.isValidString(
      employeeId,
      "employeeId",
      "removeEmployeeFromStore.employeeId"
    );
    if (!validatorFuncs.validId(employeeId)) {
      errors.push(`${employeeId} is not valid. Provide a Valid Object ID.`);
    }

    // If there are validation errors, return them as JSON
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Call the function to remove the employee from the store
      const updatedStore = await removeEmployeeFromStore(storeId, employeeId);

      // If the employee was successfully removed, return a success message as JSON
      return res.status(200).json({
        message: `Employee with ID ${employeeId} successfully removed from store ${storeId}`,
        store: updatedStore,
      });
    } catch (error) {
      // Return any errors as JSON with a 400 status code
      return res.status(400).json({ error: error.message });
    }
  }
);

// Route to change the store manager
router.patch(
  "/:storeId/manager/:storeManagerId",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    let { storeId, storeManagerId } = req.params;
    let errors = [];

    // Validate storeId
    storeId = validatorFuncs.isValidString(
      storeId,
      "storeId",
      "changeStoreManager.storeId"
    );
    if (!validatorFuncs.validId(storeId)) {
      errors.push(`${storeId} is not valid. Provide a Valid Object ID.`);
    }

    // Validate storeManagerId
    storeManagerId = validatorFuncs.isValidString(
      storeManagerId,
      "storeManagerId",
      "changeStoreManager.storeManagerId"
    );
    if (!validatorFuncs.validId(storeManagerId)) {
      errors.push(`${storeManagerId} is not valid. Provide a Valid Object ID.`);
    }

    // If there are validation errors, return them as JSON
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Call the function to change the store manager
      const updatedStore = await changeStoreManager(storeId, storeManagerId);

      // If the manager was successfully changed, return a success message and the updated store
      return res.status(200).json({
        message: `Store manager successfully changed to ${storeManagerId}`,
        store: updatedStore,
      });
    } catch (error) {
      // Return any errors as JSON with a 400 status code
      return res.status(400).json({ error: error.message });
    }
  }
);
export default router;
