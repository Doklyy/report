// Google Sheets Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoJ0u7JhkBSuTaXLD_jwNDj-K3N6B8SCONYeHRVESqmB0cruDANBpAeKln4tJeYqj1/exec'; // Google Apps Script URL

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

    // Định dạng giá 1.000.000 khi blur (rời khỏi ô)
    document.addEventListener('blur', function(e) {
        if (e.target.classList && e.target.classList.contains('price-input')) {
            const val = e.target.value.trim();
            if (val) {
                const num = parseFormattedPrice(val);
                if (num > 0) {
                    e.target.value = formatPriceWithDots(num);
                }
            }
        }
    }, true);

    // Weight level inputs: khi thay đổi mốc trọng lượng thì bảng giá (III, IV)
    // phải cập nhật lại TRỌNG LƯỢNG tương ứng, nhưng giữ nguyên giá đã nhập
    // Và validate: Từ n < Đến n < Từ n+1 < Đến n+1
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('weight-from') || e.target.classList.contains('weight-to')) {
            validateWeightLevels();
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
    
    // Auto-save thông tin người báo cáo khi thay đổi (blur/change)
    const reporterFields = ['reporterName', 'title', 'reporterPhone', 'branch', 'postOfficeName', 'postOfficeCode'];
    reporterFields.forEach(name => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) {
            el.addEventListener('blur', () => saveReporterInfoToStorage(getReporterInfoFromForm()));
            el.addEventListener('change', () => saveReporterInfoToStorage(getReporterInfoFromForm()));
        }
    });
}

// Lưu thông tin người báo cáo vào localStorage
function saveReporterInfoToStorage(formData) {
    try {
        const data = {
            reporterName: formData.reporterName || '',
            title: formData.title || '',
            reporterPhone: formData.reporterPhone || '',
            branch: formData.branch || '',
            postOfficeName: formData.postOfficeName || '',
            postOfficeCode: formData.postOfficeCode || ''
        };
        localStorage.setItem('reporterInfo', JSON.stringify(data));
    } catch (e) {
        console.warn('Không thể lưu thông tin người báo cáo vào trình duyệt:', e);
    }
}

// Lấy thông tin người báo cáo từ form (dùng cho auto-save)
function getReporterInfoFromForm() {
    return {
        reporterName: document.querySelector('input[name="reporterName"]')?.value?.trim() || '',
        title: document.querySelector('select[name="title"]')?.value || '',
        reporterPhone: document.querySelector('input[name="reporterPhone"]')?.value?.trim() || '',
        branch: document.querySelector('select[name="branch"]')?.value || '',
        postOfficeName: document.querySelector('input[name="postOfficeName"]')?.value?.trim() || '',
        postOfficeCode: document.querySelector('input[name="postOfficeCode"]')?.value?.trim() || ''
    };
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
        const poCodeInput = document.querySelector('input[name="postOfficeCode"]');
        const phoneInput = document.querySelector('input[name="reporterPhone"]');
        
        if (nameInput && data.reporterName) nameInput.value = data.reporterName;
        if (titleSelect && data.title) titleSelect.value = data.title;
        if (branchSelect && data.branch) branchSelect.value = data.branch;
        if (poNameInput && data.postOfficeName) poNameInput.value = data.postOfficeName;
        if (poCodeInput && data.postOfficeCode) poCodeInput.value = data.postOfficeCode;
        if (phoneInput && data.reporterPhone) phoneInput.value = data.reporterPhone;
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
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="weightFrom[]" class="w-full bg-yellow-50 weight-from p-0.5 md:p-1 text-center font-bold responsive-input" step="1" min="0" placeholder="0"></td>
        <td class="border border-gray-300 p-1 md:p-2"><input type="number" name="weightTo[]" class="w-full bg-yellow-50 weight-to p-0.5 md:p-1 text-center font-bold responsive-input" step="1" min="0" placeholder="0"></td>
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
    
    // Attach event listeners to weight inputs
    const weightFromInput = row.querySelector('.weight-from');
    const weightToInput = row.querySelector('.weight-to');
    if (weightFromInput) {
        weightFromInput.addEventListener('input', function() {
            validateWeightLevels();
            updatePriceTables();
        });
    }
    if (weightToInput) {
        weightToInput.addEventListener('input', function() {
            validateWeightLevels();
            updatePriceTables();
        });
    }
    
    // Validate weight levels
    validateWeightLevels();
    
    // Khi thêm hàng mới, cập nhật lại bảng giá để đồng bộ trọng lượng
    updatePriceTables();
}

// Validate weight levels: Từ n < Đến n < Từ n+1 < Đến n+1
function validateWeightLevels() {
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    let isValid = true;
    let errorMessage = '';
    let errorRowIndex = -1;
    const errorInputs = []; // Lưu các input bị lỗi để không reset border
    
    // Reset border color cho tất cả các input trước
    rows.forEach(row => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        if (fromInput) {
            fromInput.style.borderColor = '';
            fromInput.style.borderWidth = '';
        }
        if (toInput) {
            toInput.style.borderColor = '';
            toInput.style.borderWidth = '';
        }
    });
    
    // Kiểm tra từng dòng
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        
        if (!fromInput || !toInput) continue;
        
        const fromValue = fromInput.value.trim();
        const toValue = toInput.value.trim();
        const from = parseFloat(fromValue) || 0;
        const to = parseFloat(toValue) || 0;
        
        // Bỏ qua validation nếu cả 2 ô đều trống
        if (!fromValue && !toValue) {
            continue;
        }
        
        // Validate: Từ < Đến trong cùng 1 dòng
        // Chỉ validate nếu cả 2 đều có giá trị
        if (fromValue && toValue) {
            if (from >= to) {
                isValid = false;
                errorMessage = `Dòng ${i + 1}: Giá trị "Từ" (${from}) phải nhỏ hơn "Đến" (${to})`;
                errorRowIndex = i;
                fromInput.style.borderColor = 'red';
                fromInput.style.borderWidth = '2px';
                toInput.style.borderColor = 'red';
                toInput.style.borderWidth = '2px';
                errorInputs.push(fromInput, toInput);
                break; // Dừng lại khi tìm thấy lỗi đầu tiên
            }
        }
        
        // Validate: Đến n < Từ n+1 (chỉ validate nếu có dòng tiếp theo)
        if (i < rows.length - 1 && toValue) {
            const nextRow = rows[i + 1];
            const nextFromInput = nextRow.querySelector('.weight-from');
            if (nextFromInput) {
                const nextFromValue = nextFromInput.value.trim();
                const nextFrom = parseFloat(nextFromValue) || 0;
                
                // Chỉ validate nếu dòng tiếp theo có giá trị "Từ"
                if (nextFromValue && to >= nextFrom) {
                    isValid = false;
                    errorMessage = `Dòng ${i + 1} và ${i + 2}: "Đến" của dòng ${i + 1} (${to}) phải nhỏ hơn "Từ" của dòng ${i + 2} (${nextFrom}). Các mốc trọng lượng không được chồng chéo.`;
                    errorRowIndex = i;
                    toInput.style.borderColor = 'red';
                    toInput.style.borderWidth = '2px';
                    nextFromInput.style.borderColor = 'red';
                    nextFromInput.style.borderWidth = '2px';
                    errorInputs.push(toInput, nextFromInput);
                    break; // Dừng lại khi tìm thấy lỗi đầu tiên
                }
            }
        }
    }
    
    // Hiển thị thông báo lỗi nếu có
    let errorDiv = document.getElementById('weightValidationError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'weightValidationError';
        errorDiv.className = 'text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-300 rounded';
        const tbody = document.getElementById('weightLevelsTable');
        const parent = tbody.parentElement;
        if (parent) {
            parent.insertBefore(errorDiv, tbody.nextSibling);
        }
    }
    
    if (!isValid) {
        errorDiv.textContent = '⚠️ ' + errorMessage;
        errorDiv.style.display = 'block';
        // Scroll đến dòng có lỗi
        if (errorRowIndex >= 0 && rows[errorRowIndex]) {
            setTimeout(() => {
                rows[errorRowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    } else {
        errorDiv.style.display = 'none';
    }
    
    return isValid;
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
    
    // Validate weight levels sau khi xóa
    validateWeightLevels();
    
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

// Định dạng giá tiền với dấu chấm (1.000.000) - dùng cho Giá Đối thủ và Giá Đề xuất
function formatPriceWithDots(num) {
    if (num === null || num === undefined || num === '' || isNaN(num)) return '';
    const n = parseFloat(String(num).replace(/\./g, '').replace(/,/g, ''));
    if (isNaN(n) || n === 0) return '';
    const intPart = Math.round(n).toString();
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Chuyển chuỗi đã format (1.000.000) về số
function parseFormattedPrice(str) {
    if (!str || typeof str !== 'string') return 0;
    const cleaned = String(str).replace(/\./g, '').replace(/,/g, '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
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
    
    const savedReturnRates = {
        current: document.querySelector('input[name="competitorCurrentReturnRate_0"]')?.value || '',
        competitor: document.querySelector('input[name="competitorReturnRate_0"]')?.value || ''
    };
    
    const existingRows = tbody.querySelectorAll('tr');
    const savedPrices = [];
    existingRows.forEach((row, idx) => {
        const fromInput = row.querySelector(`input[name="competitorFrom_${idx}"]`);
        const toInput = row.querySelector(`input[name="competitorTo_${idx}"]`);
        savedPrices[idx] = {
            from: fromInput ? fromInput.value : '',
            to: toInput ? toInput.value : '',
            province: row.querySelector(`input[name="competitorPrice_${idx}_province"]`)?.value || '',
            region: row.querySelector(`input[name="competitorPrice_${idx}_region"]`)?.value || '',
            adjacent: row.querySelector(`input[name="competitorPrice_${idx}_adjacent"]`)?.value || '',
            inter: row.querySelector(`input[name="competitorPrice_${idx}_inter"]`)?.value || ''
        };
    });
    
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    if (rows.length === 0) return;
    
    tbody.innerHTML = '';
    
    const numRows = rows.length;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const fromValue = fromInput ? (fromInput.value || '0') : '0';
        const toValue = toInput ? (toInput.value || '0') : '0';
        
        const saved = savedPrices[index] || {};
        const savedProvince = saved.province || '';
        const savedRegion = saved.region || '';
        const savedAdjacent = saved.adjacent || '';
        const savedInter = saved.inter || '';
        
        const tr = document.createElement('tr');
        const returnRateCells = index === 0
            ? `<td class="border border-gray-300 p-1 bg-blue-50" rowspan="${numRows}"><input type="number" name="competitorCurrentReturnRate_0" class="p-0 text-center bg-blue-50 w-full" step="0.01" value="${savedReturnRates.current}" placeholder="%" required></td>
               <td class="border border-gray-300 p-1 bg-blue-50" rowspan="${numRows}"><input type="number" name="competitorReturnRate_0" class="p-0 text-center bg-blue-50 w-full" step="0.01" value="${savedReturnRates.competitor}" placeholder="%" required></td>`
            : '';
        
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <span class="inline-flex items-center gap-1">
                    <input type="number" name="competitorFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" step="1" readonly disabled>
                    <span>-</span>
                    <input type="number" name="competitorTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" step="1" readonly disabled>
                </span>
            </td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorPrice_${index}_province" class="price-input p-0 text-center bg-blue-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedProvince}" required></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorPrice_${index}_region" class="price-input p-0 text-center bg-blue-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedRegion}" required></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorPrice_${index}_adjacent" class="price-input p-0 text-center bg-blue-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedAdjacent}" required></td>
            <td class="border border-gray-300 p-1"><input type="text" name="competitorPrice_${index}_inter" class="price-input p-0 text-center bg-blue-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedInter}" required></td>
            ${returnRateCells}
        `;
        
        tbody.appendChild(tr);
    });
}

function updateProposedPriceTable() {
    const tbody = document.querySelector('#proposedPriceTable tbody');
    if (!tbody) return;
    
    const savedProposedReturnRate = document.querySelector('input[name="proposedReturnRate_0"]')?.value || '';
    
    const existingRows = tbody.querySelectorAll('tr');
    const savedPrices = [];
    existingRows.forEach((row, idx) => {
        const fromInput = row.querySelector(`input[name="proposedFrom_${idx}"]`);
        const toInput = row.querySelector(`input[name="proposedTo_${idx}"]`);
        savedPrices[idx] = {
            from: fromInput ? fromInput.value : '',
            to: toInput ? toInput.value : '',
            province: row.querySelector(`input[name="proposedPrice_${idx}_province"]`)?.value || '',
            region: row.querySelector(`input[name="proposedPrice_${idx}_region"]`)?.value || '',
            adjacent: row.querySelector(`input[name="proposedPrice_${idx}_adjacent"]`)?.value || '',
            inter: row.querySelector(`input[name="proposedPrice_${idx}_inter"]`)?.value || ''
        };
    });
    
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    if (rows.length === 0) return;
    
    tbody.innerHTML = '';
    
    const numRows = rows.length;
    
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const fromValue = fromInput ? (fromInput.value || '0') : '0';
        const toValue = toInput ? (toInput.value || '0') : '0';
        
        const saved = savedPrices[index] || {};
        const savedProvince = saved.province || '';
        const savedRegion = saved.region || '';
        const savedAdjacent = saved.adjacent || '';
        const savedInter = saved.inter || '';
        
        const tr = document.createElement('tr');
        const returnRateCell = index === 0
            ? `<td class="border border-gray-300 p-1 bg-amber-50" rowspan="${numRows}"><input type="number" name="proposedReturnRate_0" class="p-0 text-center bg-yellow-50 w-full" step="0.01" value="${savedProposedReturnRate}" placeholder="%" required></td>`
            : '';
        
        tr.innerHTML = `
            <td class="border border-gray-300 p-1 text-center font-bold">
                <span class="inline-flex items-center gap-1">
                    <input type="number" name="proposedFrom_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${fromValue}" step="1" readonly disabled>
                    <span>-</span>
                    <input type="number" name="proposedTo_${index}" class="w-10 text-[10px] p-0 text-center bg-yellow-50" value="${toValue}" step="1" readonly disabled>
                </span>
            </td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedPrice_${index}_province" class="price-input p-0 text-center bg-yellow-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedProvince}" required></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedPrice_${index}_region" class="price-input p-0 text-center bg-yellow-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedRegion}" required></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedPrice_${index}_adjacent" class="price-input p-0 text-center bg-yellow-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedAdjacent}" required></td>
            <td class="border border-gray-300 p-1"><input type="text" name="proposedPrice_${index}_inter" class="price-input p-0 text-center bg-yellow-50" inputmode="decimal" placeholder="VD: 1000000" value="${savedInter}" required></td>
            ${returnRateCell}
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
        
        // Competitors - chỉ lấy 1 đối thủ (radio button)
        competitors: (() => {
            const checked = document.querySelector('input[name="competitor"]:checked');
            return checked ? [checked.value] : [];
        })(),
        competitorOther: '', // Không còn dùng nữa
        
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
    
    // Collect competitor prices (Tỷ lệ hoàn lấy từ ô duy nhất _0)
    const competitorRows = document.querySelectorAll('#competitorPriceTable tbody tr');
    const competitorCurrentReturnRate = document.querySelector('input[name="competitorCurrentReturnRate_0"]')?.value || '';
    const competitorReturnRate = document.querySelector('input[name="competitorReturnRate_0"]')?.value || '';
    competitorRows.forEach((row, index) => {
        formData.competitorPrices.push({
            from: row.querySelector(`input[name="competitorFrom_${index}"]`)?.value || '',
            to: row.querySelector(`input[name="competitorTo_${index}"]`)?.value || '',
            province: row.querySelector(`input[name="competitorPrice_${index}_province"]`)?.value || '',
            region: row.querySelector(`input[name="competitorPrice_${index}_region"]`)?.value || '',
            adjacent: row.querySelector(`input[name="competitorPrice_${index}_adjacent"]`)?.value || '',
            inter: row.querySelector(`input[name="competitorPrice_${index}_inter"]`)?.value || '',
            currentReturnRate: competitorCurrentReturnRate,
            competitorReturnRate: competitorReturnRate
        });
    });
    
    // Collect proposed prices (Tỷ lệ hoàn đề xuất lấy từ ô duy nhất _0)
    const proposedReturnRate = document.querySelector('input[name="proposedReturnRate_0"]')?.value || '';
    const proposedRows = document.querySelectorAll('#proposedPriceTable tbody tr');
    proposedRows.forEach((row, index) => {
        const fromInput = row.querySelector(`input[name="proposedFrom_${index}"]`);
        const toInput = row.querySelector(`input[name="proposedTo_${index}"]`);
        const provinceInput = row.querySelector(`input[name="proposedPrice_${index}_province"]`);
        const regionInput = row.querySelector(`input[name="proposedPrice_${index}_region"]`);
        const adjacentInput = row.querySelector(`input[name="proposedPrice_${index}_adjacent"]`);
        const interInput = row.querySelector(`input[name="proposedPrice_${index}_inter"]`);
        
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
                proposedReturnRate: proposedReturnRate
            });
        }
    });
    
    formData.proposedReturnRate = proposedReturnRate;
    
    return formData;
}

// Format data for Google Sheets - Mỗi mốc trọng lượng = 1 dòng riêng, các thông tin chung được merge
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
    
    // Tính tỷ trọng % theo khu vực (dựa trên grandTotal để khớp với hiển thị trong bảng)
    const grandTotalNum = parseFloat(grandTotal) || 0;
    const percentProvince = grandTotalNum > 0 ? ((parseFloat(totalProvince) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentRegion = grandTotalNum > 0 ? ((parseFloat(totalRegion) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentAdjacent = grandTotalNum > 0 ? ((parseFloat(totalAdjacent) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentInter = grandTotalNum > 0 ? ((parseFloat(totalInter) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    
    // Lấy tỷ lệ hoàn từ các ô trong bảng
    const competitorCurrentReturnRate = document.querySelector('input[name="competitorCurrentReturnRate_0"]') ? document.querySelector('input[name="competitorCurrentReturnRate_0"]').value : '';
    const competitorReturnRate = document.querySelector('input[name="competitorReturnRate_0"]') ? document.querySelector('input[name="competitorReturnRate_0"]').value : '';
    
    const proposedReturnRate = formData.proposedReturnRate || '';
    
    // Tính đơn giá bình quân cho đối thủ và đề xuất
    const calculateWeightedAverage = (prices, volumes) => {
        if (!prices || prices.length === 0 || !volumes || volumes.length === 0) return { province: '', region: '', adjacent: '', inter: '' };
        
        let totalWeightProvince = 0, totalWeightRegion = 0, totalWeightAdjacent = 0, totalWeightInter = 0;
        let totalVolumeProvince = 0, totalVolumeRegion = 0, totalVolumeAdjacent = 0, totalVolumeInter = 0;
        
        prices.forEach((price, idx) => {
            const volume = volumes[idx] || {};
            const volProvince = parseFloat(volume.province || 0);
            const volRegion = parseFloat(volume.region || 0);
            const volAdjacent = parseFloat(volume.adjacent || 0);
            const volInter = parseFloat(volume.inter || 0);
            
            const priceProvince = parseFormattedPrice(price.province || 0);
            const priceRegion = parseFormattedPrice(price.region || 0);
            const priceAdjacent = parseFormattedPrice(price.adjacent || 0);
            const priceInter = parseFormattedPrice(price.inter || 0);
            
            totalWeightProvince += priceProvince * volProvince;
            totalWeightRegion += priceRegion * volRegion;
            totalWeightAdjacent += priceAdjacent * volAdjacent;
            totalWeightInter += priceInter * volInter;
            
            totalVolumeProvince += volProvince;
            totalVolumeRegion += volRegion;
            totalVolumeAdjacent += volAdjacent;
            totalVolumeInter += volInter;
        });
        
        return {
            province: totalVolumeProvince > 0 ? (totalWeightProvince / totalVolumeProvince).toFixed(2) : '',
            region: totalVolumeRegion > 0 ? (totalWeightRegion / totalVolumeRegion).toFixed(2) : '',
            adjacent: totalVolumeAdjacent > 0 ? (totalWeightAdjacent / totalVolumeAdjacent).toFixed(2) : '',
            inter: totalVolumeInter > 0 ? (totalWeightInter / totalVolumeInter).toFixed(2) : ''
        };
    };
    
    // Lấy volumes từ formData.volumes
    const volumes = formData.volumes || [];
    
    const competitorAvg = calculateWeightedAverage(formData.competitorPrices, volumes);
    const proposedAvg = calculateWeightedAverage(formData.proposedPrices, volumes);
    
    // Tính so sánh đơn giá bình quân
    const calcPercentDiff = (own, comp) => {
        const ownNum = parseFloat(own) || 0;
        const compNum = parseFloat(comp) || 0;
        if (compNum === 0) {
            if (ownNum > 0) return '+100.0%';
            return '0.0%';
        }
        const diff = ((ownNum - compNum) / compNum) * 100;
        const sign = diff >= 0 ? '+' : '';
        return sign + diff.toFixed(1) + '%';
    };
    
    const formatValue = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? '' : num.toFixed(2);
    };
    
    const formatCell = (own, comp) => {
        const ownFormatted = formatValue(own);
        const compFormatted = formatValue(comp);
        const percentDiff = calcPercentDiff(own, comp);
        if (!ownFormatted && !compFormatted) return '';
        return `${ownFormatted || '0'}/${compFormatted || '0'}/${percentDiff}`;
    };
    
    // So sánh đơn giá bình quân - 4 cột riêng (N.Tỉnh, N.Miền, C.Miền, L.Miền)
    const comparisonProvince = formatCell(proposedAvg.province || '', competitorAvg.province || '');
    const comparisonRegion = formatCell(proposedAvg.region || '', competitorAvg.region || '');
    const comparisonAdjacent = formatCell(proposedAvg.adjacent || '', competitorAvg.adjacent || '');
    const comparisonInter = formatCell(proposedAvg.inter || '0', competitorAvg.inter || '');
    
    // Tạo mảng các rows - mỗi mốc trọng lượng = 1 row
    // 64 cột: Các mốc=2 hàng, SL hàng gửi/Tỷ trọng %/Giá ĐT/Giá ĐX=4 cột mỗi, So sánh=4 cột
    const rows = [];
    
    const commonData = [
        formData.timestamp,                                    // 1. Thời gian
        formData.customerName,                                // 2. Tên KH/Tên shop
        formData.phone,                                        // 3. Điện thoại
        formData.address,                                      // 4. Địa chỉ
        '',                                                    // 5. Các mốc trọng lượng (sẽ điền riêng)
        '', '', '', '',                                        // 6-9. Tổng sản lượng các mốc: N.Tỉnh, N.Miền, C.Miền, L.Miền (4 cột, điền riêng)
        '',                                                    // 10. Tổng (tổng mỗi mốc = 6+7+8+9, điền riêng)
        percentProvince, percentRegion, percentAdjacent, percentInter,  // 11-14. Tỷ trọng % theo khu vực (4 cột)
        formData.over12mRatio || '',                          // 15. Tỷ trọng hàng trên 1.2m
        formData.over100kgRatio || '',                        // 16. Tỷ trọng hàng nguyên khối từ 100kg trở lên
        totalProvince,                                         // 17. Sản lượng Nội tỉnh
        totalRegion,                                           // 18. Sản lượng Nội miền
        totalAdjacent,                                         // 19. Sản lượng Cận miền
        totalInter,                                            // 20. Sản lượng Liên miền
        grandTotal,                                            // 21. Tổng sản lượng (grand total - merge)
        '',                                                    // 22. Tỷ trọng % (điền riêng theo mỗi mốc)
        formData.productNormal ? 'Thông thường' : '',         // 23. Hàng thông thường
        formData.productLiquid ? 'Chất lỏng' : '',            // 24. Chất lỏng
        formData.productFlammable ? 'Dễ cháy' : '',           // 25. Dễ cháy
        formData.productFragile ? 'Dễ vỡ' : '',               // 26. Dễ vỡ
        (() => {
            const industryList = formData.industries.filter(i => i && i.trim() !== '');
            if (formData.industryOther && formData.industryOther.trim() !== '') {
                industryList.push(formData.industryOther.trim());
            }
            return industryList.join('; ');
        })(),                                                    // 27. Ngành hàng
        formData.specificProduct || '',                          // 28. Tên sản phẩm
        formData.competitors.length > 0 ? formData.competitors[0] : '', // 29. Đối thủ
        '',                                                    // 31. Đối thủ khác
        '', '', '', '',                                        // 32-35. Giá đối thủ: N.Tỉnh, N.Miền, C.Miền, L.Miền (4 cột, điền riêng)
        competitorAvg.province || '',                          // 36. Đơn giá bình quân Nội tỉnh (ĐT)
        competitorAvg.region || '',                            // 37. Đơn giá bình quân Nội miền (ĐT)
        competitorAvg.adjacent || '',                          // 38. Đơn giá bình quân Cận miền (ĐT)
        competitorAvg.inter || '',                             // 39. Đơn giá bình quân Liên miền (ĐT)
        competitorCurrentReturnRate || '',                     // 40. Tỷ lệ hoàn hiện tại
        competitorReturnRate || '',                            // 41. Tỷ lệ hoàn đối thủ miễn phí
        formData.competitorOtherPolicies || '',                // 42. Chính sách đặc thù đối thủ
        '', '', '', '',                                        // 43-46. Giá đề xuất: N.Tỉnh, N.Miền, C.Miền, L.Miền (4 cột, điền riêng)
        proposedAvg.province || '',                            // 47. Đơn giá bình quân Nội tỉnh (ĐX)
        proposedAvg.region || '',                              // 48. Đơn giá bình quân Nội miền (ĐX)
        proposedAvg.adjacent || '',                            // 49. Đơn giá bình quân Cận miền (ĐX)
        proposedAvg.inter || '',                               // 50. Đơn giá bình quân Liên miền (ĐX)
        formData.proposedOtherPolicies || '',                  // 51. Chính sách đặc thù đề xuất
        proposedReturnRate || '',                             // 52. Tỷ lệ hoàn đề xuất
        comparisonProvince, comparisonRegion, comparisonAdjacent, comparisonInter,  // 53-56. So sánh đơn giá bình quân (4 cột)
        formData.reporterName || '',                           // 57. Họ và tên người báo cáo
        formData.reporterPhone || '',                          // 58. Điện thoại người báo cáo
        formData.postOfficeName || '',                         // 59. Tên Bưu cục
        formData.title || '',                                  // 60. Chức danh
        formData.branch || '',                                 // 61. Chi nhánh
        (formData.postOfficeCode || '').toString(),           // 62. Mã Bưu cục
        '',                                                    // 63. Kết quả - điền trong Sheet
        ''                                                     // 64. Ghi chú - điền trong Sheet
    ];
    
    // Tạo 1 row cho mỗi mốc trọng lượng (2 hàng nếu 2 mốc)
    formData.weightLevels.forEach((weightLevel, index) => {
        const from = (weightLevel.from && weightLevel.from.trim() !== '') ? weightLevel.from : '0';
        const to = (weightLevel.to && weightLevel.to.trim() !== '') ? weightLevel.to : '0';
        const weightRange = `${from}-${to}`;
        
        if (weightRange === '0-0' || weightRange === '-') return; // Bỏ qua các mốc không hợp lệ
        
        const competitorPrice = formData.competitorPrices[index] || {};
        const proposedPrice = formData.proposedPrices[index] || {};
        const volume = formData.volumes[index] || {};
        
        // Tổng mỗi mốc = N.Tỉnh + N.Miền + C.Miền + L.Miền
        const volP = parseFloat(volume.province || 0);
        const volR = parseFloat(volume.region || 0);
        const volA = parseFloat(volume.adjacent || 0);
        const volI = parseFloat(volume.inter || 0);
        const rowTotal = (volP + volR + volA + volI).toString();
        // Tỷ trọng % theo mốc = (tổng mỗi mốc / tổng sản lượng) * 100
        const grandTotalNum = parseFloat(grandTotal) || 0;
        const rowPercent = grandTotalNum > 0 ? ((volP + volR + volA + volI) / grandTotalNum * 100).toFixed(1) + '%' : '0%';
        
        const row = [...commonData];
        row[4] = weightRange;   // 5. Các mốc trọng lượng
        row[21] = rowPercent;   // 22. Tỷ trọng % (theo mỗi mốc trọng lượng)
        row[5] = volume.province || '0';   // 6. Tổng SL các mốc - N.Tỉnh
        row[6] = volume.region || '0';    // 7. N.Miền
        row[7] = volume.adjacent || '0';   // 8. C.Miền
        row[8] = volume.inter || '0';      // 9. L.Miền
        row[9] = rowTotal;   // 10. Tổng (tổng mỗi mốc)
        // Format giá 1.000.000 khi gửi lên Google Sheet
        const fmtPrice = (v) => { const n = parseFormattedPrice(v || ''); return n > 0 ? formatPriceWithDots(n) : (v || ''); };
        row[30] = fmtPrice(competitorPrice.province);  // 31. Giá ĐT N.Tỉnh
        row[31] = fmtPrice(competitorPrice.region);   // 32. Giá ĐT N.Miền
        row[32] = fmtPrice(competitorPrice.adjacent); // 33. Giá ĐT C.Miền
        row[33] = fmtPrice(competitorPrice.inter);    // 34. Giá ĐT L.Miền
        row[41] = fmtPrice(proposedPrice.province);   // 42. Giá ĐX N.Tỉnh
        row[42] = fmtPrice(proposedPrice.region);    // 43. Giá ĐX N.Miền
        row[43] = fmtPrice(proposedPrice.adjacent);  // 44. Giá ĐX C.Miền
        row[44] = fmtPrice(proposedPrice.inter);     // 45. Giá ĐX L.Miền
        
        rows.push(row);
    });
    
    return rows; // Trả về mảng các rows
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
    
    // Validate ngành hàng (bắt buộc chọn)
    const industryChecked = document.querySelector('input[name="industry"]:checked');
    if (!industryChecked) {
        alert('Vui lòng chọn ngành hàng.');
        const firstIndustry = document.querySelector('input[name="industry"]');
        if (firstIndustry) {
            firstIndustry.closest('label')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Validate đối thủ (bắt buộc chọn)
    const competitorChecked = document.querySelector('input[name="competitor"]:checked');
    if (!competitorChecked) {
        alert('Vui lòng chọn đối thủ đang phục vụ.');
        const firstCompetitor = document.querySelector('input[name="competitor"]');
        if (firstCompetitor) {
            firstCompetitor.closest('label')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Validate sản phẩm cụ thể (bắt buộc điền)
    const specificProductInput = document.getElementById('specificProduct');
    if (!specificProductInput || !specificProductInput.value.trim()) {
        alert('Vui lòng nhập tên sản phẩm cụ thể.');
        if (specificProductInput) {
            specificProductInput.focus();
            specificProductInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Validate weight levels: Từ n < Đến n < Từ n+1 < Đến n+1
    if (!validateWeightLevels()) {
        alert('Vui lòng kiểm tra lại các mốc trọng lượng. Giá trị "Từ" phải nhỏ hơn "Đến" và các mốc không được chồng chéo.');
        return;
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
                    const price = parseFormattedPrice(competitorPriceInputs[i].value);
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
                    const price = parseFormattedPrice(proposedPriceInputs[i].value);
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

// Send data to Google Sheets - Gửi mảng các rows (mỗi mốc trọng lượng = 1 row)
async function sendToGoogleSheets(rowsData) {
    try {
        console.log('Sending data to Google Sheets:', {
            url: GOOGLE_SCRIPT_URL,
            numberOfRows: rowsData.length,
            firstRowFirstFewFields: rowsData[0] ? rowsData[0].slice(0, 5) : []
        });
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: rowsData, mergeCells: true }) // Thêm flag để merge cells
        });
        
        // Với no-cors mode, không thể đọc response nhưng request đã được gửi
        // Log để debug
        console.log('Request sent successfully. Response status:', response.status);
        console.log('Full data being sent:', rowsData);
        
        // Đợi một chút để đảm bảo request được xử lý
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return response;
    } catch (error) {
        console.error('Error sending to Google Sheets:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            data: rowsData
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