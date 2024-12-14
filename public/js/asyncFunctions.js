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
