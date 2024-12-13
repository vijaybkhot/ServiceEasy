import express from "express";
import path from "path";
import exphbs from "express-handlebars";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import { sanitizeInputs } from "./utilities/middlewares/securityMiddlewares.js";
import parserMiddlewares from "./utilities/middlewares/parserMiddlewares.js";
import { attachUserToLocals } from "./utilities/middlewares/authenticationMiddleware.js";
import configRoutes from "./routes/index.js";

const app = express();

const staticDir = express.static("public");
app.use("/public", staticDir);
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);
parserMiddlewares(app);

// Session for authentication
app.use(
  session({
    name: "AuthCookie",
    secret: process.env?.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * process.env.SESSION_TIMEOUT_HOURS },
    store: MongoStore.create({
      mongoUrl: process.env?.DATABASE.replace(
        "<PASSWORD>",
        process.env.DATABASE_PASSWORD
      ),
      collectionName: "sessions",
      crypto: {
        secret: process.env.SESSION_SECRET,
      },
    }),
  })
);

app.use((req, res, next) => {
  if (!req.session) {
    return res.status(500).send("Session store is unavailable.");
  }
  next();
});

app.use(attachUserToLocals);

// Client side engine
app.engine(
  "handlebars",
  exphbs.engine({
    defaultLayout: "main",
    layoutsDir: path.join(process.cwd(), "views/layouts"),
    partialsDir: path.join(process.cwd(), "views/partials"),
    helpers: {
      eq: (a, b) => a === b,
      json: (context) => JSON.stringify(context),
      ifEquals: function (arg1, arg2, options) {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
      },
    },
  })
);
app.set("view engine", "handlebars");

// Routes
configRoutes(app);

// app.listen(3000, () => {
//   console.log("We've now got a server!");
//   console.log("Your routes will be running on http://localhost:3000");
// });

export default app;
