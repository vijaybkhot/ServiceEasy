import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.stack);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const status = statusCode.toString().startsWith("4") ? "fail" : "error";

  if (req.accepts("html")) {
    // for rendering errors
    return res.status(statusCode).render("errors/error", {
      status: status,
      message: error.message || "Internal Server Error",
      cssPath: "/public/css/error.css",
    });
  } else {
    // For API calls
    return res.status(statusCode).json({
      status: status,
      message: error.message || "Internal Server Error",
    });
  }
});

const DB = process.env?.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {})
  .then(() => {
    console.log("DB connection successful");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}..`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
