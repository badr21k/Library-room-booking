/******************************************************
 * script.js
 * 
 * 1) Include this file in index.html:
 *    <script src="script.js"></script>
 * 2) Ensure your HTML has matching IDs ("days", "timeSlots", "overlay", etc.)
 ******************************************************/

const GAS_URL = "/api/proxy"; // Points to the Vercel proxy endpoint

/** On window load, fetch and display active days. */
window.addEventListener("load", fetchAndCreateDayButtons);

/**
 * fetchAndCreateDayButtons:
 *  - Calls ?action=getActiveDays via the proxy
 *  - Creates day buttons in the "days" container
 */
function fetchAndCreateDayButtons() {
  fetch(`${GAS_URL}?action=getActiveDays`)
    .then(response => response.json())
    .then(days => {
      if (days.error) {
        showModalAlert("Error: " + days.error);
        return;
      }
      const daysContainer = document.getElementById("days");
      daysContainer.innerHTML = "";
      days.forEach(day => {
        const button = document.createElement("button");
        button.classList.add("day-button");
        button.textContent = day;
        button.onclick = () => selectDay(day);
        daysContainer.appendChild(button);
      });
    })
    .catch(error => {
      showModalAlert("Failed to load days: " + error);
      console.error(error);
    });
}

/**
 * selectDay(day):
 *  - Shows overlay
 *  - Fetches ?action=getAvailableSlots&day=... via the proxy
 *  - Displays time slots or "no slots" message
 */
function selectDay(day) {
  showOverlay();
  const slotsContainer = document.getElementById("timeSlots");
  slotsContainer.innerHTML = "";
  document.getElementById("noAvailableSlotsMessage").style.display = "none";

  fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
    .then(response => response.json())
    .then(slots => {
      hideOverlay();
      if (slots.error) {
        showModalAlert("Error: " + slots.error);
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
      showModalAlert("Error fetching slots: " + error);
      console.error(error);
    });
}

/**
 * formatSlot(slotString):
 *  - Format the ISO date string (yyyy-mm-ddThh:mm:ssZ)
 *  - Return "hh:mm" for UI
 */
function formatSlot(slotString) {
  const date = new Date(slotString);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * selectSlot(slot, button):
 *  - Highlights the chosen time slot
 *  - Stores slot in hidden input
 *  - Enables the Book button
 */
function selectSlot(slot, button) {
  document.querySelectorAll(".slot-button").forEach(btn => btn.classList.remove("selected"));
  button.classList.add("selected");
  document.getElementById("hiddenSlotInput").value = slot;
  document.getElementById("bookAppointmentButton").disabled = false;
}

/**
 * Booking form submission:
 *  - Reads form data
 *  - POSTs to the proxy
 *  - Shows success/failure in modal
 */
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
    .then(response => response.json())
    .then(data => {
      hideOverlay();
      if (data.error) {
        showModalAlert("Error: " + data.error);
      } else if (data.message) {
        showModalAlert(data.message);
        this.reset();
        document.querySelectorAll(".slot-button").forEach(b => b.classList.remove("selected"));
        document.getElementById("bookAppointmentButton").disabled = true;
      } else {
        showModalAlert("Unknown response");
      }
    })
    .catch(error => {
      hideOverlay();
      showModalAlert("Error booking: " + error);
      console.error(error);
    });
});

/******************************************************
 * Modal / Overlay logic
 ******************************************************/

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
