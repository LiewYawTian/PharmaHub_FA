const typeMapping = {
    'Group B': [
        'Antibiotics & Antimicrobials',
        'Sleeping Pills & Sedatives',
        'Blood Pressure (Antihypertensives)',
        'Cholesterol (Statins)',
        'Diabetic Medications',
        'Blood Thinners (Oral Anticoagulants)',
        'Prescription Pain Relief'
    ],
    'Group C': [
        'Decongestants',
        'Mild Sleep Aids & Allergy',
        'Cough & Respiratory Remedies'
    ],
    'Group OTC': [
        'Pain & Fever Relief',
        'Antacids (Gastrointestinal)'
    ]
};

// Dynamic currency hint update based on selected supplier
const supplierSelect = document.getElementById('inSupplier');
if (supplierSelect) {
    supplierSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const currency = selectedOption.getAttribute('data-currency') || 'MYR';
        document.getElementById('inCurrency').value = currency;
        document.getElementById('currencyHint').innerText = `Currency: ${currency} (Will be converted to MYR automatically if foreign)`;
    });
}

let medicineList = [];
let batchList = [];

// Batch Detail
function renderBatchDetails(medId, listElId, onlySellable = false) {
    const listEl = document.getElementById(listElId);
    if (!listEl) return;

    if (!medId) {
        listEl.innerHTML = '<li class="text-muted">Select a medicine to view batches</li>';
        return;
    }

    const today = new Date();
    let matched = batchList.filter(b => b.medicine_id === medId && Number(b.quantity) > 0);

    // Show the valid stock
    if (onlySellable) {
        matched = matched.filter(b => b.expiry_date && new Date(b.expiry_date) > today);
    }

    // Asecding Order with the date
    matched.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    if (matched.length === 0) {
        listEl.innerHTML = '<li class="text-muted">No active batches in storage</li>';
        return;
    }

    listEl.innerHTML = '';
    matched.forEach(b => {
        const expStr = b.expiry_date ? b.expiry_date.slice(0, 10) : '-';
        listEl.innerHTML += `
            <li>
                <span><b>${b.batch_number}</b> (Exp: ${expStr})</span>
                <span class="text-info"><b>${b.quantity}</b> units</span>
            </li>
        `;
    });
}

// Option for the medicine
function populateMedicines(selectElement, filteredList) {
    selectElement.innerHTML = '<option value="">-- Choose Medicine --</option>';
    filteredList.forEach(med => {
        selectElement.innerHTML += `<option value="${med.medicine_id}">${med.medicine_name} (${med.medicine_id})</option>`;
    });
}

// Reload the Batch Data
function reloadBatches() {
    return fetch('/api/batches')
        .then(res => res.json())
        .then(batches => {
            batchList = batches;
            renderBatchDetails(document.getElementById('inMedicine').value, 'inBatchList', false);
            renderBatchDetails(document.getElementById('outMedicine').value, 'outBatchList', true);
        });
}

// Step By Step select form Category to Medicine Type until Medicine
function setupCascade(catId, typeId, medId, listElId, onlySellable) {
    const catEl = document.getElementById(catId);
    const typeEl = document.getElementById(typeId);
    const medEl = document.getElementById(medId);

    catEl.addEventListener('change', () => {
        const cat = catEl.value;
        typeEl.innerHTML = '<option value="">-- Please select medicine type --</option>';

        if (cat && typeMapping[cat]) {
            typeMapping[cat].forEach(t => {
                typeEl.innerHTML += `<option value="${t}">${t}</option>`;
            });
        }

        medEl.innerHTML = '<option value="">-- Please select medicine type first --</option>';
        renderBatchDetails('', listElId, onlySellable);
    });

    typeEl.addEventListener('change', () => {
        const cat = catEl.value;
        const type = typeEl.value;

        if (!type) {
            medEl.innerHTML = '<option value="">-- Please select medicine type first --</option>';
            renderBatchDetails('', listElId, onlySellable);
            return;
        }

        const filtered = medicineList.filter(m => {
            const matchCat = !cat || m.category === cat;
            const matchType = m.medicine_type === type;
            return matchCat && matchType;
        });

        populateMedicines(medEl, filtered);
        renderBatchDetails('', listElId, onlySellable);
    });

    medEl.addEventListener('change', () => {
        renderBatchDetails(medEl.value, listElId, onlySellable);
    });
}

// ==================== Limit ====================
// Expiry Date must after Current Date when Stock In
const inExpiryInput = document.getElementById('inExpiry');
if (inExpiryInput) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    inExpiryInput.min = minDate.toISOString().split('T')[0];
}

// Load for the option data
Promise.all([
    fetch('/api/medicines').then(res => res.json()),
    fetch('/api/batches').then(res => res.json())
]).then(([meds, batches]) => {
    medicineList = meds;
    batchList = batches;

    document.getElementById('inMedicine').innerHTML = '<option value="">-- Please select category & type first --</option>';
    document.getElementById('outMedicine').innerHTML = '<option value="">-- Please select category & type first --</option>';

    setupCascade('inCategory', 'inMedicineType', 'inMedicine', 'inBatchList', false);
    setupCascade('outCategory', 'outMedicineType', 'outMedicine', 'outBatchList', true);
});

// ==================== Fetch ====================
document.getElementById('stockInForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const expiryVal = document.getElementById('inExpiry').value;
    const selectedExpiry = new Date(expiryVal);
    const minAllowedDate = new Date();
    minAllowedDate.setDate(minAllowedDate.getDate() + 30);
    minAllowedDate.setHours(0, 0, 0, 0);

    if (selectedExpiry < minAllowedDate) {
        alert('Invalid Expiry Date! The expiry date must be at least 30 days from today.');
        return;
    }

    const data = 
    {
        medicine_id: document.getElementById('inMedicine').value,
        quantity: document.getElementById('inQty').value,
        expiry_date: expiryVal,
        supplier_id: document.getElementById('inSupplier').value,
        original_currency: document.getElementById('inCurrency').value,
        original_price: document.getElementById('inOriginalPrice').value,
        username: localStorage.getItem('currentUser') || 'Unknown'
    };

    fetch('/add-stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            alert('Stock In successfully added!');
            document.getElementById('inQty').value = '';
            document.getElementById('inExpiry').value = '';
            reloadBatches();
        } 
        else {
            alert('Error: ' + result.message);
        }
    })
    .catch(err => alert('Network error: ' + err.message));
});

document.getElementById('stockOutForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const deliveryEnabled = document.getElementById('deliveryToggle').checked;

    if (deliveryEnabled) 
    {
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const customerAddress = document.getElementById('customerAddress').value.trim();

        if (!customerName || !customerPhone || !customerAddress) 
        {
            alert('Please fill in all required delivery details.');
            return;
        };
    }

    const data = {
        medicine_id: document.getElementById('outMedicine').value,
        deduct_qty: document.getElementById('outQty').value,
        reason: document.getElementById('outReason').value,
        username: localStorage.getItem('currentUser') || 'Unknown',
        delivery_required: deliveryEnabled,
        customerName:    document.getElementById('customerName').value.trim() || null,
        customerPhone:   document.getElementById('customerPhone').value.trim() || null,
        customerAddress: document.getElementById('customerAddress').value.trim() || null
    };

    fetch('/add-stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            alert('Stock Out successfully deducted!');

            document.getElementById('outQty').value = '';
            document.getElementById('deliveryToggle').checked = false;
            document.getElementById('deliverySection').style.display = 'none';
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('customerAddress').value = '';
            document.getElementById('routeDistance').innerText = '-';
            document.getElementById('routeDuration').innerText = '-';

            if (customerMarker && mapInstance) {
                mapInstance.removeLayer(customerMarker);
                customerMarker = null;
            }

            reloadBatches();
        } 
        else {
            alert('Error: ' + result.message);
        }
    })
    .catch(err => alert('Network error: ' + err.message));
});


// ==================== Delivery Toggle & Geoapify Map Integration ====================
const pharmacyCoords = [4.582583889941812, 101.09487406541145];
let mapInstance = null;
let customerMarker = null;

const deliveryToggle  = document.getElementById('deliveryToggle');
const deliverySection = document.getElementById('deliverySection');
const calculateRouteBtn = document.getElementById('calculateRouteBtn');

// Helper: mark delivery fields required/unrequired dynamically
function setDeliveryFieldsRequired(isRequired) {
    ['customerName', 'customerPhone', 'customerAddress'].forEach(id => {
        const details = document.getElementById(id);
        if (details) details.required = isRequired;
    });
}

// 1. Show/hide the delivery section when toggle changes
if (deliveryToggle) {
    deliveryToggle.addEventListener('change', function () {
        if (this.checked) {
            deliverySection.style.display = 'block';
            setDeliveryFieldsRequired(true);

            // Initialize the map AFTER the container is visible
            setTimeout(() => {
                if (!mapInstance) {
                    mapInstance = L.map('map').setView(pharmacyCoords, 13);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap contributors'
                    }).addTo(mapInstance);

                    L.marker(pharmacyCoords).addTo(mapInstance)
                        .bindPopup('<b>PharmaHub Central</b>').openPopup();
                } else {
                    mapInstance.invalidateSize(); // fixes grey tiles when re-shown
                }
            }, 200);
        } else {
            deliverySection.style.display = 'none';
            setDeliveryFieldsRequired(false);
            // Clear any previously calculated route info
            document.getElementById('routeDistance').innerText = '-';
            document.getElementById('routeDuration').innerText = '-';

            // Reset weather box
            const weatherBox = document.getElementById('weatherInfo');
            if (weatherBox) weatherBox.style.display = 'none';
        }
    });
}

// 2. Calculate delivery route via Geoapify (only once, correct button ID)
if (calculateRouteBtn) {
    calculateRouteBtn.addEventListener('click', async () => {
        const address = document.getElementById('customerAddress').value.trim();
        if (!address) {
            alert('Please enter a customer destination address.');
            return;
        }
        if (!mapInstance) {
            alert('Please enable Delivery first.');
            return;
        }

        try {
            const response = await fetch(`/api/delivery-route?destination=${encodeURIComponent(address)}`);
            const data = await response.json();

            if (data.success) {
                const customerCoords = [data.destination_lat, data.destination_lng];

                if (customerMarker) mapInstance.removeLayer(customerMarker);
                customerMarker = L.marker(customerCoords).addTo(mapInstance)
                    .bindPopup(`<b>Customer:</b> ${address}`).openPopup();

                mapInstance.setView(customerCoords, 13);

                document.getElementById('routeDistance').innerText = data.distance + ' km';
                document.getElementById('routeDuration').innerText = data.duration + ' minutes';

                fetchWeather(data.destination_lat, data.destination_lng);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to process delivery route.');
        }
    });
}

// ==================== Address Autocomplete ====================
(function setupAddressAutocomplete() {
    const input = document.getElementById('customerAddress');
    const list  = document.getElementById('addressSuggestions');
    if (!input || !list) return;

    let debounceTimer = null;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const text = input.value.trim();

        if (text.length < 3) {
            list.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => fetchSuggestions(text), 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-wrapper')) {
            list.innerHTML = '';
        }
    });


    async function fetchSuggestions(text) {
        try {
            const res = await fetch(`/api/address-autocomplete?text=${encodeURIComponent(text)}`);
            const data = await res.json();

            if (!data.success || !data.suggestions.length) {
                list.innerHTML = '';
                return;
            }

            list.innerHTML = '';

            data.suggestions.forEach(s => {
                const li = document.createElement('li');
                li.textContent = s.formatted;

                li.addEventListener('click', () => {
                    input.value = s.formatted;
                    list.innerHTML = '';

                    const calcBtn = document.getElementById('calculateRouteBtn');
                    if (calcBtn) calcBtn.click();
                });

                list.appendChild(li);
            });
        } catch (err) {
            console.error('Autocomplete fetch error:', err);
        }
    }
})();

// ==================== Weather at Delivery Destination ====================
async function fetchWeather(lat, lon) {
    const box = document.getElementById('weatherInfo');
    if (!box) return;

    try {
        const res = await fetch(`/api/delivery-weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        if (!data.success) {
            box.style.display = 'none';
            return;
        }

        document.getElementById('weatherIcon').src =
            `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        document.getElementById('weatherCity').innerText = data.city;
        document.getElementById('weatherDesc').innerText =
            data.description.charAt(0).toUpperCase() + data.description.slice(1);
        document.getElementById('weatherTemp').innerText = data.temp;
        document.getElementById('weatherHumidity').innerText = data.humidity;
        document.getElementById('weatherWind').innerText = data.wind;

        const riskEl = document.getElementById('weatherRisk');
        riskEl.innerText = `Delivery Risk: ${data.risk}`;
        riskEl.style.color = data.riskColor;
        riskEl.style.fontWeight = 'bold';

        box.style.display = 'block';
    } catch (err) {
        console.error('Weather fetch error:', err);
        box.style.display = 'none';
    }
}