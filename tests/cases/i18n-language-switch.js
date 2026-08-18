// i18n-language-switch.js — Bảo vệ tính năng đa ngôn ngữ VI/EN. Gồm:
// 1. Bảo vệ 1 lỗi thật đã sửa: nút chuyển ngôn ngữ (cả trong Cài Đặt lẫn lệnh nhanh Ctrl+K)
//    TRƯỚC ĐÂY quên gọi renderNav() — nội dung các tab đổi ngôn ngữ đúng nhưng thanh điều
//    hướng (sidebar) vẫn giữ nhãn cũ, khiến giao diện "nửa Việt nửa Anh" gây khó hiểu.
// 2. Xác nhận FAQ và tiêu đề báo cáo đã có bản dịch tiếng Anh đầy đủ.

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;

  suite('Đa ngôn ngữ VI/EN — chuyển ngôn ngữ phải đồng bộ toàn bộ giao diện', () => {

    test('Sidebar phải cập nhật đúng ngôn ngữ sau khi đổi (không chỉ nội dung tab)', () => {
      App.state.lang = 'vi';
      App.ui.renderNav();
      const doc = App.__dom.window.document;
      assertTrue(doc.getElementById('sidebar').textContent.includes('Tính Toán'), 'Sidebar phải hiện tiếng Việt ban đầu');

      App.state.lang = 'en';
      App.ui.applyI18n(); App.ui.renderNav(); App.ui.renderAllTabs();
      assertTrue(doc.getElementById('sidebar').textContent.includes('Calc'),
        'Sidebar phải đổi sang tiếng Anh ngay sau khi đổi ngôn ngữ — nếu không, bug thiếu renderNav() đã quay lại');
      assertTrue(!doc.getElementById('sidebar').textContent.includes('Tính Toán'),
        'Sidebar không được còn sót nhãn tiếng Việt cũ sau khi đổi sang EN');

      App.state.lang = 'vi'; // reset cho test khác
      App.ui.applyI18n(); App.ui.renderNav(); App.ui.renderAllTabs();
    });

    test('FAQ phải có bản dịch tiếng Anh đầy đủ (không rơi về key thô)', () => {
      assertTrue(Array.isArray(App.ui.ai.FAQ_DATA_EN) && App.ui.ai.FAQ_DATA_EN.length === App.ui.ai.FAQ_DATA.length,
        'FAQ_DATA_EN phải tồn tại và có cùng số lượng chuyên mục với bản tiếng Việt');
      const totalItemsVi = App.ui.ai.FAQ_DATA.reduce((s,c)=>s+c.items.length,0);
      const totalItemsEn = App.ui.ai.FAQ_DATA_EN.reduce((s,c)=>s+c.items.length,0);
      assertTrue(totalItemsVi === totalItemsEn, 'Số câu hỏi bản Anh phải khớp bản Việt (không thiếu câu nào)');
    });

    test('App.ui.t() phải trả về bản dịch đúng, và trả về chính key đó nếu chưa dịch (không crash)', () => {
      App.state.lang = 'en';
      assertTrue(App.ui.t('tab_project') === 'Project', 'Key đã dịch phải trả về đúng bản Anh');
      assertTrue(App.ui.t('key_khong_ton_tai_xyz') === 'key_khong_ton_tai_xyz', 'Key chưa dịch phải fallback về chính nó, không được lỗi/rỗng');
      App.state.lang = 'vi';
    });

    test('Tiêu đề báo cáo PDF phải đổi theo ngôn ngữ', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.state.lang = 'vi';
      let html = App.report.buildPreviewHtml();
      assertTrue(html.includes('BÁO CÁO TÍNH TOÁN HVAC'), 'Tiêu đề báo cáo tiếng Việt phải đúng');
      App.state.lang = 'en';
      html = App.report.buildPreviewHtml();
      assertTrue(html.includes('HVAC CALCULATION REPORT'), 'Tiêu đề báo cáo tiếng Anh phải đúng');
      App.state.lang = 'vi';
    });

  });
};
