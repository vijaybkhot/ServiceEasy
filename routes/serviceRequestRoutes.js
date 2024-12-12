import express from "express";
import { hasRole, isAuthenticated } from "../utilities/middlewares/authenticationMiddleware.js";
import { createServiceRequest, getAllServiceRequests } from "../data/serviceRequests.js";
import * as dataValidator from "../utilities/dataValidator.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import Repair from '../models/repairModel.js'
import CustomError from "../utilities/customError.js";

const router = express.Router();

router.get('/', isAuthenticated, hasRole('employee'), async (req, res) => {
    try {
        const requests = await getAllServiceRequests();
        req.status(200).render('dashboards/employee-dashboard', {requests})
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

router.post('/', isAuthenticated, hasRole('customer'), async(req, res, next) => {
    const {
        customer_id,
        employee_id = null,
        store_id,
        repair_id,
        status,
        payment = {},
        feedback = {}
    } = req.body;
    try {
        // Input validation
        customer_id = dataValidator.isValidObjectId(customer_id);
        store_id = dataValidator.isValidObjectId(store_id);
        repair_id = dataValidator.isValidObjectId(repair_id);

        const requiredStatuses = [
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
            return new CustomError({message: `Invalid customer ID: ${customer_id}.`, statusCode: 400});

        const store = await Store.findById(store_id);
        if (!store) 
            return new CustomError({message: `Invalid store ID: ${store_id}.`, statusCode: 400});

        const repair = await Repair.findById(repair_id);
        if (!repair) 
            return new CustomError({message: `Invalid repair ID: ${repair_id}`, statusCode: 400});

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
            throw new CustomError({message: `Invalid status: ${status}`, statusCode: 400});
        }

        // Payment Validation
        if(!Object.keys(payment).length)
            throw new CustomError({message: "Payment must be completed to place an order.", statusCode: 400});
        
        const { amount, transaction_id, payment_mode } = payment;
        if (!transaction_id)
            throw new CustomError({message: `Transaction ID is required for the payment`, statusCode: 400});
        if (typeof amount !== "number" || amount <= 0)
            throw new CustomError({message: `Amount must be positive in the payment`, statusCode: 400});

        // Create the service request object
        const newServiceRequest = {
            customer_id,
            employee_id,
            store_id,
            repair_id,
            status,
            payment,
            feedback,
        };

        const serviceRequest = await createServiceRequest(...newServiceRequest);
        if(serviceRequest)
            res.redirect('/customer-dashboard');
        else
            throw new CustomError({message: 'Unable to create a request', statusCode: 500});
    } catch(e) {
        next(e);
    }
});

router.get('/', isAuthenticated, (req, res, next) => {
    try {

    } catch(e) {
        
    }
})

export default router;
