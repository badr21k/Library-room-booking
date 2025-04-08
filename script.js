// script.js
// Include this in your index.html: <script src="script.js"></script>
// Make sure your HTML has these IDs: "days", "timeSlots", "overlay", "bookingDetails", "noAvailableSlotsMessage", "alertModal", "alertModalText", "bookAppointmentButton", "hiddenSlotInput"

const GAS_URL = "/api/proxy"; // Points to your Vercel proxy endpoint

// When the page loads, fetch and show the days
window.addEventListener("load", fetchAndCreateDayButtons);

// Fetches active days from the proxy and creates buttons for them
function fetchAndCreateDayButtons() {
  fetch(`${GAS_URL}?action=getActiveDays`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(days => {
      if (days.error) {
        showModalAlert("Error fetching days: " + days.error);
        return;
      }
      const daysContainer = document.getElementById("days");
      daysContainer.innerHTML = ""; // Clear existing content
      days.forEach(day => {
        const button = document.createElement("button");
        button.classList.add("day-button");
        button.textContent = day;
        button.onclick = () => selectDay(day);
        daysContainer.appendChild(button);
      });
    })
    .catch(error => {
      showModalAlert("Failed to load days: " + error.message);
      console.error("Error in fetchAndCreateDayButtons:", error);
    });
}

// Shows overlay and fetches available slots for the selected day
function selectDay(day) {
  showOverlay();
  const slotsContainer = document.getElementById("timeSlots");
  slotsContainer.innerHTML = "";
  document.getElementById("noAvailableSlotsMessage").style.display = "none";

  fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(slots => {
      hideOverlay();
      if (slots.error) {
        showModalAlert("Error fetching slots: " + slots.error);
        return;
      }
      if (!slots.length) {
        document.getElementById("bookingDetails").style.display = "none";
        document.getElementById("noAvailableSlotsMessage").style.display = "block";
      } else {
        document.getElementById("bookingDetails").style.display = "block";
        slots.forEach(slot => {
          const slotButton = document.createElement("button");
          slotButton.classList.add("slot-button");
          slotButton.textContent = formatSlot(slot);
          slotButton.onclick = () => selectSlot(slot, slotButton);
          slotsContainer.appendChild(slotButton);
        });
      }
    })
    .catch(error => {
      hideOverlay();
      showModalAlert("Failed to load slots: " + error.message);
      console.error("Error in selectDay:", error);
    });
}

// Formats an ISO date string (e.g., "2025-03-12T14:30:00Z") to "14:30"
function formatSlot(slotString) {
  const date = new Date(slotString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Highlights the selected slot, hides other slots, and displays selected date and time
function selectSlot(slot, button) {
  const slotsContainer = document.getElementById("timeSlots");
  slotsContainer.innerHTML = ""; // Clear all slots

  const selectedSlotDisplay = document.createElement("div");
  selectedSlotDisplay.classList.add("selected-slot-display");

  const slotDate = new Date(slot);
  const formattedDate = slotDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const formattedTime = slotDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  selectedSlotDisplay.textContent = `You selected: ${formattedDate} at ${formattedTime}`;
  slotsContainer.appendChild(selectedSlotDisplay);

  document.getElementById("hiddenSlotInput").value = slot;
  document.getElementById("bookAppointmentButton").disabled = false;
}

// Handles form submission for booking
document.getElementById("bookingDetails").addEventListener("submit", function(event) {
  event.preventDefault();
  showOverlay();

  const formData = new FormData(this);
  const payload = Object.fromEntries(formData.entries());

  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      hideOverlay();
      if (data.error) {
        showModalAlert("Booking failed: " + data.error);
      } else if (data.message) {
        showModalAlert(data.message);
        this.reset();
        document.querySelectorAll(".slot-button").forEach(btn => btn.classList.remove("selected"));
        document.getElementById("bookAppointmentButton").disabled = true;
      } else {
        showModalAlert("Booking completed, but no message received.");
      }
    })
    .catch(error => {
      hideOverlay();
      showModalAlert("Booking error: " + error.message);
      console.error("Error in booking:", error);
    });
});

// Overlay and modal functions
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
