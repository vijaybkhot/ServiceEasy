import express from "express";
import path from "path";
import exphbs from "express-handlebars";
import { sanitizeInputs } from "./utilities/middlewares/securityMiddlewares.js";
import parserMiddlewares from "./utilities/middlewares/parserMiddlewares.js";
import configRoutes from "./routes/index.js";

const app = express();

const staticDir = express.static("public");
app.use("/public", staticDir);

app.use(sanitizeInputs);
parserMiddlewares(app);

// Client side engine
app.engine(
  "handlebars",
  exphbs.engine({
    defaultLayout: "main",
    layoutsDir: path.join(process.cwd(), "views/layouts"),
    partialsDir: path.join(process.cwd(), "views/partials"),
  })
);
app.set("view engine", "handlebars");

// Routes
configRoutes(app);

export default app;
