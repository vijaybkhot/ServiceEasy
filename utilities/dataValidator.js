import mongoose, { isValidObjectId } from "mongoose";
import validator from "validator";

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
      throw new Error(
        `${argument} must contain at least one item in ${routeOrFunction}.`
      );
    }

    for (let [index, obj] of val.entries()) {
      // Validate model_name
      if (
        !obj.model_name ||
        typeof obj.model_name !== "string" ||
        obj.model_name.trim().length === 0
      ) {
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

        const {
          repair_name,
          defective_parts,
          associated_price,
          estimated_time,
        } = repairType;

        // Validate repair_name
        if (
          !repair_name ||
          typeof repair_name !== "string" ||
          repair_name.trim().length === 0
        ) {
          throw new Error(
            `repair_name at index ${repairIndex} must be a valid, non-empty string.`
          );
        }

        // Validate defective_parts
        this.isValidStringArray(
          defective_parts,
          "defective_parts",
          routeOrFunction
        );

        // Validate associated_price
        if (
          typeof associated_price !== "number" ||
          isNaN(associated_price) ||
          associated_price <= 0
        ) {
          throw new Error(`associated_price must be a positive number.`);
        }

        // Validate estimated_time
        if (
          typeof estimated_time !== "number" ||
          isNaN(estimated_time) ||
          estimated_time <= 0
        ) {
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
      throw new Error(
        `${argument} must only contain non-empty strings in ${routeOrFunction}.`
      );
    }
    return val.map((item) => item.trim());
  },

  // Validate a number
  isValidNumber(val, argument, routeOrFunction) {
    if (typeof val !== "number" || isNaN(val) || val <= 0) {
      throw new Error(
        `${argument} must be a positive number in ${routeOrFunction}.`
      );
    }
    return val;
  },
  isValidString(val, argument, routeOrFunction) {
    if (typeof val !== "string" || !val || val.trim().length === 0) {
      throw new Error(
        `${val} as ${argument} is not a valid string in the ${routeOrFunction}.`
      );
    }
    return val.trim();
  },
  validId(id) {
    if (
      typeof id === "undefined" ||
      typeof id !== "string" ||
      typeof id === "null"
    )
      return false;
    if (id.trim().length === 0) return false;
    if (!isValidObjectId(id)) return false;
    return true;
  },
  validLocation(location) {
    if (
      !location.hasOwnProperty("type") ||
      !location.hasOwnProperty("coordinates") ||
      !location.hasOwnProperty("address")
    )
      return false;
    location.type = location.type.trim();
    if (location.coordinates.length !== 2) return false;
    if (
      typeof location.coordinates[0] !== "number" ||
      typeof location.coordinates[1] !== "number"
    )
      return false;
    if (
      location.coordinates[0] > 180 ||
      location.coordinates[0] < -180 ||
      location.coordinates[1] > 90 ||
      location.coordinates[1] < -90
    )
      return false;
    if (
      location.address.length >= 300 ||
      location.address.length < 20 ||
      location.address.trim().length == 0
    )
      return false;
    location.address = location.address.trim();
    return true;
  },
  isValidPhoneNumber(val) {
    return validator.isMobilePhone(val, undefined, { strictMode: false });
  },
  isValidStringBoolean(val) {
    return typeof val === "string" && val.trim().length > 0;
  },
  validStore(request_body) {
    const { name, location, phone, storeManager } = request_body;
    return (
      this.validName(name) &&
      this.validLocation(location) &&
      this.validPhone(phone) &&
      mongoose.isValidObjectId(storeManager.trim())
    );
    // throw new Error("Name of the store must be valid!");
    // return this.validLocation(location)
    //   throw new Error(
    //     "Please enter a valid location in the format {coordinates[Longitude[-180,180], latitude[-90,90]] and address within 20-300 characters!"
    //   );

    // if (!this.validPhone(phone))
    //   throw new Error(
    //     "Please enter a valid phone number with a country code (e.g., +1234567890)!"
    //   );

    // if (!mongoose.isValidObjectId(storeManager.trim()))
    //   throw new Error("Enter a valid Store Manager ID!");

    // return {
    //   name: name.trim(),
    //   location,
    //   phone: phone.trim(),
    //   storeManager: storeManager.trim(),
    // };
  },
};

export default exportedMethods;
