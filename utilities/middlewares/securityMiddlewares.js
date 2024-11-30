import xss from "xss";

// Middleware to sanitize all input data in req.body
// const sanitizeInputs = (req, res, next) => {
//   // Sanitize all keys in req.body
//   for (let key in req.body) {
//     if (req.body.hasOwnProperty(key)) {
//       req.body[key] = xss(req.body[key]);
//     }
//   }
//   next();
// };
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return xss(input); // Sanitize strings
  } else if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)); // Recursively sanitize arrays
  } else if (typeof input === "object" && input !== null) {
    const sanitizedObject = {};
    for (const key in input) {
      sanitizedObject[key] = sanitizeInput(input[key]); // Recursively sanitize objects
    }
    return sanitizedObject;
  }
  return input; // Return as-is for non-string types
};

const sanitizeMiddleware = (req, res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};
export default sanitizeMiddleware;
