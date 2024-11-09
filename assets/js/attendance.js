const BASE_URL = "http://localhost:8082/api/attendance";

// Puncin punchoutTime caluclations
let punchedIn = false; // Tracks if the user is punched in
let punchInTime = null; // Tracks the punch-in time
let punchRecordsByDay;

let workDuration = 0; // Tracks total work duration in seconds
let workInterval; // Interval for tracking live work time
let remainingWorkDuration = 0; // Tracks remaining work duration in seconds

let breakDuration = 0; // Tracks total break duration in seconds
let breakStartTime = null; // Tracks the start time of a break
let breakInterval; // Interval for tracking live break time
let workDurationPercentage = 0;

const totalWorkHours = 9 * 3600; // 9 hours working hours
const employeeId = localStorage.getItem("employeeId"); // Get employee ID from local storage

// // Event listener for Relogin button after break
document.addEventListener("DOMContentLoaded", function () {
    fetchAttendanceList();
});

// Fetch attenadance data from backend
async function fetchAttendanceList() {
    return fetch(BASE_URL)
        .then(response => response.json())
        .then(data => {
            punchRecordsByDay = data;
            console.log(punchRecordsByDay);
            
            loadActivities();
            displayPunchRecords()
        })
        .catch(error => console.error("Error fetching attendance data:", error));
}

function handlePunchIn() {
    const loginTime = new Date().toISOString();
    const attendanceDetails = {
        loginTime: loginTime,
        logoutTime: null,
        date: document.getElementById("date").value,
    };

    fetch(`${BASE_URL}/check-in/${employeeId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceDetails),
    })
        .then(handleResponse)
        .then(async (data) => {
            // console.log("Punch In Successful:", data);
            localStorage.setItem("attendanceId", data.attendanceId);

            // First fetch updated attendance data
            return fetchAttendanceList().then(() => {
                remainingWorkDuration = 0;

                startWorkTimer();
                updateWorkingTimeDisplay();
                togglePunchButtons(true);
            });
        })
        .catch(handleError);
}

function handlePunchOut() {
    const logoutTime = new Date().toISOString();
    const attendanceId = localStorage.getItem("attendanceId");

    const attendanceDetails = {
        loginTime: document.getElementById("loginTime").value,
        logoutTime: logoutTime,
        date: document.getElementById("date").value,
    };

    stopWorkTimer();

    fetch(`${BASE_URL}/check-out/${attendanceId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceDetails),
    })
        .then(handleResponse)
        .then(async (data) => {
            // console.log("Punch Out Successful:", data);
            localStorage.removeItem("attendanceId");

            // First fetch updated attendance data
            return fetchAttendanceList().then(() => {
                togglePunchButtons(false);
            });
        })
        .catch(handleError);
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

function handleError(error) {
    console.error("Error:", error);
    alert("An error occurred: " + error.message);
}

function togglePunchButtons(punchedIn) {
    loadActivities();
    displayPunchRecords();

    document.getElementById("punchInDiv").style.display = punchedIn ? "none" : "block";
    document.getElementById("punchOutDiv").style.display = punchedIn ? "block" : "none";
}

// Get today's date as a string (e.g., "2023-10-30")
function getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;
}

// Load state on page load
document.addEventListener("DOMContentLoaded", async () => {
    const todayDate = getTodayDateString();
    let todayRecords;

    if (punchRecordsByDay) {
        todayRecords = punchRecordsByDay.find(record => record.date === todayDate);
    }

    // Check if today's records already exist
    if (todayRecords) {
        // Restore punch-in state
        const lastPunch = todayRecords.punchRecords[todayRecords.punchRecords.length - 1];
        punchedIn = lastPunch?.punchoutTime === null;

        if (punchedIn) {
            punchInTime = new Date(lastPunch.punchinTime);
            startWorkTimer();
        }

        // work time
        workDuration = calculateTotalWorkDuration(todayRecords.punchRecords);
        updateWorkingTimeDisplay();

        // break time
        updateBreakTimeDisplay();

        // punchRecords list
        loadActivities()

        // In the table
        displayPunchRecords()

        // Calculate and display overtime
        calculateOvertime();

        // Restore break state
        const lastBreak = todayRecords.breaksList[todayRecords.breaksList.length - 1];
        if (lastBreak && lastBreak.breakEndTime === null) {
            // Break is ongoing; set `breakStartTime` and start the break timer
            breakStartTime = new Date(lastBreak.breakStartTime);

            if (breakInterval) clearInterval(breakInterval); // Clear any existing intervals
            breakInterval = setInterval(updateBreakTimeDisplay, 1000);
        } else {
            // Break has ended; calculate total break duration
            breakDuration = calculateTotalBreakDuration(todayRecords.breaksList);
        }

        document.getElementById("punchInDiv").style.display = punchedIn ? "none" : "block";
        document.getElementById("punchOutDiv").style.display = punchedIn ? "block" : "none";
    }
});

function startWorkTimer() {
    workInterval = setInterval(() => {
        // Update work duration based on whether it's resumed
        workDuration += 1; // Increment work duration by 1 second

        // Update the display
        updateWorkingTimeDisplay();
    }, 1000);
}

function stopWorkTimer() {
    if (workInterval) {
        clearInterval(workInterval);
        remainingWorkDuration = totalWorkHours - workDuration; // Calculate remaining duration
        workInterval = null; // Clear the interval but keep track of remaining duration
    }
}

// Calculate total work duration in seconds
function calculateTotalWorkDuration(punchRecords) {
    return punchRecords.reduce((total, record) => {
        const punchinTime = new Date(record.punchinTime).getTime();
        const punchoutTime = record.punchoutTime ? new Date(record.punchoutTime).getTime() : Date.now();
        return total + Math.floor((punchoutTime - punchinTime) / 1000);
    }, 0);
}

// Pad single digits with zero
function padZero(num) {
    return num < 10 ? '0' + num : num;
}

// Calculate remaining work hours for today, including seconds
function calculateRemainingWorkHours() {
    if (workDuration > totalWorkHours) {
        calculateOvertime();
    } else {
        const remainingSeconds = totalWorkHours - workDuration;
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        // const seconds = remainingSeconds % 60;
        document.getElementById("remaining-hours").innerText = `${padZero(hours)} Hrs : ${padZero(minutes)} Min`;
        document.getElementById("overtime-hours").innerText = "0 Hrs 00 Min"; // Reset overtime if within 9 hours
    }
}

// Call the remaining hours calculation regularly to keep values up to date
setInterval(() => {
    calculateRemainingWorkHours();
}, 1000);

// Update work time display with remaining hours calculation
function updateWorkingTimeDisplay() {
    const hours = Math.floor(workDuration / 3600);
    const minutes = Math.floor((workDuration % 3600) / 60);
    const seconds = workDuration % 60;

    document.getElementById("workTime").innerText = `${padZero(hours)} Hrs : ${padZero(minutes)} Min : ${padZero(seconds)} Sec`;

    // Calculate work duration percentage
    workDurationPercentage = Math.min(100, (workDuration / totalWorkHours) * 100);

    // Calculate and display remaining working hours
    calculateRemainingWorkHours();
}

// Calculate overtime when work exceeds 9 hours
function calculateOvertime() {
    const overtimeSeconds = workDuration - totalWorkHours;

    const overtimeHours = Math.floor(overtimeSeconds / 3600);
    const overtimeMinutes = Math.floor((overtimeSeconds % 3600) / 60);
    // const overtimeSecondsRemainder = overtimeSeconds % 60;

    document.getElementById("overtime-hours").innerText = `${padZero(overtimeHours)} Hrs : ${padZero(overtimeMinutes)} Min`;
}

// Update break time display
function updateBreakTimeDisplay() {
    const todayDate = getTodayDateString();
    const todayRecords = punchRecordsByDay.find(record => record.date === todayDate);

    if (todayRecords) {
        breakDuration = calculateTotalBreakDuration(todayRecords.breaksList);
        const hours = Math.floor(breakDuration / 3600);
        const minutes = Math.floor((breakDuration % 3600) / 60);
        // const seconds = breakDuration % 60;

        document.getElementById("break-hours").innerText = `${padZero(hours)} Hrs : ${padZero(minutes)} Min`;
    }
}

// Calculate total break duration in seconds
function calculateTotalBreakDuration(breaksList) {
    return breaksList.reduce((total, record) => {
        const breakStart = new Date(record.breakStartTime).getTime();
        const breakEnd = record.breakEndTime ? new Date(record.breakEndTime).getTime() : Date.now();
        return total + Math.floor((breakEnd - breakStart) / 1000);
    }, 0);
}

// Show punch records in table 
function displayPunchRecords() {
    punchRecordsByDay.forEach((dayRecords, index) => {
        addPunchLogEntry(
            index,
            dayRecords?.date,
            dayRecords?.punchRecords[0]?.punchinTime,
            dayRecords?.punchRecords[dayRecords?.punchRecords?.length - 1]?.punchoutTime,
            calculateTotalWorkDuration(dayRecords?.punchRecords),
            calculateTotalBreakDuration(dayRecords?.breaksList),
            calculateTotalWorkDuration(dayRecords?.punchRecords) - totalWorkHours,
            totalWorkHours
        );
    });
}

// Show punchin and punch out activities
function loadActivities() {
    const todayDate = getTodayDateString();

    // Find today's record
    let todayRecords = punchRecordsByDay.find(record => record.date === todayDate);

    const activityList = document.getElementById("activity-list");
    activityList.innerHTML = "";

    if (todayRecords?.punchRecords) {
        todayRecords?.punchRecords.forEach(punch => {
            if (punch.punchinTime) {
                updateActivityLog("Punch In", formatTime(punch.punchinTime));
            }
            if (punch.punchoutTime) {
                updateActivityLog("Punch Out", formatTime(punch.punchoutTime));
            }
        });
    }
}

// Activity of today
function updateActivityLog(action, time) {
    const activityList = document.getElementById("activity-list");
    const listItem = document.createElement("li");

    // Add the colored dot using ::before pseudo-element
    const dotColor = action === "Punch In" ? "#09e300" : "orange";
    listItem.style.setProperty("--dot-color", dotColor);

    const style = document.createElement("style");
    style.textContent = `
        .recent-activity .res-activity-list li:before {
            border-color: var(--dot-color);
        }
    `;
    document.head.appendChild(style);

    listItem.innerHTML = `
    <p class="mb-0">${action} at</p>
    <p class="res-activity-time">
      <i class="fa-regular fa-clock"></i> ${time}
    </p>
  `;
    activityList.appendChild(listItem);
}

// Table code for punchRecords and work duration
// Show punch records in table 
function addPunchLogEntry(index, date, punchinTime, punchoutTime, workDuration, breakDuration, overtime, totalWorkHours) {
    const punchLog = document.getElementById("punch-log");
    const existingRow = document.querySelector(`#punch-log tr[data-date="${date}"]`);

    // Format the date properly before inserting it into the table
    const formattedDate = formateDate(date);
    let formattedPunchIn = punchinTime ? formatTime(punchinTime) : "Not punched in";
    let formattedPunchOut = punchoutTime ? formatTime(punchoutTime) : "Not punched out";

    // Create a new row if it doesn't already exist
    if (!existingRow) {
        const newRow = document.createElement("tr");
        newRow.setAttribute("data-date", date);

        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedDate}</td> <!-- Use formatted date here -->
            <td>${formattedPunchIn}</td>
            <td>${formattedPunchOut}</td>
            <td>${formatDuration(workDuration)}</td>
            <td>${formatDuration(breakDuration)}</td>
            <td>${formatOverTime(overtime, totalWorkHours)}</td>
        `;
        punchLog.appendChild(newRow);
    } else {
        // Update the existing row with new values
        existingRow.cells[1].innerText = formattedDate; // Update the date
        existingRow.cells[2].innerText = formattedPunchIn;
        existingRow.cells[3].innerText = formattedPunchOut;
        existingRow.cells[4].innerText = `${formatDuration(workDuration)}`;
        existingRow.cells[5].innerText = `${formatDuration(breakDuration)}`;
        existingRow.cells[6].innerText = `${formatOverTime(overtime, totalWorkHours)}`;
    }
}

// Utility function to format time from ISO string to a more readable format
function formatTime(isoString) {
    if (!isoString) return "~~"; // Handle null case
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: "2-digit" }); // Format as needed
}

function formatDuration(time) {
    const work_hours = Math.floor(time / 3600);
    const work_minutes = Math.floor((time % 3600) / 60);

    return `${padZero(work_hours)} Hrs : ${padZero(work_minutes)} Mins`
}

// Function to calculate overtime based on work duration in seconds
function formatOverTime(workDurationInSeconds, totalWorkHours) {
    const overtimeSeconds = Math.max(0, workDurationInSeconds - totalWorkHours); // Only positive overtime

    const overtimeHours = Math.floor(overtimeSeconds / 3600);
    const overtimeMinutes = Math.floor((overtimeSeconds % 3600) / 60);

    return `${padZero(overtimeHours)} Hrs : ${padZero(overtimeMinutes)} Mins`;
}

// Function to format date in the required format
function formateDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}


// Search the record
function searchAttendance() {
    const dateInput = document.getElementById("datepicker").value;
    const punchLog = document.getElementById("punch-log");
    punchLog.innerHTML = ""; // Clear the table before adding matching records

    // Loop through each record in punchRecordsByDay to check if it matches the filter
    punchRecordsByDay.forEach((record, index) => {
        const recordDate = new Date(record.date);
        const inputDate = dateInput ? new Date(dateInput) : null;

        // Check if the record matches the date, month, and year filter
        const matchDate = inputDate ? inputDate.toDateString() === recordDate.toDateString() : true;

        // If the record matches the criteria, display it
        if (matchDate && record) {
            const newRow = document.createElement("tr");
            newRow.setAttribute("data-date", record.date);

            newRow.innerHTML = `
                <td>${index + 1}</td>
                <td>${formateDate(record.date)}</td>
                <td class="punch-in">${formatTime(record.punchRecords[0].punchinTime)}</td>
                <td class="punch-out">${formatTime(record.punchRecords[record.punchRecords.length - 1].punchoutTime)}</td>
                <td class="work-duration">${formatDuration(calculateTotalWorkDuration(record.punchRecords))}</td>
                <td class="break-duration">${formatDuration(calculateTotalBreakDuration(record.breaksList))}</td>
                <td class="overtime">${formatOverTime(calculateTotalWorkDuration(record.punchRecords), totalWorkHours)}</td>
            `;

            punchLog.appendChild(newRow); // Add the new row to the punch-log table body
        }
    });
}