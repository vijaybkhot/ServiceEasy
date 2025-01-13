import { showAlert } from "./alert.js";
import {
  fetchAllRepairs,
  fetchAllStores,
  getUserData,
  getRepairDetails,
  getPaymentPage,
  isValidOrderId,
  loadServiceRequestDetails,
  fetchStoreReportData,
  fetchReportData,
  changeStoreManager,
  removeEmployeeFromStore,
  addEmployeetoStore,
  searchUserByEmail,
  updateUserRole,
  validateEmail,
  createServiceRequest,
  getClientSecret,
} from "./asyncFunctions.js";

const allStoresContainer = document.getElementById("all-stores-container");
const storeContainer = document.getElementById("store-container");
const customerDashboard = document.getElementById("customer-dashboard");
const storeManagerDashboard = document.getElementById("store-manager-main");
const employeeDashboard = document.getElementById("employee-main");
const adminDashboard = document.getElementById("admin-main");
const paymentContainer = document.getElementById("payment-container");

if (allStoresContainer) {
  const addStoreButton = document.querySelector(".add-store");
  if (addStoreButton) {
    addStoreButton.addEventListener("click", (event) => {
      window.location.href = "/stores/add";
      event.preventDefault();
      const errors = [];
      const storeName = document.getElementById("store-name").value.trim();
      const storeLongitude = document
        .getElementById("store-longitude")
        .value.trim();
      const storeLatitude = document
        .getElementById("store-latitude")
        .value.trim();
      const storeAddress = document
        .getElementById("store-address")
        .value.trim();
      const storePhone = document.getElementById("store-phone").value.trim();
      const storeManager = document
        .getElementById("store-manager")
        .value.trim();
      const errorContainer = document.getElementById("error-container");

      if (!storeName || !/^[a-zA-Z\s]*$/.test(storeName))
        errors.push(
          "Store name is required and must contain only letters and spaces."
        );
      if (storeLatitude > 90 || storeLatitude < -90)
        errors.push("Latitude must be within -90 and 90!");
      if (storeLongitude > 180 || storeLongitude < -180)
        errors.push("Longitude must be within -180 and 180!");
      if (
        storeAddress.length >= 300 ||
        storeAddress.length < 20 ||
        storeAddress.trim().length === 0
      )
        errors.push("Store Address must be within 20-300 characters!");
      if (!storePhone) errors.push("Phone number must be provided!");
      if (!storeManager) errors.push("Store manager must be provided!");

      errorContainer.innerHTML = "";
      if (errors.length > 0) {
        errors.forEach((error) => {
          const errorElement = document.createElement("p");
          errorElement.textContent = error;
          errorElement.style.color = "red";
          errorContainer.appendChild(errorElement);
        });
      }
    });
  }

  const viewStoreButtons = document.querySelectorAll(".view-store-button");
  viewStoreButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const storeId = button.dataset.storeId; // Get store ID from button's data attribute
      window.location.href = `/stores/${storeId}`; // Redirect to the store's individual page
    });
  });
}

if (storeContainer) {
  const editButton = document.querySelector(".edit-store");
  const saveButton = document.querySelector(".save-changes");
  const cancelButton = document.querySelector(".cancel-edit");
  const deleteButton = document.querySelector(".del-store");

  // Editable fields
  // const nameTag = document.querySelector("#store-name-tag");
  const nameInput = document.querySelector("#store-name-input");
  const addressInput = document.querySelector("#store-address-input");
  const phoneInput = document.querySelector("#store-phone-input");
  const storeId = document.querySelector("#store-id").value;
  const nameSpan = document.querySelector("#store-name");
  const addressSpan = document.querySelector("#store-address");
  const phoneSpan = document.querySelector("#store-phone");

  // Toggle Edit Mode
  // if (editButton) {
  editButton.addEventListener("click", (event) => {
    nameSpan.style.display = "none";
    addressSpan.style.display = "none";
    phoneSpan.style.display = "none";
    document.querySelector("#store-name-label").style.display = "block"; //static name

    nameInput.style.display = "block";
    // nameTag.style.display = "block";
    addressInput.style.display = "block";
    phoneInput.style.display = "block";

    editButton.style.display = "none";
    saveButton.style.display = "inline-block";
    cancelButton.style.display = "inline-block";
  });
  // }

  // Cancel Edit Mode
  // if (cancelButton) {
  cancelButton.addEventListener("click", (event) => {
    nameSpan.style.display = "block";
    addressSpan.style.display = "block";
    phoneSpan.style.display = "block";

    document.querySelector("#store-name-label").style.display = "none";

    nameInput.style.display = "none";
    addressInput.style.display = "none";
    phoneInput.style.display = "none";

    editButton.style.display = "inline-block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    const errorContainer = document.querySelector("#error-container");
    // errorContainer.innerHTML = ""; // Clear existing errors
    if (errorContainer) {
      errorContainer.innerHTML = ""; // Clear existing errors
    } else {
      console.error("Error container not found!");
    }
  });
  // }

  // if (saveButton) {
  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const errors = [];
    const errorContainer = document.querySelector("#error-container");

    const nameValue = nameInput.value.trim();
    const addressValue = addressInput.value.trim();
    const phoneValue = phoneInput.value.trim();
    console.log(nameValue);
    // Validation rules
    if (!nameValue || !/^[a-zA-Z0-9\s\-',.]+$/.test(nameValue)) {
      errors.push(
        "Store name is required and should contain valid characters."
      );
    }
    if (
      addressValue.length < 20 ||
      addressValue.length > 300 ||
      addressValue.trim() === ""
    ) {
      errors.push("Store Address must be between 20-300 characters.");
    }
    if (!phoneValue) {
      errors.push("Phone number should be provided!");
    }

    // Clear and show errors if validation fails
    errorContainer.innerHTML = ""; // Clear existing errors
    if (errors.length > 0) {
      errors.forEach((error) => {
        const errorElement = document.createElement("p");
        errorElement.textContent = error;
        errorElement.style.color = "red";
        errorContainer.appendChild(errorElement);
      });
      return; // Stop execution if there are errors
    }
    const updatedStore = {
      name: nameInput.value,
      address: addressInput.value,
      phone: phoneInput.value,
    };

    // const storeId = "{{store._id}}";

    try {
      const response = await fetch(`/stores/${storeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedStore),
      });

      if (response.ok) {
        nameSpan.textContent = nameInput.value;
        addressSpan.textContent = addressInput.value;
        phoneSpan.textContent = phoneInput.value;

        cancelButton.click();
      } else {
        console.error("Failed to update store");
      }
    } catch (error) {
      console.error("Error updating store:", error);
    }
  });
  // }
  // if (deleteButton) {
  deleteButton.addEventListener("click", async (event) => {
    if (confirm("Are you sure you want to delete this store?")) {
      // const storeId = "{{store._id}}"; // Get the current store's ID
      try {
        const response = await fetch(`/stores/${storeId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("Store deleted successfully!");
          window.location.href = "/stores"; // Redirect to all stores page
        } else {
          console.error("Failed to delete store");
        }
      } catch (error) {
        console.error("Error deleting store:", error);
      }
    }
  });
}

if (customerDashboard) {
  const getQuotationFormContainer =
    document.getElementById("get-quotation-form");
  const newRequestButton = document.getElementById("newRequestButton");

  const completedRequestSection = document.getElementById("completed-requests");
  const inProgressRequestSection = document.getElementById(
    "in-progress-requests"
  );
  const completedServiceRequestsBtn = document.getElementById(
    "completedServiceRequestsBtn"
  );
  const inProgressServiceRequestsBtn = document.getElementById(
    "inProgressServiceRequestsBtn"
  );

  const sections = {
    completedRequestSection,
    inProgressRequestSection,
  };

  const showButtons = {
    completedServiceRequestsBtn,
    inProgressServiceRequestsBtn,
  };

  const toggleSectionVisibility = (sectionToShow) => {
    Object.values(sections).forEach((section) =>
      section.classList.add("hidden")
    );

    sectionToShow.classList.remove("hidden");

    setTimeout(() => {
      sectionToShow.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // Add event listeners to buttons
  Object.keys(showButtons).forEach((buttonKey) => {
    showButtons[buttonKey].addEventListener("click", (event) => {
      const clickedButton = event.target;

      if (clickedButton === completedServiceRequestsBtn) {
        toggleSectionVisibility(completedRequestSection);
      } else if (clickedButton === inProgressServiceRequestsBtn) {
        toggleSectionVisibility(inProgressRequestSection);
      }
    });
  });

  // Functions to handle feedback
  // Function using axios to add/modify feedback to a service request
  async function addFeedback(serviceRequestId, rating, comment = "") {
    try {
      // Validate inputs before sending the request
      if (!serviceRequestId) {
        throw new Error("Service Request ID is required.");
      }
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new Error("Rating must be a number between 1 and 5.");
      }

      const feedbackData = {
        feedback: {
          rating,
          comment,
        },
      };

      const response = await axios.put(
        `http://localhost:3000/api/service-request/feedback/${serviceRequestId}`,
        feedbackData
      );

      console.log("Feedback submitted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error submitting feedback:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Update the completed request row with new feedback
  function updateTableRow(orderId, rating, reviewComment) {
    const row = document
      .querySelector(`.feedback-btn[data-order-id="${orderId}"]`)
      .closest("tr");
    row.querySelector("td:nth-child(7)").textContent = rating;
    row.querySelector("td:nth-child(8)").textContent = reviewComment;
  }

  if (getQuotationFormContainer) {
    const user = JSON.parse(document.getElementById("user-data").dataset.user);
    document.getElementById("user-data").remove();
    // Toggle hide/show Get Quotation form
    newRequestButton.addEventListener("click", () => {
      getQuotationFormContainer.classList.toggle("hidden");
    });

    const getQuotationForm = document.getElementById("getQuotationForm");
    const quotationDisplay = document.getElementById("quotation-display");
    const checkoutButton = document.getElementById("checkoutButton");
    const deviceTypeSelect = document.getElementById("deviceType");
    const deviceModelSelect = document.getElementById("deviceModel");
    const repairTypeSelect = document.getElementById("repairType");

    let repairs = await fetchAllRepairs();
    const deviceTypes = repairs.map((repair) => repair.device_type);
    const deviceModels = repairs.map((repair) => ({
      deviceType: repair.device_type,
      models: repair.models.map((model) => ({
        modelName: model.model_name,
        repairTypes: model.repair_types || [], // Assuming repair types are within each model
      })),
    }));

    // Populate Device types
    deviceTypes.forEach((deviceType) => {
      const option = document.createElement("option");
      option.value = deviceType;
      option.textContent = deviceType;
      deviceTypeSelect.appendChild(option);
    });

    deviceTypeSelect.selectedIndex = 0;

    // Function to populate device models based on selected device type
    function populateDeviceModels(selectedDeviceType) {
      // Clear previous options
      deviceModelSelect.innerHTML =
        '<option value="" disabled selected>Select a model</option>';

      if (!selectedDeviceType) {
        return;
      }

      // Find the models for the selected device type
      const selectedDevice = deviceModels.find(
        (device) => device.deviceType === selectedDeviceType
      );

      if (selectedDevice) {
        selectedDevice.models.forEach((model) => {
          const option = document.createElement("option");
          option.value = model.modelName;
          option.textContent = model.modelName;
          deviceModelSelect.appendChild(option);
        });
      }
    }

    // Function to populate repair types based on selected device type and model
    function populateRepairTypes(selectedDeviceType, selectedModelName) {
      // Clear previous repair types
      repairTypeSelect.innerHTML =
        '<option value="" disabled selected>Select a repair type</option>';

      if (!selectedDeviceType || !selectedModelName) return;

      // Find the selected device and model
      const selectedDevice = deviceModels.find(
        (device) => device.deviceType === selectedDeviceType
      );

      if (selectedDevice) {
        const selectedModel = selectedDevice.models.find(
          (model) => model.modelName === selectedModelName
        );

        if (selectedModel) {
          // Populate repair types for the selected model
          selectedModel.repairTypes.forEach((repairType) => {
            const option = document.createElement("option");
            option.value = repairType.repair_name;
            option.textContent = repairType.repair_name;
            repairTypeSelect.appendChild(option);
          });
        }
      }
    }

    // Event listener for when the device type is selected
    deviceTypeSelect.addEventListener("change", (event) => {
      const selectedDeviceType = event.target.value;

      // Populate device models based on selected device type
      populateDeviceModels(selectedDeviceType);

      // Reset repair type select when device type changes
      repairTypeSelect.innerHTML =
        '<option value="" disabled selected>Select a repair type</option>';
    });

    // Event listener for when the device model is selected
    deviceModelSelect.addEventListener("change", (event) => {
      const selectedDeviceType = deviceTypeSelect.value;
      const selectedModelName = event.target.value;

      // If no device type is selected, show alert
      if (!selectedDeviceType) {
        showAlert("error", "Please select a device type first.");
        return;
      }

      // Populate repair types based on selected device type and model
      populateRepairTypes(selectedDeviceType, selectedModelName);
    });

    deviceTypeSelect.selectedIndex = 0;
    deviceModelSelect.selectedIndex = 0;
    repairTypeSelect.selectedIndex = 0;

    // Event listener for form submission
    getQuotationForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const selectedDeviceType = deviceTypeSelect.value;
      const selectedDeviceModel = deviceModelSelect.value;
      const selectedRepairType = repairTypeSelect.value;

      // Check if all required inputs are selected
      if (!selectedDeviceType) {
        showAlert("info", "Please select a device type.");
        return;
      }
      if (!selectedDeviceModel) {
        showAlert("info", "Please select a device model.");
        return;
      }
      if (!selectedRepairType) {
        showAlert("info", "Please select a repair type.");
        return;
      }

      let repairDetails = getRepairDetails(
        repairs,
        selectedDeviceType,
        selectedDeviceModel,
        selectedRepairType
      );

      // Display quotation form
      if (repairDetails) {
        const storeSelect = document.getElementById("storeSelect");
        const storeData = await fetchAllStores();
        const stores = storeData.stores;

        storeSelect.innerHTML = "";

        // Add a default empty option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Store";
        storeSelect.appendChild(defaultOption);

        // Populate the dropdown with store options
        stores.forEach((store) => {
          const option = document.createElement("option");
          option.value = store._id;
          option.textContent = store.name;
          storeSelect.appendChild(option);
        });

        getQuotationFormContainer.classList.add("hidden");
        quotationDisplay.classList.remove("hidden");

        document.getElementById("quote-deviceType").textContent =
          repairDetails.device_type;
        document.getElementById("quote-deviceModel").textContent =
          repairDetails.model_name;
        document.getElementById("quote-repairName").textContent =
          repairDetails.repair_name;
        document.getElementById("quote-defectiveParts").textContent =
          repairDetails.defective_parts.join(", ");
        document.getElementById(
          "quote-price"
        ).textContent = `$${repairDetails.associated_price}`;
        document.getElementById("quote-estimatedTime").textContent = `${
          repairDetails.estimated_time
        } ${repairDetails.estimated_time > 1 ? "days" : "day"}`;

        // Checkout button event listner - get payment page
        checkoutButton.addEventListener("click", async (event) => {
          event.preventDefault();
          // Check if a store is selected
          const storeSelect = document.getElementById("storeSelect");
          const selectedStoreOption = storeSelect.value;
          const selectedStoreText =
            storeSelect.options[storeSelect.selectedIndex].text;

          if (!selectedStoreOption || selectedStoreOption === "") {
            showAlert("info", "Please select a store.");
            return;
          }

          // Get the store_id and store name
          const store_id = selectedStoreOption;
          const store = selectedStoreText;

          // Fetch user data
          let user = await getUserData();

          const paymentData = await getPaymentPage({
            device_type: repairDetails.device_type,
            model_name: repairDetails.model_name,
            repair_id: repairDetails.repair_id,
            repair_name: repairDetails.repair_name,
            associated_price: +repairDetails.associated_price,
            estimated_time: +repairDetails.estimated_time,
            defective_parts: repairDetails.defective_parts,
            customer: user.id,
            store_id: store_id,
            store: store,
          });

          if (paymentData) {
            window.location.href = `http://localhost:3000/dashboard/payment?device_type=${encodeURIComponent(
              repairDetails.device_type
            )}&model_name=${encodeURIComponent(
              repairDetails.model_name
            )}&repair_id=${
              repairDetails.repair_id
            }&repair_name=${encodeURIComponent(
              repairDetails.repair_name
            )}&associated_price=${
              repairDetails.associated_price
            }&estimated_time=${
              repairDetails.estimated_time
            }&defective_parts=${encodeURIComponent(
              repairDetails.defective_parts
            )}&customer=${
              user.id
            }&store_id=${store_id}&store=${encodeURIComponent(
              selectedStoreText
            )}`;
          } else {
            showAlert("error", "Failed to fetch payment data.");
          }
        });
      }
    });

    // Handle Feedback button
    const feedbackOverlay = document.getElementById("feedback-overlay");
    const feedbackRating = document.getElementById("feedback-rating");
    const feedbackComment = document.getElementById("feedback-comment");
    const submitFeedbackBtn = document.getElementById("submit-feedback-btn");
    const closeFeedbackOverlayBtn = document.getElementById(
      "close-feedback-overlay-btn"
    );
    let currentOrderId = null;
    document.getElementById("completed-body").addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("feedback-btn")) {
        currentOrderId = e.target.getAttribute("data-order-id");
        openFeedbackOverlay();
      }
    });
    // Open the feedback overlay
    function openFeedbackOverlay() {
      feedbackRating.value = ""; // Clear the previous rating
      feedbackComment.value = ""; // Clear the previous comment
      feedbackOverlay.classList.remove("hidden");
    }

    // Close the feedback overlay
    closeFeedbackOverlayBtn.addEventListener("click", () => {
      feedbackOverlay.classList.add("hidden");
    });

    // Handle submit feedback
    submitFeedbackBtn.addEventListener("click", async () => {
      const rating = parseInt(feedbackRating.value);
      const reviewComment = feedbackComment.value.trim();
      console.log("rating", typeof rating);

      if (!rating) {
        showAlert("warning", "Please select a rating.");
        return;
      }
      await submitFeedback(currentOrderId, rating, reviewComment);
    });
    // Function to submit feedback
    async function submitFeedback(currentOrderId, rating, reviewComment) {
      try {
        const response = await addFeedback(
          currentOrderId,
          rating,
          reviewComment
        );

        showAlert("success", "Feedback submitted successfully.");
        feedbackOverlay.classList.add("hidden");
        updateTableRow(currentOrderId, rating, reviewComment);
      } catch (error) {
        showAlert(
          "error",
          "An error occurred: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  }
}

if (storeManagerDashboard) {
  const user = JSON.parse(document.getElementById("user-data").dataset.user);
  document.getElementById("user-data").remove();
  const storeData = document.getElementById("store-data");
  const storeId = storeData.dataset.storeId;

  // Section DOM elements
  const completedRequestSection = document.getElementById("completed-requests");
  const inProgressRequestSection = document.getElementById(
    "in-progress-requests"
  );
  const storeReportSection = document.getElementById("store-manager-report");
  const pendingRequestSection = document.getElementById("pending-requests");

  // Button DOM elements
  const findButton = document.getElementById("findButton");
  const buttons = document.querySelectorAll(".view-details-btn");
  const generateReportsBtn = document.getElementById("generateReportsBtn");
  const completedServiceRequestsBtn = document.getElementById(
    "completedServiceRequestsBtn"
  );
  const inProgressServiceRequestsBtn = document.getElementById(
    "inProgressServiceRequestsBtn"
  );
  const pendingServiceRequestsBtn = document.getElementById(
    "pendingServiceRequestsBtn"
  );

  // Handle views of all pages
  // Handle view of all sections on the page
  const sections = {
    storeReportSection,
    completedRequestSection,
    inProgressRequestSection,
    pendingRequestSection,
  };

  const showButtons = {
    generateReportsBtn,
    completedServiceRequestsBtn,
    inProgressServiceRequestsBtn,
    pendingServiceRequestsBtn,
  };

  const toggleSectionVisibility = (sectionToShow) => {
    // Hide all sections
    Object.values(sections).forEach((section) =>
      section.classList.add("hidden")
    );

    // Show the selected section
    sectionToShow.classList.remove("hidden");

    // Scroll to the section smoothly
    setTimeout(() => {
      sectionToShow.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // Add event listeners to buttons
  Object.keys(showButtons).forEach((buttonKey) => {
    showButtons[buttonKey].addEventListener("click", (event) => {
      const clickedButton = event.target;

      if (clickedButton === generateReportsBtn) {
        toggleSectionVisibility(storeReportSection);
      } else if (clickedButton === completedServiceRequestsBtn) {
        toggleSectionVisibility(completedRequestSection);
      } else if (clickedButton === inProgressServiceRequestsBtn) {
        toggleSectionVisibility(inProgressRequestSection);
      } else if (clickedButton === pendingServiceRequestsBtn) {
        toggleSectionVisibility(pendingRequestSection);
      }
    });
  });

  // Generate report for store
  window.onload = async function () {
    await fetchStoreReportData(storeId);
  };

  // Event listners for the view details buttons
  buttons.forEach((button) => {
    button.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-order-id");

      if (!isValidOrderId(orderId)) {
        showAlert("error", "Invalid Order ID. Something wrong with the order.");
        return;
      }
      await loadServiceRequestDetails(orderId, user, storeId);
    });
  });

  // event listener for the Find button
  findButton.addEventListener("click", async () => {
    const orderId = document.getElementById("orderId").value.trim();

    if (!orderId) {
      showAlert("error", "Please enter an Order ID.");
      return;
    }
    if (!isValidOrderId(orderId)) {
      showAlert(
        "error",
        "Invalid Order ID format. Please enter a valid 24-character hex string."
      );
      return;
    }
    await loadServiceRequestDetails(orderId, user, storeId);
  });
}

if (employeeDashboard) {
  const user = JSON.parse(document.getElementById("user-data").dataset.user);
  document.getElementById("user-data").remove();
  const storeData = document.getElementById("store-data");
  const storeId = storeData.dataset.storeId;
  const findButton = document.getElementById("findButton");
  const buttons = document.querySelectorAll(".view-details-btn");

  const completedRequestSection = document.getElementById("completed-requests");
  const pendingRequestSection = document.getElementById("pending-requests");
  const completedServiceRequestsBtn = document.getElementById(
    "completedServiceRequestsBtn"
  );
  const pendingServiceRequestsBtn = document.getElementById(
    "pendingServiceRequestsBtn"
  );

  const sections = {
    completedRequestSection,
    pendingRequestSection,
  };

  const showButtons = {
    completedServiceRequestsBtn,
    pendingServiceRequestsBtn,
  };

  const toggleSectionVisibility = (sectionToShow) => {
    Object.values(sections).forEach((section) =>
      section.classList.add("hidden")
    );

    sectionToShow.classList.remove("hidden");

    setTimeout(() => {
      sectionToShow.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // Add event listeners to buttons
  Object.keys(showButtons).forEach((buttonKey) => {
    showButtons[buttonKey].addEventListener("click", (event) => {
      const clickedButton = event.target;

      if (clickedButton === completedServiceRequestsBtn) {
        toggleSectionVisibility(completedRequestSection);
      } else if (clickedButton === pendingServiceRequestsBtn) {
        toggleSectionVisibility(pendingRequestSection);
      }
    });
  });

  // Event listners for the view details buttons
  buttons.forEach((button) => {
    button.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-order-id");

      if (!isValidOrderId(orderId)) {
        showAlert("error", "Invalid Order ID. Something wrong with the order.");
        return;
      }
      await loadServiceRequestDetails(orderId, user, storeId);
    });
  });

  // event listener for the Find button
  findButton.addEventListener("click", async () => {
    const orderId = document.getElementById("orderId").value.trim();

    if (!orderId) {
      showAlert("error", "Please enter an Order ID.");
      return;
    }
    if (!isValidOrderId(orderId)) {
      showAlert(
        "error",
        "Invalid Order ID format. Please enter a valid 24-character hex string."
      );
      return;
    }
    await loadServiceRequestDetails(orderId, user, storeId);
  });
}

if (adminDashboard) {
  const user = JSON.parse(document.getElementById("user-data").dataset.user);
  document.getElementById("user-data").remove();
  const storeData = document.getElementById("store-data");
  const storeId = storeData.dataset.storeId;

  // Section Doms
  const completedRequests = document.getElementById("completed-requests");
  const inProgressRequests = document.getElementById("in-progress-requests");
  const storeReport = document.getElementById("store-report");
  const changeStoreManagerSection = document.getElementById(
    "change-store-manager"
  );
  const manageEmployeesSection = document.getElementById(
    "manage-store-employees"
  );
  const manageUserRolesSection = document.getElementById("manage-user-roles");

  //  Doms for select input
  const storeSelect = document.getElementById("storeSelect");
  const storeSelectEmployees = document.getElementById("storeSelectEmployees");

  // Buttons
  const findButton = document.getElementById("findButton");
  const viewDetailsbtns = document.querySelectorAll(".view-details-btn");
  const generateReportsBtn = document.getElementById("generateReportsBtn");
  const completedServiceRequestsBtn = document.getElementById(
    "completedServiceRequestsBtn"
  );
  const inProgressServiceRequestsBtn = document.getElementById(
    "inProgressServiceRequestsBtn"
  );
  const changeStoreManagerBtn = document.getElementById(
    "changeStoreManagerBtn"
  );
  const employeeManagementBtn = document.getElementById(
    "employeeManagementBtn"
  );
  const manageUserRoleBtn = document.getElementById("manageUserRoleBtn");
  const searchUserBtn = document.getElementById("searchUserBtn");

  // Generate Reports
  await fetchReportData();

  // Event listners for the view details viewDetailsbtns
  viewDetailsbtns.forEach((button) => {
    button.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-order-id");

      if (!isValidOrderId(orderId)) {
        showAlert("error", "Invalid Order ID. Something wrong with the order.");
        return;
      }
      await loadServiceRequestDetails(orderId, user, storeId);
    });
  });

  // event listener for the Find button
  findButton.addEventListener("click", async () => {
    const orderId = document.getElementById("orderId").value.trim();

    if (!orderId) {
      showAlert("error", "Please enter an Order ID.");
      return;
    }
    if (!isValidOrderId(orderId)) {
      showAlert(
        "error",
        "Invalid Order ID format. Please enter a valid 24-character hex string."
      );
      return;
    }
    await loadServiceRequestDetails(orderId, user, storeId);
  });

  // Handle view of all sections on the page
  const sections = {
    storeReport,
    completedRequests,
    inProgressRequests,
    changeStoreManagerSection,
    manageEmployeesSection,
    manageUserRolesSection,
  };

  const buttons = {
    generateReportsBtn,
    completedServiceRequestsBtn,
    inProgressServiceRequestsBtn,
    changeStoreManagerBtn,
    employeeManagementBtn,
    manageUserRoleBtn,
  };

  const toggleSectionVisibility = (sectionToShow) => {
    // Hide all sections
    Object.values(sections).forEach((section) =>
      section.classList.add("hidden")
    );

    // Show the selected section
    sectionToShow.classList.remove("hidden");

    // Scroll to the section smoothly
    setTimeout(() => {
      sectionToShow.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // Add event listeners to buttons
  Object.keys(buttons).forEach((buttonKey) => {
    buttons[buttonKey].addEventListener("click", (event) => {
      const clickedButton = event.target;

      if (clickedButton === generateReportsBtn) {
        toggleSectionVisibility(storeReport);
      } else if (clickedButton === completedServiceRequestsBtn) {
        toggleSectionVisibility(completedRequests);
      } else if (clickedButton === inProgressServiceRequestsBtn) {
        toggleSectionVisibility(inProgressRequests);
      } else if (clickedButton === changeStoreManagerBtn) {
        toggleSectionVisibility(changeStoreManagerSection);
      } else if (clickedButton === employeeManagementBtn) {
        toggleSectionVisibility(manageEmployeesSection);
      } else if (clickedButton === manageUserRoleBtn) {
        toggleSectionVisibility(manageUserRolesSection);
      }
    });
  });

  // Handle events for change store manager section
  storeSelect.addEventListener("change", async function () {
    const storeId = this.value;
    let storesAndManagerData = await fetchAllStores();
    let allStores = storesAndManagerData.stores;
    let managersWithoutStore = storesAndManagerData.managersWithoutStore;

    if (!storeId) {
      showAlert("info", "Please select a store to change view store manager");
    }

    const selectedStore = allStores.find((store) => store._id === storeId);
    const storeManager = selectedStore.storeManager;
    if (!storeManager) {
      showAlert("error", "No Store manager found for the selected store");
    }
    // Select DOM elementss
    const currentStoreManagerContainer = document.getElementById(
      "current-store-manager-container"
    );
    const currentManagerDisplay = document.getElementById(
      "currentStoreManager"
    );
    const newStoreManagerContainer = document.getElementById(
      "new-store-manager-container"
    );
    const managerSelect = document.getElementById("managerSelect");
    const confirmChangeContainer = document.getElementById(
      "confirm-change-container"
    );
    const confirmStoreManagerChangeBtn = document.getElementById(
      "confirmStoreManagerChange"
    );

    currentStoreManagerContainer.classList.remove("hidden");
    currentManagerDisplay.textContent = `${storeManager.name} (${storeManager.email}, ${storeManager.phone})`;
    newStoreManagerContainer.classList.remove("hidden");
    confirmChangeContainer.classList.remove("hidden");
    managerSelect.innerHTML =
      '<option value="" disabled selected>Select a new manager</option>';
    managersWithoutStore.forEach((manager) => {
      const option = document.createElement("option");
      option.value = manager._id;
      option.textContent = manager.name;
      managerSelect.appendChild(option);
    });
    confirmStoreManagerChangeBtn.addEventListener("click", async () => {
      let newManager = managerSelect.value;
      if (!newManager) {
        showAlert(
          "warning",
          "Please select a new manager to assign to the store."
        );
        return;
      }

      // Call function to change manager
      let managerChange = await changeStoreManager(storeId, newManager);
      managerSelect.selectedIndex = 0;
      storeSelect.selectedIndex = 0;
      if (managerChange) {
        showAlert("success", "Manager change successful.");
        setTimeout(() => {
          location.reload();
        }, 3000);
      } else {
        showAlert("error", "Failed to change manager.");
        setTimeout(() => {
          location.reload();
        }, 3000);
      }
    });
  });

  // Handle events for employee management section
  storeSelectEmployees.addEventListener("change", async function () {
    const storeId = this.value;
    let storesAndEmployeeData = await fetchAllStores();
    let allStores = storesAndEmployeeData.stores;
    let unassignedEmployees = storesAndEmployeeData.unassignedEmployees;

    if (!storeId) {
      showAlert(
        "warning",
        "Please select a store to change or view store manager"
      );
      return;
    }

    const currStore = allStores.find((store) => store._id === storeId);
    let currStoreEmployees = currStore.employees;

    const currentEmployeeContainer = document.getElementById(
      "current-employees-container"
    );
    currentEmployeeContainer.classList.remove("hidden");
    const currentEmployeesSelect = document.getElementById(
      "currentEmployeesSelect"
    );
    const removeEmployeeBtn = document.getElementById("removeEmployeeBtn");
    removeEmployeeBtn.classList.remove("hidden");
    const unassignedEmployeesContainer = document.getElementById(
      "unassigned-employees-container"
    );
    unassignedEmployeesContainer.classList.remove("hidden");
    const addEmployeeBtn = document.getElementById("addEmployeeBtn");
    addEmployeeBtn.classList.remove("hidden");
    const unassignedEmployeesSelect = document.getElementById(
      "unassignedEmployeesSelect"
    );
    // Populate the current employees dropdown
    currentEmployeesSelect.innerHTML =
      '<option value="" disabled selected>Select a current employee</option>';
    currStoreEmployees.forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee._id;
      option.textContent = employee.name;
      currentEmployeesSelect.appendChild(option);
    });

    // Populate the unassigned employees dropdown
    unassignedEmployeesSelect.innerHTML =
      '<option value="" disabled selected>Select available employee to add to store</option>';
    unassignedEmployees.forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee._id;
      option.textContent = employee.name;
      unassignedEmployeesSelect.appendChild(option);
    });

    // Handle remove button event
    removeEmployeeBtn.addEventListener("click", async function () {
      let selectedRemoveEmployee = currentEmployeesSelect.value;

      if (!selectedRemoveEmployee || !storeId) {
        showAlert(
          "warning",
          "Please select a store and an employee to remove."
        );
        return;
      }
      try {
        let employeeRemove = await removeEmployeeFromStore(
          storeId,
          selectedRemoveEmployee
        );

        if (employeeRemove) {
          showAlert("success", "Employee removed successfully.");
          currentEmployeesSelect.selectedIndex = 0;
          storeSelectEmployees.selectedIndex = 0;
          unassignedEmployeesSelect.selectedIndex = 0;
          setTimeout(() => {
            location.reload();
          }, 3000);
        }
        if (!employeeRemove) {
          currentEmployeesSelect.selectedIndex = 0;
          storeSelectEmployees.selectedIndex = 0;
          unassignedEmployeesSelect.selectedIndex = 0;
          setTimeout(() => {
            location.reload();
          }, 3000);
        }
      } catch (error) {
        console.error("Error removing employee:", error);
        showAlert("error", error.message);
        currentEmployeesSelect.selectedIndex = 0;
        storeSelectEmployees.selectedIndex = 0;
        unassignedEmployeesSelect.selectedIndex = 0;
        setTimeout(() => {
          location.reload();
        }, 3000);
      }
    });

    // Handle add employee button
    addEmployeeBtn.addEventListener("click", async function () {
      let selectedAddEmployee = unassignedEmployeesSelect.value;
      if (!selectedAddEmployee || !storeId) {
        showAlert("warning", "Please select a store and an employee to add.");
        return;
      }
      console.log(selectedAddEmployee);
      try {
        let employeeAdd = await addEmployeetoStore(
          storeId,
          selectedAddEmployee
        );
        if (employeeAdd) {
          showAlert("success", "Employee added successfully.");
          currentEmployeesSelect.selectedIndex = 0;
          storeSelectEmployees.selectedIndex = 0;
          unassignedEmployeesSelect.selectedIndex = 0;
          setTimeout(() => {
            location.reload();
          }, 3000);
        } else {
          currentEmployeesSelect.selectedIndex = 0;
          storeSelectEmployees.selectedIndex = 0;
          unassignedEmployeesSelect.selectedIndex = 0;
          setTimeout(() => {
            location.reload();
          }, 3000);
        }
      } catch (error) {
        console.error("Error adding employee:", error);
        showAlert("error", "Failed to add employee. Please try again.");
        setTimeout(() => {
          location.reload();
        }, 3000);
      }
    });
  });

  // Manage search button for changing user roles
  searchUserBtn.addEventListener("click", async function () {
    const email = document.getElementById("userEmail").value;
    const resultContainer = document.getElementById("searchResultContainer");
    const userNotFoundMessage = document.getElementById("userNotFoundMessage");
    const userDetails = document.getElementById("userDetails");
    const userRoleSelect = document.getElementById("userRoleSelect");
    const changeRoleBtn = document.getElementById("changeRoleBtn");
    console.log("in admin dashboard", email);

    if (!email) {
      showAlert("error", "Please enter an email!");
      return;
    }

    if (!validateEmail(email)) {
      showAlert("error", "Invalid email format");
      return;
    }

    try {
      const result = await searchUserByEmail(email);
      let user;
      if (result && result.user) {
        user = result.user;
        if (!user) {
          showAlert("error", "User not found");
        }
      } else {
        // Handle when the result is invalid or an error occurs in searchUserByEmail
        showAlert("error", "User not found!!");
      }

      if (user) {
        document.getElementById("userName").textContent = user.name;
        document.getElementById("userEmailDetails").textContent = user.email;
        document.getElementById("userPhone").textContent = user.phone;
        document.getElementById("userRole").textContent = user.role;

        // Show role management section
        resultContainer.classList.remove("hidden");
        userNotFoundMessage.classList.add("hidden");
        userDetails.classList.remove("hidden");
        document
          .getElementById("role-management-container")
          .classList.remove("hidden");

        // Handle change role button
        changeRoleBtn.addEventListener("click", async function () {
          const newRole = userRoleSelect.value;
          let roleUpdate = await updateUserRole(user._id, newRole);
          if (
            roleUpdate &&
            roleUpdate.message === "User role updated successfully"
          ) {
            showAlert("success", "User role updated successfully!");
            document.getElementById("userEmail").textContent = "";
            userRoleSelect.selectedIndex = 0;
            setTimeout(() => {
              location.reload();
            }, 3000);
          } else {
            showAlert("error", "Failed to update user role");
            userRoleSelect.selectedIndex = 0;
          }
        });
      } else {
        // Show message if user not found
        resultContainer.classList.remove("hidden");
        userNotFoundMessage.classList.remove("hidden");
        userDetails.classList.add("hidden");
        document
          .getElementById("role-management-container")
          .classList.add("hidden");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      showAlert("error", error);
    }
  });
}

// Payment Dashboard
if (paymentContainer) {
  const confirmPaymentButton = document.getElementById("confirmPaymentButton");
  const cancelPaymentBUtton = document.getElementById("cancelPaymentButton");

  cancelPaymentBUtton.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/dashboard/customer-dashboard";
  });

  const cardElement = document.getElementById("card-element");
  const stripe = Stripe(
    "pk_test_51QWLC1A9qyCU5Oav4hkg12tcJk13Lc1brMnPGvM2LSjnJO3gk7bTfjTi4vIKFd2wVYUtxy8ylZFcx8EOrTfhbcqb00eMel4IY7"
  );
  const elements = stripe.elements();

  const card = elements.create("card", {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: "16px",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#fa755a" },
    },
  });
  if (cardElement) card.mount(cardElement);

  if (confirmPaymentButton) {
    confirmPaymentButton.addEventListener("click", async (event) => {
      event.preventDefault();

      let paymentMethod = document.getElementById("paymentMode").value;
      if (!paymentMethod) {
        showAlert("warning", "Please select a payment method!");
        return;
      }

      const paymentObj = {
        associatedPrice: +document.getElementById("associatedPrice").value,
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: +document.getElementById("phone").value,
      };

      const clientSecret = await getClientSecret(paymentObj);

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card },
        }
      );
      if (error) {
        return showAlert(
          "error",
          `Error making payment, please make sure all the details are correct`
        );
      }
      //   customer_id,
      //   employee_id = null,
      //   store_id,
      //   repair_id,
      //   status = "waiting for drop-off",
      //   payment,
      //   feedback = {},

      let serviceRequestDetails = {
        customer_id: document.getElementById("customerId").value,
        store_id: document.getElementById("storeId").value,
        repair_details: {
          device_type: document.getElementById("deviceType").value,
          model_name: document.getElementById("modelName").value,
          estimated_time: +document.getElementById("estimatedTime").value,
          repair_name: document.getElementById("repairName").value,
          defective_parts: document.getElementById("defectiveParts").value,
        },
        payment: {
          isPaid: true,
          amount: +document.getElementById("associatedPrice").value,
          payment_mode: document.getElementById("paymentMode").value,
          payment_date: Date.now(),
        },
      };
      let serviceRequest = await createServiceRequest(serviceRequestDetails);
      if (serviceRequest) {
        showAlert("success", "Service Request Created Successfully");
        console.log(serviceRequest);
        setTimeout(() => {
          window.location.href = "/dashboard/customer-dashboard";
        }, 200);
      }
    });
  } else {
    console.error("paymentForm not found");
  }
} else {
  console.error("paymentContainer not found");
}
