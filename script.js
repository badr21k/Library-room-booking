const GAS_URL = "https://script.google.com/macros/s/AKfycbwDU2aIAAnXS-AWlZRqqYVVLFKSl_LTcrSEiRTnZcPdGU3YO6rael0RLPpZWcRpA_cX/exec";

window.addEventListener("load", fetchAndCreateDayButtons);

function fetchAndCreateDayButtons() {
  fetch(`${GAS_URL}?action=getActiveDays`)
    .then(res => res.json())
    .then(days => {
      if (days.error) {
        showModalAlert(days.error);
        return;
      }
      const container = document.getElementById("days");
      container.innerHTML = "";
      sortDays(days);
      days.forEach(d => {
        const btn = document.createElement("button");
        btn.classList.add("day-button");
        btn.textContent = d;
        btn.onclick = () => selectDay(d);
        container.appendChild(btn);
      });
    })
    .catch(err => showModalAlert("Error fetching days: " + err));
}

function getDayIndex(dayName) {
  const map = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
  const current = new Date().getDay();
  let index = map[dayName];
  return index < current ? index + 7 : index;
}
function sortDays(days) {
  days.sort((a,b)=> getDayIndex(a)-getDayIndex(b));
}

function selectDay(day) {
  showOverlay();
  document.getElementById("timeSlots").innerHTML="";
  document.getElementById("noAvailableSlotsMessage").style.display="none";

  fetch(`${GAS_URL}?action=getAvailableSlots&day=${encodeURIComponent(day)}`)
    .then(r=>r.json())
    .then(obj=>{
      hideOverlay();
      if(obj.error) {
        showModalAlert(obj.error);
        return;
      }
      if(!obj.length) {
        document.getElementById("bookingDetails").style.display="none";
        document.getElementById("noAvailableSlotsMessage").style.display="block";
      } else {
        document.getElementById("bookingDetails").style.display="block";
        const container = document.getElementById("timeSlots");
        obj.forEach(slot=>{
          const btn = document.createElement("button");
          btn.classList.add("slot-button");
          btn.textContent = formatSlot(slot);
          btn.onclick = () => selectSlot(slot, btn);
          container.appendChild(btn);
        });
      }
    })
    .catch(err=>{
      hideOverlay();
      showModalAlert("Error fetching slots: " + err);
    });
}

function formatSlot(isoString) {
  const d=new Date(isoString);
  const h=d.getHours();
  const m = String(d.getMinutes()).padStart(2,"0");
  return `${h}:${m}`;
}

function selectSlot(slot, button) {
  document.querySelectorAll(".slot-button").forEach(b=>b.classList.remove("selected"));
  button.classList.add("selected");
  document.getElementById("hiddenSlotInput").value=slot;
  document.getElementById("bookAppointmentButton").disabled=false;
}

document.getElementById("bookingDetails").addEventListener("submit",function(e){
  e.preventDefault();
  showOverlay();
  const fd=new FormData(this);
  const payload=Object.fromEntries(fd.entries());

  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(r=>r.json())
  .then(resp=>{
    hideOverlay();
    if(resp.error) showModalAlert(resp.error);
    else if(resp.message) showModalAlert(resp.message);
    this.reset();
    document.querySelectorAll(".slot-button").forEach(b=>b.classList.remove("selected"));
    document.getElementById("bookAppointmentButton").disabled=true;
  })
  .catch(err=>{
    hideOverlay();
    showModalAlert("Error booking: "+err);
  });
});

function showOverlay() {
  document.getElementById("overlay").style.display="flex";
}
function hideOverlay() {
  document.getElementById("overlay").style.display="none";
}
function showModalAlert(msg){
  document.getElementById("alertModalText").textContent=msg;
  document.getElementById("alertModal").style.display="flex";
}
function closeModal(){
  document.getElementById("alertModal").style.display="none";
}
