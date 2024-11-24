import express from "express";
import bcrypt from "bcryptjs";
import validator from "validator";

import { signupLimiter } from "../utilities/middlewares/securityMiddlewares.js";
import dataValidator from "../utilities/dataValidator.js";
import * as userController from "../data/user.js";

const saltRounds = 12;

const router = express.Router();

router.get("/login", async (req, res, next) => {
  res.status(200).render("users/login", {
    title: "Log into ServiceEasy",
    cssPath: "/public/css/login.css",
  });
});

router.get("/signup", async (req, res, next) => {
  res.status(200).render("users/signup", {
    title: "Signup for ServiceEasy",
    cssPath: "/public/css/signup.css",
  });
});

router.post("/signup", signupLimiter, async (req, res, next) => {
  let { name, email, phone, password, role, passwordConfirm } = req.body;

  try {
    name = dataValidator.isValidString(name, "name", "signup route");
    email = dataValidator.isValidString(email, "email", "signup route");
    phone = dataValidator.isValidString(phone, "phone", "signup route");
    password = dataValidator.isValidString(
      password,
      "password",
      "signup route"
    );
    passwordConfirm = dataValidator.isValidString(
      passwordConfirm,
      "passwordConfirm",
      "signup route"
    );
    role = role
      ? dataValidator.isValidString(role, "role", "signup route")
      : "customer";

    if (!dataValidator.validName(name))
      throw new Error("Please enter a valid name");
    if (!validator.isEmail(email))
      throw new Error("Please enter a valid email");
    if (!dataValidator.isValidPhoneNumber(phone))
      throw new Error("Please enter a valid phone number");
    if (!password || !passwordConfirm)
      throw new Error("Please enter password and password confirm.");
    if (password !== passwordConfirm)
      throw new Error("The passwords don't match. ");
    if (password.length < 8)
      throw new Error("Password must be atleast 8 characters.");
    if (role === undefined || role === "") {
      role = "customer";
    }
    if (!["customer", "employee", "store-manager", "admin"].includes(role)) {
      throw new Error(
        `User role ${role} is not valid. User should be either ["customer", "employee", "store-manager", "admin"].`
      );
    }

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
    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
