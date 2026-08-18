// app-data.js — Dữ liệu tra cứu kỹ thuật (App.data) + lớp lưu trữ IndexedDB (App.db)
// Phần 1/3 của MultiHVAC Calculator — PHẢI load TRƯỚC app-calc.js và app-ui.js
// (2 file sau mở rộng thêm vào window.AppMultiHVAC do file này tạo ra).
/* ============================================================
   MULTIHVAC CALCULATOR — window.AppMultiHVAC
   Namespace riêng, tương thích Hub Shell Launcher
   ============================================================ */
(function(){
  const App = {
    state: {
      activeTab: 'project',
      activeProjectId: null,
      lang: 'vi',
      unit: 'SI',
      inputs: {},
      results: {},
      branches: [],
      elecDevices: [],
      logs: [],
      settings: { apiKey: '' },
      // ── Multi-room heat load (tích hợp vào project, lưu qua autoSave) ──
      hlRooms:    [],       // phòng AHU/PAU/FCU/VENT — kết quả tính stored inline
      hlMotors:   [],       // motor heat gain
      hlClimate:  null,     // {tOut,rhOut,tIn,rhIn,elevationM}
      hlCalcMode: 'Peak',    // 'Peak' | 'Energy'
      hlParasitic: [],       // tải ký sinh (IQF/mạ băng/đá vảy/Rotor)
      hlEquipGroups: []      // [{id, name, equipType:'AHU'|'PAU', description}]
    },
    data: {},
    db: {},
    calc: {},
    ui: {},
    cmd: {},
    kbd: {},
    admin: {},
    ai: {},
    report: {}
  };

  // ============== DATA — Bảng tra cứu kỹ thuật ==============
  App.data = {
    // ACH theo ISO 14644-1. Class 1-4: dòng đơn hướng, ACH chỉ mang tính tham khảo quy đổi,
    // KHÔNG dùng làm tiêu chí thiết kế chính (thiết kế theo vận tốc mặt cấp gió 0.2-0.5 m/s).
    achISO: [
      {cls:'ISO 1', achMin:null, achMax:null, mode:'unidirectional', note:'Thiết kế theo vận tốc đơn hướng, không theo ACH'},
      {cls:'ISO 2', achMin:null, achMax:null, mode:'unidirectional', note:'Thiết kế theo vận tốc đơn hướng, không theo ACH'},
      {cls:'ISO 3', achMin:360, achMax:540, mode:'ach', note:'Tương đương vận tốc đơn hướng quy đổi'},
      {cls:'ISO 4', achMin:300, achMax:540, mode:'ach', note:''},
      {cls:'ISO 5', achMin:240, achMax:480, mode:'ach', note:'Tương đương GMP Grade A/B vận hành'},
      {cls:'ISO 6', achMin:150, achMax:240, mode:'ach', note:''},
      {cls:'ISO 7', achMin:30, achMax:60, mode:'ach', note:'Tương đương GMP Grade C'},
      {cls:'ISO 8', achMin:10, achMax:25, mode:'ach', note:'Tương đương GMP Grade D'},
      {cls:'ISO 9', achMin:5, achMax:10, mode:'ach', note:'Phòng đệm / khu vực phụ trợ'}
    ],
    // GMP EU Annex 1. Grade A là dòng đơn hướng (unidirectional) — không thiết kế theo ACH.
    achGMP: [
      {cls:'Grade A', achMin:null, achMax:null, mode:'unidirectional', velMin:0.36, velMax:0.54, note:'Vận tốc đơn hướng tại mặt làm việc (theo WHO TRS 961 / Annex 1 EU)'},
      {cls:'Grade B', achMin:20, achMax:40, mode:'ach', note:'Trạng thái vận hành (operational)'},
      {cls:'Grade C', achMin:20, achMax:40, mode:'ach', note:''},
      {cls:'Grade D', achMin:5, achMax:20, mode:'ach', note:''}
    ],
    // Vận tốc khuyến nghị — tách rõ 3 nhóm, KHÔNG gộp chung
    velocity: {
      mainDuct:   {min:5, max:9,   note:'Ống chính — SMACNA/ASHRAE; phòng sạch nên lấy dải thấp (5-7 m/s) để giảm ồn'},
      branchDuct: {min:2.5, max:4, note:'Ống nhánh trước hộp gió/HEPA box — giảm ồn truyền vào phòng'},
      hepaFace:   {min:0.30, max:0.45, note:'Vận tốc mặt màng lọc HEPA (Face velocity) — Fed-Std-209E / ISO 14644-4'},
      unidirCleanroom: {min:0.36, max:0.54, note:'Vận tốc đơn hướng Grade A / ISO 4-5 tại mặt làm việc'}
    },
    // ASHRAE TC9.9 (2021) — dải nhiệt độ/độ ẩm cho phép theo Class, tham khảo, cần kiểm tra giới hạn thiết bị thực tế
    dcClasses: [
      {cls:'A1', tAllowMin:15, tAllowMax:32, tRecMin:18, tRecMax:27, rhAllowMin:8, rhAllowMax:80, dpMax:17},
      {cls:'A2', tAllowMin:10, tAllowMax:35, tRecMin:18, tRecMax:27, rhAllowMin:8, rhAllowMax:80, dpMax:21},
      {cls:'A3', tAllowMin:5,  tAllowMax:40, tRecMin:18, tRecMax:27, rhAllowMin:8, rhAllowMax:85, dpMax:24},
      {cls:'A4', tAllowMin:5,  tAllowMax:45, tRecMin:18, tRecMax:27, rhAllowMin:8, rhAllowMax:90, dpMax:24}
    ],
    // Vật liệu ống gió — độ nhám tuyệt đối ε (mm) dùng cho tính ma sát Darcy-Weisbach + cấp rò khí SMACNA
    ductMaterials: [
      {id:'galv', name:'Tôn tráng kẽm (Galvanized Steel)', roughnessMm:0.09, leakageClass:'B', note:'Phổ biến, kinh tế'},
      {id:'ss',   name:'Inox (Stainless Steel)', roughnessMm:0.045, leakageClass:'A', note:'Phòng sạch dược/thực phẩm, dễ vệ sinh'},
      {id:'alu',  name:'Nhôm (Aluminum)', roughnessMm:0.05, leakageClass:'B', note:'Nhẹ, dùng ống mềm/nối'},
      {id:'pir',  name:'Tấm PIR cách nhiệt sẵn (Pre-insulated Panel)', roughnessMm:0.20, leakageClass:'C', note:'Đã tích hợp cách nhiệt, không cần lớp ngoài'}
    ],
    // Vật liệu cách nhiệt — hệ số dẫn nhiệt λ (W/m.K)
    insulationMaterials: [
      {id:'glasswool', name:'Bông sợi khoáng (Glasswool)', lambda:0.038, maxTempC:250},
      {id:'pefoam',     name:'Foam PE (Polyethylene)', lambda:0.040, maxTempC:90},
      {id:'pufoam',     name:'Foam PU/PIR (Polyurethane)', lambda:0.024, maxTempC:110},
      {id:'none',       name:'Không cách nhiệt', lambda:null, maxTempC:null}
    ],
    // Cấp lọc — tổn thất áp suất tham khảo (Pa), trạng thái sạch/bẩn (cuối đời lọc)
    filterStages: [
      {id:'pre_g4',  name:'Lọc sơ cấp G4', dpCleanPa:50,  dpDirtyPa:150, note:'Thay khi ΔP đạt dpDirty'},
      {id:'med_f7',  name:'Lọc trung cấp F7', dpCleanPa:80,  dpDirtyPa:200, note:''},
      {id:'med_f8',  name:'Lọc trung cấp F8', dpCleanPa:100, dpDirtyPa:250, note:''},
      {id:'hepa_h13',name:'HEPA H13', dpCleanPa:150, dpDirtyPa:400, note:'η ≥ 99.95% theo MPPS'},
      {id:'hepa_h14',name:'HEPA H14', dpCleanPa:200, dpDirtyPa:500, note:'η ≥ 99.995% theo MPPS'}
    ],
    // Hệ số tổn thất cục bộ ζ (zeta) cho phụ kiện đường ống — tham khảo SMACNA/ASHRAE Fundamentals Ch.21
    // Hệ số ζ phụ kiện ống gió — nguồn: SMACNA HVAC Duct Design 2006; ASHRAE HOF 2021 Ch.21
    // Giá trị trung bình cho ống chữ nhật. ζ cụ thể phụ thuộc W/H và R/W — tra đồ thị SMACNA để chính xác.
    fittingLoss: [
      // ── Co, cút ──
      {cat:'Cút/Co', id:'elbow90_smooth', name:'Co 90° tròn R/D=1.5 (smooth)',      zeta:0.17, note:'SMACNA Fig.2-9; ống tròn'},
      {cat:'Cút/Co', id:'elbow90_r1',     name:'Co 90° chữ nhật R/W=1.0',           zeta:0.24, note:'SMACNA Fig.2-14 W/H=1'},
      {cat:'Cút/Co', id:'elbow90_sharp',  name:'Co 90° R/D=1.0 (ngắn)',             zeta:0.33, note:'SMACNA Fig.2-9'},
      {cat:'Cút/Co', id:'elbow90_miter',  name:'Co 90° miter (không có cánh)',       zeta:1.20, note:'SMACNA Fig.2-7; hạn chế dùng'},
      {cat:'Cút/Co', id:'elbow90_vanes',  name:'Co 90° miter + cánh hướng dòng',    zeta:0.25, note:'SMACNA Fig.2-8; +vanes'},
      {cat:'Cút/Co', id:'elbow45',        name:'Co 45°',                             zeta:0.10, note:'ASHRAE HOF 2021 Ch.21'},
      {cat:'Cút/Co', id:'offset',         name:'Offset (S-bend)',                    zeta:0.40, note:'Approx 2×45° + straight'},
      // ── Tê phân nhánh ──
      {cat:'Tê/Phân nhánh', id:'tee_main',   name:'Tê — dòng thẳng (main)',        zeta:0.30, note:'SMACNA; dòng qua thẳng'},
      {cat:'Tê/Phân nhánh', id:'tee_branch', name:'Tê — rẽ nhánh (branch)',        zeta:0.75, note:'SMACNA Fig.5-15; rẽ 90°'},
      {cat:'Tê/Phân nhánh', id:'tee_45',     name:'Tê — rẽ 45° (branch at 45°)',   zeta:0.45, note:'SMACNA; nhánh 45°'},
      {cat:'Tê/Phân nhánh', id:'wye',        name:'Wye (Chạc 3 đối xứng)',          zeta:0.20, note:'SMACNA; each branch'},
      // ── Côn thu/mở ──
      {cat:'Côn', id:'reducer_conc', name:'Côn thu đồng tâm (Concentric reducer)', zeta:0.05, note:'ASHRAE HOF 2021; θ<30°'},
      {cat:'Côn', id:'expander_5',   name:'Côn mở 5° (gradual expansion)',          zeta:0.07, note:'ASHRAE HOF; ideal'},
      {cat:'Côn', id:'expander_15',  name:'Côn mở 15°',                             zeta:0.18, note:'ASHRAE HOF'},
      {cat:'Côn', id:'expander_30',  name:'Côn mở đột ngột >30°',                  zeta:0.50, note:'ASHRAE HOF; avoid'},
      {cat:'Côn', id:'transition',   name:'Thu/mở chữ nhật→tròn (Transition)',     zeta:0.08, note:'SMACNA'},
      // ── Van, thiết bị ──
      {cat:'Van/Thiết bị', id:'damper_open',   name:'Van (Damper) mở hoàn toàn',  zeta:0.20, note:'Butterfly; fully open'},
      {cat:'Van/Thiết bị', id:'damper_45',     name:'Van (Damper) mở 45°',        zeta:1.00, note:'ASHRAE HOF'},
      {cat:'Van/Thiết bị', id:'vav_box',       name:'Hộp VAV (fully open)',        zeta:2.00, note:'Typical; varies by mfr'},
      {cat:'Van/Thiết bị', id:'flex_duct',     name:'Ống mềm gợn sóng 1m',        zeta:0.20, note:'Per metre; flexible duct'},
      // ── Cửa vào / ra ──
      {cat:'Cửa vào/ra', id:'entry_loss',   name:'Cửa vào từ không gian thoáng',  zeta:0.50, note:'Square-edged inlet'},
      {cat:'Cửa vào/ra', id:'entry_bell',   name:'Cửa vào bell-mouth',             zeta:0.04, note:'Ideal inlet; min loss'},
      {cat:'Cửa vào/ra', id:'grille_supply',name:'Miệng cấp gió (supply grille)',  zeta:2.00, note:'Typical; velocity at neck'},
      {cat:'Cửa vào/ra', id:'grille_return',name:'Miệng hồi gió (return grille)',  zeta:1.00, note:'Typical; low velocity'},
      {cat:'Cửa vào/ra', id:'diffuser',     name:'Miệng khuếch tán (diffuser)',    zeta:2.50, note:'Ceiling diffuser'},
    ],

    // SMACNA velocity guidelines by application type
    // Nguồn: SMACNA HVAC Duct Design 2006 Table 2-1; ASHRAE Applications 2023
    VELOCITY_BY_APP: {
      office:       {supply:{min:3,rec:5.5,max:8},  return:{min:2.5,rec:4.5,max:6},   note:'Low noise priority'},
      hotel_room:   {supply:{min:2.5,rec:4,max:6},  return:{min:2,rec:3.5,max:5},     note:'Very quiet spaces'},
      auditorium:   {supply:{min:2,rec:3.5,max:5},  return:{min:2,rec:3,max:4.5},     note:'Critical NC<25'},
      hospital_or:  {supply:{min:2.5,rec:3.5,max:5},return:{min:2.5,rec:3,max:4.5},  note:'ASHRAE 170; sterile'},
      cleanroom:    {supply:{min:1.5,rec:2.5,max:4}, return:{min:1.5,rec:2,max:3},    note:'ISO 14644; low noise+velocity'},
      datacenter:   {supply:{min:3,rec:6,max:10},   return:{min:3,rec:5,max:8},       note:'High flow, noise less critical'},
      industrial:   {supply:{min:4,rec:7.5,max:12}, return:{min:3,rec:6,max:10},      note:'SMACNA industrial standard'},
      restaurant:   {supply:{min:2.5,rec:4.5,max:7},return:{min:2.5,rec:4,max:6},    note:'Kitchen exhaust separate'},
      main_duct:    {supply:{min:5,rec:7,max:9},    return:{min:4,rec:6,max:8},       note:'Main distribution duct'},
    },

    // DC Rack profiles — IT density điển hình theo ASHRAE TC9.9 2021
    DC_RACK_PROFILES: [
      {id:'small_dc',  name:'Phòng máy chủ nhỏ (<10 rack)',  itKWPerRack:2.0, pue:1.8, airflowPerKW:185, note:'Edge/office server room'},
      {id:'colo_std',  name:'Colocation tiêu chuẩn',          itKWPerRack:4.0, pue:1.5, airflowPerKW:175, note:'ASHRAE TC9.9 Class A1'},
      {id:'enterprise',name:'Enterprise DC (mixed load)',      itKWPerRack:6.0, pue:1.4, airflowPerKW:170, note:'Class A1-A2; raised floor'},
      {id:'hpc',       name:'HPC / GPU Cluster',              itKWPerRack:15.0,pue:1.3, airflowPerKW:165, note:'Class A3-A4; hot aisle containment'},
      {id:'hyperscale',name:'Hyperscale / Cloud DC',          itKWPerRack:25.0,pue:1.2, airflowPerKW:160, note:'Liquid cooling hybrid'},
      {id:'edge_5g',   name:'Edge DC / 5G MEC',               itKWPerRack:8.0, pue:1.6, airflowPerKW:180, note:'Compact; harsh environment'},
    ],

    // ── Catalog thiết bị điện sinh nhiệt (phòng điện/control room) ──────────────
    ELEC_DEVICE_CATALOG: [
      // id, name, type, η(%), heatFactor (tỷ lệ nhiệt tản = 1-η), unit
      {id:'vfd_low',   name:'Biến tần VFD (≤30kW)',          type:'VFD',         eta:0.96, heatFactor:0.04, unit:'bộ', ratedKWDefault:15,  note:'IEC 60034-30-1 IE3'},
      {id:'vfd_med',   name:'Biến tần VFD (30-200kW)',        type:'VFD',         eta:0.97, heatFactor:0.03, unit:'bộ', ratedKWDefault:55,  note:'η≈97%'},
      {id:'vfd_high',  name:'Biến tần VFD (>200kW)',          type:'VFD',         eta:0.98, heatFactor:0.02, unit:'bộ', ratedKWDefault:280, note:'η≈98%'},
      {id:'mcc',       name:'Tủ MCC/MDB (thanh cái, CB)',     type:'Switchgear',  eta:0.99, heatFactor:0.01, unit:'tủ', ratedKWDefault:500, note:'I²R busbar + CB'},
      {id:'acb_draw',  name:'ACB/MCCB drawout',               type:'Switchgear',  eta:0.995,heatFactor:0.005,unit:'cái', ratedKWDefault:630, note:'0.5W/A típ'},
      {id:'trafo_dry',  name:'Máy biến áp khô (dry-type)',     type:'Transformer', eta:0.985,heatFactor:0.015,unit:'cái', ratedKWDefault:1000,note:'TCVN 6009; IEC 60076-11'},
      {id:'trafo_oil',  name:'Máy biến áp dầu (oil-type)',     type:'Transformer', eta:0.990,heatFactor:0.010,unit:'cái', ratedKWDefault:1600,note:'IEC 60076-1'},
      {id:'ups_online', name:'UPS Online (double conversion)',  type:'UPS',         eta:0.94, heatFactor:0.06, unit:'bộ', ratedKWDefault:30,  note:'η=92-96%'},
      {id:'ups_delta',  name:'UPS Delta conversion',           type:'UPS',         eta:0.97, heatFactor:0.03, unit:'bộ', ratedKWDefault:30,  note:'η=95-98%'},
      {id:'plc_panel',  name:'Tủ PLC/DCS/SCADA',              type:'Control',     eta:1,    heatFactor:1,    unit:'tủ', ratedKWDefault:0.5, note:'W tản cố định ~300-600W/tủ'},
      {id:'hmi_pc',     name:'Màn hình HMI / PC công nghiệp',  type:'Control',     eta:1,    heatFactor:1,    unit:'cái', ratedKWDefault:0.15,note:'~100-200W/máy'},
      {id:'cable_tray', name:'Cáp động lực (I²R tổn hao)',     type:'Cable',       eta:1,    heatFactor:1,    unit:'kW', ratedKWDefault:1,   note:'Nhập trực tiếp W tản'},
      {id:'servo',      name:'Servo Drive / Soft Starter',      type:'VFD',         eta:0.95, heatFactor:0.05, unit:'bộ', ratedKWDefault:7.5, note:'η≈95%'},
      {id:'charger',    name:'Bộ sạc acqui / Rectifier',       type:'UPS',         eta:0.92, heatFactor:0.08, unit:'bộ', ratedKWDefault:5,   note:'η=90-95%'},
      {id:'custom',     name:'Thiết bị khác (nhập tổng nhiệt)','type':'Custom',   eta:1,    heatFactor:1,    unit:'kW', ratedKWDefault:1,   note:'Nhập trực tiếp kW tản'},
    ],

    
    // ACH tham khảo cho thông gió nhà xưởng công nghiệp thông thường (thông gió tổng thể —
    // general exchange ventilation). Nguồn: thông lệ thiết kế thông gió công nghiệp phổ biến tại VN,
    // tham chiếu ASHRAE Applications Ch. "Industrial Local Exhaust" và TCVN 5687:2010 — giá trị tổng quát,
    // cần hiệu chỉnh theo đặc thù công nghệ thực tế của xưởng.
    achWorkshop: [
      {type:'Nhà kho, lưu trữ thông thường', achMin:2, achMax:4},
      {type:'Nhà xưởng sản xuất/lắp ráp thông thường', achMin:4, achMax:10},
      {type:'Xưởng gia công cơ khí (phát sinh nhiệt/bụi nhẹ)', achMin:10, achMax:20},
      {type:'Xưởng sơn, dung môi, hoá chất (cần pha loãng nồng độ hơi)', achMin:15, achMax:30},
      {type:'Xưởng hàn, nhiệt luyện, lò nung', achMin:20, achMax:40},
      {type:'Nhà xưởng thực phẩm (yêu cầu vệ sinh, kiểm soát côn trùng)', achMin:10, achMax:15}
    ],
    // Kích thước cửa tham khảo theo thực hành xây dựng công nghiệp VN (mô-đun cửa phổ biến,
    // tham chiếu TCVN 4319:2012 — Nhà và công trình công cộng, TCVN 4601 và thông lệ thiết kế nhà xưởng).
    // Đây là kích thước phổ biến để ước tính rò rỉ khí qua khe cửa — không thay thế bản vẽ kiến trúc thực tế.
    doorStandardSizes: [
      {id:'single', name:'Cửa đơn 900×2100mm', wMm:900, hMm:2100},
      {id:'single_wide', name:'Cửa đơn rộng 1000×2100mm', wMm:1000, hMm:2100},
      {id:'double', name:'Cửa đôi 1500×2100mm', wMm:1500, hMm:2100},
      {id:'double_wide', name:'Cửa đôi rộng 1800×2100mm', wMm:1800, hMm:2100},
      {id:'industrial', name:'Cửa công nghiệp 2400×2400mm', wMm:2400, hMm:2400},
      {id:'rolling_m', name:'Cửa cuốn trung 3000×3000mm', wMm:3000, hMm:3000},
      {id:'rolling_l', name:'Cửa cuốn lớn/dock 4000×4000mm', wMm:4000, hMm:4000}
    ],
    // Hướng dẫn NC sơ bộ theo vận tốc tại miệng gió/cút — quy tắc kinh nghiệm, cần kiểm tra theo catalog thiết bị
    ncGuideline: [
      {vMax:2.5, ncRange:'< NC 25'},
      {vMax:4.0, ncRange:'NC 25–35'},
      {vMax:6.0, ncRange:'NC 35–45'},
      {vMax:Infinity, ncRange:'> NC 45 — cần xử lý giảm ồn'}
    ],
    // Thiết bị điện — GIÁ TRỊ THAM KHẢO chung (ASHRAE/datasheet phổ biến), KHÔNG phải số liệu đo thực tế.
    // Có thể chỉnh sửa trực tiếp trong tab Quản Lý & Admin hoặc Import .csv/.xlsx số liệu thật.
    elecDeviceRef: [
      {id:'cable',     name:'Cáp dẫn điện', mode:'I2R',  rOhm:0.0008,  note:'R tham khảo /pha, cần theo tiết diện & chiều dài thực tế'},
      {id:'busbar',    name:'Busbar/Busway', mode:'I2R',  rOhm:0.0003,  note:'R tham khảo /pha /mét'},
      {id:'acb',       name:'ACB (Air Circuit Breaker)', mode:'I2R', rOhm:0.00015, note:''},
      {id:'mccb',      name:'MCCB', mode:'I2R', rOhm:0.0002, note:''},
      {id:'mcb',       name:'MCB', mode:'I2R', rOhm:0.0005, note:''},
      {id:'contactor', name:'Contactor', mode:'I2R', rOhm:0.0004, note:''},
      {id:'relay',     name:'Relay', mode:'I2R', rOhm:0.0010, note:''},
      {id:'vfd',       name:'Biến tần (Inverter/VFD)', mode:'EFF', eta:0.97, note:'η định mức, hiệu chỉnh theo % tải nếu có'},
      {id:'softstart', name:'Soft Starter', mode:'EFF', eta:0.98, note:''}
    ],
    // Dữ liệu khí hậu mẫu — CHƯA ĐẦY ĐỦ 63 tỉnh. Vui lòng Import .csv/.json đầy đủ theo QCVN 02:2022/BXD
    // qua tab Quản Lý & Admin. Đây chỉ là tập mẫu minh hoạ cấu trúc dữ liệu.
    // Dữ liệu khí hậu 63 tỉnh thành — trích xuất từ QCVN 02:2022/BXD, Phụ lục A (Bảng A.2 Tt TB năm,
    // A.5 Tv cao nhất tuyệt đối năm, A.6 Tn thấp nhất tuyệt đối năm, A.10 RH TB năm).
    // Các tỉnh không có trạm khí tượng riêng trong QCVN (Bắc Ninh, Ninh Thuận, Vĩnh Long, TP.HCM,
    // Đồng Nai, Bình Dương, Hậu Giang) mượn số liệu trạm lân cận — đã đánh dấu rõ field borrowedFrom.
    climateSample: [
      {province:'An Giang', station:'Châu Đốc', tv:38.6, tn:16.8, tt:27.4, rh:80.7},
      {province:'Bà Rịa - Vũng Tàu', station:'Vũng Tàu', tv:36.7, tn:17.0, tt:27.1, rh:80.3},
      {province:'Bình Dương', station:'Tây Ninh', tv:39.9, tn:13.9, tt:27.2, rh:79.4, borrowedFrom:'Tây Ninh'},
      {province:'Bình Phước', station:'Phước Long', tv:38.5, tn:13.0, tt:25.9, rh:79.8},
      {province:'Bình Thuận', station:'Phan Thiết', tv:38.7, tn:15.4, tt:26.9, rh:79.7},
      {province:'Bình Định', station:'Quy Nhơn', tv:40.7, tn:15.5, tt:27.1, rh:79.0},
      {province:'Bạc Liêu', station:'Bạc Liêu', tv:36.7, tn:13.1, tt:26.9, rh:84.1},
      {province:'Bắc Giang', station:'Bắc Giang', tv:40.8, tn:2.8, tt:23.6, rh:81.7},
      {province:'Bắc Kạn', station:'Bắc Kạn', tv:40.5, tn:-1.0, tt:22.4, rh:83.0},
      {province:'Bắc Ninh', station:'Hà Nội', tv:41.8, tn:5.0, tt:23.9, rh:80.7, borrowedFrom:'Hà Nội'},
      {province:'Bến Tre', station:'Ba Tri', tv:38.7, tn:17.2, tt:27.0, rh:83.6},
      {province:'Cao Bằng', station:'Cao Bằng', tv:40.4, tn:-1.3, tt:21.7, rh:82.1},
      {province:'Cà Mau', station:'Cà Mau', tv:38.2, tn:15.3, tt:27.1, rh:83.0},
      {province:'Cần Thơ', station:'Cần Thơ', tv:40.0, tn:14.8, tt:26.9, rh:83.4},
      {province:'Gia Lai', station:'Pleiku', tv:36.2, tn:5.6, tt:21.9, rh:82.5},
      {province:'Hoà Bình', station:'Hoà Bình', tv:41.8, tn:1.9, tt:23.6, rh:83.4},
      {province:'Hà Giang', station:'Hà Giang', tv:40.7, tn:1.5, tt:22.9, rh:83.8},
      {province:'Hà Nam', station:'Hà Nam', tv:41.0, tn:5.2, tt:23.6, rh:84.5},
      {province:'Hà Nội', station:'Hà Nội', tv:41.8, tn:5.0, tt:23.9, rh:80.7},
      {province:'Hà Tĩnh', station:'Hà Tĩnh', tv:40.7, tn:5.6, tt:24.2, rh:84.4},
      {province:'Hưng Yên', station:'Hưng Yên', tv:40.5, tn:4.8, tt:23.5, rh:85.2},
      {province:'Hải Dương', station:'Hải Dương', tv:40.2, tn:3.2, tt:23.6, rh:84.3},
      {province:'Hải Phòng', station:'Phù Liễn', tv:39.5, tn:4.5, tt:23.2, rh:86.0},
      {province:'Hậu Giang', station:'Cần Thơ', tv:40.0, tn:14.8, tt:26.9, rh:83.4, borrowedFrom:'Cần Thơ'},
      {province:'Khánh Hoà', station:'Nha Trang', tv:37.9, tn:15.4, tt:26.8, rh:79.3},
      {province:'Kiên Giang', station:'Rạch Giá', tv:37.9, tn:14.8, tt:27.5, rh:81.5},
      {province:'Kon Tum', station:'Kon Tum', tv:39.0, tn:5.5, tt:23.8, rh:77.2},
      {province:'Lai Châu', station:'Tam Đường', tv:34.7, tn:-0.4, tt:19.5, rh:82.2},
      {province:'Long An', station:'Mộc Hoá', tv:38.6, tn:15.7, tt:27.5, rh:80.7},
      {province:'Lào Cai', station:'Phố Ràng', tv:40.6, tn:1.3, tt:23.0, rh:85.4},
      {province:'Lâm Đồng', station:'Đà Lạt', tv:30.5, tn:4.5, tt:18.0, rh:85.5},
      {province:'Lạng Sơn', station:'Lạng Sơn', tv:38.8, tn:-2.1, tt:21.3, rh:82.5},
      {province:'Nam Định', station:'Nam Định', tv:40.2, tn:4.6, tt:23.7, rh:84.6},
      {province:'Nghệ An', station:'Vinh', tv:40.9, tn:5.2, tt:24.1, rh:84.2},
      {province:'Ninh Bình', station:'Ninh Bình', tv:40.4, tn:5.4, tt:23.7, rh:84.5},
      {province:'Ninh Thuận', station:'Phan Thiết', tv:38.7, tn:15.4, tt:26.9, rh:79.7, borrowedFrom:'Bình Thuận'},
      {province:'Phú Thọ', station:'Việt Trì', tv:41.4, tn:5.0, tt:23.7, rh:83.0},
      {province:'Phú Yên', station:'Tuy Hoà', tv:40.5, tn:15.2, tt:26.7, rh:80.6},
      {province:'Quảng Bình', station:'Đồng Hới', tv:41.0, tn:6.7, tt:24.7, rh:82.5},
      {province:'Quảng Nam', station:'Tam Kỳ', tv:41.0, tn:12.0, tt:25.7, rh:84.3},
      {province:'Quảng Ngãi', station:'Quảng Ngãi', tv:40.5, tn:12.4, tt:25.9, rh:83.9},
      {province:'Quảng Ninh', station:'Bãi Cháy', tv:37.9, tn:1.7, tt:23.3, rh:82.4},
      {province:'Quảng Trị', station:'Đông Hà', tv:42.1, tn:9.4, tt:25.1, rh:83.1},
      {province:'Sóc Trăng', station:'Sóc Trăng', tv:37.2, tn:13.0, tt:26.9, rh:83.5},
      {province:'Sơn La', station:'Sơn La', tv:39.2, tn:-0.5, tt:21.2, rh:79.9},
      {province:'TP. Hồ Chí Minh', station:'Tây Ninh', tv:39.9, tn:13.9, tt:27.2, rh:79.4, borrowedFrom:'Tây Ninh'},
      {province:'Thanh Hoá', station:'Thanh Hoá', tv:40.7, tn:5.6, tt:23.7, rh:84.5},
      {province:'Thái Bình', station:'Thái Bình', tv:39.2, tn:4.1, tt:23.4, rh:85.9},
      {province:'Thái Nguyên', station:'Thái Nguyên', tv:40.8, tn:3.0, tt:23.4, rh:81.6},
      {province:'Thừa Thiên Huế', station:'Huế', tv:41.3, tn:9.5, tt:25.1, rh:83.9},
      {province:'Tiền Giang', station:'Mỹ Tho', tv:38.9, tn:14.9, tt:27.1, rh:82.2},
      {province:'Trà Vinh', station:'Càng Long', tv:37.7, tn:17.0, tt:26.9, rh:84.0},
      {province:'Tuyên Quang', station:'Tuyên Quang', tv:41.0, tn:1.8, tt:23.5, rh:82.5},
      {province:'Tây Ninh', station:'Tây Ninh', tv:39.9, tn:13.9, tt:27.2, rh:79.4},
      {province:'Vĩnh Long', station:'Cần Thơ', tv:40.0, tn:14.8, tt:26.9, rh:83.4, borrowedFrom:'Cần Thơ'},
      {province:'Vĩnh Phúc', station:'Vĩnh Yên', tv:41.4, tn:3.7, tt:24.0, rh:81.3},
      {province:'Yên Bái', station:'Yên Bái', tv:40.4, tn:2.9, tt:23.0, rh:86.1},
      {province:'Điện Biên', station:'Điện Biên', tv:37.9, tn:-1.3, tt:22.2, rh:83.4},
      {province:'Đà Nẵng', station:'Đà Nẵng', tv:40.6, tn:9.2, tt:25.9, rh:81.7},
      {province:'Đắk Lắk', station:'Buôn Ma Thuột', tv:38.5, tn:9.1, tt:23.7, rh:81.4},
      {province:'Đắk Nông', station:'Đắk Nông', tv:37.1, tn:7.6, tt:22.7, rh:83.1},
      {province:'Đồng Nai', station:'Tây Ninh', tv:39.9, tn:13.9, tt:27.2, rh:79.4, borrowedFrom:'Tây Ninh'},
      {province:'Đồng Tháp', station:'Cao Lãnh', tv:37.4, tn:15.8, tt:27.2, rh:82.8}
    ],
    // ─────────────────────────────────────────────────────────────────────────
    // DỮ LIỆU KỸ THUẬT BỔ SUNG (Prompt HVAC Heat Load Calculator)
    // ─────────────────────────────────────────────────────────────────────────

    // PHYSICS — Hằng số vật lý. Nguồn: ASHRAE Fundamentals Ch.1
    // Mọi công thức engine CHỈ trỏ về đây — cấm hardcode số trong logic tính.
    PHYSICS: {
      RHO_AIR: 1.2,               // kg/m³
      CP_AIR: 1.005,              // kJ/kg.K
      R_LATENT_VAPOR: 2501,       // kJ/kg
      LATENT_HEAT_ICE: 334,       // kJ/kg
      CP_WATER: 4.18,             // kJ/kg.K
      ATM_PRESSURE_SEA: 101.325,  // kPa
      DOOR_LEAK_COEF_MU: 0.65,
      DUCT_LEAKAGE_FACTOR: 0.015,
      FAN_HEAT_GAIN_PER_1000PA: 1.0, // °C/1000Pa
      DOOR_SAFETY_FACTOR: 1.3,
    },

    // DOOR_CATALOG — Catalogue cửa chuẩn, A_khe đã tính sẵn (m²)
    // Công thức: A_khe = (W_chân×δ_chân + chu_vi_viền×δ_viền) / 10^6
    // Nguồn: thực hành thiết kế phòng sạch VN, tham chiếu ISO 14644-4
    doorCatalog: [
      {code:'D900x2100-STD',  name:'Cửa đơn Standard 900×2100',   wMm:900,  hMm:2100, seal:'Standard',    gapFloorMm:5, gapFrameMm:3, aKheM2:0.01980},
      {code:'D900x2100-BS',   name:'Cửa đơn Bottom-seal 900×2100', wMm:900,  hMm:2100, seal:'Bottom-seal', gapFloorMm:1, gapFrameMm:3, aKheM2:0.01380},
      {code:'D1200x2100-STD', name:'Cửa đơn rộng 1200×2100',      wMm:1200, hMm:2100, seal:'Standard',    gapFloorMm:5, gapFrameMm:3, aKheM2:0.02220},
      {code:'D1800x2100-STD', name:'Cửa đôi Standard 1800×2100',  wMm:1800, hMm:2100, seal:'Standard',    gapFloorMm:5, gapFrameMm:3, aKheM2:0.02700},
      {code:'D1800x2100-AC',  name:'Cửa đôi Air-curtain 1800×2100',wMm:1800,hMm:2100, seal:'Air-curtain', gapFloorMm:0.5,gapFrameMm:1,aKheM2:0.00570},
      {code:'D1200x2200-STD', name:'Cửa kho lạnh 1200×2200',      wMm:1200, hMm:2200, seal:'Standard',    gapFloorMm:5, gapFrameMm:3, aKheM2:0.02280},
    ],

    // MOTOR_IE3 — Hiệu suất motor chuẩn IE3. Nguồn: IEC 60034-30-1
    // Nội suy tuyến tính nếu P_kW không khớp đúng mức bảng (xem calcMotorEta)
    motorIE3: [
      {pKw:0.75,eta:0.825}, {pKw:1.1, eta:0.841}, {pKw:1.5, eta:0.853},
      {pKw:2.2, eta:0.867}, {pKw:3.0, eta:0.877}, {pKw:4.0, eta:0.886},
      {pKw:5.5, eta:0.896}, {pKw:7.5, eta:0.904}, {pKw:11.0,eta:0.914},
      {pKw:15.0,eta:0.921}, {pKw:18.5,eta:0.926}, {pKw:22.0,eta:0.930},
      {pKw:30.0,eta:0.936}, {pKw:37.0,eta:0.939}, {pKw:45.0,eta:0.942},
    ],

    // U_PANEL — Hệ số truyền nhiệt vách cách nhiệt PU. Nguồn: ASHRAE Fundamentals Ch.27 (k_PU=0.022 W/m.K)
    uPanel: [
      {thicknessMm:50,  U:0.44},
      {thicknessMm:75,  U:0.29},
      {thicknessMm:100, U:0.22},
      {thicknessMm:125, U:0.18},
    ],

    // PEOPLE_HEAT — Nhiệt tỏa người. Nguồn: ASHRAE Fundamentals Ch.18, Table 1
    // PEOPLE HEAT GAIN — ASHRAE HOF 2021 Ch.18 Table 1 (@ T_room = 24°C)
    // Nguồn: ASHRAE Handbook of Fundamentals 2021, Chapter 18 Table 1
    // Lưu ý: giá trị tăng ~8W sensible khi T_room = 27°C thay vì 24°C
    peopleHeat: [
      {level:'Nghỉ ngơi / Rạp hát',             qsW:60,  qlW:40,  total:100, note:'ASHRAE HOF 2021 Ch.18 T1: Seated theater'},
      {level:'Văn phòng / Lao động nhẹ',        qsW:70,  qlW:45,  total:115, note:'ASHRAE HOF 2021 Ch.18 T1: Seated, light work, office'},
      {level:'Đứng / Đi lại / Shop',            qsW:75,  qlW:55,  total:130, note:'ASHRAE HOF 2021 Ch.18 T1: Standing, light bench work'},
      {level:'Lao động vừa (nhà máy)',           qsW:100, qlW:85,  total:185, note:'ASHRAE HOF 2021 Ch.18 T1: Moderate dancing, factory work'},
      {level:'Lao động nặng (gia công, xưởng)', qsW:130, qlW:170, total:300, note:'ASHRAE HOF 2021 Ch.18 T1: Heavy work, walking fast'},
      {level:'Thể thao / Vận động mạnh',        qsW:185, qlW:255, total:440, note:'ASHRAE HOF 2021 Ch.18 T1: Athletics'},
    ],

    // FRESH_AIR_PER_PERSON — Gió tươi theo chức năng phòng. Nguồn: ASHRAE 62.1-2022 Table 6-1
    freshAirPerPerson: [
      {func:'Phòng sạch sản xuất (GMP)', lPerS:10},
      {func:'Văn phòng / Phòng họp',     lPerS:8.5},
      {func:'Phòng thay đồ / Locker',    lPerS:7.5},
      {func:'Nhà xưởng gia công',        lPerS:10},
      {func:'Phòng QC / Lab',            lPerS:10},
    ],

    // FREEZER_TYPE — Loại thiết bị đông lạnh tham chiếu
    // Override T_chamber theo datasheet thực tế nếu khác
    freezerType: [
      {name:'IQF (Individual Quick Freezing)',    tChamberDefault:-35},
      {name:'Blast Freezer (Tủ đông gió)',        tChamberDefault:-30},
      {name:'Contact Freezer (Tủ đông tiếp xúc)',tChamberDefault:-35},
      {name:'Cold Storage (Kho lạnh)',            tChamberDefault:-18},
    ],

    // TCVN_K3 — Hệ số K3 tải ngoài phòng. Nguồn: TCVN 5687:2024
    tcvnK3: [
      {label:'Thiết bị trong phòng (K3=1.0)',     K3:1.00},
      {label:'Tải ngoài phòng — thấp (K3=0.10)', K3:0.10},
      {label:'Tải ngoài phòng — cao (K3=0.15)',  K3:0.15},
    ],

    // EQUIP_TYPES — 4 loại hệ thống điều hoà (logic tính khác nhau)
    equipTypes: [
      {code:'AHU',      name:'AHU (Air Handling Unit)',       color:'cyan',    note:'Gió tươi xử lý qua mixing point, không cộng thẳng Q_phòng'},
      {code:'PAU',      name:'PAU (Primary Air Unit)',        color:'violet',  note:'100% gió tươi; L_fresh = L_supply'},
      {code:'FCU',      name:'FCU (Fan Coil Unit)',           color:'emerald', note:'Gió tươi (nếu có, cấp trực tiếp/qua khe hở, KHÔNG xử lý riêng) cộng thẳng vào Q_sensible/latent phòng — FCU phải gánh luôn tải gió tươi thô'},
      {code:'FCU_OA',   name:'FCU + OA riêng (Fan Coil + thiết bị xử lý gió tươi riêng)', color:'teal', note:'Gió tươi được 1 thiết bị riêng (DOAS/PAU nhỏ) xử lý TRƯỚC khi vào phòng — tách coil riêng khỏi Q_phòng, không cộng vào tải FCU như loại FCU thường'},
      {code:'VENT',     name:'Thông gió thuần (Ventilation Only)', color:'slate', note:'Q_coil = 0, chỉ chọn quạt'},
    ],

    // PARASITIC_TYPES — Loại tải ký sinh
// 18 LOẠI CÔNG TRÌNH — tham chiếu tiêu chuẩn đầy đủ
// ═══════════════════════════════════════════════════════════════════════
// BUILDING_TYPES — danh mục loại phòng dùng để auto-fill preset khi chọn
// "Loại công trình/phòng" trong tab Tính toán. Thêm/sửa/xóa phòng: chỉ cần
// thêm/sửa/xóa 1 object trong mảng này (hoặc EXTRA_BUILDING_TYPES bên dưới,
// dùng cho các phòng bổ sung không thuộc preset gốc — 2 mảng được gộp làm 1
// lúc khởi động app, xem App.bootstrap()).
//
// Field mới bổ sung (2026) để phân loại theo yêu cầu áp suất/gió tươi/gió thải:
//   pressureGroup   : 'positive' | 'neutral' | 'negative'
//                      — nhóm áp suất phòng so với hành lang/khu vực lân cận,
//                        suy ra từ dấu deltaPPa (dùng để lọc/thống kê nhanh,
//                        KHÔNG thay thế deltaPPa — deltaPPa vẫn là giá trị
//                        thiết kế thực tế dùng trong tính toán).
//   standardModule  : null | tên key trong STANDARD_MODULES (xem bên dưới)
//                      — nếu có, room form sẽ hiện thêm panel chọn hệ thống/
//                        cấp độ tiêu chuẩn tương ứng (vd 'cleanroom' → ISO/GMP).
//                        null = phòng dùng preset ACH/ΔP cố định, không có
//                        module chọn cấp độ.
//   hasLocalExhaust : true | false — phòng có thiết bị/công đoạn cần hút gió
//                      thải cục bộ tại nguồn (song song với cấp gió tươi
//                      thông thường), ví dụ tủ điện, hàn, sơn, chế biến...
//   localExhaustNote: mô tả định tính nguồn phát sinh cần hút cục bộ (chỉ có
//                      khi hasLocalExhaust=true). Lưu lượng hút cục bộ phụ
//                      thuộc thiết bị thực tế, không cố định theo loại phòng
//                      nên KHÔNG có field lưu lượng cố định ở đây — nhập tay
//                      trong mục "Gió thải cục bộ" (App.state.localExhaust)
//                      của từng dự án. Ngoại lệ: bếp công nghiệp và toilet đã
//                      có module tính riêng (calcKitchenExhaust/
//                      calcToiletVentilation), không dùng field này.
// ═══════════════════════════════════════════════════════════════════════
BUILDING_TYPES:[
  // ── DÂN DỤNG ──
  {id:'residential',name:'Nhà ở / Căn hộ',category:'residential',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:4,achMax:8,achDefault:6,
   occupancyPersonM2:0.04,lightingWM2:10,equipWM2:5,
   freshAirLsP:7.5, // ASHRAE 62.2:2022 §4.1.2 — 7.5 L/s/person + 0.15 L/s·m²
   freshAirLsM2:0.15,
   deltaPPa:0,
   stdRef:'ASHRAE 62.2:2022; TCVN 5687:2010',
   systemRec:'Split AC / Multi-split / VRF',
   note:'Ventilação mínima: max(7.5×n_người + 0.15×S_sàn) L/s per ASHRAE 62.2', tInDesign:25, rhInDesign:60},
  {id:'hotel_room',name:'Phòng khách sạn',category:'residential',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:4,achMax:8,achDefault:6,
   occupancyPersonM2:0.06,lightingWM2:15,equipWM2:10,
   freshAirLsP:8.5, // ASHRAE 62.1-2022 Table 6-1: Guest rooms 8.5 L/s/person
   freshAirLsM2:0.9,deltaPPa:0,
   stdRef:'ASHRAE 62.1-2022 Table 6-1',
   systemRec:'FCU + centralized PAU',note:'', tInDesign:22, rhInDesign:55},

  // ── THƯƠNG MẠI ──
  {id:'office',name:'Văn phòng làm việc',category:'commercial',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:false,
   achMin:6,achMax:10,achDefault:8,
   occupancyPersonM2:0.05,lightingWM2:12,equipWM2:15,
   freshAirLsP:8.5, // ASHRAE 62.1-2022 Table 6-1: Office space 8.5 L/s/person
   freshAirLsM2:0.9,deltaPPa:5,
   stdRef:'ASHRAE 62.1-2022 Table 6-1; TCVN 5687:2010',
   systemRec:'FCU + AHU/PAU / VRF + PAU',note:'', tInDesign:22, rhInDesign:55},
  {id:'conference',name:'Phòng họp / Hội nghị',category:'commercial',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:false,
   achMin:8,achMax:15,achDefault:10,
   occupancyPersonM2:0.5,lightingWM2:15,equipWM2:20,
   freshAirLsP:10, // ASHRAE 62.1-2022 Table 6-1: Conference rooms 10 L/s/person
   freshAirLsM2:0.9,deltaPPa:5,
   stdRef:'ASHRAE 62.1-2022 Table 6-1',
   systemRec:'AHU hoặc VRF + PAU',note:'Cần gió tươi lớn theo số người'},
  {id:'auditorium',name:'Hội trường / Rạp chiếu phim',category:'commercial',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:6,achMax:12,achDefault:8,
   occupancyPersonM2:0.8,lightingWM2:20,equipWM2:10,
   freshAirLsP:10, // ASHRAE 62.1-2022 Table 6-1: Auditorium 10 L/s/person
   freshAirLsM2:0.9,deltaPPa:0,
   stdRef:'ASHRAE 62.1-2022 Table 6-1; ASHRAE Applications Ch.4',
   systemRec:'AHU underfloor supply + overhead return; NC≤30 dB',
   note:'Tải ẩn cao (người). Cần kiểm tra NC tiếng ồn nghiêm ngặt (≤25-35 NC)', tInDesign:22, rhInDesign:55},
  {id:'retail',name:'Siêu thị / Cửa hàng bán lẻ',category:'commercial',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:false,
   achMin:6,achMax:10,achDefault:8,
   occupancyPersonM2:0.15,lightingWM2:25,equipWM2:15,
   freshAirLsP:7.5,freshAirLsM2:1.5, // ASHRAE 62.1-2022: Sales floor 7.5 L/s/person + 1.5 L/s/m²
   deltaPPa:5,
   stdRef:'ASHRAE 62.1-2022 Table 6-1',
   systemRec:'AHU / Cassette FCU',note:'', tInDesign:22, rhInDesign:55},

  // ── ĂN UỐNG ──
  {id:'restaurant',name:'Nhà hàng / Canteen',category:'food_service',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:8,achMax:15,achDefault:12,
   occupancyPersonM2:0.7,lightingWM2:18,equipWM2:10,
   freshAirLsP:15, // ASHRAE 62.1-2022: Dining rooms 15 L/s/person
   freshAirLsM2:0.9,deltaPPa:0,
   stdRef:'ASHRAE 62.1-2022 Table 6-1',
   systemRec:'AHU + FCU',note:'Tải ẩn cao từ thực phẩm, khách hàng, hơi bếp'},
  {id:'commercial_kitchen',name:'Bếp công nghiệp',category:'food_service',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:true,localExhaustNote:'Hút mùi/khói tại chụp hút bếp — tính riêng qua module Kitchen Exhaust (NFPA 96), không cộng vào gió tươi phòng',
   achMin:20,achMax:40,achDefault:30,
   occupancyPersonM2:0.1,lightingWM2:15,equipWM2:200,
   freshAirLsP:10,freshAirLsM2:2.0,deltaPPa:0,
   stdRef:'ASHRAE Applications 2023 Ch.31; NFPA 96',
   systemRec:'Chụp hút hơi (exhaust hood) + makeup air',
   note:'Thiết kế theo vận tốc bắt (capture velocity 0.3-0.5 m/s). NFPA 96 bắt buộc'},

  // ── Y TẾ ──
  {id:'hospital_or',name:'Phòng mổ (Operating Room)',category:'healthcare',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:false,
   achMin:20,achMax:25,achDefault:20,achFreshMin:4, // ASHRAE 170:2021 Table 7.1: tối thiểu 4 ACH gió tươi RIÊNG với tổng ACH
   occupancyPersonM2:0.05,lightingWM2:40,equipWM2:100,
   freshAirLsP:15,freshAirLsM2:2.0,
   deltaPPa:15, // ASHRAE 170:2021 Table 7.1: OR ≥+15 Pa vs corridor
   stdRef:'ASHRAE 170:2021 Table 7.1 — phòng mổ Class A/B',
   systemRec:'100% OA AHU + HEPA H14 → không tuần hoàn',
   note:'ASHRAE 170:2021: tối thiểu 20 ACH, tối thiểu 4 ACH gió tươi. ΔP≥+15Pa', tInDesign:18, rhInDesign:50},
  {id:'hospital_patient',name:'Phòng bệnh nhân thường',category:'healthcare',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:6,achMax:10,achDefault:6,achFreshMin:2, // ASHRAE 170:2021: tối thiểu 2 ACH gió tươi RIÊNG với tổng ACH
   occupancyPersonM2:0.1,lightingWM2:15,equipWM2:30,
   freshAirLsP:10,freshAirLsM2:0.9,deltaPPa:0,
   stdRef:'ASHRAE 170:2021 Table 7.1',
   systemRec:'FCU + centralized AHU',
   note:'ASHRAE 170:2021: 6 ACH tổng, 2 ACH gió tươi', tInDesign:22, rhInDesign:50},
  {id:'hospital_isolation',name:'Phòng cách ly áp âm',category:'healthcare',
   pressureGroup:'negative',standardModule:null,hasLocalExhaust:false,
   achMin:12,achMax:15,achDefault:12,achFreshMin:12, // 100% OA, không tuần hoàn — ACH gió tươi = ACH tổng
   occupancyPersonM2:0.1,lightingWM2:15,equipWM2:30,
   freshAirLsP:10,freshAirLsM2:0.9,
   deltaPPa:-8, // ASHRAE 170:2021: isolation -8 Pa vs corridor
   stdRef:'ASHRAE 170:2021 — Airborne Infection Isolation Room',
   systemRec:'100% OA + exhaust, áp âm ≥-8 Pa',
   note:'12 ACH min per ASHRAE 170. ΔP≤-8Pa. HEPA exhaust trước khi thải ngoài'},

  // ── PHÒNG SẠCH & KỸ THUẬT (sử dụng cleanroomStandards riêng) ──
  {id:'cleanroom',name:'Phòng sạch ISO/GMP',category:'cleanroom',
   pressureGroup:'positive',standardModule:'cleanroom',hasLocalExhaust:false,
   achMin:6,achMax:480,achDefault:30,
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:10,
   stdRef:'ISO 14644-1:2015; EU GMP Annex 1 (2022); WHO TRS 961',
   systemRec:'AHU + PAU + HEPA filtration',
   note:'Dùng module Cleanroom riêng để tính ACH/ΔP/gió tươi đúng tiêu chuẩn', tInDesign:21, rhInDesign:45},
  {id:'datacenter',name:'Data Center / Server Room',category:'technical',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:0,achMax:0,achDefault:0, // DC không dùng ACH, dùng nhiệt tải
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:0,
   stdRef:'ASHRAE TC9.9 2021 Thermal Guidelines for Data Centers',
   systemRec:'CRAC/CRAH / In-row cooling / Cold aisle containment',
   note:'Lưu lượng tính theo tải nhiệt IT (W/m² × diện tích)', tInDesign:18, rhInDesign:50},
  {id:'electrical_room',name:'Phòng kỹ thuật điện',category:'technical',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:true,localExhaustNote:'Có thể cần hút cục bộ tại tủ ắc-quy/máy cắt SF6 — tùy thiết bị lắp đặt thực tế',
   achMin:6,achMax:15,achDefault:10,
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:0,
   stdRef:'NFPA 70; TCVN 9207:2012; IEC 62271',
   systemRec:'Split AC / FCU',
   note:'Tải nhiệt chủ yếu từ thiết bị đóng cắt. Không cho người ở lâu dài'},

  // ── CÔNG NGHIỆP ──
  {id:'workshop_light',name:'Nhà xưởng gia công nhẹ',category:'industrial',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
   achMin:6,achMax:10,achDefault:8,
   occupancyPersonM2:0.02,lightingWM2:8,equipWM2:20,
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:0,
   stdRef:'ASHRAE Applications 2023 Ch.10; TCVN 5687:2010',
   systemRec:'Evaporative cooling + cấp gió tươi',note:''},
  {id:'workshop_heavy',name:'Nhà xưởng sản xuất nặng / nhiệt cao',category:'industrial',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:true,localExhaustNote:'Hút cục bộ tại nguồn phát sinh (hàn, mài, hóa chất...) — tùy công đoạn sản xuất',
   achMin:10,achMax:30,achDefault:15,
   occupancyPersonM2:0.01,lightingWM2:8,equipWM2:100,
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:0,
   stdRef:'ASHRAE Applications 2023 Ch.10; TCVN 5687:2010',
   systemRec:'Quạt thông gió công nghiệp + hút cục bộ nguồn nhiệt',note:''},
  {id:'food_processing',name:'Nhà máy chế biến thực phẩm (thịt/cá/tôm)',category:'food_industrial',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:true,localExhaustNote:'Hút mùi/hơi ẩm cục bộ tại khu sơ chế theo yêu cầu HACCP — tùy bố trí thiết bị',
   achMin:15,achMax:30,achDefault:20,
   occupancyPersonM2:0.05,lightingWM2:12,equipWM2:30,
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:5,
   stdRef:'USDA FSIS; FDA 21 CFR; TCVN 5603:2008; ASHRAE Refrigeration 2022',
   systemRec:'AHU chống ẩm + wash-down + tách ẩm (dehumidifier nếu cần)',
   note:'Kiểm soát nhiệt độ 5-15°C. Độ ẩm 60-80%RH. Vật liệu inox, chống rỉ'},
  
  // ── VỆ SINH & PHỤ TRỢ ──
  {id:'toilet',name:'Nhà vệ sinh / Toilet',category:'sanitary',
   pressureGroup:'negative',standardModule:null,hasLocalExhaust:false,
   achMin:6,achMax:15,achDefault:10,
   occupancyPersonM2:0.2,lightingWM2:10,equipWM2:0,
   freshAirLsP:0,freshAirLsM2:0,
   freshAirPerFixture:1.4, // ASHRAE 62.1-2022: 1.4 L/s per m² (or 25 L/s per toilet)
   deltaPPa:-5, // Duy trì áp âm so với hành lang để kiểm soát mùi
   stdRef:'ASHRAE 62.1-2022 §6.2.7; TCVN 5687:2010',
   systemRec:'Quạt hút trực tiếp (exhaust only) + cấp bù gián tiếp từ hành lang',
   note:'ASHRAE 62.1-2022: 25 L/s/bệt xí, 17.5 L/s/bồn tiểu. Duy trì áp âm ≥-5 Pa'},
  {id:'loading_dock',name:'Khu nhận hàng / Loading dock',category:'logistics',
   pressureGroup:'negative',standardModule:null,hasLocalExhaust:false,
   achMin:4,achMax:8,achDefault:5,
   occupancyPersonM2:0.02,lightingWM2:8,equipWM2:5,
   freshAirLsP:10,freshAirLsM2:0,deltaPPa:-5, // tránh lạnh từ xe đông thâm nhập vào kho
   stdRef:'Industry practice; ASHRAE Refrigeration Ch.13',
   systemRec:'Màn gió (air curtain) + đệm cao su dock seal',
   note:'Kiểm soát thâm nhập nhiệt khi mở cửa. Cần air curtain nếu kề kho lạnh'},
],

// ═══════════════════════════════════════════════════════════════════════
// STANDARD_MODULES — danh mục "hệ thống tiêu chuẩn" gắn với buildingType.standardModule
// ─────────────────────────────────────────────────────────────────────
// Mục đích: khi người dùng chọn 1 loại phòng trong BUILDING_TYPES có field
// standardModule khớp với 1 key ở đây, UI (room form, panel B) sẽ tự động
// hiện đúng bộ lọc/dropdown tiêu chuẩn tương ứng, thay vì hiện cố định cho
// mọi loại phòng. Thêm module mới: chỉ cần thêm 1 entry ở đây + set
// standardModule tương ứng trên các phòng liên quan trong BUILDING_TYPES/
// EXTRA_BUILDING_TYPES — KHÔNG cần sửa logic render.
//
// panelLabel   : tiêu đề panel hiển thị trong form phòng
// systemOptions: các "hệ thống" con người dùng chọn (map vào field r.classSystem)
// dataSource   : tên mảng trong App.data chứa các cấp/class của hệ thống này
//                 (mỗi phần tử trong mảng đó phải có field "system" khớp
//                 với value trong systemOptions)
// ═══════════════════════════════════════════════════════════════════════
STANDARD_MODULES: {
  cleanroom: {
    panelLabel: 'Tiêu chuẩn phòng sạch — chọn để auto-fill ACH và ΔP',
    systemOptions: [
      {v:'ISO', n:'ISO 14644-1:2015'},
      {v:'GMP', n:'GMP EU Annex 1 (2022)'},
      {v:'GENERAL', n:'Thông thường (tự nhập)'},
    ],
    dataSource: 'cleanroomStandards',
  },
  // Ví dụ mở rộng sau này (chưa kích hoạt — bỏ comment + set standardModule
  // tương ứng trên phòng khi có bảng cấp độ áp suất y tế riêng theo ASHRAE 170):
  // hospital_pressure: {
  //   panelLabel: 'Tiêu chuẩn áp suất phòng y tế (ASHRAE 170:2021)',
  //   systemOptions: [{v:'ASHRAE170', n:'ASHRAE 170:2021'}],
  //   dataSource: 'hospitalPressureStandards',
  // },
},

// ═══════════════════════════════════════════════════════════════════════
// MATERIAL_CATALOGS_META — khai báo các danh mục vật liệu (tường, kính, ống
// gió, cách nhiệt, cửa) để hiển thị + thêm/ẩn/xóa chung 1 chỗ trong tab
// Database (admin.materialCatalogHtml). Thêm vật liệu mới cho danh mục có
// sẵn: sửa trực tiếp mảng dữ liệu (WALL_TYPES, GLASS_CATALOG...) ở trên.
// Thêm cả 1 DANH MỤC vật liệu mới (vd "Sơn phủ", "Gioăng cửa"...): thêm 1
// mảng dữ liệu mới + 1 entry ở đây với "fields" mô tả cột hiển thị/form —
// UI danh mục & form thêm/xóa tự động có, không cần sửa admin.js thêm.
// fields[].key phải khớp tên field trong object dữ liệu thực tế.
// idField: tên field dùng làm khóa định danh duy nhất (đa số là 'id', riêng
// doorCatalog dùng 'code').
// ═══════════════════════════════════════════════════════════════════════
MATERIAL_CATALOGS_META: {
  wallTypes: {
    arrayName:'WALL_TYPES', idField:'id', label:'Tường / Vách (U-value)',
    fields:[
      {key:'name', label:'Tên vật liệu', type:'text', placeholder:'VD: Gạch nung 200mm + trát'},
      {key:'group',label:'Nhóm CLTD',    type:'text', placeholder:'A/B/C/D', width:70},
      {key:'U',    label:'U (W/m²K)',    type:'number', step:0.01, placeholder:'0.45'},
    ],
  },
  glass: {
    arrayName:'GLASS_CATALOG', idField:'id', label:'Kính (SHGC / U / VT)',
    fields:[
      {key:'name', label:'Tên loại kính', type:'text', placeholder:'VD: Kính hộp đôi Low-e'},
      {key:'SHGC', label:'SHGC',  type:'number', step:0.01, placeholder:'0.45', width:70},
      {key:'U',    label:'U (W/m²K)', type:'number', step:0.1, placeholder:'1.9', width:80},
      {key:'VT',   label:'VT',    type:'number', step:0.01, placeholder:'0.62', width:70},
    ],
  },
  ductMaterials: {
    arrayName:'ductMaterials', idField:'id', label:'Vật liệu ống gió (tôn kẽm, inox...)',
    fields:[
      {key:'name',        label:'Tên vật liệu', type:'text', placeholder:'VD: Tôn tráng kẽm'},
      {key:'roughnessMm',label:'Độ nhám ε (mm)', type:'number', step:0.001, placeholder:'0.09', width:90},
      {key:'leakageClass',label:'Cấp rò khí',    type:'text', placeholder:'A/B/C', width:70},
    ],
  },
  insulation: {
    arrayName:'insulationMaterials', idField:'id', label:'Vật liệu cách nhiệt (λ)',
    fields:[
      {key:'name',      label:'Tên vật liệu', type:'text', placeholder:'VD: Bông sợi khoáng'},
      {key:'lambda',    label:'λ (W/m·K)',    type:'number', step:0.001, placeholder:'0.038', width:90},
      {key:'maxTempC',  label:'T max (°C)',   type:'number', step:1, placeholder:'250', width:80},
    ],
  },
  doors: {
    arrayName:'doorCatalog', idField:'code', label:'Cửa (kích thước / khe hở rò khí)',
    fields:[
      {key:'name',       label:'Tên cửa', type:'text', placeholder:'VD: Cửa đôi Air-curtain 1800×2100'},
      {key:'wMm',        label:'Rộng (mm)', type:'number', step:1, placeholder:'1800', width:80},
      {key:'hMm',        label:'Cao (mm)',  type:'number', step:1, placeholder:'2100', width:80},
      {key:'seal',       label:'Loại gioăng', type:'text', placeholder:'Standard/Bottom-seal/Air-curtain', width:110},
      {key:'aKheM2',     label:'A khe (m²)', type:'number', step:0.0001, placeholder:'0.0198', width:90},
    ],
  },
},


// Correction applied: CLTD_VN = CLTD_ASHRAE + (25.5 - T_in) + (T_mean_VN - T_mean_ASHRAE)
// T_mean_VN = 32°C (July, Ho Chi Minh City); T_mean_ASHRAE = 29.4°C
// Delta = (25.5 - 22) + (32 - 29.4) = 3.5 + 2.6 = +6.1 ≈ +6°C applied below
// Source: ASHRAE 2001 Fundamentals Ch.29 Table 31 (walls) + Table 34 (roofs)
// Hour of peak: 15h (3pm) for SW/W/S; 9h for E/NE

CLTD_WALLS:{
  // Wall groups per ASHRAE 2001 Ch.29 Table 33B (US system)
  // Group = construction type classification by thermal mass + U-value
  // Values at 15h (peak cooling hour) for July, lat 15°N, adj for VN conditions
  //         N    NE   E    SE   S    SW   W    NW   Horiz
  A:{name:'Tường nhẹ (U≥0.8 W/m²K): kim loại, kính, curtain wall',U:1.2,lag:0,
     cltd:[9,12,16,18,15,20,22,12]}, // fast response, high peak
  B:{name:'Tường nhẹ-vừa (U≈0.5-0.8): block + trát',U:0.65,lag:2,
     cltd:[7,10,14,16,12,17,19,10]},
  C:{name:'Tường trung bình (U≈0.3-0.5): gạch 200mm + trát 2 mặt',U:0.45,lag:4,
     cltd:[5, 8,11,13, 9,14,16, 8]},
  D:{name:'Tường nặng (U≈0.2-0.3): bê tông 200mm, gạch 300mm',U:0.28,lag:7,
     cltd:[3, 5, 8, 9, 6,10,12, 5]},
  // Note: all CLTD values corrected for VN conditions (Tin=22°C, Tmean=32°C)
},

CLTD_ROOFS:{
  // ASHRAE 2001 Ch.29 Table 34 (flat roofs, July, peak ~14h-16h, adj for VN)
  R1:{name:'Mái tôn không cách nhiệt (U≈3-5 W/m²K)',U:3.5, cltdPeak:40},
  R2:{name:'Mái tôn + cách nhiệt 50mm glasswool (U≈0.8)',U:0.8, cltdPeak:28},
  R3:{name:'Mái tôn + cách nhiệt 100mm glasswool (U≈0.4)',U:0.4, cltdPeak:22},
  R4:{name:'Sàn bê tông không cách nhiệt (U≈1.5-2)',U:1.8, cltdPeak:15},
  R5:{name:'Sàn bê tông + cách nhiệt (U≈0.5-0.7)',U:0.6, cltdPeak:10},
  R6:{name:'Mái PIR panel 100mm (U≈0.22)',U:0.22, cltdPeak:18},
  // Note: CLTD_VN corrected as per wall methodology above
},

// SOLAR HEAT GAIN — Vietnam (lat 10-21°N, peak July/August)
// Peak beam solar irradiance (W/m²) by orientation — 15h solar time
// Source: NASA MERRA-2 global horizontal irradiance data + decomposition model for VN
// Adjusted for VN sky conditions (cloud cover, atmospheric transmittance ~0.6-0.7)
SOLAR_VN:{
  N:180, NE:220, E:480, SE:520, S:350, SW:600, W:620, NW:280, Horizontal:820
  // All values W/m², peak beam + diffuse, average clear day July, lat 15°N VN
  // Source: ASHRAE HOF 2021 Ch.14 solar heat gain + NASA MERRA-2 validation
},

// CLF (Cooling Load Factor) for solar through glass
// ASHRAE 2001 Ch.29 Table 36 — simplified single-story building, no internal shading
// Values at 15h (afternoon peak), all orientations
CLF_GLASS:{
  N:0.65, NE:0.25, E:0.25, SE:0.55, S:0.72, SW:0.82, W:0.87, NW:0.68
  // Accounts for thermal mass of building structure absorbing and releasing solar
},

// FOOD PRODUCT DATA — ASHRAE Refrigeration Handbook 2022 Chapter 30
// Thermal properties of food products for cooling/freezing load calculation


// EQUIPMENT DATABASE — parametric catalog (ranges, not specific brands)
EQUIP_DB:{
  AHU:[
    {range:'5-15 kW', Q_range:[1000,6000], notes:'Rooftop hoặc cassette, điển hình văn phòng nhỏ'},
    {range:'15-50 kW',Q_range:[6000,20000],notes:'AHU trung tâm, văn phòng, khách sạn'},
    {range:'50-200 kW',Q_range:[20000,80000],notes:'AHU lớn, nhà xưởng, trung tâm thương mại'},
    {range:'200-500 kW',Q_range:[80000,200000],notes:'DOAS, tòa nhà lớn, bệnh viện'},
  ],
  FCU:[
    {type:'Âm trần cassette',kW_min:0.5,kW_max:10, note:'VRF indoor unit / chilled water FCU'},
    {type:'Giấu trần (duct)',kW_min:1,  kW_max:15, note:'Dễ phân phối gió'},
    {type:'Đứng tường',     kW_min:2,  kW_max:30, note:'Phòng kỹ thuật'},
  ],
  VRF:[
    {system:'VRF 2 ống',         kW_min:8,kW_max:80, COP_cool:3.5,COP_heat:4.0},
    {system:'VRF 3 ống (heat rec)',kW_min:14,kW_max:140,COP_cool:3.8,COP_heat:4.2},
  ],
  CHILLER:[
    {type:'Scroll water-cooled',kW_min:50,kW_max:200,COP:4.5,note:'IPLV theo ARI 550/590'},
    {type:'Screw water-cooled', kW_min:200,kW_max:1000,COP:5.5,note:''},
    {type:'Centrifugal',        kW_min:500,kW_max:5000,COP:6.0,note:''},
    {type:'Air-cooled scroll',  kW_min:20,kW_max:150,COP:3.0,note:'Không cần cooling tower'},
  ],
},

// BOM MATERIAL RATES (VND/unit, 2024 estimate, không bao gồm VAT)
// GHI CHÚ: đây là giá tham khảo thị trường, biến động theo khu vực và nhà cung cấp
// Kỹ sư cần cập nhật theo đơn giá thực tế của từng dự án
MATERIAL_RATES:{
  // Ống gió
  ductGalvM2:        90000,  // Tôn tráng kẽm, gia công + lắp đặt (VND/m²)
  ductSSM2:         220000,  // Inox 304, gia công + lắp đặt
  ductPIRM2:        180000,  // Panel PIR cách nhiệt sẵn
  insulGlasswoolM2:  55000,  // Bông khoáng 25mm + giấy bạc
  insulPUFoamM2:     75000,  // Foam PU 25mm
  // AHU/FCU (turnkey, supply + install, không gồm chiller/VRF outdoor)
  ahuPerKW:       1800000,  // AHU (VND/kW lạnh) — gói tổng thầu M&E
  fcuPerKW:        900000,  // FCU (VND/kW lạnh)
  vrfPerKW:       1500000,  // VRF outdoor (VND/kW)
  chillerPerKW:   2000000,  // Chiller (VND/kW)
  crac_PerKW:     2500000,  // CRAC/CRAH cho data center
  // Đường ống lạnh/nước lạnh (supply+insulation+install)
  refPipeM:         85000,  // Ống đồng môi lạnh bọc cách nhiệt (VND/m) — trung bình
  chwPipeM:         120000, // Ống nước lạnh DN25-50 (VND/m) — trung bình
  // Phần trăm chi phí phụ
  electricalPct:     0.12,  // 12% của tổng thiết bị cơ khí
  controlsPct:       0.08,  // 8% controls/BMS
  labourPct:         0.25,  // 25% nhân công (thi công)
  overheadProfitPct: 0.18,  // 18% overhead + lợi nhuận nhà thầu
  contingencyPct:    0.05,  // 5% contingency
},

// (các data tables cũ giữ lại: doorCatalog, motorIE3, uPanel, peopleHeat, freshAirPerPerson,
//  filterStages, ductMaterials, insulationMaterials, fittingLoss, ncGuideline,
//  climateSample 63 tỉnh, cleanroomStandards, achISO, achGMP, dcClasses, achWorkshop,
//  doorStandardSizes, equipTypes, parasiticTypes, freezerType, tcvnK3, elecDeviceRef)


    // ─── TẢI KÝ SINH — HVAC nhà xưởng chế biến ─────────────────────────────
    // Tải ký sinh: thiết bị lạnh cục bộ (IQF, mạ băng...) đặt trong phòng ĐHKK
    // → hút nhiệt ra khỏi phòng (tải lạnh âm) hoặc tỏa nhiệt vào phòng (ROTOR, dương)
    // Tham chiếu: ASHRAE Refrigeration 2022 Ch.14 + thực tế nhà máy chế biến thủy sản VN
    parasiticTypes: [
      {code:'IQF',   name:'IQF / Tủ đông nhanh (vách + khe cửa thâm nhập lạnh)'},
      {code:'GLAZE', name:'Máy mạ băng (làm lạnh bể nước mạ băng)'},
      {code:'ICE',   name:'Máy đá vảy (hút nhiệt nước → đá)'},
      {code:'ROTOR', name:'Rotor dehumidifier (tỏa nhiệt vào phòng — tải dương)'},
    ],

    // FOOD_PRODUCTS — Nhiệt độ chế biến điển hình cho tính ĐHKK nhà máy thực phẩm
    // Nguồn: ASHRAE Refrigeration Handbook 2022 Ch.30 Table 2
    FOOD_PRODUCTS:[
      {id:'shrimp',    name:'Tôm tươi',           processTemp:5,  roomTemp:10,
       cpAbove:3.64,Tf:-2.0, note:'ASHRAE Refrig 2022 Ch.30 Table 2'},
      {id:'fish',      name:'Cá tươi (trung bình)',processTemp:2,  roomTemp:8,
       cpAbove:3.60,Tf:-2.2, note:'ASHRAE Refrig 2022 Ch.30'},
      {id:'beef',      name:'Thịt bò',             processTemp:2,  roomTemp:6,
       cpAbove:3.52,Tf:-1.7, note:'ASHRAE Refrig 2022 Ch.30'},
      {id:'pork',      name:'Thịt heo',            processTemp:2,  roomTemp:6,
       cpAbove:3.60,Tf:-2.2, note:'ASHRAE Refrig 2022 Ch.30'},
      {id:'chicken',   name:'Thịt gà',             processTemp:2,  roomTemp:6,
       cpAbove:3.35,Tf:-2.8, note:'ASHRAE Refrig 2022 Ch.30'},
      {id:'squid',     name:'Mực ống',             processTemp:2,  roomTemp:8,
       cpAbove:3.55,Tf:-2.0, note:'ASHRAE Refrig 2022 methodology'},
      {id:'tilapia',   name:'Cá tra / Cá điêu hồng',processTemp:2,roomTemp:8,
       cpAbove:3.58,Tf:-2.0, note:'ASHRAE 2022 methodology'},
    ],

        // ─── TIÊU CHUẨN PHÒNG SẠCH ─────────────────────────────────────────────────
    // ACH guidance: IEST-RP-CC012.2:2019 Table 1 + ASHRAE Applications 2023 Ch.17
    // Pressure diff: ISO 14644-4:2022 Annex C + EU GMP Annex 1 §4.23 (2022) + WHO TRS 961
    // Fresh air per person: ASHRAE 62.1-2022 Table 6-1 (cleanroom/pharma = 10 L/s/person)
    // QUAN TRỌNG: ISO 14644-1:2015 KHÔNG quy định ACH; dải ACH dưới là GUIDANCE từ
    //             IEST-RP-CC012.2 và ASHRAE, KHÔNG phải yêu cầu bắt buộc của ISO.
    cleanroomStandards: [
      // ── ISO 14644-1:2015 ──
      {system:'ISO',code:'ISO 5',isoClass:5,
       flowMode:'unidirectional', achMin:null,achMax:null,achDefault:null,
       velMin:0.36,velMax:0.54,            // WHO TRS 961 Annex 6 §A6.3.3 + EU GMP Annex 1 §4.23 (2022)
       deltaPMinPa:15,                     // vs adjacent lower grade; EU GMP Annex 1 §4.23
       pressACHMin:5,pressACHMax:10,       // makeup air; ISO 14644-4:2022 Annex C
       freshAirPctMin:5,freshAirPctMax:15,
       freshAirPerPersonLs:10,             // ASHRAE 62.1-2022 Table 6-1
       note:'Dòng đơn hướng. Thiết kế theo vận tốc 0.36–0.54 m/s, không theo ACH. Tương đương GMP Grade A.'},
      {system:'ISO',code:'ISO 6',isoClass:6,
       flowMode:'turbulent', achMin:150,achMax:240,achDefault:180,
       velMin:null,velMax:null, deltaPMinPa:12, pressACHMin:3,pressACHMax:8,
       freshAirPctMin:5,freshAirPctMax:10, freshAirPerPersonLs:10,
       note:'Nguồn ACH: IEST-RP-CC012.2:2019 Table 1.'},
      {system:'ISO',code:'ISO 7',isoClass:7,
       flowMode:'turbulent', achMin:60,achMax:90,achDefault:75,
       velMin:null,velMax:null, deltaPMinPa:10, pressACHMin:2,pressACHMax:6,
       freshAirPctMin:10,freshAirPctMax:20, freshAirPerPersonLs:10,
       note:'Nguồn: IEST-RP-CC012.2 + ASHRAE Applications Ch.17. Tương đương GMP Grade C (nghỉ tĩnh).'},
      {system:'ISO',code:'ISO 8',isoClass:8,
       flowMode:'turbulent', achMin:20,achMax:40,achDefault:30,
       velMin:null,velMax:null, deltaPMinPa:5, pressACHMin:1,pressACHMax:4,
       freshAirPctMin:15,freshAirPctMax:25, freshAirPerPersonLs:10,
       note:'Nguồn: IEST-RP-CC012.2. Tương đương GMP Grade D.'},
      {system:'ISO',code:'ISO 9',isoClass:9,
       flowMode:'turbulent', achMin:6,achMax:20,achDefault:12,
       velMin:null,velMax:null, deltaPMinPa:0, pressACHMin:0.5,pressACHMax:2,
       freshAirPctMin:20,freshAirPctMax:50, freshAirPerPersonLs:10,
       note:'Hành lang/khu phụ trợ. Nguồn: IEST-RP-CC012.2.'},
      // ── GMP EU Annex 1 (2022) + WHO TRS 961 Annex 6 ──
      {system:'GMP',code:'Grade A',isoClass:5,
       flowMode:'unidirectional', achMin:null,achMax:null,achDefault:null,
       velMin:0.36,velMax:0.54,            // EU GMP Annex 1 §4.23 (2022)
       deltaPMinPa:15,                     // EU GMP Annex 1 §4.24 (2022): ≥15 Pa vs Grade B
       pressACHMin:5,pressACHMax:10,
       freshAirPctMin:5,freshAirPctMax:15, freshAirPerPersonLs:10,
       note:'EU GMP Annex 1 §4.22–4.24 (2022). Vận tốc đơn hướng 0.36–0.54 m/s. ΔP ≥15 Pa vs Grade B.'},
      {system:'GMP',code:'Grade B',isoClass:7,
       flowMode:'turbulent', achMin:20,achMax:40,achDefault:30,  // WHO TRS 961 Annex 6 Table A6.3
       velMin:null,velMax:null, deltaPMinPa:10, pressACHMin:2,pressACHMax:6,  // EU GMP §4.24: ≥10 Pa vs Grade C
       freshAirPctMin:10,freshAirPctMax:20, freshAirPerPersonLs:10,
       note:'WHO TRS 961 Annex 6 Table A6.3. ΔP ≥10 Pa vs Grade C. EU GMP Annex 1 §4.24 (2022).'},
      {system:'GMP',code:'Grade C',isoClass:8,
       flowMode:'turbulent', achMin:20,achMax:40,achDefault:25,
       velMin:null,velMax:null, deltaPMinPa:5, pressACHMin:1.5,pressACHMax:5,  // EU GMP §4.24: ≥5 Pa vs Grade D
       freshAirPctMin:10,freshAirPctMax:20, freshAirPerPersonLs:10,
       note:'EU GMP Annex 1 §4.24 (2022). ΔP ≥5 Pa vs Grade D.'},
      {system:'GMP',code:'Grade D',isoClass:9,
       flowMode:'turbulent', achMin:6,achMax:20,achDefault:12,  // EU GMP không quy định; thực hành ≥6 ACH
       velMin:null,velMax:null, deltaPMinPa:0, pressACHMin:0.5,pressACHMax:3,
       freshAirPctMin:15,freshAirPctMax:30, freshAirPerPersonLs:10,
       note:'EU GMP Annex 1 (2022) không quy định ACH tối thiểu cho Grade D. Thực hành: ≥6 ACH.'},
    ],

    // ── LOẠI PHÒNG BỔ SUNG v2 (Control Room, Production, Server...) ──
    // Chèn vào BUILDING_TYPES nếu chưa có — check bằng findIndex trong app
    // (xem App.bootstrap()). Cùng cấu trúc field với BUILDING_TYPES ở trên,
    // bao gồm pressureGroup / standardModule / hasLocalExhaust / localExhaustNote
    // — xem chú thích đầy đủ ở đầu mảng BUILDING_TYPES.
    EXTRA_BUILDING_TYPES:[
      {id:'control_room',name:'Phòng điều khiển (DCS/SCADA/PLC)',category:'technical',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:false,
       achMin:8,achMax:15,achDefault:10,
       occupancyPersonM2:0.03,lightingWM2:18,equipWM2:80,
       freshAirLsP:10,freshAirLsM2:0,deltaPPa:5,
       stdRef:'NFPA 70; TCVN 9207:2012; IEC 62271; ASHRAE Applications 2023 Ch.17',
       systemRec:'Split AC / FCU với lọc bụi; duy trì áp dương tránh bụi',
       note:'Tải nhiệt chủ yếu từ server/PLC/màn hình. 20–24°C, RH 40–60%.'},
      {id:'production_area',name:'Khu sản xuất chung (trong nhà)',category:'industrial',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:true,localExhaustNote:'Hút cục bộ tại thiết bị sản xuất phát sinh bụi/hơi/nhiệt — tùy loại hình sản xuất',
       achMin:8,achMax:20,achDefault:12,
       occupancyPersonM2:0.03,lightingWM2:10,equipWM2:30,
       freshAirLsP:10,freshAirLsM2:0,deltaPPa:0,
       stdRef:'ASHRAE Applications 2023 Ch.10; TCVN 5687:2010',
       systemRec:'AHU + cấp gió trực tiếp / Evaporative cooling',
       note:'ACH theo loại SX: nhẹ 8–12, nhựa/sơn 15–25'},
      {id:'office_industrial',name:'Văn phòng trong khu công nghiệp',category:'commercial',
   pressureGroup:'positive',standardModule:null,hasLocalExhaust:false,
       achMin:6,achMax:10,achDefault:8,
       occupancyPersonM2:0.07,lightingWM2:12,equipWM2:15,
       freshAirLsP:8.5,freshAirLsM2:0.9,deltaPPa:5,
       stdRef:'ASHRAE 62.1-2022 Table 6-1; TCVN 5687:2010',
       systemRec:'FCU + PAU / VRF + PAU',
       note:'Tách biệt với khu sản xuất. Cần lọc bụi tốt.'},
      {id:'server_room',name:'Phòng máy chủ nhỏ (Server Room)',category:'technical',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
       achMin:0,achMax:0,achDefault:0,
       occupancyPersonM2:0,lightingWM2:10,equipWM2:500,
       freshAirLsP:0,freshAirLsM2:0,deltaPPa:0,
       stdRef:'ASHRAE TC9.9 2021; TIA-942-B',
       systemRec:'Precision cooling (CRAC/CRAH)',
       note:'Tải IT 500–1500 W/m². Thiết kế theo Q_IT, không theo ACH.'},
      {id:'corridor',name:'Hành lang / Khu chuyển tiếp',category:'auxiliary',
   pressureGroup:'neutral',standardModule:null,hasLocalExhaust:false,
       achMin:4,achMax:8,achDefault:6,
       occupancyPersonM2:0.15,lightingWM2:8,equipWM2:0,
       freshAirLsP:7.5,freshAirLsM2:0.15,deltaPPa:0,
       stdRef:'ASHRAE 62.1-2022; TCVN 5687:2010',
       systemRec:'Cấp gió trực tiếp từ AHU liền kề',
       note:'Thường nhận overflow từ phòng tiếp giáp.'},
          ],

    // WALL_TYPES — catalogue tường theo cấu trúc thực tế (map vào Group A–D)
    // Nguồn: TCVN 9222:2012 (vách ngăn), TCVN 8229:2009 (gạch), ASHRAE HOF 2021
    WALL_TYPES:[
      {id:'curtain_wall',  name:'Tường kính curtain wall (Al frame+DGU)', group:'A',U:1.40},
      {id:'metal_panel',   name:'Tường tôn sandwich PIR 50mm',            group:'A',U:0.80},
      {id:'block_100',     name:'Block bê tông 100mm + trát 2 mặt',        group:'B',U:0.68},
      {id:'brick_100',     name:'Gạch nung 100mm (1/2 gạch) + trát',       group:'B',U:0.70},
      {id:'brick_200',     name:'Gạch nung 200mm (1 gạch) + trát 2 mặt',   group:'C',U:0.45},
      {id:'brick_200_ins', name:'Gạch 200mm + EPS/PU 50mm + trát',         group:'C',U:0.30},
      {id:'brick_300',     name:'Gạch nung 300mm (1.5 gạch) + trát',       group:'D',U:0.32},
      {id:'concrete_150',  name:'BTCT 150mm (không cách nhiệt)',            group:'C',U:0.55},
      {id:'concrete_200',  name:'BTCT 200mm + trát 2 mặt',                 group:'D',U:0.38},
      {id:'concrete_200ins',name:'BTCT 200mm + cách nhiệt 75mm (EPS/PU)',  group:'D',U:0.22},
      {id:'concrete_300',  name:'BTCT 300mm (tường hầm, chắn âm)',         group:'D',U:0.25},
      {id:'aac_200',       name:'Gạch AAC 200mm (bê tông khí chưng áp)',   group:'C',U:0.35},
      {id:'pir_100',       name:'PIR panel 100mm (kho lạnh)',               group:'D',U:0.22},
      {id:'pir_150',       name:'PIR panel 150mm (kho đông)',               group:'D',U:0.15},
    ],

    

    // ─── GLASS CATALOG — SHGC, U-value, VT theo loại kính ──────────────────────
    // Nguồn: ASHRAE HOF 2021 Ch.15 Table 10 + LBNL Window 7.x database
    // SHGC = Solar Heat Gain Coefficient (0–1)
    // VT   = Visible Transmittance (0–1)
    // U    = W/m²K (winter condition, include film resistance)
    GLASS_CATALOG:[
      {id:'single_clear',    name:'Kính đơn 6mm trong suốt',             SHGC:0.82, U:5.8,  VT:0.79, note:'ASHRAE HOF 2021 Table 10'},
      {id:'single_tinted',   name:'Kính đơn màu (bronze/grey) 6mm',      SHGC:0.60, U:5.6,  VT:0.45, note:'ASHRAE HOF 2021'},
      {id:'single_reflect',  name:'Kính đơn phản quang màu 6mm',         SHGC:0.22, U:5.0,  VT:0.12, note:'High-performance reflective'},
      {id:'dgu_clear',       name:'Kính hộp đôi 6+12A+6mm trong',        SHGC:0.70, U:2.8,  VT:0.72, note:'ASHRAE HOF 2021 Table 10 IGU'},
      {id:'dgu_tinted',      name:'Kính hộp đôi tinted 6+12A+6mm',       SHGC:0.52, U:2.7,  VT:0.41, note:''},
      {id:'dgu_lowe_hard',   name:'Kính hộp đôi Low-e hard coat',        SHGC:0.45, U:1.9,  VT:0.62, note:'ASHRAE HOF 2021'},
      {id:'dgu_lowe_soft',   name:'Kính hộp đôi Low-e soft coat',        SHGC:0.35, U:1.6,  VT:0.55, note:'LBNL Window 7, e=0.04'},
      {id:'dgu_solar',       name:'Kính hộp đôi Solar control (SC-35)',   SHGC:0.26, U:1.7,  VT:0.38, note:'Guardian SunGuard typ.'},
      {id:'dgu_solar_hv',    name:'Kính hộp đôi High Visual (HV-67)',     SHGC:0.36, U:1.5,  VT:0.67, note:'High visible transmittance'},
      {id:'tgu_lowe',        name:'Kính hộp ba lớp Low-e (4+12+4+12+4)', SHGC:0.20, U:0.75, VT:0.44, note:'LBNL Window 7'},
      {id:'polycarbonate',   name:'Tấm polycarbonate đặc 10mm',          SHGC:0.65, U:3.2,  VT:0.82, note:'Corrected for diffusion'},
      {id:'skylight_dgu',    name:'Giếng trời kính hộp đôi (nghiêng)',   SHGC:0.55, U:3.0,  VT:0.65, note:'ASHRAE HOF: skylight +20% vs vertical'},
    ],

        // ─── VẬT LIỆU XÂY DỰNG (λ W/m·K) ─────────────────────────────────────────
    // Nguồn: ASHRAE HOF 2021 Ch.26 Table 1; TCVN 9229:2012; ISO 10211
    // h_outside = 23.3 W/m²K (có gió 3.4 m/s) — ASHRAE HOF 2021 Table 10
    // h_inside  = 11.6 W/m²K (không khí tĩnh, dòng nhiệt nằm ngang)
    H_OUTSIDE: 23.3,
    H_INSIDE:  11.6,

    CONSTRUCTION_MATERIALS:[
      // ── Gạch, bê tông ──
      {id:'brick_solid',   cat:'masonry',  name:'Gạch nung đặc',              lambda:0.52,  rho:1800, note:'TCVN 9229:2012 §4.3.1'},
      {id:'brick_hollow',  cat:'masonry',  name:'Gạch lỗ / Gạch rỗng',        lambda:0.35,  rho:1300, note:'TCVN 9229:2012; TB lỗ rỗng 40%'},
      {id:'concrete_rc',   cat:'concrete', name:'Bê tông cốt thép (BTCT)',     lambda:1.74,  rho:2300, note:'ASHRAE HOF 2021 Ch.26 Table 1'},
      {id:'concrete_plain',cat:'concrete', name:'Bê tông thường (không cốt)',  lambda:1.51,  rho:2200, note:'ASHRAE HOF 2021'},
      {id:'concrete_light',cat:'concrete', name:'Bê tông nhẹ (block nhẹ)',     lambda:0.48,  rho:1000, note:'ASHRAE HOF 2021 (800-1200 kg/m³)'},
      {id:'aac_block',     cat:'masonry',  name:'Bê tông khí chưng áp (AAC)',  lambda:0.14,  rho:500,  note:'TCVN 7959:2022; Siporex/Ytong typ. 500'},
      // ── Vữa ──
      {id:'mortar_cement', cat:'mortar',   name:'Vữa xi măng mác 75-100',     lambda:0.93,  rho:1800, note:'TCVN 9229:2012 §4.5'},
      {id:'mortar_lime',   cat:'mortar',   name:'Vữa vôi-xi măng hỗn hợp',   lambda:0.81,  rho:1700, note:'TCVN 9229:2012'},
      // ── Cách nhiệt ──
      {id:'eps',           cat:'insul',    name:'EPS xốp trắng (Polystyrene)',  lambda:0.036, rho:15,   note:'ASHRAE HOF 2021 Table 1; 14-16 kg/m³'},
      {id:'xps',           cat:'insul',    name:'XPS xốp xanh (Extruded PS)',  lambda:0.030, rho:35,   note:'ASHRAE HOF 2021; 24-40 kg/m³'},
      {id:'pu_foam',       cat:'insul',    name:'PU Foam phun tại chỗ',        lambda:0.025, rho:30,   note:'ASHRAE HOF 2021; closed-cell'},
      {id:'pir_board',     cat:'insul',    name:'PIR panel / PIR board',       lambda:0.022, rho:32,   note:'ISO 10211; Face steel nhẹ'},
      {id:'glasswool_24',  cat:'insul',    name:'Bông thuỷ tinh glasswool 24 kg/m³', lambda:0.038, rho:24, note:'ASHRAE HOF 2021 Table 1'},
      {id:'glasswool_48',  cat:'insul',    name:'Bông thuỷ tinh glasswool 48 kg/m³', lambda:0.034, rho:48, note:'ASHRAE HOF 2021'},
      {id:'rockwool_80',   cat:'insul',    name:'Bông đá rockwool 80 kg/m³',   lambda:0.040, rho:80,   note:'ASHRAE HOF 2021'},
      // ── Hoàn thiện ──
      {id:'gypsum_board',  cat:'finish',   name:'Tấm thạch cao (plasterboard)',lambda:0.16,  rho:800,  note:'ASHRAE HOF 2021'},
      {id:'plaster',       cat:'finish',   name:'Vữa trát thạch cao (gypsum plaster)',lambda:0.16, rho:850, note:'ASHRAE HOF 2021'},
      {id:'ceramic_tile',  cat:'finish',   name:'Gạch men sứ / Gạch lát',     lambda:1.05,  rho:2400, note:'ASHRAE HOF 2021'},
      {id:'granite_marble',cat:'finish',   name:'Đá granite/marble',           lambda:2.90,  rho:2700, note:'ASHRAE HOF 2021'},
      {id:'pvc_panel',     cat:'finish',   name:'Tấm ốp PVC trần/tường',       lambda:0.17,  rho:1400, note:''},
      {id:'wood_soft',     cat:'finish',   name:'Gỗ mềm (thông, xoan)',        lambda:0.12,  rho:500,  note:'ASHRAE HOF 2021'},
      {id:'wood_hard',     cat:'finish',   name:'Gỗ cứng (teak, căm xe, gõ)', lambda:0.18,  rho:700,  note:'ASHRAE HOF 2021'},
      {id:'plywood',       cat:'finish',   name:'Ván ép plywood',              lambda:0.13,  rho:700,  note:'ASHRAE HOF 2021'},
      // ── Kim loại, kính ──
      {id:'steel_zinc',    cat:'metal',    name:'Tôn thép mạ kẽm/mạ màu',     lambda:50.0,  rho:7800, note:'ASHRAE HOF 2021 (R ≈ 0)'},
      {id:'aluminum',      cat:'metal',    name:'Nhôm (frame, tấm cladding)',  lambda:237.0, rho:2700, note:'ASHRAE HOF 2021 (R ≈ 0)'},
      {id:'glass_clear',   cat:'glass',    name:'Kính trong đơn (clear)',      lambda:1.05,  rho:2500, note:'ASHRAE HOF 2021'},
      // ── Khe không khí (air gap) — dùng R cố định ──────────────────────────
      // Nguồn: ASHRAE HOF 2021 Table 3 (reflective/non-reflective air spaces)
      {id:'airgap_20',     cat:'airgap',   name:'Khe KK 20mm (không phản xạ)',lambda:null, rho:0, Rfixed:0.13, note:'ASHRAE HOF 2021 Table 3'},
      {id:'airgap_40',     cat:'airgap',   name:'Khe KK 40mm (không phản xạ)',lambda:null, rho:0, Rfixed:0.16, note:'ASHRAE HOF 2021 Table 3'},
      {id:'airgap_refl',   cat:'airgap',   name:'Khe KK 40mm + lá nhôm phản xạ',lambda:null,rho:0,Rfixed:0.50,note:'ASHRAE HOF 2021 Table 3'},
    ],

    // ─── CATALOG FCU / AHU (tham khảo thị trường VN 2024) ──────────────────
    // QUAN TRỌNG: Đây là dải công suất thông dụng, KHÔNG phải model cụ thể.
    // Kỹ sư cần xác nhận với catalog nhà sản xuất thực tế trước khi chọn.
    FCU_CATALOG:[
      // Cassette âm trần 4 chiều (phổ biến nhất)
      {id:'cas_0p75',type:'cassette', name:'FCU Cassette 0.75 kW',  capKW:0.75,  airflowM3h:300,  note:'≈ 2,560 BTU/h'},
      {id:'cas_1p0', type:'cassette', name:'FCU Cassette 1.0 kW',   capKW:1.0,   airflowM3h:400,  note:'≈ 3,412 BTU/h'},
      {id:'cas_1p5', type:'cassette', name:'FCU Cassette 1.5 kW',   capKW:1.5,   airflowM3h:550,  note:'≈ 5,118 BTU/h'},
      {id:'cas_2p0', type:'cassette', name:'FCU Cassette 2.0 kW',   capKW:2.0,   airflowM3h:700,  note:'≈ 6,824 BTU/h'},
      {id:'cas_2p5', type:'cassette', name:'FCU Cassette 2.5 kW',   capKW:2.5,   airflowM3h:850,  note:'≈ 8,530 BTU/h'},
      {id:'cas_3p5', type:'cassette', name:'FCU Cassette 3.5 kW',   capKW:3.5,   airflowM3h:1100, note:'≈ 11,942 BTU/h'},
      {id:'cas_5p0', type:'cassette', name:'FCU Cassette 5.0 kW',   capKW:5.0,   airflowM3h:1600, note:'≈ 17,060 BTU/h'},
      {id:'cas_7p0', type:'cassette', name:'FCU Cassette 7.0 kW',   capKW:7.0,   airflowM3h:2200, note:'≈ 23,884 BTU/h'},
      {id:'cas_10p0',type:'cassette', name:'FCU Cassette 10.0 kW',  capKW:10.0,  airflowM3h:3000, note:'≈ 34,120 BTU/h'},
      // Âm trần nối ống (ducted)
      {id:'duc_2p0', type:'ducted',   name:'FCU Ducted 2.0 kW',     capKW:2.0,   airflowM3h:700},
      {id:'duc_4p0', type:'ducted',   name:'FCU Ducted 4.0 kW',     capKW:4.0,   airflowM3h:1400},
      {id:'duc_6p0', type:'ducted',   name:'FCU Ducted 6.0 kW',     capKW:6.0,   airflowM3h:2100},
      {id:'duc_8p0', type:'ducted',   name:'FCU Ducted 8.0 kW',     capKW:8.0,   airflowM3h:2800},
      {id:'duc_12p0',type:'ducted',   name:'FCU Ducted 12.0 kW',    capKW:12.0,  airflowM3h:4200},
      {id:'duc_16p0',type:'ducted',   name:'FCU Ducted 16.0 kW',    capKW:16.0,  airflowM3h:5600},
      // Đứng (vertical floor-standing)
      {id:'vrt_7p5', type:'vertical', name:'FCU Đứng 7.5 kW',       capKW:7.5,   airflowM3h:2500},
      {id:'vrt_15p0',type:'vertical', name:'FCU Đứng 15.0 kW',      capKW:15.0,  airflowM3h:5000},
      {id:'vrt_20p0',type:'vertical', name:'FCU Đứng 20.0 kW',      capKW:20.0,  airflowM3h:6500},
      // AHU (Air Handling Unit) — dải công suất
      {id:'ahu_8',   type:'AHU',      name:'AHU 8 kW (nhỏ)',        capKW:8,     airflowM3h:3000,  note:'Văn phòng nhỏ'},
      {id:'ahu_15',  type:'AHU',      name:'AHU 15 kW',             capKW:15,    airflowM3h:5500},
      {id:'ahu_20',  type:'AHU',      name:'AHU 20 kW',             capKW:20,    airflowM3h:7000},
      {id:'ahu_30',  type:'AHU',      name:'AHU 30 kW',             capKW:30,    airflowM3h:10000},
      {id:'ahu_40',  type:'AHU',      name:'AHU 40 kW',             capKW:40,    airflowM3h:14000},
      {id:'ahu_50',  type:'AHU',      name:'AHU 50 kW',             capKW:50,    airflowM3h:17000},
      {id:'ahu_60',  type:'AHU',      name:'AHU 60 kW',             capKW:60,    airflowM3h:20000},
      {id:'ahu_80',  type:'AHU',      name:'AHU 80 kW',             capKW:80,    airflowM3h:27000},
      {id:'ahu_100', type:'AHU',      name:'AHU 100 kW',            capKW:100,   airflowM3h:33000},
      {id:'ahu_120', type:'AHU',      name:'AHU 120 kW',            capKW:120,   airflowM3h:40000},
      {id:'ahu_150', type:'AHU',      name:'AHU 150 kW',            capKW:150,   airflowM3h:50000},
      {id:'ahu_200', type:'AHU',      name:'AHU 200 kW',            capKW:200,   airflowM3h:65000},
      {id:'ahu_250', type:'AHU',      name:'AHU 250 kW',            capKW:250,   airflowM3h:80000},
      {id:'ahu_300', type:'AHU',      name:'AHU 300 kW',            capKW:300,   airflowM3h:100000},
      // PAU
      {id:'pau_20',  type:'PAU',      name:'PAU 20 kW (100% OA)',   capKW:20,    airflowM3h:5000},
      {id:'pau_40',  type:'PAU',      name:'PAU 40 kW (100% OA)',   capKW:40,    airflowM3h:10000},
      {id:'pau_60',  type:'PAU',      name:'PAU 60 kW (100% OA)',   capKW:60,    airflowM3h:15000},
      {id:'pau_80',  type:'PAU',      name:'PAU 80 kW (100% OA)',   capKW:80,    airflowM3h:20000},
      {id:'pau_100', type:'PAU',      name:'PAU 100 kW (100% OA)',  capKW:100,   airflowM3h:25000},
    ],

    // FAN_CATALOG — quạt thông gió/hút thải, dùng cho phòng loại VENT (thông gió thuần,
    // không làm lạnh) và các thiết bị gió thải cục bộ. Chọn theo lưu lượng (m³/h) + cột áp
    // tĩnh (Pa) thay vì công suất lạnh — khác hẳn FCU_CATALOG. Dữ liệu tổng hợp tham khảo thị
    // trường VN, không phải catalog thật của hãng nào (giống FCU_CATALOG ở trên).
    FAN_CATALOG:[
      // Quạt hướng trục nối ống (axial inline) — phổ biến cho thông gió chung, gió tươi
      {id:'ax_500',  type:'axial', name:'Quạt hướng trục nối ống 500 m³/h',  airflowM3h:500,  staticPa:100},
      {id:'ax_1000', type:'axial', name:'Quạt hướng trục nối ống 1,000 m³/h',airflowM3h:1000, staticPa:120},
      {id:'ax_2000', type:'axial', name:'Quạt hướng trục nối ống 2,000 m³/h',airflowM3h:2000, staticPa:150},
      {id:'ax_3500', type:'axial', name:'Quạt hướng trục nối ống 3,500 m³/h',airflowM3h:3500, staticPa:150},
      {id:'ax_5000', type:'axial', name:'Quạt hướng trục nối ống 5,000 m³/h',airflowM3h:5000, staticPa:180},
      // Quạt ly tâm (centrifugal) — cột áp cao hơn, dùng khi hệ ống dài/nhiều co
      {id:'cf_1000', type:'centrifugal', name:'Quạt ly tâm 1,000 m³/h',  airflowM3h:1000, staticPa:300},
      {id:'cf_2500', type:'centrifugal', name:'Quạt ly tâm 2,500 m³/h',  airflowM3h:2500, staticPa:350},
      {id:'cf_5000', type:'centrifugal', name:'Quạt ly tâm 5,000 m³/h',  airflowM3h:5000, staticPa:400},
      {id:'cf_10000',type:'centrifugal', name:'Quạt ly tâm 10,000 m³/h', airflowM3h:10000,staticPa:450},
      {id:'cf_20000',type:'centrifugal', name:'Quạt ly tâm 20,000 m³/h', airflowM3h:20000,staticPa:500},
      // Quạt hút mái (roof exhaust) — thường cho hút thải nhà xưởng, không cần cột áp cao
      {id:'rf_3000', type:'roof_exhaust', name:'Quạt hút mái 3,000 m³/h',  airflowM3h:3000, staticPa:80},
      {id:'rf_8000', type:'roof_exhaust', name:'Quạt hút mái 8,000 m³/h',  airflowM3h:8000, staticPa:100},
      {id:'rf_15000',type:'roof_exhaust', name:'Quạt hút mái 15,000 m³/h', airflowM3h:15000,staticPa:120},
      // Quạt hút tường/cửa sổ (wall/window exhaust) — công suất nhỏ, cột áp thấp, cho gió
      // thải cục bộ điểm/phòng nhỏ
      {id:'we_300',  type:'wall_exhaust', name:'Quạt hút tường 300 m³/h',  airflowM3h:300,  staticPa:50},
      {id:'we_800',  type:'wall_exhaust', name:'Quạt hút tường 800 m³/h',  airflowM3h:800,  staticPa:60},
      {id:'we_1500', type:'wall_exhaust', name:'Quạt hút tường 1,500 m³/h',airflowM3h:1500, staticPa:70},
    ],

    i18n: {
      vi: {
        app_title:'MultiHVAC Calculator', app_subtitle:'Cleanroom · Data Center · Phòng điện',
        search_hint:'Tìm nhanh',
        tab_calc:'Tính Toán', tab_admin:'Quản Lý Dự Án & DB', tab_settings:'Cài Đặt', tab_database:'Database',
        tab_ai:'Hỗ Trợ Nhanh', tab_about:'Thông Tin', tab_report:'Xuất Báo Cáo', tab_guide:'Hướng Dẫn', tab_project:'Dự Án', tab_heatload:'Phụ Tải Nhiệt',
        project_info:'Thông tin dự án',
        import_from_hl:'Import lưu lượng từ Tab Phụ Tải Nhiệt',
        customer:'Khách hàng', project_name:'Tên dự án',
        address:'Địa chỉ', performer:'Người thực hiện', exec_date:'Ngày thực hiện', version:'Phiên bản',
        room_type:'Loại phòng', cleanroom:'Phòng sạch', datacenter:'Data Center', elecroom:'Phòng điện/Tủ điện',
        save:'Lưu', calculate:'Tính toán', add_row:'Thêm dòng', delete:'Xoá', export:'Xuất', import:'Nhập',
        diagnostics:'Chẩn đoán', pass_stamp:'ĐẠT', warn_yellow:'CẢNH BÁO', fail_red:'LỖI',
        ready:'Sẵn sàng', calculating:'Đang tính...', auto_saved:'Đã tự lưu lúc',
        elec_devices_title:'Tải nhiệt thiết bị điện', branch_table_title:'Bảng nhánh ống gió',
        workshop_balance_title:'Cân bằng gió nhà xưởng (hồi/tươi/thải cục bộ/bù áp dương)',
        manage_projects:'Quản lý dự án', elec_ref_db:'Bảng tham chiếu thiết bị điện', climate_db:'Dữ liệu khí hậu',
        // Hành động chung — dùng lặp lại ở nhiều nơi trong app
        cancel:'Hủy', close:'Đóng', confirm:'Xác nhận', apply:'Áp dụng', edit:'Sửa', add:'Thêm',
        search:'Tìm kiếm', filter:'Lọc', reset:'Đặt lại', back:'Quay lại', next:'Tiếp theo',
        yes:'Có', no:'Không', loading:'Đang tải...', error:'Lỗi', warning:'Cảnh báo', success:'Thành công',
        // FAQ
        faq_intro:'Các câu hỏi thường gặp khi dùng MultiHVAC Calculator — gõ từ khóa để lọc nhanh.',
        faq_search_placeholder:'Tìm câu hỏi... VD: gió tươi, FCU, xuất báo cáo',
        faq_no_match:'Không tìm thấy câu hỏi phù hợp.',
        // Báo cáo
        report_title:'BÁO CÁO TÍNH TOÁN HVAC', report_footer_note:'Kết quả tính toán tham khảo, kỹ sư chịu trách nhiệm xác nhận trước khi thi công.',
        report_design_basis:'Cơ sở thiết kế — Tiêu chuẩn áp dụng', report_kpi_title:'KPI Tổng hợp Phụ Tải Nhiệt',
        report_room_detail:'Chi tiết phụ tải từng phòng', report_load_breakdown:'Phân tích tải nhiệt theo thành phần (toàn dự án)',
        report_equipment_schedule:'Bảng thiết bị lựa chọn (Equipment Schedule)', report_diagnostics:'Chẩn đoán & Kiểm tra',
        report_reliability:'Mức độ tin cậy thông số đầu vào', report_signoff_prepared:'NGƯỜI LẬP',
        report_signoff_checked:'KIỂM TRA', report_signoff_approved:'PHÊ DUYỆT',

        // Chuỗi ĐỘNG (có {tham số}) — phải khai báo tường minh ở CẢ vi lẫn en, xem quy ước ở
        // App.ui.t() trong app-ui.js.
        group_room_count:'{n} phòng',
        group_type_mismatch_warning:'Tên nhóm nhắc tới "{type}" nhưng đang thực sự thuộc loại "{actual}" — phòng {type} sẽ KHÔNG tìm thấy nhóm này. Kiểm tra lại ô loại hệ thống bên trên nếu đây là nhầm lẫn.',
        group_help_text:'Mỗi nhóm = 1 thiết bị (AHU/PAU/FCU/FCU+OA) phục vụ nhiều phòng — <b>nhớ chọn đúng loại hệ thống ở ô dropdown</b> (không chỉ đổi tên), vì phòng chỉ tìm được nhóm khớp CHÍNH XÁC loại hệ thống của nó. Nhóm mới tạo mặc định là AHU, đổi lại nếu cần. Gán phòng vào nhóm trong form từng phòng.',
        room_n:'Phòng {n}',
        motor_unassigned_warning:'{n} motor chưa gán phòng (nền cam) — nhiệt tỏa sẽ không được tính vào bất kỳ phòng nào!',
        para_unassigned_warning:'{n} tải ký sinh chưa gán phòng (viền cam)',
        confirm_del_parasitic_title:'Xoá tải ký sinh "{name}"?',
        confirm_del_branch_title:'Xoá nhánh "{name}"?',
        confirm_del_branch_msg_children:'Không thể hoàn tác. Nhánh này đang có {n} nhánh con — các nhánh con sẽ trở thành nhánh gốc mới, không bị xoá theo.',
        confirm_del_room_title:'Xóa phòng "{name}"?',
        confirm_del_floor_title:'Xóa {name}?',
        confirm_del_group_title:'Xoá nhóm thiết bị "{name}"?',
        confirm_del_group_rooms:'{n} phòng đang gán nhóm này sẽ mất liên kết (không bị xoá, chỉ gỡ nhóm).',
        confirm_del_group_branches:'{n} nhánh ống đang thuộc nhóm này sẽ không còn nằm trong cụm thiết bị nào ở Tab Tính Toán.',
        confirm_del_motor_title:'Xoá motor "{name}"?',
        duct_import_found_rooms:'Tìm thấy <span class="text-emerald-400 font-medium">{n} phòng</span> đã tính trong Tab Phụ Tải Nhiệt. Import lưu lượng L_cấp làm đầu vào nhánh ống chính.',
        duct_current_table_count:'Bảng ống hiện tại có {n} nhánh.',
        rooms_count_col:'Phòng',
      },
      en: {
        app_title:'MultiHVAC Calculator', app_subtitle:'Cleanroom · Data Center · Electrical Room',
        search_hint:'Quick search',
        tab_calc:'Calc', tab_admin:'Projects & Database', tab_settings:'Settings', tab_database:'Database',
        tab_ai:'Quick Help', tab_about:'About', tab_report:'Export Report', tab_guide:'User Guide', tab_project:'Project', tab_heatload:'Heat Load',
        project_info:'Project info', import_from_hl:'Import airflow from Heat Load tab',
        customer:'Customer', project_name:'Project name',
        address:'Address', performer:'Performed by', exec_date:'Date', version:'Version',
        room_type:'Room type', cleanroom:'Cleanroom', datacenter:'Data Center', elecroom:'Electrical Room',
        save:'Save', calculate:'Calculate', add_row:'Add row', delete:'Delete', export:'Export', import:'Import',
        diagnostics:'Diagnostics', pass_stamp:'PASS', warn_yellow:'WARNING', fail_red:'ERROR',
        ready:'Ready', calculating:'Calculating...', auto_saved:'Auto-saved at',
        elec_devices_title:'Electrical device heat load', branch_table_title:'Duct branch table',
        workshop_balance_title:'Workshop air balance (return/fresh/local exhaust/pressurization)',
        manage_projects:'Manage projects', elec_ref_db:'Electrical device reference table', climate_db:'Climate data',
        // Common actions — reused across many parts of the app
        cancel:'Cancel', close:'Close', confirm:'Confirm', apply:'Apply', edit:'Edit', add:'Add',
        search:'Search', filter:'Filter', reset:'Reset', back:'Back', next:'Next',
        yes:'Yes', no:'No', loading:'Loading...', error:'Error', warning:'Warning', success:'Success',
        // FAQ
        faq_intro:'Frequently asked questions about using MultiHVAC Calculator — type a keyword to filter quickly.',
        faq_search_placeholder:'Search questions... e.g. fresh air, FCU, export report',
        faq_no_match:'No matching questions found.',
        // Report
        report_title:'HVAC CALCULATION REPORT', report_footer_note:'Reference calculation results — the engineer is responsible for confirmation before construction.',
        report_design_basis:'Design Basis — Applicable Standards', report_kpi_title:'Heat Load Summary KPIs',
        report_room_detail:'Per-Room Load Detail', report_load_breakdown:'Load Analysis by Component (whole project)',
        report_equipment_schedule:'Equipment Schedule', report_diagnostics:'Diagnostics & Checks',
        report_reliability:'Input Data Reliability', report_signoff_prepared:'PREPARED BY',
        report_signoff_checked:'CHECKED BY', report_signoff_approved:'APPROVED BY',

        // ── Từ đây trở xuống: bản dịch dùng CHUỖI TIẾNG VIỆT GỐC làm key (xem quy ước ở
        // App.ui.t() trong app-ui.js) — không cần khai báo gì ở dict.vi, chỉ khai báo ở đây.
        // Nhóm theo tab để dễ tra/bổ sung.

        // Tab Dự Án
        'Thông tin dự án':'Project information', 'Tên dự án':'Project name',
        'VD: Kho lạnh thủy sản Cần Thơ':'e.g. Can Tho Seafood Cold Storage',
        'Khách hàng':'Customer', 'Tên khách hàng':'Customer name', 'Ngày lập':'Date prepared',
        'Địa chỉ công trình':'Site address', 'Địa chỉ':'Address',
        'Kỹ sư thiết kế':'Design engineer', 'Họ tên':'Full name', 'Mã dự án':'Project code',
        'Lưu thông tin dự án':'Save project info', 'Số tầng':'Floors', 'Số phòng':'Rooms',
        'tầng':'floor(s)', 'phòng':'room(s)', 'Đã tính':'Calculated', 'Q_coil tổng':'Total Q_coil',
        'Lỗi / Cảnh báo':'Errors / Warnings', 'Trung bình / phòng':'Average / room', 'kW/phòng':'kW/room',
        'Tổng hợp theo tầng':'Summary by floor', 'Tầng':'Floor', rooms_count_col:'Rooms', 'Q tổng':'Total Q',
        'TB/phòng':'Avg/room', 'Trạng thái':'Status', 'Lỗi':'Error', 'Cảnh báo':'Warning',
        'TỔNG CỘNG':'TOTAL', 'Tính tất cả phòng':'Calculate all rooms', 'Tab Phụ Tải':'Heat Load tab',
        'Xuất Báo Cáo':'Export Report', 'Đã lưu thông tin dự án':'Project info saved',

        // Tab Phụ Tải Nhiệt — Nhóm thiết bị
        'Tên AHU/PAU':'AHU/PAU name',
        'AHU (có hồi gió)':'AHU (with return air)', 'PAU (100% gió tươi)':'PAU (100% outdoor air)',
        'FCU (fan coil có gió hồi)':'FCU (fan coil with return air)',
        'FCU+OA (fan coil + gió tươi)':'FCU+OA (fan coil + outdoor air)',
        'VENT (thông gió thuần — chỉ chọn quạt, Q_coil=0)':'VENT (ventilation only — fan selection, Q_coil=0)',
        'Mô tả':'Description', 'Thêm nhóm thiết bị':'Add equipment group',
        group_room_count:'{n} room(s)',
        group_type_mismatch_warning:'Group name mentions "{type}" but is actually set to type "{actual}" — {type} rooms will NOT find this group. Check the system-type dropdown above if this is a mistake.',
        group_help_text:'Each group = 1 piece of equipment (AHU/PAU/FCU/FCU+OA) serving multiple rooms — <b>be sure to pick the correct system type in the dropdown</b> (not just the name), since a room only finds a group that EXACTLY matches its system type. New groups default to AHU — change if needed. Assign rooms to a group from each room\'s form.',
        room_n:'Room {n}',
        motor_unassigned_warning:'{n} motor(s) not assigned to a room (orange background) — their heat gain will not be counted for any room!',
        para_unassigned_warning:'{n} parasitic load(s) not assigned to a room (orange border)',
        confirm_del_parasitic_title:'Delete parasitic load "{name}"?',

        // Tab Phụ Tải Nhiệt — Mẫu Motor / Motor
        'Tên mẫu (VD: Quạt cấp AHU)':'Template name (e.g. AHU supply fan)',
        'Số lượng mặc định':'Default quantity', 'B (đơn giản)':'B (simple)',
        'Thêm vào phòng':'Add to room',
        'Mẫu Motor — khai báo spec 1 lần, gán nhanh vào nhiều phòng':'Motor templates — define a spec once, quickly assign to multiple rooms',
        'Chưa có mẫu nào. Tạo mẫu mới, hoặc bấm "💾 Lưu mẫu" trên 1 motor sẵn có bên dưới.':'No templates yet. Create one, or click "💾 Save as template" on an existing motor below.',
        'Thêm mẫu motor':'Add motor template', 'Tên motor':'Motor name',
        'Gán motor vào phòng cụ thể để tính nhiệt tải đúng':'Assign the motor to a specific room for correct heat load calculation',
        'TH1 (motor+tải trong)':'Case 1 (motor+load indoors)', 'TH2 (motor trong/tải ngoài)':'Case 2 (motor indoors/load outdoors)',
        'TH3 (tải trong/motor ngoài)':'Case 3 (load indoors/motor outdoors)',
        'Lưu spec motor này thành mẫu để tái sử dụng cho phòng khác':'Save this motor spec as a template for reuse on other rooms',
        'Gán vào phòng *':'Assign to room *', 'SL':'Qty', 'Phương pháp':'Method', 'Vị trí TH':'Case',
        'Q tỏa':'Heat gain', 'Chưa có motor. Thêm motor rồi gán vào phòng tương ứng.':'No motors yet. Add one and assign it to the corresponding room.',
        'Thêm motor':'Add motor',
        'η nội suy tuyến tính giữa các mức IEC 60034-30-1 IE3. Gán từng motor vào đúng phòng để tính nhiệt tỏa per-room.':'η is linearly interpolated between IEC 60034-30-1 IE3 levels. Assign each motor to the correct room to calculate per-room heat gain.',

        // Tab Phụ Tải Nhiệt — Tải ký sinh (field theo loại IQF/GLAZE/ICE/ROTOR)
        'L buồng(m)':'Chamber L (m)', 'U vách(W/m²K)':'Wall U (W/m²K)', 'T buồng(°C)':'Chamber T (°C)',
        'Loại cửa':'Door type',
        'Q âm = thiết bị hút nhiệt khỏi phòng ĐHKK → giảm tải (Peak Design: không trừ vào Q_coil để an toàn)':'Negative Q = equipment removes heat from the AC room → reduces load (Peak Design: not subtracted from Q_coil, for safety)',
        'S bể mạ băng(m²)':'Glazing tank area (m²)', 'T nước mạ(°C)':'Glazing water T (°C)', 'K trao đổi nhiệt':'Heat transfer coefficient K',
        'Sản lượng đá(kg/h)':'Ice output (kg/h)', 'T nước đầu ra(°C)':'Outlet water T (°C)',
        'G_gió(m³/h)':'Air flow (m³/h)', 'T vào Rotor(°C)':'Rotor inlet T (°C)', 'T ra Rotor(°C)':'Rotor outlet T (°C)',
        'Rotor tỏa nhiệt vào phòng → tải dương, cộng vào Q_sensible phòng được gán.':'Rotor releases heat into the room → positive load, added to the assigned room\'s Q_sensible.',

        // Tab Phụ Tải Nhiệt — Mẫu tải ký sinh / Tải ký sinh
        'Tên mẫu':'Template name',
        'Chưa có mẫu nào. Tạo mẫu mới, hoặc bấm "💾 Lưu mẫu" trên 1 tải ký sinh sẵn có bên dưới.':'No templates yet. Create one, or click "💾 Save as template" on an existing parasitic load below.',
        'Mẫu tải ký sinh — khai báo 1 lần, gán nhanh vào nhiều phòng':'Parasitic-load templates — define once, quickly assign to multiple rooms',
        'Thêm mẫu tải ký sinh':'Add parasitic-load template', 'Chưa gán phòng':'Not assigned to a room',
        'Tên thiết bị':'Equipment name', 'Gán vào phòng':'Assign to room',
        'lạnh ký sinh':'parasitic cooling', 'nhiệt tỏa':'heat gain',
        'Lưu tải ký sinh này thành mẫu để tái sử dụng cho phòng khác':'Save this parasitic load as a template for reuse on other rooms',
        'Thêm tải ký sinh':'Add parasitic load',
        'Tải ký sinh trong phòng ĐHKK nhà máy chế biến: IQF/mạ băng/đá vảy hút nhiệt (âm) → giảm tải ĐHKK. Rotor tỏa nhiệt (dương). Peak Design: không trừ tải âm (conservative).':'Parasitic loads in industrial AC rooms: IQF/glazing/ice flake units remove heat (negative) → reduce the AC load. Rotor releases heat (positive). Peak Design: negative loads are not subtracted (conservative).',
        'Không thể hoàn tác.':'This cannot be undone.', 'Xoá tải ký sinh':'Delete parasitic load', 'này':'this',

        // Xác nhận trước khi xoá (branch/room/floor/group/motor)
        confirm_del_branch_title:'Delete branch "{name}"?',
        confirm_del_branch_msg_children:'This cannot be undone. This branch currently has {n} child branch(es) — the children will become new root branches, they will not be deleted.',
        confirm_del_room_title:'Delete room "{name}"?',
        confirm_del_floor_title:'Delete {name}?',
        confirm_del_group_title:'Delete equipment group "{name}"?',
        confirm_del_group_rooms:'{n} room(s) assigned to this group will lose that link (not deleted, just unassigned).',
        confirm_del_group_branches:'{n} duct branch(es) in this group will no longer belong to any equipment cluster in the Calc tab.',
        confirm_del_motor_title:'Delete motor "{name}"?',
        'Xoá nhánh':'Delete branch', 'Xóa phòng':'Delete room', 'tầng này':'this floor',
        'Xóa tầng & phòng':'Delete floor & rooms', 'Toàn bộ phòng thuộc tầng này cũng bị xóa.':'All rooms on this floor will also be deleted.',
        'Xoá nhóm':'Delete group', 'Xoá motor':'Delete motor',
        'Nhiệt tỏa của motor này sẽ không còn được tính vào phòng nào.':'This motor\'s heat gain will no longer be counted for any room.',
        'Không thể hoàn tác. Nhiệt tỏa của motor này sẽ không còn được tính vào phòng nào.':'This cannot be undone. This motor\'s heat gain will no longer be counted for any room.',

        // Tiêu đề panel (App.ui.panelShell titleKey — đã tự động đi qua t(), chỉ cần khai báo
        // bản dịch, không cần sửa code UI)
        'Export / Import dữ liệu dự án':'Export / Import project data',
        'Catalog thiết bị (AHU/FCU/PAU)':'Equipment catalog (AHU/FCU/PAU)',
        'Danh mục loại phòng & Nhóm áp suất':'Room type & pressure group catalog',
        'Vật liệu: Tường / Vách':'Materials: Wall / Partition', 'Vật liệu: Kính':'Materials: Glass',
        'Vật liệu: Ống gió (tôn kẽm/inox...)':'Materials: Ductwork (galvanized steel/stainless...)',
        'Vật liệu: Cách nhiệt':'Materials: Insulation', 'Vật liệu: Cửa':'Materials: Doors',
        'Điều kiện khí hậu thiết kế':'Design climate conditions',
        'Nhóm thiết bị (AHU / PAU)':'Equipment groups (AHU / PAU)',
        'Tải Ký Sinh (IQF / Mạ băng / Đá vảy / Rotor)':'Parasitic Loads (IQF / Glazing / Ice Flake / Rotor)',
        'Hủy':'Cancel', 'Xác nhận':'Confirm',

        // Tab Tính Toán — Import từ Phụ Tải Nhiệt
        duct_import_found_rooms:'Found <span class="text-emerald-400 font-medium">{n} room(s)</span> calculated in the Heat Load tab. Import their supply airflow as the main duct branch input.',
        duct_current_table_count:'The current duct table has {n} branch(es).',
        'Tính toán Tab "Phụ Tải Nhiệt" trước để import lưu lượng tự động. Hoặc nhập tay Q (m³/h) cho từng nhánh ống trong bảng bên dưới.':'Calculate the Heat Load tab first to import airflow automatically. Or manually enter Q (m³/h) for each duct branch in the table below.',
        'Phòng':'Room', 'Loại TB':'Equip. type', 'L_tươi':'L_fresh', 'L_hồi':'L_return',
        'Thêm nhánh ống nhanh theo thiết bị:':'Quick-add a duct branch per equipment:', 'Nhánh ống':'Duct branch',
        'Import thêm vào bảng ống hiện tại':'Import and append to the current duct table',
        'Thay thế toàn bộ bảng ống':'Replace the entire duct table',

        // Tab Tính Toán — Bảng nhánh ống (cây nhánh)
        '(Ống gốc / Root)':'(Root duct)', 'Nhánh {n}':'Branch {n}', 'Tên nhánh':'Branch name',
        'Thêm nhánh con dưới nhánh này':'Add a child branch under this one',
        'Thông tin chung (vật liệu/cách nhiệt/lọc...)':'General info (material/insulation/filter...)',
        'Loại ống':'Duct type', 'Chính':'Main', 'Nhánh':'Branch',
        'Chưa tính được':'Could not calculate',
        'Kích thước':'Dimensions', 'ΔP ma sát':'ΔP friction', 'ΔP cục bộ':'ΔP local', 'ΔP tích lũy':'ΔP cumulative',
        'Đọng sương':'Condensation risk', 'Có':'Yes',
        'Thông tin chung (thiết bị, vật liệu, cách nhiệt, lọc...)':'General info (equipment, material, insulation, filter...)',
        'Thiết bị (nhóm)':'Equipment (group)', '-- Chung --':'-- General --',
        'Nhánh cha (Parent) — chỉ cần khi sửa cấu trúc cây thủ công':'Parent branch — only needed for manual tree structure edits',
        'Hình dạng':'Shape', 'Chữ nhật':'Rectangular', 'Tròn':'Round', 'Vật liệu ống':'Duct material',
        'Chọn nhanh preset Σζ phụ kiện điển hình':'Quick-select a typical fitting Σζ preset', 'Preset Σζ':'Σζ preset',
        'Đơn giản (0.3)':'Simple (0.3)', 'Tiêu chuẩn (0.8)':'Standard (0.8)',
        'Nhiều cút (1.5)':'Many elbows (1.5)', 'Rất phức tạp (2.5)':'Very complex (2.5)',
        '1 cút 90° R/D=1.5 ≈ 0.17, tê nhánh ≈ 0.75, damper mở ≈ 0.20, diffuser ≈ 2.5':'1x 90° elbow R/D=1.5 ≈ 0.17, branch tee ≈ 0.75, open damper ≈ 0.20, diffuser ≈ 2.5',
        'Σζ phụ kiện':'Fitting Σζ', 'Cách nhiệt':'Insulation', 'Dày cách nhiệt (mm)':'Insulation thickness (mm)',
        'T môi trường (°C)':'Ambient T (°C)', 'Lọc (nếu ống này qua bộ lọc)':'Filter (if this duct passes through a filter)',
        '(Không)':'(None)',
        'Chung / chưa gán thiết bị':'General / no equipment assigned', 'Thiết bị đã bị xoá':'Equipment deleted',
        '{n} nhánh gốc':'{n} root branch(es)', '+ nhánh gốc':'+ root branch',
        'Chưa có nhánh ống. Thêm thủ công hoặc Import từ Tab Phụ Tải Nhiệt.':'No duct branches yet. Add manually or import from the Heat Load tab.',
        'Critical path (nhánh màu cam):':'Critical path (orange branch):',
        '{n} Pa tích lũy':'{n} Pa cumulative',
        'Đây là tổn thất áp thiết kế cho fan (ESP)':'This is the design pressure loss for fan selection (ESP)',
        'Thêm nhánh ống':'Add duct branch',
        'Ống chính:':'Main duct:', 'Ống nhánh:':'Branch duct:', 'Trước lọc:':'Before filter:',
        'Σζ điển hình:':'Typical Σζ:', 'Critical path = ESP thiết kế quạt':'Critical path = fan design ESP',

        // Tab Phụ Tải Nhiệt — Room Drawer (form chi tiết từng phòng)
        'Chưa có phòng. Bấm "Thêm phòng".':'No rooms yet. Click "Add room".',
        '(Phòng {n})':'(Room {n})',
        'Q_cấp':'Q_supply', 'Q_tươi':'Q_fresh', 'Q_tuần hoàn':'Q_recirculation', 'Q_bù áp':'Q_pressurization',
        'ACH thực':'Actual ACH', 'đơn hướng':'unidirectional', 'Gió tươi:':'Fresh air:',
        'Chọn loại công trình/phòng — tự động điền preset ACH, ΔP, gió tươi, thiết bị':'Select building/room type — auto-fills ACH, ΔP, fresh air, equipment presets',
        'Loại công trình / Loại phòng *':'Building type / Room type *', 'Chọn loại công trình':'Select building type',
        'NHÓM A — Phòng kỹ thuật đặc thù':'GROUP A — Specialized technical rooms',
        'NHÓM B — Dân dụng / Thương mại':'GROUP B — Residential / Commercial',
        'Y tế / Bệnh viện':'Healthcare / Hospital', 'Công nghiệp / Sản xuất':'Industrial / Manufacturing',
        'Phụ trợ / Vệ sinh / Logistics':'Auxiliary / Sanitary / Logistics',
        'Phòng tự thêm (Database)':'Custom rooms (Database)', 'Loại hệ thống ĐHKK':'AC system type',
        'Chưa chọn loại công trình. Chọn để auto-fill ACH, ΔP, gió tươi, thiết bị gợi ý.':'No building type selected. Choose one to auto-fill ACH, ΔP, fresh air, and suggested equipment.',
        'Nhóm áp dương':'Positive pressure group', 'Nhóm áp trung hòa':'Neutral pressure group', 'Nhóm áp âm':'Negative pressure group',
        'người':'person', 'Chiếu sáng:':'Lighting:', 'Hệ thống đề xuất:':'Recommended system:',
        'Gió thải cục bộ:':'Local exhaust:', 'cần bổ sung tại thiết bị phát sinh':'needs to be added at the source equipment',
        'nhập lưu lượng thực tế ở mục Gió thải cục bộ':'enter the actual airflow in the Local Exhaust section',
        'Tên phòng / Mã phòng':'Room name / code', 'Tên phòng':'Room name', 'Thuộc nhóm thiết bị':'Equipment group',
        'Chưa gán nhóm {equip}{count}':'No {equip} group assigned{count}',
        'có {n} nhóm khả dụng bên dưới':'{n} group(s) available below',
        'Thông số ACH / Chênh áp — lấy mặc định theo loại phòng, có thể ghi đè':'ACH / Pressure differential — defaults by room type, can be overridden',
        'Hệ thống tiêu chuẩn':'Standard system', 'Cấp độ sạch':'Cleanliness class', 'ACH áp dụng (h⁻¹)':'Applied ACH (h⁻¹)',
        'Dòng đơn hướng: nhập diện tích mặt cấp bên dưới':'Unidirectional flow: enter the supply face area below',
        'ΔP thiết kế (Pa)':'Design ΔP (Pa)', 'Min theo tiêu chuẩn:':'Standard minimum:',
        'Diện tích mặt cấp gió (m²)':'Supply face area (m²)', 'Vận tốc mặt cấp (m/s)':'Face velocity (m/s)',
        'Bù áp suất dương — chọn phương pháp tính lưu lượng makeup':'Positive pressurization — choose the makeup airflow method',
        'Theo thể tích phòng (ACH)':'By room volume (ACH)', 'Theo rò rỉ qua khe cửa':'By door-gap leakage',
        'ACH bù áp (h⁻¹)':'Pressurization ACH (h⁻¹)', 'Khe hở cửa (mm)':'Door gap (mm)',
        'Số lượng':'Quantity', 'bộ':'unit(s)', 'Xóa cửa này':'Delete this door', 'Thêm cửa':'Add door',
        'Hình dạng phòng':'Room shape', 'Chữ nhật (L×W)':'Rectangular (L×W)',
        'Lục giác (6 cạnh, ×0.866)':'Hexagon (6 sides, ×0.866)', 'Bát giác (8 cạnh, ×0.828)':'Octagon (8 sides, ×0.828)',
        'Nhập trực tiếp S sàn':'Enter floor area directly', 'Diện tích sàn (m²)':'Floor area (m²)',
        'Dài L (m)':'Length L (m)', 'Rộng W (m)':'Width W (m)', 'Cao trần H (m)':'Ceiling height H (m)',
        'Loại tường ngoài (auto-fill U)':'Exterior wall type (auto-fills U)',
        'Chọn hoặc tự nhập U bên dưới':'Select or enter U manually below',
        'U vách (W/m²K)':'Wall U (W/m²K)', 'S vách nóng (m²)':'Warm wall area (m²)', 'Vách tiếp xúc với':'Wall faces',
        'Ngoài trời (×1.0)':'Outdoors (×1.0)', 'Phòng KĐH (×0.6)':'Unconditioned room (×0.6)', 'Gian giữa (×0.3)':'Intermediate space (×0.3)',
        'Kính & Bức xạ mặt trời':'Glass & Solar Radiation', 'nhấp để mở':'click to expand',
        'S kính (m²)':'Glass area (m²)', 'Loại kính — auto-fill SHGC+U':'Glass type — auto-fills SHGC+U',
        'Tự nhập SHGC/U bên dưới':'Enter SHGC/U manually below',
        'U kính (W/m²K)':'Glass U (W/m²K)', 'SC — Hệ số che nắng':'SC — Shading coefficient',
        'Không che (1.0)':'No shading (1.0)', 'Rèm ngoài (0.8)':'Outdoor curtain (0.8)', 'Lam ngang (0.6)':'Horizontal louvers (0.6)',
        'CLF — Hệ số tải bức xạ':'CLF — Cooling load factor', 'Đỉnh trưa (0.7)':'Midday peak (0.7)',
        'TB ngày (0.55)':'Daily average (0.55)', 'Sáng/chiều (0.5)':'Morning/afternoon (0.5)',
        'Số người':'Number of people', 'Mức lao động':'Activity level', 'Gió tươi (L/s/người)':'Fresh air (L/s/person)',
        'LPD đèn (W/m²)':'Lighting LPD (W/m²)',
        'Mái (Roof Load — CLTD Method)':'Roof (Roof Load — CLTD Method)', 'Phòng có mái tiếp xúc trực tiếp':'Room has a directly exposed roof',
        'Loại mái':'Roof type', 'Diện tích mái (m²) — 0=tự tính từ L×W':'Roof area (m²) — 0 = auto-calculate from L×W',
        'Q_mái':'Q_roof', 'Phòng ở tầng trung, mái đã tính qua aWall.':'Mid-floor room — roof load already covered via aWall.',
        'Sàn (Floor Load — tiếp đất hoặc tiếp không gian lạnh)':'Floor (Floor Load — on-grade or adjacent to a cold space)',
        'Sàn tiếp đất / tiếp không gian lạnh bên dưới':'Floor on-grade / adjacent to a cold space below',
        'T đất / T bên dưới (°C)':'Ground T / T below (°C)', 'U sàn (W/m²K)':'Floor U (W/m²K)', 'Q_sàn':'Q_floor',
        'VN: T_đất TB ~28°C (sâu). Sàn thường: U≈0.8 W/m²K (bê tông+ceramic). Kho mát: T_đất = T phòng kề.':'VN: average ground T ~28°C (deep). Typical floor: U≈0.8 W/m²K (concrete+ceramic). Cold store: ground T = adjacent room T.',
        'Sàn lửng hoặc trên tầng khác — không tính tải sàn.':'Suspended floor or upper floor — no floor load counted.',
        'Gió thải cục bộ từ thiết bị':'Local exhaust from equipment',
        'Phòng có thiết bị hút thải cục bộ (chụp hút bếp, lò nướng, máy hấp, tủ hàn, hút khói gas...)':'Room has local exhaust equipment (kitchen hood, oven, steamer, welding booth, gas fume extraction...)',
        'Tên thiết bị (VD: Chụp hút lò nướng #1)':'Equipment name (e.g. Oven hood #1)',
        'Lưu lượng hút (m³/h/thiết bị)':'Exhaust flow (m³/h/unit)', 'Xóa thiết bị này':'Delete this equipment',
        'Thêm thiết bị':'Add equipment', 'Tổng gió thải cục bộ:':'Total local exhaust:',
        'Gió tươi bù thay thế':'Makeup fresh air handling',
        'Xử lý nhiệt qua AHU/PAU chính — cộng vào gió tươi hệ thống, có tính tải lạnh':'Conditioned via the main AHU/PAU — added to system fresh air, counted in the cooling load',
        'Bù thuần túy (quạt cấp bù riêng) — chỉ cân bằng áp suất, KHÔNG tính vào tải lạnh':'Raw makeup only (dedicated supply fan) — pressure balancing only, NOT counted in the cooling load',
        'Gió bù cấp thẳng gần điểm hút, không qua coil — tiết kiệm năng lượng nhưng không kiểm soát nhiệt độ/độ ẩm của luồng gió này.':'Makeup air is supplied directly near the extraction point, bypassing the coil — saves energy, but temperature and humidity of this airflow are not controlled.',
        'Gió bù được xử lý cùng hệ thống điều hòa chính — cộng vào Q_tươi và ảnh hưởng Q_coil.':'Makeup air is conditioned together with the main AC system — added to Q_fresh and affects Q_coil.',
        'Không tick nếu phòng không có thiết bị hút thải cục bộ.':'Leave unchecked if the room has no local exhaust equipment.',
        'T cấp thiết kế (°C)':'Design supply T (°C)', 'thiết bị OA riêng':'dedicated OA unit',
        'RH cấp (%)':'Supply RH (%)', 'ESP quạt (Pa)':'Fan ESP (Pa)',
        'Data Center — ASHRAE TC9.9 2021 (lưu lượng tính từ tải IT, không theo ACH)':'Data Center — ASHRAE TC9.9 2021 (airflow sized from IT load, not ACH)',
        'Profile DC (tham chiếu nhanh)':'DC profile (quick reference)', 'Tự nhập':'Manual entry',
        'Mật độ tải IT (kW/m²)':'IT load density (kW/m²)',
        'Tải nhiệt nội bộ — Thiết bị điện /':'Internal heat load — Electrical devices /', 'Tủ điện động lực':'Power distribution panel',
        'Tổng nhiệt tản vào phòng từ VFD, tủ MCC, biến áp, UPS, PLC...':'Total heat dissipated into the room from VFDs, MCC panels, transformers, UPS, PLCs...',
        'Nhiệt kW = P_định_mức × Hệ_số_tải × (1 − η)':'Heat kW = P_rated × Load_factor × (1 − η)',
        'P định mức (kW)':'Rated P (kW)', 'H/s tải (0-1)':'Load factor (0-1)', 'Q tản (kW)':'Q dissipated (kW)',
        'thêm vào Q_room':'added to Q_room',
        'Nhà vệ sinh — ASHRAE 62.1-2022 §6.2.7 (exhaust theo số thiết bị)':'Restroom — ASHRAE 62.1-2022 §6.2.7 (exhaust sized by fixture count)',
        'Số bệt xí (bộ)':'Toilets (units)', 'Số bồn tiểu (bộ)':'Urinals (units)', 'Số phòng tắm':'Showers',
        'Hệ thống exhaust-only. Makeup từ hành lang qua cửa khe hở. Không cần AHU riêng.':'Exhaust-only system. Makeup air comes from the corridor through door gaps. No dedicated AHU needed.',
        'Bếp công nghiệp — Capture velocity method (ASHRAE App Ch.31 + NFPA 96)':'Commercial kitchen — Capture velocity method (ASHRAE App Ch.31 + NFPA 96)',
        'Chiều rộng chụp (m)':'Hood width (m)', 'Chiều sâu chụp (m)':'Hood depth (m)', 'Loại thiết bị bếp':'Kitchen equipment type',
        'Nhẹ (steamer, oven) — 0.3 m/s':'Light (steamer, oven) — 0.3 m/s',
        'Trung bình (gas range) — 0.45 m/s':'Medium (gas range) — 0.45 m/s',
        'Nặng (broiler, fryer) — 0.55 m/s':'Heavy (broiler, fryer) — 0.55 m/s',
        'Rất nặng (solid fuel) — 0.65 m/s':'Extra heavy (solid fuel) — 0.65 m/s',
        'Phòng mổ OR — ASHRAE 170:2021 (áp dương ≥+15 Pa)':'Operating room OR — ASHRAE 170:2021 (positive pressure ≥+15 Pa)',
        'Phòng cách ly — ASHRAE 170:2021 (áp âm ≤-8 Pa)':'Isolation room — ASHRAE 170:2021 (negative pressure ≤-8 Pa)',
        '{a} ACH tổng, {b} ACH gió tươi':'{a} ACH total, {b} ACH fresh air',
        'ACH tối thiểu:':'Minimum ACH:', 'Áp suất:':'Pressure:',
        '≥+15 Pa vs hành lang':'≥+15 Pa vs corridor', '≤-8 Pa vs hành lang':'≤-8 Pa vs corridor',
        'Lọc:':'Filter:', 'HEPA H14 (99.995%) tại cấp gió vào phòng':'HEPA H14 (99.995%) at the supply air entering the room',
        'Vách ngăn nội bộ — Q kề phòng nhiệt độ khác':'Internal partition — Q from adjacent rooms at different temperatures',
        'quan trọng với nhà máy đa zone':'important for multi-zone facilities', 'Thêm vách ngăn':'Add partition',
        'Chưa có vách ngăn nội bộ. Thêm nếu phòng này kề phòng/khu vực có nhiệt độ khác.':'No internal partitions yet. Add one if this room is adjacent to a room/area at a different temperature.',
        'Phòng?':'Room?', 'Vật liệu vách':'Wall material', 'Tự nhập U':'Enter U manually',
        'S vách ngăn (m²)':'Partition area (m²)', 'Phía kề':'Adjacent side',
        'Nhập T (°C)':'Enter T (°C)', 'Chọn phòng':'Select room', 'Chọn phòng kề':'Select adjacent room',
        'T kề (°C)':'Adjacent T (°C)',
        'Q âm = tải lạnh (phòng kề lạnh hơn). Q dương = tải nhiệt (phòng kề nóng hơn). Nguồn: ASHRAE HOF 2021 Ch.18 §18.3':'Negative Q = cooling load (adjacent room is colder). Positive Q = heating load (adjacent room is warmer). Source: ASHRAE HOF 2021 Ch.18 §18.3',
        'Công cụ tính U từ cấu tạo lớp thực tế (δ/λ) — Nguồn: ASHRAE HOF 2021 / ISO 6946:2017':'U-value calculator from actual layer construction (δ/λ) — Source: ASHRAE HOF 2021 / ISO 6946:2017',
        'h_o=23.3 W/m²K (gió), h_i=11.6 W/m²K (tĩnh)':'h_o=23.3 W/m²K (windy), h_i=11.6 W/m²K (still air)',
        'Gạch, bê tông':'Brick, concrete', 'Vữa':'Mortar', 'Hoàn thiện':'Finish',
        'Kim loại, kính':'Metal, glass', 'Khe không khí':'Air gap',
        'Độ dày':'Thickness', 'Thêm lớp':'Add layer', 'Áp dụng U này':'Apply this U',
        'AHU/PAU: Q_tươi xử lý qua mixing point. FCU: Q_tươi cộng thẳng Q_phòng. VENT: Q_coil=0.':'AHU/PAU: Q_fresh is processed through the mixing point. FCU: Q_fresh is added directly to Q_room. VENT: Q_coil=0.',

        // Xuất Báo Cáo — buildPreviewHtml()
        'Khách hàng:':'Customer:', 'Dự án:':'Project:', 'Địa chỉ:':'Address:', 'Kỹ sư thiết kế:':'Design engineer:',
        'Ngày:':'Date:', 'Mã dự án:':'Project code:', 'Điều kiện thiết kế:':'Design conditions:',
        'Ngoài':'Outdoor', 'Trong':'Indoor', 'Cao độ':'Elevation',
        'Dữ liệu khí hậu tỉnh <b>{province}</b> được MƯỢN từ trạm <b>{station}</b> do QCVN 02:2022/BXD không có trạm khí tượng riêng cho tỉnh này.':'Climate data for <b>{province}</b> province was BORROWED from the <b>{station}</b> station since QCVN 02:2022/BXD has no dedicated weather station for this province.',
        '{n} vách ngăn nội bộ đang dùng giá trị mặc định (U và/hoặc nhiệt độ phòng kề chưa nhập cụ thể) — xem chi tiết ở bảng Chẩn đoán &amp; Kiểm tra bên dưới.':'{n} internal partition(s) are using default values (U and/or adjacent room temperature not entered specifically) — see the Diagnostics &amp; Checks table below for details.',
        '{n} phòng đã khai báo có gió thải cục bộ nhưng chưa nhập đủ lưu lượng thiết bị.':'{n} room(s) declared local exhaust but the equipment airflow has not been fully entered.',
        '{n}/{total} phòng đang dùng ACH mặc định theo loại phòng (achDefault) — chưa được kỹ sư điều chỉnh riêng theo điều kiện thực tế dự án.':'{n}/{total} room(s) are using the default ACH for their room type (achDefault) — not yet adjusted by the engineer for actual project conditions.',
        'Catalog thiết bị (FCU/AHU/PAU) trong app là dữ liệu tổng hợp tham khảo, không phải catalog thật của hãng nào — cần kỹ sư xác nhận với nhà sản xuất trước khi lên đơn hàng.':'The equipment catalog (FCU/AHU/PAU) in the app is aggregated reference data, not a real catalog from any manufacturer — the engineer must confirm with the manufacturer before ordering.',
        'CẦN THẬN TRỌNG':'CAUTION', 'TRUNG BÌNH':'MODERATE', 'CAO':'HIGH',
        'Mức độ tin cậy thông số đầu vào:':'Input data reliability:',
        'có dùng giá trị mặc định/tham khảo, khuyến nghị đối chiếu kỹ trước khi dùng cho hồ sơ chính thức.':'default/reference values were used — cross-check carefully before use in an official design package.',
        'phần lớn thông số đã được nhập cụ thể cho dự án này.':'most parameters have been entered specifically for this project.',
        'Tổng lạnh coil':'Total coil cooling', 'Tổng gió cấp':'Total supply air', 'Tổng gió tươi':'Total fresh air',
        'Kw/m² sàn':'kW/m² floor',
        'Tổng gió thải cục bộ (thiết bị)':'Total local exhaust (equipment)',
        'Trong đó gió bù thuần túy (không qua coil)':'Of which raw makeup air (bypassing the coil)',
        'S.sàn(m²)':'Floor area(m²)', 'L_cấp(m³/h)':'L_supply(m³/h)', 'Q_hiện(kW)':'Q_sensible(kW)', 'Q_ẩn(kW)':'Q_latent(kW)',
        'Chưa có dữ liệu':'No data yet', 'Tổng cộng':'Total',
        '{n} phòng':'{n} room(s)',
        'Q1 Vách/tường':'Q1 Wall', 'Q2 Mái':'Q2 Roof', 'Q3 Kính/bức xạ':'Q3 Glass/solar', 'Q4 Người':'Q4 People',
        'Q5 Chiếu sáng':'Q5 Lighting', 'Q6 Gió tươi (FCU thường)':'Q6 Fresh air (standard FCU)',
        'Q7 Vách ngăn nội bộ':'Q7 Internal partitions', 'Hạng mục':'Item',
        'Tổng tải phòng (trước hệ số an toàn thiết bị)':'Total room load (before equipment safety factor)',
        '* Bảng này là tổng tải nhiệt PHÒNG theo từng thành phần (ASHRAE Fundamentals Ch.18) — không nhất thiết bằng Tổng lạnh coil (Q_coil) ở trên, vì Q_coil của hệ AHU/PAU tính theo phương pháp enthalpy lưu lượng gió (không cộng thẳng tải phòng), và Q_coil còn gồm cả tải motor/thiết bị điện chưa tách theo phòng ở đây.':'* This table is the total ROOM heat load by component (ASHRAE Fundamentals Ch.18) — not necessarily equal to the Total coil cooling (Q_coil) above, since AHU/PAU Q_coil is calculated via the airflow enthalpy method (not a direct sum of room loads), and Q_coil also includes motor/electrical device loads not broken out by room here.',
        'VENT — không cần coil':'VENT — no coil needed', 'Loại HT':'System type', 'Model đề xuất':'Suggested model',
        'Tổng CS(kW)':'Total capacity(kW)', 'H.suất SD':'Utilization', 'Tổng công suất thiết bị':'Total equipment capacity',
        'Model đề xuất tham khảo catalog thị trường VN — kỹ sư cần xác nhận với nhà sản xuất trước khi chọn thiết bị chính thức.':'Suggested models reference the VN market catalog — the engineer must confirm with the manufacturer before finalizing equipment selection.',
        'VENT (thông gió chính)':'VENT (main ventilation)', 'Gió thải cục bộ':'Local exhaust',
        'Không tìm được quạt phù hợp trong catalog tham khảo — chọn thủ công':'No suitable fan found in the reference catalog — select manually',
        'Bảng quạt thông gió / gió thải cục bộ':'Ventilation Fan / Local Exhaust Schedule',
        'Mục đích':'Purpose', 'Lưu lượng(m³/h)':'Flow(m³/h)', 'Cột áp(Pa)':'Static pressure(Pa)',
        'Model quạt đề xuất':'Suggested fan model', 'Tổng lưu lượng quạt':'Total fan airflow',
        'Model quạt tham khảo catalog thị trường VN, cột áp là giá trị mặc định/ước tính (chưa tính tổn thất ma sát ống gió chi tiết) — kỹ sư cần xác nhận cột áp thực tế theo bảng nhánh ống gió và xác nhận model với nhà sản xuất trước khi chọn thiết bị chính thức.':'Fan models reference the VN market catalog; static pressure is a default/estimated value (detailed duct friction loss not included) — the engineer must confirm actual static pressure from the duct branch table and confirm the model with the manufacturer before finalizing equipment selection.',
        'ΔP ma sát(Pa)':'ΔP friction(Pa)', 'Đạt':'Pass',
        'Diện tích sàn hợp lệ (đã nhập L×W hoặc diện tích tuỳ chỉnh)':'Valid floor area (L×W or custom area entered)',
        'Gió hồi không âm (Q_hồi ≥ 0)':'Non-negative return air (Q_return ≥ 0)',
        'ACH nằm trong dải khuyến nghị theo loại phòng':'ACH within the recommended range for the room type',
        'ACH áp dụng ≥ khuyến nghị tối thiểu':'Applied ACH ≥ recommended minimum',
        'ACH gió tươi đạt yêu cầu riêng (phòng y tế theo ASHRAE 170, nếu có)':'Fresh-air ACH meets special requirements (healthcare rooms per ASHRAE 170, if applicable)',
        'Gió tươi đạt yêu cầu tối thiểu ASHRAE 62.1 (theo người/diện tích)':'Fresh air meets the ASHRAE 62.1 minimum requirement (per person/area)',
        'Motor không chạy non tải (FL ≥ 0.5)':'Motor not underloaded (FL ≥ 0.5)',
        'Vách ngăn nội bộ — đủ dữ liệu U/nhiệt độ phòng kề (không dùng mặc định)':'Internal partitions — sufficient U/adjacent-temperature data (not using defaults)',
        'Khác':'Other', 'Kết quả':'Result', '(Ký, ghi rõ họ tên)':'(Signature, full name)',
        'Tạo bởi:':'Created by:', 'Toàn bộ dự án':'Entire project', 'Đang tạo PDF...':'Generating PDF...',

        // Tab Cài Đặt / Tab Thông Tin
        'Hệ đơn vị':'Unit system', 'Phiên bản hiện tại tính theo SI':'Current version calculates in SI',
        'Chuyển đơn vị IP (CFM, in.w.g, °F) sẽ bổ sung ở phiên bản kế tiếp — toàn bộ công thức hiện hành tính theo SI.':'IP unit support (CFM, in.w.g, °F) will be added in a future version — all current formulas use SI.',
        'MultiHVAC Calculator hỗ trợ tính chọn lưu lượng gió, ống gió và thiết bị AHU/FCU/CRAC cho 3 môi trường: Phòng sạch, Data Center, Phòng điện/Tủ điện.':'MultiHVAC Calculator helps size airflow, ductwork, and AHU/FCU/CRAC equipment for 3 environments: Cleanroom, Data Center, and Electrical Room.',
        'Tiêu chuẩn áp dụng':'Applicable standards', 'Phòng sạch':'Cleanroom',
        'Thông gió, điều hoà không khí':'Ventilation, air conditioning', 'Số liệu khí hậu xây dựng':'Construction climate data',

        // Tab Quản Lý Dự Án & DB — Admin
        'Tạo/quản lý dự án trong':'Create/manage projects in',
        'Dùng Export/Import để sao lưu hoặc chuyển dự án hiện tại giữa các máy.':'Use Export/Import to back up or move the current project between machines.',
        'Loại':'Type', 'VD: FWD-T18':'e.g. FWD-T18', 'Lưu lượng (m³/h)':'Airflow (m³/h)',
        'Nhà sản xuất':'Manufacturer', 'Ghi chú':'Note', 'Lưu lượng':'Airflow', 'Nhà SX':'Manufacturer',
        'Chưa có thiết bị. Điền form phía trên để thêm.':'No equipment yet. Fill in the form above to add one.',
        'tự thêm':'custom', 'đã ẩn':'hidden', '—(theo TB)':'—(per fixture)', 'có':'yes',
        'Xóa hẳn (phòng tự thêm)':'Delete permanently (custom room type)', 'Khôi phục':'Restore',
        'Ẩn khỏi dropdown chọn':'Hide from selection dropdown',
        'Gió tươi':'Fresh air', 'Gió thải<br>cục bộ':'Local<br>exhaust', 'Nguồn chuẩn':'Standard source',
        'VD: Phòng lưu trữ hồ sơ':'e.g. Document storage room', 'Nhóm áp suất':'Pressure group',
        'Dương':'Positive', 'Trung hòa':'Neutral', 'Âm':'Negative', 'ACH mặc định':'Default ACH',
        'Có gió thải cục bộ':'Has local exhaust',
        'Nhóm theo dấu ΔP thiết kế. "Ẩn" với phòng có sẵn chỉ gỡ khỏi dropdown chọn — không xóa dữ liệu gốc, phòng đã tạo trước đó vẫn tính đúng.':'Grouped by the sign of the design ΔP. "Hide" for a built-in room type only removes it from the selection dropdown — it does not delete the original data, and rooms created earlier still calculate correctly.',
        'Xóa hẳn (tự thêm)':'Delete permanently (custom)',
        '"Ẩn" với vật liệu có sẵn chỉ gỡ khỏi dropdown chọn — không xóa dữ liệu gốc, phòng/hạng mục đã dùng vật liệu này vẫn tính đúng.':'"Hide" for a built-in material only removes it from the selection dropdown — it does not delete the original data; rooms/items already using this material still calculate correctly.',
        'Tên vật liệu':'Material name', 'Nhóm CLTD':'CLTD group', 'Tên loại kính':'Glass type name',
        'Độ nhám ε (mm)':'Roughness ε (mm)', 'Cấp rò khí':'Air leakage class', 'T max (°C)':'Max T (°C)',
        'Tên cửa':'Door name', 'Rộng (mm)':'Width (mm)', 'Cao (mm)':'Height (mm)', 'Loại gioăng':'Seal type',
        'A khe (m²)':'Gap area (m²)',
        'VD: Gạch nung 200mm + trát':'e.g. Fired brick 200mm + plaster',
        'VD: Kính hộp đôi Low-e':'e.g. Double-glazed Low-e', 'VD: Tôn tráng kẽm':'e.g. Galvanized sheet steel',
        'VD: Bông sợi khoáng':'e.g. Mineral wool',
        'VD: Cửa đôi Air-curtain 1800×2100':'e.g. Double door with air curtain 1800×2100',
        'CÓ THỂ CHỈNH SỬA':'EDITABLE', 'Mở khóa để sửa':'Unlock to edit', 'Khóa lại':'Lock again',
        'Giá trị tham khảo chung — chỉnh sửa theo datasheet thực tế.':'General reference values — edit according to the actual datasheet.',
        'Giá trị tham khảo chung — chỉnh sửa theo datasheet thiết bị thực tế của dự án.':'General reference values — edit according to the actual project equipment datasheet.',
        'Thiết bị':'Equipment', 'mượn:':'borrowed from:',
        'CHỈ ĐỌC — Tiêu chuẩn QCVN':'READ-ONLY — QCVN Standard',
        'Dữ liệu chuẩn không chỉnh sửa. Import CSV để cập nhật.':'Standard data cannot be edited. Import a CSV to update it.',
        'Nguồn: QCVN 02:2022/BXD, Phụ lục A (63 tỉnh thành). Các tỉnh không có trạm khí tượng riêng trong QCVN (đánh dấu "mượn") dùng số liệu trạm lân cận có khí hậu tương đồng — kiểm tra lại nếu dự án ở các tỉnh này.':'Source: QCVN 02:2022/BXD, Appendix A (63 provinces/cities). Provinces without a dedicated weather station in QCVN (marked "borrowed") use data from a nearby station with a similar climate — double-check if the project is located in one of these provinces.',
        'Tỉnh/TP':'Province/City', 'Trạm':'Station',
        'Import / cập nhật khí hậu .csv/.xlsx':'Import / update climate data .csv/.xlsx',
        'Nhập Model thiết bị':'Enter the equipment model',
        'Đã thêm {type} {model}':'Added {type} {model}',
        'Nhập tên phòng':'Enter the room name',
        'Do người dùng khai báo — kiểm tra lưu lượng thực tế theo thiết bị':'User-declared — verify actual airflow per equipment',
        'Do người dùng tự khai báo — kiểm tra lại theo tiêu chuẩn áp dụng':'Self-declared by the user — double-check against the applicable standard',
        'Loại phòng tự thêm trong tab Database.':'Custom room type added in the Database tab.',
        'Đã thêm loại phòng "{name}"':'Added room type "{name}"',
        'Đã xóa loại phòng tự thêm':'Deleted custom room type',
        'Nhập tên vật liệu':'Enter the material name',
        'Đã thêm "{name}"':'Added "{name}"',
        'Đã xóa vật liệu tự thêm':'Deleted custom material',

        // Tab Hướng Dẫn (User Guide)
        'Luồng làm việc — 2 tab chính':'Workflow — 2 main tabs',
        'Bước 1 → Tab "Phụ Tải Nhiệt"':'Step 1 → "Heat Load" tab',
        'Nhập N phòng (AHU/PAU/FCU/VENT) → khai báo tải nhiệt, motor, ký sinh → bấm "Tính tải" → nhận Q_coil (kW, TR) và L_supply (m³/h) từng phòng.':'Enter N rooms (AHU/PAU/FCU/VENT) → fill in heat load, motors, parasitic loads → click "Calculate Load" → get Q_coil (kW, TR) and L_supply (m³/h) per room.',
        'Bước 2 → Tab "Thiết Kế Ống Gió"':'Step 2 → "Duct Design" tab',
        'Bấm "Import từ Tab Phụ Tải Nhiệt" để đưa L_supply vào bảng nhánh ống → chọn vật liệu, cách nhiệt, vận tốc → bấm "Tính ống" → nhận kích thước, ΔP ma sát, ESP quạt.':'Click "Import from Heat Load tab" to pull L_supply into the duct branch table → choose material, insulation, velocity → click "Calculate ductwork" → get sizes, friction ΔP, and fan ESP.',
        'Hai tab dùng chung dữ liệu dự án (IndexedDB), auto-save liên tục.':'Both tabs share the same project data (IndexedDB), continuously auto-saved.',
        'Tab 1 — Thiết Kế Ống Gió (chỉ duct)':'Tab 1 — Duct Design (ductwork only)',
        'Phạm vi:':'Scope:',
        'Sizing ống gió (chữ nhật W×H hoặc tròn Ø), vật liệu, cách nhiệt, tổn thất ma sát Darcy-Weisbach, kiểm tra đọng sương, NC tiếng ồn, ESP quạt tổng.':'Duct sizing (rectangular W×H or round Ø), material, insulation, Darcy-Weisbach friction loss, condensation check, NC noise, total fan ESP.',
        'Lưu lượng đầu vào:':'Input airflow:',
        'Nhập tay Q (m³/h) cho từng nhánh — hoặc bấm "Import từ Tab Phụ Tải Nhiệt" để kéo tự động L_supply từng phòng đã tính.':'Manually enter Q (m³/h) for each branch — or click "Import from Heat Load tab" to auto-pull the calculated L_supply per room.',
        'Chọn tỉnh/TP:':'Select province/city:',
        'Áp Tv_max và RH_trung_bình vào tất cả nhánh để kiểm tra điểm đọng sương bề mặt ống lạnh.':'Applies Tv_max and average RH to all branches to check the condensation point on cold duct surfaces.',
        'KHÔNG có trong tab này:':'NOT included in this tab:',
        'tính tải nhiệt phòng, chọn AHU/FCU, motor, tải ký sinh (những thứ đó ở Tab Phụ Tải Nhiệt).':'room heat load calculation, AHU/FCU selection, motors, parasitic loads (those are in the Heat Load tab).',
        'Tab 2 — Phụ Tải Nhiệt (multi-room)':'Tab 2 — Heat Load (multi-room)',
        'Điều kiện khí hậu:':'Climate conditions:',
        'T_ngoài, RH, cao độ → tự tính enthalpy h, dung ẩm d, điểm sương Td, P_atm hiệu chỉnh (hiển thị live).':'Outdoor T, RH, elevation → auto-calculates enthalpy h, humidity ratio d, dew point Td, corrected P_atm (shown live).',
        'Danh sách phòng:':'Room list:',
        'Thêm N phòng, mỗi phòng chọn loại: AHU (mixing point), PAU (100% tươi), FCU (tải tươi cộng thẳng vào Q_phòng), VENT (Q_coil=0). Click vào phòng để mở form chi tiết. Nút "copy" để nhân đôi phòng.':'Add N rooms, each choosing a type: AHU (mixing point), PAU (100% fresh air), FCU (fresh air load added directly to Q_room), VENT (Q_coil=0). Click a room to open its detailed form. Use the "copy" button to duplicate a room.',
        'Motor IE3:':'IE3 Motor:',
        '3 phương pháp A (FL×FU) / B (đơn giản) / C (TCVN K1×K2×K3), 3 vị trí TH1/TH2/TH3. η nội suy tuyến tính giữa các mức IEC 60034-30-1.':'3 methods: A (FL×FU) / B (simple) / C (TCVN K1×K2×K3), 3 cases TH1/TH2/TH3. η is linearly interpolated between IEC 60034-30-1 levels.',
        'Tải ký sinh:':'Parasitic load:',
        'IQF/Kho lạnh (vách+khe cửa), Mạ băng, Đá vảy, Rotor tách ẩm. Tải lạnh mang dấu âm, Peak Design không trừ vào Q_coil.':'IQF/Cold storage (walls+door gaps), Glazing, Ice flake, Dehumidifier rotor. Cooling loads are negative; Peak Design does not subtract them from Q_coil.',
        'Kết quả:':'Results:',
        '9 KPI (kW, TR, W/m², %tươi, SHR...) + bảng per-room đầy đủ + validation 6 hạng mục + badge nổi góc màn hình.':'9 KPIs (kW, TR, W/m², %fresh air, SHR...) + full per-room table + 6-item validation + a floating status badge.',
        'Xuất báo cáo':'Exporting the report',
        'PDF đa trang (kèm mộc PASS, bảng per-room) + Excel 5 sheet (Tổng quan · Chi tiết phòng · Motor · Ký sinh · Ống gió). Tên file kèm ngày tháng tự động.':'Multi-page PDF (includes a PASS stamp, per-room table) + 5-sheet Excel (Overview · Room details · Motors · Parasitic · Ductwork). Filename automatically includes the date.',
        'Quản lý dữ liệu & sao lưu':'Data management & backup', 'Quản Lý Dự Án':'Project Management',
        'tạo/nạp/xoá dự án (IndexedDB, không đồng bộ qua internet). Cột "Phòng" cho biết số phòng nhiệt tải đã khai báo. Export .json để sao lưu toàn bộ (bao gồm cả ống gió + phụ tải), Import .json để khôi phục.':'create/load/delete projects (IndexedDB, not synced over the internet). The "Rooms" column shows how many heat-load rooms have been entered. Export .json to back up everything (including ductwork + heat load), Import .json to restore.',
        'Phím tắt':'Keyboard shortcuts', 'tìm nhanh':'quick search', 'tính toán':'calculate',
        'lưu ngay':'save immediately', 'phím số':'number keys', 'chuyển tab.':'switch tabs.',
        'Giới hạn & lưu ý':'Limitations & notes',
        'Dữ liệu khí hậu từ QCVN 02:2022/BXD; 7 tỉnh không có trạm riêng dùng số liệu lân cận (đánh dấu trong tab Quản Lý). Hệ số tổn thất cục bộ phụ kiện là giá trị sơ bộ (SMACNA), cần hiệu chỉnh theo bản vẽ thực tế. Giá trị R/η motor là tham khảo — cập nhật theo datasheet thực tế trong tab Quản Lý &amp; Admin.':'Climate data is from QCVN 02:2022/BXD; 7 provinces without their own station use nearby data (marked in the Management tab). Fitting local-loss coefficients are preliminary values (SMACNA) and should be adjusted to match actual drawings. Motor R/η values are for reference — update them with actual datasheets in the Management &amp; Admin tab.',

        // Tab Tính Toán — Duct calc engine (toast/status/diagnostics)
        'Đã thay thế {n} nhánh ống từ Tab Phụ Tải Nhiệt.':'Replaced with {n} duct branch(es) from the Heat Load tab.',
        'Đã thêm {n} nhánh ống từ Tab Phụ Tải Nhiệt.':'Added {n} duct branch(es) from the Heat Load tab.',
        'Chưa có dữ liệu từ Tab Phụ Tải Nhiệt. Tính toán Tab đó trước.':'No data from the Heat Load tab yet. Calculate that tab first.',
        'Đang tính ống gió...':'Calculating ductwork...',
        'Thiếu lưu lượng Q (m³/h)':'Missing airflow Q (m³/h)', 'Thiếu vận tốc thiết kế (m/s)':'Missing design velocity (m/s)',
        'Nhánh "{name}": v={v} m/s > {max} m/s ({note})':'Branch "{name}": v={v} m/s > {max} m/s ({note})',
        'Nhánh "{name}": v={v} m/s < {min} m/s (nguy cơ bụi lắng đọng)':'Branch "{name}": v={v} m/s < {min} m/s (dust settling risk)',
        'Nhánh "{name}": Aspect Ratio > 4:1':'Branch "{name}": Aspect Ratio > 4:1',
        'Nhánh "{name}": nguy cơ đọng sương — tăng độ dày cách nhiệt (≥ {mm} mm)':'Branch "{name}": condensation risk — increase insulation thickness (≥ {mm} mm)',
        'Nhánh "{name}": {nc}':'Branch "{name}": {nc}',
        'ESP thiết kế {esp} Pa > 1500 Pa — kiểm tra lại':'Design ESP {esp} Pa > 1500 Pa — please review',
        'Tính xong {n} nhánh · Critical path = {cp} Pa · ESP = {esp} Pa.':'Calculation done: {n} branch(es) · Critical path = {cp} Pa · ESP = {esp} Pa.',
        '{n} nhánh ống · ESP = {esp} Pa':'{n} duct branch(es) · ESP = {esp} Pa',
        'Lỗi tính ống:':'Duct calculation error:', 'Lỗi':'Error',
        'ESP yêu cầu':'Required ESP', 'Ma sát đường ống':'Duct friction',
        'Cục bộ (sơ bộ 4 phụ kiện)':'Local loss (approx. 4 fittings)',
        'Lọc (cuối đời, nhánh lớn nhất)':'Filter (end-of-life, largest branch)',
        '→ Chọn quạt/AHU: Q ≥ lưu lượng nhánh lớn nhất và ESP ≥ {esp} Pa.':'→ Select fan/AHU: Q ≥ the largest branch airflow and ESP ≥ {esp} Pa.',
        'Chẩn đoán ống gió':'Duct diagnostics', 'CẢNH BÁO':'WARNING', 'LỖI':'ERROR',
        'Tất cả nhánh ống đạt yêu cầu.':'All duct branches meet requirements.',

        // Toast/status messages — remaining scattered across Calc/Heat Load/Admin modules
        'Đã thêm nhánh cho {equip} {name} — nhập Q (m³/h) rồi bấm Tính ống gió':'Added a branch for {equip} {name} — enter Q (m³/h) then click Calculate ductwork',
        'Tầng {n}':'Floor {n}', 'Phải có ít nhất 1 tầng':'There must be at least 1 floor',
        'Đã xóa {name} và {n} phòng':'Deleted {name} and {n} room(s)',
        'Chọn phòng trước khi thêm từ mẫu.':'Select a room before adding from a template.',
        'Đã thêm tải ký sinh "{name}" vào phòng đã chọn.':'Added parasitic load "{name}" to the selected room.',
        'Mẫu tải ký sinh {n}':'Parasitic load template {n}',
        'Đã lưu thành mẫu — xem ở khối "Mẫu tải ký sinh" phía trên.':'Saved as template — see the "Parasitic load templates" block above.',
        'Không mở được form phòng:':'Could not open the room form:', 'Đã lưu phòng':'Room saved',
        'Tính xong · Q_coil={q} kW':'Calculation done · Q_coil={q} kW',
        '❌ {n} lỗi cần xử lý':'❌ {n} error(s) to fix', '⚠ {n} cảnh báo':'⚠ {n} warning(s)',
        '⚠ {n} cảnh báo vách ngăn (xem chi tiết trong panel Vách ngăn)':'⚠ {n} partition warning(s) (see details in the Partition panel)',
        'Lỗi tính:':'Calculation error:', 'Thêm ít nhất 1 lớp vật liệu':'Add at least 1 material layer',
        'Đã áp U = {u} W/m²K — NHƯNG có {n} cảnh báo, xem chi tiết trong bảng lớp vật liệu':'Applied U = {u} W/m²K — BUT there are {n} warning(s), see details in the material layer table',
        'Đã áp U = {u} W/m²K':'Applied U = {u} W/m²K',
        'Không tính được U — kiểm tra cảnh báo trong bảng lớp vật liệu (thiếu vật liệu hoặc độ dày)':'Could not calculate U — check the warnings in the material layer table (missing material or thickness)',
        'Lỗi tính U:':'U calculation error:',
        'ACH={ach} · ΔP={dp}Pa từ {system} {code}':'ACH={ach} · ΔP={dp}Pa from {system} {code}',
        'Đã gỡ khỏi nhóm thiết bị cũ vì không còn khớp loại hệ thống "{val}"':'Removed from the old equipment group since it no longer matches system type "{val}"',
        'Đã copy: {name}':'Copied: {name}', 'Lỗi mở form phòng:':'Error opening the room form:',
        'Đã copy {name} ({n} phòng)':'Copied {name} ({n} room(s))',
        'Đã áp U = {u} W/m²K vào phòng "{name}" — NHƯNG có {n} cảnh báo, xem chi tiết trong bảng lớp vật liệu':'Applied U = {u} W/m²K to room "{name}" — BUT there are {n} warning(s), see details in the material layer table',
        'Đã áp U = {u} W/m²K vào phòng "{name}"':'Applied U = {u} W/m²K to room "{name}"',
        'Đã thêm motor "{name}" vào phòng đã chọn.':'Added motor "{name}" to the selected room.',
        'Mẫu motor {n}':'Motor template {n}',
        'Đã lưu thành mẫu — xem ở khối "Mẫu Motor" phía trên.':'Saved as template — see the "Motor templates" block above.',
        'Đang tính phụ tải nhiệt...':'Calculating heat load...', 'Fallback generic':'Generic fallback',
        'Tính xong {n} phòng · {g} nhóm.':'Calculation done: {n} room(s) · {g} group(s).',
        'Lỗi:':'Error:',
        '{n} phòng · ESP tổng xem kết quả · {f} cờ validation.':'{n} room(s) · see results for total ESP · {f} validation flag(s).',
        'Đã tạo dự án mới.':'New project created.',
        'Đã nạp dự án: {name} · {n} phòng nhiệt tải':'Loaded project: {name} · {n} heat-load room(s)',
        'Xoá dự án?':'Delete project?', 'Hành động này không thể hoàn tác.':'This action cannot be undone.',
        'Xoá':'Delete', 'Đã xoá dự án.':'Project deleted.', 'Đã export dữ liệu .json':'Exported .json data',
        'Đã nhập {n} dự án.':'Imported {n} project(s).', 'Lỗi import:':'Import error:',
        'Không đọc được dòng dữ liệu hợp lệ.':'No valid data rows could be read.',
        'Đã nhập {n} dòng dữ liệu khí hậu.':'Imported {n} climate data row(s).',
        'Lỗi đọc file:':'File read error:', 'Đã xuất PDF.':'PDF exported.', 'Lỗi xuất PDF:':'PDF export error:',
        'Đã xuất Excel: {n} phòng, {b} nhánh ống.':'Excel exported: {n} room(s), {b} duct branch(es).',
        'Lỗi xuất Excel:':'Excel export error:',

        // Heat Load calc engine (app-calc.js) — validation/diagnostics messages
        'Phòng #{n}: Thiếu tên phòng':'Room #{n}: Missing room name',
        'Phòng #{n}: Thiếu loại thiết bị':'Room #{n}: Missing equipment type',
        'Phòng #{n} ({name}): Thiếu diện tích sàn':'Room #{n} ({name}): Missing floor area',
        'Phòng "{name}": {warn}':'Room "{name}": {warn}',
        'Phòng "{name}": ACH {ach} ngoài dải {min}-{max}':'Room "{name}": ACH {ach} outside the {min}-{max} range',
        'Motor "{name}": FL={fl} < 0.5 — kiểm tra lại công suất':'Motor "{name}": FL={fl} < 0.5 — check the power rating',
        'ACH {ach} < tiêu chuẩn tối thiểu {min} ({system} {code}). Nguồn: IEST-RP-CC012.2':'ACH {ach} < standard minimum {min} ({system} {code}). Source: IEST-RP-CC012.2',
        'ACH {ach} > tiêu chuẩn tối đa {max} — không kinh tế':'ACH {ach} > standard maximum {max} — not economical',
        'Tỷ lệ gió tươi {pct}% < {min}% khuyến nghị ({system} {code})':'Fresh air ratio {pct}% < {min}% recommended ({system} {code})',
        'ΔP thiết kế {dp} Pa < tiêu chuẩn tối thiểu {min} Pa. Nguồn: EU GMP Annex 1 §4.24':'Design ΔP {dp} Pa < standard minimum {min} Pa. Source: EU GMP Annex 1 §4.24',
        'Mật độ {d} m²/người < {min} m²/ng tối thiểu (ASHRAE 62.1)':'Density {d} m²/person < {min} m²/person minimum (ASHRAE 62.1)',
        'Mật độ {d} m²/người quá dày (< 1.2 m²/ng)':'Density {d} m²/person is too crowded (< 1.2 m²/person)',
        'LPD {v} W/m² vượt {max} W/m² (ASHRAE 90.1-2022)':'LPD {v} W/m² exceeds {max} W/m² (ASHRAE 90.1-2022)',
        'Gió tươi {v} L/s/ng < {min} L/s/ng (ASHRAE 62.1-2022)':'Fresh air {v} L/s/person < {min} L/s/person (ASHRAE 62.1-2022)',
        'ACH {v} < {min} ACH tối thiểu cho {bt}':'ACH {v} < {min} ACH minimum for {bt}',
        'Phòng sạch phải có áp dương (ISO 14644-1)':'Cleanrooms must have positive pressure (ISO 14644-1)',
        'Tỷ lệ gió tươi {pct}% < 10% (ASHRAE 62.1)':'Fresh air ratio {pct}% < 10% (ASHRAE 62.1)',
        'ACH {ach} < khuyến nghị {min} ({ref})':'ACH {ach} < recommended {min} ({ref})',
        'Gió tươi < yêu cầu ASHRAE 62.1':'Fresh air below the ASHRAE 62.1 requirement',
        'ACH tổng đang đặt ({ach}) THẤP HƠN ACH gió tươi tối thiểu bắt buộc ({min} ACH, {ref}) — phải tăng ACH tổng lên ít nhất {min}':'Total ACH currently set ({ach}) is LOWER than the required minimum fresh-air ACH ({min} ACH, {ref}) — total ACH must be increased to at least {min}',
        'Đã tick "Có thiết bị hút thải cục bộ" nhưng chưa nhập lưu lượng hút cho thiết bị nào — gió bù chưa được tính':'"Has local exhaust equipment" is checked but no extraction airflow has been entered for any equipment — makeup air has not been calculated',
      }
    }
  };
  /*DATA_MODULE*/

  // ============== DB — IndexedDB (ưu tiên) + fallback localStorage ==============
  App.db = {
    _idb: null,
    _useFallback: false,
    DB_NAME: 'multihvac_db_v1',
    STORE: 'projects',

    async init(){
      if(!('indexedDB' in window)){
        this._useFallback = true;
        App.ui.toast('warn', 'IndexedDB không khả dụng — dùng localStorage (dữ liệu có thể bị giới hạn dung lượng).');
        return;
      }
      try{
        this._idb = await new Promise((resolve, reject)=>{
          const req = indexedDB.open(this.DB_NAME, 1);
          req.onupgradeneeded = (e)=>{
            const db = e.target.result;
            if(!db.objectStoreNames.contains('projects')){
              const store = db.createObjectStore('projects', {keyPath:'id'});
              store.createIndex('byName', 'projectName', {unique:false});
            }
            if(!db.objectStoreNames.contains('elecDevices')){
              db.createObjectStore('elecDevices', {keyPath:'id'});
            }
            if(!db.objectStoreNames.contains('climateData')){
              db.createObjectStore('climateData', {keyPath:'province'});
            }
          };
          req.onsuccess = (e)=> resolve(e.target.result);
          req.onerror = (e)=> reject(e);
        });
      }catch(err){
        this._useFallback = true;
        App.ui.toast('warn', 'Lỗi mở IndexedDB — chuyển sang localStorage.');
      }
    },

    _lsKey(store){ return 'multihvac_db_' + store; },

    async _tx(storeName, mode, fn){
      if(this._useFallback || !this._idb){
        const raw = localStorage.getItem(this._lsKey(storeName));
        const arr = raw ? JSON.parse(raw) : [];
        const result = fn(arr);
        if(mode === 'readwrite') localStorage.setItem(this._lsKey(storeName), JSON.stringify(arr));
        return result;
      }
      return new Promise((resolve, reject)=>{
        const tx = this._idb.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();
        getAllReq.onsuccess = ()=>{
          resolve(fn(getAllReq.result, store));
        };
        getAllReq.onerror = (e)=> reject(e);
      });
    },

    async listProjects(){
      return this._tx('projects', 'readonly', (arr)=> arr);
    },
    async saveProject(project){
      project.id = project.id || ('proj_' + Date.now());
      project.updatedAt = new Date().toISOString();
      if(this._useFallback || !this._idb){
        return this._tx('projects', 'readwrite', (arr)=>{
          const idx = arr.findIndex(p=>p.id===project.id);
          if(idx>=0) arr[idx]=project; else arr.push(project);
          return project;
        });
      }
      return new Promise((resolve, reject)=>{
        const tx = this._idb.transaction('projects','readwrite');
        tx.objectStore('projects').put(project);
        tx.oncomplete = ()=> resolve(project);
        tx.onerror = (e)=> reject(e);
      });
    },
    async deleteProject(id){
      if(this._useFallback || !this._idb){
        return this._tx('projects', 'readwrite', (arr)=>{
          const idx = arr.findIndex(p=>p.id===id);
          if(idx>=0) arr.splice(idx,1);
          return true;
        });
      }
      return new Promise((resolve, reject)=>{
        const tx = this._idb.transaction('projects','readwrite');
        tx.objectStore('projects').delete(id);
        tx.oncomplete = ()=> resolve(true);
        tx.onerror = (e)=> reject(e);
      });
    },
    async exportAllJSON(){
      const projects = await this.listProjects();
      const settings = JSON.parse(localStorage.getItem('multihvac_settings')||'{}');
      return JSON.stringify({ version:'2606.22.01', exportedAt:new Date().toISOString(), projects, settings }, null, 2);
    },
    async importAllJSON(jsonText){
      const data = JSON.parse(jsonText);
      if(!Array.isArray(data.projects)) throw new Error('File JSON không đúng cấu trúc (thiếu mảng projects).');
      for(const p of data.projects){ await this.saveProject(p); }
      if(data.settings) localStorage.setItem('multihvac_settings', JSON.stringify(data.settings));
      return data.projects.length;
    }
  };
  /*DB_MODULE*/
  window.AppMultiHVAC = App; // gán ngay để app-calc.js/app-ui.js mở rộng thêm được
})();
