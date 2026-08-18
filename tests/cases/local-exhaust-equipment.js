// local-exhaust-equipment.js — Bảo vệ tính năng "Gió thải cục bộ từ thiết bị" (thêm theo
// đề xuất từ thực tế nhà máy chế biến snack: chụp hút khói gas khi đốt, hút hơi từ máy
// hấp/nướng... cần gió tươi bù để tránh xưởng bị áp âm). Áp dụng được cho MỌI loại phòng,
// mặc định KHÔNG bật (giống cơ chế Mái/Sàn), có 2 chế độ bù:
//   'ahu' — gió bù qua hệ thống chính, được xử lý nhiệt, cộng vào Q_fresh và ảnh hưởng Q_coil
//   'raw' — gió bù thuần túy (quạt riêng), KHÔNG qua coil, chỉ cân bằng áp suất

module.exports = function(App, T){
  const { suite, test, assertTrue, assertClose } = T;
  const C = App.calc;
  const climate = { tOut: 35, rhOut: 65, tIn: 26, rhIn: 60, elevationM: 0 };

  function makeRoom(treated){
    return {
      name: 'Xưởng snack', buildingType: 'workshop_light', equipType: 'AHU',
      L: 20, W: 15, H: 5, nPeople: 15, achApplied: 8,
      hasLocalExhaustEquip: true, localExhaustTreated: treated,
      localExhaustRows: [
        { name: 'Chụp hút lò nướng', qPerUnitM3h: 1500, qty: 2 },
        { name: 'Chụp hút máy hấp', qPerUnitM3h: 1000, qty: 3 },
      ],
    };
  }

  suite('Gió thải cục bộ từ thiết bị — mặc định tắt, tính đúng theo chế độ bù', () => {

    test('Phòng KHÔNG tick hasLocalExhaustEquip → Q_localExhaust phải = 0 (mặc định không ảnh hưởng)', () => {
      const room = { name: 'Phòng thường', buildingType: 'office', equipType: 'AHU', L: 10, W: 8, H: 3.2, nPeople: 5 };
      const af = C.calcBuildingTypeAirflow(room, climate);
      assertClose(af.Q_localExhaust||0, 0, 0.01, 'Phòng không tick thì không được có gió thải cục bộ nào được cộng vào');
    });

    test('Tổng lưu lượng gió thải cục bộ phải tính đúng: Σ(qty × qPerUnitM3h)', () => {
      const af = C.calcBuildingTypeAirflow(makeRoom('ahu'), climate);
      assertClose(af.Q_localExhaust, 1500*2 + 1000*3, 0.01, 'Q_localExhaust phải = 3000+3000=6000 m³/h');
    });

    test('Chế độ "ahu": gió bù phải cộng vào Q_fresh (Q_fresh ≥ Q_localExhaust)', () => {
      const af = C.calcBuildingTypeAirflow(makeRoom('ahu'), climate);
      assertTrue(af.Q_fresh >= af.Q_localExhaust, 'Q_fresh phải ≥ Q_localExhaust khi bù qua AHU');
      assertClose(af.Q_makeupRaw||0, 0, 0.01, 'Chế độ ahu thì Q_makeupRaw phải = 0 (không tách riêng)');
    });

    test('Chế độ "raw": gió bù phải tách riêng (Q_makeupRaw), KHÔNG cộng vào Q_fresh', () => {
      const afAhu = C.calcBuildingTypeAirflow(makeRoom('ahu'), climate);
      const afRaw = C.calcBuildingTypeAirflow(makeRoom('raw'), climate);
      assertClose(afRaw.Q_makeupRaw, 6000, 0.01, 'Q_makeupRaw phải = 6000 (toàn bộ gió thải cục bộ)');
      assertTrue(afRaw.Q_fresh < afAhu.Q_fresh,
        'Q_fresh chế độ raw phải NHỎ HƠN chế độ ahu — vì gió bù không đi qua hệ thống chính');
    });

    test('Q_coil chế độ "raw" phải NHỎ HƠN chế độ "ahu" cùng điều kiện (tiết kiệm năng lượng — không xử lý nhiệt toàn bộ gió bù)', () => {
      const psyOut = C.calcPsychro(climate.tOut, climate.rhOut, 0);
      const psyIn = C.calcPsychro(climate.tIn, climate.rhIn, 0);
      function coilFor(treated){
        const af = C.calcBuildingTypeAirflow(makeRoom(treated), climate);
        const common = { uPanel:0.45, aWall:60, dtFactor:1, aGlass:10, shgc:0.6, sc:1, clf:0.7,
          nPeople:15, laborLevel:App.data.peopleHeat[1].level, lpdApplied:15, floorAreaM2:300,
          dfLighting:0.9, tOut:climate.tOut, tIn:climate.tIn, equipType:'AHU' };
        const ev = C.calcEnvelopeLoad({...common, lFreshM3h:af.Q_fresh, dOut:psyOut.dGperKg, dIn:psyIn.dGperKg});
        return C.calcCoil({
          equipType:'AHU', Q_sens_room:ev.Q_sensible, Q_lat_room:ev.Q_latent,
          Q_motor_total:0, Q_parasitic_list:[],
          lSupplyM3h:af.Q_supply, lFreshM3h:af.Q_fresh, lReturnM3h:af.Q_recirculation,
          tOut:climate.tOut, hOut:psyOut.hKJperKg, dOut:psyOut.dGperKg,
          hIn:psyIn.hKJperKg, dIn:psyIn.dGperKg, tIn:climate.tIn,
          tSupplyDesign:14, rhSupplyDesign:90, espPa:400, elevationM:0
        }).qCoilKW;
      }
      assertTrue(coilFor('raw') < coilFor('ahu'),
        'Q_coil chế độ raw (quạt bù riêng) phải thấp hơn ahu (xử lý nhiệt toàn bộ) — đúng lợi ích tiết kiệm năng lượng của phương án bù thuần túy');
    });

    test('Đã tick hasLocalExhaustEquip nhưng CHƯA nhập lưu lượng thiết bị nào → phải có cảnh báo', () => {
      const room = { name: 'Xưởng chưa nhập', buildingType: 'workshop_light', equipType: 'AHU',
        L: 20, W: 15, H: 5, nPeople: 15, hasLocalExhaustEquip: true, localExhaustRows: [{name:'', qPerUnitM3h:0, qty:1}] };
      const af = C.calcBuildingTypeAirflow(room, climate);
      assertTrue(af.warnings.some(w => w.code === 'LOCAL_EXHAUST_EMPTY'),
        'Phải cảnh báo khi tick có gió thải cục bộ nhưng chưa nhập lưu lượng thiết bị nào — tránh âm thầm bỏ qua');
    });

    test('Form phòng: checkbox mặc định KHÔNG tick cho mọi loại phòng (không gò theo mục đích sử dụng)', () => {
      App.state.hlClimate = climate;
      App.state.hlRooms = [{ id:'r1', name:'Bất kỳ phòng nào', buildingType:'cleanroom', equipType:'AHU', L:10, W:8, H:3.2 }];
      App.ui.renderAllTabs();
      App.ui.heatload.openDrawer(0);
      const body = App.__dom.window.document.getElementById('room-drawer-body');
      const chk = body.querySelector('[data-rf="hasLocalExhaustEquip"]');
      assertTrue(!!chk, 'Checkbox phải xuất hiện trên form của MỌI loại phòng, kể cả cleanroom');
      assertTrue(!chk.checked, 'Mặc định phải KHÔNG tick');
    });

  });
};
