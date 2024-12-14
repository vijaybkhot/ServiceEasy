import express from "express";
import { createEmployeeActivity } from "../data/employeeActivity.js";
import { isValidObjectId } from "mongoose";
import EmployeeActivity from "..//models/employeeActivityModel.js";
import User from "../models/userModel.js";
import ServiceRequest from "../models/serviceRequestModel.js";

const router = express.Router();

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

      if (!comments || !comments.comment) {
        throw new Error("Comments are required with a valid comment.");
      }

      if (
        typeof comments.comment !== "string" ||
        comments.comment.trim().length === 0
      ) {
        throw new Error("Comment must be a non-empty string.");
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

export default router;
