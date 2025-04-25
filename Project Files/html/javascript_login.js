document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();  // Prevent form from doing a default page refresh
  
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  
  const authHeader = "Basic " + btoa(username + ":" + password);
  
  try {
      const response = await fetch("/login", {
          method: "GET",
          headers: {
              "Authorization": authHeader
          }
      });
      
      if (response.ok) {
          const data = await response.json();
          
          // Store the session data
          sessionStorage.setItem("username", data.username);
          sessionStorage.setItem("role", data.role);
          sessionStorage.setItem("authHeader", authHeader);
          
          // Log sessionStorage to confirm it's being set correctly
          console.log("Session Storage set:", sessionStorage);

          // Redirect to the homepage after successful login
          window.location.href = "index.html";  // Redirect to homepage (index.html)
      } else {
          alert("Login failed. Please check your credentials.");
      }
  } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login.");
  }
});

document.getElementById("logoutButton").addEventListener("click", () => {
  // Clear session storage to log out
  console.log("Before logout:", sessionStorage);
  sessionStorage.clear();
  console.log("After logout:", sessionStorage);


  // Optionally, you can log this for debugging purposes
  console.log("Session cleared and logged out");

  // Redirect to login page
  window.location.href = "page_login.html";  // Redirect to the login page
});

