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
    res
      .status(200)
      .render("stores/add-store", {
        title: "Add Store",
        storeManagers: storeManagers,
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to fetch all stores
router.get("/", async (req, res) => {
  try {
    const stores = await getAll();
    // console.log(stores)
    res.status(200).render("stores/all-stores", {
      title: "List of all Stores",
      stores: stores,
      json: JSON.stringify,
      errors: [],
      user: req.session.user,
    });
  } catch (error) {
    res.status(400).json({ error: error });
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
    res.status(200).render("stores/store", {
      title: "Store Details",
      store,
      user: req.session.user,
    });
  } catch (error) {
    errors.push("An unexpected error occurred. Please try again later.");
    // console.log(error);
    res.status(500).render("stores/store", {
      title: "Store Details",
      errors,
    });
  }
});

// Route to add a store
router.post("/", isAuthenticated, hasRole("admin"), async (req, res) => {
  const errors = [];
  const { name, longitude, latitude, address, phone, storeManager } = req.body;
  // console.log(name, longitude, latitude, address, phone, storeManager)
  const location = {
    type: "Point",
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
    address: address.trim(),
  };

  if (!dataValidator.validName(name)) errors.push("Enter a valid name!");
  if (!dataValidator.validLocation(location))
    errors.push("Enter a valid location!");
  if (!dataValidator.isValidPhoneNumber(phone))
    errors.push("Enter a valid phone number!");
  if (!dataValidator.validId(storeManager))
    errors.push("Enter a valid Store Manager ID!");

  if (errors.length > 0) {
    const storeManagers = await getUsersByRole("store-manager");
    res
      .status(400)
      .render("stores/add-store", {
        title: "Add Store",
        storeManagers: storeManagers,
        errors:errors
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
      res.status(200).redirect("/stores");
    } else {
      throw new Error("Failed to add the store");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to update a store
router.patch("/:id", async (req, res) => {
  try {
    const result = await updateStore(req.params.id, req.body);
    if (result) {
      res
        .status(201)
        .json({ message: "Store updated successfully", store: result });
    } else {
      throw new Error("Failed to update the store!");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// Route to delete a store
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteStore(req.params.id);
    if (result) {
      res
        .status(201)
        .json({ message: "Store deleted successfully", store: result });
    } else {
      throw new Error("Failed to delete the store!");
    }
  } catch (error) {
    // console.log(error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
