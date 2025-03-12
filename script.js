const GAS_URL = "YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_URL"; // Replace this

document.addEventListener("DOMContentLoaded", function () {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(response => response.json())
        .then(days => {
            const daysContainer = document.getElementById("days");
            days.forEach(day => {
                const button = document.createElement("button");
                button.textContent = day;
                button.addEventListener("click", () => selectDay(day));
                daysContainer.appendChild(button);
            });
        });
});

function selectDay(day) {
    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
        .then(response => response.json())
        .then(slots => {
            const slotsContainer = document.getElementById("timeSlots");
            slotsContainer.innerHTML = "";
            slots.forEach(slot => {
                const button = document.createElement("button");
                button.textContent = new Date(slot).toLocaleTimeString();
                button.addEventListener("click", () => selectSlot(slot));
                slotsContainer.appendChild(button);
            });
        });
}

function selectSlot(slot) {
    document.getElementById("hiddenSlotInput").value = slot;
}

document.getElementById("bookingDetails").addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    fetch(`${GAS_URL}?action=bookAppointment`, {
        method: "POST",
        body: formData,
    })
        .then(response => response.text())
        .then(message => alert(message));
});
