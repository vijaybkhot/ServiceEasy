import { requestsCollection } from "../config/mongoCollections";
import ServiceRequest from "../models/serviceRequestModel";
import { ObjectId } from "mongodb";
import validatorFuncs from "../utilities/dataValidator";

// Get Functions

export async function getAllRequests() {
  const requests = await ServiceRequest.find()
    .populate("customer_id", "name email")
    .populate("store_id", "name location")
    .populate("employee_id", "name email");

  return requests;
}

export async function getServiceRequest(requestId) {
    const serviceRequest = await ServiceRequest.findById(requestId)
        .populate("customer_id", "name email")
        .populate("store_id", "name location")
        .populate("employee_id", "name email");
    
    return serviceRequest;
}

export async function getServiceRequestsByCustomerId(customer_id) {
  const { customer_id } = req.params;

  const serviceRequests = await ServiceRequest.find({ customer_id })
    .populate("customer_id", "name email")
    .populate("store_id", "name location")
    .populate("employee_id", "name email");

  return serviceRequests;
}

export async function findServiceRequestByCustomerId(customer_id, serviceId) {
  const serviceRequest = await ServiceRequest.findOne({
    _id: serviceId,
    customer_id: customer_id,
  })
    .populate("customer_id", "name email")
    .populate("store_id", "name location");

  return serviceRequest;
}

export async function getEmployeeActivity(requestId) {
    const request = await getServiceRequest(requestId)
        .select("employee_activity")
        .populate({
            path: "employee_activity.processing_employee_id",
            select: "name email"
        })
        .populate({
            path: "employee_activity.assigned_by",
            select: "name email"
        });
    
    return request;
}
