import validator from "validator";

const exportedMethods = {
  // Validate name input
  validName(val) {
    return /^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0;
  },
  isValidPhoneNumber(val) {
    return validator.isMobilePhone(val, undefined, { strictMode: false });
  },
  isValidString(val, argument, routeOrFunction) {
    if (typeof val !== "string" || !val || val.trim().length === 0) {
      throw new Error(
        `${val} as ${argument} is not a valid string in the ${routeOrFunction}.`
      );
    }
    return val.trim();
  },
};

export default exportedMethods;
