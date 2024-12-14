import { showAlert } from "./alert.js";
import {
  fetchServiceRequestById,
  formatDateWithOrdinalSuffix,
  isValidOrderId,
  populateServiceRequestOverlay,
} from "./asyncFunctions.js";

// DOM elements
const storeManagerMain = document.getElementById("store-manager-main");

if (storeManagerMain) {
  const findButton = document.getElementById("findButton");

  // Attach a click event listener to the Find button
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
    try {
      let serviceRequest = await fetchServiceRequestById(orderId);
      if (!serviceRequest) {
        alert("No service request found for this Order ID.");
        return;
      }
      populateServiceRequestOverlay(serviceRequest);
    } catch (error) {
      showAlert("error", "There was an error fetching the service request.");
    }
  });
}
