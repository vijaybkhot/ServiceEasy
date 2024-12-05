// const loginForm = document.getElementById("login-form");

// if (loginForm) {
//   loginForm.addEventListener("submit", (event) => {
//     event.preventDefault();

//     // Values
//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;

//     // Clear the password field after submitting
//     document.getElementById("password").value = "";
//   });
// }

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".view-store-button");
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const storeId = button.dataset.storeId; // Get store ID from button's data attribute
        window.location.href = `/stores/${storeId}`; // Redirect to the store's individual page
      });
    });
  });

