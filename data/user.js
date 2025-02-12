import validator from "validator";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import dataValidator from "../utilities/dataValidator.js";

export async function createUser(
  name,
  email,
  phone,
  hashedPassword,
  role = "customer"
) {
  // Input validation
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
    throw new Error(error.message);
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

export async function getUsersByRole(role) {
  const stores = await Store.find({});
  const storeManagers = await User.find({ role: role });
  const managersWithoutStore = storeManagers.filter((manager) => {
    // Check if the manager is not assigned to any store by comparing their _id with storeManager in stores
    return !stores.some(
      (store) =>
        store.storeManager._id &&
        store.storeManager._id.toString() === manager._id.toString()
    );
  });

  const plainUsers = managersWithoutStore.map((user) => user.toObject());
  if (managersWithoutStore.length === 0) {
    throw new Error("No unassigned store managers found.");
  }
  return plainUsers;
}

// Get user by email
export async function searchUserByEmail(email) {
  email = dataValidator.isValidString(email, "email", searchUserByEmail.name);
  if (!validator.isEmail(email)) throw new Error("Please enter a valid email");

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error(`No user found with the email: ${email}`);
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
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
    throw new Error(`Could no update password with id: ${userId}`);
  }

  return updatedUser;
}

// Update password
export async function updatePassword(userId, oldPassword, newPassword) {
  // Check if both passwords are valid strings and trim
  newPassword = dataValidator.isValidString(
    newPassword,
    "newPassword",
    "updatePassword function"
  );
  oldPassword = dataValidator.isValidString(
    oldPassword,
    "oldPassword",
    "updatePassword function"
  );
  userId = dataValidator.isValidString(
    userId,
    "userId",
    "updatePassword function"
  );

  if (!isValidObjectId(userId)) {
    throw new Error(
      `userId entered in the update password function is not a valid Object Id`
    );
  }
  // Throw if both old and new passwords input are the same
  if (oldPassword === newPassword) {
    throw new Error(`The new password and old password cannot be the same.`);
  }
  // Get the user by id
  const user = await User.findById(userId).select("+hashedPassword");

  // Check if old password entered is correct
  let isOldPasswordCorrect = await bcrypt.compare(
    oldPassword,
    user.hashedPassword
  );
  if (!isOldPasswordCorrect) {
    throw new Error(
      `Incorrect password. Please enter the correct current password.`
    );
  }

  // Hash the new password
  let newHashedPassword = await bcrypt.hash(newPassword, 12);

  // Update the user with new password
  let updatedUser = await User.findByIdAndUpdate(
    userId,
    { hashedPassword: newHashedPassword },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throw new Error(`Could no update user with id: ${userId}`);
  }

  return updatedUser;
}

// Update user role function
export async function updateUserRole(userId, newRole) {
  // Validate userId and role

  userId = dataValidator.isValidString(userId, "userId", updateUserRole.name);

  const user = await getUserById(userId);

  newRole = dataValidator.isValidString(newRole, "role", updateUserRole.name);
  newRole = newRole.trim();
  if (!["customer", "employee", "store-manager", "admin"].includes(newRole)) {
    throw new Error(
      `User role ${newRole} is not valid. User should be either ["customer", "employee", "store-manager", "admin"].`
    );
  }

  // No need to update if the role is the same
  if (user.role === newRole) {
    throw new Error(`User role is already ${newRole}, no changes to update.`);
  }

  // validation if the user is trying to update their role from store-manager
  if (user.role === "store-manager" && newRole !== "store-manager") {
    //  the user should not be the manager of any store
    const store = await Store.findOne({ storeManager: userId });
    if (store) {
      throw new Error(
        "User is a store manager and cannot change role until they are no longer managing a store."
      );
    }
  }

  //  validation if the user is trying to update their role from employee
  if (user.role === "employee" && newRole !== "employee") {
    // user should not already be an employee in any store
    const storeWithEmployee = await Store.findOne({ employees: userId });
    if (storeWithEmployee) {
      throw new Error(
        "User is an employee at a store and cannot change role until they are no longer an employee."
      );
    }
  }

  let updatedUser = await User.findByIdAndUpdate(
    userId,
    { role: newRole },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error(`Could not update user role for user with id: ${userId}`);
  }

  return updatedUser;
}

//---------------------------- Test ----------------s

import mongoose, { isValidObjectId } from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

async function testCreateUser() {
  const name = "Admin User One";
  const email = "admin.user@example.com";
  const phone = "+15512414753";
  const hashedPassword = await bcrypt.hash("password123", 12);

  try {
    const user = await createUser(name, email, phone, hashedPassword);
  } catch (error) {
    console.error(error);
  }
}

async function testGetUserById(userId) {
  try {
    const user = await getUserById(userId);
  } catch (error) {
    console.error(error);
  }
}

async function testGetAllUsers() {
  try {
    const users = await getAllUsers();
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
  } catch (error) {
    console.error(error.message);
  }
}

async function testUpdatePassword() {
  let oldPassword = "newPassword123";
  let newPassword = "password123";
  let userId = "6740cf739235b20b3a06481d";

  try {
    const updatedUser = await updatePassword(userId, oldPassword, newPassword);
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
  await testUpdatePassword();
  await mongoose.disconnect(); // Disconnect after
};

// // Run the main function
// main().catch((error) => {
//   console.error("Error running the test script:", error);
//   mongoose.disconnect();
// });
