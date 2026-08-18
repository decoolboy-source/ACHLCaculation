// pwa-ui-fixes.js — Bảo vệ 2 lỗi giao diện đã sửa theo phản hồi thực tế khi cài PWA ra
// màn hình chính điện thoại:
//
// 1. Tab mặc định khi mở app lần đầu phải là "Dự Án" (project) — trước đây mặc định là
//    "Tính toán" (calc), không hợp lý cho luồng làm việc thông thường (nhập thông tin dự
//    án trước khi tính toán).
//
// 2. Header (#app-header) và menu điều hướng mobile (#mobile-nav) phải có CSS bù đắp vùng
//    an toàn (safe-area-inset) — nếu không, khi cài PWA vào màn hình chính (chế độ
//    "standalone", không còn thanh địa chỉ trình duyệt che chắn), nút Menu và nút đóng
//    sidebar sẽ nằm NGAY DƯỚI thanh trạng thái hệ thống (giờ/pin/sóng) — vừa bị che chữ,
//    vừa không bấm được vì vùng đó bị hệ thống chiếm quyền chạm trên nhiều điện thoại.

module.exports = function(App, T){
  const { suite, test, assertTrue, assertEqual } = T;

  suite('PWA — tab mặc định và vùng an toàn (safe-area) cho màn hình cài ra Home Screen', () => {

    test('Tab mặc định khi mở app lần đầu phải là "project" (Dự Án), không phải "calc"', () => {
      assertEqual(App.state.activeTab, 'project', 'App.state.activeTab phải mặc định là "project"');
    });

    test('Panel "project" phải đang hiển thị (không bị ẩn) ngay sau khi app load xong', () => {
      const doc = App.__dom.window.document;
      const panel = doc.getElementById('panel-project');
      assertTrue(!!panel, 'Panel project phải tồn tại trong DOM');
      assertTrue(!panel.classList.contains('hidden'), 'Panel project không được có class "hidden" — phải là panel đang hiển thị mặc định');
    });

    test('CSS phải có rule bù safe-area-inset-top cho #app-header (tránh bị thanh trạng thái đè khi cài PWA)', () => {
      const html = App.__dom.window.document.documentElement.outerHTML;
      assertTrue(html.includes('safe-area-inset-top'),
        'HTML/CSS phải có tham chiếu tới env(safe-area-inset-top) — nếu không, nút Menu sẽ bị đè bởi thanh trạng thái khi chạy PWA standalone trên điện thoại có notch/tai thỏ');
    });

    test('Thẻ <header> phải có id="app-header" để CSS safe-area áp dụng đúng chỗ', () => {
      const header = App.__dom.window.document.querySelector('header#app-header');
      assertTrue(!!header, 'Thẻ header phải có id="app-header"');
    });

    test('viewport meta phải có viewport-fit=cover (điều kiện bắt buộc để safe-area-inset hoạt động)', () => {
      const viewportMeta = App.__dom.window.document.querySelector('meta[name="viewport"]');
      assertTrue(viewportMeta?.content?.includes('viewport-fit=cover'),
        'Thiếu viewport-fit=cover thì env(safe-area-inset-*) sẽ luôn trả về 0, CSS bù safe-area sẽ vô tác dụng');
    });

    test('Phải có lớp CSS dự phòng @media (display-mode: standalone) với padding tối thiểu cố định, phòng khi env() không phân giải đúng trên vài thiết bị', () => {
      const html = App.__dom.window.document.documentElement.outerHTML;
      assertTrue(html.includes('display-mode: standalone'),
        'Phải có @media (display-mode: standalone) — lớp bảo vệ dự phòng khi env(safe-area-inset-top) không đủ tin cậy trên 1 số WebKit cũ/thiết bị lạ');
    });

  });
};
