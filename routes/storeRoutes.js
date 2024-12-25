import express from "express";
import validatorFuncs from "../utilities/dataValidator.js";
import {
  getAll,
  getById,
  createStore,
  updateStore,
  deleteStore,
  addEmployeeToStore,
  removeEmployeeFromStore,
  changeStoreManager,
  getReviewsById,
  getEmployeesWithServiceRequestCount,
} from "../data/stores.js";
import User from "../models/userModel.js";
import ServiceRequest from "../models/serviceRequestModel.js";
import {
  isAuthenticated,
  hasRole,
} from "../utilities/middlewares/authenticationMiddleware.js";
import { getUsersByRole } from "../data/user.js";

const router = express.Router();

// Route to render the "Add Store" page
router.get("/add", isAuthenticated, hasRole("admin"), async (req, res) => {
  try {
    const storeManagers = await getUsersByRole("store-manager");
    return res.status(200).render("stores/add-store", {
      title: "Add Store",
      storeManagers: storeManagers,
      cssPath: "/public/css/add-store.css",
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Route to fetch all stores
router.get("/", async (req, res) => {
  try {
    const stores = await getAll();
    return res.status(200).render("stores/all-stores", {
      title: "List of all Stores",
      stores: stores,
      json: JSON.stringify,
      errors: [],
      user: req.session.user,
      cssPath: `/public/css/all-stores.css`,
    });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
});

// Route to fetch all stores in JSON - also get managers without stores
router.get("/jsonStores", async (req, res) => {
  try {
    const stores = await getAll();

    const storeManagers = await User.find({ role: "store-manager" });

    const managersWithoutStore = storeManagers.filter((manager) => {
      // Check if the manager is not assigned to any store by comparing their _id with storeManager in stores
      return !stores.some(
        (store) =>
          store.storeManager._id &&
          store.storeManager._id.toString() === manager._id.toString()
      );
    });

    // Unassigned employees
    const employees = await User.find({ role: "employee" });

    const unassignedEmployees = employees.filter((employee) => {
      return !stores.some((store) => {
        return store.employees.some(
          (emp) => emp._id.toString() === employee._id.toString()
        );
      });
    });

    if (!stores) {
      return res.status(404).json({ error: "No stores found" });
    }

    return res.status(200).json({
      success: true,
      stores: stores,
      managersWithoutStore: managersWithoutStore,
      unassignedEmployees: unassignedEmployees,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Route to fetch a specific store by ID
// router.get("/:id", async (req, res) => {
//   let errors = [];
//   try {
//     const id = validatorFuncs.isValidString(
//       req.params.id,
//       "id",
//       "/get Store Route"
//     );
//     if (!validatorFuncs.validId(id)) {
//       errors.push("Please provide a valid Store ID!");
//     }
//     const reviews = await getReviewsById(id);
//     let customerReviews = [];
//     let totalRatings = 0;
//     // console.log(reviews)
//     try {
//       for (let review of reviews) {
//         // console.log(review);
//         customerReviews.push({
//           rating: review.feedback.rating,
//           comment: review.feedback.comment,
//           customerName: review.customer_id.name,
//         });
//         totalRatings = review.feedback.rating + totalRatings;
//       }
//       totalRatings = totalRatings / reviews.length;
//       // console.log(customerReviews);
//     } catch (error) {
//       console.log(error);
//     }
//     if (errors.length > 0) {
//       return res.status(400).render("stores/store", {
//         title: "Store Details",
//         errors,
//       });
//     }
//     const store = await getById(id);
//     return res.status(200).render("stores/store", {
//       title: "Store Details",
//       json: JSON.stringify,
//       store,
//       errors: [],
//       customerReviews: customerReviews,
//       totalRatings: totalRatings ? totalRatings.toFixed(1) : null,
//       user: req.session.user,
//       cssPath: `/public/css/store.css`,
//     });
//   } catch (error) {
//     errors.push("An unexpected error occurred. Please try again later.");
//     // console.log(error);
//     return res.status(500).render("stores/store", {
//       title: "Store Details",
//       errors,
//     });
//   }
// });

router.get("/:id", async (req, res) => {
  let errors = [];
  try {
    const id = validatorFuncs.isValidString(
      req.params.id,
      "id",
      "/get Store Route"
    );
    if (!validatorFuncs.validId(id)) {
      errors.push("Please provide a valid Store ID!");
    }

    if (errors.length > 0) {
      return res.status(400).render("stores/store", {
        title: "Store Details",
        errors,
      });
    }

    // Get the store details
    const store = await getById(id);
    if (!store) {
      errors.push("Store not found.");
      return res.status(404).render("stores/store", {
        title: "Store Details",
        errors,
      });
    }

    try {
      // Get all service requests for this store and populate the customer details
      const reviews = await ServiceRequest.find({
        store_id: id,
        feedback: { $exists: true },
      })
        .populate("customer_id", "name") // Populating only the 'name' field of the customer
        .select("feedback customer_id");

      // Create a map to store feedbacks grouped by customer_id
      const customerReviewsMap = new Map();

      for (const review of reviews) {
        const customerId = review.customer_id._id.toString();

        if (!customerReviewsMap.has(customerId)) {
          // Initialize customer review data for this customer
          customerReviewsMap.set(customerId, {
            customerName: review.customer_id.name,
            totalRating: 0,
            reviewCount: 0,
            bestComment: review.feedback.comment || "",
            bestRating: review.feedback.rating || 0,
          });
        }

        const customerData = customerReviewsMap.get(customerId);

        // Update total rating and count for averaging later
        customerData.totalRating += review.feedback.rating;
        customerData.reviewCount += 1;

        // Check if this review's rating is better than the current best rating for this customer
        if (review.feedback.rating > customerData.bestRating) {
          customerData.bestComment = review.feedback.comment || "";
          customerData.bestRating = review.feedback.rating;
        }
      }

      // Convert the map to an array of customer review objects
      const customerReviewsArray = Array.from(customerReviewsMap.values());

      const customerReviews = customerReviewsArray.map((customerData) => {
        const averageRating = (
          customerData.totalRating / customerData.reviewCount
        ).toFixed(1);
        return {
          customerName: customerData.customerName,
          averageRating: averageRating,
          bestComment: customerData.bestComment,
        };
      });

      // Calculate the overall average of the average ratings
      let totalAverageRating = 0;
      if (customerReviews.length > 0) {
        totalAverageRating =
          customerReviews.reduce(
            (sum, customer) => sum + parseFloat(customer.averageRating),
            0
          ) / customerReviews.length;
      }

      totalAverageRating = totalAverageRating.toFixed(1);

      return res.status(200).render("stores/store", {
        title: "Store Details",
        store,
        errors: [],
        customerReviews,
        totalAverageRating,
        user: req.session.user,
        cssPath: `/public/css/store.css`,
      });
    } catch (error) {
      console.error("Error while processing reviews:", error);
      errors.push("An error occurred while retrieving customer reviews.");
      return res.status(500).render("stores/store", {
        title: "Store Details",
        errors,
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    errors.push("An unexpected error occurred. Please try again later.");
    return res.status(500).render("stores/store", {
      title: "Store Details",
      errors,
    });
  }
});

// Route to add a store
router.post("/", isAuthenticated, hasRole("admin"), async (req, res) => {
  let errors = [];
  let { name, longitude, latitude, address, phone, storeManager, employees } =
    req.body;

  // Prepare location object
  const location = {
    type: "Point",
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
    address: address.trim(),
  };

  // Validation for the store name
  const nameRegex = /^[a-zA-Z0-9\s\-',.]+$/;
  if (!nameRegex.test(name)) {
    throw new Error(
      "Store name can only contain alphabets, numbers, spaces, hyphens, apostrophes, and commas."
    );
  }

  // Validate location, phone number, and storeManager ID
  if (!validatorFuncs.validLocation(location)) {
    errors.push("Enter a valid location!");
  }

  if (!validatorFuncs.isValidPhoneNumber(phone)) {
    errors.push("Enter a valid phone number!");
  }

  if (!validatorFuncs.validId(storeManager)) {
    errors.push("Enter a valid Store Manager ID!");
  }

  // Validate employees array and ensure each employee ID is valid
  if (employees && Array.isArray(employees)) {
    employees.forEach((employeeId) => {
      if (!validatorFuncs.validId(employeeId)) {
        errors.push(`Invalid employee ID: ${employeeId}`);
      }
    });
  }

  // If there are validation errors, return the response with errors
  if (errors.length > 0) {
    const storeManagers = await getUsersByRole("store-manager");
    return res.status(400).render("stores/add-store", {
      title: "Add Store",
      storeManagers: storeManagers,
      errors: errors,
      cssPath: `/public/css/add-store.css`,
    });
  }

  try {
    // Prepare the store details to be created
    const storeDetails = {
      name: name,
      location: location,
      phone: phone,
      storeManager: storeManager,
      employees: employees || [], // Default to an empty array if no employees are provided
    };

    // Call createStore function to add the store to the database
    const result = await createStore(storeDetails);

    // Redirect to the stores page if successful
    if (result) {
      return res.status(200).redirect("/stores");
    } else {
      throw new Error("Failed to add the store");
    }
  } catch (error) {
    // Return an error if any exception occurs
    return res.status(400).json({ error: error.message });
  }
});

// Route to update a store
router.patch("/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
  let errors = [];
  console.log(req.body);

  // Validate employees array if provided
  let { employees } = req.body;
  if (employees && Array.isArray(employees)) {
    employees.forEach((employeeId) => {
      if (!validatorFuncs.validId(employeeId)) {
        errors.push(`Invalid employee ID: ${employeeId}`);
      }
    });
  }

  // If there are validation errors, return a 400 response with the errors
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const result = await updateStore(req.params.id, req.body);
    if (result) {
      return res
        .status(200)
        .json({ message: "Store updated successfully", store: result });
    } else {
      throw new Error("Failed to update the store!");
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
});

// Route to delete a store
router.delete("/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
  try {
    const result = await deleteStore(req.params.id);
    if (result) {
      return res
        .status(201)
        .json({ message: "Store deleted successfully", store: result });
    } else {
      throw new Error("Failed to delete the store!");
    }
  } catch (error) {
    // console.log(error);
    return res.status(400).json({ error: error.message });
  }
});

// Route to add an employee to a store
router.post(
  "/:storeId/employees/:employeeId",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    let { storeId, employeeId } = req.params;
    let errors = [];

    // Validate storeId
    storeId = validatorFuncs.isValidString(
      storeId,
      "storeId",
      "addEmployeeToStore.storeId"
    );
    if (!validatorFuncs.validId(storeId)) {
      errors.push(`${storeId} is not valid. Provide a Valid Object ID.`);
    }

    // Validate employeeId
    employeeId = validatorFuncs.isValidString(
      employeeId,
      "employeeId",
      "addEmployeeToStore.employeeId"
    );
    if (!validatorFuncs.validId(employeeId)) {
      errors.push(`${employeeId} is not valid. Provide a Valid Object ID.`);
    }

    // If there are validation errors, return them as JSON
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Call the function to add the employee to the store
      let updatedStore = await addEmployeeToStore(storeId, employeeId);

      // If the employee was successfully added, return a success message as JSON
      return res.status(200).json({
        message: `Employee with ID ${employeeId} successfully added to store ${storeId}`,
        store: updatedStore,
      });
    } catch (error) {
      // Return any errors as JSON with a 400 status code
      return res.status(400).json({ error: error.message });
    }
  }
);

// Route to remove an employee from a store
router.delete(
  "/:storeId/employees/:employeeId",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    let { storeId, employeeId } = req.params;
    let errors = [];

    // Validate storeId
    storeId = validatorFuncs.isValidString(
      storeId,
      "storeId",
      "removeEmployeeFromStore.storeId"
    );
    if (!validatorFuncs.validId(storeId)) {
      errors.push(`${storeId} is not valid. Provide a Valid Object ID.`);
    }

    // Validate employeeId
    employeeId = validatorFuncs.isValidString(
      employeeId,
      "employeeId",
      "removeEmployeeFromStore.employeeId"
    );
    if (!validatorFuncs.validId(employeeId)) {
      errors.push(`${employeeId} is not valid. Provide a Valid Object ID.`);
    }

    // If there are validation errors, return them as JSON
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Call the function to remove the employee from the store
      const updatedStore = await removeEmployeeFromStore(storeId, employeeId);

      // If the employee was successfully removed, return a success message as JSON
      return res.status(200).json({
        message: `Employee with ID ${employeeId} successfully removed from store ${storeId}`,
        store: updatedStore,
      });
    } catch (error) {
      // Return any errors as JSON with a 400 status code
      return res.status(400).json({ error: error.message });
    }
  }
);

// Route to change the store manager
router.patch(
  "/:storeId/manager/:storeManagerId",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    let { storeId, storeManagerId } = req.params;
    let errors = [];

    // Validate storeId
    storeId = validatorFuncs.isValidString(
      storeId,
      "storeId",
      "changeStoreManager.storeId"
    );
    if (!validatorFuncs.validId(storeId)) {
      errors.push(`${storeId} is not valid. Provide a Valid Object ID.`);
    }

    // Validate storeManagerId
    storeManagerId = validatorFuncs.isValidString(
      storeManagerId,
      "storeManagerId",
      "changeStoreManager.storeManagerId"
    );
    if (!validatorFuncs.validId(storeManagerId)) {
      errors.push(`${storeManagerId} is not valid. Provide a Valid Object ID.`);
    }

    // If there are validation errors, return them as JSON
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Call the function to change the store manager
      const updatedStore = await changeStoreManager(storeId, storeManagerId);

      // If the manager was successfully changed, return a success message and the updated store
      return res.status(200).json({
        message: `Store manager successfully changed to ${storeManagerId}`,
        store: updatedStore,
      });
    } catch (error) {
      // Return any errors as JSON with a 400 status code
      return res.status(400).json({ error: error.message });
    }
  }
);

// Route to get employee to service request count map for a given store
router.post(
  "/getEmployeeDetails",
  isAuthenticated,
  hasRole(["admin", "store-manager", "employee"]),
  async (req, res) => {
    try {
      let { store_id } = req.body;
      // Validate store_id is provided
      store_id = store_id.trim();
      if (!validatorFuncs.validId(store_id)) {
        return res.status(400).json({ error: "Store ID is required" });
      }

      // Call the function to get the employees with service request count
      const employeesWithRequestCount =
        await getEmployeesWithServiceRequestCount(store_id);

      // Return the result
      res.status(200).json({
        success: true,
        employees: employeesWithRequestCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
);

export default router;
