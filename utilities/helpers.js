import moment from "moment";

// Function to map and paginate service requests
export const mapServiceRequests = async (
  serviceRequests,
  page = 1,
  pageSize = 10
) => {
  // Map and format the service requests
  const mappedRequestsPromises = serviceRequests.map(async (request) => {
    try {
      const orderId = request ? request._id.toString() : "N/A";
      const repairDetails = request.repair_details || {};
      const payment = request.payment || {};

      // Employee name and contact if assigned

      let assignedEmployee, assignedEmployeePhone;
      if (request.employee_id) {
        assignedEmployee = request.employee_id.name;
        assignedEmployeePhone = request.employee_id.phone;
      }
      assignedEmployeePhone = assignedEmployeePhone
        ? assignedEmployeePhone
        : "N/A";
      assignedEmployee = assignedEmployee ? assignedEmployee : "Unassigned";

      // Get customer contact
      let customerContact;
      if (request.customer_id) {
        customerContact = request.customer_id.phone;
      }
      customerContact = customerContact ? customerContact : "N/A";

      // Device info
      const device = `${repairDetails?.model_name || "Unknown Device"}`;

      // Repair type
      const repairType = repairDetails?.repair_name || "Unknown Repair";

      // Price
      const price = payment?.isPaid ? payment.amount : 0;

      // Date Created
      const dateCreated = request?.createdAt
        ? moment(request.createdAt).format("YYYY-MM-DD")
        : "N/A";

      // Delivery/Completion Date
      const deliveryDate = request?.completedAt
        ? moment(request.completedAt).format("YYYY-MM-DD")
        : moment().add(1, "day").format("YYYY-MM-DD");

      // Status
      const statusMessage = request?.status || "Unknown Status";
      const isCompleted = statusMessage.toLowerCase() === "completed";
      const className = isCompleted ? "completed" : "in-progress";

      // Store contact number
      const storeContact = request?.store_id?.phone || "N/A";

      // Map the request object
      return {
        device,
        repairType,
        price,
        dateCreated,
        deliveryDate,
        statusMessage,
        className,
        storeContact,
        orderId,
        customerContact,
        assignedEmployee,
        assignedEmployeePhone,
      };
    } catch (error) {
      console.error("Error", error);
    }
  });

  // Wait for all promises to resolve
  const mappedRequests = await Promise.all(mappedRequestsPromises);

  // Sort the requests: Latest first and completed requests at the bottom
  const sortedRequests = mappedRequests.sort((a, b) => {
    // Sort by createdAt in descending order
    if (a.dateCreated === b.dateCreated) {
      return 0;
    }
    return moment(b.dateCreated).isBefore(moment(a.dateCreated)) ? 1 : -1;
  });

  // Calculate the number of items to skip for pagination
  const skip = (page - 1) * pageSize;

  // Slice the data to only show the current page's records
  const paginatedRequests = sortedRequests.slice(skip, skip + pageSize);

  return sortedRequests;
};
