import validator from "validator";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import User from "../models/userModel.js";
import dataValidator from "../utilities/dataValidator.js";

export async function createUser(
  name,
  email,
  phone,
  hashedPassword,
  role = "customer"
) {
  // Input validation
  console.log("name:", name);
  name = dataValidator.isValidString(name, "name", createUser.name);
  if (!dataValidator.validName(name))
    throw new Error(
      `${name} is not valid. Name should only contain alphabets and spaces.`
    );
  email = dataValidator.isValidString(email, "email", createUser.name);
  if (!validator.isEmail(email)) throw new Error("Please enter a valid email");
  phone = dataValidator.isValidString(phone, "phone", createUser.name);
  if (!dataValidator.isValidPhoneNumber(phone))
    throw new Error("Please enter a valid phone number");
  hashedPassword = dataValidator.isValidString(
    hashedPassword,
    "hashedPassword",
    createUser.name
  );
  role = role.trim();
  if (role === "") {
    role = "customer";
  }
  if (!["customer", "employee", "store-manager", "admin"].includes(role)) {
    throw new Error(
      `User role ${role} is not valid. User should be either ["customer", "employee", "store-manager", "admin"].`
    );
  }

  let newUser = { name, email, phone, hashedPassword, role };
  try {
    // Create and save the new user in the database
    const user = await User.create(newUser);
    return user;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
}

export async function getUserById(userId) {
  userId = dataValidator.isValidString(userId);
  if (!ObjectId.isValid(userId)) {
    throw new Error(`Invalid ObjectId string: ${userId}`);
  }
  let objId = new ObjectId(userId);

  const user = await User.findById(objId);
  if (!user) {
    throw new Error(`User with id:${userId} not found.`);
  }
  return user;
}

export async function getAllUsers() {
  const users = await User.find();
  if (users.length === 0) {
    throw new Error("No users found.");
  }
  return users;
}

// Update user details except password
export async function updateUser(userId, upObj) {
  // Check and get if the user with userId exists
  const user = await getUserById(userId);

  userId = dataValidator.isValidString(userId, "userId", updateUser.name);
  let updateObject = {};
  if (upObj.name) {
    updateObject.name = dataValidator.isValidString(
      upObj.name,
      "name",
      updateUser
    );
    if (!dataValidator.validName(updateObject.name)) {
      throw new Error(
        `${updateObject.name} is not valid user name. User name should only contain alphabets and spaces.`
      );
    }
  }

  if (upObj.email) {
    updateObject.email = dataValidator.isValidString(
      upObj.email,
      "email",
      "Update User"
    );
    if (!validator.isEmail(updateObject.email)) {
      throw new Error(`${updateObject.email} is not a valid email.`);
    }
  }

  if (upObj.phone) {
    updateObject.phone = dataValidator.isValidString(
      upObj.phone,
      "phone",
      "Update User"
    );
    if (!dataValidator.isValidPhoneNumber(updateObject.phone)) {
      throw new Error(`${updateObject.phone} is not a valid phone.`);
    }
  }

  if (upObj.role) {
    updateObject.role = dataValidator.isValidString(
      upObj.role,
      "role",
      "Update User"
    );

    if (
      !["customer", "employee", "store-manager", "admin"].includes(
        updateObject.role
      )
    ) {
      throw new Error(
        `User role ${updateObject.role} is not valid. User should be either ["customer", "employee", "store-manager", "admin"].`
      );
    }
  }

  if (user.name === updateObject.name) delete updateObject.name;
  if (user.email === updateObject.email) delete updateObject.email;
  if (user.phone === updateObject.phone) delete updateObject.phone;
  if (user.role === updateObject.role) delete updateObject.role;

  if (Object.keys(updateObject).length === 0) {
    throw new Error(`No changes detected for user with ID: ${userId}.`);
  }

  let updatedUser = await User.findByIdAndUpdate(userId, updateObject, {
    new: true,
  });

  if (!updatedUser) {
    throw new Error(`Could no update user with id: ${userId}`);
  }

  return updatedUser;
}

// Update password
export async function updatePassword(userId, oldPassword, newPassword) {
  // Get the user by id
  const user = await User.findById(userId).select("+password");
  newPassword = dataValidator.isValidString(newPassword);
}

//---------------------------- Test ----------------s

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

async function testCreateUser() {
  const name = "Admin User One";
  const email = "admin.user@example.com";
  const phone = "+15512414753";
  const hashedPassword = await bcrypt.hash("password123", 12);

  try {
    const user = await createUser(name, email, phone, hashedPassword);
    console.log(user);
  } catch (error) {
    console.error(error);
  }
}

async function testGetUserById(userId) {
  try {
    const user = await getUserById(userId);
    console.log(user);
  } catch (error) {
    console.error(error);
  }
}

async function testGetAllUsers() {
  try {
    const users = await getAllUsers();
    console.log(users);
  } catch (error) {
    console.error(error);
  }
}

async function testUpdateUser() {
  const name = "The original Admin";
  const email = "admin.user@example.com";
  const phone = "+15512445678";
  const role = "admin";
  let upObj = { name, email, phone, role };
  let userId = "6740cf739235b20b3a06481d";

  try {
    const updatedUser = await updateUser(userId, upObj);
    console.log(updatedUser);
  } catch (error) {
    console.error(error.message);
  }
}

async function testUpdatePassword() {
  let oldPassword;
  let newPassword;
  let userId = "6740cf739235b20b3a06481d";

  try {
    const updatedUser = await updatePassword(userId, upObj);
    console.log(updatedUser);
  } catch (error) {
    console.error(error.message);
  }
}

const connectDB = async () => {
  try {
    const DB = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );

    await mongoose.connect(DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process with failure code if the connection fails
  }
};

export const main = async () => {
  await connectDB(); // Connect to MongoDB
  await testUpdateUser();
  await mongoose.disconnect(); // Disconnect after
};

// // Run the main function
// main().catch((error) => {
//   console.error("Error running the test script:", error);
//   mongoose.disconnect();
// });
