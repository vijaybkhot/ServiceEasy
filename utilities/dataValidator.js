// import { isValidObjectId } from "mongoose";
import { ObjectId } from "mongodb";
// import validator from "validator";

const exportedMethods = {
  isValidObjectId(id) {
    if (!id) throw "You must provide an id to search for";
    if (typeof id !== "string") throw "Id must be a string";
    id = id.trim();
    if (id.length === 0) throw "Id cannot be an empty string or just spaces";
    if (!ObjectId.isValid(id)) throw `Invalid ObjectId string: ${id}`;
    return id;
  },

  // Validate a string
  isValidString(val, argument, routeOrFunction) {
    if (typeof val !== "string") {
      throw new Error(
        `${argument} must be a string in ${routeOrFunction}. Received: ${typeof val}`
      );
    }
    val = val.trim();
    if (val.length === 0) {
      throw new Error(`${argument} cannot be empty in ${routeOrFunction}.`);
    }
    return val;
  },

  // Validate an object array
  isValidObjectArray(val, argument, routeOrFunction) {
    if (!Array.isArray(val)) {
      throw new Error(`${argument} must be an array in ${routeOrFunction}.`);
    }
    if (val.length === 0) {
      throw new Error(`${argument} must contain at least one item in ${routeOrFunction}.`);
    }

    for (let [index, obj] of val.entries()) {
      // Validate model_name
      if (!obj.model_name || typeof obj.model_name !== "string" || obj.model_name.trim().length === 0) {
        throw new Error(
          `model_name at index ${index} must be a valid, non-empty string in ${routeOrFunction}.`
        );
      }
    
      // Validate repair_types
      if (!Array.isArray(obj.repair_types)) {
        throw new Error(
          `repair_types at index ${index} in ${argument} must be an array in ${routeOrFunction}.`
        );
      }
    
      for (let [repairIndex, repairType] of obj.repair_types.entries()) {
        if (typeof repairType !== "object" || Array.isArray(repairType)) {
          throw new Error(
            `Each repair_type at index ${repairIndex} in repair_types must be an object in ${routeOrFunction}.`
          );
        }
    
        const { repair_name, defective_parts, associated_price, estimated_time } = repairType;
    
        // Validate repair_name
        if (!repair_name || typeof repair_name !== "string" || repair_name.trim().length === 0) {
          throw new Error(`repair_name at index ${repairIndex} must be a valid, non-empty string.`);
        }
    
        // Validate defective_parts
        this.isValidStringArray(defective_parts, "defective_parts", routeOrFunction);
    
        // Validate associated_price
        if (typeof associated_price !== "number" || isNaN(associated_price) || associated_price <= 0) {
          throw new Error(`associated_price must be a positive number.`);
        }
    
        // Validate estimated_time
        if (typeof estimated_time !== "number" || isNaN(estimated_time) || estimated_time <= 0) {
          throw new Error(`estimated_time must be a positive number.`);
        }
      }
    }
    return val;
  },

  // Validate a string array
  isValidStringArray(val, argument, routeOrFunction) {
    if (!Array.isArray(val)) {
      throw new Error(`${argument} must be an array in ${routeOrFunction}.`);
    }
    if (
      val.some((item) => typeof item !== "string" || item.trim().length === 0)
    ) {
      throw new Error(`${argument} must only contain non-empty strings in ${routeOrFunction}.`);
    }
    return val.map((item) => item.trim());
  },

  // Validate a number
  isValidNumber(val, argument, routeOrFunction) {
    if (typeof val !== "number" || isNaN(val) || val <= 0) {
      throw new Error(`${argument} must be a positive number in ${routeOrFunction}.`);
    }
    return val;
  },
};

export default exportedMethods;
