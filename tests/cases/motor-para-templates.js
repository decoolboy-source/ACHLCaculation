// motor-para-templates.js — Bảo vệ tính năng "Mẫu Motor / Mẫu tải ký sinh" (catalog spec,
// tương tự Nhóm thiết bị AHU/PAU): khai báo spec 1 lần rồi gán nhanh vào nhiều phòng, thay vì
// phải gõ lại toàn bộ P(kW)/phương pháp/vị trí TH/FL/FU/VFD (motor) hoặc toàn bộ field kỹ
// thuật theo loại IQF/GLAZE/ICE/ROTOR (tải ký sinh) mỗi lần thêm cho 1 phòng khác dùng cùng
// loại thiết bị — đúng bất tiện người dùng phản ánh so với cách nhập từng dòng độc lập trước
// đây. Mẫu không tham gia tính toán trực tiếp (recalc() chỉ đọc App.state.hlMotors/hlParasitic
// — các dòng THỰC TẾ), mẫu chỉ là tiện ích tạo nhanh dòng thực tế đã điền sẵn.

module.exports = function(App, T){
  const { suite, test, assertEqual, assertTrue } = T;

  function setChangeValue(el, value){
    el.value = value;
    el.dispatchEvent(new (App.__dom.window.Event)('change', {bubbles:true}));
  }

  suite('Mẫu Motor (catalog) — khai báo 1 lần, gán nhanh vào nhiều phòng', () => {

    test('Bấm "+ Thêm vào phòng" trên 1 mẫu tạo đúng 1 dòng motor thực tế, mang theo đủ spec của mẫu + roomId đã chọn', () => {
      App.state.hlRooms = [
        { id:'rA', name:'Phòng A', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 },
        { id:'rB', name:'Phòng B', buildingType:'office', equipType:'FCU', L:8, W:6, H:3.2, nPeople:3 },
      ];
      App.state.hlMotorTemplates = [{id:'mt1', name:'Quạt cấp AHU', pKw:7.5, qty:2, method:'B', position:'TH2', hasVFD:true}];
      App.state.hlMotors = [];
      App.ui.heatload.render();

      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-hl-motors');
      assertTrue(!!panel, 'Phải tìm thấy panel Motor');
      const roomSel = panel.querySelector('[data-mt-room="0"]');
      assertTrue(!!roomSel, 'Phải có ô chọn phòng cho mẫu motor đầu tiên');
      setChangeValue(roomSel, 'rB');
      panel.querySelector('[data-mt-add="0"]').click();

      assertEqual(App.state.hlMotors.length, 1, 'Phải tạo đúng 1 dòng motor thực tế');
      const m = App.state.hlMotors[0];
      assertEqual(m.roomId, 'rB', 'Motor mới phải gán đúng phòng đã chọn ở ô room-select cạnh mẫu');
      assertEqual(m.name, 'Quạt cấp AHU', 'Phải mang theo tên mẫu');
      assertEqual(m.pKw, 7.5, 'Phải mang theo P(kW) của mẫu');
      assertEqual(m.qty, 2, 'Phải mang theo số lượng của mẫu');
      assertEqual(m.method, 'B', 'Phải mang theo phương pháp của mẫu');
      assertEqual(m.position, 'TH2', 'Phải mang theo vị trí TH của mẫu');
      assertEqual(m.hasVFD, true, 'Phải mang theo cờ VFD của mẫu');
    });

    test('Bấm "+ Thêm vào phòng" khi CHƯA chọn phòng phải bị chặn — không tạo dòng motor "mồ côi" mới', () => {
      App.state.hlRooms = [{ id:'rA', name:'Phòng A', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.state.hlMotorTemplates = [{id:'mt1', name:'Quạt cấp AHU', pKw:7.5, qty:1, method:'A', position:'TH1', hasVFD:false}];
      App.state.hlMotors = [];
      App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-hl-motors');
      panel.querySelector('[data-mt-add="0"]').click(); // không chọn phòng trước
      assertEqual(App.state.hlMotors.length, 0, 'Không được tạo motor nào khi chưa chọn phòng ở ô room-select của mẫu');
    });

    test('Nút "Lưu mẫu" trên 1 dòng motor thực tế phải tạo đúng 1 mẫu mới mang theo spec của dòng đó (không mang theo roomId)', () => {
      App.state.hlRooms = [{ id:'rA', name:'Phòng A', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.state.hlMotorTemplates = [];
      App.state.hlMotors = [{id:'m1', name:'Motor bơm', pKw:11, qty:1, method:'C', position:'TH3', FL:0.9, FU:0.8, hasVFD:true, roomId:'rA'}];
      App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-hl-motors');
      panel.querySelector('[data-msave-template="0"]').click();

      assertEqual(App.state.hlMotorTemplates.length, 1, 'Phải tạo đúng 1 mẫu mới');
      const t = App.state.hlMotorTemplates[0];
      assertEqual(t.name, 'Motor bơm');
      assertEqual(t.pKw, 11);
      assertEqual(t.method, 'C');
      assertEqual(t.position, 'TH3');
      assertEqual(t.hasVFD, true);
      assertTrue(t.roomId === undefined, 'Mẫu không được mang theo roomId của dòng gốc — mẫu dùng chung cho nhiều phòng');
    });

  });

  suite('Mẫu tải ký sinh (catalog) — khai báo 1 lần, gán nhanh vào nhiều phòng', () => {

    test('Bấm "+ Thêm vào phòng" trên 1 mẫu IQF tạo đúng 1 dòng tải ký sinh thực tế, mang theo đủ field kỹ thuật + roomId đã chọn', () => {
      App.state.hlRooms = [
        { id:'rA', name:'Kho lạnh A', buildingType:'cold_storage', equipType:'FCU', L:10, W:8, H:3.2, nPeople:2 },
      ];
      App.state.hlParaTemplates = [{id:'pt1', type:'IQF', name:'IQF chuẩn -35°C',
        L:6, W:4, H:3, uPanel:0.2, tChamber:-35, doorCode:'D1200x2200-STD'}];
      App.state.hlParasitic = [];
      App.ui.heatload.render();

      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-hl-para');
      assertTrue(!!panel, 'Phải tìm thấy panel Tải ký sinh');
      const roomSel = panel.querySelector('[data-pt-room="0"]');
      assertTrue(!!roomSel, 'Phải có ô chọn phòng cho mẫu tải ký sinh đầu tiên');
      setChangeValue(roomSel, 'rA');
      panel.querySelector('[data-pt-add="0"]').click();

      assertEqual(App.state.hlParasitic.length, 1, 'Phải tạo đúng 1 dòng tải ký sinh thực tế');
      const p = App.state.hlParasitic[0];
      assertEqual(p.roomId, 'rA', 'Phải gán đúng phòng đã chọn');
      assertEqual(p.type, 'IQF');
      assertEqual(p.name, 'IQF chuẩn -35°C');
      assertEqual(p.L, 6); assertEqual(p.W, 4); assertEqual(p.H, 3);
      assertEqual(p.uPanel, 0.2); assertEqual(p.tChamber, -35);
      assertEqual(p.doorCode, 'D1200x2200-STD');
    });

    test('Tải ký sinh tạo từ mẫu phải tính ra Q hợp lệ khi recalc() — không bị thiếu field làm NaN', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [
        { id:'rA', name:'Kho lạnh A', buildingType:'cold_storage', equipType:'FCU', L:10, W:8, H:3.2, nPeople:2 },
      ];
      App.state.hlParaTemplates = [{id:'pt1', type:'IQF', name:'IQF chuẩn -35°C',
        L:6, W:4, H:3, uPanel:0.2, tChamber:-35, doorCode:'D1200x2200-STD'}];
      App.state.hlParasitic = [];
      App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-hl-para');
      setChangeValue(panel.querySelector('[data-pt-room="0"]'), 'rA');
      panel.querySelector('[data-pt-add="0"]').click();

      App.ui.heatload.recalc();
      const q = App.state.hlParasitic[0]._qW;
      assertTrue(typeof q === 'number' && !isNaN(q), `Q của tải ký sinh tạo từ mẫu phải là số hợp lệ sau recalc(), thực tế: ${q}`);
    });

    test('Nút "Lưu mẫu" trên 1 dòng tải ký sinh ROTOR thực tế phải tạo đúng 1 mẫu mới mang theo field ROTOR (không mang theo roomId/id gốc)', () => {
      App.state.hlRooms = [{ id:'rA', name:'Phòng A', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.state.hlParaTemplates = [];
      App.state.hlParasitic = [{id:'p1', type:'ROTOR', name:'Rotor tách ẩm', roomId:'rA',
        gAirM3h:3000, tInRotor:26, tOutRotor:42}];
      App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-hl-para');
      panel.querySelector('[data-psave-template="0"]').click();

      assertEqual(App.state.hlParaTemplates.length, 1, 'Phải tạo đúng 1 mẫu mới');
      const t = App.state.hlParaTemplates[0];
      assertEqual(t.type, 'ROTOR');
      assertEqual(t.name, 'Rotor tách ẩm');
      assertEqual(t.gAirM3h, 3000); assertEqual(t.tInRotor, 26); assertEqual(t.tOutRotor, 42);
      assertTrue(t.roomId === undefined, 'Mẫu không được mang theo roomId của dòng gốc');
      assertTrue(t.id !== 'p1', 'Mẫu phải có id riêng, không trùng id của dòng tải ký sinh gốc');
    });

  });
};
