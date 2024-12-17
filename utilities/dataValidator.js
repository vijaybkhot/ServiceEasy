import mongoose, { isValidObjectId } from "mongoose";
import validator from "validator";

const exportedMethods = {
  validName(val) {
    if (/^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0)
      throw "Enter non-empty string consiting only characters!";
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

  isValidEmail(email, argument, routeOrFunction) {
    email = this.isValidString(email, argument, routeOrFunction);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(emailPattern.test(email))
      throw new Error(
        `${argument} must be a valid email in ${routeOrFunction}.`
      );
    return email;
  },

  validId(id) {
    if (
      typeof id === "undefined" ||
      typeof id !== "string" ||
      typeof id === "null"
    )
      throw "ID should be defined as a string!";
    if (id.trim().length === 0) throw "ID shouldn't be empty!";
    if (!isValidObjectId(id)) throw "passed ID should be a valid ObjectID!";
    return id.trim();
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
    return location;
  },
  validPhone(phone) {
    if (validator.isMobilePhone(phone, undefined, { strictMode: false }))
      throw "Enter a valid phone number!";
    return phone.trim()
  },
  validStore(request_body) {
    const { name, location, phone, storeManager } = request_body;

    if (!this.validName(name))
      throw new Error("Name of the store must be valid!");
    if (!this.validLocation(location))
      throw new Error(
        "Please enter a valid location in the format {coordinates[Longitude[-180,180], latitude[-90,90]] and address within 20-300 characters!"
      );

    if (!this.validPhone(phone))
      throw new Error(
        "Please enter a valid phone number with a country code (e.g., +1234567890)!"
      );

    if (!mongoose.isValidObjectId(storeManager.trim()))
      throw new Error("Enter a valid Store Manager ID!");

    return {
      name: name.trim(),
      location,
      phone: phone.trim(),
      storeManager: storeManager.trim(),
    };
  },
};

export default exportedMethods;
