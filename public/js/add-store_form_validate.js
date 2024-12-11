document.addEventListener("DOMContentLoaded", () => {
  const addStoreForm = document.getElementById("add-store-form");
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

      if (!storeName || !/^[a-zA-Z]{1,20}$/.test(storeName))
        errors.push("Store name is required.");
      if (storeLatitude > 90 || storeLatitude < -90)
        errors.push("Latitude must be within -90 and 90!");
      if (storeLongitude > 180 || storeLongitude < -180)
        errors.push("Longitude must be within -180 and 180!");
      if (
        storeAddress.length >= 300 ||
        storeAddress.length < 20 ||
        storeAddress.trim().length == 0
      )
        errors.push(
          "Store Address must be provided and should be within 20-300!"
        );
      if (!storePhone) errors.push("Phone number should be provided!");
      if (!storeManager) errors.push("Store manager should be provided!");
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
});
