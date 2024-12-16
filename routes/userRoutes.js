import express from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import { ObjectId } from "mongodb";
import session from "express-session";

import { signupLimiter } from "../utilities/middlewares/securityMiddlewares.js";
import dataValidator from "../utilities/dataValidator.js";
import * as userController from "../data/user.js";
import User from "../models/userModel.js";
import Email from "../utilities/email.js";
import {
  isAuthenticated,
  redirectBasedOnRole,
} from "../utilities/middlewares/authenticationMiddleware.js";

const saltRounds = 12;

const router = express.Router();

router.get("/", redirectBasedOnRole);

router.get("/home", async (req, res, next) => {
  res.status(200).render("users/home", {
    title: "Home Page",
    cssPath: "/public/css/home.css",
  });
});

router.get("/login", async (req, res, next) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }
  res.status(200).render("users/login", {
    title: "Log into ServiceEasy",
    cssPath: "/public/css/login.css",
    errors: [],
    onLoginPage:true,
  });
});

router.post("/login", async (req, res) => {
  const errors = [];
  let { email, password } = req.body;

  try {
    // Validate input
    try {
      email = dataValidator.isValidString(email, "email", "login route");
      password = dataValidator.isValidString(
        password,
        "password",
        "login route"
      );

      if (!validator.isEmail(email)) {
        errors.push("Please enter a valid email.");
      }

      if (password.length < 8) {
        errors.push("Password must be at least 8 characters.");
      }
    } catch (validationError) {
      errors.push(validationError.message);
    }

    if (errors.length > 0) {
      return res.status(400).render("users/login", {
        title: "Log into ServiceEasy",
        cssPath: "/public/css/login.css",
        errors,
      });
    }

    const user = await User.findOne({ email }).select("+hashedPassword");
    if (!user) {
      errors.push("Incorrect email or password.");
      return res.status(404).render("users/login", {
        title: "Log into ServiceEasy",
        cssPath: "/public/css/login.css",
        errors,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      errors.push("Incorrect email or password.");
      return res.status(401).render("users/login", {
        title: "Log into ServiceEasy",
        cssPath: "/public/css/login.css",
        errors,
      });
    }

    user.hashedPassword = undefined;
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    return res.status(200).redirect("/dashboard");
  } catch (error) {
    errors.push("An unexpected error occurred. Please try again later.");
    return res.status(500).render("users/login", {
      title: "Log into ServiceEasy",
      cssPath: "/public/css/login.css",
      errors,
    });
  }
});

router.get("/signup", async (req, res, next) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }
  res.status(200).render("users/signup", {
    title: "Signup for ServiceEasy",
    cssPath: "/public/css/signup.css",
    errors: [],
    onSignupPage: true,
  });
});

router.post("/signup", async (req, res) => {
  let { name, email, phone, password, role, passwordConfirm } = req.body;
  name = name.trim();
  email = email.trim();
  phone = phone.trim();
  password = password.trim();
  role = typeof role === "string" ? role.trim() : "customer";

  passwordConfirm = passwordConfirm.trim();
  let errors = [];

  if (!dataValidator.validName(name)) errors.push("Invalid name.");
  if (!validator.isEmail(email)) errors.push("Invalid email.");
  if (!dataValidator.isValidPhoneNumber(phone)) errors.push("Invalid phone.");
  if (!dataValidator.isValidStringBoolean(password))
    errors.push("Invalid password.");
  if (!dataValidator.isValidStringBoolean(role)) errors.push("Invalid role.");
  if (!dataValidator.isValidStringBoolean(passwordConfirm))
    errors.push("Invalid passwordConfirm.");
  if (password !== passwordConfirm) errors.push("Passwords dont match.");
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (!["customer", "employee", "store-manager", "admin"].includes(role)) {
    errors.push(
      `User role ${role} is not valid. Role must be one of ["customer", "employee", "store-manager", "admin"].`
    );
  }

  if (errors.length > 0) {
    req.session.user = undefined;
    return res.status(400).render("users/signup", {
      title: "Signup for ServiceEasy",
      cssPath: "/public/css/signup.css",
      errors: errors,
      name,
      email,
      phone,
    });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await userController.createUser(
      name,
      email,
      phone,
      hashedPassword,
      role
    );

    newUser.hashedPassword = undefined;
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    };
    const url = `${req.protocol}://${req.get("host")}/home`;
    await new Email(newUser, url).sendWelcome();
    errors = [];
    return res.status(200).redirect("/home");
  } catch (error) {
    if (error.code === 11000 && error.keyValue && error.keyValue.email) {
      errors.push(
        "A user with this email already exists. Please log in to your account."
      );
    } else {
      errors.push(error.message);
    }
    return res.status(401).render("users/signup", {
      title: "Sign Up for ServiceEasy",
      cssPath: "/public/css/signup.css",
      errors,
      name,
      email,
      phone,
    });
  }
});

router.get("/logout", async (req, res) => {
  req.session.destroy();
  return res.status(200).redirect("/home");
});

router.get("/my-dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("my-dashboard", { user: req.session.user });
});

// Get user details to the client side
router.get("/api/user", isAuthenticated, async (req, res, next) => {
  try {
    res.status(200).json({ user: res.locals.user });
  } catch (error) {
    next(error);
  }
});

// Get user by id route for api call
router.get("/user/:id", async (req, res) => {
  try {
    let userId = req.params.id;

    // Validate userId
    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: `Invalid ObjectId string: ${userId}` });
    }
    const user = await userController.getUserById(userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

export default router;
