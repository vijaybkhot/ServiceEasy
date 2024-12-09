import ServiceRequest from "../models/serviceRequestModel.js";

export const createServiceRequest = async (req, res) => {
  try {
    const { customer_id, store_id, employee_id, priority, repair_id } = req.body;

    const serviceRequest = new ServiceRequest({
      customer_id,
      store_id,
      employee_id,
      priority,
      repair_id,
      status: "waiting for drop-off",
    });

    await serviceRequest.save();
    res.status(201).json({ message: "Service request created", serviceRequest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate("customer_id", "name email")
      .populate("employee_id", "name email")
      .populate("store_id", "name address");

    res.status(200).json(serviceRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getServiceRequestsByUser = async (req, res) => {
  try {
    const { user_id, role } = req.query; // Role: 'customer' or 'employee'

    const filter = role === "customer" ? { customer_id: user_id } : { employee_id: user_id };

    const serviceRequests = await ServiceRequest.find(filter)
      .populate("customer_id", "name email")
      .populate("employee_id", "name email")
      .populate("store_id", "name address");

    res.status(200).json(serviceRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addEmployeeActivity = async (req, res) => {
  try {
    const { service_request_id, activity_type, processing_employee_id, assigned_by, comments } =
      req.body;

    const serviceRequest = await ServiceRequest.findById(service_request_id);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const newActivity = {
      activity_type,
      processing_employee_id,
      assigned_by,
      comments: comments || [],
      status: "pending",
      start_time: new Date(),
    };

    serviceRequest.employeeActivity.push(newActivity);

    // Optionally update the service request status
    if (activity_type === "repair") {
      serviceRequest.status = "in-process";
    }

    await serviceRequest.save();

    res.status(201).json({ message: "Employee activity added", serviceRequest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateEmployeeActivity = async (req, res) => {
  try {
    const { service_request_id, activity_index, status, comment } = req.body;

    const serviceRequest = await ServiceRequest.findById(service_request_id);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const activity = serviceRequest.employeeActivity[activity_index];
    if (!activity) {
      return res.status(404).json({ message: "Employee activity not found" });
    }

    if (status) {
      activity.status = status;
      if (status === "completed") activity.end_time = new Date();
    }

    if (comment) {
      activity.comments.push({
        user: req.user.id, // Assuming user ID is available in req.user
        comment,
      });
    }

    await serviceRequest.save();

    res.status(200).json({ message: "Activity updated", serviceRequest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { service_request_id, status } = req.body;

    const serviceRequest = await ServiceRequest.findById(service_request_id);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    serviceRequest.status = status;

    serviceRequest.auditTrail.push({
      action: "Status updated",
      performed_by: req.user.id, // Assuming user ID is available in req.user
      details: `Status changed to ${status}`,
    });

    await serviceRequest.save();
    res.status(200).json({ message: "Status updated", serviceRequest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addCommentToServiceRequest = async (req, res) => {
  try {
    const { service_request_id, activity_index, comment } = req.body;

    const serviceRequest = await ServiceRequest.findById(service_request_id);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Validate activity index
    if (!serviceRequest.employeeActivity[activity_index]) {
      return res.status(404).json({ message: "Employee activity not found" });
    }

    // Add comment to the specific activity
    const activity = serviceRequest.employeeActivity[activity_index];
    activity.comments.push({
      user: req.user.id, // Assuming the logged-in user ID is available in req.user
      comment,
      timestamp: new Date(),
    });

    // Update audit trail
    serviceRequest.auditTrail.push({
      action: "Comment added",
      performed_by: req.user.id, // Assuming user ID is available in req.user
      details: `Comment added to activity: ${comment}`,
    });

    await serviceRequest.save();

    res.status(200).json({ message: "Comment added to activity", serviceRequest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const addFeedback = async (req, res) => {
  try {
    const { service_request_id, rating, comment } = req.body;

    const serviceRequest = await ServiceRequest.findById(service_request_id);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    serviceRequest.feedback = { rating, comment };

    serviceRequest.auditTrail.push({
      action: "Feedback added",
      performed_by: req.user.id, // Assuming user ID is available in req.user
      details: `Rating: ${rating}, Comment: ${comment}`,
    });

    await serviceRequest.save();
    res.status(200).json({ message: "Feedback added", serviceRequest });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

