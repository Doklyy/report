import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const App = () => {
  // State quản lý danh sách các mốc trọng lượng
  const [rows, setRows] = useState([
    { id: 1, from: 0, to: 0, noiTinh: 0, noiMien: 0, canMien: 0, lienMien: 0 }
  ]);

  // State cho ngành hàng
  const [industries, setIndustries] = useState({
    'Hàng điện tử, điện lạnh, gia dụng': false,
    'Đồ nội thất và Trang trí nhà cửa': false,
    'Phụ tùng ô tô, xe máy': false,
    'Thiết bị Công nghiệp và máy móc': false,
    'Nguyên liệu và vật liệu xây dựng': false,
    'Hàng nông nghiệp - sản xuất': false,
    'Cây cảnh và cây giống': false,
    'Nông sản (Hoa quả, hạt, cây dược liệu,...)': false,
    'Đồ thể thao và phụ kiện fitness': false,
    'Các sản phẩm Mẹ & bé': false,
    'Thuốc & Thực phẩm chức năng': false,
    'Thực phẩm & đồ ăn nhanh': false,
    'Mỹ phẩm & chăm sóc cá nhân': false,
    'Thời trang (quần áo, phụ kiện)': false,
    'Sản phẩm khác': false
  });
  const [industryOther, setIndustryOther] = useState('');

  // State cho đối thủ
  const [competitors, setCompetitors] = useState({
    'VNpost': false,
    'GHN': false,
    'GHTK': false,
    'J&T': false,
    'SPX': false,
    'Best': false,
    'Nhất tín': false,
    'Lalamove': false,
    'ahamove': false,
    'Xanh SM': false,
    'Xe chành': false,
    'Xe tự có': false
  });
  const [competitorOther, setCompetitorOther] = useState('');

  // Hàm cập nhật giá trị ô input
  const updateRow = (id, field, value) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: parseFloat(value) || 0 } : row
    ));
  };

  // Thêm dòng mới
  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId, from: 0, to: 0, noiTinh: 0, noiMien: 0, canMien: 0, lienMien: 0 }]);
  };

  // Xóa dòng
  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  // Toggle ngành hàng
  const toggleIndustry = (key) => {
    setIndustries({ ...industries, [key]: !industries[key] });
  };

  // Toggle đối thủ
  const toggleCompetitor = (key) => {
    setCompetitors({ ...competitors, [key]: !competitors[key] });
  };

  // Tính toán tổng số lượng theo cột
  const totals = useMemo(() => {
    const res = { noiTinh: 0, noiMien: 0, canMien: 0, lienMien: 0, grandTotal: 0 };
    rows.forEach(row => {
      const rowSum = row.noiTinh + row.noiMien + row.canMien + row.lienMien;
      res.noiTinh += row.noiTinh;
      res.noiMien += row.noiMien;
      res.canMien += row.canMien;
      res.lienMien += row.lienMien;
      res.grandTotal += rowSum;
    });
    return res;
  }, [rows]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-white p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800 uppercase">Mức trọng lượng & Sản lượng hàng gửi</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Header chính */}
              <tr className="bg-[#10b981] text-white">
                <th className="p-4 border border-emerald-600 w-1/4" rowSpan="2">
                  TRỌNG LƯỢNG (gram)
                </th>
                <th className="p-2 border border-emerald-600" colSpan="4">
                  SẢN LƯỢNG HÀNG GỬI
                </th>
                <th className="p-4 border border-emerald-600 w-24" rowSpan="2">Tổng</th>
                <th className="p-4 border border-emerald-600 w-24" rowSpan="2">Tỷ trọng %</th>
                <th className="p-4 border border-emerald-600 w-16" rowSpan="2"></th>
              </tr>
              {/* Header phụ cho các vùng miền */}
              <tr className="bg-[#059669] text-white text-sm">
                <th className="p-2 border border-emerald-700">Nội tỉnh</th>
                <th className="p-2 border border-emerald-700">Nội miền</th>
                <th className="p-2 border border-emerald-700">Cận miền</th>
                <th className="p-2 border border-emerald-700">Liên miền</th>
              </tr>
            </thead>
            
            <tbody>
              {rows.map((row) => {
                const rowTotal = row.noiTinh + row.noiMien + row.canMien + row.lienMien;
                const rowPercentage = totals.grandTotal > 0 ? (rowTotal / totals.grandTotal * 100).toFixed(1) : 0;

                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {/* Cột Trọng lượng: Từ và Đến chung 1 dòng */}
                    <td className="p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 block mb-1">Từ</span>
                          <input
                            type="number"
                            value={row.from}
                            onChange={(e) => updateRow(row.id, 'from', e.target.value)}
                            className="w-full p-2 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-bold"
                          />
                        </div>
                        <span className="mt-6 text-gray-400">-</span>
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 block mb-1">Đến</span>
                          <input
                            type="number"
                            value={row.to}
                            onChange={(e) => updateRow(row.id, 'to', e.target.value)}
                            className="w-full p-2 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-bold"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Các cột sản lượng */}
                    {['noiTinh', 'noiMien', 'canMien', 'lienMien'].map((field) => (
                      <td key={field} className="p-3 border border-gray-200">
                        <input
                          type="number"
                          value={row[field]}
                          onChange={(e) => updateRow(row.id, field, e.target.value)}
                          className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-bold"
                        />
                      </td>
                    ))}

                    {/* Cột Tổng và Tỷ trọng của dòng */}
                    <td className="p-3 border border-gray-200 bg-amber-50 text-center font-bold text-gray-800">
                      {rowTotal.toLocaleString()}
                    </td>
                    <td className="p-3 border border-gray-200 text-center text-gray-600">
                      {rowPercentage}%
                    </td>

                    {/* Nút xóa dòng */}
                    <td className="p-3 border border-gray-200 text-center">
                      <button 
                        onClick={() => removeRow(row.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        disabled={rows.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Hàng Tổng sản lượng các mốc */}
              <tr className="bg-slate-100 font-bold border-t-2 border-gray-300">
                <td className="p-4 border border-gray-200 text-left uppercase text-sm">Tổng sản lượng các mốc</td>
                <td className="p-3 border border-gray-200 text-center bg-gray-50">{totals.noiTinh.toLocaleString()}</td>
                <td className="p-3 border border-gray-200 text-center bg-gray-50">{totals.noiMien.toLocaleString()}</td>
                <td className="p-3 border border-gray-200 text-center bg-gray-50">{totals.canMien.toLocaleString()}</td>
                <td className="p-3 border border-gray-200 text-center bg-gray-50">{totals.lienMien.toLocaleString()}</td>
                <td className="p-3 border border-gray-200 text-center bg-amber-100">{totals.grandTotal.toLocaleString()}</td>
                <td className="p-3 border border-gray-200 bg-white" colSpan="2"></td>
              </tr>

              {/* Hàng Tỷ trọng % các mốc */}
              <tr className="bg-blue-50 font-bold border-t border-gray-300 italic">
                <td className="p-4 border border-gray-200 text-left uppercase text-sm text-blue-700">Tỷ trọng % theo khu vực</td>
                <td className="p-3 border border-gray-200 text-center">
                  {totals.grandTotal > 0 ? (totals.noiTinh / totals.grandTotal * 100).toFixed(1) : 0}%
                </td>
                <td className="p-3 border border-gray-200 text-center">
                  {totals.grandTotal > 0 ? (totals.noiMien / totals.grandTotal * 100).toFixed(1) : 0}%
                </td>
                <td className="p-3 border border-gray-200 text-center">
                  {totals.grandTotal > 0 ? (totals.canMien / totals.grandTotal * 100).toFixed(1) : 0}%
                </td>
                <td className="p-3 border border-gray-200 text-center">
                  {totals.grandTotal > 0 ? (totals.lienMien / totals.grandTotal * 100).toFixed(1) : 0}%
                </td>
                <td className="p-3 border border-gray-200 text-center bg-blue-100">100%</td>
                <td className="p-3 border border-gray-200 bg-white" colSpan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 flex justify-start">
          <button 
            onClick={addRow}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow transition-colors"
          >
            <Plus size={18} /> Thêm mốc trọng lượng
          </button>
        </div>

        {/* Phần II. Ngành hàng */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase">II. Ngành hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.keys(industries).map((industry) => (
              <label 
                key={industry}
                className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={industries[industry]}
                  onChange={() => toggleIndustry(industry)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 select-none">{industry}</span>
              </label>
            ))}
          </div>
          {industryOther && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngành hàng khác:
              </label>
              <input
                type="text"
                value={industryOther}
                onChange={(e) => setIndustryOther(e.target.value)}
                className="w-full md:w-1/2 p-2 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nhập ngành hàng khác..."
              />
            </div>
          )}
        </div>

        {/* Phần II. Đối thủ đang phục vụ */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase">II. Đối thủ đang phục vụ</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(competitors).map((competitor) => (
              <label 
                key={competitor}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={competitors[competitor]}
                  onChange={() => toggleCompetitor(competitor)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 select-none">{competitor}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đối thủ khác nếu có (ghi rõ):
            </label>
            <input
              type="text"
              value={competitorOther}
              onChange={(e) => setCompetitorOther(e.target.value)}
              className="w-full md:w-1/2 p-2 border border-amber-300 rounded bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Nhập đối thủ khác..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
