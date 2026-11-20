# vendor/ — thư viện và font nhúng sẵn

App không gọi CDN khi chạy: mọi thư viện nằm ở đây và được service worker lưu offline.
Muốn nâng phiên bản: tải file mới đúng phiên bản, thay file, cập nhật bảng dưới, tăng số phiên bản cache trong `sw.js`.

| File | Thư viện | Phiên bản | Nguồn tải | Giấy phép |
|---|---|---|---|---|
| `lucide.min.js` | Lucide (icon) | 1.77.0 (trước đây dùng `lucide@latest`, không ghim) | cdn.jsdelivr.net/npm/lucide@1.77.0/dist/umd/lucide.min.js | ISC |
| `jspdf.umd.min.js` | jsPDF | 2.5.1 | cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/ | MIT |
| `html2canvas.min.js` | html2canvas | 1.4.1 | cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/ | MIT |
| `xlsx.full.min.js` | SheetJS Community Edition | 0.18.5 | cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/ | Apache-2.0 |
| `fonts/*.woff2`, `fonts/fonts.css` | Inter, JetBrains Mono (bộ ký tự latin, latin-ext, vietnamese; font biến thiên 400–700) | Google Fonts, tải 20/11/2026 | fonts.googleapis.com | SIL OFL 1.1 — `fonts/OFL-Inter.txt`, `fonts/OFL-JetBrainsMono.txt` |
