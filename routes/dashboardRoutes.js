import express from "express";
import { isValidObjectId } from "mongoose";
import Repair from "../models/repairModel.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import {
  isAuthenticated,
  customerProtect,
} from "../utilities/middlewares/authenticationMiddleware.js";

const router = express.Router();

// Customer dashboard
router.get("/customer-dashboard", customerProtect, async (req, res, next) => {
  try {
    // Render dashboard
    return res.status(200).render("dashboards/customer-dashboard", {
      title: "Dashboard",
      cssPath: `/public/css/customer-dashboard.css`,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
});

// Payment route
router.get("/payment", customerProtect, async (req, res) => {
  try {
    let {
      device_type,
      model_name,
      repair_id,
      repair_name,
      associated_price,
      estimated_time,
      defective_parts,
      customer,
      store_id,
      store,
    } = req.query;

    if (!Array.isArray(defective_parts)) {
      defective_parts = [defective_parts];
    }

    associated_price = +associated_price;
    estimated_time = +estimated_time;

    // Validate device_type, model_name, and repair_name (non-empty strings)
    if (
      !device_type ||
      typeof device_type !== "string" ||
      device_type.trim() === ""
    ) {
      return res.status(400).json({
        message: "Invalid device_type. It must be a non-empty string.",
      });
    }

    if (
      !model_name ||
      typeof model_name !== "string" ||
      model_name.trim() === ""
    ) {
      return res.status(400).json({
        message: "Invalid model_name. It must be a non-empty string.",
      });
    }

    if (
      !repair_name ||
      typeof repair_name !== "string" ||
      repair_name.trim() === ""
    ) {
      return res.status(400).json({
        message: "Invalid repair_name. It must be a non-empty string.",
      });
    }

    if (!isValidObjectId(customer)) {
      return res.status(400).json({
        message: "Invalid customer ID. It must be a valid Mongoose ObjectId.",
      });
    }

    if (!isValidObjectId(store_id)) {
      return res.status(400).json({
        message: "Invalid store_id. It must be a valid Mongoose ObjectId.",
      });
    }

    if (!isValidObjectId(repair_id)) {
      return res.status(400).json({
        message: "Invalid repair_id. It must be a valid Mongoose ObjectId.",
      });
    }

    if (!store || typeof store !== "string" || store.trim() === "") {
      return res
        .status(400)
        .json({ message: "Invalid store. It must be a non-empty string." });
    }

    if (typeof associated_price !== "number" || associated_price <= 0) {
      return res.status(400).json({
        message: "Invalid associated_price. It must be a positive number.",
      });
    }

    if (typeof estimated_time !== "number" || estimated_time <= 0) {
      return res.status(400).json({
        message: "Invalid estimated_time. It must be a positive number.",
      });
    }

    if (
      !Array.isArray(defective_parts) ||
      defective_parts.length === 0 ||
      !defective_parts.every(
        (part) => typeof part === "string" && part.trim() !== ""
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid defective_parts. It must be a non-empty array of non-empty strings.",
      });
    }

    const customerDoc = await User.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ message: "Customer not found." });
    }

    if (customerDoc.role !== "customer") {
      return res
        .status(400)
        .json({ message: "Customer must have 'customer' role." });
    }

    const storeDoc = await Store.findById(store_id);
    if (!storeDoc || storeDoc.name !== store) {
      return res
        .status(400)
        .json({ message: "Store not found or incorrect store name." });
    }

    const repair = await Repair.findOne({
      "models.repair_types._id": repair_id,
    }).select("models.repair_types");
    if (!repair) {
      return res.status(400).json({
        message: `Repair type with ID: ${repair_id} not found in any device model.`,
      });
    }

    const repairType = repair.models
      .flatMap((model) => model.repair_types)
      .find((r) => r._id.toString() === repair_id.toString());
    if (!repairType) {
      return res
        .status(400)
        .json({ message: `Repair type with ID: ${repair_id} not found.` });
    }

    return res.status(200).render("payments/payment", {
      title: "Checkout",
      cssPath: `/public/css/payment.css`,
      device_type,
      model_name,
      repair_name,
      repair_id,
      associated_price,
      estimated_time,
      defective_parts,
      customerId: customer,
      store_id,
      store,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
});

router.get("/employee-dashboard", async (req, res, next) => {
  try {
    // Render dashboard
    return res.status(200).render("dashboards/employee-dashboard", {
      title: "Employee Dashboard",
      cssPath: `/public/css/employee-dashboard.css`,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/store-manager-dashboard", async (req, res, next) => {
  try {
    // Render dashboard
    return res.status(200).render("dashboards/store-manager-dashboard", {
      title: "Manager Dashboard",
      cssPath: `/public/css/store-manager-dashboard.css`,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin-dashboard", async (req, res, next) => {
  try {
    // Render dashboard
    return res.status(200).render("dashboards/admin-dashboard", {
      title: "Admin Dashboard",
      cssPath: `/public/css/admin-dashboard.css`,
    });
  } catch (error) {
    next(error);
  }
});
export default router;
