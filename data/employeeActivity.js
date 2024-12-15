import { isValidObjectId } from "mongoose";
import EmployeeActivity from "../models/employeeActivityModel.js";
import User from "../models/userModel.js";
import ServiceRequest from "../models/serviceRequestModel.js";
import * as dataValidator from "../utilities/dataValidator.js";

export async function createEmployeeActivity({
  service_request_id,
  activity_type,
  processing_employee_id,
  assigned_by,
  assigned_to,
  comments,
  status,
  start_time = null,
  end_time = null,
}) {
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

    // Validate comments if provided
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
    // For 'repair' and 'approval' activities:
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

    // // status can be either 'in-progress' or 'completed' for these types
    // if (status !== "in-progress" && status !== "completed") {
    //   throw new Error(
    //     "For 'repair' and 'approval' activities, status must be 'in-progress' or 'completed'."
    //   );
    // }
  }

  // Create the EmployeeActivity
  const newEmployeeActivity = {
    service_request_id,
    activity_type,
    processing_employee_id,
    assigned_by,
    assigned_to,
    comments,
    status,
    start_time,
    end_time,
  };

  try {
    const employeeActivity = await EmployeeActivity.create(newEmployeeActivity);
    return employeeActivity;
  } catch (error) {
    throw new Error(`Failed to create employee activity: ${error.message}`);
  }
}

// Get employee activities for a service request ID
export async function getEmployeeActivitiesForServiceRequest(serviceRequestId) {
  // Validate the serviceRequestId t
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  if (!serviceRequestId) {
    throw new Error(`Invalid Service Request ID: ${serviceRequestId}`);
  }

  // Get all employee activities for the given service request ID
  let employeeActivities;
  try {
    employeeActivities = await EmployeeActivity.find({
      service_request_id: serviceRequestId,
    });
  } catch (error) {
    throw new Error(`Error getting employee activities: ${error.message}`);
  }

  // Check if any employee activities exist for the given service request ID
  if (!employeeActivities || employeeActivities.length === 0) {
    throw new Error(
      `No employee activities found for service request with ID: ${serviceRequestId}`
    );
  }

  return employeeActivities;
}

export async function getEmployeeActivityById(activityId) {
  // Validate the activityId
  activityId = dataValidator.isValidObjectId(activityId);

  if (!activityId) {
    throw new Error(`Invalid Activity ID: ${activityId}`);
  }

  // Get the employee activity by its ID
  let employeeActivity;
  try {
    employeeActivity = await EmployeeActivity.findById(activityId);
  } catch (error) {
    throw new Error(`Error getting employee activity: ${error.message}`);
  }

  // Check if the employee activity exists
  if (!employeeActivity) {
    throw new Error(`No employee activity found with ID: ${activityId}`);
  }

  return employeeActivity;
}

// Update
export async function updateEmployeeActivity(employeeActivityId, upObj) {
  // Validate employeeActivityId
  employeeActivityId = dataValidator.isValidObjectId(employeeActivityId);

  // Check if the employee activity exists
  const existingActivity = await EmployeeActivity.findById(employeeActivityId);
  if (!existingActivity) {
    throw new Error(
      `No employee activity found with ID: ${employeeActivityId}.`
    );
  }

  let updateObject = {};

  // Validate and update activity_type
  if (upObj.activity_type) {
    const validActivityTypes = ["repair", "approval", "assign/submit"];
    if (!validActivityTypes.includes(upObj.activity_type)) {
      throw new Error(
        `Invalid activity_type: ${
          upObj.activity_type
        }. Must be one of ${validActivityTypes.join(", ")}.`
      );
    }
    updateObject.activity_type = upObj.activity_type;
  }

  // Validate and update status
  if (upObj.status) {
    const validStatuses = ["in-progress", "completed"];
    if (!validStatuses.includes(upObj.status)) {
      throw new Error(
        `Invalid status: ${upObj.status}. Must be one of ${validStatuses.join(
          ", "
        )}.`
      );
    }
    updateObject.status = upObj.status;
  }

  // Validate and update assigned_by
  if (upObj.assigned_by) {
    updateObject.assigned_by = dataValidator.isValidObjectId(upObj.assigned_by);
    const assignedByUser = await User.findById(updateObject.assigned_by);
    if (
      !assignedByUser ||
      !["customer", "employee", "store-manager"].includes(assignedByUser.role)
    ) {
      throw new Error(
        `Invalid assigned_by ID: ${updateObject.assigned_by}. Must be a valid ObjectId with role of customer, employee, or store-manager.`
      );
    }
  }

  // Validate and update processing_employee_id
  if (upObj.processing_employee_id) {
    updateObject.processing_employee_id = dataValidator.isValidObjectId(
      upObj.processing_employee_id
    );
    const processingEmployee = await User.findById(
      updateObject.processing_employee_id
    );
    if (
      !processingEmployee ||
      !["employee", "store-manager"].includes(processingEmployee.role)
    ) {
      throw new Error(
        `Invalid processing_employee_id: ${updateObject.processing_employee_id}. Must be a valid ObjectId with role of employee or store-manager.`
      );
    }
  }

  // Validate and update assigned_to for 'assign/submit' activity type
  if (upObj.activity_type === "assign/submit" && upObj.assigned_to) {
    updateObject.assigned_to = dataValidator.isValidObjectId(upObj.assigned_to);
    const assignedToUser = await User.findById(updateObject.assigned_to);
    if (
      !assignedToUser ||
      !["customer", "employee", "store-manager"].includes(assignedToUser.role)
    ) {
      throw new Error(
        `Invalid assigned_to ID: ${updateObject.assigned_to}. Must be a valid ObjectId with role of customer, employee, or store-manager.`
      );
    }
  }

  // Validate and update comments for 'assign/submit' activity type
  if (upObj.activity_type === "assign/submit" && upObj.comments) {
    if (!upObj.comments.comment) {
      throw new Error(
        "Comments are required for 'assign/submit' activity type."
      );
    }

    // Validate the comment to be a valid string and not empty after trimming
    if (
      typeof upObj.comments.comment !== "string" ||
      upObj.comments.comment.trim().length === 0
    ) {
      throw new Error("Comment must be a non-empty string.");
    }

    updateObject.comments = upObj.comments;
  }

  // Validate start_time and end_time
  if (upObj.start_time) {
    const startTime = new Date(upObj.start_time);
    if (isNaN(startTime)) {
      throw new Error(`Invalid start_time. Must be a valid date.`);
    }
    updateObject.start_time = startTime;
  }

  if (upObj.end_time) {
    const endTime = new Date(upObj.end_time);
    if (isNaN(endTime)) {
      throw new Error(`Invalid end_time. Must be a valid date.`);
    }
    updateObject.end_time = endTime;
  }

  // Automatically set status to 'in-progress' for 'repair' and 'approval' activity types
  if (
    (upObj.activity_type === "repair" || upObj.activity_type === "approval") &&
    !upObj.status
  ) {
    updateObject.status = "in-progress";
  }

  // Remove fields that are not being updated
  if (existingActivity.activity_type === updateObject.activity_type) {
    delete updateObject.activity_type;
  }

  if (existingActivity.status === updateObject.status) {
    delete updateObject.status;
  }

  if (
    existingActivity.assigned_by?.toString() ===
    updateObject.assigned_by?.toString()
  ) {
    delete updateObject.assigned_by;
  }

  if (
    existingActivity.processing_employee_id?.toString() ===
    updateObject.processing_employee_id?.toString()
  ) {
    delete updateObject.processing_employee_id;
  }

  if (
    existingActivity.assigned_to?.toString() ===
    updateObject.assigned_to?.toString()
  ) {
    delete updateObject.assigned_to;
  }

  if (
    JSON.stringify(existingActivity.comments) ===
    JSON.stringify(updateObject.comments)
  ) {
    delete updateObject.comments;
  }

  if (
    existingActivity.start_time?.toString() ===
    updateObject.start_time?.toString()
  ) {
    delete updateObject.start_time;
  }

  if (
    existingActivity.end_time?.toString() === updateObject.end_time?.toString()
  ) {
    delete updateObject.end_time;
  }

  // Throw error if no fields were updated
  if (Object.keys(updateObject).length === 0) {
    throw new Error(
      `No changes detected for employee activity with ID: ${employeeActivityId}.`
    );
  }

  // Update the employee activity
  let updatedActivity;
  try {
    updatedActivity = await EmployeeActivity.findByIdAndUpdate(
      employeeActivityId,
      { $set: updateObject },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error updating employee activity: ${error.message}`);
  }

  if (!updatedActivity) {
    throw new Error(
      `Could not update employee activity with ID: ${employeeActivityId}.`
    );
  }

  return updatedActivity;
}

// Update status of activity - only for repair and approval activity types
// Only change from in-progress to completed, not other way around
export async function updateEmployeeActivityStatus(
  activityId,
  status = "completed"
) {
  // Validate the activityId
  activityId = dataValidator.isValidObjectId(activityId);
  if (!activityId) {
    throw new Error(`Invalid Activity ID: ${activityId}`);
  }

  // Validate the status
  status = dataValidator.isValidString(
    status,
    "status",
    updateEmployeeActivityStatus.name
  );
  if (!status.trim()) {
    throw new Error("Status cannot be an empty string.");
  }

  // Allow only status change to "completed"
  if (status !== "completed") {
    throw new Error('Status can only be updated to "completed".');
  }

  // Get the employee activity by its ID
  let employeeActivity;
  try {
    employeeActivity = await EmployeeActivity.findById(activityId);
  } catch (error) {
    throw new Error(`Error getting employee activity: ${error.message}`);
  }

  // Check if the employee activity exists
  if (!employeeActivity) {
    throw new Error(`No employee activity found with ID: ${activityId}`);
  }

  // Check if the activity type is "assign/submit"
  if (employeeActivity.activity_type === "assign/submit") {
    throw new Error(
      'Cannot update status for an activity of type "assign/submit".'
    );
  }

  // Ensure the current status is "in-progress" before allowing a change to "completed"
  if (employeeActivity.status !== "in-progress") {
    throw new Error(
      `Status change is only allowed from "in-progress" to "completed". Current status: ${employeeActivity.status}`
    );
  }

  // Update the status of the employee activity
  let updatedActivity;
  try {
    updatedActivity = await EmployeeActivity.findByIdAndUpdate(
      activityId,
      { $set: { status: "completed" } },
      { new: true }
    );
  } catch (error) {
    throw new Error(
      `Error updating employee activity status: ${error.message}`
    );
  }

  // Check if the update was successful
  if (!updatedActivity) {
    throw new Error(
      `Could not update status for employee activity with ID: ${activityId}.`
    );
  }

  return updatedActivity;
}

// Delete Employee Activity
export async function deleteEmployeeActivity(activityId) {
  // Validate the activityId
  activityId = dataValidator.isValidObjectId(activityId);
  if (!activityId) {
    throw new Error(`Invalid Activity ID: ${activityId}`);
  }

  // Check if employee activity exists
  let employeeActivity;
  try {
    employeeActivity = await EmployeeActivity.findById(activityId);
  } catch (error) {
    throw new Error(`Error getting employee activity: ${error.message}`);
  }

  // If no activity found, throw an error
  if (!employeeActivity) {
    throw new Error(`No employee activity found with ID: ${activityId}`);
  }

  // Delete the employee activity
  let deletedActivity;
  try {
    deletedActivity = await EmployeeActivity.findByIdAndDelete(activityId);
  } catch (error) {
    throw new Error(`Error deleting employee activity: ${error.message}`);
  }

  // If no activity was deleted (shouldn't happen if validation passed)
  if (!deletedActivity) {
    throw new Error(
      `Could not delete employee activity with ID: ${activityId}.`
    );
  }

  return deletedActivity;
}
