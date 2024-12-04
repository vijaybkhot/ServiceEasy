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
const sanitizeInput = (req, res, next) => {
  for (let key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = xss(req.body[key]);
    } else if (Array.isArray(req.body[key])) {
      req.body[key].map((item) => sanitizeInput(item));
    } else if (typeof req.body[key] === "object" && req.body[key] !== null) {
      for (const sub_key in req.body[key]) {
        req.body[key][sub_key] = sanitizeInput(req.body[key][sub_key]);
      }
    }
  }
  next();
};

// const sanitizeMiddleware = (req, res, next) => {
//   req.body = sanitizeInput(req.body);
//   req.query = sanitizeInput(req.query);
//   req.params = sanitizeInput(req.params);
//   next();
// };
export default sanitizeInput;
