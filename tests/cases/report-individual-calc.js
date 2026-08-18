// report-individual-calc.js — Bảo vệ 2 lỗi thật đã sửa cùng lúc, đều thuộc dạng "2 đường
// tính (Tính riêng từng phòng vs Tính toán tất cả) cho ra kết quả khác nhau trên báo cáo":
//
// 1. calcDrawerRoom() (nút "Tính" riêng từng phòng) chỉ set r._airflow, KHÔNG set r._af —
//    trong khi báo cáo/xuất Excel/bảng nhánh ống gió TOÀN BỘ đọc r._af. Hậu quả: tính từng
//    phòng riêng lẻ (cách dùng phổ biến) khiến báo cáo luôn hiện "Tổng gió tươi/cấp = 0"
//    dù từng phòng đã có kết quả thật.
//
// 2. Cảnh báo từ calcBuildingTypeAirflow() (vd ACH_FRESH_MIN) chỉ được gộp vào checklist
//    chẩn đoán của báo cáo khi bấm "Tính toán tất cả" — bấm "Tính" riêng từng phòng thì
//    cảnh báo bị kẹt trên r._airflow.warnings, không bao giờ tới được báo cáo, khiến
//    checklist hiện "✓ Đạt" SAI dù phòng thực sự không đạt.

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;

  suite('Báo cáo phải đúng dù chỉ bấm "Tính" riêng từng phòng (không bấm Tính toán tất cả)', () => {

    test('r._af phải được set sau khi bấm Tính riêng phòng (không chỉ khi Tính toán tất cả)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(!!r._af, 'r._af phải tồn tại sau calcDrawerRoom()');
      assertTrue(r._af.L_supply > 0, 'r._af.L_supply phải > 0 — nếu 0/undefined, báo cáo sẽ hiện Tổng gió cấp = 0');
    });

    test('Báo cáo phải hiện đúng Tổng gió cấp/gió tươi khi TẤT CẢ phòng chỉ được tính riêng lẻ', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [
        { id:'r1', name:'Phong A', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 },
        { id:'r2', name:'Phong B', buildingType:'office', equipType:'AHU', L:20, W:15, H:3.5, nPeople:20 },
      ];
      App.ui.renderAllTabs();
      for(let i=0;i<2;i++){ App.ui.heatload.openDrawer(i); App.ui.heatload.calcDrawerRoom(); }
      const expectedTotal = App.state.hlRooms[0]._af.L_supply + App.state.hlRooms[1]._af.L_supply;
      const html = App.report.buildPreviewHtml();
      assertTrue(expectedTotal > 0, 'Tổng kỳ vọng phải > 0 (sanity check của chính test)');
      assertTrue(html.includes(String(Math.round(expectedTotal))),
        `Báo cáo phải hiện đúng tổng gió cấp (${Math.round(expectedTotal)}) — nếu không tìm thấy, bug "Tổng gió cấp = 0" đã quay lại`);
    });

    test('Checklist chẩn đoán phải hiện đúng cảnh báo ACH gió tươi dù CHỈ bấm Tính riêng từng phòng', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 18, rhIn: 50, elevationM: 0 };
      App.state.hlRooms = [
        { id:'r1', name:'Phong mo thieu ACH', buildingType:'hospital_or', equipType:'AHU', L:10, W:15, H:3.2, nPeople:6, achApplied:3 },
      ];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      // KHÔNG gọi recalc()/"Tính toán tất cả" — chỉ tính riêng phòng này
      const html = App.report.buildPreviewHtml();
      assertTrue(html.includes('ACH tổng đang đặt'),
        'Báo cáo phải hiện cảnh báo ACH gió tươi ngay cả khi chỉ bấm Tính riêng từng phòng — nếu không có, cảnh báo đã bị "kẹt" lại không tới được báo cáo');
    });

  });
};
