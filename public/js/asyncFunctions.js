import { showAlert } from "./alert.js";

// Get all repairs
export const fetchAllRepairs = async function () {
  try {
    const response = await axios.get("http://localhost:3000/api/repairs/");
    const repairs = response.data;
    return repairs;
  } catch (error) {
    if (error.response) {
      showAlert(
        "error",
        `Server Error: ${
          error.response.data.message || "Something went wrong!"
        }`
      );
    } else if (error.request) {
      showAlert(
        "error",
        "No response received from the server. Please try again later."
      );
    } else {
      showAlert("error", `Request Setup Error: ${error.message}`);
    }
  }
};

// Get all stores
export const fetchAllStores = async function () {
  try {
    const response = await axios.get("http://localhost:3000/stores/jsonStores");
    const stores = response.data.stores;
    return stores;
  } catch (error) {
    if (error.response) {
      showAlert(
        "error",
        `Server Error: ${
          error.response.data.message || "Something went wrong!"
        }`
      );
    } else if (error.request) {
      showAlert(
        "error",
        "No response received from the server. Please try again later."
      );
    } else {
      showAlert("error", `Request Setup Error: ${error.message}`);
    }
  }
};

// Function to fetch userdata
export const getUserData = async function () {
  try {
    const response = await axios.get("/api/user");
    const data = response.data;
    return data.user;
  } catch (error) {
    showAlert("error", `Error fetching user data: ${error.message}`);
  }
};

// Function to load payment page
export const getPaymentPage = async function ({
  device_type,
  model_name,
  repair_id,
  repair_name,
  associated_price,
  estimated_time,
  defective_parts,
  customer,
  store_id,
  store,
}) {
  try {
    const response = await axios.get("/dashboard/payment", {
      params: {
        device_type,
        model_name,
        repair_id,
        repair_name,
        associated_price,
        estimated_time,
        defective_parts,
        customer,
        store_id,
        store,
      },
    });
    return response.data;
  } catch (error) {
    showAlert("error", error.message);
  }
};

// Function to get the specific repair based on selections
export const getRepairDetails = function (
  repairData,
  deviceType,
  modelName,
  repairName
) {
  // Loop through the repair data
  const device = repairData.find((item) => item.device_type === deviceType);

  if (device) {
    // Find the selected model within the device
    const model = device.models.find((m) => m.model_name === modelName);

    if (model) {
      // Find the repair type within the selected model

      const repair = model.repair_types.find(
        (r) => r.repair_name === repairName
      );

      if (repair) {
        return {
          device_type: device.device_type,
          model_name: model.model_name,
          associated_price: +repair.associated_price,
          estimated_time: +repair.estimated_time,
          repair_name: repair.repair_name,
          defective_parts: repair.defective_parts,
          repair_id: repair._id,
        };
      } else {
        showAlert("error", "Repair type not found");
        return null;
      }
    } else {
      showAlert("error", "Model not found");
      return null;
    }
  } else {
    showAlert("error", "Device type not found");
    return null;
  }
};

// Function to fetch serviceRequest by Id
export const fetchServiceRequestById = async function (id) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/service-request/${id}`
    );
    const data = response.data;

    // Check if nothing is returned
    if (!data || !data.serviceRequest) {
      showAlert("error", "No service request found for this Order ID.");
      return;
    }

    return data.serviceRequest;
  } catch (error) {
    console.error(
      "Error fetching service request:",
      error.response.data.message
    );

    // Handle 404 Not Found
    if (error.response && error.response.status === 404) {
      showAlert("error", error.response.data.message);
    }
    //  other errors
    else {
      showAlert("error", error.response.data.message);
    }
  }
};

// Function to get employeeDetails and serviceRequest count of each employee for a storeId
export const getEmployeeDetails = async function (storeId) {
  try {
    const response = await axios.post(
      "http://localhost:3000/stores/getEmployeeDetails",
      {
        store_id: storeId,
      }
    );
    return response.data.employees;
  } catch (error) {
    console.error(
      "Error fetching employee details:",
      error.response?.data || error.message
    );
    showAlert("error", error.response?.data?.message || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

//  function to modify service request status
export const modifyStatus = async function (
  serviceRequestId,
  currentStatus,
  outcomeStatus = null,
  employeeId = null
) {
  try {
    const requestBody = {
      service_request_id: serviceRequestId,
      current_status: currentStatus,
      outcome_status: outcomeStatus,
      employee_id: employeeId,
    };

    const response = await axios.put(
      "http://localhost:3000/api/service-request/modify-status",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // showAlert("success", "Status updated successfully");
    return response.data.serviceRequest;
  } catch (error) {
    if (error.response) {
      console.error("Error response:", error.response.data);
      showAlert("error", error.response.data.message);
    } else if (error.request) {
      console.error("No response received:", error.request);
      showAlert("error", "Server error, please try again later.");
    } else {
      console.error("Request error:", error.message);
      showAlert(
        "error",
        "An error occurred while trying to update the status."
      );
    }
  }
};

// function to create employeeActivity
export const createEmployeeActivity = async function (activityData) {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/employee-activity",
      activityData
    );
    // showAlert("success", "Employee Activity Created:");
    return response.data;
  } catch (error) {
    console.error(
      "Error creating employee activity:",
      error.response?.data || error.message
    );
    showAlert("error", error.response?.data?.message || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

// function to get all employee activity for a service request
export const fetchEmployeeActivities = async function (serviceRequest) {
  try {
    // Validate the serviceRequestId on the client-side before making the request
    let serviceRequestId = serviceRequest._id;
    if (
      !serviceRequestId ||
      typeof serviceRequestId !== "string" ||
      serviceRequestId.trim() === ""
    ) {
      showAlert("error", "Invalid Service Request ID provided.");
      return;
    }

    const url = `http://localhost:3000/api/employee-activity/service-requests/${serviceRequestId}/`;
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    return data.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 200 range
      if (serviceRequest.status === "waiting for drop-off") return;
      showAlert("info", `${error.response.data.error}`);
    } else if (error.request) {
      // Request was made but no response was received
      showAlert("error", "No response from server. Please try again later.");
    } else {
      // Something went wrong in setting up the request
      showAlert("error", `Error: ${error.message}`);
    }
  }
};

// function to update activity status from in-progress to completed
async function updateActivityStatus(activityId, status = "completed") {
  try {
    const response = await axios.put(
      `http://localhost:3000/api/employee-activity/update-activity-status/${activityId}`,
      {
        status: status,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating activity status:", error);
    showAlert("error", error.message);
  }
}

// Function to get current in-progress activity for the give processing user id
function getCurrentAndPrecedingActivity(activities, employeeId) {
  // Validate input
  if (!Array.isArray(activities)) {
    throw new Error("Activities must be an array");
  }

  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  // Find the current activity with 'in-progress' status
  const currentActivity = activities.find(
    (activity) =>
      activity.status === "in-progress" &&
      activity.processing_employee_id === employeeId
  );

  if (!currentActivity) {
    return { currentActivity: null, precedingActivity: null }; // No current activity found
  }

  // Step 2: Find the preceding activity
  // (createdAt closest to currentActivity but earlier than its createdAt)
  // (activity_type must be 'assign' or 'submit')
  const precedingActivities = activities.filter(
    (activity) =>
      new Date(activity.createdAt) < new Date(currentActivity.createdAt) &&
      activity.assigned_to === employeeId &&
      activity.activity_type === "assign/submit"
  );

  if (precedingActivities.length === 0) {
    return { currentActivity, precedingActivity: null };
  }

  // Find the preceding activity closest to the currentActivity
  const precedingActivity = precedingActivities.reduce((closest, activity) => {
    const activityDate = new Date(activity.createdAt);
    const currentActivityDate = new Date(currentActivity.createdAt);
    const closestDate = new Date(closest.createdAt);

    const timeDiffCurrent = currentActivityDate - activityDate;
    const timeDiffClosest = currentActivityDate - closestDate;

    return timeDiffCurrent < timeDiffClosest ? activity : closest;
  });

  return { currentActivity, precedingActivity };
}

// Get date in ordinal suffix format
export function formatDateWithOrdinalSuffix(dateStr, daysToAdd) {
  const date = new Date(dateStr);

  date.setDate(date.getDate() + daysToAdd);

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" }); // e.g., July
  const year = date.getFullYear();

  const ordinalSuffix = getOrdinalSuffix(day);

  return `${day}${ordinalSuffix} ${month} ${year}`;
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  const lastDigit = day % 10;
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12; // Convert 24-hour format to 12-hour format
  return `${hour12}:${minutes} ${ampm}`;
}

// Check if valid id
export const isValidOrderId = (orderId) => /^[a-f\d]{24}$/i.test(orderId);

// Load service request details
export const loadServiceRequestDetails = async function (
  orderId,
  user,
  storeId
) {
  try {
    // Fetch service request by ID
    let serviceRequest = await fetchServiceRequestById(orderId);

    // Check if service request was found
    if (!serviceRequest) {
      showAlert("error", "No service request found for this Order ID.");
      return;
    }
    // Extract store ID from the service request
    let store_id = serviceRequest.store_id._id;
    if (user.role === "store-manager") {
      if (store_id !== storeId) {
        showAlert(
          "warning",
          "Access denied! You are not allowed to access this Order."
        );
        return;
      }
    }
    let serviceRequestEmployeeId = serviceRequest?.employee_id?._id;
    if (user.role === "employee") {
      if (user.id !== serviceRequestEmployeeId) {
        showAlert(
          "warning",
          "Access denied! You are not allowed to access this Order."
        );
        return;
      }
    }
    if (user.role === "customer") {
      showAlert(
        "warning",
        "Access denied! You are not allowed to access this Order."
      );
      return;
    }

    // Get employee details for the store
    let employees = await getEmployeeDetails(store_id);

    // Get employee activities for the service Request
    let employeeActivities = await fetchEmployeeActivities(serviceRequest);
    let currentActivity, precedingActivity;
    if (employeeActivities || employeeActivities.length > 0) {
      let result = getCurrentAndPrecedingActivity(employeeActivities, user.id);
      currentActivity = result.currentActivity;
      precedingActivity = result.precedingActivity;
    }

    // Get current and preceeding employee activities for the curren user

    // Populate the overlay with service request details and employees
    populateServiceRequestOverlay(
      serviceRequest,
      employees,
      user,
      currentActivity,
      precedingActivity
    );
  } catch (error) {
    console.error(error);
    showAlert("error", "There was an error fetching the service request.");
  }
};

// Populate Service request for manager/employee
export const populateServiceRequestOverlay = function (
  serviceRequest,
  employees,
  user,
  currentActivity,
  precedingActivity
) {
  const detailsContainer = document.getElementById("service-request-details");
  let employeeSelectHTML = "";
  let assignButtonHTML = "";
  let precedingActivityHTML = "";
  let submitForApprovalHTML = "";
  let reassignHTML = "";
  let approveButtonHTML = "";

  // dynamic html select input and assign button if status is "Waiting for drop-off"
  if (
    serviceRequest.status.toLowerCase() === "waiting for drop-off" &&
    user.role === "store-manager"
  ) {
    // Generate the select options for employees
    employeeSelectHTML = `
      <label for="employeeSelect"><strong>Assign to Employee:</strong></label>
      <select id="employeeSelect">
        <option value="">Select an employee</option>
        ${employees
          .map(
            (employee) =>
              `<option value="${employee._id}">${employee.name} (${employee.serviceRequestCount} requests)</option>`
          )
          .join("")}
      </select>
      <label for="assignmentComment"><strong>Comment (Optional):</strong></label>
      <textarea id="assignmentComment" rows="4" placeholder="Add any notes or comments here..."></textarea>
    `;

    // Assign button HTML
    assignButtonHTML = `<button id="assignEmployeeBtn">Assign Employee</button>`;
  }

  // Dynamic overlay html for in-process status
  if (
    serviceRequest.status.toLowerCase() === "in-process" &&
    user.role === "employee"
  ) {
    if (precedingActivity && precedingActivity.comments) {
      const { comment, date } = precedingActivity.comments;
      precedingActivityHTML = `
        <div id="precedingActivity">
        <h3>Assigned By Store Manager</h3>
          <h3>Assignee Comment</h3>
          <p><strong>Date:</strong> ${formatDateWithOrdinalSuffix(
            date,
            0
          )} at ${formatTime(date)}</p>
          <p><strong>Comment:</strong> ${comment}</p>
        </div>
      `;
    }

    submitForApprovalHTML = `
      <div id="submitApprovalSection">
        <h3>Submit for Approval</h3>
        <label for="submitForApprovalComments"><strong>Comment (Optional):</strong></label>
        <textarea id="submitForApprovalComments" rows="4" placeholder="Add your comments here..."></textarea>
        <button id="submitForApprovalBtn">Submit for Approval</button>
      </div>
    `;
  }

  // Conditionally add reassign options and approval buttons if status is "Pending for Approval"
  if (
    serviceRequest.status.toLowerCase() === "pending for approval" &&
    user.role === "store-manager"
  ) {
    // Show the employee select dropdown with all employees for reassign
    employeeSelectHTML = `
      <label for="employeeSelect"><strong>Reassign to Employee:</strong></label>
      <select id="employeeSelect">
        <option value="">Select an employee</option>
        ${employees
          .map(
            (employee) =>
              `<option value="${employee._id}">${employee.name} (${employee.serviceRequestCount} requests)</option>`
          )
          .join("")}
      </select>
      <label for="reassignmentComment"><strong>Comment (Optional):</strong></label>
      <textarea id="reassignmentComment" rows="4" placeholder="Add any notes or comments here..."></textarea>
    `;

    // Reassign button
    reassignHTML = `<button id="reassignEmployeeBtn">Reassign Employee</button>`;

    // Approve button
    approveButtonHTML = `<button id="approveRequestBtn">Approve Request</button>`;

    // Display the employee who submitted the request (submitted by the store manager)
    let submittedByEmployee = serviceRequest.employee_id;
    if (submittedByEmployee) {
      const { name, phone } = submittedByEmployee;
      submittedByEmployeeHTML = `
        <div id="submittedBySection">
          <h3>Submitted By Employee</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Contact:</strong> ${phone}</p>
        </div>
      `;
    }
  }

  // The final details container
  detailsContainer.innerHTML = `
    <p><strong>Order ID:</strong> ${serviceRequest._id.toString()}</p>
    <p><strong>Device:</strong> ${serviceRequest.repair_details.model_name}</p>
    <p><strong>Repair Type:</strong> ${
      serviceRequest.repair_details.repair_name
    }</p>
    <p><strong>Price:</strong> $${serviceRequest.payment.amount}</p>
    <p><strong>Date Order Created:</strong> ${formatDateWithOrdinalSuffix(
      serviceRequest.payment.payment_date,
      0
    )}</p>
    <p><strong>Expected Delivery Date:</strong> ${formatDateWithOrdinalSuffix(
      serviceRequest.payment.payment_date,
      serviceRequest.repair_details.estimated_time
    )}</p>
    <p><strong>Status Message:</strong> ${serviceRequest.status}</p>
    <p><strong>Customer Contact:</strong> ${
      serviceRequest.customer_id?.phone
    }</p>
    <p><strong>Assigned Employee:</strong> ${
      serviceRequest.employee_id ? serviceRequest.employee_id.name : "N/A"
    }</p>
    <p><strong>Employee Contact:</strong> ${
      serviceRequest.employee_id ? serviceRequest.employee_id.phone : "N/A"
    }</p>
    ${precedingActivityHTML} 
    ${employeeSelectHTML}
    ${assignButtonHTML}
    ${submitForApprovalHTML}
    ${reassignHTML}
    ${approveButtonHTML}
    ${submittedByEmployeeHTML}
    <button id="closeOverlayBtn">Close</button>

  `;

  // Show the overlay
  const closeOverlayButton = document.getElementById("closeOverlayBtn");
  const overlay = document.getElementById("service-request-overlay");
  const assignEmployeeBtn = document.getElementById("assignEmployeeBtn");
  const employeeSelect = document.getElementById("employeeSelect");
  const submitForApprovalBtn = document.getElementById("submitForApprovalBtn");

  overlay.classList.remove("hidden");

  // Close  overlay function
  const closeOverlay = function () {
    if (overlay) {
      overlay.classList.add("hidden");
    }
  };

  // Attach event listener to close overlay button
  if (closeOverlayButton) {
    closeOverlayButton.addEventListener("click", closeOverlay);
  }

  // Attach event listener for the Escape key to close the overlay
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOverlay();
    }
  });

  if (assignEmployeeBtn) {
    assignEmployeeBtn.addEventListener("click", async function () {
      const selectedEmployeeId = employeeSelect.value;

      if (!selectedEmployeeId) {
        showAlert(
          "warning",
          "Please select an employee to assign this service request."
        );
        return;
      }
      showAlert("info", "Correct selection");

      // Details to create employeeActivity
      let managerActivityData;
      let assignmentComment;
      let employeeActivityData = {
        service_request_id: serviceRequest._id,
        activity_type: "repair",
        processing_employee_id: selectedEmployeeId,
        assigned_by: user.id,
        status: "in-progress",
      };
      if (document.getElementById("assignmentComment").value.trim() !== "") {
        let comment = document.getElementById("assignmentComment").value.trim();
        assignmentComment = {
          date: new Date(),
          comment: comment,
        };
        managerActivityData = {
          service_request_id: serviceRequest._id,
          activity_type: "assign/submit",
          processing_employee_id: user.id,
          assigned_by: serviceRequest.customer_id._id,
          assigned_to: selectedEmployeeId,
          comments: assignmentComment,
          status: "completed",
        };
      } else {
        managerActivityData = {
          service_request_id: serviceRequest._id,
          activity_type: "assign/submit",
          processing_employee_id: user.id,
          assigned_by: serviceRequest.customer_id._id,
          assigned_to: selectedEmployeeId,
          status: "completed",
        };
      }
      // Details to modify status
      let service_request_id = serviceRequest._id;
      let current_status = serviceRequest.status;
      let outcome_status = "in-process";
      let employee_id = selectedEmployeeId;

      // Call function to assign service request to employee
      let modifiedServiceRequest = await modifyStatus(
        service_request_id,
        current_status,
        outcome_status,
        employee_id
      );
      if (!modifiedServiceRequest) {
        showAlert("error", "Failed to modify the service request Status");
      } else {
        // showAlert("success", "Service request assigned successfully!");
        // Call function to create manager-Activity of assigning
        let managerActivity = await createEmployeeActivity(managerActivityData);
        let employeeActivity = await createEmployeeActivity(
          employeeActivityData
        );
        if (!managerActivity || !employeeActivity) {
          showAlert("error", "Failed to modify the service request Status");
        } else {
          showAlert("success", "Service request assigned successfully!");
          document.getElementById("orderId").value = "";
          closeOverlay();
          setTimeout(() => {
            location.reload();
          }, 5000);
        }
      }
    });
  }
  if (submitForApprovalBtn) {
    submitForApprovalBtn.addEventListener("click", async function () {
      // Details to create employeeActivity
      let currentActivityId = currentActivity._id; // To complete the activity
      let managerId =
        document.getElementById("store-data").dataset.storeManagerId;

      // Manager approval activity data
      let managerApprovalActivityData = {
        service_request_id: serviceRequest._id,
        activity_type: "approval",
        processing_employee_id: managerId,
        assigned_by: user.id,
        status: "in-progress",
      };
      // Employee assign/submit activity data
      let employeeSubmitActivityData;
      let assignmentComment;
      if (
        document.getElementById("submitForApprovalComments").value.trim() !== ""
      ) {
        let comment = document
          .getElementById("submitForApprovalComments")
          .value.trim();
        assignmentComment = {
          date: new Date(),
          comment: comment,
        };
        employeeSubmitActivityData = {
          service_request_id: serviceRequest._id,
          activity_type: "assign/submit",
          processing_employee_id: user.id,
          assigned_by: managerId,
          assigned_to: managerId,
          comments: assignmentComment,
          status: "completed",
        };
      } else {
        employeeSubmitActivityData = {
          service_request_id: serviceRequest._id,
          activity_type: "assign/submit",
          processing_employee_id: user.id,
          assigned_by: managerId,
          assigned_to: managerId,
          status: "completed",
        };
      }
      // Details to modify status
      let service_request_id = serviceRequest._id;
      let current_status = serviceRequest.status;
      let outcome_status = "pending for approval";
      let employee_id = null;

      // Call function to assign service request to employee
      let modifiedServiceRequest = await modifyStatus(
        service_request_id,
        current_status,
        outcome_status,
        employee_id
      );
      if (!modifiedServiceRequest) {
        showAlert("error", "Failed to modify the service request Status");
      } else {
        // showAlert("success", "Service request assigned successfully!");
        // Call function to create manager-Activity of assigning
        let managerActivity = await createEmployeeActivity(
          managerApprovalActivityData
        );
        // Create assign/submit activity for employee
        let employeeSubmitActivity = await createEmployeeActivity(
          employeeSubmitActivityData
        );
        // Complete repair activity
        let updatedRepairActivity = await updateActivityStatus(
          currentActivityId
        );
        if (
          !managerActivity ||
          !employeeSubmitActivity ||
          !updatedRepairActivity
        ) {
          showAlert("error", "Failed to submit the service request!");
        } else {
          showAlert(
            "success",
            "Service request submitted for approval successfully!"
          );
          document.getElementById("orderId").value = "";
          closeOverlay();
          setTimeout(() => {
            location.reload();
          }, 5000);
        }
      }
    });
  }
};
