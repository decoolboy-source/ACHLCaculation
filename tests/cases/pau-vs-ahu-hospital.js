// pau-vs-ahu-hospital.js — Bảo vệ 3 lỗi thật đã sửa cùng lúc, phát hiện khi so sánh
// AHU/PAU cho cùng 1 phòng mổ (Operating Room):
//
// 1. calcBuildingTypeAirflow() (dùng cho "mọi loại phòng còn lại", bao gồm Phòng mổ,
//    phòng bệnh nhân...) TRƯỚC ĐÂY hoàn toàn không đọc room.equipType — chọn AHU hay
//    PAU cho ra CÙNG 1 Q_tươi/Q_cấp. Chỉ cleanroom (calcCleanroomAirflow) mới xử lý
//    đúng PAU=100% gió tươi. Hậu quả: PAU vẫn hiện Q_tươi nhỏ bên cạnh Q_hồi lớn (sai
//    bản chất PAU — không có gió hồi), VÀ khiến Q_coil bị lệch pha giữa tầng gió/tầng
//    coil, thổi phồng bất thường (5x+ dù cùng điều kiện).
//
// 2. Yêu cầu "ACH gió tươi tối thiểu riêng" theo ASHRAE 170 cho phòng y tế (Phòng mổ:
//    4 ACH, phòng bệnh nhân: 2 ACH) TRƯỚC ĐÂY chỉ nằm trong text mô tả (note), KHÔNG
//    có field nào được đọc để tính/kiểm tra thật — phòng có thể hiện "✓ ĐẠT" dù gió
//    tươi thực tế thấp hơn nhiều so với yêu cầu bắt buộc.

module.exports = function(App, T){
  const { suite, test, assertTrue, assertClose } = T;
  const C = App.calc;
  const climate = { tOut: 35, rhOut: 65, tIn: 18, rhIn: 50, elevationM: 0 };

  function makeOR(equipType, achApplied){
    return { name:'Phòng mổ test', buildingType:'hospital_or', equipType,
      L:10, W:15, H:3.2, nPeople:6, achApplied };
  }

  suite('Phòng mổ (ASHRAE 170) — ACH gió tươi tối thiểu + PAU=100% gió tươi', () => {

    test('PAU phải có Q_fresh = Q_supply (100% gió tươi, đúng định nghĩa PAU — không có gió hồi)', () => {
      const af = C.calcBuildingTypeAirflow(makeOR('PAU', 20), climate);
      assertClose(af.Q_fresh, af.Q_supply, 0.01,
        `PAU phải có Q_fresh (${af.Q_fresh}) = Q_supply (${af.Q_supply}) — nếu khác nhau, bug "PAU vẫn hiện gió tươi nhỏ bên cạnh gió hồi lớn" đã quay lại`);
    });

    test('AHU với cùng điều kiện phải có Q_fresh NHỎ HƠN Q_supply (có gió hồi, không phải 100% OA)', () => {
      const af = C.calcBuildingTypeAirflow(makeOR('AHU', 20), climate);
      assertTrue(af.Q_fresh < af.Q_supply, 'AHU phải có gió hồi (Q_fresh < Q_supply), khác PAU');
    });

    test('Phòng mổ (Phòng mổ Class A/B) phải đạt tối thiểu 4 ACH gió tươi khi ACH tổng đủ lớn', () => {
      const af = C.calcBuildingTypeAirflow(makeOR('AHU', 20), climate);
      assertTrue(af.ACH_fresh_actual >= 4 - 0.01,
        `ACH gió tươi thực tế (${af.ACH_fresh_actual.toFixed(2)}) phải ≥ 4 ACH theo ASHRAE 170:2021 — nếu thấp hơn, bug "ACH gió tươi không được kiểm tra thật" đã quay lại`);
      assertTrue(af.warnings.length === 0, 'Đạt yêu cầu thì không được có cảnh báo ACH_FRESH_MIN');
    });

    test('Nếu ACH tổng đặt THẤP HƠN yêu cầu ACH gió tươi tối thiểu (vd 3 ACH cho phòng cần tối thiểu 4) → phải có cảnh báo rõ ràng', () => {
      const af = C.calcBuildingTypeAirflow(makeOR('AHU', 3), climate);
      assertTrue(af.warnings.some(w => w.code === 'ACH_FRESH_MIN'),
        'Phải có cảnh báo ACH_FRESH_MIN khi ACH tổng đặt thấp hơn yêu cầu ACH gió tươi bắt buộc');
    });

    test('Q_coil của PAU phải LỚN HƠN Q_coil của AHU cùng điều kiện (PAU luôn xử lý gió ngoài trời nhiều hơn — đúng vật lý, không phải bug)', () => {
      const psyOut = C.calcPsychro(climate.tOut, climate.rhOut, 0);
      const psyIn = C.calcPsychro(climate.tIn, climate.rhIn, 0);
      const common = { uPanel:0.45, aWall:40, dtFactor:1, aGlass:8, shgc:0.7, sc:1, clf:0.7,
        nPeople:6, laborLevel:App.data.peopleHeat[1].level, lpdApplied:40, floorAreaM2:150,
        dfLighting:0.9, tOut:climate.tOut, tIn:climate.tIn };

      function coilFor(equipType){
        const af = C.calcBuildingTypeAirflow(makeOR(equipType, 20), climate);
        const ev = C.calcEnvelopeLoad({...common, lFreshM3h:af.Q_fresh, dOut:psyOut.dGperKg, dIn:psyIn.dGperKg, equipType});
        return C.calcCoil({
          equipType, Q_sens_room:ev.Q_sensible, Q_lat_room:ev.Q_latent,
          Q_motor_total:0, Q_parasitic_list:[],
          lSupplyM3h:af.Q_supply, lFreshM3h:af.Q_fresh, lReturnM3h:af.Q_recirculation,
          tOut:climate.tOut, hOut:psyOut.hKJperKg, dOut:psyOut.dGperKg,
          hIn:psyIn.hKJperKg, dIn:psyIn.dGperKg, tIn:climate.tIn,
          tSupplyDesign:14, rhSupplyDesign:90, espPa:400, elevationM:0
        }).qCoilKW;
      }
      const qAHU = coilFor('AHU');
      const qPAU = coilFor('PAU');
      assertTrue(qPAU > qAHU,
        `PAU (${qPAU.toFixed(1)}kW) phải lớn hơn AHU (${qAHU.toFixed(1)}kW) cùng điều kiện — đây là vật lý đúng (PAU xử lý 100% khí ngoài trời), KHÔNG bấm sửa cho bằng nhau`);
    });

  });
};
