import express from "express";
import dataValidator from "../utilities/dataValidator.js";
import { storesCollection } from "../config/mongoCollections.js";
import validator from "validator";
import Store from "../models/storeModel.js";
import sanitizeMiddleware from "../utilities/middlewares/securityMiddlewares.js";

const router = express.Router();
router.use(sanitizeMiddleware)

router.get("/", async (req, res) => {
  try {
    // const storesCollection = await getCollection("stores");
    const stores = await storesCollection.find({}).toArray(); 
    res.status(200).json(stores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/", async (req, res) => {
  try {
    const { name, location, phone, storeManager } = dataValidator.validStore(
      req.body
    );
    const newStore = new Store({ name, location, phone, storeManager });
    const result = await storesCollection.insertOne(newStore);
      if (result.insertedId) {
        res.status(201).json({ message: "Store added successfully", store: newStore });
      } else {
        throw new Error("Failed to add the store");
      }
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

export default router;
