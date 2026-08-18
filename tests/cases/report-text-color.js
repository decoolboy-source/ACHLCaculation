// report-text-color.js — Bảo vệ 1 lỗi thật đã xác nhận qua file PDF thực tế người dùng gửi:
// hầu hết các ô dữ liệu trong báo cáo (bảng chi tiết phòng, breakdown tải nhiệt, bảng thiết
// bị, bảng nhánh ống gió, checklist chẩn đoán...) KHÔNG set color chữ tường minh — chỉ dựa
// vào kế thừa (inherit) từ div bọc ngoài cùng (color:#111 trên <div> gốc).
//
// Trên trình duyệt thường, kế thừa này hoạt động đúng (chữ đen, rõ ràng). NHƯNG thư viện
// html2canvas (dùng để chụp ảnh xuất PDF) có lỗi không tính đúng màu kế thừa qua nhiều lớp
// DOM lồng nhau — kết quả: khi xuất PDF, chữ bị vẽ ra gần như trắng/rất nhạt trên nền trắng,
// gần như không đọc được. Xác nhận qua đo pixel trực tiếp trên file PDF thật: màu chữ thực
// tế xuất ra là #DDDDDD (đúng bằng màu viền bảng #ddd) thay vì #111 (đen) như code định
// nghĩa — bằng chứng html2canvas "đánh mất" màu kế thừa và fallback về gần trắng.
//
// Bài học quan trọng: bộ test JSDOM (dùng getComputedStyle) không phát hiện được lỗi này vì
// JSDOM tính kế thừa CSS ĐÚNG chuẩn — chỉ có html2canvas mới có bug này. Vì vậy quy tắc bắt
// buộc từ nay: MỌI phần tử có text trong báo cáo PHẢI có color TƯỜNG MINH trong style, không
// được dựa vào kế thừa — test này kiểm tra đúng quy tắc đó một cách tổng quát (không chỉ các
// trường hợp cụ thể đã gặp), để tự động bắt được nếu sau này có ai thêm dòng mới quên set màu.

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;

  suite('Báo cáo — mọi phần tử có style phải có màu chữ tường minh (không dựa vào kế thừa, vì html2canvas không tính đúng)', () => {

    test('Báo cáo đầy đủ (mọi mục: phòng, breakdown, thiết bị, ống gió, checklist) không được có style="..." nào thiếu color:', () => {
      App.state.hlClimate = { tOut: 39.9, rhOut: 79.4, tIn: 24, rhIn: 55, elevationM: 0, provinceId: 'Bình Dương' };
      App.state.hlEquipGroups = [{id:'g1', name:'AHU-1', equipType:'AHU', description:''}];
      App.state.hlRooms = [{
        id:'r1', name:'Test hospital', buildingType:'hospital_or', equipType:'AHU', L:10, W:15, H:3.2, nPeople:6, achApplied:3, groupId:'g1',
        partitionRows:[{name:'Vách', areaM2:15, uWall:0.45, adjSource:'temp', adjTempC:35}],
        roofExposed:true, roofType:'R2', roofArea:150,
        hasLocalExhaustEquip:true, localExhaustTreated:'raw', localExhaustRows:[{name:'Chụp hút', qPerUnitM3h:1000, qty:2}],
      }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      App.state.branches = [{id:'b1', name:'Nhánh 1', qM3h:2000, vMs:6, vType:'mainDuct', shape:'rect', materialId:'galv', insulationId:'glasswool', lengthM:10, ambientTC:32, ambientRH:80, thicknessMm:25, fittingsZeta:0.8, equipGroupId:'g1'}];
      App.ui.calc.recalc();

      const html = App.report.buildPreviewHtml();
      const styleMatches = [...html.matchAll(/style="([^"]*)"/g)];
      const missingColor = styleMatches.filter(m => !m[1].includes('color:'));
      assertTrue(styleMatches.length > 50, 'Báo cáo phải có nội dung đầy đủ (sanity check của chính test — nếu quá ít nghĩa là thiếu section nào đó)');
      assertTrue(missingColor.length === 0,
        `Có ${missingColor.length} phần tử style="..." thiếu color tường minh — sẽ hiện gần như trắng-trên-trắng khi xuất PDF qua html2canvas. Ví dụ: ${missingColor[0]?.[0]}`);
    });

    test('Không được có màu chữ dạng điều kiện với fallback rỗng (color:${cond?"x":""}) — CSS color rỗng cũng bị html2canvas bỏ qua giống như thiếu hẳn color', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const html = App.report.buildPreviewHtml();
      // Tìm mọi cặp color:...;" hoặc color:..." rồi kiểm tra không có chuỗi rỗng ngay sau color:
      const emptyColorPattern = /color:\s*;/;
      assertTrue(!emptyColorPattern.test(html), 'Không được có "color:;" (giá trị rỗng) trong HTML báo cáo — CSS invalid, trình duyệt bỏ qua, gây lỗi y hệt thiếu color');
    });

    test('Không được có header nền tối (#1e293b) nhưng chữ trong <th> lại màu đen (#111) — lỗi hồi quy đã gặp thật khi tự động thêm color hàng loạt trước đó', () => {
      App.state.hlClimate = { tOut: 35, rhOut: 65, tIn: 24, rhIn: 55, elevationM: 0 };
      App.state.hlRooms = [{ id:'r1', name:'Test', buildingType:'office', equipType:'FCU', L:10, W:8, H:3.2, nPeople:5 }];
      App.ui.heatload.openDrawer(0);
      App.ui.heatload.calcDrawerRoom();
      const html = App.report.buildPreviewHtml();
      // Tìm mọi khối <thead><tr style="background:#1e293b...">...</tr></thead>, kiểm tra
      // không có <th> nào bên trong dùng color:#111 (đen, chìm vào nền tối)
      const darkHeaderBlocks = [...html.matchAll(/<thead><tr style="background:#1e293b[^"]*">([\s\S]*?)<\/tr><\/thead>/g)];
      assertTrue(darkHeaderBlocks.length > 0, 'Phải có ít nhất 1 header nền tối trong báo cáo (sanity check của test)');
      darkHeaderBlocks.forEach(block => {
        assertTrue(!block[1].includes('color:#111'),
          `Header nền tối (#1e293b) không được có <th> nào dùng color:#111 (đen) — sẽ gần như vô hình trên nền tối. Nội dung: ${block[1].slice(0,100)}`);
      });
    });

  });
};
