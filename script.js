// Google Sheets Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7fo6TcQIyb3D4AJzWvUzUR9Jxl0S8UiSxUmIAZ0RtMdymfUpEaCygbCkD2N_QEbw/exec'; // Google Apps Script URL

// Weight levels data
let weightLevels = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    restoreReporterInfoFromStorage();
});

function initializeForm() {
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

        // Khởi tạo bảng giá (III và IV) ngay khi tải trang, dựa trên các mốc trọng lượng hiện có
        updatePriceTables();
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
                updateComparisonTable();
            }
        }
    });
    
    // Price inputs - update comparison table
    document.addEventListener('input', function(e) {
        if (e.target.name && (e.target.name.includes('competitorPrice_') || e.target.name.includes('proposedPrice_'))) {
            updateComparisonTable();
        }
    });

    // Weight level inputs: khi thay đổi mốc trọng lượng thì bảng giá (III, IV)
    // phải cập nhật lại TRỌNG LƯỢNG tương ứng, nhưng giữ nguyên giá đã nhập
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

    // Giới hạn chọn duy nhất cho đặc tính hàng hóa
    const productCheckboxes = document.querySelectorAll('input[name="productNormal"], input[name="productLiquid"], input[name="productFlammable"], input[name="productFragile"]');
    productCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                productCheckboxes.forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
    
    // Giới hạn chọn duy nhất cho ngành hàng (chọn ngành chính)
    const industryCheckboxes = document.querySelectorAll('input[name="industry"]');
    industryCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                industryCheckboxes.forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
    
    // Form submission
    const form = document.getElementById('reportForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Lưu thông tin người báo cáo vào localStorage
function saveReporterInfoToStorage(formData) {
    try {
        const data = {
            reporterName: formData.reporterName || '',
            title: formData.title || '',
            branch: formData.branch || '',
            postOfficeName: formData.postOfficeName || ''
        };
        localStorage.setItem('reporterInfo', JSON.stringify(data));
    } catch (e) {
        console.warn('Không thể lưu thông tin người báo cáo vào trình duyệt:', e);
    }
}

// Khôi phục thông tin người báo cáo từ localStorage
function restoreReporterInfoFromStorage() {
    try {
        const raw = localStorage.getItem('reporterInfo');
        if (!raw) return;
        const data = JSON.parse(raw);
        const nameInput = document.querySelector('input[name="reporterName"]');
        const titleSelect = document.querySelector('select[name="title"]');
        const branchSelect = document.querySelector('select[name="branch"]');
        const poNameInput = document.querySelector('input[name="postOfficeName"]');
        
        if (nameInput && data.reporterName) nameInput.value = data.reporterName;
        if (titleSelect && data.title) titleSelect.value = data.title;
        if (branchSelect && data.branch) branchSelect.value = data.branch;
        if (poNameInput && data.postOfficeName) poNameInput.value = data.postOfficeName;
    } catch (e) {
        console.warn('Không thể khôi phục thông tin người báo cáo từ trình duyệt:', e);
    }
}

// Add weight level row
function addWeightLevel() {
    const tbody = document.getElementById('weightLevelsTable');
    const rowCount = tbody.children.length;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="weightFrom[]" class="w-full bg-yellow-50 weight-from p-0.5 md:p-1 text-center font-bold responsive-input" step="1" placeholder="0"></td>
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="weightTo[]" class="w-full bg-yellow-50 weight-to p-0.5 md:p-1 text-center font-bold responsive-input" step="1" placeholder="0"></td>
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="volumeProvince[]" class="volume-input w-full p-0.5 md:p-1 text-center font-bold bg-white responsive-input" step="1" value="0"></td>
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="volumeRegion[]" class="volume-input w-full p-0.5 md:p-1 text-center font-bold bg-white responsive-input" step="1" value="0"></td>
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="volumeAdjacent[]" class="volume-input w-full p-0.5 md:p-1 text-center font-bold bg-white responsive-input" step="1" value="0"></td>
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="volumeInter[]" class="volume-input w-full p-0.5 md:p-1 text-center font-bold bg-white responsive-input" step="1" value="0"></td>
        <td class="border border-gray-300 p-1 md:p-2 table-total text-center font-bold text-gray-800 responsive-text" data-total="0">0</td>
        <td class="border border-gray-300 p-1 md:p-2 text-center text-gray-600 responsive-text" data-percent="0%">0%</td>
        <td class="border border-gray-300 p-1 md:p-2 text-center">
            <button type="button" onclick="removeWeightLevel(this)" class="bg-red-500 hover:bg-red-600 text-white text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded transition-colors font-medium">Xóa</button>
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
    
    // Khi thêm hàng mới, cập nhật lại bảng giá để đồng bộ trọng lượng
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
    const regionPercentTotalEl = document.getElementById('regionPercentTotal');
    
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
    // Update tỷ trọng % theo khu vực (tổng của các phần trăm)
    if (regionPercentTotalEl) {
        const totalPercent = grandTotal > 0 ? 
            ((totalProvince + totalRegion + totalAdjacent + totalInter) / grandTotal * 100).toFixed(1) : 0;
        regionPercentTotalEl.textContent = totalPercent + '%';
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
    
    // Lưu lại giá đã nhập trước khi cập nhật trọng lượng
    const existingRows = tbody.querySelectorAll('tr');
    const savedPrices = [];
    existingRows.forEach((row, idx) => {
        // Lưu cả trọng lượng để đảm bảo không bị thay đổi
        const fromInput = row.querySelector(`input[name="competitorFrom_${idx}"]`);
        const toInput = row.querySelector(`input[name="competitorTo_${idx}"]`);
        savedPrices[idx] = {
            from: fromInput ? fromInput.value : '',
            to: toInput ? toInput.value : '',
            province: row.querySelector(`input[name="competitorPrice_${idx}_province"]`)?.value || '',
            region: row.querySelector(`input[name="competitorPrice_${idx}_region"]`)?.value || '',
            adjacent: row.querySelector(`input[name="competitorPrice_${idx}_adjacent"]`)?.value || '',
            inter: row.querySelector(`input[name="competitorPrice_${idx}_inter"]`)?.value || '',
            currentReturnRate: row.querySelector(`input[name="competitorCurrentReturnRate_${idx}"]`)?.value || '',
            competitorReturnRate: row.querySelector(`input[name="competitorReturnRate_${idx}"]`)?.value || ''
        };
    });
    
    tbody.innerHTML = '';
    
    // Khởi tạo lại bảng từ bảng trọng lượng, luôn bám theo MỨC TRỌNG LƯỢNG & SẢN LƯỢNG HÀNG GỬI
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    if (rows.length === 0) return;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        // Luôn lấy giá trị từ bảng đầu tiên, không dùng giá trị đã lưu
        const fromValue = fromInput ? (fromInput.value || '0') : '0';
        const toValue = toInput ? (toInput.value || '0') : '0';
        
        const saved = savedPrices[index] || {};
        
        // Đảm bảo các giá trị không phải undefined
        const savedProvince = saved.province || '';
        const savedRegion = saved.region || '';
        const savedAdjacent = saved.adjacent || '';
        const savedInter = saved.inter || '';
        const savedCurrentReturnRate = saved.currentReturnRate || '';
        const savedCompetitorReturnRate = saved.competitorReturnRate || '';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <span class="inline-flex items-center gap-1">
                    <input type="number" name="competitorFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" step="1" readonly disabled>
                    <span>-</span>
                    <input type="number" name="competitorTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" step="1" readonly disabled>
                </span>
            </td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_province" class="p-0 text-center bg-blue-50" step="0.01" value="${savedProvince}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_region" class="p-0 text-center bg-blue-50" step="0.01" value="${savedRegion}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_adjacent" class="p-0 text-center bg-blue-50" step="0.01" value="${savedAdjacent}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorPrice_${index}_inter" class="p-0 text-center bg-blue-50" step="0.01" value="${savedInter}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorCurrentReturnRate_${index}" class="p-0 text-center bg-blue-50" step="0.01" value="${savedCurrentReturnRate}" placeholder="Tỷ lệ hoàn hiện tại"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="competitorReturnRate_${index}" class="p-0 text-center bg-blue-50" step="0.01" value="${savedCompetitorReturnRate}" placeholder="Tỷ lệ hoàn đối thủ"></td>
        `;
        
        tbody.appendChild(tr);
    });
}

function updateProposedPriceTable() {
    const tbody = document.querySelector('#proposedPriceTable tbody');
    if (!tbody) return;
    
    // Lưu lại giá đã nhập trước khi cập nhật trọng lượng
    const existingRows = tbody.querySelectorAll('tr');
    const savedPrices = [];
    existingRows.forEach((row, idx) => {
        // Lưu cả trọng lượng để đảm bảo không bị thay đổi
        const fromInput = row.querySelector(`input[name="proposedFrom_${idx}"]`);
        const toInput = row.querySelector(`input[name="proposedTo_${idx}"]`);
        savedPrices[idx] = {
            from: fromInput ? fromInput.value : '',
            to: toInput ? toInput.value : '',
            province: row.querySelector(`input[name="proposedPrice_${idx}_province"]`)?.value || '',
            region: row.querySelector(`input[name="proposedPrice_${idx}_region"]`)?.value || '',
            adjacent: row.querySelector(`input[name="proposedPrice_${idx}_adjacent"]`)?.value || '',
            inter: row.querySelector(`input[name="proposedPrice_${idx}_inter"]`)?.value || '',
            proposedReturnRate: row.querySelector(`input[name="proposedReturnRate_${idx}"]`)?.value || ''
        };
    });
    
    tbody.innerHTML = '';
    
    // Khởi tạo lại bảng từ bảng trọng lượng, luôn bám theo MỨC TRỌNG LƯỢNG & SẢN LƯỢNG HÀNG GỬI
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    
    if (rows.length === 0) return;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        // Luôn lấy giá trị từ bảng đầu tiên, không dùng giá trị đã lưu
        const fromValue = fromInput ? (fromInput.value || '0') : '0';
        const toValue = toInput ? (toInput.value || '0') : '0';
        
        const saved = savedPrices[index] || {};
        
        // Đảm bảo các giá trị không phải undefined
        const savedProvince = saved.province || '';
        const savedRegion = saved.region || '';
        const savedAdjacent = saved.adjacent || '';
        const savedInter = saved.inter || '';
        const savedProposedReturnRate = saved.proposedReturnRate || '';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <span class="inline-flex items-center gap-1">
                    <input type="number" name="proposedFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" step="1" readonly disabled>
                    <span>-</span>
                    <input type="number" name="proposedTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" step="1" readonly disabled>
                </span>
            </td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_province" class="p-0 text-center bg-yellow-50" step="0.01" value="${savedProvince}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_region" class="p-0 text-center bg-yellow-50" step="0.01" value="${savedRegion}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_adjacent" class="p-0 text-center bg-yellow-50" step="0.01" value="${savedAdjacent}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedPrice_${index}_inter" class="p-0 text-center bg-yellow-50" step="0.01" value="${savedInter}"></td>
            <td class="border border-gray-300 p-1"><input type="number" name="proposedReturnRate_${index}" class="p-0 text-center bg-yellow-50" step="0.01" value="${savedProposedReturnRate}" placeholder="Tỷ lệ hoàn đề xuất"></td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Cập nhật bảng so sánh khi giá hoặc sản lượng thay đổi
function updateComparisonOnChange() {
    updateComparisonTable();
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
        customerName: document.querySelector('input[name="customerName"]').value.trim(),
        phone: document.querySelector('input[name="phone"]').value.trim(),
        address: document.querySelector('input[name="address"]').value.trim(),
        
        // Weight levels and volumes
        weightLevels: [],
        volumes: [],
        grandTotal: document.getElementById('grandTotal').textContent,
        
        // Product characteristics
        productNormal: document.querySelector('input[name="productNormal"]').checked,
        productLiquid: document.querySelector('input[name="productLiquid"]').checked,
        productFlammable: document.querySelector('input[name="productFlammable"]').checked,
        productFragile: document.querySelector('input[name="productFragile"]').checked,
        
        // Industry - chỉ lấy các checkbox được chọn (single select)
        industries: (() => {
            const checked = Array.from(document.querySelectorAll('input[name="industry"]:checked'));
            return checked.length > 0 ? [checked[0].value] : [];
        })(),
        industryOther: document.getElementById('inputOther') ? document.getElementById('inputOther').value.trim() : '',
        
        // Competitors
        competitors: Array.from(document.querySelectorAll('input[name="competitor"]:checked')).map(cb => cb.value),
        competitorOther: document.querySelector('input[name="competitorOther"]') ? document.querySelector('input[name="competitorOther"]').value.trim() : '',
        
        // Competitor prices
        competitorPrices: [],
        
        competitorOtherPolicies: document.querySelector('textarea[name="competitorOtherPolicies"]') ? document.querySelector('textarea[name="competitorOtherPolicies"]').value.trim() : '',
        
        over12mRatio: document.getElementById('over12mRatio') ? document.getElementById('over12mRatio').value : '',
        over12mPercent: document.getElementById('over12mPercent') ? document.getElementById('over12mPercent').value : '',
        over100kgRatio: document.getElementById('over100kgRatio') ? document.getElementById('over100kgRatio').value : '',
        specificProduct: document.getElementById('specificProduct') ? document.getElementById('specificProduct').value.trim() : '',
        
        // Proposed prices
        proposedPrices: [],
        
        proposedOtherPolicies: document.querySelector('textarea[name="proposedOtherPolicies"]') ? document.querySelector('textarea[name="proposedOtherPolicies"]').value.trim() : '',
        proposedReturnRate: '', // Sẽ được lấy từ proposedPrices sau
        
        // Reporter information - đảm bảo lấy đúng giá trị
        reporterName: document.querySelector('input[name="reporterName"]') ? document.querySelector('input[name="reporterName"]').value.trim() : '',
        title: document.querySelector('select[name="title"]') ? document.querySelector('select[name="title"]').value : '',
        reporterPhone: document.querySelector('input[name="reporterPhone"]') ? document.querySelector('input[name="reporterPhone"]').value.trim() : '',
        branch: document.querySelector('select[name="branch"]') ? document.querySelector('select[name="branch"]').value : '',
        postOfficeName: document.querySelector('input[name="postOfficeName"]') ? document.querySelector('input[name="postOfficeName"]').value.trim() : '',
        postOfficeCode: document.querySelector('input[name="postOfficeCode"]') ? document.querySelector('input[name="postOfficeCode"]').value.trim() : ''
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
            inter: row.querySelector(`input[name="competitorPrice_${index}_inter"]`).value,
            currentReturnRate: row.querySelector(`input[name="competitorCurrentReturnRate_${index}"]`)?.value || '',
            competitorReturnRate: row.querySelector(`input[name="competitorReturnRate_${index}"]`)?.value || ''
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
        
        // Chỉ thêm nếu có ít nhất 1 giá trị không rỗng
        const hasValue = (fromInput && fromInput.value) || (toInput && toInput.value) || 
                        (provinceInput && provinceInput.value) || (regionInput && regionInput.value) ||
                        (adjacentInput && adjacentInput.value) || (interInput && interInput.value);
        
        if (hasValue) {
            formData.proposedPrices.push({
                from: fromInput ? fromInput.value : '',
                to: toInput ? toInput.value : '',
                province: provinceInput ? provinceInput.value : '',
                region: regionInput ? regionInput.value : '',
                adjacent: adjacentInput ? adjacentInput.value : '',
                inter: interInput ? interInput.value : '',
                proposedReturnRate: row.querySelector(`input[name="proposedReturnRate_${index}"]`)?.value || ''
            });
        }
    });
    
    // Lấy proposedReturnRate từ dòng đầu tiên của proposedPrices
    if (formData.proposedPrices.length > 0 && formData.proposedPrices[0].proposedReturnRate) {
        formData.proposedReturnRate = formData.proposedPrices[0].proposedReturnRate;
    }
    
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
    
    // Lấy tỷ lệ hoàn từ các ô trong bảng (lấy từ dòng đầu tiên)
    const competitorCurrentReturnRate = document.querySelector('input[name="competitorCurrentReturnRate_0"]') ? document.querySelector('input[name="competitorCurrentReturnRate_0"]').value : '';
    const competitorReturnRate = document.querySelector('input[name="competitorReturnRate_0"]') ? document.querySelector('input[name="competitorReturnRate_0"]').value : '';
    
    const proposedReturnRate = document.querySelector('input[name="proposedReturnRate_0"]') ? document.querySelector('input[name="proposedReturnRate_0"]').value : '';
    
    // Thứ tự phải khớp với headers trong Google Sheets
    const row = [
        formData.timestamp,                                    // 1. Thời gian
        formData.customerName,                                // 2. Tên KH/Tên shop
        formData.phone,                                        // 3. Điện thoại
        formData.address,                                      // 4. Địa chỉ
        formData.weightLevels.map(w => {
            const from = (w.from && w.from.trim() !== '') ? w.from : '0';
            const to = (w.to && w.to.trim() !== '') ? w.to : '0';
            return `${from}-${to}`;
        }).filter(w => w !== '0-0' && w !== '-').join('; '), // 5. Các mốc trọng lượng
        grandTotal,                                            // 6. Tổng sản lượng các mốc
        totalWeightLevels.toString(),                          // 7. Tỷ trọng sản lượng
        formData.over12mRatio || '',                          // 8. Tỷ trọng hàng trên 1.2m
        formData.over12mPercent || '0%',                      // 9. Tỷ trọng % hàng trên 1.2m
        formData.over100kgRatio || '',                        // 10. Tỷ trọng hàng nguyên khối từ 100kg trở lên
        totalProvince,                                         // 11. Sản lượng Nội tỉnh
        totalRegion,                                           // 12. Sản lượng Nội miền
        totalAdjacent,                                         // 13. Sản lượng Cận miền
        totalInter,                                            // 14. Sản lượng Liên miền
        grandTotal,                                            // 15. Tổng sản lượng
        percentRatio,                                          // 16. Tỷ trọng %
        formData.productNormal ? 'Có' : 'Không',              // 17. Hàng thông thường
        formData.productLiquid ? 'Có' : 'Không',               // 18. Chất lỏng
        formData.productFlammable ? 'Có' : 'Không',            // 19. Dễ cháy
        formData.productFragile ? 'Có' : 'Không',              // 20. Dễ vỡ
        (() => {
            // Kết hợp industries và industryOther - NGÀNH HÀNG
            const industryList = formData.industries.filter(i => i && i.trim() !== '');
            if (formData.industryOther && formData.industryOther.trim() !== '') {
                industryList.push(formData.industryOther.trim());
            }
            return industryList.join('; ');
        })(),                                                    // 21. Ngành hàng
        formData.specificProduct || '',                        // 22. Sản phẩm cụ thể
        (() => {
            // Kết hợp competitors và competitorOther - ĐỐI THỦ
            const competitorList = formData.competitors.filter(c => c && c.trim() !== '');
            if (formData.competitorOther && formData.competitorOther.trim() !== '') {
                competitorList.push(formData.competitorOther.trim());
            }
            return competitorList.join('; ');
        })(),                                                    // 21. Đối thủ
        formData.competitorPrices.map(p => {
            const from = (p.from && p.from.trim() !== '') ? p.from : '0';
            const to = (p.to && p.to.trim() !== '') ? p.to : '0';
            const province = p.province || '';
            const region = p.region || '';
            const adjacent = p.adjacent || '';
            const inter = p.inter || '';
            return `${from}-${to}: ${province}/${region}/${adjacent}/${inter}`;
        }).filter(p => {
            // Chỉ giữ lại các giá có ít nhất 1 giá trị không rỗng
            return p !== '0-0: ///' && (p.includes(':') && p.split(':')[1].trim() !== '///');
        }).join(' | '), // 23. Giá đối thủ
        competitorCurrentReturnRate || '',                     // 24. Tỷ lệ hoàn hiện tại
        competitorReturnRate || '',                            // 25. Tỷ lệ hoàn đối thủ
        formData.competitorOtherPolicies || '',                // 30. Chính sách đặc thù đối thủ
        formData.proposedPrices.map(p => {
            const from = (p.from && p.from.trim() !== '') ? p.from : '0';
            const to = (p.to && p.to.trim() !== '') ? p.to : '0';
            const province = p.province || '';
            const region = p.region || '';
            const adjacent = p.adjacent || '';
            const inter = p.inter || '';
            return `${from}-${to}: ${province}/${region}/${adjacent}/${inter}`;
        }).filter(p => {
            // Chỉ giữ lại các giá có ít nhất 1 giá trị không rỗng
            return p !== '0-0: ///' && (p.includes(':') && p.split(':')[1].trim() !== '///');
        }).join(' | '), // 31. Giá đề xuất
        formData.proposedOtherPolicies || '',                  // 26. Chính sách đặc thù đề xuất
        proposedReturnRate || '',                              // 27. Tỷ lệ hoàn đề xuất
        formData.reporterName || '',                           // 38. Họ và tên người báo cáo
        formData.reporterPhone || '',                          // 39. Điện thoại người báo cáo
        formData.postOfficeName || '',                         // 40. Tên Bưu cục
        formData.title || '',                                  // 41. Chức danh
        formData.branch || '',                                 // 42. Chi nhánh
        (formData.postOfficeCode || '').toString()            // 43. Mã Bưu cục (đảm bảo là string để giữ nguyên text)
    ];
    
    return row;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate số điện thoại: chỉ số, bắt đầu bằng 0
    const customerPhoneInput = document.querySelector('input[name="phone"]');
    const reporterPhoneInput = document.querySelector('input[name="reporterPhone"]');
    const phoneRegex = /^0[0-9]{8,14}$/;
    if (customerPhoneInput && !phoneRegex.test(customerPhoneInput.value.trim())) {
        alert('Số điện thoại khách hàng phải bắt đầu bằng 0 và chỉ chứa số.');
        customerPhoneInput.focus();
        return;
    }
    if (reporterPhoneInput && !phoneRegex.test(reporterPhoneInput.value.trim())) {
        alert('Số điện thoại người báo cáo phải bắt đầu bằng 0 và chỉ chứa số.');
        reporterPhoneInput.focus();
        return;
    }
    
    // Validate tên bưu cục: không có khoảng trắng ở đầu và cuối
    const postOfficeNameInput = document.querySelector('input[name="postOfficeName"]');
    if (postOfficeNameInput) {
        const value = postOfficeNameInput.value;
        if (value !== value.trim()) {
            alert('Tên bưu cục không được có khoảng trắng ở đầu và cuối. Vui lòng nhập lại.');
            postOfficeNameInput.focus();
            postOfficeNameInput.value = value.trim();
            return;
        }
    }
    
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';
        
        // Collect và format dữ liệu
        const formData = collectFormData();
        // Lưu thông tin người báo cáo cho lần sau
        saveReporterInfoToStorage(formData);
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

// Cập nhật bảng so sánh đơn giá bình quân (mình - đối thủ - % chênh lệch)
function updateComparisonTable() {
    // Tính đơn giá bình quân từ các giá đã nhập và tổng sản lượng
    const grandTotalEl = document.getElementById('grandTotal');
    const grandTotal = grandTotalEl ? parseFloat(grandTotalEl.textContent.replace(/,/g, '')) || 0 : 0;
    
    let competitorAvgProvince = 0, competitorAvgRegion = 0, competitorAvgAdjacent = 0, competitorAvgInter = 0;
    let proposedAvgProvince = 0, proposedAvgRegion = 0, proposedAvgAdjacent = 0, proposedAvgInter = 0;
    
    if (grandTotal > 0) {
        const weightRows = document.querySelectorAll('#weightLevelsTable tr');
        const competitorRows = document.querySelectorAll('#competitorPriceTable tbody tr');
        const proposedRows = document.querySelectorAll('#proposedPriceTable tbody tr');
        
        weightRows.forEach((weightRow, idx) => {
            const volumeInputs = weightRow.querySelectorAll('.volume-input');
            const competitorRow = competitorRows[idx];
            const proposedRow = proposedRows[idx];
            
            if (competitorRow && volumeInputs.length >= 4) {
                const competitorPriceInputs = competitorRow.querySelectorAll('input[name^="competitorPrice_"]');
                for (let i = 0; i < 4 && i < volumeInputs.length && i < competitorPriceInputs.length; i++) {
                    const volume = parseFloat(volumeInputs[i].value) || 0;
                    const price = parseFloat(competitorPriceInputs[i].value) || 0;
                    const weightedAvg = (volume * price) / grandTotal;
                    if (i === 0) competitorAvgProvince += weightedAvg;
                    else if (i === 1) competitorAvgRegion += weightedAvg;
                    else if (i === 2) competitorAvgAdjacent += weightedAvg;
                    else if (i === 3) competitorAvgInter += weightedAvg;
                }
            }
            
            if (proposedRow && volumeInputs.length >= 4) {
                const proposedPriceInputs = proposedRow.querySelectorAll('input[name^="proposedPrice_"]');
                for (let i = 0; i < 4 && i < volumeInputs.length && i < proposedPriceInputs.length; i++) {
                    const volume = parseFloat(volumeInputs[i].value) || 0;
                    const price = parseFloat(proposedPriceInputs[i].value) || 0;
                    const weightedAvg = (volume * price) / grandTotal;
                    if (i === 0) proposedAvgProvince += weightedAvg;
                    else if (i === 1) proposedAvgRegion += weightedAvg;
                    else if (i === 2) proposedAvgAdjacent += weightedAvg;
                    else if (i === 3) proposedAvgInter += weightedAvg;
                }
            }
        });
    }
    
    const competitorProvince = competitorAvgProvince > 0 ? competitorAvgProvince.toFixed(2) : '';
    const competitorRegion = competitorAvgRegion > 0 ? competitorAvgRegion.toFixed(2) : '';
    const competitorAdjacent = competitorAvgAdjacent > 0 ? competitorAvgAdjacent.toFixed(2) : '';
    const competitorInter = competitorAvgInter > 0 ? competitorAvgInter.toFixed(2) : '';
    
    const proposedProvince = proposedAvgProvince > 0 ? proposedAvgProvince.toFixed(2) : '';
    const proposedRegion = proposedAvgRegion > 0 ? proposedAvgRegion.toFixed(2) : '';
    const proposedAdjacent = proposedAvgAdjacent > 0 ? proposedAvgAdjacent.toFixed(2) : '';
    const proposedInter = proposedAvgInter > 0 ? proposedAvgInter.toFixed(2) : '';
    
    const cells = {
        province: document.getElementById('compareProvince'),
        region: document.getElementById('compareRegion'),
        adjacent: document.getElementById('compareAdjacent'),
        inter: document.getElementById('compareInter')
    };
    
    function buildCell(proposed, competitor) {
        if (!cells.province) return '';
        const p = parseFloat((proposed || '').toString().replace(/,/g, ''));
        const c = parseFloat((competitor || '').toString().replace(/,/g, ''));
        
        if (isNaN(p) && isNaN(c)) return '';
        
        let diffText = '';
        if (!isNaN(p) && !isNaN(c) && c !== 0) {
            const diffPercent = ((p - c) / c) * 100;
            const sign = diffPercent > 0 ? '+' : '';
            diffText = `${sign}${diffPercent.toFixed(1)}%`;
        }
        
        const pText = !isNaN(p) ? formatNumber(p) : (proposed || '');
        const cText = !isNaN(c) ? formatNumber(c) : (competitor || '');
        
        return `
            <div>ĐX: ${pText || '-'}</div>
            <div>ĐT: ${cText || '-'}</div>
            <div>Δ: ${diffText || '-'}</div>
        `;
    }
    
    if (cells.province) {
        cells.province.innerHTML = buildCell(proposedProvince, competitorProvince);
        cells.region.innerHTML = buildCell(proposedRegion, competitorRegion);
        cells.adjacent.innerHTML = buildCell(proposedAdjacent, competitorAdjacent);
        cells.inter.innerHTML = buildCell(proposedInter, competitorInter);
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
