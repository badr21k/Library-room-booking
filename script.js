const GAS_URL = "https://script.google.com/macros/s/AKfycbxfhGHyBGwdBWl33ZkOmnmHGq8cuNmBw0gQQMErbpCFzIEXswvfccfTktDTw3Nf8hoS/exec"; // Replace with your actual deployed Apps Script URL

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
    fetch(`${GAS_URL}?action=getActiveDays`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
    .then(response => {
        if (!response.ok) throw new Error("Network response was not OK");
        return response.json();
    })
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
    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(slots => {
        hideOverlay();
        const slotsContainer = document.getElementById('timeSlots');
        slotsContainer.innerHTML = '';

        if (slots.length === 0) {
            document.getElementById('noAvailableSlotsMessage').style.display = 'block';
        } else {
            slots.forEach(slot => {
                const slotButton = document.createElement('button');
                slotButton.classList.add('slot-button');
                slotButton.textContent = formatSlot(slot);
                slotButton.onclick = function() { selectSlot(slot); };
                slotsContainer.appendChild(slotButton);
            });
        }
    })
    .catch(error => {
        hideOverlay();
        console.error('Error fetching slots:', error);
    });
}

function formatSlot(slotString) {
    const date = new Date(slotString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function selectSlot(slot) {
    document.getElementById('hiddenSlotInput').value = slot;
    document.getElementById('bookAppointmentButton').disabled = false;
}

document.getElementById('bookingDetails').addEventListener('submit', function(event) {
    event.preventDefault();
    showOverlay();

    const formData = new FormData(this);
    const jsonData = Object.fromEntries(formData);

    fetch(`${GAS_URL}?action=bookAppointment`, {
        method: "POST",
        body: JSON.stringify(jsonData),
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
