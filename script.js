const GAS_URL = "https://script.google.com/macros/s/AKfycbwWRfL6RbH9WkmVvkGLimKCTh4LI_459jkLk7oSZW5nSxAsvvxYzZj0r0kcnUHHKVJx/exec"; // Replace with your actual URL

window.addEventListener("load", fetchAndCreateDayButtons);

function getDayIndex(dayName) {
    const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const current = new Date().getDay();
    let index = map[dayName];
    return index < current ? index + 7 : index;
}

function sortDays(days) {
    days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
}

function fetchAndCreateDayButtons() {
    fetch(`${GAS_URL}?action=getActiveDays`)
        .then(res => res.json())
        .then(days => {
            const container = document.getElementById("days");
            container.innerHTML = "";
            sortDays(days);
            days.forEach(day => {
                const btn = document.createElement("button");
                btn.classList.add("day-button");
                btn.textContent = day;
                btn.onclick = () => selectDay(day);
                container.appendChild(btn);
            });
        })
        .catch(err => {
            console.error("Error fetching days:", err);
            showModalAlert("Could not load available days.");
        });
}

function selectDay(day) {
    showOverlay();
    const timeSlotsDiv = document.getElementById("timeSlots");
    timeSlotsDiv.innerHTML = "";
    document.getElementById("noAvailableSlotsMessage").style.display = "none";

    fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
        .then(res => res.json())
        .then(slots => {
            hideOverlay();
            if (!slots.length) {
                document.getElementById("bookingDetails").style.display = "none";
                document.getElementById("noAvailableSlotsMessage").style.display = "block";
            } else {
                timeSlotsDiv.innerHTML = "";
                slots.forEach(slot => {
                    const btn = document.createElement("button");
                    btn.classList.add("slot-button");
                    btn.textContent = formatSlot(slot);
                    btn.onclick = () => selectSlot(slot);
                    timeSlotsDiv.appendChild(btn);
                });
                document.getElementById("bookingDetails").style.display = "block";
            }
        })
        .catch(err => {
            hideOverlay();
            showModalAlert("Error fetching time slots.");
        });
}

function formatSlot(slotString) {
    const d = new Date(slotString);
    let h = d.getHours();
    let m = d.getMinutes();
    return `${h}:${m < 10 ? "0" + m : m}`;
}

function selectSlot(slot) {
    const input = document.getElementById("hiddenSlotInput");
    input.value = slot;
    document.getElementById("bookAppointmentButton").disabled = false;
    document.querySelectorAll(".slot-button").forEach(btn => btn.classList.remove("selected"));
    event.target.classList.add("selected");
}

document.getElementById("bookingDetails").addEventListener("submit", function (e) {
    e.preventDefault();
    showOverlay();
    const data = new FormData(this);
    const json = Object.fromEntries(data.entries());

    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(json),
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then(res => res.json())
        .then(res => {
            hideOverlay();
            showModalAlert(res.message);
            this.reset();
        })
        .catch(err => {
            hideOverlay();
            showModalAlert("Error submitting form.");
        });
});

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
