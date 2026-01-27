// Google Sheets Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyu0hcTzI7vbX6elm86PbpVZVBNpmPPFjsb5Xi-qB_fcgFNkxaQCyzIXNQqdE-diIPovw/exec'; // Thay bằng URL của Google Apps Script

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
    
    // Kiểm tra và hiển thị nút xóa ban đầu
    const tbody = document.getElementById('weightLevelsTable');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick*="removeWeightLevel"]');
            if (deleteBtn) {
                if (rows.length > 1) {
                    deleteBtn.style.display = 'inline-block';
                } else {
                    deleteBtn.style.display = 'none';
                }
            }
        });
    }
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


    // Attach listeners to existing rows
    const existingRows = document.querySelectorAll('#weightLevelsTable tr');
    existingRows.forEach(row => {
        const volumeInputs = row.querySelectorAll('.volume-input');
        volumeInputs.forEach(input => {
            input.addEventListener('input', function() {
                calculateRowTotal(row);
                calculateTotals();
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
                <div class="flex-1">
                    <span class="text-xs text-gray-500 block mb-1">Từ</span>
                    <input type="number" name="weightFrom[]" class="w-full bg-yellow-50 weight-from border border-amber-300 rounded p-1 text-center font-bold" step="1" placeholder="0">
                </div>
                <span class="mt-6 text-gray-400">-</span>
                <div class="flex-1">
                    <span class="text-xs text-gray-500 block mb-1">Đến</span>
                    <input type="number" name="weightTo[]" class="w-full bg-yellow-50 weight-to border border-amber-300 rounded p-1 text-center font-bold" step="1" placeholder="0">
                </div>
                <span class="text-xs text-gray-500">(gram)</span>
            </div>
        </td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeProvince[]" class="volume-input w-full border border-amber-300 rounded p-1 text-center font-bold" step="1" value="0"></td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeRegion[]" class="volume-input w-full border border-amber-300 rounded p-1 text-center font-bold" step="1" value="0"></td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeAdjacent[]" class="volume-input w-full border border-amber-300 rounded p-1 text-center font-bold" step="1" value="0"></td>
        <td class="border border-gray-300 p-2"><input type="number" name="volumeInter[]" class="volume-input w-full border border-amber-300 rounded p-1 text-center font-bold" step="1" value="0"></td>
        <td class="border border-gray-300 p-2 table-total text-center font-bold text-gray-800" data-total="0">0</td>
        <td class="border border-gray-300 p-2 text-center text-gray-600" data-percent="0%">0%</td>
        <td class="border border-gray-300 p-2 text-center">
            <button type="button" onclick="removeWeightLevel(this)" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition-colors font-medium">Xóa</button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Hiển thị nút xóa cho tất cả các dòng
    const allRows = tbody.querySelectorAll('tr');
    allRows.forEach(r => {
        const deleteBtn = r.querySelector('button[onclick*="removeWeightLevel"]');
        if (deleteBtn) {
            if (allRows.length > 1) {
                deleteBtn.style.display = 'inline-block';
            } else {
                deleteBtn.style.display = 'none';
            }
        }
    });
    
    // Attach event listeners to new inputs
    const volumeInputs = row.querySelectorAll('.volume-input');
    volumeInputs.forEach(input => {
        input.addEventListener('input', function() {
            calculateRowTotal(row);
            calculateTotals();
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

// Remove weight level row
function removeWeightLevel(button) {
    const tbody = document.getElementById('weightLevelsTable');
    const rows = tbody.querySelectorAll('tr');
    
    if (rows.length <= 1) {
        alert('Phải có ít nhất 1 mốc trọng lượng');
        return;
    }
    
    const row = button.closest('tr');
    if (row) {
        row.remove();
    }
    
    // Hiển thị/ẩn nút xóa sau khi xóa
    const remainingRows = tbody.querySelectorAll('tr');
    remainingRows.forEach(r => {
        const deleteBtn = r.querySelector('button[onclick*="removeWeightLevel"]');
        if (deleteBtn) {
            if (remainingRows.length > 1) {
                deleteBtn.style.display = 'inline-block';
            } else {
                deleteBtn.style.display = 'none';
            }
        }
    });
    
    // Recalculate totals after removal
    calculateTotals();
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
        // Format number with commas (không có số thập phân)
        const formattedTotal = formatNumber(total);
        totalCell.textContent = formattedTotal;
        totalCell.setAttribute('data-total', total.toString());
        
        // Calculate percentage for this row
        const grandTotalEl = document.getElementById('grandTotal');
        const grandTotal = grandTotalEl ? parseFloat(grandTotalEl.textContent.replace(/,/g, '')) || 0 : 0;
        const percent = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
        const percentCell = row.querySelector('[data-percent]');
        if (percentCell) {
            percentCell.textContent = percent.toFixed(1) + '%';
            percentCell.setAttribute('data-percent', percent.toFixed(1) + '%');
        }
    }
}

// Format number with commas (không có số thập phân cho khối lượng)
function formatNumber(num) {
    if (num === 0) return '0';
    // Làm tròn về số nguyên (bỏ phần thập phân)
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
    
    if (totalProvinceEl) totalProvinceEl.textContent = formatNumber(totalProvince);
    if (totalRegionEl) totalRegionEl.textContent = formatNumber(totalRegion);
    if (totalAdjacentEl) totalAdjacentEl.textContent = formatNumber(totalAdjacent);
    if (totalInterEl) totalInterEl.textContent = formatNumber(totalInter);
    if (grandTotalEl) {
        grandTotalEl.textContent = formatNumber(grandTotal);
        grandTotalEl.setAttribute('data-total', grandTotal.toFixed(2));
    }
    
    // Calculate and update percentage by region
    const percentProvinceEl = document.getElementById('percentProvince');
    const percentRegionEl = document.getElementById('percentRegion');
    const percentAdjacentEl = document.getElementById('percentAdjacent');
    const percentInterEl = document.getElementById('percentInter');
    
    if (percentProvinceEl) {
        percentProvinceEl.textContent = grandTotal > 0 ? (totalProvince / grandTotal * 100).toFixed(1) + '%' : '0%';
    }
    if (percentRegionEl) {
        percentRegionEl.textContent = grandTotal > 0 ? (totalRegion / grandTotal * 100).toFixed(1) + '%' : '0%';
    }
    if (percentAdjacentEl) {
        percentAdjacentEl.textContent = grandTotal > 0 ? (totalAdjacent / grandTotal * 100).toFixed(1) + '%' : '0%';
    }
    if (percentInterEl) {
        percentInterEl.textContent = grandTotal > 0 ? (totalInter / grandTotal * 100).toFixed(1) + '%' : '0%';
    }
    
    // Recalculate percentages for all rows
    rows.forEach(row => {
        const totalCell = row.querySelector('[data-total]');
        if (totalCell) {
            const total = parseFloat(totalCell.getAttribute('data-total')) || 0;
            const percent = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            const percentCell = row.querySelector('[data-percent]');
            if (percentCell) {
                percentCell.textContent = percent.toFixed(1) + '%';
                percentCell.setAttribute('data-percent', percent.toFixed(1) + '%');
            }
        }
    });
    
    // Hiển thị/ẩn nút xóa dựa trên số lượng dòng
    rows.forEach((row, index) => {
        const deleteBtn = row.querySelector('button[onclick*="removeWeightLevel"]');
        if (deleteBtn) {
            if (rows.length > 1) {
                deleteBtn.style.display = 'inline-block';
            } else {
                deleteBtn.style.display = 'none';
            }
        }
    });
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
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'https://script.google.com/macros/s/AKfycbw_MNwSdjW0r8a9ezK_GAs6cpw2fHPA1ZeiHYMyASqn5Drwq9NVM8NaOweqBmH8BIcB8A/exec') {
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

// ============================================
// ĐỒNG BỘ NGƯỢC: ĐỌC DỮ LIỆU TỪ GOOGLE SHEETS
// ============================================

// Function để đọc dữ liệu từ Google Sheets
async function loadDataFromSheets() {
    try {
        // URL để đọc dữ liệu (dùng GET thay vì POST)
        const response = await fetch(GOOGLE_SCRIPT_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        
        if (result.success) {
            return result.data || [];
        } else {
            console.error('Error loading data:', result.error);
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Function để hiển thị dữ liệu lên website
function displayData(data) {
    const container = document.getElementById('dataDisplay');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Chưa có dữ liệu nào được gửi</p>';
        return;
    }
    
    // Tạo bảng hiển thị dữ liệu
    let html = `
        <div class="mb-4 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Dữ liệu đã gửi (${data.length} bản ghi)</h2>
            <button onclick="refreshData()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                🔄 Làm mới
            </button>
        </div>
    `;
    
    html += '<div class="overflow-x-auto border rounded-lg">';
    html += '<table class="w-full text-sm border-collapse">';
    
    // Header
    if (data.length > 0) {
        const headers = Object.keys(data[0]);
        html += '<thead><tr class="bg-green-500 text-white">';
        headers.forEach(header => {
            html += `<th class="border border-gray-300 p-2 text-left">${header}</th>`;
        });
        html += '</tr></thead>';
        
        // Body - chỉ hiển thị 10 bản ghi gần nhất
        const recentData = data.slice(-10).reverse();
        html += '<tbody>';
        recentData.forEach((row, index) => {
            html += `<tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">`;
            headers.forEach(header => {
                const value = row[header] || '';
                // Giới hạn độ dài để tránh bảng quá rộng
                const displayValue = String(value).length > 50 
                    ? String(value).substring(0, 50) + '...' 
                    : value;
                html += `<td class="border border-gray-300 p-2">${displayValue}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
    }
    
    html += '</table>';
    html += '</div>';
    
    if (data.length > 10) {
        html += `<p class="text-gray-600 text-sm mt-2">Hiển thị 10 bản ghi gần nhất. Tổng cộng: ${data.length} bản ghi</p>`;
    }
    
    container.innerHTML = html;
}

// Function để refresh dữ liệu
async function refreshData() {
    const container = document.getElementById('dataDisplay');
    if (container) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Đang tải dữ liệu...</p>';
    }
    
    const data = await loadDataFromSheets();
    displayData(data);
}

// Load dữ liệu khi trang load
document.addEventListener('DOMContentLoaded', function() {
    // Load dữ liệu từ Sheets sau khi form đã được khởi tạo
    setTimeout(() => {
        loadDataFromSheets().then(data => {
            displayData(data);
        });
    }, 1000);
});
