const GAS_URL = "https://script.google.com/macros/s/AKfycbz7wOaYJWxjvwTZC8HGxLp-4GTXWeqAQN2RYHnxLhj6LkWmcSXaIrKx3MIj8sy2fjzd/exec";

/** on page load, fetch days */
window.addEventListener("load", () => {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(r => r.json())
        .then(days => {
            sortDays(days);
            const container = document.getElementById("days");
            container.innerHTML = "";
            days.forEach(day => {
                const btn = document.createElement("button");
                btn.classList.add("day-button");
                btn.textContent = day;
                btn.onclick = () => selectDay(day);
                container.appendChild(btn);
            });
        })
        .catch(err => {
            console.error(err);
            showModalAlert("Could not load available days.");
        });
});

function sortDays(days) {
    days.sort((a, b) => {
        const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
        const current = new Date().getDay();
        const indexA = map[a] < current ? map[a] + 7 : map[a];
        const indexB = map[b] < current ? map[b] + 7 : map[b];
        return indexA - indexB;
    });
}

function selectDay(day) {
    showOverlay();
    document.getElementById("timeSlots").innerHTML = "";
    document.getElementById("noAvailableSlotsMessage").style.display = "none";

    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
        .then(r => r.json())
        .then(slots => {
            hideOverlay();
            if (!slots.length) {
                document.getElementById("bookingDetails").style.display = "none";
                document.getElementById("noAvailableSlotsMessage").style.display = "block";
            } else {
                const container = document.getElementById("timeSlots");
                slots.forEach(slot => {
                    const btn = document.createElement("button");
                    btn.classList.add("slot-button");
                    btn.textContent = formatSlot(slot);
                    btn.onclick = () => selectSlot(slot, btn);
                    container.appendChild(btn);
                });
                document.getElementById("bookingDetails").style.display = "block";
            }
        })
        .catch(err => {
            hideOverlay();
            console.error(err);
            showModalAlert("Error fetching time slots.");
        });
}

function formatSlot(isoString) {
    const d = new Date(isoString);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
}

function selectSlot(slot, button) {
    document.getElementById("hiddenSlotInput").value = slot;
    document.querySelectorAll(".slot-button").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    document.getElementById("bookAppointmentButton").disabled = false;
}

document.getElementById("bookingDetails").addEventListener("submit", function(e) {
    e.preventDefault();
    showOverlay();

    const fd = new FormData(this);
    const payload = Object.fromEntries(fd.entries());

    fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
        hideOverlay();
        showModalAlert(res.message || "Appointment booked.");
        this.reset();
    })
    .catch(err => {
        hideOverlay();
        console.error(err);
        showModalAlert("Error booking appointment.");
    });
});

/* HELPER: Show/hide overlay, show modals, etc. */
function showOverlay() {
    document.getElementById("overlay").style.display = "flex";
}
function hideOverlay() {
    document.getElementById("overlay").style.display = "none";
}
function showModalAlert(msg) {
    document.getElementById("alertModalText").textContent = msg;
    document.getElementById("alertModal").style.display = "flex";
}
function closeModal() {
    document.getElementById("alertModal").style.display = "none";
}
