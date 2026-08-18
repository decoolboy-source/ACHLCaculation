// roof-floor-drawer.js — Bảo vệ 1 lỗi thật đã sửa: nút "Tính" riêng phòng (calcDrawerRoom)
// TRƯỚC ĐÂY hoàn toàn bỏ sót tải nhiệt qua Mái (Q_roof, CLTD method) và Sàn tiếp đất
// (Q_floor) — giống HỆT lỗi vách ngăn nội bộ đã sửa trước đó. Chỉ "Tính toán tất cả" mới
// cộng đúng 2 khoản này. Phát hiện khi xây bảng "Phân tích tải nhiệt theo thành phần"
// trong báo cáo — cột "Q2 Mái" luôn hiện 0 dù phòng đã tick "Mái tiếp xúc trực tiếp".

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;

  suite('Tải Mái/Sàn — nút Tính riêng phòng phải cộng đúng như Tính cả dự án', () => {

    test('Phòng có "Mái tiếp xúc trực tiếp": bấm Tính riêng phải ra Q_roof > 0', () => {
      App.state.hlClimate = { tOut: 39.9, rhOut: 79.4, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'workshop_light', equipType:'FCU',
        L:20, W:15, H:5, nPeople:15, roofExposed:true, roofType:'R2', roofArea:300 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(r._ev?.Q_roof > 0, 'r._ev.Q_roof phải > 0 khi roofExposed=true — nếu 0, bug bỏ sót tải mái đã quay lại');
    });

    test('Phòng KHÔNG tick Mái: Q_roof phải = 0 (không tính tải mái khi không áp dụng)', () => {
      App.state.hlClimate = { tOut: 39.9, rhOut: 79.4, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5, roofExposed:false }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(r._ev?.Q_roof === 0, 'Q_roof phải = 0 khi không tick roofExposed');
    });

    test('Phòng có "Sàn tiếp đất": bấm Tính riêng phải phản ánh Q_floor (khác 0)', () => {
      App.state.hlClimate = { tOut: 39.9, rhOut: 79.4, tIn: 18, rhIn: 55, elevationM: 0 }; // T_room < T_dat -> Q_floor duong
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU',
        L:10, W:8, H:3.2, nPeople:5, floorOnGround:true, groundTempC:28, floorU:0.8 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const r = App.state.hlRooms[0];
      assertTrue(r._ev?.Q_floor !== 0, 'Q_floor phải khác 0 khi floorOnGround=true và T_đất khác T_phòng');
    });

    test('Q_coil phải phản ánh đúng tải mái ngay khi bấm Tính riêng (không cần Tính cả dự án)', () => {
      App.state.hlClimate = { tOut: 39.9, rhOut: 79.4, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Có mái', buildingType:'workshop_light', equipType:'FCU',
        L:20, W:15, H:5, nPeople:15, aWall:100, aGlass:20, shgc:0.6, roofExposed:true, roofType:'R2', roofArea:300 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const qWithRoof = App.state.hlRooms[0]._coil?.qCoilKW;

      App.state.hlRooms = [{ id:'r1', name:'Không mái', buildingType:'workshop_light', equipType:'FCU',
        L:20, W:15, H:5, nPeople:15, aWall:100, aGlass:20, shgc:0.6, roofExposed:false }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const qWithoutRoof = App.state.hlRooms[0]._coil?.qCoilKW;

      assertTrue(qWithRoof > qWithoutRoof,
        `Q_coil có mái (${qWithRoof?.toFixed(2)}) phải LỚN HƠN không có mái (${qWithoutRoof?.toFixed(2)}) — nếu bằng nhau, tải mái vẫn bị bỏ sót ở nút Tính riêng`);
    });

  });
};
