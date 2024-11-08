
function fetchAllHolidaysList() {
    fetch("http://localhost:8082/api/holiday")
        .then(response => response.json())
        .then(data => {
            displayHolidaysList(data);            
        })
        .catch(error => console.error("Error fetching holiday data:", error));
}

document.addEventListener("DOMContentLoaded", function () {
    fetchAllHolidaysList();
});

function displayHolidaysList(holidays) {
    const holidayTable = document.getElementById("holidaysTable");
    holidayTable.innerHTML = "";

    holidays.forEach((holiday, index) => {
        const row = holidayTable.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${holiday.holidayName}</td>
            <td>${holiday.holidayDate}</td>
            <td>${holiday.day}</td>
        `;
    });
}