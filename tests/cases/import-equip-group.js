// import-equip-group.js — Bảo vệ 1 lỗi thật đã sửa: import lưu lượng từ Tab Phụ Tải Nhiệt
// vào Bảng nhánh ống gió TRƯỚC ĐÂY hoàn toàn không mang theo equipGroupId (nhóm thiết bị)
// dù phòng đã liên kết sẵn với 1 nhóm — buộc người dùng phải tự chọn lại thủ công từng
// nhánh, rất dễ sai sót/chọn nhầm khi thao tác nhiều phòng cùng lúc (phản ánh thực tế).

module.exports = function(App, T){
  const { suite, test, assertEqual, assertTrue } = T;

  suite('Import Tab Phụ Tải Nhiệt → Bảng nhánh ống gió phải mang theo đúng nhóm thiết bị', () => {

    test('Nhánh được tạo từ phòng đã có groupId phải mang theo đúng equipGroupId đó', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-Tầng1', equipType:'AHU', description:''}];
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [
        { id:'r1', name:'Phòng A', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5, groupId:'g1', _af:{L_supply:2000, L_fresh:300, L_return:1700} },
        { id:'r2', name:'Phòng B', buildingType:'office', equipType:'AHU', L:8, W:6, H:3.2, nPeople:3, groupId:'g1', _af:{L_supply:1200, L_fresh:200, L_return:1000} },
      ];
      App.ui.calc._doImportHL(true);
      assertEqual(App.state.branches[0].equipGroupId, 'g1', 'Nhánh 1 phải mang theo equipGroupId="g1" từ phòng nguồn');
      assertEqual(App.state.branches[1].equipGroupId, 'g1', 'Nhánh 2 phải mang theo equipGroupId="g1" từ phòng nguồn');
    });

    test('Phòng chưa gán nhóm thiết bị (groupId rỗng) → nhánh tạo ra phải có equipGroupId rỗng, không lỗi', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [
        { id:'r1', name:'Phòng FCU riêng', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5, _af:{L_supply:2000, L_fresh:300, L_return:1700} },
      ];
      let threw = false;
      try{ App.ui.calc._doImportHL(true); }catch(e){ threw = true; }
      assertTrue(!threw, 'Không được lỗi khi phòng chưa có groupId');
      assertEqual(App.state.branches[0].equipGroupId, '', 'equipGroupId phải là chuỗi rỗng, không phải undefined (tránh lỗi hiển thị dropdown)');
    });

    test('Dropdown nhóm thiết bị trong thẻ nhánh (sau khi import) phải hiện đúng lựa chọn đã chọn sẵn', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-Tầng1', equipType:'AHU', description:''}];
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [
        { id:'r1', name:'Phòng A', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5, groupId:'g1', _af:{L_supply:2000, L_fresh:300, L_return:1700} },
      ];
      App.ui.calc._doImportHL(true);
      App.ui.showTab('calc');
      App.ui.calc.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-calc');
      const card = panel.querySelector('[data-bidx="0"]');
      const groupSel = card.querySelector('[data-brow="equipGroupId"]');
      assertEqual(groupSel.value, 'g1', 'Dropdown nhóm thiết bị trong thẻ nhánh phải tự chọn sẵn đúng nhóm đã import — không cần người dùng chọn lại thủ công');
    });

  });
};
