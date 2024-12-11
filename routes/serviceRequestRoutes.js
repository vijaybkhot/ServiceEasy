import express from "express";
import { hasRole, isAuthenticated } from "../utilities/middlewares/authenticationMiddleware.js";
import { createServiceRequest, getAllServiceRequests } from "../data/serviceRequests.js";
import * as dataValidator from "../utilities/dataValidator.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import Repair from '../models/repairModel.js'

const router = express.Router();

router.get('/', isAuthenticated, hasRole('employee'), async (req, res) => {
    try {
        const requests = await getAllServiceRequests();
        req.status(200).render('dashboards/employee-dashboard', {requests})
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

router.post('/', isAuthenticated, hasRole('customer'), async(req, res) => {
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
        if (!customer || customer.role !== "customer") res.status(400).render('dashboards/customer-dashboard', {error: `Invalid customer ID: ${customer_id}.`})

        const store = await Store.findById(store_id);
        if (!store) res.status(400).render('dashboards/customer-dashboard', {error: `Invalid store ID: ${store_id}.`})

        const repair = await Repair.findById(repair_id);
        if (!repair) res.status(400).render('dashboards/customer-dashboard', {error: `Invalid repair ID: ${repair_id}`})

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
            res.status(400).render('dashboards/customer-dashboard', {error: `Invalid status: ${status}`})
        }

        // Payment Validation
        if(!Object.keys(payment).length)
            throw new Error("Payment must be completed to place an order.");
        
        const { amount, transaction_id, payment_mode } = payment;
        if (!transaction_id)
            res.status(400).render('dashboards/customer-dashboard', {error: `Transaction ID is required for the payment`});
        if (typeof amount !== "number" || amount <= 0)
            res.status(400).render('dashboards/customer-dashboard', {error: `Amount must be positive in the payment`});

        // Feedback Validation
        if (
            feedback &&
            feedback.rating &&
            (feedback.rating < 1 || feedback.rating > 5)
        ) {
            res.status(400).render('dashboards/customer-dashboard', {error: `Feedback ratings must be between 1 and 5`});
        }

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
            res.status(200).render('dashboards/customer-dashboard');
    } catch(e) {
        res.status(400).render('dashboards/customer-dashboard', {error: e});
    }
})

export default router;
