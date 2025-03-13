 function getDayIndex(dayName) {
        const dayOfWeekMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
        const currentDayIndex = new Date().getDay();
        let dayIndex = dayOfWeekMap[dayName];
        if (dayIndex < currentDayIndex) {
            dayIndex += 7;
        }
        return dayIndex;
    }

    function sortDays(days) {
        days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
    }

    function fetchAndCreateDayButtons() {
        google.script.run.withSuccessHandler(createDayButtons).getActiveDays();
    }

    function createDayButtons(days) {
        const daysContainer = document.getElementById('days');
        daysContainer.innerHTML = '';
        sortDays(days);

        days.forEach(day => {
            const button = document.createElement('button');
            button.classList.add('day-button');
            button.textContent = day;
            button.onclick = function() { selectDay(day); };
            daysContainer.appendChild(button);
        });
    }

    window.addEventListener('load', fetchAndCreateDayButtons);

    function showOverlay() {
        document.getElementById('overlay').style.display = 'flex';
    }

    function hideOverlay() {
        document.getElementById('overlay').style.display = 'none';
    }

    function showModalAlert(message) {
        var modal = document.getElementById('alertModal');
        var modalText = document.getElementById('alertModalText');
        modalText.textContent = message;
        modal.style.display = "flex";
    }

    function closeModal() {
        var modal = document.getElementById('alertModal');
        modal.style.display = "none";
    }

    function hideModal() {
        var modal = document.getElementById('alertModal');
        modal.style.display = "none";
    }

    window.onload = function() {
        hideModal();
        var closeButton = document.getElementsByClassName('close-button')[0];
        closeButton.onclick = function() {
            hideModal();
        };
        window.onclick = function(event) {
            var modal = document.getElementById('alertModal');
            if (event.target === modal) {
                hideModal();
            }
        };
    };

    function selectDay(day) {
        showOverlay();
        const slotsContainer = document.getElementById('timeSlots');
        slotsContainer.innerHTML = '';
        const noSlotsMessage = document.getElementById('noAvailableSlotsMessage');
        noSlotsMessage.style.display = 'none';

        google.script.run.withSuccessHandler(function(slots) {
            hideOverlay();

            if (slots.length === 0) {
                document.getElementById('bookingDetails').style.display = 'none';
                noSlotsMessage.innerHTML = `<p>There are no available appointments for ${day}. Please check back later.</p>`;
                noSlotsMessage.style.display = 'block';
            } else {
                slotsContainer.style.display = 'block';
                slots.forEach(function(slot) {
                    const slotButton = document.createElement('button');
                    slotButton.classList.add('slot-button');
                    slotButton.textContent = formatSlot(slot);
                    slotButton.onclick = function() { selectSlot(slot, day); };
                    slotsContainer.appendChild(slotButton);
                });
                document.getElementById('bookingDetails').style.display = 'block';
            }
        }).withFailureHandler(function(error) {
            hideOverlay();
            console.error('Error fetching slots:', error);
        }).getAvailableSlots(day);
    }

    function formatSlot(slotString) {
        var date = new Date(slotString);
        var hours = date.getHours(); // Use getHours() to avoid UTC conversion
        var minutes = date.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes;
        return strTime;
    }

    function generateTimeSlots() {
        let slots = [];

        const daysSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Days');
        const daysData = daysSheet.getDataRange().getValues();
        const activeDays = daysData.reduce((acc, row) => {
            if (row[1].toString().toLowerCase() === 'true') {
                acc.push(row[0]);
            }
            return acc;
        }, []);

        const activeDaysMap = activeDays.reduce((acc, day) => {
            acc[day] = true;
            return acc;
        }, {});

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 6);

        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayName = Utilities.formatDate(d, Session.getScriptTimeZone(), "EEEE");
            if (activeDaysMap[dayName]) {
                for (let hour = 11; hour <= 17; hour++) {
                    let limitMinute = hour === 17 ? 57 : 59;
                    for (let minute = 0; minute <= limitMinute; minute += 3) {
                        let time = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
                        let slotString = Utilities.formatDate(time, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
                        slots.push(slotString);
                    }
                }
            }
        }

        return slots;
    }

    function selectSlot(slot, day) {
        const date = new Date(slot);

        // Format the date and time as you wish to display it
        const formattedSlotDate = date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Toronto' // Ensure the correct timezone is set
        });

        const selectedSlotDisplay = document.getElementById('selectedSlotDisplay') || document.createElement('div');
        selectedSlotDisplay.id = 'selectedSlotDisplay';
        selectedSlotDisplay.textContent = `Selected slot: ${formattedSlotDate}`;
        const bookingDetails = document.getElementById('bookingDetails');
        bookingDetails.insertBefore(selectedSlotDisplay, bookingDetails.firstChild);

        const hiddenSlotInput = document.getElementById('hiddenSlotInput');
        hiddenSlotInput.value = slot;

        document.querySelectorAll('.slot-button').forEach(button => {
            button.style.display = 'none';
        });

        document.getElementById('bookAppointmentButton').disabled = false;
    }

    document.getElementById('bookingDetails').addEventListener('submit', function(event) {
        event.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        const slot = document.getElementById('hiddenSlotInput').value;
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const studentId = document.getElementById('studentId').value;

        const accessibilityRadioButtons = document.getElementsByName('accessibility');
        let accessibilityValue = 'No';
        for (const radioButton of accessibilityRadioButtons) {
            if (radioButton.checked) {
                accessibilityValue = radioButton.value;
                break;
            }
        }

        if (!slot) {
            showModalAlert('Please select a slot before booking an appointment.');
            return;
        }

        document.getElementById('overlay').style.display = 'flex';
        submitButton.disabled = true;

        google.script.run
            .withSuccessHandler(function(response) {
                hideOverlay();
                showModalAlert(response);
                document.getElementById('bookingDetails').reset();
                submitButton.disabled = false;
            })
            .withFailureHandler(function(error) {
                hideOverlay();
                showModalAlert('Error: ' + error.message);
                submitButton.disabled = false;
            })
            .bookAppointment(slot, fullName, email, studentId, accessibilityValue);
    });
