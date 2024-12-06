import express from "express";
import Repair from "../models/repairModel.js";
// import { isAuthenticated } from "../utilities/middlewares/authenticationMiddleware.js";
import { deleteRepair, getAllRepairs, getRepairById, updateRepair, createRepair } from "../data/repairData.js";

const router = express.Router();

// home page for repairs
router.get("/", async (req, res) => { 
  let repairList = await getAllRepairs();
  res.json(repairList);
});

// Get all repairs
router.get("/", async (req, res) => {
  try {
    let repairList = await getAllRepairs();
    res.json(repairList);
  
    } catch (error) {
    res.sendStatus(500);

    }
});

// create repair
router.post("/", async (req, res) => {
  const { device_type, models } = req.body;

  try {
    if (!device_type || !models || !Array.isArray(models)) {
      return res.status(400).json({ error: "Invalid input: device_type and models are required." });
    }

    const newRepair = await createRepair(device_type, models);
    return res.status(201).json(newRepair);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Get repair by ID
router.get("/:id", async (req, res) => {
  try {

    let repair = await getRepairById(req.params.id);
    if (!repair) {
      return res.status(404).json({ error: "Repair not found" });
    }
    res.json(repair);
    } catch (error) {
      res.status(500).json({ error: "Error in getRepairById route" });
    }
});

// Update a repair entry
router.put("/:id", async (req, res) => {
  const { device_type, models } = req.body;

  try {
    if (!device_type && !models) {
      return res.status(400).json({ error: "Invalid input: device_type or models required." });
    }

    const repair = await updateRepair(req.params.id, { device_type, models });
    res.status(200).json(repair);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    } else if (error.message.includes("Invalid")) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: "Failed to update the repair entry." });
    }
  }
});

// Delete a repair entry
router.delete("/:id", async (req, res) => {
  try {
    let repair = await deleteRepair(req.params.id);
    if (!repair) {
      return res.sendStatus(404);
    }
    res.json({message:`${repair.device_type} repair deleted successfully.`});
  } catch (error) {
    res.sendStatus(500);
  } 
});


export default router;
