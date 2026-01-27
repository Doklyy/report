// Google Sheets Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1SL2FNOlL0bWt7ED5E5A8PYcOJL-QBOZKpmoxh34ywbxmW-yY0cuGj26cU4BaZUzczA/exec'; // Thay bằng URL của Google Apps Script

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
    // Over 1.2m ratio calculation
    const over12mInput = document.getElementById('over12mRatio');
    if (over12mInput) {
        over12mInput.addEventListener('input', calculateOver12mPercent);
    }
    
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

// Calculate over 1.2m percentage: Tỷ trọng = (Số lượng hàng trên 1.2m / Tổng sản lượng) * 100
function calculateOver12mPercent() {
    const over12mInput = document.getElementById('over12mRatio');
    const over12mPercentEl = document.getElementById('over12mPercent');
    
    if (!over12mInput || !over12mPercentEl) return;
    
    const over12m = parseFloat(over12mInput.value) || 0;
    const grandTotalEl = document.getElementById('grandTotal');
    const grandTotal = grandTotalEl ? parseFloat(grandTotalEl.textContent.replace(/,/g, '')) || 0 : 0;
    
    if (grandTotal === 0) {
        over12mPercentEl.value = '0%';
        return;
    }
    
    const percent = (over12m / grandTotal) * 100;
    over12mPercentEl.value = percent.toFixed(2) + '%';
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
    
    // Recalculate over 1.2m percent when totals change
    calculateOver12mPercent();
    
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
    
    // Lưu giá trị hiện tại của các input giá trước khi cập nhật
    const existingRows = tbody.querySelectorAll('tr');
    const savedPrices = [];
    existingRows.forEach((existingRow, idx) => {
        const saved = {
            province: existingRow.querySelector(`input[name="competitorPrice_${idx}_province"]`)?.value || '',
            region: existingRow.querySelector(`input[name="competitorPrice_${idx}_region"]`)?.value || '',
            adjacent: existingRow.querySelector(`input[name="competitorPrice_${idx}_adjacent"]`)?.value || '',
            inter: existingRow.querySelector(`input[name="competitorPrice_${idx}_inter"]`)?.value || ''
        };
        savedPrices.push(saved);
    });
    
    tbody.innerHTML = '';
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    
    if (rows.length === 0) return;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const fromValue = fromInput ? (parseFloat(fromInput.value) || 0) : 0;
        const toValue = toInput ? (parseFloat(toInput.value) || 0) : 0;
        
        // Khôi phục giá trị đã lưu nếu có
        const saved = savedPrices[index] || {};
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <input type="number" name="competitorFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" readonly> - 
                <input type="number" name="competitorTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" readonly>
            </td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_province" class="p-0 text-center bg-blue-50" step="0.01" value="${saved.province}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_region" class="p-0 text-center bg-blue-50" step="0.01" value="${saved.region}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_adjacent" class="p-0 text-center bg-blue-50" step="0.01" value="${saved.adjacent}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_inter" class="p-0 text-center bg-blue-50" step="0.01" value="${saved.inter}"></td>
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
        
        // Tính lại weighted average nếu có giá trị
        if (saved.province || saved.region || saved.adjacent || saved.inter) {
            setTimeout(() => calculateWeightedAverage(tr, index, 'competitor'), 100);
        }
        
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
        
        // Industry - chỉ lấy các checkbox được chọn
        industries: Array.from(document.querySelectorAll('input[name="industry"]:checked')).map(cb => cb.value).filter(v => v && v.trim() !== ''),
        industryOther: document.getElementById('inputOther') ? document.getElementById('inputOther').value.trim() : '',
        
        // Competitors
        competitors: Array.from(document.querySelectorAll('input[name="competitor"]:checked')).map(cb => cb.value),
        competitorOther: document.querySelector('input[name="competitorOther"]').value,
        
        // Competitor prices
        competitorPrices: [],
        
        currentReturnRate: document.querySelector('input[name="currentReturnRate"]').value,
        competitorFreeReturnRate: document.querySelector('input[name="competitorFreeReturnRate"]').value,
        competitorOtherPolicies: document.querySelector('textarea[name="competitorOtherPolicies"]').value,
        
        over12mRatio: document.getElementById('over12mRatio') ? document.getElementById('over12mRatio').value : '',
        over12mPercent: document.getElementById('over12mPercent') ? document.getElementById('over12mPercent').value : '',
        
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
        postOfficeCode: document.querySelector('input[name="postOfficeCode"]') ? document.querySelector('input[name="postOfficeCode"]').value : ''
    };
    
    // Collect weight levels and volumes
    const weightRows = document.querySelectorAll('#weightLevelsTable tr');
    weightRows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const volumeInputs = row.querySelectorAll('.volume-input');
        
        formData.weightLevels.push({
            from: fromInput ? (fromInput.value || '0') : '0',
            to: toInput ? (toInput.value || '0') : '0'
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
        const fromInput = row.querySelector(`input[name="proposedFrom_${index}"]`);
        const toInput = row.querySelector(`input[name="proposedTo_${index}"]`);
        const provinceInput = row.querySelector(`input[name="proposedPrice_${index}_province"]`);
        const regionInput = row.querySelector(`input[name="proposedPrice_${index}_region"]`);
        const adjacentInput = row.querySelector(`input[name="proposedPrice_${index}_adjacent"]`);
        const interInput = row.querySelector(`input[name="proposedPrice_${index}_inter"]`);
        
        // Chỉ thêm nếu có ít nhất 1 giá trị
        if (fromInput || toInput || provinceInput || regionInput || adjacentInput || interInput) {
            formData.proposedPrices.push({
                from: fromInput ? (fromInput.value || '0') : '0',
                to: toInput ? (toInput.value || '0') : '0',
                province: provinceInput ? (provinceInput.value || '') : '',
                region: regionInput ? (regionInput.value || '') : '',
                adjacent: adjacentInput ? (adjacentInput.value || '') : '',
                inter: interInput ? (interInput.value || '') : ''
            });
        }
    });
    
    return formData;
}

// Format data for Google Sheets - Đảm bảo thứ tự khớp với headers trong Google Sheets
function formatDataForSheets(formData) {
    // Lấy tổng sản lượng từ DOM
    const grandTotalEl = document.getElementById('grandTotal');
    const grandTotal = grandTotalEl ? grandTotalEl.textContent.replace(/,/g, '') : '0';
    
    // Tính tỷ trọng sản lượng (nếu có)
    const totalWeightLevels = formData.weightLevels.length;
    
    // Lấy các giá trị sản lượng từ DOM
    const totalProvince = document.getElementById('totalProvince') ? document.getElementById('totalProvince').textContent.replace(/,/g, '') : '0';
    const totalRegion = document.getElementById('totalRegion') ? document.getElementById('totalRegion').textContent.replace(/,/g, '') : '0';
    const totalAdjacent = document.getElementById('totalAdjacent') ? document.getElementById('totalAdjacent').textContent.replace(/,/g, '') : '0';
    const totalInter = document.getElementById('totalInter') ? document.getElementById('totalInter').textContent.replace(/,/g, '') : '0';
    
    // Tính tỷ trọng % (tỷ trọng của tổng sản lượng)
    const totalAll = parseFloat(totalProvince) + parseFloat(totalRegion) + parseFloat(totalAdjacent) + parseFloat(totalInter);
    const percentRatio = totalAll > 0 ? ((parseFloat(grandTotal) / totalAll) * 100).toFixed(2) + '%' : '0%';
    
    // Lấy đơn giá bình quân từ các bảng giá
    const competitorAvgProvince = document.querySelector('input[name="competitorAvg_0_province"]') ? document.querySelector('input[name="competitorAvg_0_province"]').value : '';
    const competitorAvgRegion = document.querySelector('input[name="competitorAvg_0_region"]') ? document.querySelector('input[name="competitorAvg_0_region"]').value : '';
    const competitorAvgAdjacent = document.querySelector('input[name="competitorAvg_0_adjacent"]') ? document.querySelector('input[name="competitorAvg_0_adjacent"]').value : '';
    const competitorAvgInter = document.querySelector('input[name="competitorAvg_0_inter"]') ? document.querySelector('input[name="competitorAvg_0_inter"]').value : '';
    
    const proposedAvgProvince = document.querySelector('input[name="proposedAvg_0_province"]') ? document.querySelector('input[name="proposedAvg_0_province"]').value : '';
    const proposedAvgRegion = document.querySelector('input[name="proposedAvg_0_region"]') ? document.querySelector('input[name="proposedAvg_0_region"]').value : '';
    const proposedAvgAdjacent = document.querySelector('input[name="proposedAvg_0_adjacent"]') ? document.querySelector('input[name="proposedAvg_0_adjacent"]').value : '';
    const proposedAvgInter = document.querySelector('input[name="proposedAvg_0_inter"]') ? document.querySelector('input[name="proposedAvg_0_inter"]').value : '';
    
    // Thứ tự phải khớp với headers trong Google Sheets
    const row = [
        formData.timestamp,                                    // 1. Thời gian
        formData.customerName,                                // 2. Tên KH/Tên shop
        formData.phone,                                        // 3. Điện thoại
        formData.address,                                      // 4. Địa chỉ
        formData.weightLevels.map(w => `${w.from}-${w.to}`).join('; '), // 5. Các mốc trọng lượng
        grandTotal,                                            // 6. Tổng sản lượng các mốc
        totalWeightLevels.toString(),                          // 7. Tỷ trọng sản lượng
        formData.over12mRatio || '',                          // 8. Tỷ trọng hàng trên 1.2m
        formData.over12mPercent || '0%',                      // 9. Tỷ trọng % hàng trên 1.2m
        totalProvince,                                         // 10. Sản lượng Nội tỉnh
        totalRegion,                                           // 11. Sản lượng Nội miền
        totalAdjacent,                                         // 12. Sản lượng Cận miền
        totalInter,                                            // 13. Sản lượng Liên miền
        grandTotal,                                            // 14. Tổng sản lượng
        percentRatio,                                          // 15. Tỷ trọng %
        formData.productNormal ? 'Có' : 'Không',              // 16. Hàng thông thường
        formData.productLiquid ? 'Có' : 'Không',               // 17. Chất lỏng
        formData.productFlammable ? 'Có' : 'Không',            // 18. Dễ cháy
        formData.productFragile ? 'Có' : 'Không',              // 19. Dễ vỡ
        (() => {
            // Kết hợp industries và industryOther
            const industryList = formData.industries.filter(i => i && i.trim() !== '');
            if (formData.industryOther && formData.industryOther.trim() !== '') {
                industryList.push(formData.industryOther.trim());
            }
            return industryList.join('; ');
        })(),                                                    // 20. Ngành hàng
        (() => {
            // Kết hợp competitors và competitorOther
            const competitorList = formData.competitors.filter(c => c && c.trim() !== '');
            if (formData.competitorOther && formData.competitorOther.trim() !== '') {
                competitorList.push(formData.competitorOther.trim());
            }
            return competitorList.join('; ');
        })(),                                                    // 21. Đối thủ
        '',                                                      // 22. Đối thủ khác (đã được gộp vào Đối thủ ở trên)
        formData.competitorPrices.map(p => `${p.from}-${p.to}: ${p.province}/${p.region}/${p.adjacent}/${p.inter}`).join(' | '), // 23. Giá đối thủ
        competitorAvgProvince,                                 // 24. Đơn giá bình quân Nội tỉnh (ĐT)
        competitorAvgRegion,                                  // 25. Đơn giá bình quân Nội miền (ĐT)
        competitorAvgAdjacent,                                 // 26. Đơn giá bình quân Cận miền (ĐT)
        competitorAvgInter,                                    // 27. Đơn giá bình quân Liên miền (ĐT)
        formData.currentReturnRate || '',                      // 28. Tỷ lệ hoàn hiện tại
        formData.competitorFreeReturnRate || '',               // 29. Tỷ lệ hoàn đối thủ miễn phí
        formData.competitorOtherPolicies || '',                // 30. Chính sách đặc thù đối thủ
        formData.proposedPrices.map(p => {
            const from = p.from || '0';
            const to = p.to || '0';
            const province = p.province || '';
            const region = p.region || '';
            const adjacent = p.adjacent || '';
            const inter = p.inter || '';
            return `${from}-${to}: ${province}/${region}/${adjacent}/${inter}`;
        }).filter(p => p !== '0-0: ///').join(' | '), // 31. Giá đề xuất
        proposedAvgProvince,                                   // 32. Đơn giá bình quân Nội tỉnh (ĐX)
        proposedAvgRegion,                                     // 33. Đơn giá bình quân Nội miền (ĐX)
        proposedAvgAdjacent,                                   // 34. Đơn giá bình quân Cận miền (ĐX)
        proposedAvgInter,                                      // 35. Đơn giá bình quân Liên miền (ĐX)
        formData.proposedOtherPolicies || '',                  // 36. Chính sách đặc thù đề xuất
        formData.proposedReturnRate || '',                     // 37. Tỷ lệ hoàn đề xuất
        formData.reporterName || '',                           // 38. Họ và tên người báo cáo
        formData.reporterPhone || '',                          // 39. Điện thoại người báo cáo
        formData.postOfficeName || '',                         // 40. Tên Bưu cục
        formData.title || '',                                  // 41. Chức danh
        formData.branch || '',                                 // 42. Chi nhánh
        formData.postOfficeCode || ''                          // 43. Mã Bưu cục
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
        
        // Collect và format dữ liệu
        const formData = collectFormData();
        console.log('Form data collected:', formData);
        
        const rowData = formatDataForSheets(formData);
        console.log('Data formatted for Sheets:', rowData);
        console.log('Data length:', rowData.length);
        
        // Validate dữ liệu trước khi gửi
        if (!rowData || rowData.length === 0) {
            throw new Error('Không có dữ liệu để gửi');
        }
        
        // Send to Google Sheets
        if (GOOGLE_SCRIPT_URL) {
            console.log('Sending to Google Sheets URL:', GOOGLE_SCRIPT_URL);
            await sendToGoogleSheets(rowData);
            console.log('Data sent successfully!');
            showMessage('success');
        } else {
            console.warn('GOOGLE_SCRIPT_URL is not set');
            showMessage('error');
        }
        
        submitBtn.textContent = '✓ Gửi thành công!';
        submitBtn.style.backgroundColor = '#10b981';
        
        // Reset form after 3 seconds
        setTimeout(() => {
            document.getElementById('reportForm').reset();
            submitBtn.textContent = originalText;
            submitBtn.style.backgroundColor = '';
            submitBtn.disabled = false;
            initializeForm();
            hideMessages();
        }, 3000);
        
    } catch (error) {
        console.error('Error submitting form:', error);
        console.error('Error stack:', error.stack);
        showMessage('error');
        submitBtn.textContent = '✗ Gửi thất bại - Thử lại';
        submitBtn.style.backgroundColor = '#ef4444';
        submitBtn.disabled = false;
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.backgroundColor = '';
            hideMessages();
        }, 5000);
    }
}

// Send data to Google Sheets
async function sendToGoogleSheets(rowData) {
    try {
        console.log('Sending data to Google Sheets:', {
            url: GOOGLE_SCRIPT_URL,
            dataLength: rowData.length,
            firstFewFields: rowData.slice(0, 5)
        });
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: rowData })
        });
        
        // Với no-cors mode, không thể đọc response nhưng request đã được gửi
        // Log để debug
        console.log('Request sent successfully. Response status:', response.status);
        console.log('Full data being sent:', rowData);
        
        // Đợi một chút để đảm bảo request được xử lý
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return response;
    } catch (error) {
        console.error('Error sending to Google Sheets:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            data: rowData
        });
        throw error;
    }
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
// PHẦN ĐỌC VÀ HIỂN THỊ DỮ LIỆU ĐÃ BỊ XÓA
// Dữ liệu chỉ được gửi lên Google Sheets, không hiển thị trên website
// ============================================
