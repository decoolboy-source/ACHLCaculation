// duct-branch-sizing.js — Bảo vệ 1 lỗi thật đã sửa: nhánh ống gió thiếu vận tốc (vMs)
// bị bỏ qua VĨNH VIỄN khi tính (App.ui.calc.recalc()), không có cảnh báo gì — người
// dùng bấm "Tính ống gió" bao nhiêu lần cũng không ra kết quả. Test dùng thẳng luồng
// thật (đưa nhánh vào App.state.branches rồi gọi recalc()) vì công thức tính nằm
// trong hàm recalc(), không tách riêng thành hàm thuần (pure function).

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;

  suite('Tính nhánh ống gió — không được âm thầm bỏ qua khi thiếu dữ liệu', () => {

    test('Nhánh có Q nhưng THIẾU vận tốc (vMs) — recalc() phải tự điền mặc định, KHÔNG được bỏ qua', () => {
      App.state.branches = [{
        id: 'test1', name: 'Test Branch', qM3h: 1800, vMs: null, vType: 'mainDuct',
        shape: 'rect', materialId: 'galv', insulationId: 'glasswool',
        lengthM: 10, ambientTC: 32, thicknessMm: 25, fittingsZeta: 0.8,
      }];
      App.ui.calc.recalc();
      const b = App.state.branches[0];
      assertTrue(b.vMs > 0, 'recalc() phải tự điền vMs mặc định cho nhánh có Q nhưng thiếu vận tốc');
      assertTrue(!!b._result, 'Nhánh phải có _result sau khi recalc() — nếu null nghĩa là vẫn bị bỏ qua âm thầm');
    });

    test('Nhánh đủ Q và vMs → phải ra kích thước ống hợp lý (không rỗng, không âm)', () => {
      App.state.branches = [{
        id: 'test2', name: 'Test Branch 2', qM3h: 2560, vMs: 6, vType: 'mainDuct',
        shape: 'rect', materialId: 'galv', insulationId: 'glasswool',
        lengthM: 10, ambientTC: 32, thicknessMm: 25, fittingsZeta: 0.8,
      }];
      App.ui.calc.recalc();
      const b = App.state.branches[0];
      assertTrue(!!b._result?.dimsLabel, 'Phải có nhãn kích thước ống (dimsLabel)');
      assertTrue(b._result.frictionPa > 0, 'ΔP ma sát phải là số dương');
    });

    test('Nhánh KHÔNG có Q (qM3h rỗng) → hợp lý là _result=null, KHÔNG được ném lỗi làm sập app', () => {
      App.state.branches = [{
        id: 'test3', name: 'Test Branch 3', qM3h: null, vMs: 6,
        shape: 'rect', materialId: 'galv', insulationId: 'glasswool', lengthM: 10,
      }];
      let threw = false;
      try{ App.ui.calc.recalc(); }catch(e){ threw = true; }
      assertTrue(!threw, 'recalc() không được ném lỗi làm crash app khi có nhánh thiếu Q — phải bỏ qua nhánh đó 1 cách êm ái');
    });

  });
};
