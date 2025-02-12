import express from "express";
import {
  hasRole,
  isAuthenticated,
} from "../utilities/middlewares/authenticationMiddleware.js";
import {
  addFeedbackToServiceRequest,
  createServiceRequest,
  deleteServiceRequestById,
  getAllServiceRequests,
  getServiceRequestById,
  getServiceRequestByStoreId,
  getServiceRequestsByUser,
  updateServiceRequest,
  updateStatusById,
  modifyStatusAndAssign,
  generateClientSecret,
} from "../data/serviceRequests.js";
import dataValidator from "../utilities/dataValidator.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import CustomError from "../utilities/customError.js";
import ServiceRequest from "../models/serviceRequestModel.js";
import Email from "../utilities/email.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", hasRole(["admin"]), async (req, res, next) => {
  try {
    const requests = await getAllServiceRequests();

    // Return a success response with status 200
    return res.status(200).json({
      success: true,
      message: "Service requests retrieved successfully",
      requests,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve service requests",
      error: e.message,
    });
  }
});

router.post("/", hasRole("customer", "admin"), async (req, res) => {
  let {
    customer_id,
    employee_id = null,
    store_id,
    repair_details,
    status = "waiting for drop-off",
    payment,
    feedback = {},
  } = req.body;

  try {
    // Input validation

    customer_id = dataValidator.isValidObjectId(customer_id);
    store_id = dataValidator.isValidObjectId(store_id);

    // Check if IDs exist in the database
    const customer = await User.findById(customer_id);
    if (!customer || customer.role !== "customer") {
      return res.status(400).json({
        message: `Invalid customer ID: ${customer_id}.`,
      });
    }

    const store = await Store.findById(store_id);
    if (!store) {
      return res.status(400).json({
        message: `Invalid store ID: ${store_id}.`,
      });
    }

    const requiredEmployeeStatuses = [
      "in-process",
      "pending for approval",
      "ready for pickup",
      "reassigned",
      "complete",
    ];

    if (requiredEmployeeStatuses.includes(status)) {
      employee_id = dataValidator.isValidObjectId(employee_id);
    }
    if (employee_id) {
      const employee = await User.findById(employee_id);
      if (!employee || employee.role !== "employee") {
        return res.status(400).json({
          message: `Invalid employee ID: ${employee_id}.`,
        });
      }
    }

    // Status Validation
    const validStatuses = [
      "waiting for drop-off",
      "in-process",
      "pending for approval",
      "ready for pickup",
      "reassigned",
      "complete",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status: ${status}. Must be one of ${JSON.stringify(
          validStatuses
        )}.`,
      });
    }

    // Payment Validation
    if (!payment) {
      return res.status(400).json({
        message: `Payment is required to create a service request.`,
      });
    }
    if (
      typeof payment !== "object" ||
      Array.isArray(payment) ||
      payment === null
    ) {
      return res.status(400).json({
        message: `Payment must be a valid object.`,
      });
    }

    if (typeof payment.isPaid !== "boolean" || payment.isPaid !== true) {
      return res.status(400).json({
        message: `isPaid must be a boolean value in the payment object and must be true to create a service request.`,
      });
    }

    let { amount, payment_mode } = payment;

    // Ensure amount is provided and valid
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: `Amount must be positive in the payment.`,
      });
    }

    // Ensure payment_mode is provided and valid
    const validPaymentModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
    if (!validPaymentModes.includes(payment_mode)) {
      return res.status(400).json({
        message: `Invalid payment mode. Must be one of ${JSON.stringify(
          validPaymentModes
        )}.`,
      });
    }

    let transaction_id;
    if (payment.transaction_id) {
      if (
        typeof payment.transaction_id !== "string" ||
        payment.transaction_id.length < 5 ||
        payment.transaction_id.length > 50
      ) {
        return res.status(400).json({
          message: `Transaction ID must be a string and between 5 and 50 characters.`,
        });
      }
      transaction_id = payment.transaction_id;
    } else transaction_id = dataValidator.generateTransactionId();

    let payment_date =
      payment.payment_date && dataValidator.isValidDate(payment.payment_date)
        ? new Date(payment.payment_date)
        : Date.now();

    // Feedback Validation
    if (feedback) {
      if (typeof feedback !== "object" || feedback === null) {
        return res.status(400).json({
          message: `Feedback must be a valid object.`,
        });
      }

      if (feedback.rating !== undefined) {
        if (typeof feedback.rating !== "number") {
          return res.status(400).json({
            message: `Feedback rating must be a number.`,
          });
        }

        if (feedback.rating < 1 || feedback.rating > 5) {
          return res.status(400).json({
            message: `Feedback rating must be between 1 and 5.`,
          });
        }
      }
    }

    // Repair Details Validation
    if (!repair_details || typeof repair_details !== "object") {
      return res.status(400).json({
        message: `Repair details are required and must be a valid object.`,
      });
    }

    let {
      device_type,
      model_name,
      estimated_time,
      repair_name,
      defective_parts,
    } = repair_details;

    if (
      !device_type ||
      typeof device_type !== "string" ||
      device_type.length < 2 ||
      device_type.length > 50
    ) {
      return res.status(400).json({
        message: `Device type is required and must be a string between 2 and 50 characters.`,
      });
    }

    if (
      !model_name ||
      typeof model_name !== "string" ||
      model_name.length < 2 ||
      model_name.length > 50
    ) {
      return res.status(400).json({
        message: `Model name is required and must be a string between 2 and 50 characters.`,
      });
    }

    if (
      !estimated_time ||
      typeof estimated_time !== "number" ||
      estimated_time <= 0
    ) {
      return res.status(400).json({
        message: `Estimated time is required and must be a positive number.`,
      });
    }

    if (
      !repair_name ||
      typeof repair_name !== "string" ||
      repair_name.length < 2 ||
      repair_name.length > 50
    ) {
      return res.status(400).json({
        message: `Repair name is required and must be a string between 2 and 50 characters.`,
      });
    }

    if (!Array.isArray(defective_parts)) {
      defective_parts = [defective_parts];
      repair_details.defective_parts = [defective_parts];
    }

    if (
      defective_parts &&
      (!Array.isArray(defective_parts) ||
        !defective_parts.every(
          (part) =>
            typeof part === "string" && part.length > 1 && part.length <= 50
        ))
    ) {
      return res.status(400).json({
        message: `Defective parts must be an array of strings with each part name between 2 and 50 characters.`,
      });
    }

    // Create the service request object
    const newServiceRequest = {
      customer_id,
      employee_id,
      store_id,
      status,
      payment: {
        isPaid: payment.isPaid,
        amount: payment.amount,
        transaction_id: transaction_id,
        payment_mode: payment.payment_mode || "CC",
        payment_date: payment_date || Date.now(),
      },
      feedback,
      repair_details: {
        device_type,
        model_name,
        estimated_time,
        repair_name,
        defective_parts: defective_parts || [],
      },
    };

    const serviceRequest = await createServiceRequest(
      newServiceRequest.customer_id,
      newServiceRequest.employee_id,
      newServiceRequest.store_id,
      newServiceRequest.repair_details,
      newServiceRequest.status,
      newServiceRequest.payment,
      newServiceRequest.feedback
    );

    if (serviceRequest) {
      const orderData = {
        orderId: serviceRequest._id.toString(),
        storeName: store.name,
        storeAddress: store.location.address,
        storePhone: store.phone,
        modelName: repair_details.model_name,
        repairName: repair_details.repair_name,
        defectiveParts: repair_details.defective_parts,
        estimatedTime: repair_details.estimated_time,
        transactionId: serviceRequest.payment.transaction_id,
        amountPaid: serviceRequest.payment.amount,
        paymentMethod: serviceRequest.payment.payment_mode,
      };
      const url = `${req.protocol}://${req.get("host")}/dashboard`;
      await new Email(req.session.user, url, orderData).sendOrderPlaced();
      return res.status(200).json({
        message: "Service request created successfully",
        serviceRequest,
      });
    } else {
      return res.status(500).json({
        message: "Unable to create a service request.",
      });
    }
  } catch (e) {
    return res.status(500).json({
      message: e.message || "Internal server error",
    });
  }
});

router.get("/user/:id", async (req, res, next) => {
  const user_id = dataValidator.isValidObjectId(req.params.id);
  const role = req.session?.user?.role;
  try {
    user_id = dataValidator.isValidObjectId(
      user_id,
      "user_id",
      getServiceRequestsByUser.name
    );

    const validRoles = ["customer", "employee"];
    if (!role || !validRoles.includes(role)) {
      throw new CustomError({
        message: `Invalid role: ${role}. Role must be one of ${JSON.stringify(
          validRoles
        )}.`,
        statusCode: 400,
      });
    }

    // Check if the user exists in the database
    const user = await User.findById(user_id);
    if (!user) {
      throw new CustomError({
        message: `User with ID: ${user_id} does not exist.`,
        statusCode: 404,
      });
    }

    if (role === "customer" && user.role !== "customer") {
      throw new CustomError({
        message: `User with ID: ${user_id} is not a customer.`,
        statusCode: 400,
      });
    }

    if (role === "employee" && user.role !== "employee") {
      throw new CustomError({
        message: `User with ID: ${user_id} is not a employee.`,
        statusCode: 400,
      });
    }

    const serviceRequests = await getServiceRequestsByUser(user_id, role);
    return res.status(200).json({ serviceRequests: serviceRequests });
  } catch (e) {
    next(e);
  }
});

// Get all service requests for a store
router.get("/store/:id", async (req, res, next) => {
  try {
    const storeId = dataValidator.isValidObjectId(req.params.id);
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      throw new CustomError({
        message: `No store found with ID: ${storeId}.`,
        statusCode: 404,
      });
    }
    const serviceRequests = await getServiceRequestByStoreId(storeId);
    return res.status(200).json({ serviceRequests: serviceRequests });
  } catch (e) {
    return res.status(500).json({
      message: e.message || "Internal server error",
    });
  }
});

// Route to generate reports across all stores
router.get(
  "/generate-reports",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    try {
      // Get all service requests across stores
      const allRequests = await ServiceRequest.find();

      // Aggregate data for the report
      const totalRequests = allRequests.length;
      const completedRequests = allRequests.filter(
        (request) => request.status === "complete"
      ).length;
      const inProgressRequests = allRequests.filter(
        (request) => request.status !== "complete"
      ).length;
      const totalPrice = allRequests.reduce(
        (sum, request) => sum + request.payment.amount,
        0
      );
      const avgRating = allRequests.filter(
        (request) => request.feedback?.rating
      ).length
        ? allRequests
            .filter((request) => request.feedback?.rating)
            .reduce((sum, request) => sum + request.feedback?.rating, 0) /
          allRequests.filter((request) => request.feedback?.rating).length
        : 0;

      // Group by store to get the total requests per store
      const stores = await Store.find();
      const storeReport = stores.map((store) => {
        const storeRequests = allRequests.filter(
          (request) => request.store_id.toString() === store._id.toString()
        );

        // Filter requests with valid feedback and rating
        const ratedRequests = storeRequests.filter(
          (request) => request.feedback?.rating != null
        );

        // Calculate the average rating if there are any rated requests
        const storeAvgRating = ratedRequests.length
          ? ratedRequests.reduce(
              (sum, request) => sum + request.feedback?.rating,
              0
            ) / ratedRequests.length
          : 0;

        return {
          storeName: store.name,
          totalRequests: storeRequests.length,
          completedRequests: storeRequests.filter(
            (request) => request.status === "complete"
          ).length,
          inProgressRequests: storeRequests.filter(
            (request) => request.status !== "complete"
          ).length,
          totalPrice: storeRequests.reduce(
            (sum, request) => sum + request.payment?.amount,
            0
          ),
          avgRating: storeAvgRating.toFixed(1),
        };
      });

      res.status(200).json({
        totalRequests,
        completedRequests,
        inProgressRequests,
        totalPrice,
        avgRating: avgRating.toFixed(1),
        storeReport,
      });
    } catch (err) {
      console.error("Error generating report:", err);
      res.status(500).send("Server error");
    }
  }
);

// Route to generate reports for a given store
router.get(
  "/generate-store-report/:storeId",
  isAuthenticated,
  hasRole("store-manager"), // Assuming store-manager role has access to their store report
  async (req, res) => {
    try {
      let { storeId } = req.params;
      storeId = dataValidator.isValidObjectId(storeId);

      // Check if storeId is valid (if needed, you can add additional validation)
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Get all service requests for the specified store
      const storeRequests = await ServiceRequest.find({ store_id: storeId });

      // Aggregate data for the report
      const totalRequests = storeRequests.length;
      const completedRequests = storeRequests.filter(
        (request) => request.status === "complete"
      ).length;
      const inProgressRequests = storeRequests.filter(
        (request) => request.status !== "complete"
      ).length;
      const totalPrice = storeRequests.reduce(
        (sum, request) => sum + request.payment.amount,
        0
      );
      const avgRating = storeRequests.filter(
        (request) => request.feedback?.rating
      ).length
        ? storeRequests
            .filter((request) => request.feedback?.rating)
            .reduce((sum, request) => sum + request.feedback?.rating, 0) /
          storeRequests.filter((request) => request.feedback?.rating).length
        : 0;

      // Generate the report for the specific store
      const storeReport = {
        storeName: store.name,
        totalRequests,
        completedRequests,
        inProgressRequests,
        totalPrice,
        avgRating,
      };

      res.status(200).json({
        storeReport,
      });
    } catch (err) {
      console.error("Error generating store report:", err);
      res.status(500).send("Server error");
    }
  }
);

// Get service request by ID:
router.get("/:id", isAuthenticated, async (req, res, next) => {
  const serviceRequestId = dataValidator.isValidObjectId(req.params.id);
  try {
    const request = await getServiceRequestById(serviceRequestId);
    return res.status(200).json({ serviceRequest: request });
  } catch (e) {
    return res.status(500).json({
      message: e.message || "Internal server error",
    });
  }
});

// Route to update service request
router.patch("/:id", hasRole("admin"), async (req, res, next) => {
  try {
    const serviceRequestId = dataValidator.isValidObjectId(req.params.id);

    // Check if the service request exists
    const existingRequest = await ServiceRequest.findById(serviceRequestId);
    if (!existingRequest) {
      throw new CustomError({
        message: `No service request found with ID: ${serviceRequestId}.`,
        statusCode: 404,
      });
    }

    let updateObject = {};

    // Validate and update customer_id
    if (upObj.customer_id) {
      updateObject.customer_id = dataValidator.isValidObjectId(
        upObj.customer_id
      );
      const customer = await User.findById(updateObject.customer_id);
      if (!customer || customer.role !== "customer") {
        throw new CustomError({
          message: `Invalid customer ID: ${updateObject.customer_id}.`,
          statusCode: 400,
        });
      }
    }

    // Validate and update employee_id
    if (upObj.employee_id) {
      updateObject.employee_id = dataValidator.isValidObjectId(
        upObj.employee_id
      );
      const employee = await User.findById(updateObject.employee_id);
      if (!employee || employee.role !== "employee") {
        throw new CustomError({
          message: `Invalid employee ID: ${updateObject.employee_id}.`,
          statusCode: 400,
        });
      }
    }

    // Validate and update store_id
    if (upObj.store_id) {
      updateObject.store_id = dataValidator.isValidObjectId(upObj.store_id);
      const store = await Store.findById(updateObject.store_id);
      if (!store) {
        throw new CustomError({
          message: `Invalid store ID: ${updateObject.store_id}.`,
          statusCode: 400,
        });
      }
    }

    // Validate and update repair_details
    if (upObj.repair_details) {
      if (
        typeof upObj.repair_details !== "object" ||
        Array.isArray(upObj.repair_details)
      ) {
        throw new CustomError({
          message: "repair_details must be an object.",
          statusCode: 400,
        });
      }

      let {
        device_type,
        model_name,
        estimated_time,
        repair_name,
        defective_parts,
      } = upObj.repair_details;

      updateObject.repair_details = {};

      if (device_type) {
        updateObject.repair_details.device_type = dataValidator.isValidString(
          device_type,
          "repair_details.device_type",
          updateServiceRequest.name
        );
      }

      if (model_name) {
        updateObject.repair_details.model_name = dataValidator.isValidString(
          model_name,
          "repair_details.model_name",
          updateServiceRequest.name
        );
      }

      if (estimated_time) {
        updateObject.repair_details.estimated_time =
          dataValidator.isValidNumber(
            estimated_time,
            "repair_details.estimated_time",
            updateServiceRequest.name
          );
      }

      if (repair_name) {
        updateObject.repair_details.repair_name = dataValidator.isValidString(
          repair_name,
          "repair_details.repair_name",
          updateServiceRequest.name
        );
      }

      if (defective_parts) {
        if (!Array.isArray(defective_parts)) {
          throw new CustomError({
            message: "defective_parts must be an array of strings.",
            statusCode: 400,
          });
        }
        updateObject.repair_details.defective_parts = defective_parts.map(
          (part) =>
            dataValidator.isValidString(
              part,
              "repair_details.defective_parts",
              updateServiceRequest.name
            )
        );
      }
    }
    // Remove unchanged fields
    if (
      JSON.stringify(existingRequest.repair_details) ===
      JSON.stringify(updateObject.repair_details)
    ) {
      delete updateObject.repair_details;
    }

    // Validate and update status
    if (upObj.status) {
      updateObject.status = dataValidator.isValidString(
        upObj.status,
        "status",
        updateServiceRequest.name
      );

      const validStatuses = [
        "waiting for drop-off",
        "in-process",
        "pending for approval",
        "ready for pickup",
        "reassigned",
        "complete",
      ];

      if (!validStatuses.includes(updateObject.status)) {
        throw new CustomError({
          message: `Invalid status: ${
            updateObject.status
          }. Must be one of ${JSON.stringify(validStatuses)}.`,
          statusCode: 400,
        });
      }
    }

    // Validate and update payment
    if (upObj.payment) {
      if (typeof upObj.payment !== "object" || Array.isArray(upObj.payment)) {
        throw new CustomError({
          message: "Payment must be an object.",
          statusCode: 400,
        });
      }

      let { isPaid, amount, transaction_id, payment_mode, payment_date } =
        upObj.payment;

      updateObject.payment = updateObject.payment || {};

      // Validate isPaid
      if (isPaid !== undefined) {
        if (typeof isPaid !== "boolean") {
          throw new CustomError({
            message: `isPaid must be a boolean value.`,
            statusCode: 400,
          });
        }
        updateObject.payment.isPaid = isPaid;
      }

      // If isPaid is true, validate other payment details
      if (isPaid === true) {
        if (amount !== undefined) {
          if (typeof amount !== "number" || amount < 0) {
            throw new CustomError({
              message: `Amount must be a positive number.`,
              statusCode: 400,
            });
          }
          updateObject.payment.amount = amount; // Update amount in the payment object
        }

        if (transaction_id !== undefined) {
          if (
            typeof transaction_id !== "string" ||
            transaction_id.trim().length === 0
          ) {
            throw new CustomError({
              message: `Transaction ID must be a non-empty string.`,
              statusCode: 400,
            });
          }
          updateObject.payment.transaction_id = transaction_id; // Update transaction_id
        }

        if (payment_mode !== undefined) {
          const validModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
          if (!validModes.includes(payment_mode)) {
            throw new CustomError({
              message: `Invalid payment_mode: ${payment_mode}. Must be one of ${validModes.join(
                ", "
              )}`,
              statusCode: 400,
            });
          }
          updateObject.payment.payment_mode = payment_mode; // Update payment_mode
        }

        if (payment_date !== undefined) {
          const date = new Date(payment_date);
          if (isNaN(date)) {
            throw new CustomError({
              message: `Invalid payment_date. Must be a valid date.`,
              statusCode: 400,
            });
          }
          updateObject.payment.payment_date = date; // Update payment_date
        }
      } else if (isPaid === false) {
        // If isPaid is false, reset the payment details (they should not matter)
        updateObject.payment.amount = undefined;
        updateObject.payment.transaction_id = undefined;
        updateObject.payment.payment_mode = undefined;
        updateObject.payment.payment_date = undefined;
      }
    }

    // Validate and update feedback
    if (upObj.feedback) {
      if (typeof upObj.feedback !== "object" || Array.isArray(upObj.feedback)) {
        throw new CustomError({
          message: "Feedback must be an object.",
          statusCode: 400,
        });
      }

      let { rating, comment } = upObj.feedback;

      if (rating !== undefined) {
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
          throw new CustomError({
            message: `Feedback rating must be a number between 1 and 5.`,
            statusCode: 400,
          });
        }
        updateObject.feedback = updateObject.feedback || {};
        updateObject.feedback.rating = rating;
      }

      if (comment) {
        updateObject.feedback = updateObject.feedback || {};
        updateObject.feedback.comment = dataValidator.isValidString(
          comment,
          "feedback.comment",
          updateServiceRequest.name
        );
      }
    }

    // Remove fields that are not being updated
    if (
      existingRequest.customer_id?.toString() ===
      updateObject.customer_id?.toString()
    ) {
      delete updateObject.customer_id;
    }

    if (
      existingRequest.employee_id?.toString() ===
      updateObject.employee_id?.toString()
    ) {
      delete updateObject.employee_id;
    }

    if (
      existingRequest.store_id?.toString() === updateObject.store_id?.toString()
    ) {
      delete updateObject.store_id;
    }

    if (
      JSON.stringify(existingRequest.repair_details) ===
      JSON.stringify(updateObject.repair_details)
    ) {
      delete updateObject.repair_details;
    }

    if (existingRequest.status === updateObject.status) {
      delete updateObject.status;
    }

    if (
      JSON.stringify(existingRequest.payment) ===
      JSON.stringify(updateObject.payment)
    ) {
      delete updateObject.payment;
    }

    if (
      JSON.stringify(existingRequest.feedback) ===
      JSON.stringify(updateObject.feedback)
    ) {
      delete updateObject.feedback;
    }

    // Throw error if no fields were updated
    if (Object.keys(updateObject).length === 0) {
      throw new CustomError({
        message: `No changes detected for service request with ID: ${serviceRequestId}.`,
        statusCode: 202,
      });
    }

    // Update the service request
    let updatedRequest = await updateServiceRequest(serviceRequestId, req.body);
    if (updateObject) res.status(200).redirect(req.get("referer"));
  } catch (e) {
    next(e);
  }
});

// Route to add feedback to service request
router.put("/feedback/:id", hasRole("customer"), async (req, res, next) => {
  try {
    // Validate and extract the service request ID
    const serviceRequestId = dataValidator.isValidObjectId(req.params.id);
    if (!serviceRequestId) {
      throw new CustomError({
        message: "Invalid service request ID.",
        statusCode: 400,
      });
    }

    // Check if the service request exists
    const existingRequest = await ServiceRequest.findById(serviceRequestId);
    if (!existingRequest) {
      throw new CustomError({
        message: `No service request found with ID: ${serviceRequestId}.`,
        statusCode: 404,
      });
    }

    const { feedback } = req.body;
    // Validate feedback input
    if (typeof feedback !== "object" || feedback === null) {
      throw new CustomError({
        message: "Feedback must be an object.",
        statusCode: 400,
      });
    }

    const { rating, comment } = feedback;

    // If feedback is provided, rating must be provided
    if (feedback) {
      if (rating === undefined) {
        throw new CustomError({
          message: "If feedback is provided, rating must be provided.",
          statusCode: 400,
        });
      }

      // Validate rating
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new CustomError({
          message: "Feedback rating must be a number between 1 and 5.",
          statusCode: 400,
        });
      }

      // Validate comment (optional but must be a non-empty string if provided)
      if (
        comment !== undefined &&
        (typeof comment !== "string" || comment.trim().length === 0)
      ) {
        throw new CustomError({
          message: "Feedback comment must be a non-empty string.",
          statusCode: 400,
        });
      }
    }

    // Update the service request with the feedback
    const feedbackUpdated = await addFeedbackToServiceRequest(
      serviceRequestId,
      feedback
    );
    if (feedbackUpdated) {
      return res.status(200).json({
        status: "success",
        message: "Feedback updated successfully.",
        data: {
          serviceRequestId,
          feedback: feedback,
        },
      });
    } else {
      throw new CustomError({
        message: "Failed to update feedback.",
        statusCode: 500,
      });
    }
  } catch (e) {
    res.status(e.statusCode || 500).json({
      status: "error",
      message: e.message || "An unexpected error occurred.",
    });
  }
});

router.patch("/status/:id", hasRole("employee"), async (req, res, next) => {
  try {
    const serviceRequestId = dataValidator.isValidObjectId(req.params.id);

    // Check if the service request exists
    const existingRequest = await ServiceRequest.findById(serviceRequestId);
    if (!existingRequest) {
      throw new CustomError({
        message: `No service request found with ID: ${serviceRequestId}.`,
        statusCode: 404,
      });
    }

    // Validate newStatus
    const validStatuses = [
      "waiting for drop-off",
      "in-process",
      "pending for approval",
      "ready for pickup",
      "reassigned",
      "complete",
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new CustomError({
        message: `Invalid status: ${newStatus}. Must be one of ${JSON.stringify(
          validStatuses
        )}.`,
        statusCode: 400,
      });
    }

    // Check if the new status is different from the current status
    if (existingRequest.status === newStatus) {
      throw new CustomError({
        message: `The status is already set to '${newStatus}'. No update needed.`,
        statusCode: 202,
      });
    }

    if (await updateStatusById(serviceRequestId, req.body.status))
      res.status(200).redirect(req.get("referer"));
  } catch (e) {
    next(e);
  }
});

router.delete(
  "/:id",
  isAuthenticated,
  hasRole(["admin"]),
  async (req, res, next) => {
    try {
      let serviceRequestId = dataValidator.isValidObjectId(req.params.id);

      const serviceRequest = await ServiceRequest.findById(serviceRequestId);
      if (!serviceRequest) {
        throw new CustomError({
          message: `No service request found with ID: ${serviceRequestId}.`,
          statusCode: 404,
        });
      }

      if (await deleteServiceRequestById(serviceRequestId))
        return res.status(201).json({
          message: "Service request status Deleted successfully.",
          serviceRequest,
        });
    } catch (e) {
      return res.status(500).json({
        Error: e,
        message: e.message,
      });
    }
  }
);

// Route to modify status of a service request from a current status to a given status
router.put(
  "/modify-status",
  hasRole(["employee", "store-manager", "admin"]),
  async (req, res) => {
    let { service_request_id, current_status, outcome_status, employee_id } =
      req.body;

    try {
      // Validate service_request_id
      const validServiceRequestId =
        dataValidator.isValidObjectId(service_request_id);
      if (!validServiceRequestId) {
        return res.status(400).json({
          message: `Invalid service request ID: ${service_request_id}.`,
        });
      }

      // Validate current_status
      const validStatuses = [
        "waiting for drop-off",
        "in-process",
        "pending for approval",
        "ready for pickup",
        "reassigned",
        "complete",
      ];
      if (!validStatuses.includes(current_status)) {
        return res.status(400).json({
          message: `Invalid current status: ${current_status}. Must be one of ${JSON.stringify(
            validStatuses
          )}.`,
        });
      }

      // Validate outcome_status only if it's provided
      if (outcome_status && !validStatuses.includes(outcome_status)) {
        return res.status(400).json({
          message: `Invalid outcome status: ${outcome_status}. Must be one of ${JSON.stringify(
            validStatuses
          )}.`,
        });
      }

      // Validate employee_id only if it's provided
      if (employee_id && !dataValidator.isValidObjectId(employee_id)) {
        return res.status(400).json({
          message: `Invalid Employee ID: ${employee_id}.`,
        });
      }

      // Check if employee_id is required based on current_status
      if (
        ["in-process", "reassigned"].includes(outcome_status) &&
        !employee_id
      ) {
        return res.status(400).json({
          message: `Employee ID is required when changing status to "${outcome_status}".`,
        });
      }

      // Call the modifyStatusAndAssign data function
      const serviceRequest = await modifyStatusAndAssign(
        service_request_id,
        current_status,
        outcome_status,
        employee_id
      );

      return res.status(200).json({
        message: "Service request status updated successfully.",
        serviceRequest,
      });
    } catch (error) {
      // Handle any errors from the modifyStatusAndAssign function
      return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }
);

// Route to generate client secret for Stripe payment
router.post(
  "/process-payment",
  hasRole(["customer"]),
  async (req, res, next) => {
    try {
      const { associatedPrice, name, email, phone } = req.body;

      const clientSecret = await generateClientSecret({
        amount: associatedPrice,
        name,
        email,
        phone,
      });

      res.status(200).json({ clientSecret: clientSecret });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
