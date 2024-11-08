
function fetchHolidaysList() {
    fetch("http://localhost:8082/api/holiday")
    .then(response => response.json())
    .then(data => {
        displayUpcomingHolidays(data);            
    })
    .catch(error => console.error("Error fetching holiday data:", error));
}

document.addEventListener("DOMContentLoaded", function () {
    fetchHolidaysList();
});

// Get today's date
const today = new Date();
const currentMonth = today.getMonth() + 1; // JavaScript months are zero-indexed (January is 0), so we add 1
const currentYear = today.getFullYear();

function displayUpcomingHolidays(holidays) {
    // Filter holidays that are within the current month and year
    const currentMonthHolidays = holidays.filter(holiday => {
        const day = holiday.holidayDate.slice(0, 2);      // Extract day
        const month = holiday.holidayDate.slice(3, 5);    // Extract month
        const year = holiday.holidayDate.slice(6);        // Extract year

        // Convert month and year to numbers and compare
        return parseInt(month, 10) === currentMonth && parseInt(year, 10) === currentYear;
    });

    // Get the container to display the holidays
    const holidayContainer = document.getElementById("upcomingHoliday");

    // Check if there are any holidays in the current month
    if (currentMonthHolidays.length > 0) {
        // Generate HTML for each holiday in the current month
        holidayContainer.innerHTML = currentMonthHolidays.map(holiday => `
        <div class="holiday-calendar">
            <div class="holiday-calendar-icon">
                <img src="assets/img/icons/holiday-calendar.svg" alt="Icon" />
            </div>
            <div class="holiday-calendar-content">
                <h6>${holiday.holidayName}</h6>
                <p>${holiday.holidayDate}</p> <!-- Display the holiday date directly -->
            </div>
        </div>
      `).join('');
    } else {
        // Display a message if no holidays are found for the current month
        holidayContainer.innerHTML = `<p style="color: white">No holidays this month</p>`;
    }
}
