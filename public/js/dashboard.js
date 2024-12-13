import { showAlert } from "./alert.js";

const getQuotationFormContainer = document.getElementById("get-quotation-form");
const newRequestButton = document.getElementById("newRequestButton");

// Get all repairs
async function fetchAllRepairs() {
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
}

// Get all stores
async function fetchAllStores() {
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
}

// Function to get the specific repair based on selections
function getRepairDetails(repairData, deviceType, modelName, repairName) {
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
        // Return the found repair
        return {
          device_type: device.device_type,
          model_name: model.model_name,
          repair: repair,
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
}

if (getQuotationFormContainer) {
  newRequestButton.addEventListener("click", () => {
    getQuotationFormContainer.classList.toggle("hidden");
  });

  const getQuotationForm = document.getElementById("getQuotationForm");
  const quotationDisplay = document.getElementById("quotation-display");
  const placeOrderButton = document.getElementById("placeOrderButton");
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
      const stores = await fetchAllStores();

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
        repairDetails.repair.repair_name;
      document.getElementById("quote-defectiveParts").textContent =
        repairDetails.repair.defective_parts.join(", ");
      document.getElementById(
        "quote-price"
      ).textContent = `$${repairDetails.repair["associated_price"]}`;
      document.getElementById(
        "quote-estimatedTime"
      ).textContent = `${repairDetails.repair["estimated_time"]} hours`;
    }

    // If all inputs are selected, submit the form
    // getQuotationForm.submit();
  });
}
