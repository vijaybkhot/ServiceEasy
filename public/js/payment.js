import { showAlert } from "./alert.js";
const paymentContainer = document.getElementById("payment-container");

async function createServiceRequest(data) {
  try {
    const response = await axios.post("/api/service-request/", data);
    if (response.status === 200) {
      return response.data.serviceRequest;
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
        repair_details: {
          device_type: document.getElementById("deviceType").value,
          model_name: document.getElementById("modelName").value,
          estimated_time: +document.getElementById("estimatedTime").value,
          repair_name: document.getElementById("repairName").value,
          defective_parts: document.getElementById("defectiveParts").value,
        },
        payment: {
          isPaid: true,
          amount: +document.getElementById("associatedPrice").value,
          payment_mode: document.getElementById("paymentMode").value,
          payment_date: Date.now(),
        },
      };
      let serviceRequest = await createServiceRequest(serviceRequestDetails);
      if (serviceRequest) {
        console.log(serviceRequest);
      }
    });
  } else {
    console.error("paymentForm not found");
  }
} else {
  console.error("paymentContainer not found");
}
