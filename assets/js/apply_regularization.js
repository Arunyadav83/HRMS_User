import { getSelectedCalendarDate } from './calendar.js';

let regularizationsList = [];
const employeeId = localStorage.getItem("employeeId"); // Get employee ID from local storage
const REG_BASE_URL = "http://localhost:8082/api/regularization";  // Declare it here to avoid scope issues

// Get form and buttons
const regularizationForm = document.getElementById('regularizationForm');
const submitButton = document.getElementById('submitRegularization');
const cancelButton = document.getElementById('cancelRegularization');
const punchinTime = document.getElementById('punchinTime');
const punchoutTime = document.getElementById('punchoutTime');

// Event listeners
submitButton.addEventListener('click', handleRegularizationSubmit);
cancelButton.addEventListener('click', handleRegularizationCancel);

// Fetch regularization data from backend
async function fetchRegularizationList() {
    try {
        const response = await fetch(REG_BASE_URL);
        const data = await response.json();
        regularizationsList = data;
    } catch (error) {
        console.error("Error fetching regularization data:", error);
    }
}

// Move this inside DOMContentLoaded to ensure the DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    fetchRegularizationList();
});

// Function to submit regularization request
async function submitRegularization(data) {
    try {
        const response = await fetch(REG_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error submitting regularization/leave:', error);
        throw error;
    }
}

// Function to handle regularization form submission
async function handleRegularizationSubmit(event) {
    event.preventDefault();

    // Get selected date from the calendar
    const selectedDate = getSelectedCalendarDate();

    // Check if regularization already exists for this date
    const existingRegularization = regularizationsList.find(reg => 
        new Date(reg.date).toDateString() === new Date(selectedDate).toDateString() && 
        reg.employeeId === employeeId
    );

    if (existingRegularization) {
        alert('You have already applied for regularization on this date.');
        return;
    }

    // Combine the selected date with the punch-in and punch-out times
    const punchInDateTime = combineDateAndTime(selectedDate, punchinTime.value);
    const punchOutDateTime = combineDateAndTime(selectedDate, punchoutTime.value);

    // Validate punch-in and punch-out times
    if (punchOutDateTime <= punchInDateTime) {
        alert('Punch-out time must be after punch-in time.');
        return;
    }

    const regularizationData = {
        employeeId: employeeId,
        date: selectedDate,
        shift: document.getElementById('regularizationShift').value,
        reason: document.getElementById('regularizationReason').value,
        punchinTime: punchInDateTime.toISOString(),
        punchoutTime: punchOutDateTime.toISOString(),
        appliedOn: new Date().toISOString(),
    };

    console.log(regularizationData);

    // Submit the regularization request
    try {
        // const response = await submitRegularization(regularizationData);
        alert('Regularization submitted successfully!');
        regularizationForm.reset();  // Reset form
    } catch (error) {
        alert('Failed to submit request. Please try again.');
    }
}

// Function to handle cancel regularization action
function handleRegularizationCancel(event) {
    event.preventDefault();
    regularizationForm.reset();
}

// Function to combine selected date with punch-in and punch-out time strings
function combineDateAndTime(date, time) {
    const [hours, minutes] = time.split(':').map(Number); // Split the time into hours and minutes
    const combinedDateTime = new Date(date); // Start with the selected date
    combinedDateTime.setHours(hours, minutes, 0); // Set the correct time

    return combinedDateTime; // This will return a Date object with the combined date and time
}

// Function to update datetime inputs when a date is selected
function updateDateTimeInputs(date) {
    // Set default times (9:30 AM and 6:30 PM)
    const inDateTime = new Date(date);
    inDateTime.setHours(9, 30, 0);

    const outDateTime = new Date(date);
    outDateTime.setHours(19, 0, 0);

    // Format for time input (HH:mm format)
    punchinTime.value = `${String(inDateTime.getHours()).padStart(2, '0')}:${String(inDateTime.getMinutes()).padStart(2, '0')}`;
    punchoutTime.value = `${String(outDateTime.getHours()).padStart(2, '0')}:${String(outDateTime.getMinutes()).padStart(2, '0')}`;
}

// Listen for date selection from calendar
document.addEventListener('dateSelected', function (e) {
    updateDateTimeInputs(e.detail.date);
});
