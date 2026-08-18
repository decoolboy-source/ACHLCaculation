// validation.js — Bảo vệ 1 lỗi thật đã sửa: hàm kiểm tra "thiếu diện tích sàn" trước
// đây đọc field r.floorAreaM2 — 1 field KHÔNG BAO GIỜ được lưu vào phòng (chỉ là tên
// tham số truyền tạm lúc tính), nên MỌI phòng đều bị báo lỗi sai dù đã nhập đủ L/W.

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;
  const C = App.calc;

  suite('Validation — kiểm tra diện tích sàn phải đọc đúng dữ liệu thật', () => {

    test('Phòng chữ nhật có L/W hợp lệ KHÔNG được báo lỗi thiếu diện tích', () => {
      const room = { name: 'Phòng OK', equipType: 'AHU', L: 10, W: 8, roomShape: 'rect' };
      const { flags } = C.runValidation([room], [], [], [], []);
      assertTrue(!flags.some(f => f.code === 'MISS_AREA'),
        'Phòng có L=10, W=8 hợp lệ nhưng vẫn bị báo MISS_AREA — bug đọc sai field đã quay lại');
    });

    test('Phòng hình tuỳ chỉnh (customAreaM2) hợp lệ KHÔNG được báo lỗi thiếu diện tích', () => {
      const room = { name: 'Phòng custom', equipType: 'AHU', roomShape: 'custom', customAreaM2: 45 };
      const { flags } = C.runValidation([room], [], [], [], []);
      assertTrue(!flags.some(f => f.code === 'MISS_AREA'));
    });

    test('Phòng THỰC SỰ chưa nhập L/W VẪN PHẢI báo lỗi thiếu diện tích (không được tắt luôn cảnh báo)', () => {
      const room = { name: 'Phòng trống', equipType: 'AHU' };
      const { flags } = C.runValidation([room], [], [], [], []);
      assertTrue(flags.some(f => f.code === 'MISS_AREA'),
        'Phòng chưa nhập gì cả thì PHẢI bị báo lỗi — nếu test này fail nghĩa là validation đã bị tắt hoàn toàn, còn tệ hơn bug cũ');
    });

  });
};
