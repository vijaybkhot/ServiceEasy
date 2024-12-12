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
  getRepairType,
  getRepairTypes,
  updateRepairType,
  deleteRepairType,
} from "../data/repairData.js";

const router = express.Router();

// // home page for repairs
// router.get("/", async (req, res) => {
//   let repairList = await getAllRepairs();
//   res.json(repairList);
// });

// helper validation function
const isValidRepair = (models) => {
  if (!Array.isArray(models) || models.length === 0) {
    return false;
  }

  return models.every(model => {
    if (!model || typeof model !== 'object') return false;

    // model_name
    if (!model.model_name || typeof model.model_name !== 'string' || 
        model.model_name.trim().length < 2 || model.model_name.trim().length > 100) {
      return false;
    }

    // repair_types
    if (!Array.isArray(model.repair_types) || model.repair_types.length === 0) {
      return false;
    }

    // each repair type
    return model.repair_types.every(repair => {
      // repair_name
      if (!repair.repair_name || typeof repair.repair_name !== 'string' || 
          repair.repair_name.trim().length < 2 || repair.repair_name.trim().length > 100) {
        return false;
      }

      // defective_parts
      if (!Array.isArray(repair.defective_parts) || repair.defective_parts.length === 0 ||
          !repair.defective_parts.every(part => typeof part === 'string')) {
        return false;
      }

      // associated_price
      if (typeof repair.associated_price !== 'number' || repair.associated_price < 0) {
        return false;
      }

      // estimated_time
      if (typeof repair.estimated_time !== 'number' || repair.estimated_time < 0) {
        return false;
      }
      return true;
    });
  });
};

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

  if (!device_type || !models) {
    return res.status(400).json({ error: "Invalid input: device_type and models are required." });
  }

  if (typeof device_type !== 'string' || device_type.trim().length < 2 || device_type.trim().length > 50) {
    return res.status(400).json({
      error: "Device type must be a string between 2 and 50 characters.",
    });
  }

  if (!isValidRepair(models)) {
    return res.status(400).json({
      error: "Invalid models structure. Each model must have a valid model_name and repair_types.",
    });
  }

  try {  
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
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { device_type, models } = req.body;

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


  if (!device_type && !models) {
    return res.status(400).json({
       error: "Invalid input: device_type or models required." 
      });
  }

  if (device_type) {
    if (typeof device_type !== 'string' || device_type.trim().length < 2 || device_type.trim().length > 50) {
      return res.status(400).json({
        error: "Device type must be a string between 2 and 50 characters.",
      });
    }
  }

  if (models) {
    if (!isValidRepair(models)) {
      return res.status(400).json({
        error: "Invalid models structure. Each model must have a valid model_name and repair_types.",
      });
    }
  }

  try {
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

// route to add repairtype
router.post("/:deviceType/:modelName/repair-types", async (req, res) => {
  const { deviceType, modelName } = req.params;
  const newRepairType = req.body;

  if (!deviceType || !modelName) {
    return res.status(400).json({ error: "Device type and model name are required." });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty." });
  }

  const { repair_name, defective_parts, associated_price, estimated_time } = newRepairType;

  if (!repair_name || typeof repair_name !== "string") {
    return res.status(400).json({ error: "Valid repair_name is required." });
  }

  if (!Array.isArray(defective_parts) || defective_parts.length === 0) {
    return res.status(400).json({ error: "defective_parts must be a non-empty array." });
  }

  if (typeof associated_price !== "number" || associated_price <= 0) {
    return res.status(400).json({ error: "associated_price must be a positive number." });
  }

  if (typeof estimated_time !== "number" || estimated_time <= 0) {
    return res.status(400).json({ error: "estimated_time must be a positive number." });
  }
  
  try {
    const result = await addRepairType(deviceType, modelName, newRepairType);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// to get repairtype by devicetype and model
router.get("/:deviceType/:modelName/repair-types", async (req, res) => {
  const { deviceType, modelName } = req.params;

  if (!deviceType || !modelName) {
    return res.status(400).json({ error: "Device type and model name are required." });
  }

  try {
    const repairTypes = await getRepairTypes(deviceType, modelName);
    res.status(200).json(repairTypes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// to get repairtype by repair name
router.get("/:deviceType/:modelName/repair-types/:repairName", async (req, res) => {
  const { deviceType, modelName, repairName } = req.params;

  if (!deviceType || !modelName || !repairName) {
    return res.status(400).json({ error: "Device type, model name, and repair name are required." });
  }

  try {
    const repairType = await getRepairType(deviceType, modelName, repairName);
    res.status(200).json(repairType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// update repairtype
router.patch("/:deviceType/:modelName/repair-types/:repairTypeId", async (req, res) => {
  const { deviceType, modelName, repairTypeId } = req.params;
  const updateObj = req.body;

  if (!deviceType || !modelName || !repairTypeId) {
    return res.status(400).json({ error: "Device type, model name, and repair type ID are required." });
  }
  
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty." });
  }

  if (updateObj.repair_name && typeof updateObj.repair_name !== "string") {
    return res.status(400).json({ error: "repair_name must be a valid string." });
  }

  if (
    updateObj.defective_parts &&
    (!Array.isArray(updateObj.defective_parts) || updateObj.defective_parts.length === 0)
  ) {
    return res.status(400).json({ error: "defective_parts must be a non-empty array." });
  }

  if (
    updateObj.associated_price &&
    (typeof updateObj.associated_price !== "number" || updateObj.associated_price <= 0)
  ) {
    return res.status(400).json({ error: "associated_price must be a positive number." });
  }

  if (
    updateObj.estimated_time &&
    (typeof updateObj.estimated_time !== "number" || updateObj.estimated_time <= 0)
  ) {
    return res.status(400).json({ error: "estimated_time must be a positive number." });
  }

  try {
    const updatedRepairType = await updateRepairType(deviceType, modelName, repairTypeId, updateObj);
    res.status(200).json(updatedRepairType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete repair type
router.delete("/:deviceType/:modelName/repair-types/:repairName", async (req, res) => {
  const { deviceType, modelName, repairName } = req.params;

  if (!deviceType || !modelName || !repairName) {
    return res.status(400).json({ error: "Device type, model name, and repair name are required." });
  }

  try {
    const result = await deleteRepairType(deviceType, modelName, repairName);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
