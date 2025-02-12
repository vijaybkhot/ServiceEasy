import express from "express";
import { isValidObjectId } from "mongoose";
import Repair from "../models/repairModel.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import * as stores from "../data/stores.js";
import * as serviceRequests from "../data/serviceRequests.js";
import * as employeeActivity from "../data/employeeActivity.js";
import * as helpers from "../utilities/helpers.js";
import {
  isAuthenticated,
  customerProtect,
  redirectBasedOnRole,
  hasRole,
} from "../utilities/middlewares/authenticationMiddleware.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/", redirectBasedOnRole);

// Customer dashboard
router.get(
  "/customer-dashboard",
  hasRole(["customer"]),
  async (req, res, next) => {
    try {
      const userId = req.session.user.id;

      // Get service requests for the user
      const userServiceRequests =
        await serviceRequests.getServiceRequestsByUser(
          userId,
          req.session.user.role
        );

      // Filter service requests into completed, in-progress at customers dashboard
      let unMappedCompletedServiceRequests = userServiceRequests.filter(
        (serviceRequest) => serviceRequest.status === "complete"
      );

      let unMappedInProgressServiceRequests = userServiceRequests.filter(
        (serviceRequest) => serviceRequest.status !== "complete"
      );

      // Get page numbers from query params
      const completedPage = parseInt(req.query.completedPage) || 1;
      const inProgressPage = parseInt(req.query.inProgressPage) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // Paginate the completed and in-progress requests
      let completedServiceRequests = [];
      if (unMappedCompletedServiceRequests) {
        completedServiceRequests = await helpers.mapServiceRequests(
          unMappedCompletedServiceRequests,
          completedPage,
          pageSize
        );
      }

      let inProgressServiceRequests = [];
      if (unMappedInProgressServiceRequests) {
        inProgressServiceRequests = await helpers.mapServiceRequests(
          unMappedInProgressServiceRequests,
          inProgressPage,
          pageSize
        );
      }

      return res.status(200).render("dashboards/customer-dashboard", {
        title: "Dashboard",
        cssPath: `/public/css/customer-dashboard.css`,
        user: req.session.user,
        completedServiceRequests,
        inProgressServiceRequests,
      });
    } catch (error) {
      return res.status(500).json(error);
    }
  }
);

router.get(
  "/employee-dashboard",
  hasRole(["employee"]),
  async (req, res, next) => {
    try {
      const user = req.session.user;

      // Find the store the user works in
      let store = await stores.getStoreForEmployee(user.id);

      if (!store || store.length === 0) {
        // if no store found, user does not manage any store
        return res.status(200).render("dashboards/employee-dashboard", {
          title: "Employee Dashboard",
          cssPath: `/public/css/employee-dashboard.css`,
          error: `Sorry ${req.session.user.name}, you do not work at any our stores! So nothing to display`,
        });
      }
      let storeManagerId = store.storeManager._id.toString();

      // Get current service requests for the employee
      const unMappedInProgressServiceRequests =
        await serviceRequests.getServiceRequestsByUser(user.id, user.role);

      // Get past completed service requests for the employee
      const unMappedCompletedServiceRequests =
        await employeeActivity.getServiceRequestsForEmployee(user.id);

      // Get page numbers from query params
      const completedPage = parseInt(req.query.completedPage) || 1;
      const inProgressPage = parseInt(req.query.inProgressPage) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // Paginate the completed and in-progress requests
      let completedServiceRequests;
      if (unMappedCompletedServiceRequests) {
        completedServiceRequests = await helpers.mapServiceRequests(
          unMappedCompletedServiceRequests,
          completedPage,
          pageSize
        );
      }
      let inProgressServiceRequests;
      if (unMappedInProgressServiceRequests) {
        inProgressServiceRequests = await helpers.mapServiceRequests(
          unMappedInProgressServiceRequests,
          inProgressPage,
          pageSize
        );
      }

      return res.status(200).render("dashboards/employee-dashboard", {
        title: "Employee Dashboard",
        cssPath: `/public/css/employee-dashboard.css`,
        user: user,
        storeId: store.id,
        storeName: store.name,
        storePhone: store.phone,
        storeManagerId: storeManagerId,
        completedServiceRequests,
        inProgressServiceRequests,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Store manager dashboard
router.get(
  "/store-manager-dashboard",
  hasRole(["store-manager"]),
  async (req, res, next) => {
    try {
      const managerId = req.session.user.id;
      // Get store id using managerId of manager
      let store = await Store.find({ storeManager: managerId });

      if (!store || store.length === 0) {
        // if no store found, user does not manage any store
        return res.status(200).render("dashboards/store-manager-dashboard", {
          title: "Manager Dashboard",
          cssPath: `/public/css/store-manager-dashboard.css`,
          error: `Sorry ${req.session.user.name}, you do not work at any our stores! So nothing to display`,
        });
      }

      let store_id = store[0]._id.toString();
      store = store[0];

      // Get service requests for store
      const storeServiceRequests =
        await serviceRequests.getServiceRequestByStoreId(store_id);

      const statusCategories = {
        completed: ["complete"],
        pending: [
          "waiting for drop-off",
          "pending for approval",
          "ready for pickup",
        ],
        inProgress: ["in-process", "reassigned"],
      };

      let completedServiceRequests = [];
      let inProgressServiceRequests = [];
      let pendingServiceRequests = [];

      // Filter service requests into completed, pending, in-progress at managers dashboard
      let unMappedCompletedServiceRequests = storeServiceRequests.filter(
        (serviceRequest) =>
          statusCategories.completed.includes(serviceRequest.status)
      );

      let unMappedPendingServiceRequests = storeServiceRequests.filter(
        (serviceRequest) =>
          statusCategories.pending.includes(serviceRequest.status)
      );
      let unMappedInProgressServiceRequests = storeServiceRequests.filter(
        (serviceRequest) =>
          statusCategories.inProgress.includes(serviceRequest.status)
      );

      // Get page numbers from query params
      const completedPage = parseInt(req.query.completedPage) || 1;
      const pendingPage = parseInt(req.query.pendingPage) || 1;
      const inProgressPage = parseInt(req.query.inProgressPage) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // Paginate the completed and in-progress requests
      if (unMappedCompletedServiceRequests) {
        completedServiceRequests = await helpers.mapServiceRequests(
          unMappedCompletedServiceRequests,
          completedPage,
          pageSize
        );
      }
      if (unMappedPendingServiceRequests) {
        pendingServiceRequests = await helpers.mapServiceRequests(
          unMappedPendingServiceRequests,
          completedPage,
          pageSize
        );
      }
      if (unMappedInProgressServiceRequests) {
        inProgressServiceRequests = await helpers.mapServiceRequests(
          unMappedInProgressServiceRequests,
          inProgressPage,
          pageSize
        );
      }

      return res.status(200).render("dashboards/store-manager-dashboard", {
        title: "Manager Dashboard",
        cssPath: `/public/css/store-manager-dashboard.css`,
        user: req.session.user,
        storeId: store.id,
        storeName: store.name,
        storePhone: store.phone,
        completedServiceRequests,
        pendingServiceRequests,
        inProgressServiceRequests,
        currentCompletedPage: completedPage,
        currentPendingPage: pendingPage,
        currentInProgressPage: inProgressPage,
        pageSize,
      });
    } catch (error) {
      return res.status(500).render("errors/error", { error: error });
    }
  }
);

//  Admin dashboard
router.get("/admin-dashboard", hasRole(["admin"]), async (req, res, next) => {
  try {
    // Get all service requests, stores
    const allServiceRequests = await serviceRequests.getAllServiceRequests();
    const stores = await Store.find({}).lean();

    // Filter service requests into completed, pending
    let unMappedCompletedServiceRequests = allServiceRequests.filter(
      (serviceRequest) => serviceRequest.status === "complete"
    );

    let unMappedInProgressServiceRequests = allServiceRequests.filter(
      (serviceRequest) => serviceRequest.status !== "complete"
    );

    // Get page numbers from query params
    const completedPage = parseInt(req.query.completedPage) || 1;
    const inProgressPage = parseInt(req.query.inProgressPage) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    // Paginate the completed and in-progress requests
    let completedServiceRequests;
    if (unMappedCompletedServiceRequests) {
      completedServiceRequests = await helpers.mapServiceRequests(
        unMappedCompletedServiceRequests,
        completedPage,
        pageSize
      );
    }

    let inProgressServiceRequests;
    if (unMappedInProgressServiceRequests) {
      inProgressServiceRequests = await helpers.mapServiceRequests(
        unMappedInProgressServiceRequests,
        inProgressPage,
        pageSize
      );
    }

    // Render dashboard
    return res.status(200).render("dashboards/admin-dashboard", {
      title: "Admin Dashboard",
      cssPath: `/public/css/admin-dashboard.css`,
      user: req.session.user,
      stores,
      completedServiceRequests,
      inProgressServiceRequests,
      currentCompletedPage: completedPage,
      currentInProgressPage: inProgressPage,
      pageSize,
    });
  } catch (error) {
    next(error);
  }
});

// Payment route
router.get("/payment", async (req, res, next) => {
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
    // return res.status(500).json({
    //   message: "An internal server error occurred.",
    //   error: error.message,
    // });
    next(error);
  }
});
export default router;
