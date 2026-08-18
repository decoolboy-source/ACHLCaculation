# MultiHVAC Calculator

Công cụ tính toán tải nhiệt, lưu lượng gió, ống gió và chọn thiết bị cho 3 môi trường: Phòng sạch (Cleanroom), Data Center, Phòng điện/Tủ điện. Chạy hoàn toàn offline trong trình duyệt — không cần server, không gửi dữ liệu đi đâu cả. Có thể cài như 1 app thật (PWA) trên điện thoại/máy tính.

## Cách mở app (dùng ngay, không cần cài gì)

Mở file `index.html` bằng trình duyệt bất kỳ (Chrome, Safari, Edge...).

## Cách đưa app lên mạng để cài như 1 app thật (GitHub Pages + PWA)

Đây là cách để bạn (và bất kỳ ai bạn chia sẻ link) mở app qua 1 đường link, cài vào điện thoại/máy tính như app thật, và dùng offline hoàn toàn sau lần mở đầu tiên. Làm 1 lần duy nhất:

1. Tạo tài khoản [GitHub](https://github.com) (miễn phí) nếu chưa có.
2. Tạo 1 "repository" mới (nút **New** màu xanh trên trang GitHub), đặt tên tuỳ ý (VD `multihvac-calculator`), để **Public**.
3. Tải toàn bộ nội dung thư mục này lên repository đó — cách dễ nhất: kéo-thả toàn bộ file/thư mục vào ô "uploading an existing file" ngay trên trang web GitHub (không cần dùng dòng lệnh git).
4. Vào **Settings → Pages** của repository đó. Ở mục "Branch", chọn `main` và thư mục `/ (root)`, bấm **Save**.
5. Đợi khoảng 1-2 phút, GitHub sẽ cho bạn 1 đường link dạng `https://<tên-tài-khoản>.github.io/<tên-repo>/` — đây chính là link app của bạn, mở được từ bất kỳ đâu có mạng.
6. Mở link đó trên điện thoại → trình duyệt sẽ cho tuỳ chọn **"Thêm vào Màn hình chính" / "Add to Home Screen" / "Install App"** — làm theo, app sẽ có icon riêng như app thật, mở được cả khi không có mạng.

**Cập nhật app sau này:** mỗi khi bạn (hoặc AI) sửa code và tải file mới lên GitHub, cần mở file `sw.js`, đổi số ở dòng `const CACHE_VERSION = 'v1';` thành `'v2'`, `'v3'`... thì người dùng mới nhận được bản mới (đây là quy tắc bắt buộc của cơ chế offline — nếu không đổi số, trình duyệt cứ dùng mãi bản cũ đã lưu sẵn).

## Cách chạy bộ test (kiểm tra tự động)

Bộ test này kiểm tra các công thức tính toán lõi có đúng không, trước khi bạn tin tưởng dùng kết quả. Cần cài [Node.js](https://nodejs.org) một lần (miễn phí), sau đó:

```bash
npm install     # chỉ cần làm 1 lần đầu tiên
npm test        # chạy mỗi khi muốn kiểm tra
```

Nếu thấy dòng `✓ TẤT CẢ ... TEST ĐỀU PASS` — công thức tính toán vẫn đúng như kỳ vọng. Nếu thấy `✗ FAIL` — có chỗ nào đó đã bị sửa sai, cần xem lại trước khi dùng.

**Vì sao việc này quan trọng:** trước đây, mọi lỗi tính toán trong app (kể cả lỗi tính sai mà không báo gì) chỉ được phát hiện khi người dùng tình cờ vấp phải và báo lại. Bộ test này là "lưới an toàn" — bất kỳ thay đổi nào trong tương lai làm hỏng công thức đã đúng trước đó sẽ bị phát hiện ngay, tự động, không cần chờ ai đó dùng thử.

**Tự động trên GitHub:** đã cài sẵn `.github/workflows/test.yml` — nếu bạn dùng GitHub, mỗi lần tải code mới lên, GitHub tự động chạy bộ test này và báo dấu ✓ xanh hoặc ✗ đỏ ngay trên trang repository, không cần tự chạy `npm test` bằng tay.

## Cấu trúc thư mục

```
index.html          — khung giao diện (HTML/CSS) + nạp 3 file JS bên dưới
src/
  app-data.js        — dữ liệu tra cứu kỹ thuật (tiêu chuẩn, catalog, khí hậu...)
  app-calc.js        — công thức tính toán lõi (tâm lý ẩm, tải nhiệt, ống gió...)
  app-ui.js          — giao diện, tương tác, xuất báo cáo
manifest.json        — khai báo PWA (tên app, icon, màu sắc) để cài được như app thật
sw.js                 — Service Worker — giúp app chạy offline sau lần mở đầu tiên
icon.svg, icon-192.png, icon-512.png — icon app
tests/
  run-all.js         — chạy toàn bộ bộ test
  helpers/
    load-app.js      — mở app lên (ráp 3 file JS lại) để test gọi hàm tính toán được
    tiny-test.js      — bộ công cụ test tối giản (không phụ thuộc thư viện ngoài)
  cases/              — từng file test theo chủ đề
    psychrometrics.js       — công thức tâm lý ẩm gốc
    fcu-vs-fcu-oa.js         — phân biệt FCU/FCU_OA (bảo vệ lỗi đã sửa)
    door-leakage-airflow.js  — bù áp qua khe cửa (bảo vệ lỗi đã sửa)
    validation.js             — kiểm tra diện tích sàn (bảo vệ lỗi đã sửa)
    duct-branch-sizing.js     — tính nhánh ống gió (bảo vệ lỗi đã sửa)
    partition-load-drawer.js  — tải vách ngăn nội bộ ở nút Tính riêng phòng (bảo vệ lỗi đã sửa)
.github/workflows/test.yml — tự động chạy bộ test trên GitHub mỗi khi có thay đổi
```

## Lộ trình nâng cấp (4 bước)

Ứng dụng được phát triển qua nhiều đợt vá rời rạc, dẫn đến một số lỗi logic quan trọng (đã được rà soát và sửa qua nhiều lượt trao đổi). Kế hoạch nâng cấp có hệ thống gồm 4 bước, làm tuần tự:

- [x] **Bước 1 — Viết bộ test tự động cho công thức tính toán lõi.** *(đã xong)* — Tạo lưới an toàn để mọi thay đổi sau này đều được kiểm tra tự động, không phụ thuộc vào việc người dùng tình cờ phát hiện lỗi.
- [x] **Bước 2 — Gộp các field dữ liệu trùng tên, xóa code chết.** *(đã xong)* — Đã xóa **~28 hàm code hoàn toàn không được dùng** (~800 dòng), trong đó có cả một "bộ máy tính toán V1" nguyên vẹn bị bỏ quên và 1 form nhập liệu mồ côi (`_projectHtml`) — chính là nguồn gốc lỗi "báo cáo không hiện tên khách hàng" đã sửa ở phiên trước. Đã gộp field trùng tên trong bản ghi dự án lưu trữ.
- [x] **Bước 3 — Thêm lớp cảnh báo rõ ràng khi thiếu dữ liệu.** *(đã xong)* — Thêm cảnh báo cụ thể tại 3 khu vực hay bị "âm thầm bỏ qua": nhánh ống gió thiếu lưu lượng Q, công cụ tính U từ cấu tạo lớp, vách ngăn nội bộ. **Phát hiện quan trọng nhất**: nút "Tính" của riêng từng phòng từng bỏ sót tải vách ngăn nội bộ — đã sửa, có test hồi quy bảo vệ.
- [x] **Bước 4 — Tách file, đóng gói PWA, đưa lên GitHub.** *(đã xong, đang ở đây)* — Tách `index.html` (từng ~7700 dòng gộp chung) thành 4 file riêng biệt: `index.html` (giao diện) + `src/app-data.js` + `src/app-calc.js` + `src/app-ui.js`. Hoàn thiện bộ khung PWA — phát hiện HTML **đã có sẵn** các đường dẫn tới `manifest.json`, `sw.js`, `icon-192.png` từ trước nhưng 3 file này chưa từng tồn tại (app "nửa vời PWA" từ lâu) — đã tạo đầy đủ. Thêm GitHub Actions để tự động chạy test mỗi khi có thay đổi.

### Ghi chú riêng cho Bước 2

- Phát hiện thêm 1 tính năng "mồ côi" đáng tiếc khi xóa `_projectHtml()`: nút **"Áp T_max & RH tỉnh vào tất cả nhánh ống"** (chọn 1 tỉnh/thành, tự động điền nhiệt độ/độ ẩm môi trường cho toàn bộ nhánh ống gió cùng lúc) — tính năng hợp lý nhưng chưa từng được gắn vào tab nào hiển thị được. Đã xóa cùng code chết vì phạm vi Bước 2 là dọn dẹp, không phải thêm tính năng. **Nếu muốn khôi phục tính năng này, có thể làm ở 1 bước riêng sau này.**
- Việc dọn field trùng tên ở bản ghi lưu trữ (IndexedDB) chưa có test tự động riêng (cần thêm thư viện giả lập IndexedDB) — đã kiểm tra thủ công và xác nhận hoạt động đúng, nhưng đây là 1 khoảng trống trong lưới an toàn nếu muốn làm chặt chẽ hơn sau này.

### Ghi chú riêng cho Bước 4

- Môi trường chạy test (jsdom) không tự tải được file JS tách rời qua `<script src>` — kể cả file cục bộ (giới hạn của môi trường giả lập, KHÔNG phải giới hạn của trình duyệt thật). Đã sửa `tests/helpers/load-app.js` để tự ráp 3 file trong `src/` lại thành 1 khối khi chạy test — không ảnh hưởng gì đến app thật, trình duyệt thật tải 3 file tách rời hoàn toàn bình thường.
- Icon app được vẽ trực tiếp bằng Python/Pillow (không có công cụ chuyển SVG→PNG trong môi trường làm việc) — nếu muốn icon đẹp/chuyên nghiệp hơn, có thể thay `icon.svg`/`icon-192.png`/`icon-512.png` bằng thiết kế riêng sau này, chỉ cần giữ đúng tên file.
- Service Worker dùng cơ chế cache thủ công (không dùng thư viện Workbox) để dễ hiểu/dễ chỉnh sửa cho người không chuyên code — đã ghi chú kỹ trong `sw.js` về việc PHẢI đổi `CACHE_VERSION` mỗi khi cập nhật app.
- `src/app-ui.js` (5054 dòng) vẫn còn khá lớn dù đã tách khỏi phần data/calc, vì đây vốn là 1 module `App.ui` liền mạch trong code gốc — nếu muốn tách sâu hơn nữa (VD tách riêng phần "Xuất báo cáo", "Quản lý dự án"...) thành các file con, có thể làm ở 1 đợt riêng, rủi ro thấp hơn nhờ đã có bộ test bảo vệ.

## Lịch sử sửa lỗi sau khi hoàn thành 4 bước

**Lần cập nhật mới nhất — Tính năng mới: Bảng quạt thông gió / gió thải cục bộ:**

Người dùng phát hiện khoảng trống thiết kế có thật: bảng "Thiết bị lựa chọn" trong báo cáo chỉ lọc theo `Q_coil > 0` (thiết bị làm lạnh), khiến MỌI phòng loại VENT (thông gió thuần — vốn đã có sẵn trong dữ liệu app với ghi chú "Q_coil=0, chỉ chọn quạt" nhưng chưa từng triển khai) và MỌI thiết bị gió thải cục bộ hoàn toàn biến mất khỏi báo cáo, dù chúng vẫn cần 1 thiết bị thật (quạt) để vận hành.

Đã triển khai đầy đủ theo 3 phần đã thống nhất:
1. **`FAN_CATALOG`** — catalog quạt tham khảo (hướng trục, ly tâm, hút mái, hút tường), phân loại theo lưu lượng (m³/h) + cột áp (Pa) thay vì công suất lạnh.
2. **`selectFanAuto()`** — hàm chọn quạt tự động, tìm quạt nhỏ nhất đủ CẢ lưu lượng lẫn cột áp yêu cầu (khác cơ chế `selectEquipAuto` theo công suất lạnh).
3. **Nhóm thiết bị hỗ trợ loại VENT** — dropdown tạo nhóm thiết bị giờ có thêm lựa chọn VENT, phòng thông gió thuần gán được vào nhóm giống AHU/PAU/FCU. Sửa luôn câu chữ gây hiểu lầm cũ ("FCU/VENT không thuộc nhóm nào") thành trung lập, đúng thực tế.
4. **Bảng báo cáo mới "Quạt thông gió / gió thải cục bộ"** — liệt kê riêng mọi phòng VENT và mọi thiết bị gió thải cục bộ, kèm model quạt đề xuất, không còn bị bỏ sót khỏi hồ sơ thiết kế.

**Phát hiện thêm 1 lỗi hồi quy do chính đợt sửa màu chữ báo cáo trước đó gây ra**: script tự động thêm `color:#111` (đen) cho MỌI phần tử thiếu màu — nhưng không phân biệt được 2 header bảng có NỀN TỐI (#1e293b, vốn cần chữ TRẮNG để đọc được) đã bị ghi đè thành chữ ĐEN trên nền tối, biến "trắng trên trắng" (lỗi cũ) thành "đen trên tối" (lỗi mới, cùng bản chất khó đọc). Đã sửa cả 2 header bị ảnh hưởng, thêm test tổng quát kiểm tra mọi header nền tối trong tương lai không bị lỗi tương tự.

9 test hồi quy mới, tổng 83/83 test pass.

**Lần cập nhật trước — Đào sâu tìm nguyên nhân GỐC cho các lỗi "đã sửa nhưng vẫn còn":**

Người dùng phản hồi 4 lỗi đã sửa ở các đợt trước vẫn tái diễn. Rà soát lại kỹ hơn (không chủ quan tin fix cũ), phát hiện: **hầu hết các fix trước chỉ giải quyết MỘT PHẦN nguyên nhân**, không phải toàn bộ gốc rễ:

1. **Nhóm thiết bị (equipGroupId) vẫn thiếu ở nút "+ Thêm nhánh ống" thủ công** — đợt trước chỉ sửa đường IMPORT, bỏ sót đường thêm tay (dùng phổ biến hơn khi làm việc với nhiều phòng). Đã sửa: nhánh mới thêm tay tự kế thừa nhóm thiết bị của nhánh gần nhất.

2. **Nguyên nhân THẬT của lỗi màu chữ báo cáo — người dùng gửi lại file PDF mới, xác nhận lỗi vẫn còn dù đã thêm color tường minh ở đợt trước.** Đào sâu vào code export mới phát hiện: `html2canvas` được gọi **NGAY LẬP TỨC** sau khi set `innerHTML`, không đợi trình duyệt vẽ (paint) xong nội dung dài nhiều bảng — với báo cáo càng dài, phần cuối trang càng dễ bị chụp khi style/layout CHƯA hoàn tất, đúng khớp hiện tượng "màu nhạt dần khi xuống dưới trang" quan sát được. Đây là nguyên nhân **sâu hơn hẳn** so với giả thuyết "thiếu color CSS" ở đợt trước (dù việc thêm color tường minh vẫn đúng, chỉ là chưa đủ). Đã sửa: đợi 2 animation frame + ép reflow + delay dự phòng trước khi gọi html2canvas.

3. **Nguyên nhân THẬT của lỗi cuộn PC** — đợt trước chỉ sửa `#tab-content` thiếu `min-h-0`, đúng nhưng chưa đủ. Đào sâu phát hiện: `#app-root` (tổ tiên xa hơn) dùng `min-height:100vh` (chỉ TỐI THIỂU) thay vì `height:100vh` (CỐ ĐỊNH) — khiến toàn trang có thể phình to hơn viewport theo nội dung, nên `#tab-content` không bao giờ THỰC SỰ bị ép cuộn nội bộ. Đã sửa: ép `height:100vh` cố định ở desktop (giữ nguyên hành vi mobile). Lưu ý kỹ thuật quan trọng: bundle Tailwind trong app là **bản biên dịch sẵn tĩnh** — chỉ chứa class đã dùng lúc build ban đầu, nên viết class Tailwind mới (như `h-screen`) vào HTML sẽ **không có tác dụng gì** nếu không có rule CSS tương ứng — phải viết CSS thủ công.

4. **PWA sidebar mobile** — cải thiện thêm: `#mobile-nav` thiếu `overflow-y:auto`, kết hợp padding-top mới thêm (tránh status bar) + danh sách 9 tab dài có thể khiến các tab cuối bị tràn ra ngoài không truy cập được. Đã thêm overflow-y:auto. *(Lưu ý: chưa có ảnh chụp mới để xác nhận 100% đã hết — nếu vẫn còn sau khi cài lại bản mới, cần gửi ảnh cụ thể để debug tiếp.)*

**Bài học rút ra**: khi người dùng báo "vẫn còn lỗi" dù đã sửa, ưu tiên đào sâu tìm nguyên nhân KHÁC/SÂU HƠN thay vì mặc định cho là do cache cũ — 3/4 lỗi lần này đều có nguyên nhân thật sâu hơn fix trước, không phải do triển khai chưa cập nhật.

5 test hồi quy mới, tổng 74/74 test pass.

**Lần cập nhật trước — Tìm ra và sửa lỗi "chữ trắng trên nền trắng" trong PDF xuất ra:**
- Nhờ người dùng gửi file PDF thật, đã xác định chính xác nguyên nhân bằng cách đo trực tiếp giá trị pixel màu: chữ trong hầu hết các bảng (chi tiết phòng, breakdown tải nhiệt, bảng thiết bị, bảng nhánh ống gió, checklist chẩn đoán) xuất ra màu **#DDDDDD** (trùng với màu viền bảng) thay vì màu đen `#111` như code định nghĩa.
- **Gốc rễ**: các ô dữ liệu trong báo cáo không set màu chữ (`color`) tường minh, chỉ dựa vào kế thừa (`inherit`) từ div bọc ngoài cùng. Trên trình duyệt thường, kế thừa này đúng — nhưng **thư viện html2canvas (dùng để chụp ảnh xuất PDF) có lỗi không tính đúng màu kế thừa qua nhiều lớp DOM lồng nhau**, dẫn đến chữ bị vẽ gần như trắng khi xuất PDF. Đây cũng là lý do bộ test JSDOM trước đó không phát hiện ra — JSDOM tính kế thừa CSS đúng chuẩn, chỉ html2canvas mới có lỗi này.
- **Đã sửa triệt để**: rà soát toàn bộ hàm tạo báo cáo, thêm `color` tường minh vào 110+ phần tử còn thiếu (không phần tử nào còn phụ thuộc kế thừa), sửa luôn 2 trường hợp "màu điều kiện với fallback rỗng" (`color:${cond?'x':''}` — CSS rỗng cũng bị html2canvas bỏ qua giống hệt thiếu hẳn color).
- Viết test hồi quy **tổng quát** (không chỉ kiểm tra từng trường hợp cụ thể) — tự động quét toàn bộ báo cáo, báo lỗi nếu sau này có ai thêm dòng mới quên set màu chữ.
- **Lỗi thứ 2 cùng đợt**: import từ Tab Phụ Tải Nhiệt vào Bảng nhánh ống gió không mang theo nhóm thiết bị (equipGroupId) đã gán sẵn ở phòng — buộc chọn lại thủ công từng nhánh, dễ sai sót khi thao tác nhiều phòng. Đã sửa.
- 5 test hồi quy mới, tổng 69/69 test pass.

**Lần cập nhật trước — Sửa lỗi import nhóm thiết bị + rà soát màu chữ báo cáo:**
- **Import từ Tab Phụ Tải Nhiệt không mang theo nhóm thiết bị**: xác nhận lỗi thật — hàm import tạo nhánh ống gió từ phòng nhưng hoàn toàn quên gán `equipGroupId`, dù phòng đã liên kết sẵn với 1 nhóm thiết bị (AHU/PAU...) qua form phòng. Hậu quả: người dùng phải tự chọn lại thủ công từng nhánh sau khi import — rất dễ sai sót/chọn nhầm khi thao tác nhiều phòng. Đã sửa: nhánh tạo ra giờ tự động mang theo đúng nhóm thiết bị đã gán sẵn ở phòng nguồn. Nhân tiện phát hiện thêm 1 điểm giòn: bảng xem trước import thiếu bảo vệ khi phòng thiếu field `L_return` (dễ crash cả preview) — đã thêm `||0` phòng vệ.
- **Rà soát màu chữ báo cáo theo phản hồi "chữ trắng trên nền trắng"**: kiểm tra toàn diện bằng phương pháp đo tỷ lệ tương phản thực tế (không chỉ nhìn mắt) trên TOÀN BỘ báo cáo — kích hoạt đủ mọi phần (bảng thiết bị, gió thải cục bộ, breakdown tải nhiệt, checklist chẩn đoán, mức tin cậy...) — **không tìm thấy lỗi màu nào trong code hiện tại**. Đã kiểm tra cả phần capture PDF (html2canvas — không dùng class Tailwind dễ vỡ, chỉ toàn màu hex tường minh) và Excel (không có style màu). Khả năng cao đây là hiện tượng từ bản cache cũ trước các lần sửa màu ở các đợt trước — nếu vẫn gặp sau khi cài lại bản mới nhất, cần chụp màn hình cụ thể vị trí lỗi để xác định chính xác.
- 3 test hồi quy mới, tổng 67/67 test pass.

**Lần cập nhật trước — Sửa 2 lỗi test trên PC:**
- **Cuộn chuột "kẹt" ở vùng nội dung chính, phải rê sang sidebar mới cuộn được**: lỗi Flexbox kinh điển — `#tab-content` thiếu `min-height:0` (chỉ có `min-width:0`), khiến `overflow-y:auto` không phát huy tác dụng cuộn nội bộ. Đã thêm `min-h-0`.
- **Nhóm thiết bị (Equipment Group) không liệt kê đúng khi gán vào phòng, lọc AHU vẫn thấy FCU**: xác nhận qua debug thực tế — nút tạo nhóm luôn mặc định `equipType:'AHU'`; nếu đổi TÊN nhóm (vd thành "FCU-Tầng1") nhưng quên đổi luôn ô dropdown loại hệ thống, nhóm vẫn là AHU về bản chất dù tên khác, khiến phòng FCU không tìm thấy nhóm và lọc AHU vẫn thấy tên "FCU..." xuất hiện. Đã sửa: đổi dropdown loại hệ thống tự động đồng bộ lại tên (nếu tên đang ở dạng tự sinh, không đụng vào tên người dùng tự đặt), thêm cảnh báo rõ ràng khi tên và loại thực tế không khớp, sửa lại câu hướng dẫn từng ghi sai "FCU không thuộc nhóm nào" (mâu thuẫn với chính dropdown cho phép chọn FCU).
- **Phát hiện thêm 1 lỗi trong chính hạ tầng test**: 1 regex pattern hợp lệ trong code app (`'-[0-9]+$'`) làm sập bộ test — nguyên nhân do `tests/helpers/load-app.js` dùng `String.replace()` với chuỗi thay thế chứa `$'`, bị JS diễn giải thành ký hiệu thay thế đặc biệt. Đã sửa dùng dạng replacement function, không còn bị ảnh hưởng bởi nội dung code app.
- 6 test hồi quy mới, tổng 64/64 test pass.

**Lần cập nhật trước — Đa ngôn ngữ VI/EN + rà soát UI theo phản hồi cài PWA thực tế:**
- **Rà soát toàn diện theo yêu cầu người dùng** ("check lại 1 lần tổng quát... nhất là logic tính toán") — dùng phương pháp so sánh trực tiếp field-by-field giữa `calcDrawerRoom()` (nút Tính riêng phòng) và `recalc()` (Tính toán tất cả), phát hiện thêm 2 lỗi nghiêm trọng: (1) badge "Trạng thái" luôn mặc định "✓ ĐẠT" khi chỉ tính riêng từng phòng (không hề phản ánh kết quả kiểm tra thật), (2) `flagParams()` dùng 2 bảng ngưỡng validation (`TH.freshAirMin`, `TH.lpd`) tách biệt hoàn toàn khỏi `BUILDING_TYPES` — lệch nghiêm trọng ở nhiều loại phòng (vd hospital_or: ngưỡng cũ 50 L/s/người, giá trị thật theo ASHRAE 170 chỉ 15), khiến phòng dùng ĐÚNG giá trị mặc định vẫn bị báo lỗi giả. Đã xóa bảng trùng lặp, dùng thẳng `BUILDING_TYPES` làm nguồn duy nhất.
- **PWA — phản hồi thực tế khi cài ra màn hình chính**: đưa Tab Dự Án làm mặc định khi mở app; thêm lớp CSS dự phòng `@media (display-mode: standalone)` cho vùng safe-area (phòng khi `env()` không phân giải đúng trên vài thiết bị); rà soát input toàn app — xác nhận không có input nào bị mất.
- **Đa ngôn ngữ VI/EN**: dịch trọn vẹn FAQ (18 câu hỏi), mở rộng từ điển dịch với nhiều thuật ngữ dùng chung, dịch tiêu đề báo cáo PDF. Phát hiện và sửa 1 lỗi thật: nút đổi ngôn ngữ quên gọi `renderNav()` — nội dung tab đổi đúng nhưng sidebar vẫn giữ nhãn cũ, gây giao diện "nửa Việt nửa Anh". **Lưu ý quan trọng: phần lớn nội dung chi tiết của app (form nhập phòng, nội dung báo cáo, các bảng tính...) vẫn chỉ có tiếng Việt** — đây là việc lớn, cần tiếp tục dịch dần theo từng khu vực ở các đợt sau.
- 9 test hồi quy mới, tổng 59/59 test pass.

**Lần cập nhật trước — Nâng cấp giao diện báo cáo theo mẫu Cold Storage Heat Load Calculator:**
- **Khối "Mức độ tin cậy thông số đầu vào"**: tự động liệt kê cụ thể chỗ nào đang dùng số liệu ước lượng/mặc định thay vì nhập tay (khí hậu mượn từ tỉnh lân cận, vách ngăn dùng U/nhiệt độ mặc định, gió thải cục bộ thiếu dữ liệu, ACH chưa điều chỉnh riêng theo dự án...), tính ra mức độ tổng quát (CAO/TRUNG BÌNH/CẦN THẬN TRỌNG) — tận dụng hoàn toàn dữ liệu cảnh báo đã có sẵn, không cần xây hệ thống theo dõi mới.
- **Bảng "Phân tích tải nhiệt theo thành phần"**: tách Q_coil thành các thành phần con (vách, mái, kính/bức xạ, người, đèn, gió tươi, vách ngăn nội bộ) kèm % đóng góp — theo đúng phong cách bảng Q1-Q5 của báo cáo Cold Storage.
- **Phát hiện thêm 1 lỗi nghiêm trọng khi xây bảng breakdown**: nút "Tính" riêng từng phòng **hoàn toàn bỏ sót tải nhiệt qua Mái (Q_roof) và Sàn tiếp đất (Q_floor)** — giống hệt lỗi vách ngăn đã sửa trước đó, chỉ "Tính toán tất cả" mới cộng đúng. Đã sửa, viết 4 test hồi quy bảo vệ.
- Sửa 1 lỗi định dạng nhỏ đi kèm (tổng Q_hiện/Q_ẩn trong bảng báo cáo hiển thị sai do áp dụng `.toFixed()` trước khi chia, làm mất định dạng số thập phân).
- Tổng 44/44 test pass.

**Lần cập nhật trước — Tính năng "Gió thải cục bộ từ thiết bị" + sửa lỗi báo cáo:**
- **Lỗi báo cáo "Tổng gió tươi/gió cấp = 0 m³/h"**: nút "Tính" riêng từng phòng chỉ lưu kết quả vào `r._airflow`, còn báo cáo/xuất Excel lại đọc từ `r._af` — field khác hoàn toàn, chỉ được điền khi bấm "Tính toán tất cả". Đã đồng bộ 2 field, và sửa luôn việc cảnh báo (vd ACH gió tươi không đạt) bị "kẹt" không tới được báo cáo khi chỉ tính riêng từng phòng.
- **Nâng cấp "Chẩn đoán & Kiểm tra"**: từ danh sách chỉ liệt kê lỗi → bảng đầy đủ mọi hạng mục kiểm tra (Đạt hiện ✓ xanh, không đạt hiện chi tiết cụ thể), theo phong cách báo cáo Cold Storage Heat Load Calculator.
- **Tính năng mới — Gió thải cục bộ từ thiết bị**: đề xuất từ thực tế nhà máy chế biến snack (chụp hút khói gas, hút hơi máy hấp/nướng...). Áp dụng cho **mọi loại phòng** (không gò theo mục đích sử dụng cố định), mặc định KHÔNG bật — giống hệt cơ chế checkbox Mái/Sàn đã có. Khi bật: khai báo danh sách thiết bị hút (tên, lưu lượng, số lượng) + chọn 1 trong 2 cách bù: **qua AHU/PAU chính** (xử lý nhiệt, ảnh hưởng Q_coil) hoặc **quạt bù riêng thuần túy** (không xử lý nhiệt, chỉ cân bằng áp suất, tiết kiệm năng lượng). Đã test xác nhận: cùng điều kiện, phương án bù thuần túy cho Q_coil thấp hơn đáng kể so với xử lý nhiệt toàn bộ — đúng lợi ích thực tế của giải pháp này.
- 7 test hồi quy mới, tổng 40/40 test pass.

## Lịch sử sửa lỗi sau khi hoàn thành 4 bước (đợt trước)

**Lần cập nhật (sau khi đưa lên GitHub Pages):** Phát hiện qua thực tế dùng — cùng 1 phòng (Phòng mổ), đổi giữa AHU/PAU cho ra Q_coil chênh lệch bất thường (59kW vs 303kW) dù lưu lượng gió hiển thị giống hệt nhau. Rà lại phát hiện gốc rễ: hàm tính lưu lượng gió cho "mọi loại phòng thường" (bao gồm cả các phòng y tế theo ASHRAE 170 — Phòng mổ, phòng bệnh nhân, cách ly) hoàn toàn không đọc `equipType` — chọn AHU hay PAU đều ra cùng 1 kết quả gió tươi, chỉ có phòng sạch ISO/GMP mới xử lý đúng PAU=100% gió tươi. Đồng thời phát hiện thêm: yêu cầu "4 ACH gió tươi tối thiểu" của Phòng mổ (ASHRAE 170:2021) chỉ nằm trong text mô tả, chưa từng được tính/kiểm tra thật — phòng vẫn hiện "✓ ĐẠT" dù gió tươi thực tế thấp hơn yêu cầu. Đã sửa cả 2, thêm field `achFreshMin` cho 3 loại phòng y tế, và viết 5 test hồi quy bảo vệ (`tests/cases/pau-vs-ahu-hospital.js`).

## Lưu ý quan trọng khi dùng

- Catalog thiết bị (FCU/AHU) trong app là **dữ liệu tổng hợp tham khảo**, không phải catalog thật của hãng nào — không dùng để lên đơn hàng trực tiếp.
- Mọi loại phòng/vật liệu tự thêm qua tab Database chưa qua review kỹ thuật — kỹ sư cần tự kiểm tra lại giá trị đã nhập.
- Kết quả tính toán mang tính tham khảo, kỹ sư chịu trách nhiệm xác nhận trước khi đưa vào hồ sơ thiết kế chính thức.
