/* script.js - Pratheek's Gesture Logic */

// 1. Dynamic Favicon
function updateFavicon() { 
  const favicon = document.getElementById('favicon');
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    favicon.href = '/shop/images/airtel.png';
  } else {
    favicon.href = '/shop/images/airtel.png';
  }
}
updateFavicon();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateFavicon);

// 2. Tab Switching
function showForm(formType) {
    const newSimForm = document.getElementById('new-sim-form');
    const portingForm = document.getElementById('porting-form');
    const tabs = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (formType === 'new-sim') {
        newSimForm.classList.add('active');
        portingForm.classList.remove('active');
        tabs[0].classList.add('active');
        fetchLocation('new');
    } else {
        newSimForm.classList.remove('active');
        portingForm.classList.add('active');
        tabs[1].classList.add('active');
        fetchLocation('port');
    }
}

// 3. Geolocation
function fetchLocation(formType) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(position) {
        const { latitude, longitude } = position.coords;
        const locInput = document.getElementById(`location-${formType}`);
        const hiddenLoc = document.getElementById(`auto-location-${formType}`);
        
        if (hiddenLoc) hiddenLoc.value = latitude + ", " + longitude;
        
        if(locInput && locInput.value === "") {
            locInput.placeholder = "Location Detected (You can edit)";
        }
    }, function(error) {
        console.log("Location access denied or error");
    });
}

// 4. Age Calculation
function calculateAge(formType) {
    const dobInput = document.getElementById(`dob-${formType}`);
    const ageDisplay = document.getElementById(`age-display-${formType}`);
    const ageValue = document.getElementById(`age-value-${formType}`);
    const ageHidden = document.getElementById(`age-${formType}`);
    
    if (dobInput.value) {
        const dob = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        ageValue.textContent = age;
        ageHidden.value = age;
        ageDisplay.style.display = 'block';
    }
}

// 5. Validation
function validateNewSim() {
    const age = document.getElementById('age-new').value;
    if (!age || age < 18) {
        alert('You must be at least 18 years old to apply for a SIM card.');
        return false;
    }
    return true;
}

function validatePorting() {
    const age = document.getElementById('age-port').value;
    if (!age || age < 16) {
        alert('You must be at least 16 years old to port your number.');
        return false;
    }
    return true;
}

function showLocationInfo() {
    alert('Location access is requested to check 5G coverage in your area. You can also type your address manually.');
}

// 6. Input Listeners (Run when page loads)
document.addEventListener('DOMContentLoaded', function() {
    // Start with New SIM location fetch
    fetchLocation('new');

    // Number only validation
    document.querySelectorAll('[id^="aadhar-"], [id^="phone-"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });
});
