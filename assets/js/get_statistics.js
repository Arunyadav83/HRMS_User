let holidays = [];

document.addEventListener("DOMContentLoaded", function () {
    fetchHolidays();
});

function fetchHolidays() {
    fetch("http://localhost:8082/api/holiday")
        .then(response => response.json())
        .then(data => {
            holidays = data;
            fetchAttendanceData();
        })
        .catch(error => console.error("Error fetching holiday data:", error));
}

function fetchAttendanceData() {
    fetch("http://localhost:8082/api/attendance")
        .then(response => response.json())
        .then(data => {
            calculateProgress(data);
        })
        .catch(error => console.error("Error fetching attendance data:", error));
}

function getWorkingDaysInMonth(startDate, endDate) {
    let workingDays = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        // Skip Sundays (0 is Sunday)
        if (currentDate.getDay() !== 0) {
            const dateString = currentDate.toISOString().split('T')[0];
            // Check if it's not a holiday
            if (!holidays.some(holiday => holiday.holidayDate === dateString)) {
                workingDays++;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return workingDays;
}

// Add this new function to calculate working days
function getWorkingDaysInWeek(startDate, endDate) {
    let workingDays = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        // Skip Sundays (0 is Sunday)
        if (currentDate.getDay() !== 0) {
            const dateString = currentDate.toISOString().split('T')[0];
            // Check if it's not a holiday
            if (!holidays.some(holiday => holiday.holidayDate === dateString)) {
                workingDays++;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return workingDays;
}

function calculateProgress(attendanceArray) {
    const today = new Date().toISOString().split("T")[0]; // Today's date in yyyy-mm-dd format

    let todayHours = 0;
    let weekHours = 0;
    let monthHours = 0;
    let overtimeHours = 0;

    // Set to Monday of current week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    // Set to Saturday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 5);

    // Start of the current month
    const monthStart = new Date();
    monthStart.setDate(1);

    // month end
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    // Calculate weekly target hours based on working days
    const workingDaysInWeek = getWorkingDaysInWeek(weekStart, weekEnd);
    const weeklyTargetHours = workingDaysInWeek * 9; // 9 hours per working day

    // In calculateProgress function:
    const workingDaysInMonth = getWorkingDaysInMonth(monthStart, monthEnd);
    const monthlyTargetHours = workingDaysInMonth * 9;

    attendanceArray.forEach(attendance => {
        const punchRecords = attendance.punchRecords || [];
        let dailyWorkedMinutes = 0;

        punchRecords.forEach(record => {
            const punchIn = new Date(record.punchinTime);
            let punchOut = record.punchoutTime ? new Date(record.punchoutTime) : new Date();

            // Calculate duration in minutes
            const duration = (punchOut - punchIn) / (1000 * 60);
            dailyWorkedMinutes += duration;
        });

        const entryDateObj = new Date(attendance.date);
        const entryDate = new Date(attendance.date).toISOString().split("T")[0];
        const entryWorkedHours = dailyWorkedMinutes / 60;
        // Weekly progress - check for weekday and not holiday
        const isWeekday = entryDateObj >= weekStart && entryDateObj <= weekEnd;
        const isWeekend = entryDateObj.getDay() === 0 || entryDateObj.getDay() === 6;
        // In string
        const entryDateStr = entryDateObj.toISOString().split('T')[0];
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        // Daily progress
        if (entryDate === today) {
            todayHours = entryWorkedHours;
        }

        // Weekly progress - fixed section
        const isHoliday = holidays.some(holiday =>
            holiday.holidayDate === entryDate
        );

        // Convert overtime from seconds to hours
        if (attendance.overtime) {
            overtimeHours += attendance.overtime / 3600; // Convert seconds to hours
        }

        if (isWeekday && !isHoliday) {
            weekHours += entryWorkedHours;
        }

        // Monthly progress
        if (entryDateStr >= monthStartStr && entryDateStr <= today) {
            if (!isWeekend && !isHoliday) {
                monthHours += entryWorkedHours;
            }
        }
    });

    updateStatistics(todayHours, weekHours, monthHours, overtimeHours, weeklyTargetHours, monthlyTargetHours);
}

function updateStatistics(todayHours, weekHours, monthHours, overtimeHours, weeklyTargetHours, monthlyTargetHours) {

    const todayProgress = (todayHours / 9) * 100;
    const weekProgress = (weekHours / weeklyTargetHours) * 100;
    const monthProgress = (monthHours / monthlyTargetHours) * 100;
    const overtimeProgress = overtimeHours > 0 ? 100 : 0;

    // Today stats
    const todayElement = document.querySelector(".stats-info:nth-child(1)");
    todayElement.querySelector("strong").innerHTML = `${todayHours.toFixed(2)} <small>/ 9 hrs</small>`;
    todayElement.querySelector(".progress-bar").style.width = `${todayProgress}%`;
    todayElement.querySelector(".progress-bar").setAttribute("aria-valuenow", todayProgress);

    // This Week stats
    const weekElement = document.querySelector(".stats-info:nth-child(2)");
    weekElement.querySelector("strong").innerHTML = `${weekHours.toFixed(2)} <small>/ ${weeklyTargetHours} hrs</small>`;
    weekElement.querySelector(".progress-bar").style.width = `${weekProgress}%`;
    weekElement.querySelector(".progress-bar").setAttribute("aria-valuenow", weekProgress);

    // This Month stats
    const monthElement = document.querySelector(".stats-info:nth-child(3)");
    monthElement.querySelector("strong").innerHTML = `${monthHours.toFixed(2)} <small>/ ${monthlyTargetHours} hrs</small>`;
    monthElement.querySelector(".progress-bar").style.width = `${monthProgress}%`;
    monthElement.querySelector(".progress-bar").setAttribute("aria-valuenow", monthProgress);

    // Overtime stats
    const overtimeElement = document.querySelector(".stats-info:nth-child(4)");
    overtimeElement.querySelector("strong").textContent = `${overtimeHours.toFixed(2)} hrs`;
    overtimeElement.querySelector(".progress-bar").style.width = `${overtimeProgress}%`;
    overtimeElement.querySelector(".progress-bar").setAttribute("aria-valuenow", overtimeProgress);
}
