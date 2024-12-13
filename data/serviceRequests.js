import ServiceRequest from "../models/serviceRequestModel.js";
import dataValidator from "../utilities/dataValidator.js";
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
  payment,
  feedback = {}
) {
  // Input validation

  customer_id = dataValidator.isValidObjectId(customer_id);
  store_id = dataValidator.isValidObjectId(store_id);
  repair_id = dataValidator.isValidObjectId(repair_id);

  // Check if IDs exist in the database
  const customer = await User.findById(customer_id);
  if (!customer || customer.role !== "customer")
    throw new CustomError({
      message: `Invalid customer ID: ${customer_id}.`,
      statusCode: 400,
    });

  const store = await Store.findById(store_id);
  if (!store)
    throw new CustomError({
      message: `Invalid store ID: ${store_id}.`,
      statusCode: 400,
    });

  // Check if the repair exists in the database using the repair_id within the nested repair_types
  const repair = await Repair.findOne({
    "models.repair_types._id": repair_id,
  }).select("models.repair_types");

  if (!repair) {
    throw new CustomError({
      message: `Repair type with ID: ${repair_id} not found in any device model.`,
      statusCode: 400,
    });
  }

  // Find the specific repair type within the repair_types array
  const repairType = repair.models
    .flatMap((model) => model.repair_types) // Flatten the repair_types array
    .find((r) => r._id.toString() === repair_id.toString());

  if (!repairType) {
    throw new CustomError({
      message: `Repair type with ID: ${repair_id} not found.`,
      statusCode: 400,
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
      throw new CustomError({
        message: `Invalid employee ID: ${employee_id}.`,
        statusCode: 400,
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
    throw new CustomError({
      message: `Invalid status: ${status}. Must be one of ${JSON.stringify(
        validStatuses
      )}.`,
      statusCode: 400,
    });
  }

  // Payment Validation
  if (!payment) {
    throw new CustomError({
      message: `Payment is required to create a service request.`,
      statusCode: 400,
    });
  }
  if (
    typeof payment !== "object" ||
    Array.isArray(payment) ||
    payment === null
  ) {
    throw new CustomError({
      message: `Payment must be a valid object.`,
      statusCode: 400,
    });
  }

  if (typeof payment.isPaid !== "boolean" || payment.isPaid !== true) {
    throw new CustomError({
      message: `isPaid must be a boolean value in the payment object and must be true to create a service request.`,
      statusCode: 400,
    });
  }

  const { amount, payment_mode } = payment;

  // Ensure amount is provided and valid
  if (typeof amount !== "number" || amount <= 0)
    throw new CustomError({
      message: `Amount must be positive in the payment`,
      statusCode: 400,
    });

  // Generate transaction_id
  let transaction_id;
  if (payment.transaction_id) {
    // Check if it's a string and within an acceptable length
    if (
      typeof payment.transaction_id !== "string" ||
      payment.transaction_id.length < 5 ||
      payment.transaction_id.length > 50
    ) {
      throw new CustomError({
        message: `Transaction ID must be a string and between 5 and 50 characters.`,
        statusCode: 400,
      });
    }
    transaction_id = payment.transaction_id;
  } else transaction_id = dataValidator.generateTransactionId();

  // Ensure payment_mode is provided and valid
  const validPaymentModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
  if (!validPaymentModes.includes(payment_mode))
    throw new CustomError({
      message: `Invalid payment mode. Must be one of ${JSON.stringify(
        validPaymentModes
      )}.`,
      statusCode: 400,
    });
  // Check if payment_date if provided is valid date if not create a new date
  let payment_date =
    payment.payment_date && dataValidator.isValidDate(payment.payment_date)
      ? new Date(payment.payment_date)
      : Date.now();

  // Feedback Validation
  if (feedback && Object.keys(feedback).length > 0) {
    if (typeof feedback !== "object" || feedback === null) {
      throw new CustomError({
        message: `Feedback must be a valid object.`,
        statusCode: 400,
      });
    }

    if (feedback.rating !== undefined) {
      // Ensure rating is a number
      if (typeof feedback.rating !== "number") {
        throw new CustomError({
          message: `Feedback rating must be a number.`,
          statusCode: 400,
        });
      }

      // Ensure rating is between 1 and 5
      if (feedback.rating < 1 || feedback.rating > 5) {
        throw new CustomError({
          message: `Feedback rating must be between 1 and 5.`,
          statusCode: 400,
        });
      }
    }
  } else {
  }

  // Create the service request object
  const newServiceRequest = {
    customer_id,
    employee_id,
    store_id,
    repair_id,
    status,
    payment: {
      isPaid: payment.isPaid,
      amount: payment.amount,
      transaction_id: transaction_id,
      payment_mode: payment.payment_mode || "CC", // Default to "CC" if not provided
      payment_date: payment_date || Date.now(),
    },
    ...(feedback && Object.keys(feedback).length > 0 && { feedback }),
  };
  try {
    const serviceRequest = await ServiceRequest.create(newServiceRequest);
    return serviceRequest;
  } catch (error) {
    throw new CustomError({ message: error.message, statusCode: 500 });
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
    throw new CustomError({
      message: `Failed to fetch service requests: ${error.message}`,
      statusCode: 500,
    });
  }
};

export async function getServiceRequestById(serviceRequestId) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const serviceRequest = await ServiceRequest.findById(serviceRequestId);
  if (!serviceRequest) {
    throw new CustomError({
      message: `No service request found with ID: ${serviceRequestId}.`,
      statusCode: 404,
    });
  }

  return serviceRequest;
}

export async function updateServiceRequest(serviceRequestId, upObj) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

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
    updateObject.customer_id = dataValidator.isValidObjectId(upObj.customer_id);
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
    updateObject.employee_id = dataValidator.isValidObjectId(upObj.employee_id);
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
    if (!store)
      throw new CustomError({
        message: `Invalid store ID: ${updateObject.store_id}.`,
        statusCode: 400,
      });
  }

  // Validate and update repair_id
  if (upObj.repair_id) {
    updateObject.repair_id = dataValidator.isValidObjectId(upObj.repair_id);
    const repair = await Repair.findById(updateObject.repair_id);
    if (!repair)
      throw new CustomError({
        message: `Invalid repair ID: ${updateObject.repair_id}.`,
        statusCode: 400,
      });
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

    const { isPaid, amount, transaction_id, payment_mode, payment_date } =
      upObj.payment;

    updateObject.payment = {};

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
          transaction_id.length < 5 ||
          transaction_id.length > 50
        ) {
          throw new CustomError({
            message: `Transaction ID must be a string and between 5 and 50 characters.`,
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
      // If isPaid is false, reset the payment details
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

    const { rating, comment } = upObj.feedback;

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
    throw new CustomError({
      message: `No changes detected for service request with ID: ${serviceRequestId}.`,
      statusCode: 202,
    });
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
    throw new CustomError({
      message: `Error updating service request: ${error.message}`,
      statusCode: 500,
    });
  }

  if (!updatedRequest) {
    throw new CustomError({
      message: `Could not update service request with ID: ${serviceRequestId}.`,
      statusCode: 500,
    });
  }

  return updatedRequest;
}

export async function deleteServiceRequestById(serviceRequestId) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  // Check if the service request exists
  const serviceRequest = await ServiceRequest.findById(serviceRequestId);
  if (!serviceRequest) {
    throw new CustomError({
      message: `No service request found with ID: ${serviceRequestId}.`,
      statusCode: 404,
    });
  }

  // Delete the service request
  let deletedRequest;
  try {
    deletedRequest = await ServiceRequest.findByIdAndDelete(serviceRequestId);
  } catch (error) {
    throw new CustomError({
      message: `Error deleting service request: ${error.message}`,
      statusCode: 500,
    });
  }

  if (!deletedRequest) {
    throw new CustomError({
      message: `Could not delete service request with ID: ${serviceRequestId}.`,
      statusCode: 500,
    });
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
      throw new CustomError({
        message: `Invalid role: ${role}. Role must be one of ${JSON.stringify(
          validRoles
        )}.`,
        statusCode: 500,
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
    throw new CustomError({
      message: `Failed to get service requests: ${error.message}`,
      statusCode: 500,
    });
  }
};

export async function getServiceRequestByStoreId(storeId) {
  // Validate storeId
  storeId = dataValidator.isValidObjectId(storeId);

  // Check if store exists
  const store = await Store.findById(storeId);
  if (!store) {
    throw new CustomError({
      message: `No store found with ID: ${storeId}.`,
      statusCode: 404,
    });
  }

  // Fetch the service request(s) related to the store
  let serviceRequests;
  try {
    serviceRequests = await ServiceRequest.find({ store_id: storeId });
  } catch (error) {
    throw new CustomError({
      message: `Error fetching service requests for store ID ${storeId}: ${error.message}`,
      statusCode: 500,
    });
  }

  if (!serviceRequests || serviceRequests.length === 0) {
    throw new CustomError({
      message: `No service requests found for store with ID: ${storeId}.`,
      statusCode: 404,
    });
  }

  return serviceRequests;
}

export async function addFeedbackToServiceRequest(serviceRequestId, feedback) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

  const existingRequest = await ServiceRequest.findById(serviceRequestId);
  if (!existingRequest) {
    throw new CustomError({
      message: `No service request found with ID: ${serviceRequestId}.`,
      statusCode: 404,
    });
  }

  // Validate feedback input
  if (typeof feedback !== "object") {
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

    // Validate comment
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
    throw new CustomError({
      message: `Error adding feedback to service request: ${error.message}`,
      statusCode: 500,
    });
  }

  if (!updatedRequest) {
    throw new CustomError({
      message: `Could not update feedback for service request with ID: ${serviceRequestId}.`,
      statusCode: 500,
    });
  }

  return updatedRequest;
}

export async function updateStatusById(serviceRequestId, newStatus) {
  // Validate serviceRequestId
  serviceRequestId = dataValidator.isValidObjectId(serviceRequestId);

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
  // Update the status of the service request
  let updatedRequest;
  try {
    updatedRequest = await ServiceRequest.findByIdAndUpdate(
      serviceRequestId,
      { $set: { status: newStatus } },
      { new: true }
    );
  } catch (error) {
    throw new CustomError({
      message: `Error adding status of service request: ${error.message}`,
      statusCode: 500,
    });
  }

  if (!updatedRequest) {
    throw new CustomError({
      message: `Could not update status for service request with ID: ${serviceRequestId}.`,
      statusCode: 500,
    });
  }

  return updatedRequest;
}
