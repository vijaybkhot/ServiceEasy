import { showAlert } from "./alert.js";
import {
  isValidOrderId,
  loadServiceRequestDetails,
  fetchReportData,
  fetchAllStores,
  changeStoreManager,
  removeEmployeeFromStore,
  addEmployeetoStore,
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

  // Handle view of all sections on the page
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
      }
      const confirmation = window.confirm(
        "Are you sure you want to assign this manager to the store?"
      );
      if (!confirmation) return;
      // Call function to change manager
      let managerChange = await changeStoreManager(storeId, newManager);
      managerSelect.selectedIndex = 0;
      storeSelect.selectedIndex = 0;
      if (managerChange) {
        showAlert("success", "Manager change successful.");
      } else {
        showAlert("error", "Failed to change manager.");
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
        }
        if (!employeeRemove) {
          currentEmployeesSelect.selectedIndex = 0;
          storeSelectEmployees.selectedIndex = 0;
          unassignedEmployeesSelect.selectedIndex = 0;
        }
      } catch (error) {
        console.error("Error removing employee:", error);
        showAlert("error", error.message);
        currentEmployeesSelect.selectedIndex = 0;
        storeSelectEmployees.selectedIndex = 0;
        unassignedEmployeesSelect.selectedIndex = 0;
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
        } else {
          currentEmployeesSelect.selectedIndex = 0;
          storeSelectEmployees.selectedIndex = 0;
          unassignedEmployeesSelect.selectedIndex = 0;
        }
      } catch (error) {
        console.error("Error adding employee:", error);
        showAlert("error", "Failed to add employee. Please try again.");
      }
    });
  });
}
