import mongoose from "mongoose";
import validator from "validator";

const exportedMethods = {
  validName(val) {
    return /^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0;
  },
  validLocation(location) {
    if (
      !location.hasOwnProperty("type") ||
      !location.hasOwnProperty("coordinates") ||
      !location.hasOwnProperty("address")
    )
      return false;
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
    if (location.address.length >= 300 || location.address.length < 20)
      return false;
    return true;
  },
  validPhone(phone) {
    const trimmedPhone = phone.trim();
    const hasCountryCode = /^\+\d+$/.test(trimmedPhone);
    const isValidPhone = validator.isMobilePhone(trimmedPhone, undefined, { strictMode: true });
    return hasCountryCode && isValidPhone;
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
