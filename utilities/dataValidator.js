import mongoose from "mongoose";
import crypto from "crypto";
import validator from "validator";

const { ObjectId } = mongoose.Types;

const exportedMethods = {
  isValidObjectId(id) {
    if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId string: ${id}`);
    }
    return id.trim();
  },

  isValidString(val, argument, routeOrFunction) {
    if (typeof val !== "string" || !val.trim()) {
      throw new Error(
        `${argument} must be a non-empty string in ${routeOrFunction}.`
      );
    }
    return val.trim();
  },

  isValidObjectArray(val, argument, routeOrFunction) {
    if (!Array.isArray(val) || val.length === 0) {
      throw new Error(
        `${argument} must be a non-empty array in ${routeOrFunction}.`
      );
    }
    return val;
  },

  isValidStringArray(val, argument, routeOrFunction) {
    if (
      !Array.isArray(val) ||
      val.some((item) => typeof item !== "string" || !item.trim())
    ) {
      throw new Error(
        `${argument} must contain only non-empty strings in ${routeOrFunction}.`
      );
    }
    return val.map((item) => item.trim());
  },

  isValidNumber(val, argument, routeOrFunction) {
    if (typeof val !== "number" || val <= 0) {
      throw new Error(
        `${argument} must be a positive number in ${routeOrFunction}.`
      );
    }
    return val;
  },

  validId(id) {
    try {
      this.isValidObjectId(id);
      return true;
    } catch {
      return false;
    }
  },

  isValidPhoneNumber(val) {
    if (!validator.isMobilePhone(val)) {
      throw new Error(`Invalid phone number: ${val}`);
    }
    return val;
  },

  isValidDate(date) {
    return !isNaN(new Date(date).getTime());
  },

  validLocation(location) {
    const { type, coordinates, address } = location || {};
    if (
      type !== "Point" ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    )
      return false;
    const [lng, lat] = coordinates;
    if (typeof lng !== "number" || typeof lat !== "number") return false;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
    if (
      typeof address !== "string" ||
      address.trim().length < 20 ||
      address.trim().length > 300
    )
      return false;
    return true;
  },
  validName(val) {
    return /^[a-zA-Z\s]*$/.test(val) && val.trim().length > 0;
  },
  isValidStringBoolean(val) {
    return typeof val === "string" && val.trim().length > 0;
  },
  generateTransactionId() {
    return crypto.randomBytes(16).toString("hex");
  },
};

export default exportedMethods;
