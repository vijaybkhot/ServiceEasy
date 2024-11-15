import express from "express"; // Import express for routing and middleware
import cookieParser from "cookie-parser"; // Import cookie-parser to handle cookies

export default (app) => {
  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: "10kb" })); // Middleware

  // URL encoding parser for form data (in case you're handling form submissions)
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Cookie parser, reading data from cookies into req.cookies
  app.use(cookieParser()); // Cookie parser middleware
};
