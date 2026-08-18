// equip-select-prefer-type.js — Bảo vệ 1 lỗi thật phát hiện khi rà soát lại toàn bộ app:
// selectEquipAuto() nhận tham số preferType ('cassette'|'ducted'|'vertical') nhưng TRƯỚC ĐÂY
// hoàn toàn không ưu tiên đúng loại đó — nó gộp preferType chung vào 1 mảng lọc cùng các loại
// FCU khác (['cassette','ducted','vertical']) rồi chọn model NHỎ NHẤT đủ công suất trên TOÀN
// BỘ các loại gộp lại, không quan tâm loại nào được yêu cầu ưu tiên. Kết quả: chọn
// preferType='cassette' đôi khi vẫn ra model 'vertical' hoặc 'ducted' nếu nó tình cờ có công
// suất nhỏ hơn — sai với ý định thiết kế dù không sai số tính toán.

module.exports = function(App, T){
  const { suite, test, assertEqual, assertTrue } = T;

  suite('selectEquipAuto — phải ưu tiên đúng preferType khi có model đủ công suất hợp lý', () => {

    test('preferType="cassette" phải trả về model loại cassette (không lạc sang ducted/vertical)', () => {
      const r = App.calc.selectEquipAuto({qCoilKW:6.5, equipType:'FCU', designMarginPct:10, preferType:'cassette'});
      assertTrue(!!r, 'Phải chọn được thiết bị');
      assertEqual(r.model.type, 'cassette', `Phải ưu tiên đúng loại cassette — thực tế chọn "${r.model.type}"`);
    });

    test('preferType="ducted" cho CÙNG công suất phải trả về model loại ducted khác với preferType="cassette"', () => {
      const rCassette = App.calc.selectEquipAuto({qCoilKW:6.5, equipType:'FCU', designMarginPct:10, preferType:'cassette'});
      const rDucted   = App.calc.selectEquipAuto({qCoilKW:6.5, equipType:'FCU', designMarginPct:10, preferType:'ducted'});
      assertEqual(rCassette.model.type, 'cassette');
      assertEqual(rDucted.model.type, 'ducted', `Phải ưu tiên đúng loại ducted — thực tế chọn "${rDucted.model.type}"`);
      assertTrue(rCassette.model.id !== rDucted.model.id, 'Cùng công suất nhưng khác preferType phải ra model khác nhau');
    });

    test('preferType không có model nào đủ công suất hợp lý (cần quá nhiều unit) phải rơi xuống loại khác có công suất lớn hơn, không ép số lượng phi thực tế', () => {
      // Catalog cassette lớn nhất chỉ 10kW — yêu cầu 500kW sẽ cần ~55 cassette nếu ép loại này.
      const r = App.calc.selectEquipAuto({qCoilKW:500, equipType:'FCU', designMarginPct:10, preferType:'cassette'});
      assertTrue(!!r, 'Phải vẫn chọn được thiết bị (rơi xuống loại khác)');
      assertTrue(r.model.type !== 'cassette', `Với công suất quá lớn so với dải cassette, phải rơi xuống loại khác (vd vertical) thay vì ép hàng chục cassette — thực tế: loại "${r.model.type}", qty=${r.qty}`);
      assertTrue(r.qty <= 40, `Số lượng unit phải hợp lý hơn đáng kể so với việc ép cassette (qty=${r.qty})`);
    });

  });
};
