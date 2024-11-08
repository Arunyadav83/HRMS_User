let leavesArray = [];
const empId = localStorage.getItem("employeeId"); // Get employee ID from local storage
const LEAVES_BASE_URL = "http://localhost:8082/api/leaves";  // Declare it here to avoid scope issues

// Function to fetch leaves list from API
async function fetchLeavesList() {
    try {
        const response = await fetch(LEAVES_BASE_URL);
        const data = await response.json();
        leavesArray = data;  // Store the fetched data into leavesArray
        displayLeaves(); // Call function to display the fetched leaves data
    } catch (error) {
        console.error("Error fetching leave data:", error);
    }
}

// Function to display leaves data in the table
function displayLeaves() {
    const leavesTableBody = document.getElementById("leaves-table-body");
    leavesTableBody.innerHTML = ""; // Clear previous rows in the table body

    // Loop through each leave record and create a table row
    leavesArray.forEach((leave, index) => {
        // Use optional chaining (?) to handle undefined values
        const leaveType = leave.leaveType || "N/A"; // Display "N/A" if leaveType is undefined
        const leaveStatus = leave.status || "Pending";
        const startDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString() : "N/A";
        const endDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString() : "N/A";
        const noofdays = leave.noofdays || "N/A";
        const reason = leave.reason || "No reason provided";
        const session1 = leave.session1 || "N/A";
        const session2 = leave.session2 || "N/A";
        const remainingLeaves = leave.remainingLeaves || "N/A";
        const file = leave.file || "No file uploaded";

        // Create a new table row
        const row = document.createElement("tr");

        // Fill the row with leave details
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${startDate}</td>
            <td>${leaveType}</td>
            <td>${endDate}</td>
            <td>${noofdays}</td>
            <td>${reason}</td>
            <td>${leaveStatus}</td>
            <td>${session1}</td>
            <td>${session2}</td>
            <td>${remainingLeaves}</td>
            <td>${file}</td>
            <td class="text-center">
                <div class="action-label">
                    <a class="btn btn-white btn-sm btn-rounded" href="javascript:void(0);">
                        <i class="fa-regular fa-circle-dot text-purple"></i> New
                    </a>
                </div>
            </td>
            <td>
                <h2 class="table-avatar">
                    <a href="profile.html" class="avatar avatar-xs"><img src="assets/img/profiles/avatar-09.jpg" alt="User Image"></a>
                    <a href="#">Richard Miles</a>
                </h2>
            </td>
            <td class="text-end">
                <div class="dropdown dropdown-action">
                    <a href="#" class="action-icon dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                    <div class="dropdown-menu dropdown-menu-right">
                        <a class="dropdown-item" href="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasEditLeave" aria-controls="offcanvasEditLeave"><i class="fa-solid fa-pencil m-r-5"></i> Edit</a>
                        <a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#delete_approve"><i class="fa-regular fa-trash-can m-r-5"></i> Delete</a>
                    </div>
                </div>
            </td>
        `;

        // Append the row to the table body
        leavesTableBody.appendChild(row);
    });
}

// Call the fetch function to populate the data when the page loads
fetchLeavesList();
