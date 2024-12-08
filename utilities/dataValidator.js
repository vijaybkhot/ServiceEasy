import mongoose, { isValidObjectId } from "mongoose";
import validator from "validator";

const exportedMethods = {
  validName(val) {
    return /^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0;
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
    return (this.validName(name) && this.validLocation(location) && this.validPhone(phone) && mongoose.isValidObjectId(storeManager.trim()))
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
