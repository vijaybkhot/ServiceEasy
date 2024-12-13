import { showAlert } from "./alert.js";
const paymentContainer = document.getElementById("payment-container");

async function createServiceRequest(data) {
  try {
    const response = await axios.post("/api/service-request/", data);
    if (response.status === 200) {
      showAlert("success", "Order placed successfully!");
      window.location.href = "/";
    } else {
      // Handle unexpected response
      showAlert("error", `Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error creating service request:", error);
    showAlert("error", `Error creating service request: ${error.message}`);
  }
}

if (paymentContainer) {
  const confirmPaymentButton = document.getElementById("confirmPaymentButton");
  if (confirmPaymentButton) {
    confirmPaymentButton.addEventListener("click", async (event) => {
      event.preventDefault();

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
        repair_id: document.getElementById("repairId").value,
        payment: {
          isPaid: true,
          amount: +document.getElementById("associatedPrice").value,
          payment_mode: document.getElementById("paymentMode").value,
          payment_date: Date.now(),
        },
      };
      let order = await createServiceRequest(serviceRequestDetails);
      if (order) {
      }
    });
  } else {
    console.error("paymentForm not found");
  }
} else {
  console.error("paymentContainer not found");
}
