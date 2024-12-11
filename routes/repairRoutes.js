import express from "express";
import mongoose from "mongoose";
import Repair from "../models/repairModel.js";
// import { isAuthenticated } from "../utilities/middlewares/authenticationMiddleware.js";
import {
  deleteRepair,
  getAllRepairs,
  getRepairById,
  updateRepair,
  createRepair,
  addRepairType,
  updateRepairType,
  deleteRepairType,
  getRepairType,
  getRepairTypes,
} from "../data/repairData.js";

const router = express.Router();

// // home page for repairs
// router.get("/", async (req, res) => {
//   let repairList = await getAllRepairs();
//   res.json(repairList);
// });

// Get all repairs
router.get("/", async (req, res) => {
  try {
    const repairList = await getAllRepairs();

    if (!repairList || repairList.length === 0) {
      return res.status(404).json({
        error: "No repair records found.",
      });
    }

    res.status(200).json(repairList);
  } catch (error) {
    console.error("Error fetching repairs:", error);

    res.status(500).json({
      error: "An error occurred while fetching the repair list.",
    });
  }
});

// create repair
router.post("/", async (req, res) => {
  const { device_type, models } = req.body;

  try {
    if (!device_type || !models || !Array.isArray(models)) {
      return res
        .status(400)
        .json({ error: "Invalid input: device_type and models are required." });
    }

    const newRepair = await createRepair(device_type, models);
    return res.status(201).json(newRepair);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Get repair by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Input Validation**
  if (!id) {
    return res.status(400).json({
      error: "ID parameter is required.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid ID format. Must be a valid MongoDB ObjectId.",
    });
  }

  try {
    const repair = await getRepairById(id);

    if (!repair) {
      return res.status(404).json({
        error: `Repair with ID ${id} not found.`,
      });
    }

    res.status(200).json(repair);
  } catch (error) {
    console.error("Error fetching repair:", error);

    res.status(500).json({
      error: "An internal error occurred while fetching the repair record.",
    });
  }
});

// Update a repair entry
router.put("/:id", async (req, res) => {
  const { device_type, models } = req.body;

  try {
    if (!device_type && !models) {
      return res
        .status(400)
        .json({ error: "Invalid input: device_type or models required." });
    }

    const repair = await updateRepair(req.params.id, { device_type, models });
    res.status(200).json(repair);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    } else if (error.message.includes("Invalid")) {
      return res.status(400).json({ error: error.message });
    } else {
      return res
        .status(500)
        .json({ error: "Failed to update the repair entry." });
    }
  }
});

// Delete a repair entry
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // Input Validation**
  if (!id) {
    return res.status(400).json({
      error: "ID parameter is required.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid ID format. Must be a valid MongoDB ObjectId.",
    });
  }

  try {
    const repair = await deleteRepair(id);

    if (!repair) {
      return res.status(404).json({
        error: `Repair with ID ${id} not found.`,
      });
    }

    res.status(200).json({
      message: `${repair.device_type} repair deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting repair:", error);

    res.status(500).json({
      error: "An internal error occurred while deleting the repair record.",
    });
  }
});

export default router;
