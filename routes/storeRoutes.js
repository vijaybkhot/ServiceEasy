import express from "express";
import dataValidator from "../utilities/dataValidator.js";
import {
  getAll,
  getById,
  createStore,
  updateStore,
  deleteStore,
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
  const errors = [];
  try {
    const id = dataValidator.isValidString(
      req.params.id,
      "id",
      "/get Store Route"
    );
    if (!dataValidator.validId(id)) {
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
  const errors = [];
  const { name, longitude, latitude, address, phone, storeManager } = req.body;

  const location = {
    type: "Point",
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
    address: address.trim(),
  };

  const nameRegex = /^[a-zA-Z0-9\s\-',.]+$/;
  if (!nameRegex.test(name))
    throw new Error(
      "Store name can only contain alphabets, numbers, spaces, hyphens, apostrophes, and commas."
    );
  if (!dataValidator.validLocation(location))
    errors.push("Enter a valid location!");
  if (!dataValidator.isValidPhoneNumber(phone))
    errors.push("Enter a valid phone number!");
  if (!dataValidator.validId(storeManager))
    errors.push("Enter a valid Store Manager ID!");

  if (errors.length > 0) {
    const storeManagers = await getUsersByRole("store-manager");
    return res.status(400).render("stores/add-store", {
      title: "Add Store",
      storeManagers: storeManagers,
      errors: errors,
    });
  }

  try {
    const storeDetails = {
      name: name,
      location: location,
      phone: phone,
      storeManager: storeManager,
    };
    const result = await createStore(storeDetails);
    if (result) {
      return res.status(200).redirect("/stores");
    } else {
      throw new Error("Failed to add the store");
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Route to update a store
router.patch("/:id", async (req, res) => {
  try {
    const result = await updateStore(req.params.id, req.body);
    if (result) {
      return res
        .status(201)
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

export default router;
