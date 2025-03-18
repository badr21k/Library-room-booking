const GAS_URL = "https://script.google.com/macros/s/AKfycbwv3tzXHIuUiy0KFGj8S23JL_MIBbB5XDya0dZo5_I87F2bRnAHu5h2jOqkLH2Kszbc/exec"; // Replace with your Apps Script URL

function getDayIndex(dayName) {
    const dayOfWeekMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const currentDayIndex = new Date().getDay();
    let dayIndex = dayOfWeekMap[dayName];
    if (dayIndex < currentDayIndex) {
        dayIndex += 7;
    }
    return dayIndex;
}

function sortDays(days) {
    days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
}

function fetchAndCreateDayButtons() {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(response => response.json())
        .then(createDayButtons)
        .catch(error => console.error("Error fetching days:", error));
}

function createDayButtons(days) {
    const daysContainer = document.getElementById('days');
    daysContainer.innerHTML = '';
    sortDays(days);
    days.forEach(day => {
        const button = document.createElement('button');
        button.classList.add('day-button');
        button.textContent = day;
        button.onclick = function() { selectDay(day); };
        daysContainer.appendChild(button);
    });
}

window.addEventListener('load', fetchAndCreateDayButtons);

function showOverlay() {
    document.getElementById('overlay').style.display = 'flex';
}

function hideOverlay() {
    document.getElementById('overlay').style.display = 'none';
}

function showModalAlert(message) {
    document.getElementById('alertModalText').textContent = message;
    document.getElementById('alertModal').style.display = "flex";
}

function closeModal() {
    document.getElementById('alertModal').style.display = "none";
}

function selectDay(day) {
    showOverlay();
    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
        .then(response => response.json())
        .then(slots => {
            hideOverlay();
            const slotsContainer = document.getElementById('timeSlots');
            slotsContainer.innerHTML = '';
            if (slots.length === 0) {
                document.getElementById('bookingDetails').style.display = 'none';
                document.getElementById('noAvailableSlotsMessage').style.display = 'block';
            } else {
                slots.forEach(slot => {
                    const slotButton = document.createElement('button');
                    slotButton.classList.add('slot-button');
                    slotButton.textContent = formatSlot(slot);
                    slotButton.onclick = function() { selectSlot(slot, day); };
                    slotsContainer.appendChild(slotButton);
                });
                document.getElementById('bookingDetails').style.display = 'block';
            }
        })
        .catch(error => {
            hideOverlay();
            console.error('Error fetching slots:', error);
        });
}

function formatSlot(slotString) {
    var date = new Date(slotString);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes;
}

function selectSlot(slot) {
    document.getElementById('hiddenSlotInput').value = slot;
    document.getElementById('bookAppointmentButton').disabled = false;
}

document.getElementById('bookingDetails').addEventListener('submit', function(event) {
    event.preventDefault();
    showOverlay();
    const formData = new FormData(this);

    fetch(`${GAS_URL}?action=bookAppointment`, {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        hideOverlay();
        showModalAlert(data.message);
        document.getElementById('bookingDetails').reset();
    })
    .catch(error => {
        hideOverlay();
        showModalAlert("Error: " + error.message);
    });
});
