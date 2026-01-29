// Google Sheets Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzW3FMSOPi3mnuThCqkVMWYC4Vnye5Lypq0O9H2zpMfyq-2bJCUek6vmkhh-hAVmjmi/exec'; // Google Apps Script URL

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
            validateWeightRanges();
            updatePriceTables();
        }
    });
    
    // Validation khi blur khỏi input trọng lượng
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('weight-from') || e.target.classList.contains('weight-to')) {
            validateWeightRanges();
        }
    }, true);


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
        
        // Attach validation for weight inputs
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        if (fromInput) {
            fromInput.addEventListener('blur', validateWeightRanges);
            fromInput.addEventListener('input', validateWeightRanges);
        }
        if (toInput) {
            toInput.addEventListener('blur', validateWeightRanges);
            toInput.addEventListener('input', validateWeightRanges);
        }
    });
    
    // Auto-format "%" for percentage inputs
    setupPercentageInputValidation();
    
    // Auto-format "%" for return rate inputs (sẽ được thêm động trong updatePriceTables)
    // Hàm này sẽ được gọi sau khi các bảng giá được tạo

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
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        // Đảm bảo form không submit theo cách mặc định
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            return false;
        }, false);
    }
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
    
    // Attach event listeners to weight inputs for validation
    const fromInput = row.querySelector('.weight-from');
    const toInput = row.querySelector('.weight-to');
    if (fromInput) {
        fromInput.addEventListener('blur', validateWeightRanges);
        fromInput.addEventListener('input', validateWeightRanges);
    }
    if (toInput) {
        toInput.addEventListener('blur', validateWeightRanges);
        toInput.addEventListener('input', validateWeightRanges);
    }
    
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

// Validate weight ranges: Đảm bảo "Từ n < đến n < từ n+1 < đến n+1"
function validateWeightRanges() {
    const rows = document.querySelectorAll('#weightLevelsTable tr');
    const errors = [];
    
    // Sắp xếp các mốc theo "Từ" để kiểm tra
    const ranges = [];
    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.weight-from');
        const toInput = row.querySelector('.weight-to');
        const from = parseFloat(fromInput?.value) || 0;
        const to = parseFloat(toInput?.value) || 0;
        
        if (fromInput && toInput && (from > 0 || to > 0)) {
            ranges.push({ index, from, to, fromInput, toInput });
        }
    });
    
    // Sắp xếp theo "Từ" tăng dần
    ranges.sort((a, b) => a.from - b.from);
    
    // Kiểm tra từng cặp liên tiếp
    for (let i = 0; i < ranges.length; i++) {
        const current = ranges[i];
        
        // Kiểm tra "Từ" < "Đến" trong cùng một mốc
        if (current.from >= current.to && current.to > 0) {
            errors.push(`Mốc ${i + 1}: "Từ" (${current.from}) phải nhỏ hơn "Đến" (${current.to})`);
            if (current.fromInput) current.fromInput.style.borderColor = 'red';
            if (current.toInput) current.toInput.style.borderColor = 'red';
        } else {
            if (current.fromInput) current.fromInput.style.borderColor = '';
            if (current.toInput) current.toInput.style.borderColor = '';
        }
        
        // Kiểm tra với mốc tiếp theo
        if (i < ranges.length - 1) {
            const next = ranges[i + 1];
            
            // Kiểm tra "Đến" của mốc hiện tại < "Từ" của mốc tiếp theo
            if (current.to >= next.from && current.to > 0 && next.from > 0) {
                errors.push(`Mốc ${i + 1} và ${i + 2}: "Đến" của mốc ${i + 1} (${current.to}) phải nhỏ hơn "Từ" của mốc ${i + 2} (${next.from})`);
                if (current.toInput) current.toInput.style.borderColor = 'red';
                if (next.fromInput) next.fromInput.style.borderColor = 'red';
            }
        }
    }
    
    // Hiển thị lỗi nếu có
    let errorMsg = document.getElementById('weightValidationError');
    if (errors.length > 0) {
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = 'weightValidationError';
            errorMsg.className = 'text-red-600 text-sm mt-2 p-2 bg-red-50 rounded';
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.parentNode.insertBefore(errorMsg, tableContainer.nextSibling);
            }
        }
        errorMsg.innerHTML = '<strong>Lỗi validation:</strong><br>' + errors.join('<br>');
    } else {
        if (errorMsg) {
            errorMsg.remove();
        }
    }
    
    return errors.length === 0;
}

// Format percentage input: Tự động thêm "%" khi người dùng nhập số
function formatPercentageInput(input) {
    if (!input) return;
    
    // Lấy giá trị số (bỏ % và các ký tự không phải số)
    let value = input.value.replace(/[^0-9.,]/g, '').replace(',', '.').trim();
    
    // Nếu là số hợp lệ, thêm %
    if (value !== '' && !isNaN(value) && value !== '') {
        // Làm tròn đến 2 chữ số thập phân nếu có
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // Format: nếu là số nguyên thì không hiển thị .00, nếu có thập phân thì hiển thị tối đa 2 chữ số
            const formatted = numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
            input.value = formatted + '%';
        }
    } else if (value === '') {
        input.value = '';
    }
}

// Validate và chỉ cho phép nhập số cho percentage inputs
function setupPercentageInputValidation() {
    const percentageInputs = document.querySelectorAll('#over12mRatio, #over100kgRatio');
    percentageInputs.forEach(input => {
        // Chỉ cho phép nhập số và dấu chấm/phẩy
        input.addEventListener('input', function(e) {
            // Cho phép nhập số, dấu chấm, dấu phẩy
            let value = this.value.replace(/[^0-9.,]/g, '');
            // Chỉ cho phép 1 dấu chấm hoặc phẩy
            const parts = value.split(/[.,]/);
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            this.value = value;
        });
        
        // Format khi blur
        input.addEventListener('blur', function() {
            formatPercentageInput(this);
        });
    });
}

// Setup percentage inputs for existing elements (được gọi sau khi bảng giá được tạo)
function setupPercentageInputs() {
    // Setup for competitor return rate inputs
    const competitorInputs = document.querySelectorAll('input[name^="competitorCurrentReturnRate_"], input[name^="competitorReturnRate_"]');
    competitorInputs.forEach(input => {
        // Chỉ thêm listener nếu chưa có
        if (!input.hasAttribute('data-percentage-setup')) {
            input.setAttribute('data-percentage-setup', 'true');
            input.addEventListener('blur', function() {
                formatPercentageInput(this);
            });
        }
    });
    
    // Setup for proposed return rate inputs
    const proposedInputs = document.querySelectorAll('input[name^="proposedReturnRate_"]');
    proposedInputs.forEach(input => {
        // Chỉ thêm listener nếu chưa có
        if (!input.hasAttribute('data-percentage-setup')) {
            input.setAttribute('data-percentage-setup', 'true');
            input.addEventListener('blur', function() {
                formatPercentageInput(this);
            });
        }
    });
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
            currentReturnRate: (() => {
                const val = row.querySelector(`input[name="competitorCurrentReturnRate_${idx}"]`)?.value || '';
                return val.replace(/%/g, '').trim();
            })(),
            competitorReturnRate: (() => {
                const val = row.querySelector(`input[name="competitorReturnRate_${idx}"]`)?.value || '';
                return val.replace(/%/g, '').trim();
            })()
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
        // Bỏ "%" nếu có trong giá trị đã lưu để hiển thị
        const savedCurrentReturnRate = (saved.currentReturnRate || '').replace(/%/g, '').trim();
        const savedCompetitorReturnRate = (saved.competitorReturnRate || '').replace(/%/g, '').trim();
        
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
            <td class="border border-gray-300 p-1 relative">
                <input type="text" name="competitorCurrentReturnRate_${index}" class="p-0 text-center bg-blue-50 w-full pr-6" value="${savedCurrentReturnRate}" placeholder="Nhập số">
                <span class="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
            </td>
            <td class="border border-gray-300 p-1 relative">
                <input type="text" name="competitorReturnRate_${index}" class="p-0 text-center bg-blue-50 w-full pr-6" value="${savedCompetitorReturnRate}" placeholder="Nhập số">
                <span class="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Attach percentage format for return rate inputs
        const currentReturnInput = tr.querySelector(`input[name="competitorCurrentReturnRate_${index}"]`);
        const competitorReturnInput = tr.querySelector(`input[name="competitorReturnRate_${index}"]`);
        
        if (currentReturnInput) {
            // Validate khi đang nhập - chỉ cho phép số và dấu chấm/phẩy
            currentReturnInput.addEventListener('input', function(e) {
                let value = this.value.replace(/[^0-9.,]/g, '');
                const parts = value.split(/[.,]/);
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                this.value = value;
            });
            // Format thêm "%" khi blur
            currentReturnInput.addEventListener('blur', function() {
                formatPercentageInput(this);
            });
        }
        if (competitorReturnInput) {
            // Validate khi đang nhập - chỉ cho phép số và dấu chấm/phẩy
            competitorReturnInput.addEventListener('input', function(e) {
                let value = this.value.replace(/[^0-9.,]/g, '');
                const parts = value.split(/[.,]/);
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                this.value = value;
            });
            // Format thêm "%" khi blur
            competitorReturnInput.addEventListener('blur', function() {
                formatPercentageInput(this);
            });
        }
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
            proposedReturnRate: (() => {
                const val = row.querySelector(`input[name="proposedReturnRate_${idx}"]`)?.value || '';
                return val.replace(/%/g, '').trim();
            })()
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
        // Bỏ "%" nếu có trong giá trị đã lưu để hiển thị
        const savedProposedReturnRate = (saved.proposedReturnRate || '').replace(/%/g, '').trim();
        
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
            <td class="border border-gray-300 p-1 relative">
                <input type="text" name="proposedReturnRate_${index}" class="p-0 text-center bg-yellow-50 w-full pr-6" value="${savedProposedReturnRate}" placeholder="Nhập số">
                <span class="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Attach percentage format for proposed return rate input
        const proposedReturnInput = tr.querySelector(`input[name="proposedReturnRate_${index}"]`);
        if (proposedReturnInput) {
            proposedReturnInput.addEventListener('input', function(e) {
                // Chỉ cho phép nhập số và dấu chấm/phẩy
                let value = this.value.replace(/[^0-9.,]/g, '');
                const parts = value.split(/[.,]/);
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                this.value = value;
            });
            proposedReturnInput.addEventListener('blur', function() {
                formatPercentageInput(this);
            });
        }
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
        
        over12mRatio: (() => {
            const val = document.getElementById('over12mRatio') ? document.getElementById('over12mRatio').value : '';
            return val.replace(/%/g, '').trim();
        })(),
        over12mPercent: document.getElementById('over12mPercent') ? document.getElementById('over12mPercent').value : '',
        over100kgRatio: (() => {
            const val = document.getElementById('over100kgRatio') ? document.getElementById('over100kgRatio').value : '';
            return val.replace(/%/g, '').trim();
        })(),
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
                proposedReturnRate: (() => {
                    const val = row.querySelector(`input[name="proposedReturnRate_${index}"]`)?.value || '';
                    return val.replace(/%/g, '').trim();
                })()
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
    
    // Tính tỷ trọng % theo khu vực (dựa trên grandTotal để khớp với hiển thị trong bảng)
    const grandTotalNum = parseFloat(grandTotal) || 0;
    const percentProvince = grandTotalNum > 0 ? ((parseFloat(totalProvince) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentRegion = grandTotalNum > 0 ? ((parseFloat(totalRegion) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentAdjacent = grandTotalNum > 0 ? ((parseFloat(totalAdjacent) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentInter = grandTotalNum > 0 ? ((parseFloat(totalInter) / grandTotalNum) * 100).toFixed(1) + '%' : '0%';
    const percentByArea = `${percentProvince}/${percentRegion}/${percentAdjacent}/${percentInter}`;
    
    // Lấy tỷ lệ hoàn từ các ô trong bảng (lấy từ dòng đầu tiên)
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
            
            const priceProvince = parseFloat(price.province || 0);
            const priceRegion = parseFloat(price.region || 0);
            const priceAdjacent = parseFloat(price.adjacent || 0);
            const priceInter = parseFloat(price.inter || 0);
            
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
        percentByArea,                                         // 8. Tỷ trọng % theo khu vực
        formData.over12mRatio || '',                          // 9. Tỷ trọng hàng trên 1.2m
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
        formData.specificProduct || '',                          // 22. Tên sản phẩm
        formData.competitors.length > 0 ? formData.competitors[0] : '', // 23. Đối thủ (chỉ 1)
        '',                                                    // 24. Đối thủ khác (không dùng nữa, để trống)
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
        }).join(' | '), // 24. Giá đối thủ
        competitorAvg.province || '',                          // 25. Đơn giá bình quân Nội tỉnh (ĐT)
        competitorAvg.region || '',                            // 26. Đơn giá bình quân Nội miền (ĐT)
        competitorAvg.adjacent || '',                          // 27. Đơn giá bình quân Cận miền (ĐT)
        competitorAvg.inter || '',                             // 28. Đơn giá bình quân Liên miền (ĐT)
        competitorCurrentReturnRate || '',                     // 29. Tỷ lệ hoàn hiện tại
        competitorReturnRate || '',                            // 30. Tỷ lệ hoàn đối thủ miễn phí
        formData.competitorOtherPolicies || '',                // 31. Chính sách đặc thù đối thủ
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
        }).join(' | '), // 32. Giá đề xuất
        proposedAvg.province || '',                            // 33. Đơn giá bình quân Nội tỉnh (ĐX)
        proposedAvg.region || '',                              // 34. Đơn giá bình quân Nội miền (ĐX)
        proposedAvg.adjacent || '',                            // 35. Đơn giá bình quân Cận miền (ĐX)
        proposedAvg.inter || '',                               // 36. Đơn giá bình quân Liên miền (ĐX)
        formData.proposedOtherPolicies || '',                  // 37. Chính sách đặc thù đề xuất
        formData.proposedReturnRate || '',                     // 38. Tỷ lệ hoàn đề xuất
        (() => {
            // So sánh đơn giá bình quân: Format giống "Tỷ trọng % theo khu vực"
            // Mỗi khu vực: Mình/Đối thủ/% chênh lệch, ngăn cách bằng "/"
            const ownProvince = proposedAvg.province || '';
            const ownRegion = proposedAvg.region || '';
            const ownAdjacent = proposedAvg.adjacent || '';
            const ownInter = proposedAvg.inter || '0';
            
            const compProvince = competitorAvg.province || '';
            const compRegion = competitorAvg.region || '';
            const compAdjacent = competitorAvg.adjacent || '';
            const compInter = competitorAvg.inter || '';
            
            // Tính % chênh lệch: ((Mình - Đối thủ) / Đối thủ) * 100
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
            
            const cellProvince = formatCell(ownProvince, compProvince);
            const cellRegion = formatCell(ownRegion, compRegion);
            const cellAdjacent = formatCell(ownAdjacent, compAdjacent);
            const cellInter = formatCell(ownInter, compInter);
            
            // Format giống "Tỷ trọng % theo khu vực": Nội tỉnh/Nội miền/Cận miền/Liên miền
            return `${cellProvince}/${cellRegion}/${cellAdjacent}/${cellInter}`;
        })(),                                                 // 39. So sánh đơn giá bình quân
        formData.reporterName || '',                           // 40. Họ và tên người báo cáo
        formData.reporterPhone || '',                          // 41. Điện thoại người báo cáo
        formData.postOfficeName || '',                         // 42. Tên Bưu cục
        formData.title || '',                                  // 43. Chức danh
        formData.branch || '',                                 // 44. Chi nhánh
        (formData.postOfficeCode || '').toString()            // 45. Mã Bưu cục (đảm bảo là string để giữ nguyên text)
    ];
    
    return row;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Ngăn form submit theo cách mặc định
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    
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
            const result = await sendToGoogleSheets(rowData);
            console.log('Data sent successfully!', result);
            
            // Hiển thị thông báo thành công
            const successMsg = result.rowNumber 
                ? `Dữ liệu đã được gửi thành công! Dòng ${result.rowNumber} đã được thêm vào Google Sheets.`
                : 'Dữ liệu đã được gửi thành công!';
            showMessage('success', successMsg);
            submitBtn.textContent = '✓ Gửi thành công!';
            submitBtn.style.backgroundColor = '#10b981';
            
            // Không reset form ngay, để người dùng có thể xem kết quả
            // Chỉ reset sau khi người dùng xác nhận hoặc sau 10 giây
            setTimeout(() => {
                const confirmReset = confirm('Dữ liệu đã được gửi thành công!\n\nBạn có muốn reset form để nhập báo cáo mới không?');
                if (confirmReset) {
                    const form = document.getElementById('reportForm');
                    if (form) {
                        form.reset();
                    }
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                    initializeForm();
                    hideMessages();
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                    hideMessages();
                }
            }, 10000);
        } else {
            console.warn('GOOGLE_SCRIPT_URL is not set');
            throw new Error('Google Script URL chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
        }
        
    } catch (error) {
        console.error('Error submitting form:', error);
        console.error('Error stack:', error.stack);
        const errorMsg = error.message || 'Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại.';
        showMessage('error', errorMsg);
        submitBtn.textContent = '✗ Gửi thất bại - Thử lại';
        submitBtn.style.backgroundColor = '#ef4444';
        submitBtn.disabled = false;
        
        // Không tự động ẩn thông báo lỗi, để người dùng có thể đọc
        // Chỉ reset button text sau 10 giây
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.backgroundColor = '';
        }, 10000);
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
        
        // Thử với mode: 'cors' trước, nếu lỗi thì fallback về 'no-cors'
        let response;
        let result;
        
        try {
            response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: rowData })
            });
            
            // Đọc response để kiểm tra kết quả
            const responseText = await response.text();
            console.log('Response status:', response.status);
            console.log('Response text:', responseText);
            
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                // Nếu không parse được JSON, có thể là HTML error page
                throw new Error('Không nhận được phản hồi hợp lệ từ server. Vui lòng kiểm tra lại Google Apps Script URL.');
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Lỗi khi gửi dữ liệu lên Google Sheets');
            }
            
            console.log('Data saved successfully! Row number:', result.rowNumber);
            return result;
        } catch (corsError) {
            console.warn('CORS error, trying with no-cors mode:', corsError);
            // Fallback: dùng no-cors mode (không thể đọc response nhưng request vẫn được gửi)
            try {
                response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: rowData })
                });
                
                // Với no-cors, không thể đọc response nhưng request đã được gửi
                // Đợi một chút để đảm bảo request được xử lý
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Trả về result giả định thành công
                return { success: true, message: 'Dữ liệu đã được gửi (không thể xác nhận do CORS)' };
            } catch (noCorsError) {
                console.error('Error with no-cors mode:', noCorsError);
                throw new Error('Không thể gửi dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.');
            }
        }
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
function showMessage(type, message) {
    hideMessages();
    const successEl = document.getElementById('successMessage');
    const errorEl = document.getElementById('errorMessage');
    
    if (type === 'success') {
        if (successEl) {
            if (message) {
                successEl.textContent = message;
            }
            successEl.style.display = 'block';
            // Scroll to top để người dùng thấy thông báo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(message || 'Dữ liệu đã được gửi thành công!');
        }
    } else {
        if (errorEl) {
            if (message) {
                errorEl.textContent = message;
            }
            errorEl.style.display = 'block';
            // Scroll to top để người dùng thấy thông báo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(message || 'Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại.');
        }
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
