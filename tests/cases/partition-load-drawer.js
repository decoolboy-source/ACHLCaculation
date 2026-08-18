// partition-load-drawer.js — Bảo vệ 1 lỗi thật đã sửa: nút "Tính" của riêng 1 phòng
// (calcDrawerRoom, dùng trong drawer form) trước đây HOÀN TOÀN BỎ QUA tải vách ngăn
// nội bộ (partitionRows) — chỉ "Tính toán tất cả" (recalc() toàn dự án) mới cộng đúng.
// Hậu quả: cùng 1 phòng có vách ngăn, bấm "Tính" riêng ra kết quả THẤP HƠN so với bấm
// "Tính toán tất cả" — 2 nút, 2 kết quả khác nhau cho cùng 1 phòng, không có cảnh báo
// gì cho người dùng biết.
//
// LƯU Ý kỹ thuật quan trọng phát hiện khi viết test này: với loại hệ thống AHU/PAU,
// tải vách ngăn ảnh hưởng đến qReheatKW (không phải qCoilKW chính) — vì công thức coil
// AHU/PAU trong app tính theo enthalpy (hMix-hSupply) của lưu lượng gió, KHÔNG cộng
// trực tiếp Q_sens_room vào qCoilKW. Đây là đặc tính vốn có của công thức, áp dụng như
// nhau ở cả 2 đường tính — không phải lỗi. Chỉ FCU/FCU_OA mới cộng Q_sens_room thẳng
// vào qCoilKW nên dùng FCU để kiểm tra tác động trực tiếp; dùng AHU để kiểm tra qReheatKW.

module.exports = function(App, T){
  const { suite, test, assertTrue, assertClose } = T;

  function makeRoom(equipType, withPartition){
    const base = {
      id: 'pr1', name: 'Phòng test vách ngăn', buildingType: 'office', equipType,
      L: 10, W: 8, H: 3.2, nPeople: 5, aWall: 20, aGlass: 4,
    };
    if(withPartition){
      base.partitionRows = [{ name: 'Vách kề phòng nóng', areaM2: 15, uWall: 0.45, adjSource: 'temp', adjTempC: 60 }];
    }
    return base;
  }

  suite('Tải vách ngăn nội bộ — nút Tính riêng phòng phải cộng đúng như Tính cả dự án', () => {

    test('FCU có vách ngăn kề phòng nóng hơn: bấm Tính riêng phải làm Q_coil TĂNG (Q_sens_room cộng thẳng vào FCU)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [makeRoom('FCU', true)];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const withPartition = App.state.hlRooms[0]._coil?.qCoilKW;

      App.state.hlRooms = [makeRoom('FCU', false)];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const withoutPartition = App.state.hlRooms[0]._coil?.qCoilKW;

      assertTrue(withPartition != null && withoutPartition != null, 'Cả 2 lần tính đều phải ra kết quả');
      assertTrue(withPartition > withoutPartition,
        `FCU có vách ngăn kề phòng nóng (60°C) phải có Q_coil (${withPartition?.toFixed(2)}) LỚN HƠN không có vách ngăn (${withoutPartition?.toFixed(2)}) — nếu bằng nhau, bug bỏ sót tải vách ngăn đã quay lại`);
    });

    test('_partitionDetails phải được ghi lại ngay sau khi bấm Tính riêng (không chỉ khi Tính cả dự án)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [makeRoom('FCU', true)];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(Array.isArray(r._partitionDetails) && r._partitionDetails.length > 0,
        'calcDrawerRoom() phải ghi lại _partitionDetails, không chỉ recalc() (Tính toán tất cả) mới làm việc này');
    });

    test('Phòng KHÔNG có vách ngăn: calcDrawerRoom() vẫn chạy bình thường, không lỗi, _partitionDetails rỗng', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [makeRoom('AHU', false)];
      let threw = false;
      App.ui.heatload.openDrawer(0);
      try{ App.ui.heatload.calcDrawerRoom(); }catch(e){ threw = true; }
      assertTrue(!threw, 'Không được ném lỗi khi phòng không có partitionRows');
      assertTrue(Array.isArray(App.state.hlRooms[0]._partitionDetails) && App.state.hlRooms[0]._partitionDetails.length === 0);
    });

    test('Vách ngăn thiếu U (chưa chọn loại tường) → phải có cảnh báo, không âm thầm dùng mặc định', () => {
      const room = makeRoom('FCU', true);
      room.partitionRows[0].uWall = null; // chưa nhập U, chưa chọn wallTypeId
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [room];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const warnings = App.state.hlRooms[0]._partitionWarnings || [];
      assertTrue(warnings.length > 0, 'Phải có cảnh báo khi vách ngăn thiếu U — không được âm thầm dùng mặc định 0.45 mà không nói gì');
    });

    test('AHU có vách ngăn: tải vách ngăn phải ảnh hưởng đến qReheatKW (đặc tính công thức AHU — không phải qCoilKW)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [makeRoom('AHU', true)];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const withPartition = App.state.hlRooms[0]._coil?.qReheatKW;

      App.state.hlRooms = [makeRoom('AHU', false)];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const withoutPartition = App.state.hlRooms[0]._coil?.qReheatKW;

      assertTrue(withPartition !== withoutPartition,
        'qReheatKW phải thay đổi khi thêm vách ngăn kề phòng nóng — nếu không đổi, tải vách ngăn hoàn toàn không được tính đến ở đường AHU');
    });

  });
};
