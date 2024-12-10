import xss from "xss";
import rateLimit from "express-rate-limit";

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

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Too many accounts created from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const sanitizeInputs = (req, res, next) => {
  for (let key in req.body) {
    if (typeof req.body[key] === "string") {
      req.body[key] = xss(req.body[key]);
    } else if (Array.isArray(req.body[key])) {
      req.body[key].map((item) => sanitizeInputs(item));
    } else if (typeof req.body[key] === "object" && req.body[key] !== null) {
      for (const sub_key in req.body[key]) {
        req.body[key][sub_key] = sanitizeInputs(req.body[key][sub_key]);
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
export { sanitizeInputs, signupLimiter };
