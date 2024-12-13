import express from "express";
import Repair from "../models/repairModel.js";
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
