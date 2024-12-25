document.addEventListener("DOMContentLoaded", () => {
  const addStoreForm = document.getElementById("add-store-form");
  const editStoreForm = document.getElementById("store-info-form");
  const saveChangesButton = document.querySelector(".save-changes");

  // Validation for Add Store Form
  if (addStoreForm) {
    addStoreForm.addEventListener("submit", (event) => {
      const errors = [];
      const storeName = document.getElementById("store-name").value.trim();
      const storeLongitude = document
        .getElementById("store-longitude")
        .value.trim();
      const storeLatitude = document
        .getElementById("store-latitude")
        .value.trim();
      const storeAddress = document
        .getElementById("store-address")
        .value.trim();
      const storePhone = document.getElementById("store-phone").value.trim();
      const storeManager = document
        .getElementById("store-manager")
        .value.trim();
      const errorContainer = document.getElementById("error-container");

      if (!storeName || !/^[a-zA-Z\s]*$/.test(storeName))
        errors.push(
          "Store name is required and must contain only letters and spaces."
        );
      if (storeLatitude > 90 || storeLatitude < -90)
        errors.push("Latitude must be within -90 and 90!");
      if (storeLongitude > 180 || storeLongitude < -180)
        errors.push("Longitude must be within -180 and 180!");
      if (
        storeAddress.length >= 300 ||
        storeAddress.length < 20 ||
        storeAddress.trim().length === 0
      )
        errors.push("Store Address must be within 20-300 characters!");
      if (!storePhone) errors.push("Phone number must be provided!");
      if (!storeManager) errors.push("Store manager must be provided!");

      errorContainer.innerHTML = "";
      if (errors.length > 0) {
        event.preventDefault();
        errors.forEach((error) => {
          const errorElement = document.createElement("p");
          errorElement.textContent = error;
          errorElement.style.color = "red";
          errorContainer.appendChild(errorElement);
        });
      }
    });
  }

  // Validation for Edit Store Form triggered by Save Changes button
  if (editStoreForm && saveChangesButton) {
    saveChangesButton.addEventListener("click", (event) => {
      const errors = [];
      const storeName = document
        .getElementById("store-name-input")
        .value.trim();
      const storeAddress = document
        .getElementById("store-address-input")
        .value.trim();
      const storePhone = document
        .getElementById("store-phone-input")
        .value.trim();
      const errorContainer = document.getElementById("error-container");

      if (!storeName || !/^[a-zA-Z0-9\s\-',.]+$/.test(storeName))
        errors.push(
          "Store name is required and must contain valid characters."
        );
      if (
        storeAddress.length >= 300 ||
        storeAddress.length < 20 ||
        storeAddress.trim().length === 0
      )
        errors.push("Store Address must be within 20-300 characters!");
      if (!storePhone) errors.push("Phone number must be provided!");

      errorContainer.innerHTML = "";
      if (errors.length > 0) {
        event.preventDefault();
        errors.forEach((error) => {
          const errorElement = document.createElement("p");
          errorElement.textContent = error;
          errorElement.style.color = "red";
          errorContainer.appendChild(errorElement);
        });
      } else {
        // Submit the form programmatically if there are no errors
        editStoreForm.submit();
      }
    });
  }
});
