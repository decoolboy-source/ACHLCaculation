// deep-followup-fixes.js — Bảo vệ các lỗi phát hiện SÂU HƠN sau khi người dùng phản hồi
// "vẫn còn lỗi" dù đã sửa ở lượt trước. Bài học quan trọng: nhiều lỗi "đã sửa" trước đó chỉ
// mới xử lý MỘT PHẦN nguyên nhân, không phải toàn bộ gốc rễ. Gồm:
//
// 1. equipGroupId vẫn thiếu ở nút "+ Thêm nhánh ống" THỦ CÔNG (chỉ mới sửa đường IMPORT ở
//    lượt trước, bỏ sót đường thêm tay).
// 2. Nguyên nhân THẬT của lỗi màu chữ báo cáo không phải thiếu color CSS (đã sửa nhưng
//    KHÔNG đủ) — mà là html2canvas được gọi NGAY sau khi set innerHTML, không đợi trình
//    duyệt paint xong nội dung dài nhiều bảng.
// 3. Nguyên nhân THẬT của lỗi cuộn PC không chỉ là #tab-content thiếu min-h-0 (đã sửa
//    nhưng KHÔNG đủ) — mà #app-root dùng min-height (không giới hạn) thay vì height cố
//    định, khiến toàn trang phình to hơn viewport.

module.exports = function(App, T){
  const { suite, test, assertTrue, assertEqual } = T;

  suite('Nhánh ống gió — MỌI cách tạo nhánh đều phải mang theo nhóm thiết bị hợp lý', () => {

    test('Nút "+ Thêm nhánh ống" thủ công phải kế thừa equipGroupId của nhánh gần nhất (nếu có)', () => {
      App.state.branches = [{id:'b1', name:'Nhánh 1', qM3h:1000, vMs:6, equipGroupId:'g1'}];
      App.ui.showTab('calc'); App.ui.calc.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-calc');
      panel.querySelector('#btn-add-branch').click();
      assertEqual(App.state.branches[1].equipGroupId, 'g1',
        'Nhánh mới thêm thủ công phải tự kế thừa equipGroupId="g1" từ nhánh gần nhất — tránh phải chọn lại thủ công mỗi lần thêm nhánh cho nhiều phòng cùng 1 nhóm thiết bị');
    });

    test('Nhánh ĐẦU TIÊN (chưa có nhánh nào trước đó) thêm thủ công phải có equipGroupId rỗng, không lỗi', () => {
      App.state.branches = [];
      App.ui.showTab('calc'); App.ui.calc.render();
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-calc');
      let threw = false;
      try{ panel.querySelector('#btn-add-branch').click(); }catch(e){ threw = true; }
      assertTrue(!threw, 'Không được lỗi khi thêm nhánh đầu tiên (chưa có nhánh nào để kế thừa)');
      assertEqual(App.state.branches[0].equipGroupId, '', 'Nhánh đầu tiên phải có equipGroupId rỗng (không có gì để kế thừa)');
    });

  });

  suite('Báo cáo PDF — html2canvas phải đợi paint xong trước khi chụp', () => {
    test('_exportPDF_impl phải có cơ chế đợi paint (requestAnimationFrame hoặc setTimeout) TRƯỚC khi gọi html2canvas', () => {
      const fnSource = App.report._exportPDF_impl.toString();
      assertTrue(fnSource.includes('requestAnimationFrame') || fnSource.includes('setTimeout'),
        '_exportPDF_impl phải đợi ít nhất 1 chu kỳ paint trước khi gọi html2canvas — nếu không, nội dung dài (nhiều bảng) dễ bị chụp khi CHƯA style/layout xong, gây "chữ nhạt/trắng" ở PDF xuất ra (xác nhận qua debug file PDF thật)');
    });
  });

  suite('Layout PC — #app-root phải có chiều cao CỐ ĐỊNH ở desktop, không chỉ TỐI THIỂU', () => {
    test('Phải có CSS ép #app-root height cố định ở breakpoint desktop (không chỉ dựa vào min-h-screen)', () => {
      const html = App.__dom.window.document.documentElement.outerHTML;
      assertTrue(/#app-root\s*\{\s*height\s*:\s*100vh/.test(html) || /#app-root\{height:100vh/.test(html),
        '#app-root cần CSS "height:100vh" (không phải chỉ min-height) trong 1 media query desktop — nếu chỉ có min-h-screen (min-height), toàn trang có thể phình to hơn viewport, khiến #tab-content không bao giờ thực sự cuộn nội bộ được (chỉ cuộn được khi trỏ ra sidebar) — đây là nguyên nhân GỐC, không phải chỉ thiếu min-h-0 ở #tab-content');
    });
  });

  suite('Mobile nav drawer — phải cuộn được nếu danh sách tab dài hơn màn hình', () => {
    test('#mobile-nav phải có overflow-y:auto (tránh tràn/che khuất các tab cuối danh sách khi có nhiều tab + padding-top safe-area)', () => {
      const nav = App.__dom.window.document.getElementById('mobile-nav');
      const style = nav.getAttribute('style') || '';
      assertTrue(style.includes('overflow-y:auto') || style.includes('overflow-y: auto'),
        '#mobile-nav thiếu overflow-y:auto — khi cài PWA (padding-top bị đẩy thêm ~44px để tránh status bar) kết hợp danh sách 9 tab, các tab cuối dễ bị tràn ra ngoài không truy cập được');
    });
  });
};
