// fcu-vs-fcu-oa.js — Bảo vệ 1 lỗi thật đã sửa: trước đây phòng FCU_OA (có thiết bị xử
// lý gió tươi riêng) vẫn bị cộng gió tươi thô thẳng vào tải phòng giống FCU thường,
// gây tính trùng (double-count) tải gió tươi ở cả 2 nơi. Nếu code sau này vô tình sửa
// lại điều kiện equipType==='FCU' thành bắt luôn cả FCU_OA, test này sẽ FAIL ngay.

module.exports = function(App, T){
  const { suite, test, assertClose, assertTrue } = T;
  const C = App.calc;

  const commonRoom = {
    uPanel: 0.45, aWall: 40, dtFactor: 1, aGlass: 8, shgc: 0.6, sc: 1, clf: 0.7,
    nPeople: 5, laborLevel: App.data.peopleHeat[1].level, lpdApplied: 10,
    floorAreaM2: 50, dfLighting: 0.9, tOut: 35, tIn: 24, dOut: 28, dIn: 9,
  };
  const lFresh = 300; // m³/h gió tươi

  suite('FCU vs FCU_OA — tải gió tươi không được tính trùng', () => {

    test('FCU thường: gió tươi thô PHẢI được cộng thẳng vào Q_sensible', () => {
      const ev = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU' });
      assertTrue(ev.Q_fresh_s > 0, 'FCU thường phải có Q_fresh_s > 0 khi có gió tươi');
    });

    test('FCU_OA: gió tươi KHÔNG được cộng vào Q_sensible (đã xử lý riêng ở coil khác)', () => {
      const ev = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU_OA' });
      assertClose(ev.Q_fresh_s, 0, 0.01, 'FCU_OA phải có Q_fresh_s = 0 — nếu khác 0 nghĩa là đang tính trùng gió tươi');
    });

    test('Cùng input, Q_sensible của FCU_OA phải NHỎ HƠN Q_sensible của FCU thường đúng bằng phần gió tươi', () => {
      const evFcu   = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU' });
      const evFcuOa = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU_OA' });
      const diff = evFcu.Q_sensible - evFcuOa.Q_sensible;
      assertClose(diff, evFcu.Q_fresh_s, 1, 'Chênh lệch giữa 2 loại phải đúng bằng phần Q_fresh_s bị loại bỏ ở FCU_OA');
    });

    test('calcCoil FCU_OA: phải trả về CẢ 2 phần coil tách riêng (qCoilFcuKW và qCoilOaKW)', () => {
      const ev = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU_OA' });
      const coil = C.calcCoil({
        equipType: 'FCU_OA', Q_sens_room: ev.Q_sensible, Q_lat_room: ev.Q_latent,
        Q_motor_total: 0, Q_parasitic_list: [], lSupplyM3h: 1000, lFreshM3h: lFresh, lReturnM3h: 700,
        tOut: 35, hOut: 95, dOut: 28, hIn: 48, dIn: 9, tSupplyDesign: 14, rhSupplyDesign: 90,
        espPa: 400, elevationM: 0,
      });
      assertTrue(coil.qCoilFcuKW > 0, 'Phải có qCoilFcuKW (phần FCU xử lý tải phòng)');
      assertTrue(coil.qCoilOaKW > 0, 'Phải có qCoilOaKW (phần thiết bị xử lý gió tươi riêng)');
      assertClose(coil.qCoilKW, coil.qCoilFcuKW + coil.qCoilOaKW, 0.001, 'Tổng phải bằng đúng 2 phần cộng lại');
    });

    test('calcCoil FCU_OA: phần qCoilFcuKW phải NHỎ HƠN NHIỀU so với FCU thường tính chung (vì không gánh gió tươi)', () => {
      const evFcu = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU' });
      const coilFcu = C.calcCoil({
        equipType: 'FCU', Q_sens_room: evFcu.Q_sensible, Q_lat_room: evFcu.Q_latent,
        Q_motor_total: 0, Q_parasitic_list: [], lSupplyM3h: 1000, lFreshM3h: lFresh, lReturnM3h: 700,
        tOut: 35, hOut: 95, dOut: 28, hIn: 48, dIn: 9, tSupplyDesign: 14, rhSupplyDesign: 90,
        espPa: 400, elevationM: 0,
      });
      const evOa = C.calcEnvelopeLoad({ ...commonRoom, lFreshM3h: lFresh, equipType: 'FCU_OA' });
      const coilOa = C.calcCoil({
        equipType: 'FCU_OA', Q_sens_room: evOa.Q_sensible, Q_lat_room: evOa.Q_latent,
        Q_motor_total: 0, Q_parasitic_list: [], lSupplyM3h: 1000, lFreshM3h: lFresh, lReturnM3h: 700,
        tOut: 35, hOut: 95, dOut: 28, hIn: 48, dIn: 9, tSupplyDesign: 14, rhSupplyDesign: 90,
        espPa: 400, elevationM: 0,
      });
      assertTrue(coilOa.qCoilFcuKW < coilFcu.qCoilKW,
        `qCoilFcuKW (${coilOa.qCoilFcuKW.toFixed(2)}) phải nhỏ hơn tổng FCU thường (${coilFcu.qCoilKW.toFixed(2)}) — nếu không, chọn thiết bị FCU sẽ bị oversized sai`);
    });

  });
};
