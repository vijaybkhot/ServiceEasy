import ServiceRequest from "../models/serviceRequestModel.js";
import * as dataValidator from "../utilities/dataValidator.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import Repair from "../models/repairModel.js";
import CustomError from "../utilities/customError.js";

export async function createServiceRequest(
  customer_id,
  employee_id = null,
  store_id,
  repair_id,
  status = "waiting for drop-off",
  payment = {},
  feedback = {}
) {
  // Input validation
  customer_id = dataValidator.isValidObjectId(customer_id);
  store_id = dataValidator.isValidObjectId(store_id);
  repair_id = dataValidator.isValidObjectId(repair_id);

  const requiredStatuses = [
    "waiting for drop-off",
    "in-process",
    "pending for approval",
    "ready for pickup",
    "reassigned",
    "complete",
  ];
  if (requiredStatuses.includes(status)) {
    employee_id = dataValidator.isValidObjectId(employee_id);
  }

  // Check if IDs exist in the database
  const customer = await User.findById(customer_id);
  if (!customer || customer.role !== "customer") 
    throw new CustomError({message: `Invalid customer ID: ${customer_id}.`, statusCode: 400, pageToRender: 'dashboards/customer-dashboard'});

  const store = await Store.findById(store_id);
  if (!store) 
    throw new CustomError({message: `Invalid store ID: ${store_id}.`, statusCode: 400, pageToRender: 'dashboards/customer-dashboard'});

  const repair = await Repair.findById(repair_id);
  if (!repair) 
    throw new CustomError({message: `Invalid repair ID: ${repair_id}`, statusCode: 400, pageToRender: 'dashboards/customer-dashboard'});

  if (employee_id) {
    const employee = await User.findById(employee_id);
    if (!employee || employee.role !== "employee") {
      throw new CustomError({message: `Invalid employee ID: ${employee_id}.`, statusCode: 400, pageToRender: 'dashboards/customer-dashboard'});
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
    throw new CustomError({message: `Invalid status: ${status}. Must be one of ${JSON.stringify(
        validStatuses
    )}.`, statusCode: 400, pageToRender: 'dashboards/customer-dashboard'});
  }

  // Payment Validation
  if (payment.isPaid) {
    const { amount, transaction_id, payment_mode } = payment;

    // Ensure amount is provided and valid
    if (typeof amount !== "number" || amount <= 0)
      throw new Error(`Amount must be a positive number.`);

    // Ensure transaction_id is provided and unique
    if (!transaction_id)
      throw new Error(`Transaction ID is required when payment is made.`);

    // Ensure payment_mode is provided and valid
    const validPaymentModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
    if (!validPaymentModes.includes(payment_mode))
      throw new Error(
        `Invalid payment mode. Must be one of ${JSON.stringify(
          validPaymentModes
        )}.`
      );
  }

  // Feedback Validation
  if (
    feedback &&
    feedback.rating &&
    (feedback.rating < 1 || feedback.rating > 5)
  ) {
    throw new CustomError({message: `Feedback rating must be between 1 and 5.`, statusCode: 400, pageToRender: 'dashboards/customer-dashboard'});
  }

  // Create the service request object
  const newServiceRequest = {
    customer_id,
    employee_id,
    store_id,
    repair_id,
    status,
    payment: {
      isPaid: payment.isPaid || false, // Default to false if not provided
      amount: payment.amount || 0, // Default to 0 if not provided
      transaction_id: payment.transaction_id || "", // Stripe's transaction ID
      payment_mode: payment.payment_mode || "CC", // Default to "CC" if not provided
      payment_date: payment.payment_date || Date.now(), // Default to current date if not provided
    },
    feedback,
  };

  try {
    const serviceRequest = await ServiceRequest.create(newServiceRequest);
    return serviceRequest;
  } catch (error) {
    throw new CustomError({message: error.message, statusCode: 500, pageToRender: 'dashboards/customer-dashboard'});
  }
}

export const getAllServiceRequests = async () => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate("customer_id", "name email")
      .populate("employee_id", "name email")
      .populate("store_id", "name address");

    return serviceRequests;
  } catch (error) {
    throw new Error(`Failed to fetch service requests: ${error.message}`);
  }
};

export async function getServiceRequestById(serviceRequestId) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const serviceRequest = await ServiceRequest.findById(serviceRequestId);
  if (!serviceRequest) {
    throw new Error(`No service request found with ID: ${serviceRequestId}.`);
  }

  return serviceRequest;
}

export async function updateServiceRequest(serviceRequestId, upObj) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const existingRequest = await ServiceRequest.findById(serviceRequestId);
  if (!existingRequest) {
    throw new Error(`No service request found with ID: ${serviceRequestId}.`);
  }

  let updateObject = {};

  // Validate and update customer_id
  if (upObj.customer_id) {
    updateObject.customer_id = dataValidator.isValidObjectId(upObj.customer_id);
    const customer = await User.findById(updateObject.customer_id);
    if (!customer || customer.role !== "customer") {
      throw new Error(`Invalid customer ID: ${updateObject.customer_id}.`);
    }
  }

  // Validate and update employee_id
  if (upObj.employee_id) {
    updateObject.employee_id = dataValidator.isValidObjectId(upObj.employee_id);
    const employee = await User.findById(updateObject.employee_id);
    if (!employee || employee.role !== "employee") {
      throw new Error(`Invalid employee ID: ${updateObject.employee_id}.`);
    }
  }

  // Validate and update store_id
  if (upObj.store_id) {
    updateObject.store_id = dataValidator.isValidObjectId(upObj.store_id);
    const store = await Store.findById(updateObject.store_id);
    if (!store) throw new Error(`Invalid store ID: ${updateObject.store_id}.`);
  }

  // Validate and update repair_id
  if (upObj.repair_id) {
    updateObject.repair_id = dataValidator.isValidObjectId(upObj.repair_id);
    const repair = await Repair.findById(updateObject.repair_id);
    if (!repair)
      throw new Error(`Invalid repair ID: ${updateObject.repair_id}.`);
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
      throw new Error(
        `Invalid status: ${
          updateObject.status
        }. Must be one of ${JSON.stringify(validStatuses)}.`
      );
    }
  }

  // Validate and update payment
  if (upObj.payment) {
    if (typeof upObj.payment !== "object" || Array.isArray(upObj.payment)) {
      throw new Error("Payment must be an object.");
    }

    const { isPaid, amount, transaction_id, payment_mode, payment_date } =
      upObj.payment;

    updateObject.payment = updateObject.payment || {};

    // Validate isPaid
    if (isPaid !== undefined) {
      if (typeof isPaid !== "boolean") {
        throw new Error(`isPaid must be a boolean value.`);
      }
      updateObject.payment.isPaid = isPaid;
    }

    // If isPaid is true, validate other payment details
    if (isPaid === true) {
      if (amount !== undefined) {
        if (typeof amount !== "number" || amount < 0) {
          throw new Error(`Amount must be a positive number.`);
        }
        updateObject.payment.amount = amount; // Update amount in the payment object
      }

      if (transaction_id !== undefined) {
        if (
          typeof transaction_id !== "string" ||
          transaction_id.trim().length === 0
        ) {
          throw new Error(`Transaction ID must be a non-empty string.`);
        }
        updateObject.payment.transaction_id = transaction_id; // Update transaction_id
      }

      if (payment_mode !== undefined) {
        const validModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
        if (!validModes.includes(payment_mode)) {
          throw new Error(
            `Invalid payment_mode: ${payment_mode}. Must be one of ${validModes.join(
              ", "
            )}`
          );
        }
        updateObject.payment.payment_mode = payment_mode; // Update payment_mode
      }

      if (payment_date !== undefined) {
        const date = new Date(payment_date);
        if (isNaN(date)) {
          throw new Error(`Invalid payment_date. Must be a valid date.`);
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
      throw new Error("Feedback must be an object.");
    }

    const { rating, comment } = upObj.feedback;

    if (rating !== undefined) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new Error(`Feedback rating must be a number between 1 and 5.`);
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
    existingRequest.repair_id?.toString() === updateObject.repair_id?.toString()
  ) {
    delete updateObject.repair_id;
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
    throw new Error(
      `No changes detected for service request with ID: ${serviceRequestId}.`
    );
  }

  // Update the service request
  let updatedRequest;
  try {
    updatedRequest = await ServiceRequest.findByIdAndUpdate(
      serviceRequestId,
      { $set: updateObject },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error updating service request: ${error.message}`);
  }

  if (!updatedRequest) {
    throw new Error(
      `Could not update service request with ID: ${serviceRequestId}.`
    );
  }

  return updatedRequest;
}

export async function deleteServiceRequestById(serviceRequestId) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const serviceRequest = await ServiceRequest.findById(serviceRequestId);
  if (!serviceRequest) {
    throw new Error(`No service request found with ID: ${serviceRequestId}.`);
  }

  // Delete the service request
  let deletedRequest;
  try {
    deletedRequest = await ServiceRequest.findByIdAndDelete(serviceRequestId);
  } catch (error) {
    throw new Error(`Error deleting service request: ${error.message}`);
  }

  if (!deletedRequest) {
    throw new Error(
      `Could not delete service request with ID: ${serviceRequestId}.`
    );
  }

  return deletedRequest;
}
export const getServiceRequestsByUser = async (user_id, role) => {
  try {
    // Validate input
    user_id = dataValidator.isValidObjectId(
      user_id,
      "user_id",
      getServiceRequestsByUser.name
    );

    const validRoles = ["customer", "employee"];
    if (!role || !validRoles.includes(role)) {
      throw new Error(
        `Invalid role: ${role}. Role must be one of ${JSON.stringify(
          validRoles
        )}.`
      );
    }

    // Check if the user exists in the database
    const user = await User.findById(user_id);
    if (!user) {
      throw new Error(`User with ID: ${user_id} does not exist.`);
    }

    if (role === "customer" && user.role !== "customer") {
      throw new Error(`User with ID: ${user_id} is not a customer.`);
    }

    if (role === "employee" && user.role !== "employee") {
      throw new Error(`User with ID: ${user_id} is not an employee.`);
    }

    // Filter logic based on role
    const filter =
      role === "customer" ? { customer_id: user_id } : { employee_id: user_id };

    // Get service requests
    const serviceRequests = await ServiceRequest.find(filter)
      .populate("customer_id", "name email")
      .populate("employee_id", "name email")
      .populate("store_id", "name address");

    // Return the result
    return serviceRequests;
  } catch (error) {
    throw new Error(`Failed to get service requests: ${error.message}`);
  }
};

export async function getServiceRequestByStoreId(storeId) {
  // Validate storeId
  storeId = dataValidator.isValidObjectId(storeId);

  // Check if store exists
  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error(`No store found with ID: ${storeId}.`);
  }

  // Fetch the service request(s) related to the store
  let serviceRequests;
  try {
    serviceRequests = await ServiceRequest.find({ store_id: storeId });
  } catch (error) {
    throw new Error(
      `Error fetching service requests for store ID ${storeId}: ${error.message}`
    );
  }

  if (!serviceRequests || serviceRequests.length === 0) {
    throw new Error(`No service requests found for store with ID: ${storeId}.`);
  }

  return serviceRequests;
}

export async function addFeedbackToServiceRequest(serviceRequestId, feedback) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const existingRequest = await ServiceRequest.findById(serviceRequestId);
  if (!existingRequest) {
    throw new Error(`No service request found with ID: ${serviceRequestId}.`);
  }

  // Validate feedback input
  if (typeof feedback !== "object") {
    throw new Error("Feedback must be an object.");
  }

  const { rating, comment } = feedback;

  // If feedback is provided, rating must be provided
  if (feedback) {
    if (rating === undefined) {
      throw new Error("If feedback is provided, rating must be provided.");
    }

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new Error("Feedback rating must be a number between 1 and 5.");
    }

    // Validate comment
    if (
      comment !== undefined &&
      (typeof comment !== "string" || comment.trim().length === 0)
    ) {
      throw new Error("Feedback comment must be a non-empty string.");
    }
  }

  // Add or update feedback
  const updateObject = {
    feedback: {
      rating,
      comment, // comment is optional, so it will only be added if present
    },
  };

  let updatedRequest;
  try {
    updatedRequest = await ServiceRequest.findByIdAndUpdate(
      serviceRequestId,
      { $set: updateObject },
      { new: true }
    );
  } catch (error) {
    throw new Error(
      `Error adding feedback to service request: ${error.message}`
    );
  }

  if (!updatedRequest) {
    throw new Error(
      `Could not update feedback for service request with ID: ${serviceRequestId}.`
    );
  }

  return updatedRequest;
}

export async function updateStatusById(serviceRequestId, newStatus) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const existingRequest = await ServiceRequest.findById(serviceRequestId);
  if (!existingRequest) {
    throw new Error(`No service request found with ID: ${serviceRequestId}.`);
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
    throw new Error(
      `Invalid status: ${newStatus}. Must be one of ${JSON.stringify(
        validStatuses
      )}.`
    );
  }

  // Check if the new status is different from the current status
  if (existingRequest.status === newStatus) {
    throw new Error(
      `The status is already set to '${newStatus}'. No update needed.`
    );
  }

  // Update the status of the service request
  let updatedRequest;
  try {
    updatedRequest = await ServiceRequest.findByIdAndUpdate(
      serviceRequestId,
      { $set: { status: newStatus } },
      { new: true }
    );
  } catch (error) {
    throw new Error(
      `Error updating status of service request: ${error.message}`
    );
  }

  if (!updatedRequest) {
    throw new Error(
      `Could not update status for service request with ID: ${serviceRequestId}.`
    );
  }

  return updatedRequest;
}
