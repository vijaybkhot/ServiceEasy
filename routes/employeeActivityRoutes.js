import express from "express";
import dataValidator from "../utilities/dataValidator.js";
import {
  createEmployeeActivity,
  getEmployeeActivitiesForServiceRequest,
  getServiceRequestsForEmployee,
  updateEmployeeActivityStatus,
} from "../data/employeeActivity.js";
import { isValidObjectId } from "mongoose";
import User from "../models/userModel.js";
import ServiceRequest from "../models/serviceRequestModel.js";
import EmployeeActivity from "../models/employeeActivityModel.js";
import {
  isAuthenticated,
  hasRole,
} from "../utilities/middlewares/authenticationMiddleware.js";

const router = express.Router();
router.use(isAuthenticated);

// Route to create a new employee activity
router.post("/", async (req, res) => {
  try {
    let {
      service_request_id,
      activity_type,
      processing_employee_id,
      assigned_by,
      assigned_to,
      comments,
      status,
      start_time,
      end_time,
    } = req.body;

    // Input validation
    if (!isValidObjectId(service_request_id)) {
      throw new Error("Invalid service_request_id. Must be a valid ObjectId.");
    }

    // Validate activity type
    activity_type =
      activity_type &&
      ["repair", "approval", "assign/submit"].includes(activity_type)
        ? activity_type
        : null;

    status =
      status && ["in-progress", "completed"].includes(status)
        ? status
        : "in-progress";

    if (!activity_type) {
      throw new Error(
        'Invalid activity type. Must be one of "repair", "approval", or "assign/submit".'
      );
    }

    // Role validation for 'assigned_by'
    const validRoles = ["customer", "employee", "store-manager"];

    // Validate that assigned_by and processing_employee_id are valid ObjectIds
    if (!isValidObjectId(assigned_by)) {
      throw new Error("Invalid 'assigned_by' ID. Must be a valid ObjectId.");
    }

    if (!isValidObjectId(processing_employee_id)) {
      throw new Error(
        "Invalid 'processing_employee_id' ID. Must be a valid ObjectId."
      );
    }

    // Get users to validate the roles
    const assignedByUser = await User.findById(assigned_by);
    const processingEmployee = await User.findById(processing_employee_id);

    if (!assignedByUser || !validRoles.includes(assignedByUser.role)) {
      throw new Error(
        `Invalid 'assigned_by' ID or role. Must be one of: ${validRoles.join(
          ", "
        )}`
      );
    }

    if (
      !processingEmployee ||
      !["employee", "store-manager"].includes(processingEmployee.role)
    ) {
      throw new Error(
        `Invalid 'processing_employee_id' or role. Must be 'employee' or 'store-manager'.`
      );
    }

    // Validate service_request_id
    const serviceRequest = await ServiceRequest.findById(service_request_id);
    if (!serviceRequest) {
      throw new Error(
        `Service request with ID ${service_request_id} does not exist.`
      );
    }

    // validation for assigned_to and comments based on activity_type
    if (activity_type === "assign/submit") {
      // assigned_to and comments are required only for 'assign/submit' type
      if (!isValidObjectId(assigned_to)) {
        throw new Error("Invalid 'assigned_to' ID. Must be a valid ObjectId.");
      }

      const assignedToUser = await User.findById(assigned_to);
      if (!assignedToUser || !validRoles.includes(assignedToUser.role)) {
        throw new Error(
          `Invalid 'assigned_to' ID or role. Must be one of: ${validRoles.join(
            ", "
          )}`
        );
      }
      // Validate comments
      if (comments) {
        if (
          typeof comments.comment !== "string" ||
          comments.comment.trim().length === 0
        ) {
          throw new Error("Comment must be a non-empty string if provided.");
        }
      }

      // Make sure status is 'completed' for 'assign/submit' activity type
      if (status !== "completed") {
        throw new Error(
          "For 'assign/submit' activities, status must be 'completed'."
        );
      }

      // Automatically set end_time when status is 'completed'
      if (status === "completed" && !end_time) {
        end_time = Date.now();
      }
    } else {
      // 'assigned_to' and 'comments' should not be included
      if (assigned_to) {
        throw new Error("'assigned_to' is not allowed for this activity type.");
      }

      if (comments) {
        throw new Error("'comments' is not allowed for this activity type.");
      }

      // status should default to 'in-progress' if not provided
      if (!status) {
        status = "in-progress";
      }

      // For repair and approval activities, status must be in-progress at creation
      if (activity_type === "repair" || activity_type === "approval") {
        if (status !== "in-progress") {
          throw new Error(
            "For 'repair' and 'approval' activities, status must be 'in-progress' at creation."
          );
        }
      }
    }

    // Call the createEmployeeActivity function to validate and create the new activity
    const newEmployeeActivity = await createEmployeeActivity({
      service_request_id,
      activity_type,
      processing_employee_id,
      assigned_by,
      assigned_to,
      comments,
      status,
      start_time,
      end_time,
    });

    // If successfully created, send the new activity as a response
    return res.status(201).json({
      success: true,
      message: "Employee activity created successfully.",
      data: newEmployeeActivity,
    });
  } catch (error) {
    // Handle any errors that occur during the creation process
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Route to get employee activities for a service request
router.get(
  "/service-requests/:serviceRequestId/",
  hasRole(["admin", "store-manager", "employee"]),
  async (req, res) => {
    const { serviceRequestId } = req.params;

    try {
      const validServiceRequestId =
        dataValidator.isValidObjectId(serviceRequestId);
      if (!validServiceRequestId) {
        return res.status(400).json({
          error: `Invalid Service Request ID: ${serviceRequestId}`,
        });
      }

      const serviceRequest = await ServiceRequest.findById(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({
          error: `Service Request with ID ${serviceRequestId} does not exist.`,
        });
      }

      const employeeActivities = await getEmployeeActivitiesForServiceRequest(
        serviceRequestId
      );

      return res.status(200).json({
        message: "Employee activities retrieved successfully.",
        data: employeeActivities,
      });
    } catch (error) {
      return res.status(500).json({
        error: `${error.message}`,
      });
    }
  }
);

// Route to get all service requests for a user using employee activities
router.get(
  "/user/service-requests/:userId",
  hasRole(["admin", "store-manager", "employee"]),
  async (req, res) => {
    const { userId } = req.params;

    const validUserId = dataValidator.isValidObjectId(userId);

    if (!validUserId) {
      return res.status(400).json({
        success: false,
        message: `Invalid User ID: ${userId}`,
      });
    }

    try {
      const employeeActivities = await EmployeeActivity.find({
        processing_employee_id: validUserId,
      });

      if (employeeActivities.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No employee activities found for User ID: ${userId}`,
        });
      }

      const serviceRequests = await getServiceRequestsForEmployee(validUserId);

      res.status(200).json({
        success: true,
        data: serviceRequests,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Route to update employee activity status
router.put("/update-activity-status/:activityId", async (req, res) => {
  const { activityId } = req.params;
  const { status } = req.body;

  try {
    // Validate and update the status using the controller function
    const updatedActivity = await updateEmployeeActivityStatus(
      activityId,
      status
    );
    res.status(200).json({
      success: true,
      message: "Activity status updated successfully",
      data: updatedActivity,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
