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

// Populate Service request for manager
export const populateServiceRequestOverlay = function (
  serviceRequest,
  employees
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
              `<option value="${employee._id}">${employee.name}</option>`
          )
          .join("")}
      </select>
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
  <button id="manageRequestBtn">Manage This Request</button>
  <button id="closeOverlayBtn">Close</button>
   `;

  // Show the overlay
  const closeOverlayButton = document.getElementById("closeOverlayBtn");
  const overlay = document.getElementById("service-request-overlay");
  const manageRequestBtn = document.getElementById("manageRequestBtn");
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
    assignEmployeeBtn.addEventListener("click", function () {
      const selectedEmployeeId = employeeSelect.value;

      if (!selectedEmployeeId) {
        showAlert(
          "warning",
          "Please select an employee to assign this service request."
        );
        return;
      }

      // Call function to assign employee (could be an API call)
      assignServiceRequestToEmployee(serviceRequest._id, selectedEmployeeId);
    });
  }
};
