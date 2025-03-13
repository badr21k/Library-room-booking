const GAS_URL = "https://script.google.com/macros/s/AKfycbwExrxcx8ZocUeDcmCYdTIE937a9xh58axms2B7SpwaJL4VxtJYkEcMEOzXjcVr0JXM/exec"; 

function fetchAndCreateDayButtons() {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(response => response.json())
        .then(createDayButtons)
        .catch(error => console.error("Error fetching days:", error));
}

function createDayButtons(days) {
    const daysContainer = document.getElementById('days');
    daysContainer.innerHTML = '';
    days.forEach(day => {
        const button = document.createElement('button');
        button.classList.add('day-button');
        button.textContent = day;
        button.onclick = function() { selectDay(day); };
        daysContainer.appendChild(button);
    });
}

window.addEventListener('load', fetchAndCreateDayButtons);

function selectDay(day) {
    showOverlay();
    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
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
                    slotButton.onclick = function() { selectSlot(slot, slotButton); };
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
    var date = new Date(slotString);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes;
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

    fetch(GAS_URL, {
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
