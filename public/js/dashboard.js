const serviceRequestForm = document.getElementById("new-service-request-form");
const newRequestButton = document.getElementById("newRequestButton");

if (serviceRequestForm) {
  newRequestButton.addEventListener("click", () => {
    serviceRequestForm.style.display =
      serviceRequestForm.style.display === "none" ? "block" : "none";
  });

  if (serviceRequestForm.style.display === "block") {
    const quotationDisplay = document.getElementById("quotation-display");
    const placeOrderButton = document.getElementById("placeOrderButton");

    serviceRequestForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      // Select all <select> elements in the form
      const selects = serviceRequestForm.querySelectorAll("select");
      let validationFailed = false;

      // Check each select to see if a value is selected
      selects.forEach((select) => {
        if (!select.value) {
          validationFailed = true;
          select.classList.add("error");
          alert(`Please select a value for ${select.name}`);
        } else {
          select.classList.remove("error");
        }
      });

      // Stop submission if validation failed
      if (validationFailed) return;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch("/get-quotation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const quotation = await response.json();

        if (response.ok) {
          document.getElementById("quote-deviceType").textContent =
            quotation.deviceType;
          document.getElementById("quote-deviceModel").textContent =
            quotation.deviceModel;
          document.getElementById("quote-repairName").textContent =
            quotation.repairName;
          document.getElementById("quote-defectiveParts").textContent =
            quotation.defectiveParts.join(", ");
          document.getElementById(
            "quote-price"
          ).textContent = `$${quotation.price}`;
          document.getElementById(
            "quote-estimatedTime"
          ).textContent = `${quotation.estimatedTime} hours`;

          // Show quotation section
          quotationDisplay.style.display = "block";
        } else {
          alert("Error fetching quotation.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
      }
    });

    // Place Order
    placeOrderButton.addEventListener("click", async function () {
      const storeSelect = document.getElementById("storeSelect");
      const storeId = storeSelect.value;

      try {
        const response = await fetch("/place-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        });

        if (response.ok) {
          alert("Order placed successfully!");
          location.reload();
        } else {
          alert("Error placing order.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong.");
      }
    });
  }
}
