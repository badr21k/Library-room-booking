const GAS_URL = "https://script.google.com/macros/s/AKfycby_oOLKE1Rzr7_E96i0eZ87Jd3_rw6pqDPY5DlxYDwVD3lhk1cGWRWIBWAtq135SKAP/exec"; // Keep this

function fetchAndCreateDayButtons() {
    fetch(`${GAS_URL}?action=getActiveDays`, {
        method: "GET",
        mode: "no-cors"  // Google Apps Script doesn't support preflight
    })
    .then(response => response.text())
    .then(text => {
        try {
            const days = JSON.parse(text);
            createDayButtons(days);
        } catch (e) {
            console.error("Error parsing days:", e, text);
        }
    })
    .catch(error => console.error("Error fetching days:", error));
}

function createDayButtons(days) {
    const daysContainer = document.getElementById('days');
    daysContainer.innerHTML = '';
    days.forEach(day => {
        const button = document.createElement('button');
        button.classList.add('day-button');
        button.textContent = day;
        button.onclick = () => selectDay(day);
        daysContainer.appendChild(button);
    });
}

function selectDay(day) {
    showOverlay();
    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`, {
        method: "GET",
        mode: "no-cors"
    })
    .then(response => response.text())
    .then(text => {
        hideOverlay();
        try {
            const slots = JSON.parse(text);
            const slotsContainer = document.getElementById('timeSlots');
            slotsContainer.innerHTML = '';
            if (slots.length === 0) {
                document.getElementById('noAvailableSlotsMessage').style.display = 'block';
            } else {
                document.getElementById('noAvailableSlotsMessage').style.display = 'none';
                slots.forEach(slot => {
                    const slotButton = document.createElement('button');
                    slotButton.classList.add('slot-button');
                    slotButton.textContent = formatSlot(slot);
                    slotButton.onclick = () => selectSlot(slot, slotButton);
                    slotsContainer.appendChild(slotButton);
                });
            }
        } catch (e) {
            console.error("Error parsing slots:", e, text);
        }
    })
    .catch(error => {
        hideOverlay();
        console.error('Error fetching slots:', error);
    });
}

function formatSlot(slotString) {
    const date = new Date(slotString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    return `${hours}:${minutes}`;
}

function selectSlot(slot, button) {
    document.querySelectorAll('.slot-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    document.getElementById('hiddenSlotInput').value = slot;
    document.getElementById('bookAppointmentButton').disabled = false;
}

document.getElementById('bookingDetails').addEventListener('submit', function(event) {
    event.preventDefault();
    showOverlay();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors", // Again: prevent CORS preflight issues
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        hideOverlay();
        showModalAlert("Appointment booked successfully. Please check your email for confirmation.");
        document.getElementById('bookingDetails').reset();
    })
    .catch(error => {
        hideOverlay();
        showModalAlert("Error: " + error.message);
    });
});

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

// Load on page ready
window.addEventListener('load', fetchAndCreateDayButtons);
