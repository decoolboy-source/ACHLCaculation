// psychrometrics.js — Kiểm tra các công thức tâm lý ẩm gốc (App.calc.calcPsychro,
// calcPatm...). Đây là nền tảng mọi phép tính khác dựa vào — nếu sai ở đây, mọi kết
// quả phía sau đều sai theo mà không ai biết. Giá trị "đúng" dùng để so sánh được
// tính tay theo công thức Magnus + phương trình khí lý tưởng chuẩn ASHRAE, không
// lấy từ chính code app (nếu lấy từ app thì test không có ý nghĩa kiểm tra gì cả).

module.exports = function(App, T){
  const { suite, test, assertClose } = T;
  const C = App.calc;

  suite('Tâm lý ẩm (Psychrometrics)', () => {

    test('Áp suất khí quyển ở mực nước biển = 101.325 kPa', () => {
      assertClose(C.calcPatm(0), 101.325, 0.01);
    });

    test('Áp suất khí quyển giảm theo cao độ (Đà Lạt ~1500m) — công thức khí quyển chuẩn', () => {
      // Barometric formula chuẩn: ở 1500m áp suất còn khoảng 84.6 kPa
      assertClose(C.calcPatm(1500), 84.6, 0.5);
    });

    test('25°C / 60%RH / mực nước biển → dung ẩm ≈ 11.9 g/kg (tính tay theo Magnus)', () => {
      const r = C.calcPsychro(25, 60, 0);
      assertClose(r.dGperKg, 11.89, 0.1, 'Dung ẩm d (g/kg khô)');
    });

    test('25°C / 60%RH / mực nước biển → enthalpy ≈ 55.4 kJ/kg (tính tay)', () => {
      const r = C.calcPsychro(25, 60, 0);
      assertClose(r.hKJperKg, 55.4, 0.5, 'Enthalpy h (kJ/kg khô)');
    });

    test('Điểm sương của 25°C/60%RH phải THẤP HƠN 25°C (định luật vật lý cơ bản)', () => {
      const r = C.calcPsychro(25, 60, 0);
      assertClose(r.dewPointC < 25 ? 1 : 0, 1, 0, 'Dew point phải nhỏ hơn nhiệt độ khô');
    });

    test('35°C/28g·kg (điều kiện ngoài trời VN điển hình) → enthalpy phải LỚN HƠN enthalpy trong phòng 24°C/50%RH', () => {
      const hOut = C.calcEnthalpy(35, C.calcHumidityRatio(35, 65, 101.325));
      const hIn  = C.calcPsychro(24, 50, 0).hKJperKg;
      assertClose(hOut > hIn ? 1 : 0, 1, 0, 'Nhiệt ẩn+hiện ngoài trời phải cao hơn trong phòng ở điều kiện VN điển hình — nếu ngược lại, coil sẽ tính ra âm vô lý');
    });

    test('100% RH thì dung ẩm phải LỚN HƠN 50% RH ở cùng nhiệt độ (định luật cơ bản)', () => {
      const d100 = C.calcHumidityRatio(30, 100, 101.325);
      const d50  = C.calcHumidityRatio(30, 50, 101.325);
      assertClose(d100 > d50 ? 1 : 0, 1, 0);
    });

  });
};
