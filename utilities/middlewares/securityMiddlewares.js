import xss from "xss";

// Middleware to sanitize all input data in req.body
const sanitizeInputs = (req, res, next) => {
  // Sanitize all keys in req.body
  for (let key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      req.body[key] = xss(req.body[key]);
    }
  }
  next();
};

export default sanitizeInputs;
