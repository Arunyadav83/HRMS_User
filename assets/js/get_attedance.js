document.getElementById("getAttendanceBtn").addEventListener('click', function () {
    const employeeId = localStorage.getItem("employeeId"); // Retrieve the employee ID from local storage

    if (!employeeId) {
        alert("Employee ID is missing.");
        return;
    }

    // Fetch the attendance data
    fetch(`http://localhost:8081/api/attendance/employee/${employeeId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Failed to retrieve attendance data");
            }
        })
        .then(data => {
            // console.log("Attendance Data:", data);
            document.getElementById("attendanceDataDiv").style.display = "block";
            document.getElementById("attendanceData").textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to retrieve attendance data");
        });
});