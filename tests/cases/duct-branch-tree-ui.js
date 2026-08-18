// duct-branch-tree-ui.js — Bảo vệ tính năng thiết kế lại Bảng nhánh ống gió thành CÂY thư
// mục thật (thay cho danh sách phẳng + ASCII ┌─├─└─│ cũ, vốn rất khó theo dõi lưu lượng
// phân bổ xuống từng nhánh con khi có nhiều nhánh — phản hồi trực tiếp từ người dùng):
//
// 1. Nút "+" trên từng nhánh tạo đúng 1 nhánh CON, lồng vào đúng vị trí trong DOM (không chỉ
//    đúng parentId trong state) và tự động kế thừa equipGroupId của nhánh cha.
// 2. Nút "+ nhánh gốc" trên tiêu đề mỗi cụm thiết bị tạo đúng 1 nhánh GỐC mới cùng
//    equipGroupId — hỗ trợ đúng trường hợp 1 thiết bị ra 2 nhánh chính trở lên.
// 3. Các nhánh gốc được nhóm đúng theo equipGroupId thành từng cụm riêng biệt, không lẫn.
// 4. Nút xổ/thu "Thông tin chung" chỉ đổi hiển thị (UI-only), không tạo/xoá dữ liệu.
//
// Đồng thời bảo vệ 1 lỗi thật phát hiện khi xây tính năng này: nhánh import từ Tab Phụ Tải
// Nhiệt (_doImportHL) trước đây hoàn toàn không có .id — _buildBranchTree() dùng id giả
// '_<index>' làm KEY nội bộ nhưng KHÔNG gán lại .id đó vào node trả về, nên mọi chỗ đọc
// node.id (vẽ cây, tra ngược nhánh theo id, đặt nhánh con dưới 1 nhánh cụ thể) đều ra
// undefined cho các nhánh import — vô hình trong cây mới dù vẫn tồn tại trong App.state.branches.

module.exports = function(App, T){
  const { suite, test, assertEqual, assertTrue } = T;

  function render(){ App.ui.calc.render(); return App.__dom.window.document.getElementById('panel-calc'); }

  suite('Cây nhánh ống gió — thêm nhánh con lồng đúng vị trí, kế thừa nhóm thiết bị', () => {

    test('Bấm "+" trên 1 nhánh tạo đúng 1 nhánh con: parentId đúng, equipGroupId kế thừa từ cha, vType=branchDuct', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.state.branches = [{id:'root1', name:'Ống chính', qM3h:5000, vMs:7, vType:'mainDuct', parentId:'', equipGroupId:'g1'}];
      const panel = render();
      panel.querySelector('[data-badd-child="0"]').click();

      assertEqual(App.state.branches.length, 2, 'Phải tạo thêm đúng 1 nhánh mới');
      const child = App.state.branches[1];
      assertEqual(child.parentId, 'root1', 'Nhánh con phải có parentId trỏ đúng vào nhánh cha vừa bấm "+"');
      assertEqual(child.equipGroupId, 'g1', 'Nhánh con phải tự kế thừa equipGroupId của nhánh cha');
      assertEqual(child.vType, 'branchDuct', 'Nhánh thêm bằng nút "+" trên 1 nhánh khác phải là loại Nhánh (không phải Ống chính)');
    });

    test('Nhánh con phải LỒNG THẬT trong DOM bên trong khối của nhánh cha (không chỉ đúng parentId trong state)', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.state.branches = [{id:'root1', name:'Ống chính', qM3h:5000, vMs:7, vType:'mainDuct', parentId:'', equipGroupId:'g1'}];
      let panel = render();
      panel.querySelector('[data-badd-child="0"]').click();
      panel = App.__dom.window.document.getElementById('panel-calc');

      const rootCard = panel.querySelector('[data-bidx="0"]');
      assertTrue(!!rootCard, 'Phải tìm thấy thẻ nhánh gốc');
      const rootWrapper = rootCard.parentElement;
      const nestedChild = rootWrapper.querySelector('[data-bidx="1"]');
      assertTrue(!!nestedChild, 'Thẻ nhánh con (index 1) phải nằm LỒNG bên trong khối bao quanh nhánh cha (index 0) trong DOM — đúng cấu trúc cây thật, không phải danh sách phẳng');
    });

    test('Nút "+ nhánh gốc" trên tiêu đề cụm thiết bị tạo đúng 1 nhánh GỐC mới cùng equipGroupId của cụm đó', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.state.branches = [{id:'root1', name:'Nhánh gốc 1', qM3h:5000, vMs:7, vType:'mainDuct', parentId:'', equipGroupId:'g1'}];
      const panel = render();
      const addRootBtn = panel.querySelector('[data-baddroot="g1"]');
      assertTrue(!!addRootBtn, 'Phải có nút "+ nhánh gốc" trên tiêu đề cụm thiết bị g1');
      addRootBtn.click();

      assertEqual(App.state.branches.length, 2, 'Phải tạo thêm đúng 1 nhánh gốc mới');
      const newRoot = App.state.branches[1];
      assertEqual(newRoot.equipGroupId, 'g1', 'Nhánh gốc mới phải cùng equipGroupId với cụm đã bấm');
      assertTrue(!newRoot.parentId, 'Nhánh gốc mới phải KHÔNG có parentId (là 1 nhánh gốc thật, không phải nhánh con)');
    });

    test('Nhánh gốc thuộc 2 thiết bị (equipGroupId) khác nhau phải được nhóm vào 2 cụm riêng biệt trong giao diện', () => {
      App.state.hlEquipGroups = [
        {id:'g1', name:'AHU-1', equipType:'AHU', description:''},
        {id:'g2', name:'PAU-1', equipType:'PAU', description:''},
      ];
      App.state.branches = [
        {id:'r1', name:'Ống chính AHU', qM3h:5000, vMs:7, vType:'mainDuct', parentId:'', equipGroupId:'g1'},
        {id:'r2', name:'Ống chính PAU', qM3h:3000, vMs:7, vType:'mainDuct', parentId:'', equipGroupId:'g2'},
      ];
      const panel = render();
      assertTrue(panel.innerHTML.includes('AHU AHU-1'), 'Phải hiện tiêu đề cụm cho thiết bị g1');
      assertTrue(panel.innerHTML.includes('PAU PAU-1'), 'Phải hiện tiêu đề cụm cho thiết bị g2');
      assertTrue(!!panel.querySelector('[data-baddroot="g1"]'), 'Phải có nút "+ nhánh gốc" riêng cho cụm g1');
      assertTrue(!!panel.querySelector('[data-baddroot="g2"]'), 'Phải có nút "+ nhánh gốc" riêng cho cụm g2');
    });

    test('Nút xổ/thu "Thông tin chung" chỉ đổi hiển thị — không tạo/xoá bất kỳ nhánh nào', () => {
      App.state.branches = [{id:'root1', name:'Ống chính', qM3h:5000, vMs:7, vType:'mainDuct', parentId:'', equipGroupId:''}];
      let panel = render();
      const card = panel.querySelector('[data-bidx="0"]');
      const advBlockBefore = [...card.querySelectorAll('div')].find(d=>d.getAttribute('style')&&d.getAttribute('style').includes('display:none'));
      assertTrue(!!advBlockBefore, 'Khối "Thông tin chung" phải thu gọn (display:none) mặc định');

      card.querySelector('[data-badv-toggle]').click();
      panel = App.__dom.window.document.getElementById('panel-calc');
      const cardAfter = panel.querySelector('[data-bidx="0"]');
      const styleAttrs = [...cardAfter.querySelectorAll('div')].map(d=>d.getAttribute('style')||'');
      assertTrue(!styleAttrs.some(s=>s.includes('display:none')), 'Sau khi bấm nút xổ, khối "Thông tin chung" không còn display:none — phải hiện ra');
      assertEqual(App.state.branches.length, 1, 'Bấm nút xổ/thu không được làm thay đổi số lượng nhánh trong state');
    });

  });

  suite('Import từ Tab Phụ Tải Nhiệt — nhánh tạo ra phải có .id thật (không undefined)', () => {

    test('Mọi nhánh import phải có .id là chuỗi khác rỗng, và các nhánh import cùng lúc phải có id KHÁC NHAU', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [
        { id:'hr1', name:'Phòng A', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5, _af:{L_supply:2000, L_fresh:300, L_return:1700} },
        { id:'hr2', name:'Phòng B', buildingType:'office', equipType:'AHU', L:8, W:6, H:3.2, nPeople:3, _af:{L_supply:1200, L_fresh:200, L_return:1000} },
      ];
      App.ui.calc._doImportHL(true);
      const ids = App.state.branches.map(b=>b.id);
      ids.forEach(id=>assertTrue(typeof id==='string' && id.length>0, `Mỗi nhánh import phải có .id thật (chuỗi khác rỗng) — thực tế: ${id}`));
      assertEqual(new Set(ids).size, ids.length, 'Các nhánh import cùng lúc phải có .id khác nhau, không được trùng');
    });

    test('Nhánh import (có id thật) phải cho phép thêm nhánh con lồng đúng qua nút "+" trong cây', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.state.hlRooms = [
        { id:'hr1', name:'Phòng A', buildingType:'office', equipType:'AHU', L:10, W:8, H:3.2, nPeople:5, groupId:'g1', _af:{L_supply:2000, L_fresh:300, L_return:1700} },
      ];
      App.ui.calc._doImportHL(true);
      const panel = render();
      panel.querySelector('[data-badd-child="0"]').click();
      const importedId = App.state.branches[0].id;
      assertEqual(App.state.branches[1].parentId, importedId, 'Nhánh con thêm dưới nhánh import phải trỏ parentId đúng vào .id thật của nhánh import (không phải undefined)');
    });

  });

  suite('_buildBranchTree — mọi node trả về phải có .id thật, kể cả nhánh gốc thiếu id trong state', () => {
    test('Nhánh thiếu id (state cũ/hỏng) vẫn phải nhận được id giả nhất quán trên chính node cây trả về', () => {
      App.state.branches = [{ name:'Nhánh không id', qM3h:1000, vMs:6, parentId:'' }];
      const tree = App.ui.calc._buildBranchTree(App.state.branches);
      assertEqual(tree.length, 1);
      assertTrue(tree[0].id !== undefined && tree[0].id !== null && tree[0].id !== '',
        `Node cây phải có .id (kể cả id giả dự phòng) — thực tế: ${tree[0].id}`);
    });
  });
};
