import { showAlert } from "./alert.js";
import {
  isValidOrderId,
  loadServiceRequestDetails,
  fetchReportData,
} from "./asyncFunctions.js";

// DOM elements
const adminMain = document.getElementById("admin-main");

if (adminMain) {
  const user = JSON.parse(document.getElementById("user-data").dataset.user);
  document.getElementById("user-data").remove();
  const storeData = document.getElementById("store-data");
  const storeId = storeData.dataset.storeId;
  const findButton = document.getElementById("findButton");
  const buttons = document.querySelectorAll(".view-details-btn");

  fetchReportData();

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
