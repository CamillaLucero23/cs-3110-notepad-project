document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  // Get necessary elements
  const authHeader = sessionStorage.getItem("authHeader");
  const role = sessionStorage.getItem("role");
  const adminInfo = document.getElementById("adminInfo");
  const usersListContainer = document.getElementById("usersList");
  const roleSelect = document.getElementById("role");

  // Check if the user is an admin.
  if (authHeader && role === "admin") {
    const username = sessionStorage.getItem("username");
    if (adminInfo) {
      adminInfo.textContent = "Logged in as admin: " + username;
    }
  } else {
    // Not admin: allow registration but force role to 'author'
    if (roleSelect) {
      roleSelect.value = "author";
      roleSelect.disabled = true; // Prevent non-admin from selecting 'admin'
    }
    if (adminInfo) {
      adminInfo.textContent = "Registering as author (admin privileges required for admin accounts)";
    }
  }

  // Attach event listener to the registration form (if present)
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newUsername = document.getElementById("newUsername").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const newRole = document.getElementById("role").value;
      const comments = document.getElementById("comments").value.trim();

      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Only include the auth header if an admin is logged in.
            ...(authHeader && role === "admin" ? { "Authorization": authHeader } : {})
          },
          body: JSON.stringify({
            newUsername,
            newPassword,
            role: newRole,
            comments
          })
        });

        if (response.ok) {
          alert("User " + newUsername + " created successfully!");
          registerForm.reset();
          loadUsers(); // Refresh user list after registration.
        } else {
          const errorText = await response.text();
          alert("Registration failed: " + errorText);
        }
      } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred during registration.");
      }
    });
  } else {
    console.error("Registration form not found.");
  }
  
});
