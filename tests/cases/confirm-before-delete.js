// confirm-before-delete.js — Bảo vệ tính năng "xác nhận trước khi xoá" mới thêm cho các mục
// dữ liệu quan trọng: nhánh ống, nhóm thiết bị, motor, tải ký sinh. Trước đây các nút xoá này
// (data-brow-del/data-gdel/data-mdel/data-pdel) xoá NGAY LẬP TỨC khi bấm, không hỏi lại,
// không undo — chỉ riêng xoá cả dự án mới có xác nhận (App.admin.confirmDeleteProject). Rủi ro
// rõ nhất với nhánh ống: xoá 1 nhánh có nhánh con sẽ khiến các nhánh con tự "thăng cấp" thành
// nhánh gốc mới (không lỗi, nhưng bất ngờ nếu bấm nhầm không được cảnh báo trước).

module.exports = function(App, T){
  const { suite, test, assertEqual, assertTrue } = T;

  function modalVisible(){
    const modal = App.__dom.window.document.getElementById('modal-root');
    return modal && !modal.classList.contains('hidden');
  }
  function clickConfirm(){ App.__dom.window.document.querySelector('#sc-ok').click(); }
  function clickCancel(){ App.__dom.window.document.querySelector('#sc-cancel').click(); }

  suite('Xác nhận trước khi xoá — nhánh ống, nhóm thiết bị, motor, tải ký sinh', () => {

    test('Xoá nhánh ống: bấm nút xoá KHÔNG xoá ngay — phải hiện modal xác nhận trước; bấm Xác nhận mới thực sự xoá', () => {
      App.state.branches = [{id:'b1', name:'Nhánh test', qM3h:1000, vMs:6, parentId:'', equipGroupId:''}];
      App.ui.calc.render();
      const panel = App.__dom.window.document.getElementById('panel-calc');
      panel.querySelector('[data-brow-del="0"]').click();
      assertEqual(App.state.branches.length, 1, 'Chưa được xoá ngay khi mới bấm nút xoá');
      assertTrue(modalVisible(), 'Phải hiện modal xác nhận sau khi bấm nút xoá nhánh');
      clickConfirm();
      assertEqual(App.state.branches.length, 0, 'Sau khi bấm Xác nhận trong modal, nhánh phải được xoá thật');
    });

    test('Xoá nhánh ống: bấm Huỷ trong modal KHÔNG được xoá', () => {
      App.state.branches = [{id:'b1', name:'Nhánh test', qM3h:1000, vMs:6, parentId:'', equipGroupId:''}];
      App.ui.calc.render();
      const panel = App.__dom.window.document.getElementById('panel-calc');
      panel.querySelector('[data-brow-del="0"]').click();
      clickCancel();
      assertEqual(App.state.branches.length, 1, 'Bấm Huỷ trong modal thì nhánh không được xoá');
    });

    test('Xoá nhóm thiết bị: phải qua modal xác nhận, bấm Xác nhận mới xoá', () => {
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.ui.heatload.render();
      const panel = App.__dom.window.document.getElementById('panel-heatload');
      panel.querySelector('[data-gdel="0"]').click();
      assertEqual(App.state.hlEquipGroups.length, 1, 'Chưa được xoá ngay khi mới bấm nút xoá');
      assertTrue(modalVisible(), 'Phải hiện modal xác nhận sau khi bấm nút xoá nhóm thiết bị');
      clickConfirm();
      assertEqual(App.state.hlEquipGroups.length, 0, 'Sau khi bấm Xác nhận, nhóm thiết bị phải được xoá thật');
    });

    test('Xoá motor: phải qua modal xác nhận, bấm Xác nhận mới xoá', () => {
      App.state.hlMotors = [{id:'m1', name:'Motor test', pKw:5, qty:1, method:'A', position:'TH1', roomId:null}];
      App.ui.heatload.render();
      const panel = App.__dom.window.document.getElementById('panel-heatload');
      panel.querySelector('[data-mdel="0"]').click();
      assertEqual(App.state.hlMotors.length, 1, 'Chưa được xoá ngay khi mới bấm nút xoá');
      assertTrue(modalVisible(), 'Phải hiện modal xác nhận sau khi bấm nút xoá motor');
      clickConfirm();
      assertEqual(App.state.hlMotors.length, 0, 'Sau khi bấm Xác nhận, motor phải được xoá thật');
    });

    test('Xoá tải ký sinh: phải qua modal xác nhận, bấm Xác nhận mới xoá', () => {
      App.state.hlParasitic = [{id:'p1', type:'ROTOR', name:'Rotor test', roomId:null, gAirM3h:1000, tInRotor:25, tOutRotor:40}];
      App.ui.heatload.render();
      const panel = App.__dom.window.document.getElementById('panel-heatload');
      panel.querySelector('[data-pdel="0"]').click();
      assertEqual(App.state.hlParasitic.length, 1, 'Chưa được xoá ngay khi mới bấm nút xoá');
      assertTrue(modalVisible(), 'Phải hiện modal xác nhận sau khi bấm nút xoá tải ký sinh');
      clickConfirm();
      assertEqual(App.state.hlParasitic.length, 0, 'Sau khi bấm Xác nhận, tải ký sinh phải được xoá thật');
    });

  });
};
