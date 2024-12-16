import { showAlert } from "./alert.js";
import {
  isValidOrderId,
  loadServiceRequestDetails,
  fetchReportData,
  fetchAllStores,
  changeStoreManager,
} from "./asyncFunctions.js";

// DOM elements
const adminMain = document.getElementById("admin-main");

if (adminMain) {
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

  //  Doms for select input
  const storeSelect = document.getElementById("storeSelect");

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

  // Generate Reports
  fetchReportData();

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

  // Event Listner for generate reports button
  //   generateReportsBtn.addEventListener("click", async () => {
  //     if (storeReport.classList.contains("hidden")) {
  //       inProgressRequests.classList.add("hidden");
  //       completedRequests.classList.add("hidden");
  //       storeReport.classList.remove("hidden");
  //       setTimeout(() => {
  //         storeReport.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       }, 50);
  //     } else {
  //       storeReport.classList.add("hidden");
  //     }
  //   });

  //   // Event Listner for View Completed Service Requests Button
  //   completedServiceRequestsBtn.addEventListener("click", () => {
  //     if (completedRequests.classList.contains("hidden")) {
  //       inProgressRequests.classList.add("hidden");
  //       storeReport.classList.add("hidden");
  //       completedRequests.classList.remove("hidden");
  //       setTimeout(() => {
  //         completedRequests.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       }, 50);
  //     } else {
  //       completedRequests.classList.add("hidden");
  //     }
  //   });

  //   inProgressServiceRequestsBtn.addEventListener("click", () => {
  //     if (inProgressRequests.classList.contains("hidden")) {
  //       inProgressRequests.classList.remove("hidden");
  //       completedRequests.classList.add("hidden");
  //       storeReport.classList.add("hidden");
  //       setTimeout(() => {
  //         inProgressRequests.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       }, 50);
  //     } else {
  //       inProgressRequests.classList.add("hidden");
  //     }
  //   });

  //   // Handle changing store managers
  //   changeStoreManagerBtn.addEventListener("click", () => {
  //     if (changeStoreManagerSection.classList.contains("hidden")) {
  //       changeStoreManagerSection.classList.remove("hidden");
  //       inProgressRequests.classList.add("hidden");
  //       completedRequests.classList.add("hidden");
  //       storeReport.classList.add("hidden");
  //       setTimeout(() => {
  //         changeStoreManagerSection.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       }, 50);
  //     } else {
  //       changeStoreManagerSection.classList.add("hidden");
  //     }
  //   });

  const sections = {
    storeReport,
    completedRequests,
    inProgressRequests,
    changeStoreManagerSection,
    manageEmployeesSection,
  };

  const buttons = {
    generateReportsBtn,
    completedServiceRequestsBtn,
    inProgressServiceRequestsBtn,
    changeStoreManagerBtn,
    employeeManagementBtn,
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
      }
    });
  });

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
      }
      const confirmation = window.confirm(
        "Are you sure you want to assign this manager to the store?"
      );
      if (!confirmation) return;
      // Call function to change manager
      let managerChange = await changeStoreManager(storeId, newManager);
      if (managerChange) {
        showAlert("success", "Manager change successful.");
      } else {
        showAlert("error", "Failed to change manager.");
        setTimeout(() => {
          location.reload();
        }, 3000);
      }
    });
  });
}
