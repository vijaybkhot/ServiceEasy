import { showAlert } from "./alert.js";
import { isValidOrderId, loadServiceRequestDetails } from "./asyncFunctions.js";

const employeeMain = document.getElementById("employee-main");

if (employeeMain) {
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
