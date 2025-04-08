const GAS_URL = "https://script.google.com/macros/s/AKfycbytc5Eg8ViKEmehR3CofU7cM-63me2bbbnRcOfccBHRUAtJLdvWREdEzeYUav6jowvM/exec"; // Replace this with your live Web App URL

function getDayIndex(dayName) {
    const map = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const currentDay = new Date().getDay();
    let index = map[dayName];
    return index < currentDay ? index + 7 : index;
}

function sortDays(days) {
    days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
}

function fetchAndCreateDayButtons() {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(res => res.json())
        .then(data => {
            sortDays(data);
            const daysContainer = document.getElementById('days');
            daysContainer.innerHTML = '';
            data.forEach(day => {
                const button = document.createElement('button');
                button.classList.add('day-button');
                button.textContent = day;
                button.onclick = () => selectDay(day);
                daysContainer.appendChild(button);
            });
        })
        .catch(err => console.error("Error fetching days:", err));
}

window.addEventListener('load', fetchAndCreateDayButtons);

function showOverlay() {
    document.getElementById('overlay').style.display = 'flex';
}

function hideOverlay() {
    document.getElementById('overlay').style.display = 'none';
}

function showModalAlert(msg) {
    document.getElementById('alertModalText').textContent = msg;
    document.getElementById('alertModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('alertModal').style.display = 'none';
}

function selectDay(day) {
    showOverlay();
    document.getElementById('noAvailableSlotsMessage').style.display = 'none';
    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
        .then(res => res.json())
        .then(slots => {
            hideOverlay();
            const container = document.getElementById('timeSlots');
            container.innerHTML = '';

            if (slots.length === 0) {
                document.getElementById('bookingDetails').style.display = 'none';
                document.getElementById('noAvailableSlotsMessage').style.display = 'block';
                return;
            }

            slots.forEach(slot => {
                const btn = document.createElement('button');
                btn.classList.add('slot-button');
                btn.textContent = formatSlot(slot);
                btn.onclick = () => selectSlot(slot, btn);
                container.appendChild(btn);
            });

            document.getElementById('bookingDetails').style.display = 'block';
        })
        .catch(err => {
            hideOverlay();
            showModalAlert("Error fetching slots: " + err.message);
        });
}

function formatSlot(slotString) {
    const date = new Date(slotString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function selectSlot(slot, btn) {
    document.querySelectorAll('.slot-button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('hiddenSlotInput').value = slot;
    document.getElementById('bookAppointmentButton').disabled = false;
}

document.getElementById('bookingDetails').addEventListener('submit', function(e) {
    e.preventDefault();
    showOverlay();

    const formData = new FormData(this);
    const data = {
        slot: formData.get("slot"),
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        studentId: formData.get("studentId"),
        accessibility: formData.get("consent") ? "Yes" : "No"
    };

    fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        hideOverlay();
        showModalAlert(response.message);
        document.getElementById('bookingDetails').reset();
        document.getElementById('bookAppointmentButton').disabled = true;
    })
    .catch(err => {
        hideOverlay();
        showModalAlert("Error: " + err.message);
    });
});
