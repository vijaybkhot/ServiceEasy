const exportedMethods = {
  // Validate name input
  validName(val) {
    return /^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0;
  },
};

export default exportedMethods;
