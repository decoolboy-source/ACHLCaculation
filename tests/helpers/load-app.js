// load-app.js — Mở app.html trong môi trường "trình duyệt giả lập" (jsdom) để các
// file test có thể gọi thẳng App.calc.<hàm>(...) như code thật trong app đang chạy,
// không cần mở trình duyệt, không cần server.
//
// LƯU Ý: kể từ khi tách app thành 3 file (src/app-data.js, src/app-calc.js,
// src/app-ui.js — xem index.html), môi trường jsdom dùng để chạy test KHÔNG tự tải
// được các file JS này qua thẻ <script src="...">, kể cả khi trỏ vào file cục bộ
// (đây là giới hạn của môi trường giả lập, KHÔNG phải giới hạn của trình duyệt thật
// — trình duyệt thật tải file tách rời hoàn toàn bình thường). Vì vậy hàm này tự đọc
// nội dung 3 file JS trực tiếp từ ổ đĩa rồi "ráp" thành 1 khối <script> duy nhất
// trước khi đưa vào jsdom — chỉ để phục vụ test, không ảnh hưởng gì đến app thật.
//
// Cách dùng trong 1 file test:
//   const { loadApp } = require('./helpers/load-app');
//   const App = await loadApp();
//   App.calc.calcPsychro(25, 60, 0);

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function loadApp(){
  const projectRoot = path.join(__dirname, '..', '..');
  const htmlPath = path.join(projectRoot, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Ráp 3 file JS lại thành 1 khối <script> duy nhất, thay cho 3 thẻ <script src=...>
  const jsFiles = ['app-data.js', 'app-calc.js', 'app-ui.js'];
  const combinedJs = jsFiles
    .map(f => fs.readFileSync(path.join(projectRoot, 'src', f), 'utf8'))
    .join('\n');

  const scriptTagsPattern = /<script src="\.\/src\/app-data\.js"><\/script>\s*<script src="\.\/src\/app-calc\.js"><\/script>\s*<script src="\.\/src\/app-ui\.js"><\/script>/;
  if(!scriptTagsPattern.test(html)){
    throw new Error('load-app.js: không tìm thấy 3 thẻ <script src> cho app-data/app-calc/app-ui trong index.html — cấu trúc file có thể đã đổi, cần cập nhật lại test helper này.');
  }
  // FIX: dùng replacement dạng STRING trực tiếp cho .replace() từng gây lỗi thật — nếu code
  // trong combinedJs (app-data/calc/ui.js) chứa chuỗi con "$'" (vd trong 1 regex pattern kết
  // thúc bằng "$" ngay trước dấu nháy đơn đóng chuỗi), JS hiểu "$'" là ký hiệu THAY THẾ ĐẶC
  // BIỆT của String.replace() (nghĩa là "phần văn bản sau chỗ khớp"), làm hỏng/cắt xén code
  // được ráp vào — lỗi CHỈ xuất hiện khi chạy qua bộ test này, không phải lỗi code thật (đã
  // xác nhận qua 1 lần debug thực tế: thêm regex '-[0-9]+$' vào app-ui.js làm sập bộ test dù
  // cú pháp hoàn toàn hợp lệ). Dùng dạng REPLACEMENT FUNCTION thay vì string — hàm trả về
  // chuỗi được dùng NGUYÊN VĂN, không bị diễn giải ký hiệu đặc biệt như "$&","$'","$`","$$".
  html = html.replace(scriptTagsPattern, () => `<script>\n${combinedJs}\n</script>`);

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    url: 'http://localhost/'
  });
  // App tự chạy khi trang load xong (DOMContentLoaded) — đợi 1 nhịp để chắc chắn
  // window.AppMultiHVAC đã được gán trước khi test bắt đầu gọi hàm.
  await new Promise(resolve => setTimeout(resolve, 1200));
  const App = dom.window.AppMultiHVAC;
  if(!App) throw new Error('Không tìm thấy window.AppMultiHVAC — app chưa load xong hoặc lỗi khi khởi động.');
  App.__dom = dom; // giữ lại tham chiếu phòng khi cần thao tác thêm trên window/document
  return App;
}

module.exports = { loadApp };
