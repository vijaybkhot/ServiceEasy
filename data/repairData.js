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
  deviceType = dataValidator.isValidString(
    deviceType,
    "deviceType",
    createRepair.name
  );
  if (!["iPhone", "Macbook", "iPad"].includes(deviceType)) {
    throw new Error(
      `Invalid device type: ${deviceType}. Must be one of ["iPhone", "Macbook", "iPad"].`
    );
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
  repairId = dataValidator.isValidString(
    repairId,
    "repairId",
    getRepairById.name
  );
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
  repairId = dataValidator.isValidString(
    repairId,
    "repairId",
    updateRepair.name
  );
  if (!ObjectId.isValid(repairId)) {
    throw new Error(`Invalid ObjectId string: ${repairId}`);
  }

  const repair = await getRepairById(repairId);
  if (!repair) {
    throw new Error(`Repair with ID ${repairId} not found.`);
  }

  let updateData = {};
  if (updateObj.device_type) {
    updateData.device_type = dataValidator.isValidString(
      updateObj.device_type,
      "device_type",
      updateRepair.name
    );
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
          if (
            !repairType.repair_name ||
            typeof repairType.repair_name !== "string"
          ) {
            throw new Error(
              `Invalid repair_name at repair_types index ${rIndex}.`
            );
          }
          if (
            !repairType.defective_parts ||
            !Array.isArray(repairType.defective_parts)
          ) {
            throw new Error(
              `Invalid defective_parts at repair_types index ${rIndex}.`
            );
          }
          if (
            repairType.associated_price != null &&
            typeof repairType.associated_price !== "number"
          ) {
            throw new Error(
              `Invalid associated_price at repair_types index ${rIndex}.`
            );
          }
          if (
            repairType.estimated_time != null &&
            typeof repairType.estimated_time !== "number"
          ) {
            throw new Error(
              `Invalid estimated_time at repair_types index ${rIndex}.`
            );
          }
        });
      }
    });
    updateData.models = updateObj.models;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No updates detected in the update object.");
  }

  const updatedRepair = await Repair.findByIdAndUpdate(repairId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updatedRepair) {
    throw new Error(`Could not update repair with ID: ${repairId}`);
  }

  return updatedRepair;
}

// Delete
export async function deleteRepair(repairId) {
  repairId = dataValidator.isValidString(
    repairId,
    "repairId",
    deleteRepair.name
  );
  if (!ObjectId.isValid(repairId)) {
    throw new Error(`Invalid ObjectId string: ${repairId}`);
  }

  const deletedRepair = await Repair.findByIdAndDelete(repairId);
  if (!deletedRepair) {
    throw new Error(`Could not delete repair with ID: ${repairId}`);
  }

  return deletedRepair;
}

//  Functions for repair types

// Add a repair type to an existing device_type and model_name
export async function addRepairType(device_type, model_name, new_repair_type) {
  // Input validation
  if (!["iPhone", "Macbook", "iPad"].includes(device_type)) {
    throw new Error(
      `Invalid device type: ${device_type}. Must be one of ["iPhone", "Macbook", "iPad"].`
    );
  }

  if (typeof model_name !== "string" || model_name.trim() === "") {
    throw new Error(
      `Invalid model name: ${model_name}. It must be a non-empty string.`
    );
  }

  if (!new_repair_type || typeof new_repair_type !== "object") {
    throw new Error("The new repair type must be a valid object.");
  }

  const { repair_name, defective_parts, associated_price, estimated_time } =
    new_repair_type;

  // Validate repair name
  if (typeof repair_name !== "string" || repair_name.trim() === "") {
    throw new Error(
      `Invalid repair name: ${repair_name}. It must be a non-empty string.`
    );
  }

  // Validate defective parts
  if (!Array.isArray(defective_parts) || defective_parts.length === 0) {
    throw new Error(`Defective parts must be an array with at least one part.`);
  }
  defective_parts.forEach((part, index) => {
    if (typeof part !== "string" || part.trim() === "") {
      throw new Error(
        `Each defective part must be a non-empty string. Found invalid entry at index ${index}.`
      );
    }
  });

  // Validate associated price
  if (typeof associated_price !== "number" || associated_price <= 0) {
    throw new Error(
      `Invalid associated price: ${associated_price}. It must be a positive number.`
    );
  }

  // Validate estimated time
  if (typeof estimated_time !== "number" || estimated_time <= 0) {
    throw new Error(
      `Invalid estimated time: ${estimated_time}. It must be a positive number representing hours.`
    );
  }

  try {
    const repairDocument = await Repair.findOne({ device_type });

    if (!repairDocument) {
      throw new Error(
        `No repair document found for device type: ${device_type}.`
      );
    }

    // Check if specific model within the models array exists
    const model = repairDocument.models.find(
      (model) => model.model_name === model_name
    );

    if (!model) {
      throw new Error(
        `No model found with name: ${model_name} under device type: ${device_type}.`
      );
    }

    // Check if the repair name already exists for this model
    const existingRepair = model.repair_types.find(
      (repair) => repair.repair_name === repair_name
    );
    if (existingRepair) {
      throw new Error(
        `A repair with the name "${repair_name}" already exists for model "${model_name}" under device type "${device_type}".`
      );
    }

    // Add the new repair type to the models repair_types array
    const newRepairType = {
      repair_name: repair_name.trim(),
      defective_parts: defective_parts.map((part) => part.trim()),
      associated_price,
      estimated_time,
    };

    model.repair_types.push(newRepairType);

    // Save the updated document
    await repairDocument.save();

    return {
      message: `Successfully added new repair type "${repair_name}" to model "${model_name}" under device type "${device_type}".`,
      repairDocument,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get all repair types for a give device_type and a model
export async function getRepairTypes(deviceType, modelName) {
  // Validate inputs
  deviceType = dataValidator.isValidString(
    deviceType,
    "deviceType",
    getRepairTypes.name
  );
  modelName = dataValidator.isValidString(
    modelName,
    "modelName",
    getRepairTypes.name
  );

  // Check if the device with the given deviceType exists
  const existingDevice = await Device.findOne({ device_type: deviceType });
  if (!existingDevice) {
    throw new Error(`No device found with device_type: ${deviceType}.`);
  }

  // Check if the model exists in the device's models array
  const model = existingDevice.models.find((m) => m.model_name === modelName);
  if (!model) {
    throw new Error(
      `No model found with model_name: ${modelName} for device_type: ${deviceType}.`
    );
  }

  // Return the repair types for the given model
  return model.repair_types;
}

// Get a repair type by repair_name
export async function getRepairType(deviceType, modelName, repairName) {
  // Validate device type
  deviceType = dataValidator.isValidString(
    deviceType,
    "device_type",
    getRepairType.name
  );

  // Find the device by device_type
  const existingDevice = await Repair.findOne({ device_type: deviceType });
  if (!existingDevice) {
    throw new Error(`No device found with device_type: ${deviceType}.`);
  }

  // Find the model by model_name within the models array
  const model = existingDevice.models.find(
    (model) => model.model_name === modelName
  );
  if (!model) {
    throw new Error(
      `No model found with model_name: ${modelName} for device_type: ${deviceType}.`
    );
  }

  // Find the repair type by repair_name within the repair_types array
  const repairType = model.repair_types.find(
    (repair) => repair.repair_name === repairName
  );
  if (!repairType) {
    throw new Error(
      `No repair type found with repair_name: ${repairName} for model: ${modelName} and device_type: ${deviceType}.`
    );
  }

  // Return the repair type
  return repairType;
}

// Update a repair type:
export async function updateRepairType(
  deviceType,
  modelName,
  repairTypeId,
  updateObj
) {
  // Validate device type
  deviceType = dataValidator.isValidString(
    deviceType,
    "device_type",
    updateRepairType.name
  );

  const existingDevice = await Repair.findOne({ device_type: deviceType });
  if (!existingDevice) {
    throw new Error(`No device found with device_type: ${deviceType}.`);
  }

  // Find the model by model name within the models array
  const model = existingDevice.models.find(
    (model) => model.model_name === modelName
  );
  if (!model) {
    throw new Error(
      `No model found with model_name: ${modelName} for device_type: ${deviceType}.`
    );
  }

  // Find the repair type by repair ID within the repair_types array
  const repairTypeIndex = model.repair_types.findIndex(
    (repair) => repair._id.toString() === repairTypeId
  );
  if (repairTypeIndex === -1) {
    throw new Error(
      `No repair type found with ID: ${repairTypeId} in model: ${modelName} for device: ${deviceType}.`
    );
  }

  // Get the repair type object to update
  const existingRepairType = model.repair_types[repairTypeIndex];

  let updateObject = {};

  // Validate and update repair_name
  if (updateObj.repair_name) {
    updateObject.repair_name = dataValidator.isValidString(
      updateObj.repair_name,
      "repair_name",
      updateRepairType.name
    );
  }

  // Validate and update defective_parts (array)
  if (updateObj.defective_parts) {
    if (
      !Array.isArray(updateObj.defective_parts) ||
      updateObj.defective_parts.some((part) => typeof part !== "string")
    ) {
      throw new Error("defective_parts must be an array of strings.");
    }
    updateObject.defective_parts = updateObj.defective_parts;
  }

  // Validate and update associated_price
  if (updateObj.associated_price !== undefined) {
    if (
      typeof updateObj.associated_price !== "number" ||
      updateObj.associated_price < 0
    ) {
      throw new Error("associated_price must be a positive number.");
    }
    updateObject.associated_price = updateObj.associated_price;
  }

  // Validate and update estimated_time
  if (updateObj.estimated_time !== undefined) {
    if (
      typeof updateObj.estimated_time !== "number" ||
      updateObj.estimated_time < 0
    ) {
      throw new Error("estimated_time must be a positive number.");
    }
    updateObject.estimated_time = updateObj.estimated_time;
  }

  // Remove unchanged fields
  if (existingRepairType.repair_name === updateObject.repair_name) {
    delete updateObject.repair_name;
  }

  if (
    JSON.stringify(existingRepairType.defective_parts) ===
    JSON.stringify(updateObject.defective_parts)
  ) {
    delete updateObject.defective_parts;
  }

  if (existingRepairType.associated_price === updateObject.associated_price) {
    delete updateObject.associated_price;
  }

  if (existingRepairType.estimated_time === updateObject.estimated_time) {
    delete updateObject.estimated_time;
  }

  // Throw error if no fields were updated
  if (Object.keys(updateObject).length === 0) {
    throw new Error(
      `No changes detected for repair type with ID: ${repairTypeId} in model: ${modelName} for device: ${deviceType}.`
    );
  }

  // Update the repair type in the array
  for (const [key, value] of Object.entries(updateObject)) {
    model.repair_types[repairTypeIndex][key] = value;
  }

  // Save the changes to the database
  let updatedDevice;
  try {
    updatedDevice = await existingDevice.save();
  } catch (error) {
    throw new Error(`Error updating repair type: ${error.message}`);
  }

  if (!updatedDevice) {
    throw new Error(
      `Could not update repair type with ID: ${repairTypeId} in model: ${modelName} for device: ${deviceType}.`
    );
  }

  // Return the updated repair type
  return model.repair_types[repairTypeIndex];
}

// Delete a repair type for a given device_type and model_name
export async function deleteRepairType(deviceType, modelName, repairTypeName) {
  // Validate inputs
  deviceType = dataValidator.isValidString(
    deviceType,
    "deviceType",
    deleteRepairType.name
  );
  modelName = dataValidator.isValidString(
    modelName,
    "modelName",
    deleteRepairType.name
  );
  repairTypeName = dataValidator.isValidString(
    repairTypeName,
    "repairTypeName",
    deleteRepairType.name
  );

  // Check if the device with the given deviceType exists
  const existingDevice = await Device.findOne({ device_type: deviceType });
  if (!existingDevice) {
    throw new Error(`No device found with device_type: ${deviceType}.`);
  }

  // Check if the model exists in the device's models array
  const model = existingDevice.models.find((m) => m.model_name === modelName);
  if (!model) {
    throw new Error(
      `No model found with model_name: ${modelName} for device_type: ${deviceType}.`
    );
  }

  // Check if the repair type exists in the model's repair_types array
  const repairIndex = model.repair_types.findIndex(
    (rt) => rt.name === repairTypeName
  );
  if (repairIndex === -1) {
    throw new Error(
      `No repair type found with name: ${repairTypeName} for model_name: ${modelName} and device_type: ${deviceType}.`
    );
  }

  // Remove the repair type from the repair_types array
  model.repair_types.splice(repairIndex, 1);

  // Save the updated device document
  let updatedDevice;
  try {
    updatedDevice = await existingDevice.save();
  } catch (error) {
    throw new Error(`Error deleting repair type: ${error.message}`);
  }

  if (!updatedDevice) {
    throw new Error(
      `Could not update device with device_type: ${deviceType} after deleting repair type: ${repairTypeName}.`
    );
  }

  return {
    message: `Successfully deleted repair type '${repairTypeName}' from model '${modelName}' for device_type '${deviceType}'.`,
    updatedDevice,
  };
}

// Get models for a device_type
export async function getModelsForDeviceType(deviceType) {
  // Validate deviceType
  deviceType = dataValidator.isValidString(
    deviceType,
    "deviceType",
    getModelsForDeviceType.name
  );
  if (!["iPhone", "Macbook", "iPad"].includes(deviceType)) {
    throw new Error(
      `Invalid device type: ${deviceType}. Must be one of ["iPhone", "Macbook", "iPad"].`
    );
  }

  try {
    // Fetch repair data for the given device type
    const repair = await Repair.findOne({ device_type: deviceType });

    // If no repair entry is found for the device type
    if (!repair) {
      throw new Error(`No repair data found for device type: ${deviceType}`);
    }

    // Return the models for the specified device type
    return repair.models;
  } catch (error) {
    throw new Error(`Error fetching models for device type: ${error.message}`);
  }
}
