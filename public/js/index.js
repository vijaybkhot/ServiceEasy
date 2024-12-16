const allStoresContainer = document.getElementById("all-stores-container");
const storeContainer = document.getElementById("store-container");

if (allStoresContainer) {
  const addStoreButton = document.querySelector(".add-store");
  if (addStoreButton) {
    addStoreButton.addEventListener("click", (event) => {
      window.location.href = "/stores/add";
      event.preventDefault();
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
        errors.forEach((error) => {
          const errorElement = document.createElement("p");
          errorElement.textContent = error;
          errorElement.style.color = "red";
          errorContainer.appendChild(errorElement);
        });
      }
    });
  }

  const viewStoreButtons = document.querySelectorAll(".view-store-button");
  viewStoreButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const storeId = button.dataset.storeId; // Get store ID from button's data attribute
      window.location.href = `/stores/${storeId}`; // Redirect to the store's individual page
    });
  });
}

if (storeContainer) {
  const editButton = document.querySelector(".edit-store");
  const saveButton = document.querySelector(".save-changes");
  const cancelButton = document.querySelector(".cancel-edit");
  const deleteButton = document.querySelector(".del-store");

  // Editable fields
  // const nameTag = document.querySelector("#store-name-tag");
  const nameInput = document.querySelector("#store-name-input");
  const addressInput = document.querySelector("#store-address-input");
  const phoneInput = document.querySelector("#store-phone-input");
  const storeId = document.querySelector("#store-id").value;
  const nameSpan = document.querySelector("#store-name");
  const addressSpan = document.querySelector("#store-address");
  const phoneSpan = document.querySelector("#store-phone");

  // Toggle Edit Mode
  if (editButton) {
    editButton.addEventListener("click", (event) => {
      nameSpan.style.display = "none";
      addressSpan.style.display = "none";
      phoneSpan.style.display = "none";

      nameInput.style.display = "block";
      // nameTag.style.display = "block";
      addressInput.style.display = "block";
      phoneInput.style.display = "block";

      editButton.style.display = "none";
      saveButton.style.display = "inline-block";
      cancelButton.style.display = "inline-block";
    });
  }

  // Cancel Edit Mode
  if (cancelButton) {
    cancelButton.addEventListener("click", (event) => {
      nameSpan.style.display = "block";
      addressSpan.style.display = "block";
      phoneSpan.style.display = "block";

      nameInput.style.display = "none";
      addressInput.style.display = "none";
      phoneInput.style.display = "none";

      editButton.style.display = "inline-block";
      saveButton.style.display = "none";
      cancelButton.style.display = "none";
      const errorContainer = document.querySelector("#error-container");
      errorContainer.innerHTML = ""; // Clear existing errors
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", async (event) => {
      event.preventDefault();
      const errors = [];
      const errorContainer = document.querySelector("#error-container");

      const nameValue = nameInput.value.trim();
      const addressValue = addressInput.value.trim();
      const phoneValue = phoneInput.value.trim();
      console.log(nameValue);
      // Validation rules
      if (!nameValue || !/^[a-zA-Z0-9\s\-',.]+$/.test(nameValue)) {
        errors.push(
          "Store name is required and should contain valid characters."
        );
      }
      if (
        addressValue.length < 20 ||
        addressValue.length > 300 ||
        addressValue.trim() === ""
      ) {
        errors.push("Store Address must be between 20-300 characters.");
      }
      if (!phoneValue) {
        errors.push("Phone number should be provided!");
      }

      // Clear and show errors if validation fails
      errorContainer.innerHTML = ""; // Clear existing errors
      if (errors.length > 0) {
        errors.forEach((error) => {
          const errorElement = document.createElement("p");
          errorElement.textContent = error;
          errorElement.style.color = "red";
          errorContainer.appendChild(errorElement);
        });
        return; // Stop execution if there are errors
      }
      const updatedStore = {
        name: nameInput.value,
        address: addressInput.value,
        phone: phoneInput.value,
      };

      // const storeId = "{{store._id}}";

      try {
        const response = await fetch(`/stores/${storeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedStore),
        });

        if (response.ok) {
          nameSpan.textContent = nameInput.value;
          addressSpan.textContent = addressInput.value;
          phoneSpan.textContent = phoneInput.value;

          cancelButton.click();
        } else {
          console.error("Failed to update store");
        }
      } catch (error) {
        console.error("Error updating store:", error);
      }
    });
  }
  if (deleteButton) {
    deleteButton.addEventListener("click", async (event) => {
      if (confirm("Are you sure you want to delete this store?")) {
        // const storeId = "{{store._id}}"; // Get the current store's ID
        try {
          const response = await fetch(`/stores/${storeId}`, {
            method: "DELETE",
          });
          if (response.ok) {
            alert("Store deleted successfully!");
            window.location.href = "/stores"; // Redirect to all stores page
          } else {
            console.error("Failed to delete store");
          }
        } catch (error) {
          console.error("Error deleting store:", error);
        }
      }
    });
  }
}

// const editStoreButton = document.querySelector(".edit-store");
// editStoreButton.addEventListener("click", (event) => {
//   window.location.href = "/stores/add";
// });

// console.log(storeId)
