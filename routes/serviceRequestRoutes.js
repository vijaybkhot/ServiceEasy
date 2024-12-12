import express from "express";
import { hasRole, isAuthenticated } from "../utilities/middlewares/authenticationMiddleware.js";
import { addFeedbackToServiceRequest, createServiceRequest, deleteServiceRequestById, getAllServiceRequests, getServiceRequestById, getServiceRequestByStoreId, getServiceRequestsByUser, updateServiceRequest, updateStatusById } from "../data/serviceRequests.js";
import * as dataValidator from "../utilities/dataValidator.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import Repair from '../models/repairModel.js'
import CustomError from "../utilities/customError.js";
import ServiceRequest from "../models/serviceRequestModel.js";

const router = express.Router();

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const requests = await getAllServiceRequests();
        return requests;
    } catch(e) {
        next(e);
    }
});

router.post('/create', isAuthenticated, hasRole('customer'), async(req, res, next) => {
    const {
        customer_id,
        employee_id = null,
        store_id,
        repair_id,
        status = "waiting for drop-off",
        payment = {},
        feedback = {}
    } = req.body;
    try {
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
          throw new CustomError({message: `Invalid customer ID: ${customer_id}.`, statusCode: 400});
      
        const store = await Store.findById(store_id);
        if (!store) 
          throw new CustomError({message: `Invalid store ID: ${store_id}.`, statusCode: 400});
      
        const repair = await Repair.findById(repair_id);
        if (!repair) 
          throw new CustomError({message: `Invalid repair ID: ${repair_id}`, statusCode: 400});
      
        if (employee_id) {
          const employee = await User.findById(employee_id);
          if (!employee || employee.role !== "employee") {
            throw new CustomError({message: `Invalid employee ID: ${employee_id}.`, statusCode: 400});
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
          )}.`, statusCode: 400});
        }
      
      
        // Payment Validation
        if (payment.isPaid) {
          const { amount, transaction_id, payment_mode } = payment;
      
          // Ensure amount is provided and valid
          if (typeof amount !== "number" || amount <= 0)
            throw new CustomError({message: `Amount must be positive in the payment`, statusCode: 400});
      
          // Ensure transaction_id is provided and unique
          if (!transaction_id)
            throw new CustomError({message: `Transaction ID is required for the payment`, statusCode: 400});
      
          // Ensure payment_mode is provided and valid
          const validPaymentModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
          if (!validPaymentModes.includes(payment_mode))
            throw new CustomError({message: `Invalid payment mode. Must be one of ${JSON.stringify(
                validPaymentModes
            )}.`, statusCode: 400});
        } 
      
        // Feedback Validation
        if (
          feedback &&
          feedback.rating &&
          (feedback.rating < 1 || feedback.rating > 5)
        ) {
          throw new CustomError({message: `Feedback rating must be between 1 and 5.`, statusCode: 400});
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

        const serviceRequest = await createServiceRequest(...newServiceRequest);
        if(serviceRequest)
            res.status(200).redirect('/customer-dashboard');
        else
            throw new CustomError({message: 'Unable to create a request', statusCode: 500});
    } catch(e) {
        next(e);
    }
});

router.get('/user/:id', isAuthenticated, async (req, res, next) => {
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
            throw new CustomError({message: `Invalid role: ${role}. Role must be one of ${JSON.stringify(
                validRoles
            )}.`, statusCode: 400});
        }
    
        // Check if the user exists in the database
        const user = await User.findById(user_id);
        if (!user) {
            throw new CustomError({message: `User with ID: ${user_id} does not exist.`, statusCode: 404});
        }
    
        if (role === "customer" && user.role !== "customer") {
            throw new CustomError({message: `User with ID: ${user_id} is not a customer.`, statusCode: 400});
        }
    
        if (role === "employee" && user.role !== "employee") {
            throw new CustomError({message: `User with ID: ${user_id} is not a employee.`, statusCode: 400});
        }
    
        const serviceRequests = await getServiceRequestById(user_id, role);
        return serviceRequests;
    } catch(e) {
        next(e);
    }
});

router.get('/store/:id', isAuthenticated, async (req, res, next) => {
    try {
        const storeId = dataValidator.isValidObjectId(req.params.id);
        // Check if store exists
        const store = await Store.findById(storeId);
        if (!store) {
            throw new CustomError({message: `No store found with ID: ${storeId}.`, statusCode: 404});
        }
        const serviceRequests = await getServiceRequestByStoreId(storeId);
        return serviceRequests;
    } catch(e) {
        next(e);
    }
});

router.get('/:id', isAuthenticated, async (req, res, next) => {
    const serviceRequestId = dataValidator.isValidObjectId(req.params.id);
    try {
        const request = await getServiceRequestById(serviceRequestId);
        return request;
    } catch(e) {
        next(e);
    }
});

router.patch('/:id', isAuthenticated, async (req, res, next) => {
    try {
        const serviceRequestId = dataValidator.isValidObjectId(req.params.id);

        // Check if the service request exists
        const existingRequest = await ServiceRequest.findById(serviceRequestId);
        if (!existingRequest) {
            throw new CustomError({message: `No service request found with ID: ${serviceRequestId}.`, statusCode: 404});
        }

        let updateObject = {};

        // Validate and update customer_id
        if (upObj.customer_id) {
            updateObject.customer_id = dataValidator.isValidObjectId(upObj.customer_id);
            const customer = await User.findById(updateObject.customer_id);
            if (!customer || customer.role !== "customer") {
                throw new CustomError({message: `Invalid customer ID: ${updateObject.customer_id}.`, statusCode: 400});
            }
        }

        // Validate and update employee_id
        if (upObj.employee_id) {
            updateObject.employee_id = dataValidator.isValidObjectId(upObj.employee_id);
            const employee = await User.findById(updateObject.employee_id);
            if (!employee || employee.role !== "employee") {
                throw new CustomError({message: `Invalid employee ID: ${updateObject.employee_id}.`, statusCode: 400});
            }
        }

        // Validate and update store_id
        if (upObj.store_id) {
            updateObject.store_id = dataValidator.isValidObjectId(upObj.store_id);
            const store = await Store.findById(updateObject.store_id);
            if (!store) {
                throw new CustomError({message: `Invalid store ID: ${updateObject.store_id}.`, statusCode: 400});
            }
        }

        // Validate and update repair_id
        if (upObj.repair_id) {
            updateObject.repair_id = dataValidator.isValidObjectId(upObj.repair_id);
            const repair = await Repair.findById(updateObject.repair_id);
            if (!repair)
                throw new CustomError({message: `Invalid repair ID: ${updateObject.repair_id}.`, statusCode: 400});
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
                throw new CustomError({message: `Invalid status: ${
                updateObject.status
                }. Must be one of ${JSON.stringify(validStatuses)}.`, statusCode: 400});
            }
        }

        // Validate and update payment
        if (upObj.payment) {
            if (typeof upObj.payment !== "object" || Array.isArray(upObj.payment)) {
                throw new CustomError({message: "Payment must be an object.", statusCode: 400});
            }

            const { isPaid, amount, transaction_id, payment_mode, payment_date } =
            upObj.payment;

            updateObject.payment = updateObject.payment || {};

            // Validate isPaid
            if (isPaid !== undefined) {
            if (typeof isPaid !== "boolean") {
                throw new CustomError({message: `isPaid must be a boolean value.`, statusCode: 400});
            }
            updateObject.payment.isPaid = isPaid;
            }

            // If isPaid is true, validate other payment details
            if (isPaid === true) {
            if (amount !== undefined) {
                if (typeof amount !== "number" || amount < 0) {
                    throw new CustomError({message: `Amount must be a positive number.`, statusCode: 400});
                }
                updateObject.payment.amount = amount; // Update amount in the payment object
            }

            if (transaction_id !== undefined) {
                if (
                typeof transaction_id !== "string" ||
                transaction_id.trim().length === 0
                ) {
                    throw new CustomError({message: `Transaction ID must be a non-empty string.`, statusCode: 400});
                }
                updateObject.payment.transaction_id = transaction_id; // Update transaction_id
            }

            if (payment_mode !== undefined) {
                const validModes = ["CC", "DC", "DD", "cheque", "cash", "other"];
                if (!validModes.includes(payment_mode)) {
                    throw new CustomError({message: `Invalid payment_mode: ${payment_mode}. Must be one of ${validModes.join(
                    ", "
                    )}`, statusCode: 400});
                }
                updateObject.payment.payment_mode = payment_mode; // Update payment_mode
            }

            if (payment_date !== undefined) {
                const date = new Date(payment_date);
                if (isNaN(date)) {
                    throw new CustomError({message: `Invalid payment_date. Must be a valid date.`, statusCode: 400});
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
                throw new CustomError({message: "Feedback must be an object.", statusCode: 400});
            }

            const { rating, comment } = upObj.feedback;

            if (rating !== undefined) {
            if (typeof rating !== "number" || rating < 1 || rating > 5) {
                throw new CustomError({message: `Feedback rating must be a number between 1 and 5.`, statusCode: 400});
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
            throw new CustomError({message: `No changes detected for service request with ID: ${serviceRequestId}.`, statusCode: 202});
        }

        // Update the service request
        
        let updatedRequest = await updateServiceRequest(serviceRequestId, req.body);
        if(updateObject)
            res.status(200).redirect(req.get('referer'));
    } catch(e) {
        next(e);
    }
});

router.put('/feedback/:id', isAuthenticated, hasRole('customer'), async (req, res, next) => {
    try {
        const serviceRequestId = dataValidator.isValidObjectId(req.params.id);

        // Check if the service request exists
        const existingRequest = await ServiceRequest.findById(serviceRequestId);
        if (!existingRequest) {
            throw new CustomError({message: `No service request found with ID: ${serviceRequestId}.`, statusCode: 404});
        }
      
        // Validate feedback input
        if (typeof feedback !== "object") {
            throw new CustomError({message: "Feedback must be an object.", statusCode: 400});
        }
      
        const { rating, comment } = feedback;
      
        // If feedback is provided, rating must be provided
        if (feedback) {
          if (rating === undefined) {
            throw new CustomError({message: "If feedback is provided, rating must be provided.", statusCode: 400});
          }
      
          // Validate rating
          if (typeof rating !== "number" || rating < 1 || rating > 5) {
            throw new CustomError({message: "Feedback rating must be a number between 1 and 5.", statusCode: 400});
          }
      
          // Validate comment
          if (
            comment !== undefined &&
            (typeof comment !== "string" || comment.trim().length === 0)
          ) {
            throw new CustomError({message: "Feedback comment must be a non-empty string.", statusCode: 400});
          }
        }
        if(await addFeedbackToServiceRequest(serviceRequestId, req.body))
            res.status(200).redirect(req.get('referer'));
    } catch(e) {
        next(e);
    }
});

router.patch('/status/:id', isAuthenticated, hasRole('employee'), async (req, res, next) => {
    try {
        const serviceRequestId = dataValidator.isValidObjectId(req.params.id);

        // Check if the service request exists
        const existingRequest = await ServiceRequest.findById(serviceRequestId);
        if (!existingRequest) {
            throw new CustomError({message: `No service request found with ID: ${serviceRequestId}.`, statusCode: 404});
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
            throw new CustomError({message: `Invalid status: ${newStatus}. Must be one of ${JSON.stringify(
                validStatuses
            )}.`, statusCode: 400});
        }

        // Check if the new status is different from the current status
        if (existingRequest.status === newStatus) {
            throw new CustomError({message: `The status is already set to '${newStatus}'. No update needed.`, statusCode: 202});
        }

        if(await updateStatusById(serviceRequestId, req.body.status))
            res.status(200).redirect(req.get('referer'));
    } catch(e) {
        next(e);
    }
});

router.delete('/:id', isAuthenticated, async (req, res, next) => {
    try {
        let serviceRequestId = dataValidator.isValidObjectId(req.params.id);

        const serviceRequest = await ServiceRequest.findById(serviceRequestId);
        if (!serviceRequest) {
            throw new CustomError({message: `No service request found with ID: ${serviceRequestId}.`, statusCode: 404});
        }
        
        if(await deleteServiceRequestById(serviceRequestId))
            res.status(200).redirect(req.get('referer'));
    } catch(e) {
        next(e);
    }
})

export default router;
