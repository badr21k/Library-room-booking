const GAS_URL = "https://script.google.com/macros/s/AKfycbzShSu_qnClCjZ51Ks70g7RRASInrKmjzWpS0kDM3r7PIeU-cojud-YYnSbdGUZIL6u/exec";

function getDayIndex(dayName) {
    const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    let today = new Date().getDay();
    let day = map[dayName];
    return day < today ? day + 7 : day;
}

function sortDays(days) {
    return days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
}

function fetchAndCreateDayButtons() {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(res => res.json())
        .then(days => {
            const sorted = sortDays(days);
            const container = document.getElementById('days');
            container.innerHTML = '';
            sorted.forEach(day => {
                const btn = document.createElement('button');
                btn.textContent = day;
                btn.className = 'day-button';
                btn.onclick = () => selectDay(day);
                container.appendChild(btn);
            });
        })
        .catch(err => console.error("Error fetching days:", err));
}

function selectDay(day) {
    showOverlay();
    const slotsContainer = document.getElementById('timeSlots');
    slotsContainer.innerHTML = '';
    document.getElementById('noAvailableSlotsMessage').style.display = 'none';

    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
        .then(res => res.json())
        .then(slots => {
            hideOverlay();
            if (slots.length === 0) {
                document.getElementById('bookingDetails').style.display = 'none';
                document.getElementById('noAvailableSlotsMessage').style.display = 'block';
            } else {
                document.getElementById('bookingDetails').style.display = 'block';
                slots.forEach(slot => {
                    const btn = document.createElement('button');
                    btn.className = 'slot-button';
                    btn.textContent = formatSlot(slot);
                    btn.onclick = () => selectSlot(slot, btn);
                    slotsContainer.appendChild(btn);
                });
            }
        })
        .catch(err => {
            hideOverlay();
            console.error("Error fetching slots:", err);
        });
}

function formatSlot(slot) {
    const d = new Date(slot);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function selectSlot(slot, button) {
    document.querySelectorAll('.slot-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    document.getElementById('hiddenSlotInput').value = slot;
    document.getElementById('bookAppointmentButton').disabled = false;
}

document.getElementById('bookingDetails').addEventListener('submit', function(e) {
    e.preventDefault();
    showOverlay();

    const slot = document.getElementById('hiddenSlotInput').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const studentId = document.getElementById('studentId').value;

    fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            slot, fullName, email, studentId, accessibility: "No"
        })
    })
    .then(res => res.json())
    .then(data => {
        hideOverlay();
        showModalAlert(data.message);
        document.getElementById('bookingDetails').reset();
    })
    .catch(err => {
        hideOverlay();
        showModalAlert("Error: " + err.message);
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
    document.getElementById('alertModal').style.display = 'flex';
}
function closeModal() {
    document.getElementById('alertModal').style.display = 'none';
}

window.addEventListener('load', fetchAndCreateDayButtons);
