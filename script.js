const GAS_URL = "https://script.google.com/macros/s/AKfycbxBO843Z7yPUDcxYDqyxjqLcz5BefdHoVGp3z8Mn_aX4pnwHpH_R4RUhOdyIeFzbRG0/exec";

window.addEventListener("load", fetchAndCreateDayButtons);

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
    .catch(() => showModalAlert("Could not load available days."));
}

function getDayIndex(dayName) {
  const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const current = new Date().getDay();
  let index = map[dayName];
  return index < current ? index + 7 : index;
}

function sortDays(days) {
  days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
}

function selectDay(day) {
  showOverlay();
  const slotContainer = document.getElementById("timeSlots");
  slotContainer.innerHTML = "";
  document.getElementById("noAvailableSlotsMessage").style.display = "none";

  fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
    .then(res => res.json())
    .then(slots => {
      hideOverlay();
      if (!slots.length) {
        document.getElementById("bookingDetails").style.display = "none";
        document.getElementById("noAvailableSlotsMessage").style.display = "block";
      } else {
        slots.forEach(slot => {
          const btn = document.createElement("button");
          btn.classList.add("slot-button");
          btn.textContent = formatSlot(slot);
          btn.onclick = () => selectSlot(slot);
          slotContainer.appendChild(btn);
        });
        document.getElementById("bookingDetails").style.display = "block";
      }
    })
    .catch(() => {
      hideOverlay();
      showModalAlert("Could not load time slots.");
    });
}

function formatSlot(slot) {
  const d = new Date(slot);
  let h = d.getHours();
  let m = d.getMinutes();
  return `${h}:${m < 10 ? "0" + m : m}`;
}

function selectSlot(slot) {
  document.getElementById("hiddenSlotInput").value = slot;
  document.getElementById("bookAppointmentButton").disabled = false;
  document.querySelectorAll(".slot-button").forEach(b => b.classList.remove("selected"));
  event.target.classList.add("selected");
}

document.getElementById("bookingDetails").addEventListener("submit", function (e) {
  e.preventDefault();
  showOverlay();
  const formData = new FormData(this);
  const payload = Object.fromEntries(formData.entries());

  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(res => {
      hideOverlay();
      showModalAlert(res.message || "Success");
      this.reset();
    })
    .catch(() => {
      hideOverlay();
      showModalAlert("Failed to submit form.");
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
