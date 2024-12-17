import { showAlert } from "./alert.js";
import {
  isValidOrderId,
  loadServiceRequestDetails,
  fetchStoreReportData,
} from "./asyncFunctions.js";

// DOM elements
const storeManagerMain = document.getElementById("store-manager-main");

if (storeManagerMain) {
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
