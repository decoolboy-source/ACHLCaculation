// status-badge-and-thresholds.js — Bảo vệ nhóm lỗi NGHIÊM TRỌNG NHẤT phát hiện được khi rà
// soát toàn diện theo yêu cầu người dùng ("check lại 1 lần tổng quát... nhất là phần logic
// tính toán"). Gồm 2 lớp lỗi:
//
// 1. Badge "Trạng thái" (✓ĐẠT/⚠/❌) trong drawer từng phòng đọc r._valid?.status||'ok' —
//    nhưng calcDrawerRoom() (nút "Tính" riêng phòng, cách dùng phổ biến nhất) TRƯỚC ĐÂY
//    không hề set r._valid, nên LUÔN mặc định về 'ok' → hiện "✓ ĐẠT" bất kể phòng có lỗi
//    thật hay không. Nghĩa là badge này trước đây KHÔNG ĐÁNG TIN khi chỉ tính riêng từng
//    phòng — chỉ đúng khi đã chạy "Tính toán tất cả" ít nhất 1 lần.
//
// 2. flagParams() — hàm sinh ra các cảnh báo cho r._valid — có 2 bảng ngưỡng RIÊNG
//    (TH.freshAirMin, TH.lpd) tách biệt hoàn toàn khỏi BUILDING_TYPES (nguồn dữ liệu THẬT
//    dùng để tính toán), và đã LỆCH NGHIÊM TRỌNG: hospital_or ngưỡng gió tươi cũ = 50 L/s/ng
//    (giá trị thật theo ASHRAE 170 chỉ 15) — khiến MỌI phòng mổ dùng đúng tiêu chuẩn vẫn bị
//    báo lỗi giả. Tương tự LPD lệch ở hotel_room/retail/hospital_patient.

module.exports = function(App, T){
  const { suite, test, assertTrue, assertEqual } = T;

  suite('Trạng thái phòng — nút Tính riêng phải phản ánh đúng, không mặc định "ĐẠT"', () => {

    test('calcDrawerRoom() phải set r._valid (không chỉ recalc() toàn dự án mới set)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5, achApplied:8 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      assertTrue(!!App.state.hlRooms[0]._valid, 'r._valid phải tồn tại sau calcDrawerRoom() — nếu không, badge Trạng thái luôn mặc định "✓ ĐẠT" sai');
    });

    test('Phòng THỰC SỰ có lỗi (ACH quá thấp, thiếu ACH gió tươi bắt buộc) → badge phải hiện LỖI, không phải mặc định ĐẠT', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 18, rhIn: 50, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Phòng mổ thiếu ACH', buildingType:'hospital_or', equipType:'AHU', L:10, W:15, H:3.2, nPeople:6, achApplied:3 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      assertEqual(App.state.hlRooms[0]._valid?.status, 'red', 'Phòng mổ ACH=3 (thiếu 4 ACH gió tươi bắt buộc) phải có status=red khi chỉ bấm Tính riêng phòng');
    });

  });

  suite('flagParams() — không được báo lỗi giả khi phòng dùng đúng giá trị mặc định theo tiêu chuẩn', () => {

    test('Phòng mổ (hospital_or) dùng gió tươi mặc định (15 L/s/người, ASHRAE 170) + ACH đủ → PHẢI đạt, không báo "gió tươi không đạt" giả', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 18, rhIn: 50, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Phòng mổ chuẩn', buildingType:'hospital_or', equipType:'AHU', L:10, W:15, H:3.2, nPeople:6, achApplied:20 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(!(r._flags||[]).some(f=>f.field==='freshAir'),
        'Không được có cảnh báo freshAir giả khi phòng dùng đúng giá trị mặc định 15 L/s/người theo ASHRAE 170 — bảng ngưỡng cũ (50 L/s/ng) đã bị xóa vì lệch với BUILDING_TYPES');
    });

    test('Phòng khách sạn (hotel_room) dùng LPD mặc định (15 W/m²) → PHẢI đạt, không báo "LPD vượt ngưỡng" giả', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Phòng KS chuẩn', buildingType:'hotel_room', equipType:'FCU', L:8, W:6, H:3, nPeople:2, achApplied:6, lpdApplied:15 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(!(r._flags||[]).some(f=>f.field==='lpdApplied'),
        'Không được có cảnh báo LPD giả khi phòng dùng đúng giá trị mặc định 15 W/m² — bảng ngưỡng cũ (8 W/m²) đã bị xóa vì lệch với BUILDING_TYPES');
    });

    test('Phòng THỰC SỰ có LPD quá cao (30 W/m² cho office, chuẩn chỉ ~12) → vẫn PHẢI báo cảnh báo thật', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'LPD quá cao', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5, achApplied:8, lpdApplied:30 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue((r._flags||[]).some(f=>f.field==='lpdApplied'),
        'Phải VẪN cảnh báo khi LPD thực sự cao bất thường — việc xóa bảng ngưỡng cũ không được làm mất khả năng phát hiện lỗi thật');
    });

  });
};
