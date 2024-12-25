import { showAlert } from "./alert.js";
import {
  isValidOrderId,
  loadServiceRequestDetails,
  fetchReportData,
  fetchAllStores,
  changeStoreManager,
  removeEmployeeFromStore,
  addEmployeetoStore,
  searchUserByEmail,
  updateUserRole,
  validateEmail,
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
