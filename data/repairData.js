import { ObjectId } from "mongodb";
import Repair from "../models/repairModel.js";
import dataValidator from "../utilities/dataValidator.js";

// Get all 
export async function getAllRepairs() {
  const repairs = await Repair.find();
  if (repairs.length === 0) {
    throw new Error("No repairs found.");
  }
  return repairs;
}

// Create a new repair entry
export async function createRepair(deviceType, models) {
  // Validate deviceType
  deviceType = dataValidator.isValidString(deviceType, "deviceType", createRepair.name);
  if (!["iPhone", "Macbook", "iPad"].includes(deviceType)) {
    throw new Error(`Invalid device type: ${deviceType}. Must be one of ["iPhone", "Macbook", "iPad"].`);
  }

  // Validate models
  dataValidator.isValidObjectArray(models, "models", createRepair.name);

  const newRepair = { device_type: deviceType, models };
  try {
    const repair = await Repair.create(newRepair);
    return repair;
  } catch (error) {
    throw new Error(`Error creating repair: ${error.message}`);
  }
}

// Get by ID
export async function getRepairById(repairId) {
  repairId = dataValidator.isValidString(repairId, "repairId", getRepairById.name);
  if (!ObjectId.isValid(repairId)) {
    throw new Error(`Invalid ObjectId string: ${repairId}`);
  }

  const repair = await Repair.findById(repairId);
  if (!repair) {
    throw new Error(`Repair with ID: ${repairId} not found.`);
  }
  return repair;
}

//Update repair
export async function updateRepair(repairId, updateObj) {
  // Validate repairId
  repairId = dataValidator.isValidString(repairId, "repairId", updateRepair.name);
  if (!ObjectId.isValid(repairId)) {
    throw new Error(`Invalid ObjectId string: ${repairId}`);
  }

  const repair = await getRepairById(repairId);
  if (!repair) {
    throw new Error(`Repair with ID ${repairId} not found.`);
  }

  let updateData = {};
  if (updateObj.device_type) {
    updateData.device_type = dataValidator.isValidString(updateObj.device_type, "device_type", updateRepair.name);
    if (!["iPhone", "Macbook", "iPad"].includes(updateData.device_type)) {
      throw new Error(`Invalid device type: ${updateData.device_type}.`);
    }
  }

  if (updateObj.models) {
    if (!Array.isArray(updateObj.models)) {
      throw new Error("Models must be an array.");
    }
    updateObj.models.forEach((model, index) => {
      if (!model.model_name || typeof model.model_name !== "string") {
        throw new Error(`Invalid model_name at index ${index}.`);
      }
      if (model.repair_types && Array.isArray(model.repair_types)) {
        model.repair_types.forEach((repairType, rIndex) => {
          if (!repairType.repair_name || typeof repairType.repair_name !== "string") {
            throw new Error(`Invalid repair_name at repair_types index ${rIndex}.`);
          }
          if (!repairType.defective_parts || !Array.isArray(repairType.defective_parts)) {
            throw new Error(`Invalid defective_parts at repair_types index ${rIndex}.`);
          }
          if (repairType.associated_price != null && typeof repairType.associated_price !== "number") {
            throw new Error(`Invalid associated_price at repair_types index ${rIndex}.`);
          }
          if (repairType.estimated_time != null && typeof repairType.estimated_time !== "number") {
            throw new Error(`Invalid estimated_time at repair_types index ${rIndex}.`);
          }
        });
      }
    });
    updateData.models = updateObj.models;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No updates detected in the update object.");
  }

  const updatedRepair = await Repair.findByIdAndUpdate(repairId, updateData, { new: true, runValidators: true });
  if (!updatedRepair) {
    throw new Error(`Could not update repair with ID: ${repairId}`);
  }

  return updatedRepair;
}

// Delete 
export async function deleteRepair(repairId) {
  repairId = dataValidator.isValidString(repairId, "repairId", deleteRepair.name);
  if (!ObjectId.isValid(repairId)) {
    throw new Error(`Invalid ObjectId string: ${repairId}`);
  }

  const deletedRepair = await Repair.findByIdAndDelete(repairId);
  if (!deletedRepair) {
    throw new Error(`Could not delete repair with ID: ${repairId}`);
  }

  return deletedRepair;
}
