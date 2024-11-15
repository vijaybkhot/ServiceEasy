import express from "express";
import dataValidator from "../utilities/dataValidator.js";
import validator from "validator";
import User from "../models/userModel.js";

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  let name = req.body.name;
  let email = req.body.email;
  let phone;
  let password;
  let passwordConfirm;

  let errors = [];

  if (!dataValidator.validName(name)) errors.push("Please enter a valid name");
  if (!validator.isEmail(email)) errors.push("Please enter a valid email");
  try {
    res.status(201).json({
      status: "success",
      data: {
        // response data
      },
    });
  } catch (error) {
    next(error);
  }
});
export default router;
