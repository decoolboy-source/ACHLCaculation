// run-all.js — Chạy TOÀN BỘ bộ test của app.
//
// Cách chạy:  node tests/run-all.js
// (từ thư mục gốc của project, chỗ có file index.html)
//
// File này làm 3 việc:
//   1. Mở app.html lên (giống mở trong trình duyệt, nhưng không cần trình duyệt thật)
//   2. Chạy lần lượt các bài test trong thư mục tests/cases/
//   3. In ra bao nhiêu test PASS/FAIL — nếu có test nào FAIL, dừng lại và báo mã lỗi
//      (để dùng được với GitHub Actions kiểm tra tự động mỗi khi có thay đổi code)
//
// Thêm bài test mới: tạo 1 file trong tests/cases/ (xem các file có sẵn làm mẫu),
// rồi thêm dòng require() cho file đó vào danh sách bên dưới.

const { loadApp } = require('./helpers/load-app');
const T = require('./helpers/tiny-test');

const testFiles = [
  './cases/psychrometrics',
  './cases/fcu-vs-fcu-oa',
  './cases/door-leakage-airflow',
  './cases/validation',
  './cases/duct-branch-sizing',
  './cases/partition-load-drawer',
  './cases/pau-vs-ahu-hospital',
  './cases/report-individual-calc',
  './cases/local-exhaust-equipment',
  './cases/roof-floor-drawer',
  './cases/status-badge-and-thresholds',
  './cases/pwa-ui-fixes',
  './cases/i18n-language-switch',
  './cases/pc-scroll-and-equip-group',
  './cases/import-equip-group',
  './cases/report-text-color',
  './cases/deep-followup-fixes',
  './cases/fan-equipment-schedule',
];

(async () => {
  console.log('Đang mở app để chạy test...');
  const App = await loadApp();
  console.log('App đã load xong. Bắt đầu chạy test...\n');

  for(const file of testFiles){
    require(file)(App, T);
  }

  // test() là async nhưng chạy tuần tự theo require() phía trên — đợi 1 nhịp cho
  // toàn bộ Promise bên trong test() hoàn tất trước khi tổng kết.
  await new Promise(resolve => setTimeout(resolve, 200));
  T.summary();
})();
