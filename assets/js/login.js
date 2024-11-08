document
  .getElementById("login_employee")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    const employeeLogin = {
      employeeEmail: document.getElementById("email").value,
      employeePassword: document.getElementById("password").value,
    };

    // Login fetch call
    fetch("http://localhost:8082/api/employee/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeLogin),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Unauthorized");
        }
      })
      .then((data) => {
        console.log("Login Successful:", data);

        const employeeId = data.employeeId; // Adjust based on API response

        // Store in localStorage
        localStorage.setItem("employeeId", employeeId);
        localStorage.setItem("employeeName", `${data.employeefirstName} ${data.employeeLastName}`);

        // Redirect to dashboard or show correct punch options
        window.location.href = "employee-dashboard.html";
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Login failed. Please check your credentials.");
      });
  });

document
  .getElementById("reloginBtn")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default form submission

    const employeeLogin = {
      employeeEmail: document.getElementById("email").value,
      employeePassword: document.getElementById("password").value,
    };

    // Relogin fetch call
    fetch("http://localhost:8082/api/employee/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeLogin),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Unauthorized");
        }
      })
      .then((data) => {
        console.log("Relogin Successful:", data);

        const employeeId = data.employeeId; // Adjust based on API response

        // Store in localStorage again
        localStorage.setItem("employeeId", employeeId);
        localStorage.setItem("employeeName", `${data.employeefirstName} ${data.employeeLastName}`);

        // Determine punch status: Hide or show Punch-In and Punch-Out
        if (attendanceId) {
          // Employee is already punched in, show Punch-Out
          document.getElementById("punchInDiv").style.display = "none";
          document.getElementById("punchOutDiv").style.display = "block";
        } else {
          // Show Punch-In button if the employee is logged in but not punched in
          document.getElementById("punchInDiv").style.display = "block";
          document.getElementById("punchOutDiv").style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Relogin failed. Please check your credentials.");
      });
  });
