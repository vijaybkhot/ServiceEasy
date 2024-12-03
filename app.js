import express from "express";
import exphbs from "express-handlebars";
import sanitizeInputs from "./utilities/middlewares/securityMiddlewares.js";
import parserMiddlewares from "./utilities/middlewares/parserMiddlewares.js";
import {
  userRouter,
  storeRouter,
  serviceRequestRouter,
  repairRouter,
} from "./routes/index.js";

const app = express();

const staticDir = express.static("public");
app.use("/public", staticDir);

app.use(sanitizeInputs);
parserMiddlewares(app);

// Client side engine
app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
app.use("/users", userRouter);
app.use("/stores", storeRouter);
app.use("/serviceRequest", serviceRequestRouter);
app.use("/repairs",repairRouter);

export default app;
