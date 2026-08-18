// pc-scroll-and-equip-group.js — Bảo vệ 2 lỗi thật đã sửa theo phản hồi test trên PC:
//
// 1. Cuộn chuột trong vùng nội dung chính (#tab-content) bị "kẹt", phải rê chuột sang
//    sidebar mới cuộn được — nguyên nhân: #tab-content thiếu min-height:0 (chỉ có
//    min-width:0), lỗi Flexbox kinh điển khiến overflow-y:auto không phát huy tác dụng.
//
// 2. Nhóm thiết bị (Equipment Group) tạo trước đó không được liệt kê khi gán vào phòng,
//    và lọc theo 1 loại (vd AHU) vẫn thấy nhóm tên khác (vd "FCU..."). Nguyên nhân xác
//    nhận qua debug thực tế: nút tạo nhóm luôn mặc định equipType='AHU' — nếu người dùng
//    đổi TÊN nhóm thành có chữ khác (vd "FCU-Tầng1") nhưng QUÊN đổi luôn dropdown loại hệ
//    thống, nhóm vẫn là AHU về bản chất dù tên gọi khác, khiến phòng FCU không tìm thấy
//    nhóm này, và lọc theo AHU vẫn thấy nhóm tên "FCU..." xuất hiện.

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;

  suite('PC — cuộn trang trong vùng nội dung chính', () => {
    test('#tab-content phải có class min-h-0 (bắt buộc để overflow-y:auto cuộn nội bộ đúng trong Flexbox)', () => {
      const el = App.__dom.window.document.getElementById('tab-content');
      assertTrue(el.className.includes('min-h-0'),
        '#tab-content thiếu min-h-0 sẽ khiến overflow-y:auto không phát huy tác dụng (lỗi Flexbox: flex item mặc định min-height:auto, không chịu co lại để cuộn nội bộ)');
    });
  });

  suite('Nhóm thiết bị — tên và loại hệ thống phải luôn khớp nhau', () => {

    test('Đổi dropdown loại hệ thống của 1 nhóm phải tự đổi tên nếu tên đang ở dạng tự sinh (vd "AHU-2")', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.ui.showTab('heatload'); App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-heatload');
      const sel = panel.querySelector('[data-gf="equipType"]');
      sel.value = 'FCU';
      sel.dispatchEvent(new App.__dom.window.Event('change', {bubbles:true}));
      assertTrue(App.state.hlEquipGroups[0].name === 'FCU-1',
        `Tên phải tự đổi thành "FCU-1" khi đổi dropdown từ AHU sang FCU (tên cũ đang là dạng tự sinh "AHU-1") — thực tế: "${App.state.hlEquipGroups[0].name}"`);
      assertTrue(App.state.hlEquipGroups[0].equipType === 'FCU', 'equipType phải đổi đúng thành FCU');
    });

    test('Nếu người dùng đã TỰ đặt tên riêng (không theo mẫu tự sinh), đổi dropdown KHÔNG được ghi đè tên đó', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU khu vực sản xuất', equipType:'AHU', description:''}];
      App.ui.showTab('heatload'); App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-heatload');
      const sel = panel.querySelector('[data-gf="equipType"]');
      sel.value = 'PAU';
      sel.dispatchEvent(new App.__dom.window.Event('change', {bubbles:true}));
      assertTrue(App.state.hlEquipGroups[0].name === 'AHU khu vực sản xuất',
        'Tên tự đặt của người dùng không được bị ghi đè khi đổi dropdown loại hệ thống');
    });

    test('Phòng FCU phải tìm thấy nhóm có equipType=FCU trong dropdown gán nhóm, kể cả khi tên nhóm không theo mẫu chuẩn', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'FCU-Tầng1', equipType:'FCU', description:''}];
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      const doc = App.__dom.window.document;
      const body = doc.getElementById('room-drawer-body');
      const groupSelect = body.querySelector('[data-rf="groupId"]');
      assertTrue(groupSelect.innerHTML.includes('FCU-Tầng1'),
        'Dropdown gán nhóm của phòng FCU phải liệt kê nhóm "FCU-Tầng1" (equipType=FCU khớp đúng) — đây chính là lỗi đã phản ánh thực tế');
    });

    test('Cảnh báo mismatch phải hiện khi tên nhóm nhắc tới loại KHÁC với equipType thực tế đang lưu', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'FCU dự phòng tầng 2', equipType:'AHU', description:''}];
      App.ui.showTab('heatload'); App.ui.heatload.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-heatload');
      assertTrue(panel.innerHTML.includes('KHÔNG tìm thấy nhóm này'),
        'Phải cảnh báo rõ khi tên nhóm ("FCU dự phòng tầng 2") nhắc tới loại khác với equipType thực tế (AHU) — tránh đúng kiểu nhầm lẫn đã xảy ra thực tế');
    });

  });
};
