// report-preview-css-scope.js — Bảo vệ lỗi GỐC RỄ THẬT của "chữ báo cáo trùng màu nền,
// không đọc được" — một cơ chế hoàn toàn khác với những gì các lần sửa trước (report-text-
// color.js) đã kiểm tra.
//
// index.html có 2 rule CSS toàn cục cho giao diện tối của app:
//   th { background:#071325 !important; color:var(--text-mid) !important; ... }
//   td { border-bottom:...!important; color:var(--text-hi) !important; }
// (--text-hi = #edf2f8, gần trắng — đúng cho nền tối của app, nhưng SAI hoàn toàn cho báo cáo
// xuất PDF/Excel, vốn có nền trắng/xám nhạt.)
//
// Theo cascade CSS chuẩn: 1 rule "!important" trong stylesheet LUÔN thắng 1 inline style
// KHÔNG có "!important", bất kể độ đặc hiệu (specificity) của selector. Vì vậy dù báo cáo
// (App.report.buildPreviewHtml(), render vào #report-preview) tự set inline color:#111 (đen)
// trên từng <td>, rule "td{color:var(--text-hi)!important}" ở trên vẫn ĐÈ LÊN, biến chữ báo
// cáo thành gần-trắng trên nền trắng/xám nhạt — vô hình. <th> cũng bị ép nền tối #071325,
// đè lên nền sáng báo cáo tự thiết kế.
//
// Đây là lý do lỗi "chữ trùng màu nền" trong báo cáo TÁI DIỄN nhiều lần dù đã sửa: các lần sửa
// trước (report-text-color.js) chỉ đảm bảo báo cáo có inline color TƯỜNG MINH (đúng nhưng KHÔNG
// ĐỦ, vì !important của rule toàn cục này vẫn thắng). Bộ test cũ dùng regex trên chuỗi HTML thô,
// không render vào DOM thật với <style> của app đang hoạt động — nên không thể phát hiện lỗi
// cascade CSS này. Test này render báo cáo vào đúng #report-preview như code thật
// (_exportPDF_impl) làm, rồi đọc getComputedStyle() thật để xác nhận màu báo cáo tự đặt được
// giữ nguyên, không bị rule toàn cục ghi đè — đồng thời xác nhận giao diện chính của app (ngoài
// #report-preview) vẫn giữ đúng theme tối như thiết kế.
//
// Lưu ý: chỉ kiểm tra các giá trị màu hex thuần (không qua var()) — JSDOM có giới hạn riêng khi
// tính toán var() kết hợp !important (khác lỗi thật đang kiểm tra ở đây), nên test tránh phụ
// thuộc vào việc JSDOM tính đúng var().

module.exports = function(App, T){
  const { suite, test, assertEqual, assertTrue } = T;

  suite('Báo cáo — #report-preview phải miễn nhiễm với rule CSS toàn cục th/td!important của giao diện tối app', () => {

    test('<td> bên trong #report-preview giữ đúng màu chữ báo cáo tự đặt (color:#111), không bị ép sáng theo theme tối', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const html = App.report.buildPreviewHtml();

      const doc = App.__dom.window.document;
      const preview = doc.getElementById('report-preview');
      assertTrue(!!preview, 'Phải tìm thấy #report-preview trong DOM thật của app (chỗ báo cáo được render trước khi xuất PDF)');
      preview.innerHTML = html;

      const win = App.__dom.window;
      const tds = [...preview.querySelectorAll('td')].filter(td => td.textContent.trim().length > 0 && /color:#111/.test(td.getAttribute('style')||''));
      assertTrue(tds.length > 5, 'Sanity check: báo cáo phải có nhiều <td> dùng color:#111 (đen) để kiểm tra');
      tds.forEach(td => {
        const computed = win.getComputedStyle(td).color;
        assertEqual(computed, 'rgb(17, 17, 17)',
          `<td> báo cáo (nội dung: "${td.textContent.trim().slice(0,30)}") phải giữ đúng color:#111 (đen) đã đặt — nhưng computed style thực tế là ${computed}. Nếu khác rgb(17,17,17), nghĩa là rule CSS toàn cục "td{color:...!important}" của theme tối đang đè lên, gây chữ vô hình trên nền trắng/xám nhạt của báo cáo.`);
      });
    });

    test('<th> bên trong #report-preview không bị ép nền tối #071325 của theme app (để lộ đúng nền xám nhạt #f1f5f9 báo cáo tự đặt trên <tr> cha)', () => {
      // Báo cáo đặt background:#f1f5f9 trên <tr> (header row), còn <th> con không tự set nền
      // riêng (mặc định trong suốt, để lộ màu tr cha) — đúng chuẩn HTML table. Rule toàn cục
      // "th{background:#071325!important}" (theme tối app) từng ép NGAY <th> có nền riêng
      // #071325, che mất hoàn toàn nền xám nhạt của tr cha. Sau khi loại trừ #report-preview,
      // <th> phải quay về nền trong suốt mặc định (rgba(0,0,0,0)) để lộ đúng nền tr cha.
      const doc = App.__dom.window.document;
      const preview = doc.getElementById('report-preview');
      const win = App.__dom.window;
      const headerTrs = [...preview.querySelectorAll('tr')].filter(tr => /background:#f1f5f9/.test(tr.getAttribute('style')||''));
      assertTrue(headerTrs.length > 0, 'Sanity check: báo cáo phải có ít nhất 1 header row nền xám nhạt (#f1f5f9) để kiểm tra');
      assertEqual(win.getComputedStyle(headerTrs[0]).backgroundColor, 'rgb(241, 245, 249)',
        'Header <tr> phải giữ đúng nền #f1f5f9 báo cáo tự đặt');
      const ths = headerTrs.flatMap(tr => [...tr.querySelectorAll('th')]);
      assertTrue(ths.length > 0, 'Sanity check: các header row phải chứa <th>');
      ths.forEach(th => {
        const computed = win.getComputedStyle(th).backgroundColor;
        assertEqual(computed, 'rgba(0, 0, 0, 0)',
          `<th> báo cáo phải trong suốt (để lộ nền #f1f5f9 của tr cha) — nhưng computed style thực tế là ${computed}. Nếu ra rgb(7,19,37) (#071325), nghĩa là rule CSS toàn cục "th{background:...!important}" của theme tối app đang đè lên, che mất nền báo cáo.`);
      });
    });

    test('Ngoài #report-preview, giao diện chính của app vẫn giữ đúng theme tối cho <th>/<td> (đảm bảo fix không làm hỏng UI chính)', () => {
      const doc = App.__dom.window.document;
      const win = App.__dom.window;
      // Tab Phụ Tải Nhiệt có bảng motor (ngoài #report-preview) — dùng làm mẫu kiểm tra UI chính.
      App.ui.renderAllTabs();
      const allTh = [...doc.querySelectorAll('th')].filter(th => !th.closest('#report-preview'));
      const mainTh = allTh[0];
      assertTrue(!!mainTh, 'Phải tìm được ít nhất 1 <th> trong giao diện chính (ngoài báo cáo) để kiểm tra');
      const bg = win.getComputedStyle(mainTh).backgroundColor;
      assertEqual(bg, 'rgb(7, 19, 37)',
        `<th> trong giao diện chính của app (ngoài báo cáo) phải vẫn giữ nền tối #071325 theo đúng theme — nhưng thực tế là ${bg}. Việc loại trừ #report-preview khỏi rule CSS không được ảnh hưởng tới phần còn lại của app.`);
    });

  });
};
