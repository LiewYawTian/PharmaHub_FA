let allDeliveries = [];

// ==================== KPI Summary ====================
function updateKpis(list) {
    const total = list.length;
    const pending = list.filter(d => d.delivery_status === 'Pending').length;
    const inTransit = list.filter(d => d.delivery_status === 'In Transit').length;
    const delivered = list.filter(d => d.delivery_status === 'Delivered').length;

    document.getElementById('kpiTotalDeliveries').innerText = total;
    document.getElementById('kpiPending').innerText = pending;
    document.getElementById('kpiInTransit').innerText = inTransit;
    document.getElementById('kpiDelivered').innerText = delivered;
}

// ==================== Status Badge ====================
function statusBadge(status) {
    const map = {
        'Pending':    'badge-pending',
        'In Transit': 'badge-transit',
        'Delivered':  'badge-delivered',
        'Cancelled':  'badge-cancelled'
    };
    const cls = map[status] || 'badge-pending';
    return `<span class="status-badge ${cls}">${status || 'Pending'}</span>`;
}

// ==================== Table Renderer ====================
function renderTable(list) {
    const tbody = document.getElementById('deliveryTableBody');
    tbody.innerHTML = '';

    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No delivery records found.</td></tr>';
        return;
    }

    list.forEach(d => {
        const created = d.created_at 
            ? d.created_at.replace('T', ' ').slice(0, 19) 
            : '-';

        // Only Pending / In Transit can be updated further
        const canUpdate = d.delivery_status === 'Pending' || d.delivery_status === 'In Transit';
        const actionHtml = canUpdate
            ? `<select class="status-select" onchange="updateStatus('${d.delivery_id}', this.value)">
                   <option value="">-- Change --</option>
                   ${d.delivery_status === 'Pending' 
                        ? '<option value="In Transit">In Transit</option><option value="Cancelled">Cancelled</option>' 
                        : '<option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>'}
               </select>`
            : '<span class="text-muted">-</span>';

        tbody.innerHTML += `
            <tr>
                <td><b>${d.delivery_id}</b></td>
                <td>${d.txn_code || '-'}</td>
                <td>${d.medicine_name || '-'}</td>
                <td>${d.qty_change ? Math.abs(d.qty_change) : '-'}</td>
                <td>${d.customer_name}</td>
                <td>${d.customer_phone || '-'}</td>
                <td>${d.delivery_address}</td>
                <td>${statusBadge(d.delivery_status)}</td>
                <td>${created}</td>
                <td>${actionHtml}</td>
            </tr>
        `;
    });
}

// ==================== Filter + Search ====================
function applyFilters() {
    const keyword = document.getElementById('searchDelivery').value.toLowerCase().trim();
    const status = document.getElementById('filterStatus').value;

    const filtered = allDeliveries.filter(d => {
        const matchKeyword = !keyword 
            || (d.delivery_id || '').toLowerCase().includes(keyword)
            || (d.customer_name || '').toLowerCase().includes(keyword)
            || (d.delivery_address || '').toLowerCase().includes(keyword);
        const matchStatus = !status || d.delivery_status === status;
        return matchKeyword && matchStatus;
    });

    renderTable(filtered);
    updateKpis(filtered);
}

// ==================== Load Data ====================
function loadDeliveries() {
    fetch('/api/deliveries')
        .then(res => res.json())
        .then(data => {
            allDeliveries = data;
            applyFilters();
        })
        .catch(err => console.error('Error loading deliveries:', err));
}

// ==================== Update Status ====================
window.updateStatus = function(deliveryId, newStatus) {
    if (!newStatus) return;

    if (!confirm(`Change ${deliveryId} status to "${newStatus}"?`)) {
        loadDeliveries(); // reset dropdown
        return;
    }

    fetch('/api/deliveries/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            delivery_id: deliveryId, 
            delivery_status: newStatus 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Delivery status updated!');
            loadDeliveries();
        } else {
            alert('Error: ' + data.message);
            loadDeliveries();
        }
    })
    .catch(err => {
        alert('Network error: ' + err.message);
        loadDeliveries();
    });
};

// ==================== Button Events ====================
document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);

document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('searchDelivery').value = '';
    document.getElementById('filterStatus').value = '';
    applyFilters();
});

// ==================== Initial Load ====================
loadDeliveries();