const allStoresContainer = document.getElementById("all-stores-container");
if (allStoresContainer) {
  const addStoreButton = document.querySelector(".add-store");
  if (addStoreButton) {
    addStoreButton.addEventListener("click", (event) => {
      window.location.href = "/stores/add";
    });
  }
}

const viewStoreButtons = document.querySelectorAll(".view-store-button");
viewStoreButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const storeId = button.dataset.storeId; // Get store ID from button's data attribute
    window.location.href = `/stores/${storeId}`; // Redirect to the store's individual page
  });
});

// const editStoreButton = document.querySelector(".edit-store");
// editStoreButton.addEventListener("click", (event) => {
//   window.location.href = "/stores/add";
// });

const editButton = document.querySelector(".edit-store");
const saveButton = document.querySelector(".save-changes");
const cancelButton = document.querySelector(".cancel-edit");
const deleteButton = document.querySelector(".del-store");

// Editable fields
const nameInput = document.querySelector("#store-name-input");
const addressInput = document.querySelector("#store-address-input");
const phoneInput = document.querySelector("#store-phone-input");
const storeId = document.querySelector("#store-id").value;
const nameSpan = document.querySelector("#store-name");
const addressSpan = document.querySelector("#store-address");
const phoneSpan = document.querySelector("#store-phone");

// console.log(storeId)
// Toggle Edit Mode
editButton.addEventListener("click", (event) => {
  nameSpan.style.display = "none";
  addressSpan.style.display = "none";
  phoneSpan.style.display = "none";

  nameInput.style.display = "block";
  addressInput.style.display = "block";
  phoneInput.style.display = "block";

  editButton.style.display = "none";
  saveButton.style.display = "inline-block";
  cancelButton.style.display = "inline-block";
});

// Cancel Edit Mode
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
});

saveButton.addEventListener("click", async (event) => {
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
