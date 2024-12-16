import { showAlert } from "./alert.js";
import Stripe from "stripe";
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

async function getClientSecret(data) {
  try {
    const response = await axios.post("/api/service-request/process-payment", data);
    if (response.status === 200) {
      return response.data.clientSecret;
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
  const cardElement = document.getElementById("card-element");

  const stripe = Stripe(process.env.PUBLIC_KEY);
  const elements = stripe.elements();

  const card = elements.create('card', {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '16px',
        '::placeholder': { color: '#aab7c4' },
      },
      invalid: { color: '#fa755a' },
    },
  });
  
  card.mount(cardElement);

  if (confirmPaymentButton) {
    confirmPaymentButton.addEventListener("click", async (event) => {
      event.preventDefault();

      const paymentObj = {
        amount: +document.getElementById("associatedPrice").value,
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value
      };

      const clientSecret = await getClientSecret(paymentObj);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if(error) {
        return showAlert("error", `Error making payment`);
      }
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
