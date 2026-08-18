// app-calc.js — Động cơ tính toán kỹ thuật (App.calc): tâm lý ẩm, tải nhiệt, chọn
// coil, tính ống gió... Phần 2/3 — PHẢI load SAU app-data.js, TRƯỚC app-ui.js.
(function(){
  const App = window.AppMultiHVAC;


  // ============== CALC — Thuật toán kỹ thuật ==============
  App.calc = {
    NU_AIR: 1.5e-5,   // độ nhớt động học không khí (m2/s), ~20°C
    H_OUT: 9,         // hệ số trao đổi nhiệt bề mặt ngoài ống (W/m2.K), không khí tĩnh trong phòng kỹ thuật

    /* ---- 6. Tiết diện & kích thước ống gió ----
       A(m2) = Q(m3/h) / (v(m/s) × 3600) */
    ductArea(qM3h, vMs){
      if(!vMs || vMs<=0) throw new Error(App.ui.t('Vận tốc thiết kế phải > 0'));
      return qM3h / (vMs * 3600);
    },
    // Quy đổi tiết diện -> kích thước ống chữ nhật, ràng buộc Aspect Ratio W/H <= 4
    rectDimsFromArea(areaM2, maxAspect=4){
      // chọn H theo căn bậc 2 của A/aspect mong muốn (mặc định cân đối ~1.5), rồi làm tròn theo module 50mm
      let h = Math.sqrt(areaM2/1.5);
      let w = areaM2/h;
      const round50 = (x)=> Math.max(0.1, Math.round((x*1000)/50)*50/1000);
      h = round50(h); w = round50(areaM2/h);
      const aspect = w/h;
      return { wM:w, hM:h, aspect, aspectWarning: aspect>maxAspect };
    },
    roundDiameterFromArea(areaM2){
      const d = Math.sqrt(4*areaM2/Math.PI);
      const round10 = (x)=> Math.max(0.05, Math.round((x*1000)/10)*10/1000);
      return round10(d);
    },
    // Đường kính tương đương ma sát cho ống chữ nhật (ASHRAE) — dùng để tính tổn thất ma sát tương đương ống tròn
    equivalentDiameterFriction(wM, hM){
      const a = wM*1000, b = hM*1000; // mm
      const deMm = 1.30 * Math.pow(a*b, 0.625) / Math.pow(a+b, 0.25);
      return deMm/1000;
    },

    /* ---- 7. Tổn thất ma sát đường ống (Darcy-Weisbach + Haaland) ----
       Tham chiếu vật liệu (độ nhám ε) từ data.ductMaterials. */
    frictionFactorHaaland(reynolds, relRoughness){
      // Haaland 1983 — xấp xỉ tường minh của Colebrook-White, sai số <2%
      const term = Math.pow(relRoughness/3.7, 1.11) + 6.9/reynolds;
      const invSqrtF = -1.8*Math.log10(term);
      return 1/(invSqrtF*invSqrtF);
    },
    frictionLossPa(vMs, dM, roughnessMm, lengthM, rhoAir=1.2){
      const reynolds = (vMs * dM) / this.NU_AIR;
      const relRough = (roughnessMm/1000) / dM;
      const f = this.frictionFactorHaaland(Math.max(reynolds,1000), relRough);
      return f * (lengthM/dM) * (rhoAir*vMs*vMs/2);
    },

    /* ---- 12. Điểm đọng sương (Magnus-Tetens) và độ dày cách nhiệt tối thiểu chống đọng sương ----
       Td (°C) = (b×α)/(a-α), với α = ln(RH/100) + (a×T)/(b+T); a=17.62, b=243.12 (hợp lệ vùng nhiệt độ dương, phù hợp khí hậu VN) */
    dewPointC(tAmbientC, rhPercent){
      const a=17.62, b=243.12;
      const alpha = Math.log(rhPercent/100) + (a*tAmbientC)/(b+tAmbientC);
      return (b*alpha)/(a-alpha);
    },
    // Độ dày cách nhiệt tối thiểu để bề mặt ống >= điểm đọng sương của không khí xung quanh
    minInsulationThickness({tAmbientC, rhAmbientPercent, tAirInsideC, lambdaWmK}){
      if(!lambdaWmK) return { thicknessM:0, note:'Vật liệu không có λ (không cách nhiệt) hoặc đã tích hợp sẵn (PIR panel).' };
      const tdp = this.dewPointC(tAmbientC, rhAmbientPercent);
      const rFilmOut = 1/this.H_OUT;
      const denom = (tAmbientC - tdp);
      if(denom <= 0) return { thicknessM:0, tdp, note:'Nhiệt độ môi trường đã thấp hơn điểm đọng sương — kiểm tra lại số liệu đầu vào.' };
      const rInsMin = rFilmOut * ((tAmbientC - tAirInsideC)/denom - 1);
      const thicknessM = Math.max(0, rInsMin * lambdaWmK);
      return { thicknessM, tdp, rInsMin };
    },
    // Kiểm tra bề mặt ống với độ dày đã chọn có còn đọng sương không
    checkSurfaceCondensation({tAmbientC, rhAmbientPercent, tAirInsideC, lambdaWmK, thicknessM}){
      const tdp = this.dewPointC(tAmbientC, rhAmbientPercent);
      if(!lambdaWmK || thicknessM<=0) return { surfaceTempC: tAmbientC, tdp, risk: tAmbientC < tdp };
      const rFilmOut = 1/this.H_OUT;
      const rIns = thicknessM/lambdaWmK;
      const rTotal = rFilmOut + rIns;
      const surfaceTempC = tAmbientC - (tAmbientC - tAirInsideC) * (rFilmOut/rTotal);
      return { surfaceTempC, tdp, risk: surfaceTempC < tdp };
    },

    /* ---- 14. Tra NC sơ bộ theo vận tốc (quy tắc kinh nghiệm) ---- */
    ncGuide(vMs, ncTable){
      const row = ncTable.find(r=> vMs <= r.vMax);
      return row ? row.ncRange : App.ui.t('Không xác định');
    },

    /* 16e. Bù áp suất dương — Phương pháp rò rỉ qua cửa (phương trình lỗ rò chuẩn — orifice equation):
       Q_rò (m3/s) = Cd × A_khe(m2) × sqrt(2×ΔP(Pa)/ρ(kg/m3))
       A_khe = chu vi cửa(m) × chiều rộng khe hở(m). Kích thước cửa lấy theo bảng tham chiếu xây dựng (data.doorStandardSizes).
       Cd ≈ 0.6-0.7 cho khe cửa thông thường (mặc định 0.65). */
    doorLeakageAirflow({doors, gapWidthMm=3, deltaPPa=20, cd=0.65, rhoAir=1.2}){
      let totalAreaM2 = 0;
      (doors||[]).forEach(d=>{
        const perimeterM = 2*((d.wMm+d.hMm)/1000);
        const gapAreaM2 = perimeterM * (gapWidthMm/1000);
        totalAreaM2 += gapAreaM2 * (d.qty||1);
      });
      if(totalAreaM2<=0) return { qM3h:0, totalAreaM2:0 };
      const qM3s = cd * totalAreaM2 * Math.sqrt(2*deltaPPa/rhoAir);
      return { qM3h: qM3s*3600, totalAreaM2 };
    },

    /* ═══════════════════════════════════════════════════════════════════
       ENGINE MỚI — HVAC HEAT LOAD (dịch từ Master Spreadsheet v3)
       ═══════════════════════════════════════════════════════════════════ */

    // — Áp khí quyển hiệu chỉnh theo cao độ (ICAO Standard Atmosphere)
    calcPatm(elevationM){
      const P = App.data.PHYSICS;
      return P.ATM_PRESSURE_SEA * Math.pow(1 - 2.25577e-5 * elevationM, 5.2559);
    },

    // — Áp suất hơi bão hòa Magnus (kPa)
    calcPws(tC){ return 0.61078 * Math.exp((17.27 * tC) / (tC + 237.3)); },

    // — Dung ẩm d (g/kg khô)
    calcHumidityRatio(tC, rhPct, pAtmKPa){
      const pws = this.calcPws(tC);
      return 622 * (rhPct/100 * pws) / (pAtmKPa - rhPct/100 * pws);
    },

    // — Enthalpy không khí ẩm (kJ/kg khô)
    calcEnthalpy(tC, dGperKg){
      const P = App.data.PHYSICS;
      return 1.006*tC + (dGperKg/1000)*(P.R_LATENT_VAPOR + 1.86*tC);
    },

    // — Psychrometrics đầy đủ cho 1 trạng thái không khí
    calcPsychro(tC, rhPct, elevationM){
      const pAtm = this.calcPatm(elevationM);
      const d = this.calcHumidityRatio(tC, rhPct, pAtm);
      const h = this.calcEnthalpy(tC, d);
      const pws = this.calcPws(tC);
      const dewPoint = (237.3 * Math.log(rhPct/100*pws/0.61078)) / (17.27 - Math.log(rhPct/100*pws/0.61078));
      return { tC, rhPct, pAtmKPa:pAtm, dGperKg:d, hKJperKg:h, dewPointC:dewPoint };
    },

    // — Tải nhiệt vách/kính/người/đèn/gió tươi (FCU mode)
    calcEnvelopeLoad({uPanel, aWall, dtFactor, aGlass, shgc, sc, clf,
                      nPeople, laborLevel, lpdApplied, floorAreaM2, dfLighting,
                      lFreshM3h, tOut, tIn, dOut, dIn, equipType}){
      const P = App.data.PHYSICS;
      const dT = (tOut - tIn) * (dtFactor ?? 1.0);
      const Q_wall   = (uPanel??0) * (aWall??0) * dT; // W
      const Q_solar  = (aGlass??0) * (shgc??0.6) * (sc??1) * (clf??0.7); // W
      const ph = App.data.peopleHeat.find(r=>r.level===laborLevel) ?? App.data.peopleHeat[0];
      const Q_ps     = (nPeople??0) * ph.qsW;
      const Q_pl     = (nPeople??0) * ph.qlW;
      const Q_light  = (lpdApplied??0) * (floorAreaM2??0) * (dfLighting??0.9) * 0.85;
      let Q_fresh_s = 0, Q_fresh_l = 0;
      // CHỈ cộng tải gió tươi thẳng vào phòng cho FCU THƯỜNG (gió tươi thô, không qua xử lý
      // riêng). Với 'FCU_OA' (có thiết bị xử lý gió tươi riêng — DOAS/PAU nhỏ), gió tươi đã
      // được coil riêng đó hạ nhiệt/ẩm TRƯỚC khi vào phòng nên KHÔNG cộng vào đây nữa — nếu
      // cộng sẽ tính trùng (double-count) với qCoilOaKW đã tính riêng trong calcCoil().
      if(equipType==='FCU' && lFreshM3h > 0){
        const lM3s = lFreshM3h / 3600;
        Q_fresh_s = P.RHO_AIR * lM3s * P.CP_AIR * (tOut - tIn) * 1000;
        Q_fresh_l = P.RHO_AIR * lM3s * P.R_LATENT_VAPOR * ((dOut - dIn)/1000) * 1000;
      }
      const Q_sensible = Q_wall + Q_solar + Q_ps + Q_light + Q_fresh_s;
      const Q_latent   = Q_pl + Q_fresh_l;
      return {Q_wall, Q_solar, Q_ps, Q_pl, Q_light, Q_fresh_s, Q_fresh_l, Q_sensible, Q_latent};
    },

    // — Nội suy hiệu suất motor IE3
    calcMotorEta(pKw){
      const tbl = App.data.motorIE3;
      const exact = tbl.find(r => Math.abs(r.pKw - pKw) < 0.001);
      if(exact) return { eta: exact.eta, flag:App.ui.t('Khớp đúng mức chuẩn') };
      const lo = [...tbl].reverse().find(r => r.pKw <= pKw);
      const hi = tbl.find(r => r.pKw >= pKw);
      if(!lo && !hi) return { eta: tbl[0].eta, flag:App.ui.t('Ngoài dải bảng (dùng mức nhỏ nhất)') };
      if(!lo) return { eta: hi.eta, flag:App.ui.t('Ngoài dải bảng (dùng mức nhỏ nhất)') };
      if(!hi) return { eta: tbl[tbl.length-1].eta, flag:App.ui.t('Ngoài dải bảng (dùng mức lớn nhất)') };
      const eta = lo.eta + (hi.eta-lo.eta)*(pKw-lo.pKw)/(hi.pKw-lo.pKw);
      return { eta, flag:App.ui.t('⚙ Nội suy {lo}-{hi} kW',{lo:lo.pKw,hi:hi.pKw}) };
    },

    // — Nhiệt tỏa motor (3 phương pháp A/B/C)
    // TH1: cả motor+tải trong phòng; TH2: chỉ motor, tải ngoài; TH3: chỉ tải trong
    calcMotorHeat({pKw, qty, method, position, etaOverride, FL, FU, hasVFD, vfdPct, K1, K2, K3}){
      const { eta: etaLookup, flag } = this.calcMotorEta(pKw);
      const eta = etaOverride ?? etaLookup;
      const fl = FL ?? 1; const fu = FU ?? 1;
      let Q_base = 0;
      if(method==='A'){
        if(position==='TH1')      Q_base = pKw*1000/eta*fl*fu;
        else if(position==='TH2') Q_base = pKw*1000*(1-eta)/eta*fl*fu;
        else                      Q_base = pKw*1000*fl*fu;
      } else if(method==='B'){
        if(position==='TH1')      Q_base = pKw*1000/eta;
        else if(position==='TH2') Q_base = pKw*1000*(1-eta)/eta;
        else                      Q_base = pKw*1000;
      } else { // C — TCVN
        Q_base = pKw*1000*(K1??1)*(K2??1)*(K3??1);
      }
      const Q_VFD = hasVFD ? pKw*1000*(vfdPct??0.04) : 0;
      const Q_total = (Q_base + Q_VFD) * (qty??1);
      return { Q_total, eta, etaFlag: flag };
    },

    // — Tải lạnh ký sinh
    

    /* calcCleanroomAirflow — tính đầy đủ phân phối gió cho 1 phòng sạch (ISO/GMP)
       trả về: Q_supply, Q_fresh, Q_recirculation, Q_pressurization, Q_return,
               freshPct, ACH_actual, modeNote, stdRef, warnings
       Nguồn công thức: ISO 14644-4:2022 Annex C, ASHRAE Applications Ch.17,
                        EU GMP Annex 1 §4.23-4.24 (2022), ASHRAE 62.1-2022 */
    calcCoil({equipType, Q_sens_room, Q_lat_room, Q_motor_total, Q_parasitic_list,
              lSupplyM3h, lFreshM3h, lReturnM3h, tOut, hOut, dOut, hIn,
              tSupplyDesign, rhSupplyDesign, espPa, elevationM, calcMode}){
      const P = App.data.PHYSICS;
      if(equipType==='VENT') return {qCoilKW:0, type:App.ui.t('Quạt thông gió (không cần coil)')};
      const Q_para_neg = (Q_parasitic_list??[]).filter(q=>q<0).reduce((a,b)=>a+b,0);
      const Q_para_pos = (Q_parasitic_list??[]).filter(q=>q>0).reduce((a,b)=>a+b,0);
      const Q_s_adj = Q_sens_room + (Q_motor_total??0) + Q_para_pos
                    + (calcMode==='Energy' ? Q_para_neg : 0);
      const Q_l_adj = Q_lat_room;
      if(equipType==='FCU'){
        return { qCoilKW: (Q_s_adj + Q_l_adj)/1000, qReheatKW:0, type:'FCU' };
      }
      // FCU + thiết bị xử lý gió tươi riêng (DOAS/PAU nhỏ): 2 coil TÁCH RỜI, không được
      // gộp chung theo kiểu AHU (mixing point ảo) vì đây là 2 thiết bị vật lý khác nhau —
      // (1) coil FCU chỉ gánh tải cảm/ẩn của phòng (KHÔNG gồm gió tươi — vì gió tươi đã
      //     được xử lý riêng trước khi vào phòng, xem calcEnvelopeLoad: equipType==='FCU_OA'
      //     bị loại khỏi điều kiện cộng Q_fresh_s/Q_fresh_l vào tải phòng, tránh tính trùng)
      // (2) coil thiết bị xử lý gió tươi riêng: 100% gió tươi, hạ từ trạng thái ngoài trời
      //     xuống điều kiện cấp thiết kế — cùng phương pháp enthalpy như PAU
      if(equipType==='FCU_OA'){
        const qCoilFcuKW = (Q_s_adj + Q_l_adj)/1000;
        const pAtm = this.calcPatm(elevationM??0);
        const tSupply = tSupplyDesign ?? 14;
        const rhSupply = rhSupplyDesign ?? 90;
        const hSupplyOA = this.calcEnthalpy(tSupply, this.calcHumidityRatio(tSupply, rhSupply, pAtm));
        const lFreshM3s = (lFreshM3h??0)/3600;
        const qCoilOaKW = P.RHO_AIR * lFreshM3s * ((hOut??0) - hSupplyOA);
        return { qCoilKW: qCoilFcuKW + qCoilOaKW, qCoilFcuKW, qCoilOaKW,
          hOut, hSupplyOA, qReheatKW:0, type:'FCU_OA',
          note:'qCoilKW = qCoilFcuKW (FCU, tải phòng) + qCoilOaKW (thiết bị xử lý gió tươi riêng)' };
      }
      // AHU / PAU
      const pAtm = this.calcPatm(elevationM??0);
      const tSupply = tSupplyDesign ?? 14;
      const rhSupply = rhSupplyDesign ?? 90;
      const hSupply = this.calcEnthalpy(tSupply, this.calcHumidityRatio(tSupply, rhSupply, pAtm));
      const hMix = (equipType==='PAU')
        ? hOut
        : ((lFreshM3h??0)*hOut + (lReturnM3h??0)*hIn) / Math.max(lSupplyM3h??1, 1);
      const lM3s = (lSupplyM3h??0)/3600;
      const Q_fan = P.RHO_AIR * lM3s * P.CP_AIR * ((espPa??400)/1000) * P.FAN_HEAT_GAIN_PER_1000PA;
      const qCoilKW = P.RHO_AIR * lM3s * (hMix - hSupply) + Q_fan;
      const tSupplyReq = tOut - (Q_s_adj/1000) / (P.RHO_AIR * P.CP_AIR * lM3s + 0.001);
      const qReheatKW = (tSupplyDesign && tSupplyDesign < tSupplyReq)
        ? P.RHO_AIR * P.CP_AIR * lM3s * (tSupplyReq - tSupplyDesign) : 0;
      return { qCoilKW, qReheatKW, hMix, hSupply, tSupplyReq, type: equipType };
    },

    // — 6 hạng mục Validation tự động
    runValidation(rooms, motors, parasitic, airflowResults, coilResults){
      const flags = [];
      // 1. Input thiếu bắt buộc
      (rooms||[]).forEach((r,i)=>{
        if(!r.name) flags.push({level:'red',code:'MISS_NAME',msg:App.ui.t('Phòng #{n}: Thiếu tên phòng',{n:i+1})});
        if(!r.equipType) flags.push({level:'red',code:'MISS_TYPE',msg:App.ui.t('Phòng #{n}: Thiếu loại thiết bị',{n:i+1})});
        // FIX: r.floorAreaM2 KHÔNG BAO GIỜ được lưu trên object phòng — đó chỉ là tên tham
        // số truyền tạm vào calcEnvelopeLoad() lúc tính (floorAreaM2:_area), không phải field
        // persist trên r. Trước đây check r.floorAreaM2>0 luôn false ⇒ MỌI phòng đều bị báo
        // "Thiếu diện tích sàn" dù đã nhập đủ L/W. Sửa: tính diện tích thật từ L×W (hoặc
        // customAreaM2 nếu roomShape='custom') giống hệt cách app tính ở mọi nơi khác.
        const areaM2 = App.ui.heatload._calcArea(r);
        if(!(areaM2>0)) flags.push({level:'red',code:'MISS_AREA',msg:App.ui.t('Phòng #{n} ({name}): Thiếu diện tích sàn',{n:i+1,name:r.name||'?'})});
      });
      // 2. L_hồi âm
      (airflowResults||[]).forEach(r=>{
        if(r.warn) flags.push({level:'red',code:'RETURN_NEG',msg:App.ui.t('Phòng "{name}": {warn}',{name:r.roomName,warn:r.warn})});
      });
      // 3. Thiết bị UNDERSIZE (model chọn < yêu cầu) — placeholder (phụ thuộc dữ liệu model)
      // 4. ACH ngoài dải
      (rooms||[]).forEach(r=>{
        if(!r.achApplied || !r.classCode) return;
        const iso = App.data.achISO.find(x=>x.cls===r.classCode);
        const gmp = App.data.achGMP.find(x=>x.cls===r.classCode);
        const row = iso || gmp;
        if(row && row.mode==='ach' && row.achMin != null){
          if(r.achApplied < row.achMin || r.achApplied > row.achMax)
            flags.push({level:'yellow',code:'ACH_OUT',msg:App.ui.t('Phòng "{name}": ACH {ach} ngoài dải {min}-{max}',{name:r.name,ach:r.achApplied,min:row.achMin,max:row.achMax})});
        }
      });
      // 5. Motor non-tải (FL < 0.5)
      (motors||[]).forEach(m=>{
        if((m.FL??1) < 0.5) flags.push({level:'yellow',code:'MOTOR_LOW_FL',msg:App.ui.t('Motor "{name}": FL={fl} < 0.5 — kiểm tra lại công suất',{name:m.name,fl:m.FL})});
      });
      // 6. Reconciliation lưu lượng (placeholder nếu chưa có data Equipment Selection)
      const hasRed = flags.some(f=>f.level==='red');
      const hasYellow = flags.some(f=>f.level==='yellow');
      return { flags, status: hasRed?'red': hasYellow?'yellow':'pass' };
    },

        calcCleanroomAirflow({
      classSystem, classCode, volumeM3, nPeople=0,
      freshAirPerPersonLs=10,     // ASHRAE 62.1-2022 Table 6-1
      achApplied,                 // override; nếu null → dùng achDefault từ tiêu chuẩn
      faceAreaM2,                 // chỉ dùng cho unidirectional flow
      uniVelocityMs,              // override velocity cho unidirectional
      pressMethod='ach',          // 'ach' | 'door'
      pressACH,                   // ACH bù áp; nếu null → dùng pressACHMin từ tiêu chuẩn
      doors=[],                   // [{doorCode, qty}] cho phương pháp door leakage
      gapWidthMm=3,               // khe hở cửa (mm)
      deltaPDesignPa,             // ΔP thiết kế; nếu null → deltaPMinPa từ tiêu chuẩn
    }){
      const std = (App.data.cleanroomStandards||[]).find(s=>s.system===classSystem && s.code===classCode);
      const P = App.data.PHYSICS;

      // ── 1. Lưu lượng cấp gió ──────────────────────────────────────────────
      let Q_supply = 0, ACH_actual = null, modeNote = '';
      if(std?.flowMode === 'unidirectional'){
        const vMid = uniVelocityMs ?? ((std.velMin+std.velMax)/2);
        Q_supply = (faceAreaM2||0) * vMid * 3600;
        ACH_actual = volumeM3>0 ? Q_supply/volumeM3 : null;
        modeNote = `Đơn hướng v=${vMid.toFixed(2)} m/s`;
      } else {
        const ach = achApplied ?? std?.achDefault ?? ((std?.achMin+std?.achMax)/2 ?? 20);
        ACH_actual = ach;
        Q_supply = volumeM3 * ach;
        modeNote = `Rối (${ach} ACH)`;
      }

      // ── 2. Lưu lượng gió tươi tối thiểu từ người ─────────────────────────
      // ASHRAE 62.1-2022 Table 6-1: pharma cleanroom = 10 L/s/person
      const Q_people_min = nPeople * freshAirPerPersonLs * 3.6;

      // ── 3. Lưu lượng bù áp dương ─────────────────────────────────────────
      // Method A (Volume): Q_press = V × ACH_press
      // Method B (Orifice): Q = Cd × A_khe × √(2ΔP/ρ) × SF; ISO 14644-4:2022 Annex C
      const dP = deltaPDesignPa ?? std?.deltaPMinPa ?? 10;
      let Q_press = 0;
      if(pressMethod === 'door' && doors.length > 0){
        const doorInputs = doors.map(d=>{
          const cat = (App.data.doorCatalog||[]).find(c=>c.code===d.doorCode);
          return { wMm: cat?.wMm||900, hMm: cat?.hMm||2100, qty: d.qty||1 };
        });
        const res = App.calc.doorLeakageAirflow({ doors:doorInputs, gapWidthMm, deltaPPa:dP });
        Q_press = res.qM3h;
      } else {
        const achP = pressACH ?? std?.pressACHMin ?? 1;
        Q_press = volumeM3 * achP;
      }

      // ── 4. Gió tươi thiết kế = max(yêu cầu người, yêu cầu bù áp) ─────────
      const Q_fresh = Math.max(Q_people_min, Q_press);

      // ── 5. Gió tuần hoàn (trả về AHU để xử lý lại) ────────────────────────
      const Q_recirculation = Math.max(0, Q_supply - Q_fresh);

      const freshPct = Q_supply > 0 ? (Q_fresh/Q_supply)*100 : 0;

      // ── 6. Cảnh báo ────────────────────────────────────────────────────────
      const warnings = [];
      if(std?.achMin && ACH_actual && ACH_actual < std.achMin)
        warnings.push({level:'red',   code:'ACH_LOW',   msg:App.ui.t('ACH {ach} < tiêu chuẩn tối thiểu {min} ({system} {code}). Nguồn: IEST-RP-CC012.2',{ach:ACH_actual.toFixed(1),min:std.achMin,system:classSystem,code:classCode})});
      if(std?.achMax && ACH_actual && ACH_actual > std.achMax)
        warnings.push({level:'yellow',code:'ACH_HIGH',  msg:App.ui.t('ACH {ach} > tiêu chuẩn tối đa {max} — không kinh tế',{ach:ACH_actual.toFixed(1),max:std.achMax})});
      if(std?.freshAirPctMin && freshPct < std.freshAirPctMin)
        warnings.push({level:'yellow',code:'FRESH_LOW', msg:App.ui.t('Tỷ lệ gió tươi {pct}% < {min}% khuyến nghị ({system} {code})',{pct:freshPct.toFixed(1),min:std.freshAirPctMin,system:classSystem,code:classCode})});
      if(dP < (std?.deltaPMinPa||0))
        warnings.push({level:'red',   code:'DP_LOW',    msg:App.ui.t('ΔP thiết kế {dp} Pa < tiêu chuẩn tối thiểu {min} Pa. Nguồn: EU GMP Annex 1 §4.24',{dp:dP,min:std.deltaPMinPa})});

      return {
        Q_supply, Q_fresh, Q_recirculation, Q_return:Q_recirculation,
        Q_pressurization:Q_press, Q_people_min, ACH_actual,
        freshPct, modeNote, deltaPDesignPa:dP, stdRef:std, warnings
      };
    },

    /* calcDataCenterAirflow — ASHRAE TC9.9 2021
       Airflow = 3600 × Q_load / (ρ × Cp × ΔT)  */
    calcDataCenterAirflow({qTotalKW, deltaT=12, supplyAirTempC=18, roomTempC=27}){
      if(!deltaT || deltaT<=0) throw new Error(App.ui.t('ΔT Data Center phải > 0'));
      const P = App.data.PHYSICS;
      const Q_supply = 3600 * qTotalKW / (P.RHO_AIR * P.CP_AIR * deltaT);
      // DC: 100% recirculation qua CRAC/CRAH, gió tươi chỉ đủ thông gió cho người
      const Q_fresh = 0;  // DC thường không cần gió tươi lớn; cấp riêng nếu cần
      return { Q_supply, Q_fresh, Q_recirculation:Q_supply, Q_return:Q_supply, freshPct:0,
               note:`ASHRAE TC9.9 2021: Q = 3600×${qTotalKW.toFixed(1)}kW / (1.2×${deltaT}K) = ${Q_supply.toFixed(0)} m³/h` };
    },

    // calcRoofCLTD — tải nhiệt qua mái theo CLTD
    calcRoofCLTD({uRoof, roofType='R2', areaM2, tRoom=22, tOutdoorMean=32, applyCorrection=true}){
      const rg = App.data.CLTD_ROOFS[roofType];
      if(!rg) throw new Error(App.ui.t('Roof type không tồn tại: {rt}. Dùng R1-R6',{rt:roofType}));
      let cltd = rg.cltdPeak;
      if(applyCorrection) cltd += (25.5 - tRoom) + (tOutdoorMean - 29.4);
      cltd = Math.max(cltd, 0);
      const Q_W = (uRoof ?? rg.U) * areaM2 * cltd;
      return { Q_W, cltd, roofType:rg.name, source:'ASHRAE 2001 Ch.29 Table 34 (adj VN)' };
    },
    


        /* calcULayered — Tính U từ cấu tạo lớp thực tế
       Phương pháp: R_total = 1/h_o + Σ(δ_i/λ_i) + 1/h_i
       Nguồn: ASHRAE HOF 2021 Ch.26; ISO 6946:2017
       
       @param layers: [{materialId, thicknessMm}]
       @param includeFilms: true = cộng 1/h_o và 1/h_i (wall); false = không (cầu thang...)
       @returns { U, Rtotal, layers_detail, warning }
    */
    calcULayered({ layers=[], includeFilms=true }){
      const D = App.data;
      const h_o = D.H_OUTSIDE ?? 23.3; // W/m²K — ASHRAE HOF 2021 Table 10
      const h_i = D.H_INSIDE  ?? 11.6; // W/m²K — ASHRAE HOF 2021 Table 10

      let R_total = 0;
      if(includeFilms){
        R_total += 1/h_o; // film ngoài
      }

      const layerDetails = [];
      const warnings = [];

      layers.forEach((lyr, idx) => {
        const mat = (D.CONSTRUCTION_MATERIALS||[]).find(m=>m.id===lyr.materialId);
        if(!mat){ warnings.push(App.ui.t('Lớp {n}: không tìm thấy vật liệu "{id}"',{n:idx+1,id:lyr.materialId})); return; }
        const thickM = (parseFloat(lyr.thicknessMm)||0) / 1000;

        let R_layer;
        if(mat.Rfixed!=null){
          // Air gap: dùng R cố định
          R_layer = mat.Rfixed;
        } else if(mat.lambda && thickM > 0){
          R_layer = thickM / mat.lambda;
        } else if(mat.lambda && thickM === 0){
          warnings.push(App.ui.t('{name}: độ dày = 0 → bỏ qua',{name:mat.name})); return;
        } else {
          warnings.push(App.ui.t('{name}: không có λ',{name:mat.name})); return;
        }

        R_total += R_layer;
        layerDetails.push({
          name: mat.name, thickMm: lyr.thicknessMm,
          lambda: mat.lambda, Rfixed: mat.Rfixed,
          R: R_layer
        });
      });

      if(includeFilms){
        R_total += 1/h_i; // film trong
      }

      const U = R_total > 0 ? 1/R_total : null;

      // Cảnh báo giá trị quá thấp hoặc cao
      if(U && U > 3.5)  warnings.push(App.ui.t('U = {u} W/m²K — rất cao, kiểm tra lại cấu tạo',{u:U.toFixed(2)}));
      if(U && U < 0.10) warnings.push(App.ui.t('U = {u} W/m²K — rất thấp, kiểm tra độ dày cách nhiệt',{u:U.toFixed(3)}));

      return { U, Rtotal:R_total, layers:layerDetails, warnings,
        h_o, h_i, Rfilm_o:includeFilms?1/h_o:0, Rfilm_i:includeFilms?1/h_i:0,
        source:'ASHRAE HOF 2021 Ch.26; ISO 6946:2017' };
    },

    /* calcPartitionLoad — Tải nhiệt qua vách ngăn nội bộ
       Q_partition = U × A × (T_adjacent - T_room)
       Quan trọng: nhà máy thực phẩm (nhiều zone nhiệt độ), bệnh viện
       Nguồn: ASHRAE HOF 2021 Ch.18 §18.3; AC Heat Load Calculator logic
       
       @param partitions: [{areaM2, uWall, wallTypeId, adjSource, adjRoomId, adjTempC}]
       @param tRoom: nhiệt độ phòng đang tính (°C)
       @param allRooms: danh sách tất cả phòng để lookup adjRoomId
       @returns { Q_total_W, details: [{name, Q_W, ...}] }
    */
    calcPartitionLoad({ partitions=[], tRoom=22, allRooms=[] }){
      const D = App.data;
      let Q_total = 0;
      const details = [];
      // FIX (Bước 3): trước đây U=0.45 (gạch mặc định) và T_adj=35°C được âm thầm áp dụng
      // khi người dùng chưa chọn loại tường/nhiệt độ phòng kề — không có cách nào biết đó
      // là số THẬT đã nhập hay chỉ là giá trị mặc định thay thế. Giờ ghi lại warnings để
      // giao diện hiển thị rõ cho từng vách ngăn.
      const warnings = [];

      partitions.forEach((p, idx) => {
        const label = p.name || App.ui.t('Vách ngăn #{n}',{n:idx+1});
        const areaM2  = parseFloat(p.areaM2) || 0;
        if(areaM2 <= 0){
          warnings.push(App.ui.t('{label}: chưa nhập diện tích (S=0) — bỏ qua, không tính vào tổng tải',{label}));
          return;
        }

        // U: từ wallTypeId → WALL_TYPES catalog, hoặc nhập tay
        let U = parseFloat(p.uWall) || 0;
        if(!U && p.wallTypeId){
          const wt=(D.WALL_TYPES||[]).find(w=>w.id===p.wallTypeId);
          if(wt) U=wt.U;
        }
        if(!U){ U = 0.45; warnings.push(App.ui.t('{label}: chưa chọn loại vách/nhập U — đang dùng mặc định U=0.45 (gạch 200mm), kiểm tra lại nếu vách thực tế khác',{label})); }

        // T kề phòng
        let T_adj = null;
        let adjName = '';
        if(p.adjSource==='room' && p.adjRoomId){
          const adjRoom = allRooms.find(r=>r.id===p.adjRoomId);
          if(adjRoom){
            T_adj   = parseFloat(adjRoom.tRoom) || parseFloat(adjRoom.tIn) || 22;
            adjName = adjRoom.name || p.adjRoomId;
          } else {
            warnings.push(App.ui.t('{label}: phòng kề đã chọn không còn tồn tại — kiểm tra lại',{label}));
          }
        }
        if(T_adj===null){
          T_adj = parseFloat(p.adjTempC) ?? 35; // mặc định T ngoài
          if(p.adjTempC==null) warnings.push(App.ui.t('{label}: chưa nhập nhiệt độ phòng kề — đang dùng mặc định 35°C, kiểm tra lại nếu phòng kề có điều hòa',{label}));
        }

        const dT = T_adj - tRoom;
        const Q_W = U * areaM2 * dT;
        Q_total += Q_W;

        details.push({ idx, areaM2, U, T_adj, adjName, dT, Q_W });
      });

      return { Q_total_W: Q_total, details, warnings,
        note:'Q dương = tải nhiệt vào phòng; Q âm = tải lạnh vào (phòng kề lạnh hơn)',
        source:'ASHRAE HOF 2021 Ch.18 §18.3' };
    },

    /* selectEquipAuto — Tự chọn FCU/AHU tối ưu từ catalog
       Logic: tìm model nhỏ nhất trong catalog có capKW ≥ Q_required × (1+margin%)
       Ưu tiên theo equipType: FCU→cassette/ducted, AHU→AHU, PAU→PAU

       @param qCoilKW: công suất lạnh cần (kW)
       @param equipType: 'AHU'|'PAU'|'FCU'|'VENT'
       @param designMarginPct: hệ số dự phòng (%)
       @param preferType: 'cassette'|'ducted'|'vertical' (cho FCU)
       @returns { model, qty, totalCapKW, utilization, isOversized, warning }
    */
    selectEquipAuto({ qCoilKW, equipType='FCU', designMarginPct=10, preferType='cassette' }){
      const catalog = App.data.FCU_CATALOG || [];
      if(!qCoilKW || qCoilKW<=0) return null;

      const required = qCoilKW * (1 + designMarginPct/100);

      // Lọc catalog theo loại thiết bị
      let typeFilter;
      if(equipType==='AHU')  typeFilter = ['AHU'];
      else if(equipType==='PAU') typeFilter = ['PAU'];
      else if(equipType==='FCU'||equipType==='FCU_OA') typeFilter = ['cassette', 'ducted', 'vertical'];
      else return null; // VENT không cần coil

      const candidates = catalog.filter(m=>typeFilter.includes(m.type));
      if(!candidates.length) return null;

      // FIX: trước đây preferType chỉ được NHÉT CHUNG vào typeFilter cùng các loại khác
      // (vd ['cassette','cassette','ducted','vertical']) rồi chọn model NHỎ NHẤT đủ công suất
      // trên TOÀN BỘ các loại gộp lại — nghĩa là preferType hoàn toàn không có tác dụng ưu
      // tiên thật sự: nếu 1 model 'vertical' tình cờ có capKW nhỏ hơn model 'cassette' đủ
      // công suất, hàm vẫn trả về 'vertical' dù người dùng chọn preferType='cassette'. Giờ
      // ưu tiên đúng nghĩa: thử chọn trong ĐÚNG preferType trước, chỉ khi loại đó không có
      // model nào đủ (kể cả ghép nhiều unit) mới rơi xuống các loại còn lại.
      const pickFrom = (pool)=>{
        if(!pool.length) return null;
        const sorted = [...pool].sort((a,b)=>a.capKW-b.capKW);
        const singleUnit = sorted.find(m=>m.capKW>=required);
        if(singleUnit){
          return {
            model: singleUnit,
            qty: 1,
            totalCapKW: singleUnit.capKW,
            utilization: (qCoilKW/singleUnit.capKW*100).toFixed(0)+'%',
            isOversized: singleUnit.capKW > required*1.4,
            warning: singleUnit.capKW > required*1.4
              ? App.ui.t('Oversized {pct}% — xem xét model nhỏ hơn',{pct:((singleUnit.capKW/required-1)*100).toFixed(0)}) : null
          };
        }
        // Không có single unit đủ → dùng model lớn nhất trong pool × nhiều units
        const largest = sorted[sorted.length-1];
        const qty = Math.ceil(required/largest.capKW);
        return {
          model: largest,
          qty,
          totalCapKW: largest.capKW * qty,
          utilization: (qCoilKW/(largest.capKW*qty)*100).toFixed(0)+'%',
          isOversized: false,
          warning: qty > 4 ? App.ui.t('Cần {qty} units — kiểm tra lại layout',{qty}) : null
        };
      };

      // Chỉ thực sự dùng preferType nếu nó cho ra phương án hợp lý (≤4 unit, ngưỡng đã dùng
      // sẵn ở warning bên trên) — nếu preferType quá nhỏ so với công suất cần (vd cần 500kW mà
      // preferType='cassette' chỉ có model tối đa 10kW → sẽ ra 50 unit, phi thực tế), rơi
      // xuống toàn bộ pool để có cơ hội tìm loại khác (vd 'vertical', công suất lớn hơn) hợp
      // lý hơn — vẫn còn preferredPick làm phương án dự phòng cuối nếu pool đầy đủ cũng không
      // khá hơn.
      const preferredPool = candidates.filter(m=>m.type===preferType);
      const preferredPick = pickFrom(preferredPool);
      if(preferredPick && preferredPick.qty <= 4) return preferredPick;
      return pickFrom(candidates) ?? preferredPick;
    },

    // selectFanAuto — chọn quạt tự động theo lưu lượng (m³/h) + cột áp tĩnh yêu cầu (Pa),
    // dùng cho phòng VENT (thông gió thuần) và thiết bị gió thải cục bộ — khác cơ chế với
    // selectEquipAuto (chọn theo công suất lạnh). Logic tương tự: ưu tiên 1 quạt đủ CẢ lưu
    // lượng LẪN cột áp; nếu không có, dùng quạt lớn nhất × nhiều chiếc theo lưu lượng (cột áp
    // vẫn phải đủ — quạt không "cộng cột áp" khi ghép song song như cách cộng công suất lạnh).
    selectFanAuto({ airflowM3h, staticPaRequired=150, designMarginPct=10, preferType='axial' }){
      const catalog = App.data.FAN_CATALOG || [];
      if(!airflowM3h || airflowM3h<=0) return null;
      const requiredFlow = airflowM3h * (1 + designMarginPct/100);

      const typeFilter = [preferType, 'axial', 'centrifugal', 'roof_exhaust', 'wall_exhaust'];
      const candidates = catalog.filter(m=>typeFilter.includes(m.type) && m.staticPa>=staticPaRequired);
      if(!candidates.length) return null;

      const sorted = [...candidates].sort((a,b)=>a.airflowM3h-b.airflowM3h);
      const singleUnit = sorted.find(m=>m.airflowM3h>=requiredFlow);

      if(singleUnit){
        return {
          model: singleUnit,
          qty: 1,
          totalAirflowM3h: singleUnit.airflowM3h,
          utilization: (airflowM3h/singleUnit.airflowM3h*100).toFixed(0)+'%',
          isOversized: singleUnit.airflowM3h > requiredFlow*1.5,
          warning: singleUnit.airflowM3h > requiredFlow*1.5
            ? App.ui.t('Oversized {pct}% — xem xét model nhỏ hơn',{pct:((singleUnit.airflowM3h/requiredFlow-1)*100).toFixed(0)}) : null
        };
      }

      const largest = sorted[sorted.length-1];
      const qty = Math.ceil(requiredFlow/largest.airflowM3h);
      return {
        model: largest,
        qty,
        totalAirflowM3h: largest.airflowM3h * qty,
        utilization: (airflowM3h/(largest.airflowM3h*qty)*100).toFixed(0)+'%',
        isOversized: false,
        warning: qty > 4 ? App.ui.t('Cần {qty} units — kiểm tra lại layout',{qty}) : null
      };
    },


    /* calcParasiticLoad — Tải ký sinh trong phòng ĐHKK nhà máy chế biến
       Tải âm (W): IQF, mạ băng, đá vảy — thiết bị lạnh hút nhiệt khỏi phòng
       Tải dương (W): Rotor — tỏa nhiệt vào phòng
       
       Ý nghĩa ĐHKK: Thiết bị IQF/blast freezer đặt trong phòng chế biến 10-15°C
       sẽ hút nhiệt từ phòng → GIẢM tải ĐHKK (tải âm). Trong Peak Design không trừ
       tải âm vào Q_coil (conservative). Trong Energy Simulation có thể xét.
       
       Nguồn: ASHRAE Refrigeration 2022 Ch.14; thực tế nhà máy chế biến thủy sản VN */
    calcParasiticLoad({type, tRoom=22,
      // IQF
      L=5, W=3, H=2.5, uPanel=0.22, tChamber=-35, doorCode,
      // Mạ băng (Glazing)
      aBasin=10, tWater=0, kWater=20,
      // Đá vảy (Ice flake)
      mIceKgH=500, tWaterOut=5,
      // Rotor dehumidifier
      gAirM3h=2000, tInRotor=25, tOutRotor=40
    }){
      const P = App.data.PHYSICS;
      switch(type){
        case 'IQF': {
          // Vách IQF: Q = U×A_vách×(T_buồng − T_phòng) — âm vì T_buồng << T_phòng
          const A_walls = 2*(L*H + W*H); // 4 mặt bên
          const A_ceiling= L*W;           // nóc
          const A_floor  = L*W;           // đáy (cách nhiệt từ sàn)
          const dT = tChamber - tRoom;    // âm
          const Q_walls = uPanel * (A_walls + A_ceiling + A_floor*0.5) * dT;
          // Rò nhiệt qua khe cửa (estimate: khe hở cửa lạnh ≈ 5 W/m²K×A_khe×dT)
          const door = (App.data.doorCatalog||[]).find(d=>d.code===doorCode)||{aKheM2:0.008};
          const Q_door = door.aKheM2 * 15 * dT;
          return Q_walls + Q_door; // W (âm)
        }
        case 'GLAZE': {
          // Máy mạ băng: hút nhiệt để làm lạnh nước mạ băng
          // Q = K×A_bể×(T_phòng − T_nước) — âm vì bể nước lạnh hơn phòng
          if(!aBasin || aBasin<=0) return 0;
          const Q = -(aBasin) * (kWater||20) * Math.abs(tRoom - (tWater??0));
          return Q; // W (âm)
        }
        case 'ICE': {
          // Máy đá vảy: hút nhiệt từ nước để tạo đá
          // Q = ṁ×Cp×ΔT — âm (lấy nhiệt từ phòng qua nước cấp)
          if(!mIceKgH || mIceKgH<=0) return 0;
          const Q_sens = -(mIceKgH/3600) * P.CP_WATER * 1000 * Math.abs(tRoom-(tWaterOut??5));
          return Q_sens; // W (âm)
        }
        case 'ROTOR': {
          // Rotor dehumidifier: xử lý gió thải nhiệt vào phòng
          // Q = ṁ_air×Cp×ΔT — dương (thải nhiệt vào phòng)
          if(!gAirM3h || gAirM3h<=0) return 0;
          const Q = (gAirM3h/3600) * P.RHO_AIR * P.CP_AIR * 1000 * ((tOutRotor||40)-(tInRotor||25));
          return Q; // W (dương)
        }
        default: return 0;
      }
    },



    /* generateBOM — Tạo Bill of Materials từ Equipment Schedule
       Dùng trong exportXLSX() để tạo sheet BOM_So_Bo */
    generateBOM(rooms){
      const D=App.data;
      const bom=[];
      rooms.forEach(r=>{
        if(!r._coil) return;
        const sel=r._equip; // từ selectEquipAuto
        if(sel){
          bom.push({
            ma: sel.model||'—', ten: sel.name||r.equipType,
            loai: r.equipType, phong: r.name,
            sl: sel.qty||1, capKW: sel.totalCapKW?.toFixed(1)||'—',
            note: sel.utilization ? `Hiệu suất sử dụng: ${sel.utilization}%` : ''
          });
        }
      });
      // Nhóm theo model
      const grouped={};
      bom.forEach(b=>{
        const k=b.ma+'|'+b.loai;
        if(!grouped[k]) grouped[k]={...b, sl:0, phongs:[]};
        grouped[k].sl += b.sl;
        grouped[k].phongs.push(b.phong);
      });
      return Object.values(grouped).map(b=>({
        ...b, phong: b.phongs.slice(0,3).join(', ')+(b.phongs.length>3?` +${b.phongs.length-3} phòng`:'')
      }));
    },

    /* calcToiletVentilation — Exhaust-based ventilation cho nhà vệ sinh
       ASHRAE 62.1-2022 §6.2.7 Table 6-4 */
    calcToiletVentilation({nToilets=2, nUrinals=0, nShowers=0, nLocker=0, floorM2=15}){
      const Q_toilet  = nToilets  * 25;   // 25 L/s per water closet
      const Q_urinal  = nUrinals  * 17.5; // 17.5 L/s per urinal
      const Q_shower  = nShowers  * 35;   // 35 L/s per shower stall
      const Q_floor   = Math.max(floorM2 * 2.5, 12.5); // min 2.5 L/s/m²
      const Q_total   = Math.max(Q_toilet+Q_urinal+Q_shower, Q_floor);
      return {
        Q_total_m3h: Q_total * 3.6,
        Q_toilet:Q_toilet*3.6, Q_urinal:Q_urinal*3.6, Q_shower:Q_shower*3.6,
        note:'Exhaust-only. Makeup từ hành lang áp dương.',
        source:'ASHRAE 62.1-2022 §6.2.7 Table 6-4'
      };
    },

    /* calcKitchenExhaust — Tính lưu lượng hút khói bếp theo capture velocity
       ASHRAE Applications 2023 Ch.31; NFPA 96 §8.2 */
    calcKitchenExhaust({hoodWidthM=3, hoodDepthM=1.2, equipmentType='heavy', captureVelocityMs=null}){
      const vMap={light:0.35, medium:0.45, heavy:0.55, xheavy:0.65};
      const v = captureVelocityMs || vMap[equipmentType] || 0.5;
      const A_hood = hoodWidthM * hoodDepthM;
      const Q_exhaust = v * A_hood * 3600 * 1.1; // 10% safety factor
      const Q_makeup  = Q_exhaust * 0.85;
      return {
        Q_exhaust_m3h: Q_exhaust, Q_makeup_m3h: Q_makeup,
        captureVelocityMs: v, A_hood_m2: A_hood,
        source:'ASHRAE Applications 2023 Ch.31; NFPA 96 §8.2'
      };
    },

    /* ═══ THRESHOLD FLAGGING — Đánh dấu * thông số vượt ngưỡng tiêu chuẩn ═══
       Nguồn: ASHRAE 62.1-2022, ISO 14644-1:2015, ASHRAE HOF 2021, TCVN 5687:2010 */
    THRESHOLDS:{
      // nPeople: mật độ tối thiểu m²/người theo loại phòng
      occupancy:{ office:7, hotel_room:10, auditorium:0.65, retail:2.8, residential:10 },
      // LPD W/m² tối đa theo ASHRAE 90.1-2022
      // FIX: đã bỏ entry office/hotel_room/retail/hospital_patient vì BUILDING_TYPES.lightingWM2
      // đã có sẵn và ĐÚNG hơn (xem flagParams()) — giữ lại cleanroom/datacenter vì 2 loại này
      // KHÔNG có field lightingWM2 trong BUILDING_TYPES, vẫn cần giá trị tham chiếu riêng.
      lpd:{ cleanroom:8, datacenter:5, default:15 },
      // Gió tươi tối thiểu L/s/người (ASHRAE 62.1-2022 Table 6-1)
      // FIX: đã bỏ các entry riêng theo loại phòng (office/hotel_room/auditorium/retail/
      // residential/hospital_patient/hospital_or...) vì chúng LỆCH so với BUILDING_TYPES.
      // freshAirLsP (nguồn dữ liệu thật dùng để tính toán) — xem chi tiết trong flagParams().
      // Chỉ còn giữ .default cho trường hợp không tìm thấy buildingType tương ứng.
      freshAirMin:{ default:7.5 },
      // ACH tối thiểu theo loại phòng
      achMin:{ office:6, datacenter:30, hospital_or:20, hospital_patient:6, hotel_room:4, cleanroom:20, default:4 },
    },
    flagParams(r){
      const TH=this.THRESHOLDS;
      const flags=[];
      const bt=r.buildingType||'office';
      const btStdModule = (App.data.BUILDING_TYPES||[]).find(x=>x.id===bt)?.standardModule;
      const area=((r.L||0)*(r.W||0));
      const nP=parseInt(r.nPeople)||0;

      // * Mật độ người
      const occMin=TH.occupancy[bt]||TH.occupancy.office;
      if(nP>0&&area>0&&(area/nP)<occMin*0.7){
        flags.push({field:'nPeople',msg:App.ui.t('Mật độ {d} m²/người < {min} m²/ng tối thiểu (ASHRAE 62.1)',{d:(area/nP).toFixed(1),min:occMin}),severity:'warn'});
      }
      if(nP>0&&area>0&&(area/nP)<1.2){
        flags.push({field:'nPeople',msg:App.ui.t('Mật độ {d} m²/người quá dày (< 1.2 m²/ng)',{d:(area/nP).toFixed(1)}),severity:'error'});
      }

      // * LPD đèn
      // FIX (phát hiện khi rà soát toàn diện — cùng dạng lỗi với "Gió tươi" ở dưới): bảng
      // TH.lpd cũng là 1 bảng ngưỡng RIÊNG, tách biệt khỏi BUILDING_TYPES.lightingWM2 (nguồn
      // dữ liệu thật dùng để auto-fill r.lpdApplied) — và đã lệch ở 3 loại phòng (hotel_room,
      // retail, hospital_patient: ngưỡng cũ THẤP HƠN giá trị mặc định thật), khiến phòng dùng
      // ĐÚNG giá trị đèn mặc định theo tiêu chuẩn vẫn bị báo giả "LPD vượt ngưỡng". Dùng ngưỡng
      // = 1.15 × giá trị mặc định thật (BUILDING_TYPES) thay vì bảng riêng dễ lệch.
      const btForLpd=(App.data.BUILDING_TYPES||[]).find(x=>x.id===bt);
      const lpdMax=btForLpd?.lightingWM2 || TH.lpd[bt] || TH.lpd.default;
      if((r.lpdApplied||0)>lpdMax*1.15){
        flags.push({field:'lpdApplied',msg:App.ui.t('LPD {v} W/m² vượt {max} W/m² (ASHRAE 90.1-2022)',{v:r.lpdApplied,max:lpdMax}),severity:'warn'});
      }

      // * Gió tươi
      // FIX (phát hiện khi rà soát toàn diện): trước đây check này đọc THẲNG r.freshAirPerPersonLs
      // — field này CHỈ có giá trị nếu người dùng đã từng đổi qua dropdown "Loại công trình"
      // (kích hoạt auto-fill) hoặc tự gõ tay. Với bất kỳ phòng nào buildingType được set theo
      // đường khác (import JSON, project cũ tạo trước khi có auto-fill, gán trực tiếp qua
      // code...) thì field này = 0/undefined, khiến check LUÔN báo lỗi giả "Gió tươi 0 L/s/ng"
      // dù công thức tính thật (calcBuildingTypeAirflow) đã tự động dùng đúng giá trị mặc định
      // theo loại phòng (bt.freshAirLsP) — không hề có vấn đề gì thật. Dùng ĐÚNG chuỗi fallback
      // y hệt calcBuildingTypeAirflow: room.freshAirPerPersonLs || bt?.freshAirLsP || 8.5.
      const btObj=(App.data.BUILDING_TYPES||[]).find(x=>x.id===bt);
      const freshApplied=r.freshAirPerPersonLs || btObj?.freshAirLsP || 8.5;
      // FIX (phát hiện khi rà soát toàn diện): TH.freshAirMin là 1 bảng ngưỡng RIÊNG, tách biệt
      // hoàn toàn khỏi BUILDING_TYPES.freshAirLsP (nguồn dữ liệu thật, dùng để TÍNH TOÁN) — và
      // đã LỆCH NGHIÊM TRỌNG ở 6/7 loại phòng kiểm tra được (vd hospital_or: bảng cũ ghi 50
      // L/s/người trong khi giá trị thật theo ASHRAE 170 chỉ 15 — khiến MỌI phòng mổ luôn bị
      // báo lỗi giả "gió tươi không đạt" dù đang dùng đúng tiêu chuẩn). Bỏ hẳn bảng trùng lặp
      // này, lấy ngưỡng trực tiếp từ BUILDING_TYPES — nguồn duy nhất, không còn nguy cơ lệch.
      const freshMin=btObj?.freshAirLsP || TH.freshAirMin.default;
      if(freshApplied<freshMin&&nP>0){
        flags.push({field:'freshAir',msg:App.ui.t('Gió tươi {v} L/s/ng < {min} L/s/ng (ASHRAE 62.1-2022)',{v:freshApplied,min:freshMin}),severity:'error'});
      }

      // * ACH (bỏ qua DC/server_room vì dùng IT load, không dùng ACH)
      // Phòng sạch (mọi id có standardModule==='cleanroom') áp ACH tối thiểu 20 theo ISO 14644-1,
      // không phụ thuộc bảng TH.achMin chỉ khớp cứng id 'cleanroom'
      const achMin= btStdModule==='cleanroom' ? 20 : (TH.achMin[bt]||TH.achMin.default);
      const skipACH=['toilet','commercial_kitchen','datacenter','server_room'];
      if((r.achApplied||0)>0&&(r.achApplied||0)<achMin&&!skipACH.includes(bt)){
        flags.push({field:'achApplied',msg:App.ui.t('ACH {v} < {min} ACH tối thiểu cho {bt}',{v:r.achApplied,min:achMin,bt}),severity:'warn'});
      }

      // * ΔP cleanroom — tổng quát theo standardModule (không khớp cứng theo id 'cleanroom'),
      // để phòng sạch tự thêm với id khác nhưng cùng standardModule vẫn được cảnh báo đúng
      if(btStdModule==='cleanroom'&&(r.deltaPPa||0)<=0){
        flags.push({field:'deltaPPa',msg:App.ui.t('Phòng sạch phải có áp dương (ISO 14644-1)'),severity:'error'});
      }

      // * Tỷ lệ gió tươi < 10% cho phòng có người
      if(r._airflow&&r._airflow.freshPct<10&&nP>0&&bt!=='datacenter'){
        flags.push({field:'freshPct',msg:App.ui.t('Tỷ lệ gió tươi {pct}% < 10% (ASHRAE 62.1)',{pct:r._airflow.freshPct.toFixed(1)}),severity:'warn'});
      }

      return flags;
    },

    /* calcBuildingTypeAirflow — Hub routing gió theo loại công trình
       Tự động chọn phương pháp tính phù hợp:
       - Cleanroom → calcCleanroomAirflow (ISO/GMP chuẩn)
       - Data Center → calcDataCenterAirflow (ASHRAE TC9.9)
       - Toilet → calcToiletVentilation (ASHRAE 62.1 fixture-based)
       - Kitchen → calcKitchenExhaust (capture velocity, NFPA 96)
       - Tất cả còn lại → ASHRAE 62.1 + ACH method
    */
    calcBuildingTypeAirflow(room, climate){
      const C = App.calc;
      const D = App.data;
      const bt = (D.BUILDING_TYPES||[]).find(b=>b.id===room.buildingType);
      // Inline shape calc để tránh circular ref với App.ui
      const _areaFn=(r)=>{const s=r.roomShape||'rect';if(s==='custom')return parseFloat(r.customAreaM2)||0;const L=parseFloat(r.L)||0,W=parseFloat(r.W)||0;if(s==='hex')return 0.866*L*W;if(s==='oct')return 0.828*L*W;return L*W;};
      const floorM2 = _areaFn(room);
      const vol = floorM2 * (parseFloat(room.H)||0);
      const nPeople = parseInt(room.nPeople)||0;
      const cl = climate || App.state.hlClimate || {tOut:35,rhOut:80,tIn:22,rhIn:55,elevationM:0};

      // ── Toilet: fixture-based ASHRAE 62.1 §6.2.7 ──
      if(room.buildingType==='toilet'){
        const r=C.calcToiletVentilation({
          nToilets:room.nToilets||2, nUrinals:room.nUrinals||0,
          nShowers:room.nShowers||0, floorM2
        });
        return { Q_supply:r.Q_total_m3h, Q_fresh:r.Q_total_m3h,
          Q_recirculation:0, Q_return:0, Q_pressurization:0,
          Q_people_min:0, ACH_actual:(r.Q_total_m3h/Math.max(vol,1)),
          freshPct:100, modeNote:'Exhaust-only (ASHRAE 62.1 §6.2.7)',
          stdRef:r.source, warnings:[], _specialResult:r };
      }

      // ── Commercial Kitchen: capture velocity NFPA 96 ──
      if(room.buildingType==='commercial_kitchen'){
        const r=C.calcKitchenExhaust({
          hoodWidthM:room.hoodWidthM||3, hoodDepthM:room.hoodDepthM||1.2,
          equipmentType:room.kitchenType||'heavy'
        });
        return { Q_supply:r.Q_makeup_m3h, Q_fresh:r.Q_makeup_m3h,
          Q_recirculation:0, Q_return:0, Q_pressurization:0,
          Q_people_min:0, ACH_actual:(r.Q_exhaust_m3h/Math.max(vol,1)),
          freshPct:100, modeNote:`Exhaust hood ${room.hoodWidthM||3}×${room.hoodDepthM||1.2}m (NFPA 96)`,
          stdRef:r.source, warnings:[], _specialResult:r };
      }

      // ── Data Center / Server Room: ASHRAE TC9.9 ──
      if(room.buildingType==='datacenter'||room.buildingType==='server_room'){
        const qIT = (room.itLoadKWM2||1.5) * floorM2;
        const r=C.calcDataCenterAirflow({qTotalKW:qIT, deltaT:room.deltaT||12});
        return { Q_supply:r.Q_supply, Q_fresh:r.Q_fresh||0,
          Q_recirculation:r.Q_recirculation, Q_return:r.Q_recirculation,
          Q_pressurization:0, Q_people_min:0,
          ACH_actual:(r.Q_supply/Math.max(vol,1)),
          freshPct:0, modeNote:r.note, stdRef:'ASHRAE TC9.9 2021',
          warnings:[], _itLoadKW:qIT };
      }

      // ── Cleanroom ISO/GMP: calcCleanroomAirflow — áp dụng cho MỌI loại phòng có
      // standardModule==='cleanroom' (không khớp cứng theo id 'cleanroom'), để các loại
      // phòng sạch tự thêm/mở rộng sau này (khác id, cùng standardModule) vẫn tính đúng
      if(bt?.standardModule==='cleanroom' && room.classSystem && room.classCode){
        try{
          return C.calcCleanroomAirflow({
            classSystem:room.classSystem, classCode:room.classCode,
            volumeM3:vol, nPeople, freshAirPerPersonLs:room.freshAirPerPersonLs||10,
            achApplied:room.achApplied, faceAreaM2:room.faceAreaM2,
            uniVelocityMs:room.uniVelocityMs,
            pressMethod:room.pressMethod||'ach', pressACH:room.pressACH,
            doors:room.doorRows||[], gapWidthMm:room.gapWidthMm||3,
            deltaPDesignPa:room.deltaPPa
          });
        }catch(e){ /* fallback to general */ }
      }

      // ── Tất cả loại còn lại: ASHRAE 62.1 Ventilation Rate Procedure ──
      const ach = room.achApplied || bt?.achDefault || 8;
      const Q_sup = vol * ach;
      const Q_ppl = nPeople * (room.freshAirPerPersonLs || bt?.freshAirLsP || 8.5) * 3.6;
      const Q_area = floorM2 * (bt?.freshAirLsM2 || 0.9) * 3.6;
      // FIX: một số loại phòng y tế (Phòng mổ, phòng bệnh nhân, cách ly...) theo ASHRAE 170
      // có yêu cầu ACH gió tươi TỐI THIỂU RIÊNG (vd Phòng mổ: 4 ACH gió tươi, tách biệt với
      // 20 ACH tổng) — trước đây yêu cầu này chỉ nằm trong ghi chú mô tả (note), KHÔNG có
      // field nào được đọc để tính/kiểm tra thật, nên phòng có thể hiện "✓ ĐẠT" dù gió tươi
      // thực tế thấp hơn nhiều so với 4 ACH bắt buộc. Giờ đọc achFreshMin nếu có, cộng vào
      // các cơ sở tính Q_fresh_min.
      const Q_achFresh = bt?.achFreshMin ? vol * bt.achFreshMin : 0;
      // FIX: gió thải cục bộ từ thiết bị (chụp hút bếp, lò nướng, máy hấp, tủ hàn, hút khói
      // gas...) — trước đây KHÔNG có cách nào khai báo trong app, nên gió tươi bù cho phần
      // bị hút đi hoàn toàn không được tính, dễ khiến xưởng bị áp âm khi thiết kế thực tế có
      // nhiều thiết bị hút cục bộ (đề xuất từ thực tế nhà máy chế biến snack). Áp dụng được
      // cho MỌI loại phòng (không gò theo mục đích sử dụng), mặc định KHÔNG bật — giống cơ
      // chế Mái/Sàn: phòng nào cần thì tự tick.
      // 2 chế độ bù (do người dùng chọn ở form):
      //  'ahu' (mặc định): gió bù đi qua hệ thống chính (AHU/PAU) → cộng vào Q_fresh_min,
      //         được xử lý nhiệt/ẩm như gió tươi thông thường, có ảnh hưởng Q_coil.
      //  'raw' : gió bù thuần túy qua quạt cấp riêng, KHÔNG qua coil hệ thống chính → tách
      //         riêng thành Q_makeupRaw, không cộng vào Q_fresh/Q_supply/Q_coil (tiết kiệm
      //         năng lượng, chỉ để cân bằng áp suất — đúng thực tế nhiều nhà máy dùng quạt
      //         cấp bù riêng gần điểm hút thay vì xử lý nhiệt toàn bộ lượng bù).
      const Q_localExhaust = room.hasLocalExhaustEquip
        ? (room.localExhaustRows||[]).reduce((s,eq)=>s+(parseFloat(eq.qPerUnitM3h)||0)*(parseFloat(eq.qty)||1), 0)
        : 0;
      const localExhaustRaw = room.hasLocalExhaustEquip && room.localExhaustTreated==='raw';
      const Q_achFreshWithExhaust = localExhaustRaw ? Q_achFresh : Math.max(Q_achFresh, Q_localExhaust);
      const Q_makeupRaw = localExhaustRaw ? Q_localExhaust : 0;
      // Ventilation Rate Procedure: Vbz = Rpz×Pz + Rpa×Az (ASHRAE 62.1-2022 Eq.6.2.2.1)
      const Q_fresh_min = Math.max(Q_ppl, Q_area, Q_achFreshWithExhaust);
      // Bù áp dương: 2 phương pháp — 'ach' (thể tích phòng × ACH_bù) hoặc 'door' (rò rỉ qua
      // khe cửa, phụ thuộc số lượng/loại cửa). TRƯỚC ĐÂY nhánh này LUÔN dùng công thức ACH bất
      // kể room.pressMethod là gì — khiến chọn "Theo rò rỉ qua khe cửa" và đổi số lượng cửa
      // không có tác dụng gì với các loại phòng thường (chỉ cleanroom mới tính đúng qua
      // calcCleanroomAirflow ở nhánh trên). Đã sửa để nhánh chung cũng tôn trọng pressMethod.
      let Q_prs = 0;
      if(room.deltaPPa > 0){
        if(room.pressMethod==='door' && (room.doorRows||[]).length>0){
          const doorInputs = (room.doorRows||[]).map(d=>{
            const cat = (App.data.doorCatalog||[]).find(c=>c.code===d.doorCode);
            return { wMm: cat?.wMm||900, hMm: cat?.hMm||2100, qty: d.qty||1 };
          });
          const res = C.doorLeakageAirflow({ doors:doorInputs, gapWidthMm:room.gapWidthMm||3, deltaPPa:room.deltaPPa });
          Q_prs = res.qM3h;
        } else {
          Q_prs = vol*(room.pressACH||bt?.pressACHMin||0.5);
        }
      }
      let Q_fresh = Math.max(Q_fresh_min, Q_prs);
      // FIX: PAU (Primary Air Unit) = 100% gió tươi theo đúng định nghĩa, không có gió hồi —
      // TRƯỚC ĐÂY nhánh tính cho "mọi loại phòng còn lại" (bao gồm Phòng mổ, phòng bệnh nhân...)
      // hoàn toàn KHÔNG đọc room.equipType, nên chọn AHU hay PAU cho ra CÙNG 1 lưu lượng gió
      // tươi/gió cấp — chỉ cleanroom (calcCleanroomAirflow) mới xử lý đúng PAU=100%OA. Hậu quả:
      // (1) chọn PAU vẫn thấy Q_tươi nhỏ bên cạnh Q_cấp/Q_hồi lớn (sai bản chất PAU), và
      // (2) tầng tính coil (calcCoil) lại DÙNG ĐÚNG công thức PAU (hMix=hOut, coi như 100%
      // OA) áp cho TOÀN BỘ lưu lượng cấp — trong khi tầng gió chỉ tính 1 phần nhỏ là "tươi",
      // gây lệch pha giữa 2 tầng tính → Q_coil bị thổi phồng bất thường (gấp nhiều lần AHU
      // dù cùng điều kiện, đúng như trường hợp bạn phát hiện: 59kW AHU vs 303kW PAU).
      if(room.equipType==='PAU'){
        Q_fresh = Q_sup;
      }
      // FIX: nếu ACH tổng người dùng đặt (achApplied) quá thấp, không đủ "chỗ" cho riêng
      // lượng gió tươi bắt buộc theo ACH y tế (achFreshMin) — vd đặt 3 ACH tổng cho phòng
      // yêu cầu tối thiểu 4 ACH gió tươi — thì Q_fresh (đã đảm bảo ≥ yêu cầu ACH y tế ở trên)
      // sẽ VƯỢT QUÁ Q_sup đang khai báo. Đây là xung đột thiết kế thật cần cảnh báo, không
      // phải lỗi tính toán — người dùng cần tăng ACH tổng lên tối thiểu bằng achFreshMin.
      const Q_supFinal = Math.max(Q_sup, Q_fresh);
      const Q_recirc = Math.max(0, Q_supFinal - Q_fresh);

      const warnings = [];
      if(bt?.achMin && ach < bt.achMin)
        warnings.push({level:'yellow',code:'ACH_LOW',msg:App.ui.t('ACH {ach} < khuyến nghị {min} ({ref})',{ach,min:bt.achMin,ref:bt.stdRef})});
      if(Q_fresh < Q_fresh_min)
        warnings.push({level:'red',code:'FRESH_MIN',msg:App.ui.t('Gió tươi < yêu cầu ASHRAE 62.1')});
      // FIX: cảnh báo khi ACH tổng đặt thấp hơn ACH gió tươi tối thiểu bắt buộc — nghĩa là
      // dù 100% gió cấp là gió tươi cũng không đủ, phải tăng ACH tổng (hoặc Q_cấp) lên
      if(bt?.achFreshMin && ach < bt.achFreshMin){
        warnings.push({level:'red',code:'ACH_FRESH_MIN',
          msg:App.ui.t('ACH tổng đang đặt ({ach}) THẤP HƠN ACH gió tươi tối thiểu bắt buộc ({min} ACH, {ref}) — phải tăng ACH tổng lên ít nhất {min}',{ach,min:bt.achFreshMin,ref:bt.stdRef})});
      }
      // FIX: cảnh báo khi đã tick "có gió thải cục bộ" nhưng chưa nhập lưu lượng hút thực tế
      // cho thiết bị nào — tránh trường hợp tick nhầm/quên điền, khiến app âm thầm không
      // cộng thêm gió bù nào cả (Q_localExhaust=0) mà không ai biết.
      if(room.hasLocalExhaustEquip && Q_localExhaust<=0){
        warnings.push({level:'yellow',code:'LOCAL_EXHAUST_EMPTY',
          msg:App.ui.t('Đã tick "Có thiết bị hút thải cục bộ" nhưng chưa nhập lưu lượng hút cho thiết bị nào — gió bù chưa được tính')});
      }

      return { Q_supply:Q_supFinal, Q_fresh, Q_recirculation:Q_recirc, Q_return:Q_recirc,
        Q_pressurization:Q_prs, Q_people_min:Q_ppl, ACH_actual:ach,
        ACH_fresh_actual: vol>0 ? Q_fresh/vol : 0, ACH_fresh_required: bt?.achFreshMin||null,
        Q_localExhaust, Q_makeupRaw, localExhaustTreated: room.hasLocalExhaustEquip?(room.localExhaustTreated||'ahu'):null,
        freshPct:Q_supFinal>0?(Q_fresh/Q_supFinal)*100:0,
        modeNote:`${bt?.name||'General'} — ${ach} ACH (ASHRAE 62.1-2022)`,
        stdRef:bt?.stdRef||'ASHRAE 62.1-2022', warnings };
    },

    /* ═══ END ENGINE MỚI ═══ */
  };
  /*CALC_MODULE*/
})();
