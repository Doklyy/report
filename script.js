// Google Sheets Configuration
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE'; // Thay bằng URL của Google Apps Script

// Weight levels data
let weightLevels = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    updatePriceTables();
});

function initializeForm() {
    // Tables will be populated when weight levels are added
    updatePriceTables();
}

function setupEventListeners() {
    // Volume inputs - calculate totals (using event delegation)
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('volume-input')) {
            const row = e.target.closest('tr');
            if (row) {
                calculateRowTotal(row);
                calculateTotals();
                calculateOver12mPercent();
            }
        }
    });

    // Weight level inputs
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('weight-from') || e.target.classList.contains('weight-to')) {
            updatePriceTables();
        }
    });

    // Over 1.2m ratio calculation
    const over12mInput = document.getElementById('over12mRatio');
    if (over12mInput) {
        over12mInput.addEventListener('input', calculateOver12mPercent);
    }

    // Attach listeners to existing rows
    const existingRows = document.querySelectorAll('#weightLevelsTable tr');
    existingRows.forEach(row => {
        const volumeInputs = row.querySelectorAll('.volume-input');
        volumeInputs.forEach(input => {
            input.addEventListener('input', function() {
                calculateRowTotal(row);
                calculateTotals();
                calculateOver12mPercent();
            });
        });
    });

    // Form submission
    const form = document.getElementById('reportForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Add weight level row
function addWeightLevel() {
    const tbody = document.getElementById('weightLevelsTable');
    const rowCount = tbody.children.length;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="border border-gray-300 p-2">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs">Từ</span>
                <input type="number" name="weightFrom[]" class="w-20 bg-yellow-50 weight-from" step="0.01" placeholder="0">
                <span class="text-xs">Đến</span>
                <input type="number" name="weightTo[]" class="w-20 bg-yellow-50 weight-to" step="0.01" placeholder="0">
                <span class="text-xs">(gram)</span>
            </div>
        </td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeProvince[]" class="volume-input" step="0.01" value="0"></td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeRegion[]" class="volume-input" step="0.01" value="0"></td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeAdjacent[]" class="volume-input" step="0.01" value="0"></td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeInter[]" class="volume-input" step="0.01" value="0"></td>
        <td class="border border-gray-300 p-2 table-total text-center" data-total="0">0</td>
        <td class="border border-gray-300 p-2 text-center" data-percent="0%">0%</td>
    `;
    
    tbody.appendChild(row);
    
    // Attach event listeners to new inputs
    const volumeInputs = row.querySelectorAll('.volume-input');
    volumeInputs.forEach(input => {
        input.addEventListener('input', function() {
            calculateRowTotal(row);
            calculateTotals();
            calculateOver12mPercent();
        });
    });
    
    const weightInputs = row.querySelectorAll('.weight-from, .weight-to');
    weightInputs.forEach(input => {
        input.addEventListener('input', function() {
            updatePriceTables();
        });
    });
    
    updatePriceTables();
}

// Calculate row total: Tổng = Nội tỉnh + Nội miền + Cận miền + Liên miền
function calculateRowTotal(row) {
    const inputs = row.querySelectorAll('.volume-input');
    let total = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    const totalCell = row.querySelector('[data-total]');
    if (totalCell) {
        // Format number with commas for large numbers
        const formattedTotal = formatNumber(total);
        totalCell.textContent = formattedTotal;
        totalCell.setAttribute('data-total', total.toFixed(2));
        
        // Calculate percentage for this row
        const grandTotal = parseFloat(document.getElementById('grandTotal').textContent.replace(/,/g, '')) || 0;
        const percent = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
        const percentCell = row.querySelector('[data-percent]');
        if (percentCell) {
            percentCell.textContent = percent.toFixed(2) + '%';
            percentCell.setAttribute('data-percent', percent.toFixed(2) + '%');
        }
    }
}

// Format number with commas
function formatNumber(num) {
    if (num === 0) return '0';
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

// Calculate totals for all rows
function calculateTotals() {
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    let totalProvince = 0, totalRegion = 0, totalAdjacent = 0, totalInter = 0, grandTotal = 0;
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('.volume-input');
        if (inputs.length >= 4) {
            totalProvince += parseFloat(inputs[0].value) || 0;
            totalRegion += parseFloat(inputs[1].value) || 0;
            totalAdjacent += parseFloat(inputs[2].value) || 0;
            totalInter += parseFloat(inputs[3].value) || 0;
        }
    });
    
    grandTotal = totalProvince + totalRegion + totalAdjacent + totalInter;
    
    // Update footer totals
    const totalProvinceEl = document.getElementById('totalProvince');
    const totalRegionEl = document.getElementById('totalRegion');
    const totalAdjacentEl = document.getElementById('totalAdjacent');
    const totalInterEl = document.getElementById('totalInter');
    const grandTotalEl = document.getElementById('grandTotal');
    
    if (totalProvinceEl) totalProvinceEl.value = formatNumber(totalProvince);
    if (totalRegionEl) totalRegionEl.value = formatNumber(totalRegion);
    if (totalAdjacentEl) totalAdjacentEl.value = formatNumber(totalAdjacent);
    if (totalInterEl) totalInterEl.value = formatNumber(totalInter);
    if (grandTotalEl) {
        grandTotalEl.textContent = formatNumber(grandTotal);
        grandTotalEl.setAttribute('data-total', grandTotal.toFixed(2));
    }
    
    // Recalculate percentages for all rows
    rows.forEach(row => {
        const totalCell = row.querySelector('[data-total]');
        if (totalCell) {
            const total = parseFloat(totalCell.getAttribute('data-total')) || 0;
            const percent = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            const percentCell = row.querySelector('[data-percent]');
            if (percentCell) {
                percentCell.textContent = percent.toFixed(2) + '%';
                percentCell.setAttribute('data-percent', percent.toFixed(2) + '%');
            }
        }
    });
}

// Calculate over 1.2m percentage: Tỷ trọng = (Số lượng hàng trên 1.2m / Tổng sản lượng) * 100
function calculateOver12mPercent() {
    const over12m = parseFloat(document.getElementById('over12mRatio').value) || 0;
    const grandTotalEl = document.getElementById('grandTotal');
    const grandTotal = grandTotalEl ? parseFloat(grandTotalEl.textContent.replace(/,/g, '')) || 0 : 0;
    
    const over12mPercentEl = document.getElementById('over12mPercent');
    if (!over12mPercentEl) return;
    
    if (grandTotal === 0) {
        over12mPercentEl.value = '0%';
        return;
    }
    
    const percent = (over12m / grandTotal) * 100;
    over12mPercentEl.value = percent.toFixed(2) + '%';
}

// Update competitor and proposed price tables based on weight levels
function updatePriceTables() {
    updateCompetitorPriceTable();
    updateProposedPriceTable();
}

function updateCompetitorPriceTable() {
    const tbody = document.querySelector('#competitorPriceTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    
    if (rows.length === 0) return;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const fromValue = fromInput ? (parseFloat(fromInput.value) || 0) : 0;
        const toValue = toInput ? (parseFloat(toInput.value) || 0) : 0;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <input type="number" name="competitorFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" readonly> - 
                <input type="number" name="competitorTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" readonly>
            </td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_province" class="p-0 text-center bg-blue-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_region" class="p-0 text-center bg-blue-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_adjacent" class="p-0 text-center bg-blue-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_inter" class="p-0 text-center bg-blue-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorAvg_${index}_province" class="p-0 text-center" readonly></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorAvg_${index}_region" class="p-0 text-center" readonly></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorAvg_${index}_adjacent" class="p-0 text-center" readonly></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorAvg_${index}_inter" class="p-0 text-center" readonly></td>
        `;
        
        // Add event listeners for weighted average calculation
        const priceInputs = tr.querySelectorAll('.bg-blue-50');
        priceInputs.forEach(input => {
            input.addEventListener('input', () => calculateWeightedAverage(tr, index, 'competitor'));
        });
        
        tbody.appendChild(tr);
    });
}

function updateProposedPriceTable() {
    const tbody = document.querySelector('#proposedPriceTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    
    if (rows.length === 0) return;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const fromValue = fromInput ? (parseFloat(fromInput.value) || 0) : 0;
        const toValue = toInput ? (parseFloat(toInput.value) || 0) : 0;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <input type="number" name="proposedFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" readonly> - 
                <input type="number" name="proposedTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" readonly>
            </td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_province" class="p-0 text-center bg-yellow-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_region" class="p-0 text-center bg-yellow-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_adjacent" class="p-0 text-center bg-yellow-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_inter" class="p-0 text-center bg-yellow-50" step="0.01"></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedAvg_${index}_province" class="p-0 text-center" readonly></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedAvg_${index}_region" class="p-0 text-center" readonly></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedAvg_${index}_adjacent" class="p-0 text-center" readonly></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedAvg_${index}_inter" class="p-0 text-center" readonly></td>
        `;
        
        // Add event listeners for weighted average calculation
        const priceInputs = tr.querySelectorAll('.bg-yellow-50');
        priceInputs.forEach(input => {
            input.addEventListener('input', () => calculateWeightedAverage(tr, index, 'proposed'));
        });
        
        tbody.appendChild(tr);
    });
}

// Calculate weighted average: Bình quân có trọng số = SUM(Sản lượng mốc i * Đơn giá mốc i) / Tổng sản lượng
function calculateWeightedAverage(priceRow, levelIndex, type) {
    const volumeRow = document.querySelectorAll('#weightLevelsTable tr')[levelIndex];
    if (!volumeRow) return;
    
    const volumeInputs = volumeRow.querySelectorAll('.volume-input');
    const priceInputs = type === 'competitor' 
        ? priceRow.querySelectorAll('.bg-blue-50')
        : priceRow.querySelectorAll('.bg-yellow-50');
    const avgInputs = priceRow.querySelectorAll('input[readonly]');
    
    const grandTotalEl = document.getElementById('grandTotal');
    const grandTotal = grandTotalEl ? parseFloat(grandTotalEl.textContent.replace(/,/g, '')) || 0 : 0;
    
    if (grandTotal === 0) {
        avgInputs.forEach(input => input.value = '');
        return;
    }
    
    // Calculate weighted average for each zone
    for (let i = 0; i < 4 && i < volumeInputs.length && i < priceInputs.length && i < avgInputs.length; i++) {
        const volume = parseFloat(volumeInputs[i].value) || 0;
        const price = parseFloat(priceInputs[i].value) || 0;
        const weightedAvg = (volume * price) / grandTotal;
        avgInputs[i].value = isNaN(weightedAvg) ? '' : formatNumber(weightedAvg);
    }
}

// Calculate return rate: Tỷ lệ hoàn = (Số hoàn / Tổng gửi) * 100
function calculateReturnRate(returned, total) {
    if (total === 0) return 0;
    return (returned / total) * 100;
}

// Handle other input checkbox
function handleOtherInput(input) {
    const checkbox = document.getElementById('checkboxOther');
    checkbox.checked = input.value.trim().length > 0;
}

// Collect form data
function collectFormData() {
    const formData = {
        timestamp: new Date().toLocaleString('vi-VN'),
        
        // Section I: Customer Information
        customerName: document.querySelector('input[name="customerName"]').value,
        phone: document.querySelector('input[name="phone"]').value,
        address: document.querySelector('input[name="address"]').value,
        
        // Weight levels and volumes
        weightLevels: [],
        volumes: [],
        grandTotal: document.getElementById('grandTotal').textContent,
        over12mRatio: document.getElementById('over12mRatio').value,
        over12mPercent: document.getElementById('over12mPercent').value,
        
        // Product characteristics
        productNormal: document.querySelector('input[name="productNormal"]').checked,
        productLiquid: document.querySelector('input[name="productLiquid"]').checked,
        productFlammable: document.querySelector('input[name="productFlammable"]').checked,
        productFragile: document.querySelector('input[name="productFragile"]').checked,
        
        // Industry
        industries: Array.from(document.querySelectorAll('input[name="industry"]:checked')).map(cb => cb.value),
        industryOther: document.getElementById('inputOther').value,
        
        // Competitors
        competitors: Array.from(document.querySelectorAll('input[name="competitor"]:checked')).map(cb => cb.value),
        competitorOther: document.querySelector('input[name="competitorOther"]').value,
        
        // Competitor prices
        competitorPrices: [],
        
        currentReturnRate: document.querySelector('input[name="currentReturnRate"]').value,
        competitorFreeReturnRate: document.querySelector('input[name="competitorFreeReturnRate"]').value,
        competitorOtherPolicies: document.querySelector('textarea[name="competitorOtherPolicies"]').value,
        
        // Proposed prices
        proposedPrices: [],
        
        proposedOtherPolicies: document.querySelector('textarea[name="proposedOtherPolicies"]').value,
        proposedReturnRate: document.querySelector('input[name="proposedReturnRate"]').value,
        
        // Reporter information
        reporterName: document.querySelector('input[name="reporterName"]').value,
        title: document.querySelector('input[name="title"]').value,
        reporterPhone: document.querySelector('input[name="reporterPhone"]').value,
        branch: document.querySelector('input[name="branch"]').value,
        postOfficeName: document.querySelector('input[name="postOfficeName"]').value,
        postOfficeCode: document.querySelector('input[name="postOfficeCode"]').value
    };
    
    // Collect weight levels and volumes
    const weightRows = document.querySelectorAll('#weightLevelsTable tr');
    weightRows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const volumeInputs = row.querySelectorAll('.volume-input');
        
        formData.weightLevels.push({
            from: fromInput ? fromInput.value : '',
            to: toInput ? toInput.value : ''
        });
        
        formData.volumes.push({
            province: volumeInputs[0] ? volumeInputs[0].value : '0',
            region: volumeInputs[1] ? volumeInputs[1].value : '0',
            adjacent: volumeInputs[2] ? volumeInputs[2].value : '0',
            inter: volumeInputs[3] ? volumeInputs[3].value : '0',
            total: row.querySelector('[data-total]').getAttribute('data-total'),
            percent: row.querySelector('[data-percent]').getAttribute('data-percent')
        });
    });
    
    // Collect competitor prices
    const competitorRows = document.querySelectorAll('#competitorPriceTable tbody tr');
    competitorRows.forEach((row, index) => {
        formData.competitorPrices.push({
            from: row.querySelector(`input[name="competitorFrom_${index}"]`).value,
            to: row.querySelector(`input[name="competitorTo_${index}"]`).value,
            province: row.querySelector(`input[name="competitorPrice_${index}_province"]`).value,
            region: row.querySelector(`input[name="competitorPrice_${index}_region"]`).value,
            adjacent: row.querySelector(`input[name="competitorPrice_${index}_adjacent"]`).value,
            inter: row.querySelector(`input[name="competitorPrice_${index}_inter"]`).value
        });
    });
    
    // Collect proposed prices
    const proposedRows = document.querySelectorAll('#proposedPriceTable tbody tr');
    proposedRows.forEach((row, index) => {
        formData.proposedPrices.push({
            from: row.querySelector(`input[name="proposedFrom_${index}"]`).value,
            to: row.querySelector(`input[name="proposedTo_${index}"]`).value,
            province: row.querySelector(`input[name="proposedPrice_${index}_province"]`).value,
            region: row.querySelector(`input[name="proposedPrice_${index}_region"]`).value,
            adjacent: row.querySelector(`input[name="proposedPrice_${index}_adjacent"]`).value,
            inter: row.querySelector(`input[name="proposedPrice_${index}_inter"]`).value
        });
    });
    
    return formData;
}

// Format data for Google Sheets
function formatDataForSheets(formData) {
    const row = [
        formData.timestamp,
        formData.customerName,
        formData.phone,
        formData.address,
        formData.weightLevels.map(w => `${w.from}-${w.to}`).join('; '),
        formData.grandTotal,
        formData.over12mRatio,
        formData.over12mPercent,
        document.getElementById('totalProvince').value,
        document.getElementById('totalRegion').value,
        document.getElementById('totalAdjacent').value,
        document.getElementById('totalInter').value,
        formData.productNormal ? 'Có' : 'Không',
        formData.productLiquid ? 'Có' : 'Không',
        formData.productFlammable ? 'Có' : 'Không',
        formData.productFragile ? 'Có' : 'Không',
        formData.industries.join('; '),
        formData.industryOther,
        formData.competitors.join('; '),
        formData.competitorOther,
        formData.competitorPrices.map(p => `${p.from}-${p.to}: ${p.province}/${p.region}/${p.adjacent}/${p.inter}`).join(' | '),
        formData.currentReturnRate,
        formData.competitorFreeReturnRate,
        formData.competitorOtherPolicies,
        formData.proposedPrices.map(p => `${p.from}-${p.to}: ${p.province}/${p.region}/${p.adjacent}/${p.inter}`).join(' | '),
        formData.proposedOtherPolicies,
        formData.proposedReturnRate,
        formData.reporterName,
        formData.title,
        formData.reporterPhone,
        formData.branch,
        formData.postOfficeName,
        formData.postOfficeCode
    ];
    
    return row;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';
        
        const formData = collectFormData();
        const rowData = formatDataForSheets(formData);
        
        // Send to Google Sheets
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            await sendToGoogleSheets(rowData);
            showMessage('success');
        } else {
            // For testing
            console.log('Form Data:', formData);
            console.log('Sheet Row:', rowData);
            showMessage('success');
        }
        
        submitBtn.textContent = 'Gửi thành công!';
        
        // Reset form after 2 seconds
        setTimeout(() => {
            document.getElementById('reportForm').reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            initializeForm();
            hideMessages();
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showMessage('error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        setTimeout(() => {
            hideMessages();
        }, 3000);
    }
}

// Send data to Google Sheets
async function sendToGoogleSheets(rowData) {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: rowData })
    });
    
    return response;
}

// Show success/error message
function showMessage(type) {
    hideMessages();
    if (type === 'success') {
        document.getElementById('successMessage').style.display = 'block';
    } else {
        document.getElementById('errorMessage').style.display = 'block';
    }
}

function hideMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}
