// door-leakage-airflow.js — Bảo vệ 1 lỗi thật đã sửa: trước đây, với các loại phòng
// thường (không phải cleanroom), chọn "Bù áp theo rò rỉ khe cửa" rồi tăng số lượng
// cửa KHÔNG hề ảnh hưởng đến lưu lượng gió tươi — vì nhánh tính cho nhóm phòng này
// luôn dùng công thức ACH×thể tích bất kể pressMethod là gì. Test này đảm bảo tăng
// số lượng cửa phải làm tăng lưu lượng bù áp tương ứng.

module.exports = function(App, T){
  const { suite, test, assertTrue } = T;
  const C = App.calc;
  const climate = { tOut: 35, dOut: 28, tIn: 24, dIn: 9 };

  function makeRoom(doorQty){
    return {
      name: 'Test Room', equipType: 'AHU', buildingType: 'office',
      L: 10, W: 8, H: 3.2, nPeople: 5,
      pressMethod: 'door', deltaPPa: 5,
      doorRows: [{ doorCode: 'D900x2100-STD', qty: doorQty }],
    };
  }

  suite('Bù áp theo rò rỉ khe cửa — số lượng cửa phải ảnh hưởng đến gió tươi', () => {

    test('Phòng thường (office) — tăng số lượng cửa từ 1 lên 5 PHẢI làm tăng gió tươi', () => {
      const af1 = C.calcBuildingTypeAirflow(makeRoom(1), climate);
      const af5 = C.calcBuildingTypeAirflow(makeRoom(5), climate);
      assertTrue(af5.Q_fresh > af1.Q_fresh,
        `Q_fresh với 5 cửa (${af5.Q_fresh?.toFixed(0)}) phải LỚN HƠN với 1 cửa (${af1.Q_fresh?.toFixed(0)}) — nếu bằng nhau, bug rò rỉ cửa đã quay lại`);
    });

    test('Phòng thường — đổi pressMethod sang "ach" thì số lượng cửa không còn ảnh hưởng (đúng thiết kế)', () => {
      const r1 = { ...makeRoom(1), pressMethod: 'ach', pressACH: 1 };
      const r5 = { ...makeRoom(5), pressMethod: 'ach', pressACH: 1 };
      const af1 = C.calcBuildingTypeAirflow(r1, climate);
      const af5 = C.calcBuildingTypeAirflow(r5, climate);
      assertTrue(Math.abs(af1.Q_fresh - af5.Q_fresh) < 0.01,
        'Khi pressMethod=ach, số lượng cửa không được ảnh hưởng đến kết quả (kỳ vọng đúng, không phải bug)');
    });

  });
};
