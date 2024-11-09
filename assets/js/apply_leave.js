// Constants
const LEAVE_BASE_URL = "http://localhost:8082/api/leaves";
const empID = localStorage.getItem("employeeId");
const adminId = localStorage.getItem("adminId");

// State variables
let leavesList = [];
let fromDate = new Date();
let toDate = new Date();

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    fetchLeavesList().then(initializeDateInputs).catch(error => {
        console.error("Initialization error:", error);
    });
});

// Initialize date inputs with restrictions
function initializeDateInputs() {
    const fromDateInput = document.getElementById("fromDate");
    const toDateInput = document.getElementById("toDate");

    if (fromDateInput && toDateInput) {
        const today = new Date().toISOString().split("T")[0];
        fromDateInput.min = today;

        fromDateInput.addEventListener("change", function () {
            toDateInput.min = fromDateInput.value;
        });
    } else {
        console.warn("Date input elements not found in the DOM.");
    }
}

// Fetch leaves data
async function fetchLeavesList() {
    try {
        const response = await fetch(LEAVE_BASE_URL);
        if (!response.ok) throw new Error('Failed to fetch leaves');
        leavesList = await response.json();
    } catch (error) {
        console.error("Error fetching leave data:", error);
        showError('Failed to fetch leave data');
    }
}

// Form submission event listener
document.getElementById('leaveForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    const leaveData = collectFormData();
    await submitLeaveApplication(leaveData);
});

// Function to parse DD-MM-YYYY to ISO format
function parseDate(input) {
    const [day, month, year] = input.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
}

// Collects form data
function collectFormData() {
    const fromDateISO = parseDate(document.getElementById("fromDate").value);
    const toDateISO = parseDate(document.getElementById("toDate").value);

    return {
        leaveType: document.getElementById("leaveType").value,
        applyingTo: document.getElementById("applying").value,
        cc: document.getElementById("ccto").value,
        noofleaves: calculateNoOfDays(
            fromDateISO,
            document.getElementById("fromSession").value,
            toDateISO,
            document.getElementById("toSession").value
        ),
        file: document.getElementById("file").value,
        reason: document.getElementById("reason").value,
        status: "Pending",
        startDate: fromDateISO,
        endDate: toDateISO,
        session1: document.getElementById("fromSession").value,
        session2: document.getElementById("toSession").value,
        remainingLeaves: document.getElementById("remainingLeaves").value,
        assignedBy: empID,
        approvedBy: adminId
    };
}

// Function that makes the API call
async function submitLeaveApplication(leaveData) {
    console.log(leaveData);

    try {
        showLoadingIndicator();

        const response = await fetch(`${LEAVE_BASE_URL}/leave/${empID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveData)
        });

        if (!response.ok) throw new Error('Failed to submit leave application');

        const data = await response.json();
        showSuccess('Leave application submitted successfully');
        document.getElementById('leaveForm').reset();
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to submit leave application');
    }
}

// Helper functions for UI feedback
function showLoadingIndicator() {
    Swal.fire({
        title: 'Submitting Leave Application...',
        text: 'Please wait',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
}

function showSuccess(message) {
    Swal.fire({
        title: 'Success!',
        text: message,
        icon: 'success',
        confirmButtonText: 'OK'
    });
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonText: 'OK'
    });
}

// Function to calculate number of days between two dates considering sessions
function calculateNoOfDays(fromDate, fromSession, toDate, toSession) {
    // Parse sessions as integers
    fromSession = parseInt(fromSession, 10);
    toSession = parseInt(toSession, 10);

    // Ensure dates are valid Date objects
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    // Set time to start of day (00:00:00) for accurate day calculations
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Calculate full days between the two dates
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    let noOfDays = 0;

    if (daysDiff === 0) {
        // Case for the same day
        if (fromSession === 1 && toSession === 1) {
            noOfDays = 0.5; // Morning half
        } else if (fromSession === 1 && toSession === 2) {
            noOfDays = 1; // Full day
        } else if (fromSession === 2 && toSession === 2) {
            noOfDays = 0.5; // Afternoon half
        }
    } else if (daysDiff > 0) {
        // Case for different days
        noOfDays = daysDiff - 1; // Number of full days between

        // Handle the first day based on the session
        noOfDays += (fromSession === 1) ? 1 : 0.5;

        // Handle the last day based on the session
        noOfDays += (toSession === 1) ? 0.5 : 1;
    } else {
        console.error("End date cannot be before the start date.");
        return 0;
    }

    return noOfDays;
}

function validateForm() {
    // Required fields
    const requiredFields = {
        "leaveType": "Leave type",
        "applying": "Applying to",
        "fromDate": "From date",
        "toDate": "To date",
        "fromSession": "From session",
        "toSession": "To session",
        "reason": "Reason"
    };

    // Check each required field
    for (const [fieldId, fieldName] of Object.entries(requiredFields)) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            showError(`${fieldName} is required`);
            return false;
        }
    }

    // Validate dates
    const fromDateInput = document.getElementById("fromDate").value;
    const toDateInput = document.getElementById("toDate").value;

    // Convert to ISO string for comparison
    const fromDate = parseDate(fromDateInput);
    const toDate = parseDate(toDateInput);

    if (toDate < fromDate) {
        showError("End date cannot be before start date");
        return false;
    }

    // Validate remaining leaves
    const remainingLeaves = parseFloat(document.getElementById("remainingLeaves").value) || 0;
    const requestedLeaves = calculateNoOfDays(
        fromDate,
        document.getElementById("fromSession").value,
        toDate,
        document.getElementById("toSession").value
    );

    if (requestedLeaves > remainingLeaves) {
        showError(`Insufficient leave balance. You have ${remainingLeaves} leaves remaining`);
        return false;
    }

    return true;
}
