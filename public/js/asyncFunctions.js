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
    console.log("Employee Details:", response.data);
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

//  function to modify status route
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

    console.log("Status updated successfully:", response.data);
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
    console.log("Employee Activity Created:", response.data);
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

// Check if valid id
export const isValidOrderId = (orderId) => /^[a-f\d]{24}$/i.test(orderId);

// Load service request details
export const loadServiceRequestDetails = async function (orderId, user) {
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

    // Get employee details for the store
    let employees = await getEmployeeDetails(store_id);

    // Populate the overlay with service request details and employees
    populateServiceRequestOverlay(serviceRequest, employees, user);
  } catch (error) {
    // Handle error fetching the service request
    showAlert("error", "There was an error fetching the service request.");
  }
};

// Populate Service request for manager
export const populateServiceRequestOverlay = function (
  serviceRequest,
  employees,
  user
) {
  const detailsContainer = document.getElementById("service-request-details");
  let employeeSelectHTML = "";
  let assignButtonHTML = "";

  // Conditionally add select input and assign button if status is "Waiting for drop-off"
  if (serviceRequest.status.toLowerCase() === "waiting for drop-off") {
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
    ${employeeSelectHTML}
    ${assignButtonHTML}
    <button id="closeOverlayBtn">Close</button>

  `;

  // Show the overlay
  const closeOverlayButton = document.getElementById("closeOverlayBtn");
  const overlay = document.getElementById("service-request-overlay");
  const assignEmployeeBtn = document.getElementById("assignEmployeeBtn");
  const employeeSelect = document.getElementById("employeeSelect");

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

      console.log(serviceRequest._id);
      console.log(selectedEmployeeId);
      showAlert("info", "Correct selection");

      // Details to create employeeActivity
      let activityData;
      if (document.getElementById("assignmentComment").value.trim() !== "") {
        let comment = document.getElementById("assignmentComment").value.trim();
        assignmentComment = {
          date: new Date(),
          comment: comment,
        };
        activityData = {
          service_request_id: serviceRequest._id,
          activity_type: "assign/submit",
          processing_employee_id: user.id,
          assigned_by: serviceRequest.customer_id._id,
          assigned_to: selectedEmployeeId,
          comments: assignmentComment,
          status: "completed",
        };
      } else {
        activityData = {
          service_request_id: serviceRequest._id,
          activity_type: "assign/submit",
          processing_employee_id: user.id,
          assigned_by: serviceRequest.customer_id._id,
          assigned_to: selectedEmployeeId,
          status: "completed",
        };
      }

      console.log(activityData);

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
        showAlert("success", "Service request assigned successfully!");
        // Call function to create employee-Activity
        let employeeActivity = await createEmployeeActivity(activityData);
        if (!employeeActivity) {
          showAlert("error", "Failed to modify the service request Status");
        } else {
          showAlert("success", "Service request assigned successfully!");
          document.getElementById("orderId").value = "";
          closeOverlay();
          location.reload();
        }
      }
    });
  }
};
