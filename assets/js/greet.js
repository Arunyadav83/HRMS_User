const greetText = document.querySelector(".welcome-content h4");
let greet;

document.addEventListener("DOMContentLoaded", function () {
    greetingFunction();
    greetText.textContent = `${greet}, ${localStorage.getItem("employeeName")}`;
});

const time = new Date().getHours();

function greetingFunction() {
    if (time >= 0 && time < 12) {
        greet = "Good Morning";
    } else if (time >= 12 && time < 18) {
        greet = "Good Afternoon";
    } else {
        greet = "Good Evening";
    }
}