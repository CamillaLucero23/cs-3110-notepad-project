document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent form from doing a default page refresh
    
    // Collect the credentials from the form inputs
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    console.log("Username from form:", username);
    console.log("Password from form:", password);
    
    // Create the Basic Auth header. btoa() encodes the credentials in base64.
    const authHeader = "Basic " + btoa(username + ":" + password);
    
    try {
      // Send a request to a dedicated /login endpoint (see server code explanation below)
      const response = await fetch("/login", {
        method: "GET",
        headers: {
          "Authorization": authHeader
        }
      });
        console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
		console.log(data)
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("authHeader", authHeader);
        console.log("Stored username:", sessionStorage.getItem("username"));
        console.log("Stored role:", sessionStorage.getItem("role"));
        console.log("Stored authHeader:", sessionStorage.getItem("authHeader"));
        alert("Login successful. Welcome " + data.username + "!");
        window.location.href = "register.html"; // Redirect after successful login.

      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login.");
    }
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "login.html"; // Redirect after logout.
  })
  