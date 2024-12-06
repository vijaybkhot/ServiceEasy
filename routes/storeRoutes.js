import express from "express";
import dataValidator from "../utilities/dataValidator.js";
import { storesCollection } from "../config/mongoCollections.js";
import validator from "validator";
import Store from "../models/storeModel.js";
import { getAll, getById, createStore, updateStore, deleteStore } from "../data/stores.js";
// import validId from "../utilities/dataValidator.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stores = await getAll();
    // console.log(stores)
    res.status(200).render("stores/all-stores",{
      title:"List of all Stores",
      stores:stores,
      json:JSON.stringify,
    });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = dataValidator.validId(req.params.id);
    const store = await getById(id);
    res.status(200).render("stores/store", { title: "Store Details", store })
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
});
router.post("/", async (req, res) => {
  try {
    const result = await createStore(req.body);
    if (result) {
      res
        .status(201)
        .json({ message: "Store added successfully", store: result });
    } else {
      throw new Error("Failed to add the store");
    }
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const result = await updateStore(req.params.id, req.body);
    // console.log(result)
    if (result) {
      res
        .status(201)
        .json({ message: "store Updated successfully", store: result });
    } else {
      throw new Error("Failed to update the store!");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteStore(req.params.id);
    // console.log(result)
    if (result) {
      res
        .status(201)
        .json({ message: "store Deleted successfully", store: result });
    } else {
      throw new Error("Failed to delete the store!");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
})
export default router;
