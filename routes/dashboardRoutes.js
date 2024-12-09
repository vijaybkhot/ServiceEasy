import express from "express";

const router = express.Router();

router.get("/customer-dashboard", async (req, res, next) => {
  try {
    // Render dashboard
    res.status(200).render("customer-dashboard", {
      title: "Dashboard",
      cssPath: `/public/css/customer-dashboard.css`,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/employee-dashboard", async (req, res, next) => {
  try {
    // Render dashboard
    res.status(200).render("employee-dashboard", {
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
    res.status(200).render("store-manager-dashboard", {
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
    res.status(200).render("admin-dashboard", {
      title: "Admin Dashboard",
      cssPath: `/public/css/admin-dashboard.css`,
    });
  } catch (error) {
    next(error);
  }
});
export default router;
