let holidays = [];
let punchRecordsByDay = [];
let regularizationList = [];
const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectedCalendarDate = null; // Will be set when a date is selected

// Fetch holiday data
function fetchAllHolidaysList() {
    fetch("http://localhost:8082/api/holiday")
        .then(response => response.json())
        .then(data => {
            holidays = data;
        })
        .catch(error => console.error("Error fetching holiday data:", error));
}

// Fetch attendance data
async function fetchAttendanceList() {
    return fetch("http://localhost:8082/api/attendance")
        .then(response => response.json())
        .then(data => {
            punchRecordsByDay = data;
        })
        .catch(error => console.error("Error fetching attendance data:", error));
}

// Fetch regularization data
async function fetchRegularizationList() {
    return fetch("http://localhost:8082/api/regularization")
        .then(response => response.json())
        .then(data => {
            regularizationList = data;
        })
        .catch(error => console.error("Error fetching regularization data:", error));
}

// Call fetch functions when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    fetchAllHolidaysList();
    fetchAttendanceList();
    fetchRegularizationList();
    generateCalendar(currentMonth, currentYear);
});

// Function to get work duration color for each date
function getWorkDurationColor(date) {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const dayRecord = punchRecordsByDay.find(record => record.date === formattedDate);

    if (!dayRecord) return '';

    const duration = dayRecord.workedHours; // in hours

    if (duration >= 9) return '#90EE90'; // Light green for full day
    if (duration >= 4) return '#FFE4B5'; // Light orange for half day
    return '#FFB6C1'; // Light red for less than half day
}

// Generate the calendar for a given month and year
function generateCalendar(month, year) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();

    $('#calendar').html('');
    let calendar = '<table class="table table-bordered">';
    calendar += `<thead><tr><th colspan="7">${monthNames[month]} ${year}</th></tr>`;
    calendar += '<tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead><tbody>';

    let date = 1;
    let saturdayCount = 0;

    // Loop through the weeks and days of the month
    for (let i = 0; i < 6; i++) {
        calendar += '<tr>';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                calendar += '<td></td>';
            } else if (date > daysInMonth) {
                break;
            } else {
                const isSunday = j === 0;
                const isSaturday = j === 6;

                if (isSaturday) saturdayCount++;

                const isFourthSaturday = isSaturday && saturdayCount === 4;
                const isHolidayDate = isHoliday(date);

                // Determine background color priority
                let backgroundColor;
                if (isSunday || isFourthSaturday) {
                    backgroundColor = '#e3e3e3'; // Gray for Sundays and Fourth Saturdays
                } else if (isHolidayDate) {
                    backgroundColor = '#bae2ff'; // Light blue for holidays
                } else {
                    backgroundColor = getWorkDurationColor(date); // Use punch record color
                }

                calendar += `<td style="background-color: ${backgroundColor}" class="date-cell position-relative">
                    ${date}
                    ${hasRegularization(date) ? `<div style="position: absolute; top: 0; right: 0; width: 0; height: 0; border-top: 10px solid ${'#90EE90'}; border-left: 10px solid transparent;"></div>` : ''}
                </td>`;
                date++;
            }
        }
        calendar += '</tr>';
    }
    calendar += '</tbody></table>';

    $('#calendar').html(calendar);

    // Click event for date selection
    $('.date-cell').click(function () {
        $('.date-cell').removeClass('active');
        $(this).addClass('active');
    });

    const dateCells = document.querySelectorAll('.date-cell');
    dateCells.forEach(cell => {
        cell.addEventListener('click', function () {
            selectedCalendarDate = new Date(year, month, parseInt(this.textContent));
            onDateSelect(selectedCalendarDate);

            const formattedDate = formatDateForDisplay(selectedCalendarDate);
            document.getElementById('selectedDateLabel').textContent = formattedDate;

            dateCells.forEach(c => {
                c.classList.remove('selected');
                resetCellBackground(c, year, month);
            });

            this.classList.add('selected');
            this.style.backgroundColor = '#4287f5'; // Light blue for selected date
        });
    });
}

// Format the date for display in the label (DD/MM/YYYY - Day)
function formatDateForDisplay(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - ${days[date.getDay()]}`;
}

function isHoliday(date) {
    const formattedDate = `${String(date).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
    return holidays.some(holiday => holiday.holidayDate === formattedDate);
}

// Helper function to reset background color of date cells
function resetCellBackground(cell, year, month) {
    const date = parseInt(cell.textContent);
    const isSunday = new Date(year, month, date).getDay() === 0;
    const isSaturday = new Date(year, month, date).getDay() === 6;
    const isFourthSaturday = isSaturday && (Math.ceil(date / 7) === 4);
    const isHolidayDate = isHoliday(date);

    if (isSunday || isFourthSaturday) {
        cell.style.backgroundColor = '#e3e3e3'; // Gray for Sundays and Fourth Saturdays
    } else if (isHolidayDate) {
        cell.style.backgroundColor = '#bae2ff'; // Light blue for holidays
    } else {
        cell.style.backgroundColor = getWorkDurationColor(date); // Punch record color
    }
}

// Check if a date has regularization
function hasRegularization(date) {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return regularizationList.some(reg => reg.date === formattedDate);
}

// Dispatch event when a date is selected
function onDateSelect(date) {
    const event = new CustomEvent('dateSelected', {
        detail: { date: date }
    });
    document.dispatchEvent(event);
}

// Handle previous and next month navigation
$('#prev-month').click(function () {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
});

$('#next-month').click(function () {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
});

// Return the selected calendar date in ISO format
export function getSelectedCalendarDate() {
    // Add timezone offset to prevent date from shifting
    const offset = selectedCalendarDate.getTimezoneOffset();
    const adjustedDate = new Date(selectedCalendarDate.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString();
}
