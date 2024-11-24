import xss from "xss";
import rateLimit from "express-rate-limit";

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

// Rate limiting middleware for signup route
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Too many accounts created from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Exporting the functions
export { sanitizeInputs, signupLimiter };
