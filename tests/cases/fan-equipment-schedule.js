// fan-equipment-schedule.js — Bảo vệ tính năng mới "Bảng quạt thông gió/gió thải cục bộ",
// thêm theo đề xuất người dùng: bảng thiết bị lựa chọn cũ chỉ lọc theo Q_coil>0 (thiết bị
// làm lạnh), khiến MỌI phòng VENT (thông gió thuần, Q_coil=0 theo đúng thiết kế) và MỌI
// thiết bị gió thải cục bộ bị loại hoàn toàn khỏi báo cáo — dù vẫn cần 1 thiết bị thật
// (quạt) để vận hành. Gồm: catalog quạt (FAN_CATALOG), hàm chọn quạt tự động theo lưu
// lượng+cột áp (selectFanAuto), nhóm thiết bị hỗ trợ loại VENT, và bảng báo cáo riêng.

module.exports = function(App, T){
  const { suite, test, assertTrue, assertEqual } = T;
  const C = App.calc;

  suite('Catalog quạt & hàm chọn quạt tự động', () => {

    test('FAN_CATALOG phải tồn tại và có đủ các loại quạt cơ bản', () => {
      const cat = App.data.FAN_CATALOG;
      assertTrue(Array.isArray(cat) && cat.length > 5, 'FAN_CATALOG phải có danh sách quạt tham khảo');
      const types = new Set(cat.map(f=>f.type));
      assertTrue(types.has('axial') && types.has('centrifugal'), 'Phải có ít nhất quạt hướng trục và ly tâm');
    });

    test('selectFanAuto phải chọn đúng quạt đủ CẢ lưu lượng lẫn cột áp yêu cầu', () => {
      const sel = C.selectFanAuto({ airflowM3h: 2000, staticPaRequired: 150 });
      assertTrue(!!sel, 'Phải tìm được quạt phù hợp');
      assertTrue(sel.model.airflowM3h >= 2000*1.1, 'Quạt chọn phải đủ lưu lượng (kèm hệ số dự phòng)');
      assertTrue(sel.model.staticPa >= 150, 'Quạt chọn phải đủ cột áp yêu cầu — không chỉ đủ lưu lượng');
    });

    test('selectFanAuto phải trả về null khi không có lưu lượng (tránh lỗi thay vì trả kết quả sai)', () => {
      assertEqual(C.selectFanAuto({ airflowM3h: 0 }), null);
    });

  });

  suite('Nhóm thiết bị phải hỗ trợ loại VENT', () => {

    test('Dropdown loại hệ thống của nhóm thiết bị phải có lựa chọn VENT', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'VENT-1', equipType:'VENT', description:''}];
      App.ui.showTab('heatload'); App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-heatload');
      assertTrue(panel.innerHTML.includes('value="VENT"'), 'Phải có <option value="VENT"> trong dropdown loại hệ thống của nhóm thiết bị');
    });

    test('Phòng VENT phải tìm thấy nhóm VENT trong dropdown gán nhóm (giống AHU/PAU/FCU)', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'VENT-Kho', equipType:'VENT', description:''}];
      App.state.hlRooms = [{ id:'r1', name:'Kho', buildingType:'warehouse', equipType:'VENT', L:10, W:8, H:3.2 }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      const doc = App.__dom.window.document;
      const body = doc.getElementById('room-drawer-body');
      const groupSelect = body.querySelector('[data-rf="groupId"]');
      assertTrue(groupSelect.innerHTML.includes('VENT-Kho'), 'Dropdown gán nhóm của phòng VENT phải liệt kê nhóm VENT-Kho');
    });

  });

  suite('Báo cáo — bảng quạt thông gió/gió thải cục bộ', () => {

    test('Phòng VENT phải xuất hiện trong bảng quạt của báo cáo (dù Q_coil=0, không xuất hiện ở bảng thiết bị làm lạnh)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 30, rhIn: 70, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Kho thông gió', buildingType:'warehouse', equipType:'VENT', L:20, W:15, H:5, achApplied:6, espPa:150 }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const html = App.report.buildPreviewHtml();
      assertTrue(html.includes('Bảng quạt thông gió'), 'Báo cáo phải có bảng quạt thông gió khi có phòng VENT');
      assertTrue(html.includes('Kho thông gió'), 'Tên phòng VENT phải xuất hiện trong bảng quạt');
      assertTrue(html.includes('VENT (thông gió chính)'), 'Phải ghi rõ mục đích là VENT');
    });

    test('Phòng có gió thải cục bộ phải xuất hiện trong bảng quạt, đúng lưu lượng Q_localExhaust', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 30, rhIn: 70, elevationM: 0 };
      App.state.hlRooms = [{
        id:'r1', name:'Xưởng chế biến', buildingType:'workshop_light', equipType:'FCU', L:15, W:10, H:4, nPeople:8,
        hasLocalExhaustEquip:true, localExhaustTreated:'raw',
        localExhaustRows:[{name:'Chụp hút lò', qPerUnitM3h:1200, qty:2}],
      }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const html = App.report.buildPreviewHtml();
      assertTrue(html.includes('Gió thải cục bộ'), 'Báo cáo phải ghi rõ mục đích "Gió thải cục bộ"');
      assertTrue(html.includes('2400'), 'Lưu lượng phải đúng 2400 m³/h (1200×2)');
    });

    test('Phòng KHÔNG phải VENT và KHÔNG có gió thải cục bộ thì KHÔNG xuất hiện trong bảng quạt (tránh nhiễu)', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Văn phòng thường', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5 }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const html = App.report.buildPreviewHtml();
      assertTrue(!html.includes('Bảng quạt thông gió'), 'Không được có bảng quạt nếu không có phòng VENT/gió thải cục bộ nào');
    });

  });
};
