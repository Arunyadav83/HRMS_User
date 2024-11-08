


$(document).ready(function() {
    // Populate Calendar with days and status
    function generateCalendar() {
        const calendarBody = $('#calendar-body');
        const daysInMonth = 30; // Assume September with 30 days
        let day = 1;

        // Simulate weekly rows
        for (let i = 0; i < 5; i++) {
            let row = '<tr>';
            for (let j = 0; j < 7; j++) {
                if (day <= daysInMonth) {
                    // Assign class based on a condition (e.g., random for this example)
                    let statusClass = getRandomStatusClass();
                    row += `<td class="${statusClass}">${day}<br><span>GEN</span></td>`;
                    day++;
                } else {
                    row += '<td class="text-muted"></td>';
                }
            }
            row += '</tr>';
            calendarBody.append(row);
        }
    }

    // Function to randomly assign status class (present, absent, etc.)
    function getRandomStatusClass() {
        const statusClasses = ['present', 'absent', 'off-day', 'rest-day'];
        return statusClasses[Math.floor(Math.random() * statusClasses.length)];
    }

    // Generate calendar on page load
    generateCalendar();
});










