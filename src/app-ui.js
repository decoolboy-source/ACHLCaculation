// app-ui.js — Giao diện (App.ui), lệnh nhanh (App.cmd), phím tắt (App.kbd), lưu tự
// động (App.admin), xuất báo cáo (App.report), và điểm khởi động app (App.bootstrap).
// Phần 3/3 — PHẢI load SAU app-data.js và app-calc.js.
(function(){
  const App = window.AppMultiHVAC;


  // ============== UI — Render giao diện ==============
  App.ui = {
    t(key){
      const dict = App.data.i18n[App.state.lang] || App.data.i18n.vi;
      return dict[key] || key;
    },
    applyI18n(){
      document.querySelectorAll('[data-i18n]').forEach(el=>{
        el.textContent = this.t(el.getAttribute('data-i18n'));
      });
    },
    toast(type, message){
      const colors = { ok:'border-emerald-600 text-emerald-300', warn:'border-amber-600 text-amber-300', err:'border-red-600 text-red-300', info:'border-cyan-600 text-cyan-300' };
      const icon = { ok:'check-circle', warn:'alert-triangle', err:'x-circle', info:'info' }[type] || 'info';
      const div = document.createElement('div');
      div.className = `toast-enter bg-base-800 border ${colors[type]||colors.info} rounded-lg px-3 py-2 text-xs flex items-start gap-2 shadow-lg`;
      div.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 mt-0.5 shrink-0"></i><span>${message}</span>`;
      document.getElementById('toast-container').appendChild(div);
      if(window.lucide) lucide.createIcons();
      setTimeout(()=>{ div.style.opacity='0'; div.style.transition='opacity .3s'; setTimeout(()=>div.remove(),300); }, 4000);
    },
    setStatus(text){
      document.getElementById('status-text').textContent = text;
    },
    setStatusProject(){
      const p = App.state.activeProjectId;
      document.getElementById('status-project').textContent = p ? ('Dự án: ' + (App.state.inputs.projectName||p)) : '';
    },

    TABS: [
      {id:'project',  icon:'building-2',  key:'tab_project'},
      {id:'heatload', icon:'thermometer', key:'tab_heatload'},
      {id:'calc', icon:'ruler', key:'tab_calc'},
      {id:'admin', icon:'database', key:'tab_admin'},
      {id:'settings', icon:'settings', key:'tab_settings'},
      {id:'ai', icon:'bot', key:'tab_ai'},
      {id:'guide', icon:'book-open', key:'tab_guide'},
      {id:'about', icon:'info', key:'tab_about'},
      {id:'report', icon:'file-down', key:'tab_report'}
    ],

    renderNav(){
      const ICONS_SVG={
        thermometer:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        ruler:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/></svg>',
        database:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        settings:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        bot:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
        'book-open':'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        info:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        'file-down':'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>',
        wind:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></svg>',
      };
      const html = this.TABS.map((tb,i)=>`
        <button data-tab="${tb.id}" class="nav-btn flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm border border-transparent hover:bg-slate-800 text-slate-300 ${App.state.activeTab===tb.id?'tab-active':''}">
          ${ICONS_SVG[tb.icon]||''}
          <span>${this.t(tb.key)}</span>
        </button>`).join('');
      document.getElementById('sidebar').innerHTML = html;
      // FIX: trước đây ghi thẳng vào #mobile-nav.innerHTML — XÓA MẤT phần tiêu đề "📋 Điều
      // hướng" + nút đóng (X) tĩnh có sẵn trong index.html (là con trực tiếp của #mobile-nav),
      // vì lệnh này CHẠY MỖI KHI app khởi động, ngay từ đầu — nghĩa là nút X thực tế KHÔNG
      // BAO GIỜ hiển thị được cho người dùng. Người dùng vẫn đóng được sidebar bằng cách chạm
      // vùng nền tối bên ngoài (xem dòng ~203), nhưng thiếu hẳn nút đóng tường minh — không
      // chuẩn UX, dễ gây cảm giác "menu không đóng được" giống phản ánh thực tế đã nhận. Giờ
      // chỉ ghi vào #mobile-nav-items (container riêng cho danh sách nút, xem index.html),
      // giữ nguyên phần tiêu đề + nút X.
      const mobileNavItems = document.getElementById('mobile-nav-items');
      if(mobileNavItems) mobileNavItems.innerHTML = html;
      else document.getElementById('mobile-nav').innerHTML = html; // fallback nếu HTML cũ chưa cập nhật

      // Bind click listeners cho tất cả nav buttons (sidebar + mobile drawer)
      document.querySelectorAll('#sidebar .nav-btn, #mobile-nav .nav-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          App.ui.showTab(btn.getAttribute('data-tab'));
          document.getElementById('mobile-drawer')?.classList.add('hidden');
        });
      });

      // Bind nút đóng (X) tường minh trong header sidebar mobile
      document.getElementById('btn-close-drawer')?.addEventListener('click', ()=>{
        document.getElementById('mobile-drawer')?.classList.add('hidden');
      });

      // Bottom nav removed — hamburger drawer used for mobile navigation
    },

    showConfirm(title, message, confirmLabel, onConfirm){
      // Modal thay thế confirm() — WKWebView không hỗ trợ window.confirm()
      const modal=document.getElementById('modal-root');
      if(!modal){ onConfirm(); return; } // fallback nếu không có modal
      modal.innerHTML=`
        <div style="background:#0d1f35;border:1px solid #1e3050;border-radius:12px;padding:20px;max-width:340px;width:calc(100vw - 40px)">
          <h3 style="font-size:15px;font-weight:700;color:#edf2f8;margin-bottom:6px">${title}</h3>
          ${message?`<p style="font-size:13px;color:#8eaac2;margin-bottom:16px">${message}</p>`:'<div style="height:12px"></div>'}
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button id="sc-cancel" style="background:#122032;border:1px solid #234168;color:#8eaac2;border-radius:7px;padding:8px 16px;font-size:13px;cursor:pointer">Hủy</button>
            <button id="sc-ok" style="background:#b91c1c;border:none;color:white;border-radius:7px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">${confirmLabel||'Xác nhận'}</button>
          </div>
        </div>`;
      modal.classList.remove('hidden');
      modal.querySelector('#sc-cancel').onclick=()=>modal.classList.add('hidden');
      modal.querySelector('#sc-ok').onclick=()=>{ modal.classList.add('hidden'); onConfirm(); };
    },

    showTab(id){
      App.state.activeTab = id;
      if(id==='project') App.ui.project?.render();
      // Duct tab: auto-refresh import preview khi switch sang (không cần switch ra rồi vào)
      if(id==='calc'){
        setTimeout(()=>{
          const panel=document.getElementById('panel-calc');
          if(panel) App.ui.calc.render();
        },50);
      }
      // Đóng mobile drawer khi chọn tab
      document.getElementById('mobile-drawer')?.classList.add('hidden');
      // Cập nhật active state cho tất cả nav buttons (sidebar + mobile drawer + bottom nav)
      document.querySelectorAll('.nav-btn').forEach(b=>{
        const active = b.getAttribute('data-tab')===id;
          b.classList.toggle('tab-active', active);
      });
      document.querySelectorAll('.tab-panel').forEach(p=> p.classList.toggle('hidden', p.id !== 'panel-'+id));
      if(window.lucide) lucide.createIcons();
    },

    panelShell(id, titleKey, iconName, bodyHtml){
      const ICONS={
        'thermometer':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        'ruler':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/></svg>',
        'zap':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
        'wind':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></svg>',
        'layers':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>',
        'layers-2':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L8 12"/><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z"/></svg>',
        'cpu':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg>',
        'git-branch':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
        'file-down':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>',
        'database':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        'settings':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        'bot':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>',
        'help-circle':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        'book-open':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        'info':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        'layout-grid':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/></svg>',
        'server':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
        'cloud':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
      };
      const ICON_COLORS={'thermometer':'#f87171','ruler':'#22d3ee','zap':'#fbbf24','wind':'#34d399','layers':'#c084fc','layers-2':'#34d399','cpu':'#22d3ee','git-branch':'#c084fc','file-down':'#fb923c','database':'#38bdf8','settings':'#94a3b8','bot':'#38bdf8','help-circle':'#38bdf8','book-open':'#94a3b8','info':'#64748b','layout-grid':'#34d399','server':'#22d3ee','cloud':'#38bdf8'};
      const c=ICON_COLORS[iconName]||'#8eaac2';
      const svg=ICONS[iconName]||'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>';
      return `
      <section id="panel-${id}" class="bg-panel-800/60 border border-slate-800 rounded-xl" style="overflow:hidden">
        <button class="panel-toggle w-full flex items-center justify-between px-4 text-left" style="min-height:48px">
          <span class="flex items-center gap-2.5">
            <span style="color:${c};width:16px;height:16px;display:inline-flex;flex-shrink:0">${svg}</span>
            <span class="font-semibold" style="font-size:13px;color:#e8edf5">${this.t(titleKey)}</span>
          </span>
          <svg class="panel-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3a5470" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="panel-body border-t border-slate-800/70">${bodyHtml}</div>
      </section>`;
    },
    bindPanelToggles(root){
      root.querySelectorAll('.panel-toggle').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const sec = btn.closest('section');
          sec.classList.toggle('panel-collapsed');
          const chev = btn.querySelector('.panel-chevron');
          chev.style.transform = sec.classList.contains('panel-collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
        });
      });
    },

    renderAllTabs(){
      const root = document.getElementById('tab-content');
      root.innerHTML = `
        <div id="panel-project" class="tab-panel hidden space-y-4"></div>
        <div id="panel-calc" class="tab-panel hidden space-y-4"></div>
        <div id="panel-admin" class="tab-panel hidden space-y-4"></div>
        <div id="panel-settings" class="tab-panel hidden space-y-4"></div>
        <div id="panel-ai" class="tab-panel hidden space-y-4"></div>
        <div id="panel-heatload" class="tab-panel hidden space-y-4"></div>
        <div id="panel-guide" class="tab-panel hidden space-y-4"></div>
        <div id="panel-about" class="tab-panel hidden space-y-4"></div>
        <div id="panel-report" class="tab-panel hidden space-y-4"></div>
      `;
      App.ui.project.render();
      App.ui.calc.render();
      App.ui.admin.render();
      App.ui.settings.render();
      App.ui.ai.render();
      App.ui.heatload.render();
      App.ui.guide.render();
      App.ui.about.render();
      App.ui.report.render();
      this.showTab(App.state.activeTab);
      if(window.lucide) lucide.createIcons();
    },

    init(){
      this.renderNav();
      this.renderAllTabs();
      const drawer=document.getElementById('mobile-drawer');
      const closeDrawer=()=>drawer.classList.add('hidden');
      document.getElementById('btn-hamburger').addEventListener('click', ()=>drawer.classList.remove('hidden'));
      // Đóng khi click backdrop (click ngoài nav)
      drawer.addEventListener('click', e=>{ if(e.target===drawer) closeDrawer(); });
      // Đóng khi click nút X
      document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);
      document.getElementById('mobile-drawer').addEventListener('click', (e)=>{ if(e.target.id==='mobile-drawer') e.target.classList.add('hidden'); });
      document.getElementById('btn-cmdk').addEventListener('click', ()=> App.cmd.open());
      document.getElementById('btn-cmdk-mobile').addEventListener('click', ()=> App.cmd.open());
      this.setStatus(this.t('ready'));
    }
  };
  // ---- Sub-module: Tab Tính Toán ----
  // ═══════════════════════════════════════════════════════════════════════════
  // Tab Thiết Kế Ống Gió — Duct Design
  // Phạm vi: sizing ống (W×H / Ø), vật liệu, cách nhiệt, tổn thất ma sát,
  //          kiểm tra đọng sương, NC tiếng ồn, ESP quạt yêu cầu.
  // Lưu lượng đầu vào: nhập tay HOẶC import từ Tab Phụ Tải Nhiệt.
  // KHÔNG còn: chọn loại phòng, tính tải nhiệt, thiết bị điện, workshop.
  // ═══════════════════════════════════════════════════════════════════════════
  App.ui.calc = {

    render(){
      const root = document.getElementById('panel-calc');
      const I = App.state.inputs;
      root.innerHTML = `
      <div class="grid md:grid-cols-3 gap-4 min-w-0" style="overflow:hidden">
        <div class="md:col-span-2 space-y-4 min-w-0" style="overflow:hidden">
          ${App.ui.panelShell('duct-import','import_from_hl','download', this._importHtml())}
          ${App.ui.panelShell('branch','branch_table_title','git-branch', this._branchTableHtml())}
        </div>
        <div class="space-y-4">
          <div class="bg-panel-800/60 border border-slate-800 rounded-xl p-4">
            <button id="btn-duct-calc" style="width:100%;background:#059669;color:#ffffff;border:none;border-radius:10px;padding:14px 16px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s;-webkit-appearance:none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span style="color:#ffffff;font-size:14px;font-weight:700">Tính ống gió</span>
            </button>
            <p style="font-size:11px;color:#4a6680;margin-top:6px;text-align:center">Ctrl+Enter để tính nhanh</p>
          </div>
          <div id="duct-results" style="scroll-margin-top:80px"></div>
          <div id="duct-diag"></div>
        </div>
      </div>`;
      App.ui.bindPanelToggles(root);
      this._bindEvents(root);
      if(window.lucide) lucide.createIcons();
    },

    // ── Import lưu lượng từ Tab Phụ Tải Nhiệt ────────────────────────────────
    _importHtml(){
      const hlRooms = (App.state.hlRooms||[]).filter(r=>r._af?.L_supply>0);
      const hasCurrent = (App.state.branches||[]).length > 0;
      const previewRows = hlRooms.map(r=>`
        <tr>
          <td class="px-2 py-1">${r.name||'—'}</td>
          <td class="px-2 py-1 text-[11px] ${r.equipType==='AHU'?'text-cyan-400':r.equipType==='FCU'?'text-emerald-400':r.equipType==='FCU_OA'?'text-teal-400':r.equipType==='PAU'?'text-violet-400':'text-slate-400'}">${r.equipType}</td>
          <td class="px-2 py-1 text-right font-mono-data">${(r._af.L_supply||0).toFixed(0)}</td>
          <td class="px-2 py-1 text-right font-mono-data">${(r._af.L_fresh||0).toFixed(0)}</td>
          <td class="px-2 py-1 text-right font-mono-data ${(r._af.L_return||0)<0?'text-red-400':''}">${(r._af.L_return||0).toFixed(0)}</td>
          <td class="px-2 py-1 text-right font-mono-data text-amber-400">${(r._coil?.qCoilKW||0).toFixed(1)}</td>
        </tr>`).join('');

      return hlRooms.length === 0 ? `
        <div class="text-xs text-slate-500 flex items-center gap-2 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
          Tính toán Tab "Phụ Tải Nhiệt" trước để import lưu lượng tự động.
          Hoặc nhập tay Q (m³/h) cho từng nhánh ống trong bảng bên dưới.
        </div>` : `
        <div class="space-y-3">
          <p class="text-xs text-slate-400">Tìm thấy <span class="text-emerald-400 font-medium">${hlRooms.length} phòng</span> đã tính trong Tab Phụ Tải Nhiệt. Import lưu lượng L_cấp làm đầu vào nhánh ống chính.</p>
          <div class="overflow-x-auto">
            <table class="zebra w-full text-xs">
              <thead class="text-slate-400"><tr>
                <th class="text-left px-2 py-1.5">Phòng</th><th class="px-2">Loại TB</th>
                <th class="px-2">L_cấp (m³/h)</th><th class="px-2">L_tươi</th>
                <th class="px-2">L_hồi</th><th class="px-2">Q_coil (kW)</th>
              </tr></thead>
              <tbody>${previewRows}</tbody>
            </table>
          </div>
          <div class="flex gap-2 flex-wrap">
            <!-- Nút thêm nhánh theo từng thiết bị -->
          ${(App.state.hlEquipGroups||[]).length>0?`
          <div style="margin-bottom:10px">
            <p style="font-size:10px;color:#4a6680;margin-bottom:6px">Thêm nhánh ống nhanh theo thiết bị:</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${(App.state.hlEquipGroups||[]).map(g=>`
                <button data-quick-branch="${g.id}" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);color:#34d399;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer">
                  + ${g.equipType||'AHU'} ${g.name}: Nhánh ống
                </button>`).join('')}
            </div>
          </div>`:''}
          <button id="btn-import-hl-append" class="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></i>Import thêm vào bảng ống hiện tại
            </button>
            <button id="btn-import-hl-replace" class="border border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>Thay thế toàn bộ bảng ống
            </button>
          </div>
          ${hasCurrent?'<p class="text-[11px] text-slate-500">Bảng ống hiện tại có '+App.state.branches.length+' nhánh.</p>':''}
        </div>`;
    },

    // ── Bảng nhánh ống gió (với tree structure) ─────────────────────────────
    _branchTableHtml(){
      const rows = App.state.branches || [];
      const matOpts   = App.data.ductMaterials.filter(m=>!(App.state.hiddenMaterialIds?.ductMaterials||[]).includes(m.id)).map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
      const insOpts   = App.data.insulationMaterials.filter(m=>!(App.state.hiddenMaterialIds?.insulation||[]).includes(m.id)).map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
      const filterOpts= App.data.filterStages.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');

      // Xây cây để tính depth và cumPa
      const tree = this._buildBranchTree(rows);
      const depthMap={}, cumPaMap={};
      const traverse=(nodes, depth, cumPa)=>nodes.forEach(n=>{
        depthMap[n.id]=depth;
        const segFriction=n._result?.frictionPa||0;
        const segLocal=n._result?.localPa||0;
        cumPaMap[n.id]=(cumPa+segFriction+segLocal);
        traverse(n.children||[], depth+1, cumPaMap[n.id]);
      });
      traverse(tree, 0, 0);

      // Tìm critical path (cumPa lớn nhất)
      const maxCumPa=Math.max(0,...Object.values(cumPaMap));
      const criticalIds=new Set();
      if(maxCumPa>0){
        // Trace ngược từ node có cumPa cao nhất
        const maxNodeId=Object.keys(cumPaMap).find(id=>cumPaMap[id]===maxCumPa);
        let cur=rows.find(b=>b.id===maxNodeId);
        while(cur){ criticalIds.add(cur.id); cur=rows.find(b=>b.id===cur.parentId); }
      }

      // Tùy chọn parent
      const parentOpts=`<option value="">(Ống gốc / Root)</option>`+
        rows.map(b=>`<option value="${b.id}">${'─'.repeat((depthMap[b.id]||0)+1)} ${b.name||b.id}</option>`).join('');

      const tbody=rows.map((b,i)=>{
        const depth=depthMap[b.id]||0;
        const isCP=criticalIds.has(b.id);
        const cumPa=cumPaMap[b.id]||0;
        const localPa=b._result?.localPa||0;
        const indent='│ '.repeat(depth);
        const connector=depth>0?(i<rows.length-1&&rows[i+1]&&(depthMap[rows[i+1].id]||0)>=depth?'├─':'└─'):'┌─';
        // FIX: layout cũ nhồi 20 cột vào 1 bảng cuộn ngang — trên mobile mỗi ô quá hẹp, select
        // dài chữ bị co lại gần như biến mất trong khi ô số bên cạnh giãn to bất thường (cùng
        // lỗi đã gặp ở door-rows/partition-rows/layer-calculator). Đổi sang thẻ xếp dọc: mỗi
        // nhánh 1 khối, field nào cần đọc tên dài (vật liệu, cách nhiệt, lọc, parent) được full
        // chiều rộng riêng 1 dòng; field số ngắn (Q, v, L, dày, T°) mới ghép chung hàng.
        return `<div class="border rounded-lg p-2.5 space-y-2 ${isCP?'border-amber-500 bg-amber-950/20':'border-slate-700/50'}" data-bidx="${i}">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[9px] text-slate-600 flex-shrink-0">${indent}${depth>0?connector:'┌─'}</span>
            <input data-brow="name" value="${b.name||'Nhánh '+(i+1)}" placeholder="Tên nhánh"
              class="flex-1 bg-base-900 border ${isCP?'border-amber-600':'border-slate-700'} rounded px-2 py-1.5 text-xs font-medium">
            <button data-brow-del="${i}" class="flex-shrink-0 text-slate-500 hover:text-red-400 p-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><label class="text-[9px] text-slate-500">Thiết bị (nhóm)</label>
              <select data-brow="equipGroupId" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">
                <option value="">-- Chung --</option>
                ${(App.state.hlEquipGroups||[]).map(g=>`<option value="${g.id}" ${b.equipGroupId===g.id?'selected':''}>${g.equipType||''} ${g.name||g.id}</option>`).join('')}
              </select>
            </div>
            <div><label class="text-[9px] text-slate-500">Nhánh cha (Parent)</label>
              <select data-brow="parentId" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">
                ${parentOpts.replace(`value="${b.parentId||''}"`,`value="${b.parentId||''}" selected`)}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><label class="text-[9px] text-slate-500">Q (m³/h)</label><input data-brow="qM3h" type="number" value="${b.qM3h||''}" placeholder="m³/h" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full"></div>
            <div><label class="text-[9px] text-slate-500">Loại ống</label>
              <select data-brow="vType" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">
                <option value="mainDuct"   ${b.vType==='mainDuct'  ?'selected':''}>Chính</option>
                <option value="branchDuct" ${b.vType==='branchDuct'?'selected':''}>Nhánh</option>
              </select>
            </div>
            <div><label class="text-[9px] text-slate-500">v (m/s)</label><input data-brow="vMs" type="number" step="0.1" value="${b.vMs||''}" placeholder="m/s" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full"></div>
            <div><label class="text-[9px] text-slate-500">Hình dạng</label>
              <select data-brow="shape" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">
                <option value="rect"  ${b.shape==='rect' ?'selected':''}>□ Chữ nhật</option>
                <option value="round" ${b.shape==='round'?'selected':''}>○ Tròn</option>
              </select>
            </div>
          </div>
          <div><label class="text-[9px] text-slate-500">Vật liệu ống</label>
            <select data-brow="materialId" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">${matOpts.replace(`value="${b.materialId}"`,`value="${b.materialId}" selected`)}</select>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div><label class="text-[9px] text-slate-500">L (m)</label><input data-brow="lengthM" type="number" step="1" value="${b.lengthM||10}" placeholder="m" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full"></div>
            <div><label class="text-[9px] text-slate-500" title="Chọn nhanh preset Σζ phụ kiện điển hình">Preset Σζ</label>
              <select data-brow="fittingPreset" class="bg-base-900 border border-violet-800 rounded px-1 py-1.5 text-[10px] w-full">
                <option value="">-- Preset --</option>
                <option value="0.3" ${b.fittingPreset==='0.3'?'selected':''}>Đơn giản (0.3)</option>
                <option value="0.8" ${b.fittingPreset==='0.8'?'selected':''}>Tiêu chuẩn (0.8)</option>
                <option value="1.5" ${b.fittingPreset==='1.5'?'selected':''}>Nhiều cút (1.5)</option>
                <option value="2.5" ${b.fittingPreset==='2.5'?'selected':''}>Rất phức tạp (2.5)</option>
              </select>
            </div>
            <div><label class="text-[9px] text-slate-500" title="1 cút 90° R/D=1.5 ≈ 0.17, tê nhánh ≈ 0.75, damper mở ≈ 0.20, diffuser ≈ 2.5">Σζ phụ kiện</label>
              <input data-brow="fittingsZeta" type="number" step="0.05" min="0" value="${b.fittingsZeta??0.8}"
                class="bg-base-900 border border-violet-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full text-right">
            </div>
          </div>
          <div><label class="text-[9px] text-slate-500">Cách nhiệt</label>
            <select data-brow="insulationId" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">${insOpts.replace(`value="${b.insulationId}"`,`value="${b.insulationId}" selected`)}</select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="text-[9px] text-slate-500">Dày cách nhiệt (mm)</label><input data-brow="thicknessMm" type="number" step="5" value="${b.thicknessMm||25}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full text-right"></div>
            <div><label class="text-[9px] text-slate-500">T môi trường (°C)</label><input data-brow="ambientTC" type="number" step="0.5" value="${b.ambientTC||32}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full text-right"></div>
          </div>
          <div><label class="text-[9px] text-slate-500">Lọc (nếu ống này qua bộ lọc)</label>
            <select data-brow="filterStageId" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">
              <option value="">(Không)</option>
              ${filterOpts.replace(`value="${b.filterStageId}"`,`value="${b.filterStageId}" selected`)}
            </select>
          </div>
          <!-- Kết quả tính toán -->
          ${b._resultError?`
          <div class="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 text-[10px] text-amber-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Chưa tính được — ${b._resultError}
          </div>`:`
          <div class="bg-slate-950/50 rounded-lg p-2 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
            <div class="text-slate-500">Kích thước <span class="font-mono-data ${b._result?'text-emerald-400':'text-slate-600'}">${b._result?b._result.dimsLabel:'—'}</span></div>
            <div class="text-slate-500">ΔP ma sát <span class="font-mono-data text-slate-300">${b._result?(b._result.frictionPa.toFixed(0)+' Pa'):'—'}</span></div>
            <div class="text-slate-500">ΔP cục bộ <span class="font-mono-data text-slate-300">${localPa>0?localPa.toFixed(0)+' Pa':'0 Pa'}</span></div>
            <div class="text-slate-500">ΔP tích lũy <span class="font-mono-data ${isCP?'text-amber-400 font-bold':'text-slate-300'}">${cumPa>0?cumPa.toFixed(0)+' Pa':'—'}</span></div>
            <div class="text-slate-500">NC <span class="font-mono-data ${b._result?.ncFlag?'text-amber-400':'text-slate-300'}">${b._result?b._result.nc:'—'}</span></div>
            <div class="text-slate-500">Đọng sương <span class="font-mono-data ${b._result?.condensationRisk?'text-red-400':'text-emerald-400'}">${b._result?(b._result.condensationRisk?'⚠ Có':'OK'):'—'}</span></div>
          </div>`}
        </div>`;
      }).join('');

      return `
        <div class="space-y-2">${tbody||'<p class="text-center text-slate-500 py-4 text-xs">Chưa có nhánh ống. Thêm thủ công hoặc Import từ Tab Phụ Tải Nhiệt.</p>'}</div>
        ${maxCumPa>0?`<div class="mt-2 px-3 py-2 bg-amber-950/30 border border-amber-700/40 rounded-lg text-xs flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
          <span class="text-amber-400 font-medium">Critical path (nhánh màu cam):</span>
          <span class="font-mono-data text-amber-300">${maxCumPa.toFixed(0)} Pa tích lũy</span>
          <span class="text-slate-500">— Đây là tổn thất áp thiết kế cho fan (ESP)</span>
        </div>`:''}
        <button id="btn-add-branch" class="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></i>Thêm nhánh ống
        </button>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
          <div>Ống chính: <span class="text-slate-300">5–9 m/s</span></div>
          <div>Ống nhánh: <span class="text-slate-300">2.5–5 m/s</span></div>
          <div>Trước lọc: <span class="text-slate-300">2–3.5 m/s</span></div>
          <div>Σζ điển hình: <span class="text-slate-300">2 cút=0.6, tê=0.9, van=0.2</span></div>
          <div>Critical path = ESP thiết kế quạt</div>
        </div>`;
    },

    // ── Build tree từ danh sách nhánh phẳng ─────────────────────────────────
    _buildBranchTree(branches){
      const map={};
      branches.forEach(b=>{ map[b.id||'_'+branches.indexOf(b)]={...b, children:[]}; });
      const roots=[];
      branches.forEach(b=>{
        const id=b.id||'_'+branches.indexOf(b);
        if(!b.parentId||!map[b.parentId]) roots.push(map[id]);
        else map[b.parentId].children.push(map[id]);
      });
      return roots;
    },

    // ── Bind events ───────────────────────────────────────────────────────────
    _bindEvents(root){

      // Import from HL (append)
      // Quick add branch per equipment
      root.querySelectorAll('[data-quick-branch]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const gid=btn.getAttribute('data-quick-branch');
          const g=(App.state.hlEquipGroups||[]).find(x=>x.id===gid);
          if(!g) return;
          const isFirst=(App.state.branches||[]).filter(b=>b.equipGroupId===gid).length===0;
          // FIX: nhánh tạo nhanh trước đây dùng SAI tên field (material/insulThickMm/tAmbient/
          // filterStage/zeta/wMm/hMm/diaMm) — không khớp với field thật recalc()/bảng nhánh đang
          // đọc (materialId/insulationId/ambientTC/filterStageId/fittingsZeta), nên dù nhập Q vẫn
          // luôn tính rỗng vì vMs=null bị bỏ qua ngay từ đầu (xem recalc(): if(!b.qM3h||!b.vMs)
          // return sớm, _result=null vĩnh viễn cho tới khi có ai tự tay nhập vận tốc). Đã sửa
          // dùng đúng tên field + set vMs mặc định hợp lý theo loại ống (chính/nhánh) để bấm
          // "Tính ống gió" ra kết quả ngay, không cần biết phải tự nhập vận tốc trước.
          App.state.branches.push({
            id:'b'+Date.now().toString(36),
            name:(g.equipType||'AHU')+' '+g.name+' - Nhánh '+(App.state.branches.filter(b=>b.equipGroupId===gid).length+1),
            parentId:'', equipGroupId:gid,
            qM3h:null, vType: isFirst?'mainDuct':'branchDuct', vMs: isFirst?7:3.75,
            shape:'rect', materialId:'galv', lengthM:10,
            insulationId:'glasswool', thicknessMm:25, ambientTC:32, ambientRH:80,
            filterStageId:'', fittingsZeta:0.8
          });
          App.admin.autoSave(); this.render();
          App.ui.toast('ok','Đã thêm nhánh cho '+(g.equipType||'AHU')+' '+g.name+' — nhập Q (m³/h) rồi bấm Tính ống gió');
        });
      });
      root.querySelector('#btn-import-hl-append')?.addEventListener('click', ()=>this._doImportHL(false));
      root.querySelector('#btn-import-hl-replace')?.addEventListener('click', ()=>this._doImportHL(true));

      // Add branch
      root.querySelector('#btn-add-branch')?.addEventListener('click', ()=>{
        const branches=App.state.branches||(App.state.branches=[]);
        // Tự động id và parentId
        const newId='b'+(Date.now()%1e6).toString(36);
        const isFirst=branches.length===0;
        // Gợi ý parent = ống chính nếu đã có
        const mainBranch=branches.find(b=>b.vType==='mainDuct');
        // FIX (lỗi thật đã xác nhận — cùng dạng với lỗi import): nút thêm nhánh thủ công này
        // TRƯỚC ĐÂY hoàn toàn không gán equipGroupId cho nhánh mới — mỗi lần bấm thêm phải tự
        // chọn lại nhóm thiết bị từ đầu, rất dễ sai sót/quên khi thêm nhiều nhánh liên tiếp
        // cho nhiều phòng. Giờ tự động kế thừa nhóm thiết bị của nhánh gần nhất đã tạo (nếu
        // có) — người dùng vẫn đổi được nếu nhánh mới thuộc nhóm khác.
        const lastBranch=branches[branches.length-1];
        branches.push({
          id: newId,
          parentId: isFirst ? null : (mainBranch?.id||null),
          name:'Nhánh '+(branches.length+1),
          vType: isFirst?'mainDuct':'branchDuct',
          equipGroupId: lastBranch?.equipGroupId || '',
          // FIX: trước đây không set vMs mặc định — recalc() bỏ qua hoàn toàn nhánh nào thiếu
          // vMs (if(!b.qM3h||!b.vMs) return; b._result=null), nên nhánh mới thêm dù nhập Q vẫn
          // không bao giờ ra kết quả cho tới khi tự tay gõ vận tốc. Set mặc định theo khuyến
          // nghị ống chính/nhánh (xem "Ống chính: 5–9 m/s, Ống nhánh: 2.5–5 m/s" trong ghi chú)
          // để bấm Tính ống gió ra kết quả ngay, người dùng vẫn chỉnh lại được nếu cần.
          vMs: isFirst?7:3.75,
          shape:'rect', materialId:'galv',
          insulationId:'glasswool', lengthM:10,
          ambientTC:32, ambientRH:80, thicknessMm:25,
          fittingsZeta:0.8 // ζ phụ kiện (mặc định: 2 cút 90° + 1 tee ≈ 0.8)
        });
        App.admin.autoSave(); this.render();
      });

      // Delete branch
      root.querySelectorAll('[data-brow-del]').forEach(b=>b.addEventListener('click',()=>{
        App.state.branches.splice(parseInt(b.getAttribute('data-brow-del')),1);
        App.admin.autoSave(); this.render();
      }));

      // Branch field changes (no re-render, just save)
      root.querySelectorAll('[data-bidx]').forEach(tr=>{
        const i = parseInt(tr.getAttribute('data-bidx'));
        tr.querySelectorAll('[data-brow]').forEach(el=>el.addEventListener('change',()=>{
          const f=el.getAttribute('data-brow');
          if(!App.state.branches[i]) return;
          const val=el.type==='number'?(parseFloat(el.value)||0):el.value;
          App.state.branches[i][f]=val;
          // fittingPreset → auto-fill fittingsZeta
          if(f==='fittingPreset'&&val){
            App.state.branches[i].fittingsZeta=parseFloat(val);
            const zi=tr.querySelector('[data-brow="fittingsZeta"]');
            if(zi) zi.value=val;
          }
          App.admin.autoSave();
        }));
      });

      // Calc button
      root.querySelector('#btn-duct-calc')?.addEventListener('click',()=>this.recalc());
    },

    // ── Import lưu lượng từ Tab Phụ Tải Nhiệt ─────────────────────────────────
    _doImportHL(replace){
      const hlRooms = (App.state.hlRooms||[]).filter(r=>r._af?.L_supply>0);
      if(!hlRooms.length){ App.ui.toast('warn','Chưa có dữ liệu từ Tab Phụ Tải Nhiệt. Tính toán Tab đó trước.'); return; }
      const cl = App.state.hlClimate || {};
      const prov = App.data.climateSample.find(c=>c.province===App.state.inputs.climateProvince);
      const newBranches = hlRooms.map(r=>({
        name: r.name||'Nhánh',
        qM3h: Math.round(r._af.L_supply),
        vType: 'mainDuct',
        vMs: r.equipType==='VENT' ? 7 : 6,
        shape: 'rect',
        // FIX (lỗi thật đã xác nhận): trước đây import từ Tab Phụ Tải Nhiệt hoàn toàn KHÔNG
        // gán equipGroupId — dù phòng đã liên kết sẵn với 1 nhóm thiết bị (groupId) qua form
        // phòng, liên kết đó bị MẤT khi tạo nhánh ống gió tương ứng, buộc người dùng phải tự
        // chọn lại thủ công từng nhánh — rất dễ sai sót/chọn nhầm khi thao tác nhiều phòng
        // cùng lúc. Giờ mang theo đúng nhóm thiết bị đã gán sẵn ở phòng, nếu có.
        equipGroupId: r.groupId || '',
        materialId: r.equipType==='PAU'||r.equipType==='AHU' ? 'galv' : 'galv',
        insulationId: 'glasswool',
        lengthM: 15,
        ambientTC: prov ? prov.tv : (cl.tOut||35),
        ambientRH:  prov ? prov.rh  : (cl.rhOut||80),
        thicknessMm: 25,
        filterStageId: r.equipType==='VENT' ? '' : 'hepa_h13',
        _fromHL: true
      }));
      if(replace) App.state.branches = newBranches;
      else        App.state.branches = [...(App.state.branches||[]), ...newBranches];
      App.ui.toast('ok', `${replace?'Đã thay thế':'Đã thêm'} ${newBranches.length} nhánh ống từ Tab Phụ Tải Nhiệt.`);
      App.admin.autoSave(); this.render();
    },

    // ── Tính toán ống gió (duct-only) ─────────────────────────────────────────
    recalc(){
      App.ui.setStatus('Đang tính ống gió...');
      try{
        const C = App.calc;
        const branches = App.state.branches||[];
        const branchVelocities=[], aspectWarnings=[], condensationRisks=[], ncLevels=[];

        branches.forEach(b=>{
          // FIX: nhánh cũ tạo trước khi sửa (hoặc từ project cũ đã lưu) có thể vẫn thiếu vMs
          // do bug tạo nhánh trước đây không set mặc định — tự động điền theo loại ống thay vì
          // bỏ qua vĩnh viễn, để không có nhánh nào "chết" chỉ vì thiếu 1 giá trị mặc định
          if(b.qM3h>0 && !(b.vMs>0)) b.vMs = b.vType==='mainDuct' ? 7 : 3.75;
          // FIX (Bước 3): trước đây thiếu Q chỉ set _result=null rồi bỏ qua im lặng — giao
          // diện chỉ hiện dấu "—" ở mọi ô, không giải thích lý do. Giờ ghi rõ lý do vào
          // _resultError để giao diện hiển thị cảnh báo cụ thể thay vì im lặng.
          if(!b.qM3h){ b._result=null; b._resultError='Thiếu lưu lượng Q (m³/h)'; return; }
          if(!b.vMs){ b._result=null; b._resultError='Thiếu vận tốc thiết kế (m/s)'; return; }
          b._resultError=null;
          const area = C.ductArea(b.qM3h, b.vMs);
          let dimsLabel, dUsed, aspectWarn=false;
          if(b.shape==='round'){
            const D = C.roundDiameterFromArea(area);
            dimsLabel = `Ø${Math.round(D*1000)} mm`;
            dUsed = D;
          } else {
            const dims = C.rectDimsFromArea(area);
            dimsLabel = `${Math.round(dims.wM*1000)}×${Math.round(dims.hM*1000)} mm`;
            dUsed = C.equivalentDiameterFriction(dims.wM, dims.hM);
            aspectWarn = dims.aspectWarning;
          }
          const mat = App.data.ductMaterials.find(m=>m.id===b.materialId)||App.data.ductMaterials[0];
          const frictionPa = C.frictionLossPa(b.vMs, dUsed, mat.roughnessMm, b.lengthM||10);
          const ins = App.data.insulationMaterials.find(m=>m.id===b.insulationId)||App.data.insulationMaterials[App.data.insulationMaterials.length-1];
          // supplyAirTempC không còn field nào ghi vào (dead fallback đã dọn) — chỉ còn
          // hlClimate.tIn (nếu đã khai báo khí hậu dự án) hoặc mặc định 14°C
          const supplyAirT = App.state.hlClimate?.tIn ?? 14;
          const surf = C.checkSurfaceCondensation({
            tAmbientC:b.ambientTC, rhAmbientPercent:b.ambientRH,
            tAirInsideC: supplyAirT,
            lambdaWmK: ins.lambda, thicknessM:(b.thicknessMm||0)/1000
          });
          const insReq = C.minInsulationThickness({
            tAmbientC:b.ambientTC, rhAmbientPercent:b.ambientRH,
            tAirInsideC: supplyAirT, lambdaWmK: ins.lambda
          });
          const nc = C.ncGuide(b.vMs, App.data.ncGuideline);
          const ncFlag = b.vMs > 6.0;
          const filterSt = b.filterStageId ? App.data.filterStages.find(f=>f.id===b.filterStageId) : null;
          const filterPa = filterSt ? filterSt.dpDirtyPa : 0;
          b._result = { area, dimsLabel, dUsed, frictionPa, filterPa, nc, ncFlag,
                        surfaceTempC: surf.surfaceTempC, tdp: surf.tdp,
                        condensationRisk: surf.risk,
                        minInsulationMm: insReq.thicknessM*1000 };
          branchVelocities.push(b.vMs);
          aspectWarnings.push(aspectWarn);
          condensationRisks.push(surf.risk);
          ncLevels.push(nc);
        });

        // ── Tính localPa từ fittingsZeta per-branch (ζ × Pv) ───────────────
        branches.forEach(b=>{
          if(b._result && b.vMs!=null){
            const rho=1.2; // kg/m³ (tiêu chuẩn)
            const Pv=0.5*rho*(b.vMs**2);
            b._result.localPa=(b.fittingsZeta||0)*Pv;
          }
        });

        // ── Tính cumulative ΔP theo cây phân cấp ───────────────────────────
        const _calcCum=(nodes,cumPar)=>nodes.forEach(n=>{
          const fric=n._result?.frictionPa||0;
          const loc =n._result?.localPa||0;
          const filt=n._result?.filterPa||0;
          if(n._result) n._result.cumPa=cumPar+fric+loc+filt;
          _calcCum(n.children||[], n._result?.cumPa||0);
        });
        const bTree=App.ui.calc._buildBranchTree(branches);
        _calcCum(bTree, 0);

        // ── Critical path = nhánh đầu cuối có cumPa cao nhất ───────────────
        const criticalPa=Math.max(0,...branches.map(b=>b._result?.cumPa||0));
        const frictionTotal=branches.reduce((s,b)=>s+(b._result?.frictionPa||0),0);
        const localPa=branches.reduce((s,b)=>s+(b._result?.localPa||0),0);
        const filterMax=Math.max(0,...branches.map(b=>b._result?.filterPa||0));
        // ESP thiết kế = critical path (tuyến xa nhất — không cộng tất cả nhánh)
        const totalESP=criticalPa>0 ? criticalPa : (frictionTotal+localPa+filterMax);

        // Diagnostics ống gió
        const flags = [];
        branchVelocities.forEach((v,i)=>{
          const b = branches[i];
          // Dùng VELOCITY_BY_APP nếu có roomType, fallback sang velocity.mainDuct/branchDuct
          const VBApp = App.data.VELOCITY_BY_APP || {};
          const roomVelKey = b.roomType && VBApp[b.roomType] ? b.roomType : (b.vType==='mainDuct'?'main_duct':null);
          const vRef = roomVelKey && VBApp[roomVelKey] ? VBApp[roomVelKey].supply
            : (b.vType==='mainDuct' ? App.data.velocity.mainDuct : App.data.velocity.branchDuct);
          if(v > vRef.max) flags.push({level:'yellow', msg:`Nhánh "${b.name}": v=${v.toFixed(1)} m/s > ${vRef.max} m/s (${vRef.note||'SMACNA'})`});
          if(v < vRef.min) flags.push({level:'yellow', msg:`Nhánh "${b.name}": v=${v.toFixed(1)} m/s < ${vRef.min} m/s (nguy cơ bụi lắng đọng)`});
        });
        aspectWarnings.forEach((w,i)=>{ if(w) flags.push({level:'yellow', msg:`Nhánh "${branches[i].name}": Aspect Ratio > 4:1`}); });
        condensationRisks.forEach((r,i)=>{ if(r) flags.push({level:'red', msg:`Nhánh "${branches[i].name}": nguy cơ đọng sương — tăng độ dày cách nhiệt (≥ ${branches[i]._result?.minInsulationMm?.toFixed(0)||'?'} mm)`}); });
        ncLevels.forEach((nc,i)=>{ if(nc?.startsWith('>')) flags.push({level:'yellow', msg:`Nhánh "${branches[i].name}": ${nc}`}); });
        if(criticalPa > 0) flags.push({level:'yellow',msg:`Critical path: ${criticalPa.toFixed(0)} Pa`});
        if(totalESP > 1500) flags.push({level:'yellow', msg:`ESP thiết kế ${totalESP.toFixed(0)} Pa > 1500 Pa — kiểm tra lại`});

        const status = flags.some(f=>f.level==='red') ? 'red' : (flags.filter(f=>f.level==='yellow').length>1 ? 'yellow' : 'pass');
        App.state.results = { pressure:{frictionTotal,localPa,filterMax,totalLoss:totalESP,criticalPa}, diagnostics:{flags,status}, branches_calculated: branches.length };

        this._renderResults(frictionTotal, localPa, filterMax, totalESP, flags, status);
        App.admin.autoSave();
        App.ui.setStatus(`Tính xong ${branches.length} nhánh · Critical path = ${criticalPa.toFixed(0)} Pa · ESP = ${totalESP.toFixed(0)} Pa.`);
        App.ui.toast('ok', `${branches.length} nhánh ống · ESP = ${totalESP.toFixed(0)} Pa`);
      }catch(err){
        App.ui.toast('err','Lỗi tính ống: '+err.message);
        App.ui.setStatus('Lỗi');
        console.error(err);
      }
    },

    // ── Render kết quả ─────────────────────────────────────────────────────────
    _renderResults(frictionTotal, localPa, filterMax, totalESP, flags, status){
      // Kết quả
      const rEl = document.getElementById('duct-results');
      if(rEl) rEl.innerHTML = `
        <div class="bg-panel-800/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div class="text-xs text-slate-400">ESP yêu cầu</div>
          <div class="font-mono-data text-2xl text-amber-400 font-bold">${totalESP.toFixed(0)}<span class="text-sm font-normal text-slate-500"> Pa</span></div>
          <div class="text-xs space-y-1 pt-2 border-t border-slate-800/70">
            <div class="flex justify-between"><span class="text-slate-400">Ma sát đường ống</span><span class="font-mono-data">${frictionTotal.toFixed(0)} Pa</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Cục bộ (sơ bộ 4 phụ kiện)</span><span class="font-mono-data">${localPa.toFixed(0)} Pa</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Lọc (cuối đời, nhánh lớn nhất)</span><span class="font-mono-data">${filterMax.toFixed(0)} Pa</span></div>
          </div>
          <p class="text-[11px] text-slate-500 pt-1">→ Chọn quạt/AHU: Q ≥ lưu lượng nhánh lớn nhất và ESP ≥ ${totalESP.toFixed(0)} Pa.</p>
        </div>`;

      // Diagnostics
      const dEl = document.getElementById('duct-diag');
      const stampColor = status==='pass'?'border-emerald-500 text-emerald-400':status==='yellow'?'border-amber-500 text-amber-400':'border-red-500 text-red-400';
      const stampText  = status==='pass'?'PASS':status==='yellow'?'CẢNH BÁO':'LỖI';
      if(dEl) dEl.innerHTML = `
        <div class="bg-panel-800/60 border border-slate-800 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-slate-400">Chẩn đoán ống gió</span>
            <span class="border-2 ${stampColor} rounded-lg px-3 py-1 text-sm font-bold tracking-wider" style="transform:rotate(-3deg)">${stampText}</span>
          </div>
          <ul class="text-xs space-y-1">
            ${flags.length===0
              ? '<li class="text-emerald-400 flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>Tất cả nhánh ống đạt yêu cầu.</li>'
              : flags.map(f=>`<li class="flex items-center gap-1.5 ${f.level==='red'?'text-red-400':'text-amber-400'}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>${f.msg}</li>`).join('')}
          </ul>
        </div>`;
      if(window.lucide) lucide.createIcons();
    }
  };
  // ---- Sub-module: Tab Quản Lý Dự Án & Admin Database ----
  App.ui.admin = {
    async render(){
      const root = document.getElementById('panel-admin');
      root.innerHTML = `
        ${App.ui.panelShell('exportimport','Export / Import dữ liệu dự án','file-down', `
          <p style="font-size:11px;color:#4a6680;margin-bottom:8px">Tạo/quản lý dự án trong <b style="color:#34d399">Tab Dự Án</b>. Dùng Export/Import để sao lưu hoặc chuyển dự án hiện tại giữa các máy.</p>
          <div class="flex gap-2">
            <button id="btn-export-json" class="border border-slate-700 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></i> Export .json</button>
            <label class="border border-slate-700 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg> Import .json
              <input id="input-import-json" type="file" accept=".json" class="hidden">
            </label>
          </div>
        `)}
        ${App.ui.panelShell('elecdb','elec_ref_db','database', this.elecRefTableHtml())}
        ${App.ui.panelShell('climatedb','climate_db','cloud', this.climateTableHtml())}
        ${App.ui.panelShell('equipdb','Catalog thiết bị (AHU/FCU/PAU)','server',this.equipCatalogHtml())}
        ${App.ui.panelShell('roomtypesdb','Danh mục loại phòng & Nhóm áp suất','layers-2',this.roomTypesHtml())}
        ${App.ui.panelShell('mat-wallTypes','Vật liệu: Tường / Vách','layers',this.materialCatalogHtml('wallTypes'))}
        ${App.ui.panelShell('mat-glass','Vật liệu: Kính','layout-grid',this.materialCatalogHtml('glass'))}
        ${App.ui.panelShell('mat-ductMaterials','Vật liệu: Ống gió (tôn kẽm/inox...)','wind',this.materialCatalogHtml('ductMaterials'))}
        ${App.ui.panelShell('mat-insulation','Vật liệu: Cách nhiệt','layers-2',this.materialCatalogHtml('insulation'))}
        ${App.ui.panelShell('mat-doors','Vật liệu: Cửa','ruler',this.materialCatalogHtml('doors'))}
      `;
      App.ui.bindPanelToggles(root);
      this.bindEvents(root);
      if(window.lucide) lucide.createIcons();
    },
    equipCatalogHtml(){
      const catalog=App.state.equipCatalog||[];
      const rows=catalog.map((e,i)=>`
        <tr style="border-bottom:1px solid rgba(26,48,80,.4)">
          <td style="padding:7px 8px;color:#8eaac2;font-size:11px">${e.type||'—'}</td>
          <td style="padding:7px 8px;color:#edf2f8;font-weight:600;font-size:11px">${e.model||'—'}</td>
          <td style="padding:7px 8px;font-family:monospace;color:#22d3ee;font-size:11px">${e.qKW!=null?e.qKW+' kW':'—'}</td>
          <td style="padding:7px 8px;font-family:monospace;color:#34d399;font-size:11px">${e.airflowM3h!=null?e.airflowM3h+' m³/h':'—'}</td>
          <td style="padding:7px 8px;color:#8eaac2;font-size:11px">${e.manufacturer||'—'}</td>
          <td style="padding:7px 8px;color:#4a6680;font-size:10px">${e.note||''}</td>
          <td style="padding:4px">
            <button data-del-equip="${i}" style="background:none;border:none;color:#3a5070;cursor:pointer;padding:3px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </td>
        </tr>`).join('');
      const addForm=`
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:flex-end">
          <div><label>Loại</label>
            <select id="eq-type" style="width:90px">
              <option>FCU</option><option>AHU</option><option>PAU</option><option>FCU+OA</option>
            </select></div>
          <div><label>Model</label><input id="eq-model" type="text" placeholder="VD: FWD-T18" style="width:120px"></div>
          <div><label>Q (kW)</label><input id="eq-qkw" type="number" placeholder="5.6" step="0.1" style="width:70px"></div>
          <div><label>Lưu lượng (m³/h)</label><input id="eq-flow" type="number" placeholder="1000" style="width:90px"></div>
          <div><label>Nhà sản xuất</label><input id="eq-mfr" type="text" placeholder="Daikin" style="width:90px"></div>
          <div><label>Ghi chú</label><input id="eq-note" type="text" placeholder="" style="width:100px"></div>
          <button id="btn-add-equip" style="background:#059669;border:none;color:white;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer">+ Thêm</button>
        </div>`;
      return addForm+(catalog.length?`
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead><tr style="background:#071325">
              <th style="padding:8px;text-align:left;color:#8eaac2;font-size:10px">Loại</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Model</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Q (kW)</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Lưu lượng</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Nhà SX</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Ghi chú</th>
              <th style="width:30px"></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`:'<p style="color:#3a5470;font-size:12px;text-align:center;padding:20px">Chưa có thiết bị. Điền form phía trên để thêm.</p>');
    },
    // ── Danh mục loại phòng & Nhóm áp suất ──────────────────────────────────
    // Bảng tổng hợp toàn bộ BUILDING_TYPES (built-in + EXTRA + tự thêm), nhóm theo
    // pressureGroup. "Xóa" với phòng built-in = ẩn khỏi dropdown chọn (không mất dữ
    // liệu gốc, phòng đã tạo trước đó vẫn tính đúng); với phòng tự thêm = xóa hẳn.
    roomTypesHtml(){
      const hidden = App.state.hiddenBuildingTypeIds||[];
      const customIds = new Set((App.state.customBuildingTypes||[]).map(b=>b.id));
      const all = App.data.BUILDING_TYPES||[];
      const pgMeta = {
        positive:{label:'▲ Nhóm áp dương',color:'#34d399'},
        neutral: {label:'■ Nhóm áp trung hòa',color:'#94a3b8'},
        negative:{label:'▼ Nhóm áp âm',color:'#fb923c'},
      };
      const rowHtml=(b)=>{
        const isHidden = hidden.includes(b.id);
        const isCustom = customIds.has(b.id);
        return `
        <tr style="border-bottom:1px solid rgba(26,48,80,.4);${isHidden?'opacity:.45':''}">
          <td style="padding:6px 8px;color:#edf2f8;font-size:11px;font-weight:500">${b.name}${isCustom?' <span style="color:#38bdf8;font-size:9px">· tự thêm</span>':''}${isHidden?' <span style="color:#fb923c;font-size:9px">· đã ẩn</span>':''}</td>
          <td style="padding:6px 8px;color:#8eaac2;font-size:11px;text-align:right;font-family:monospace">${b.freshAirLsP!=null?b.freshAirLsP:(b.freshAirPerFixture?'—(theo TB)':'—')}</td>
          <td style="padding:6px 8px;color:#8eaac2;font-size:11px;text-align:right;font-family:monospace">${b.deltaPPa!=null?(b.deltaPPa>0?'+':'')+b.deltaPPa:'—'}</td>
          <td style="padding:6px 8px;font-size:10px;text-align:center">${b.hasLocalExhaust?'<span style="color:#fbbf24">có</span>':'<span style="color:#3a5070">—</span>'}</td>
          <td style="padding:6px 8px;color:#4a6680;font-size:9px;max-width:180px">${(b.stdRef||'').slice(0,50)}</td>
          <td style="padding:4px;text-align:right;white-space:nowrap">
            ${isCustom
              ? `<button data-del-roomtype="${b.id}" title="Xóa hẳn (phòng tự thêm)" style="background:none;border:none;color:#f87171;cursor:pointer;padding:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>`
              : (isHidden
                ? `<button data-restore-roomtype="${b.id}" title="Khôi phục" style="background:none;border:none;color:#34d399;cursor:pointer;padding:3px;font-size:10px">↺ Khôi phục</button>`
                : `<button data-hide-roomtype="${b.id}" title="Ẩn khỏi dropdown chọn" style="background:none;border:none;color:#3a5070;cursor:pointer;padding:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>`)
            }
          </td>
        </tr>`;
      };
      const section=(pg)=>{
        const rooms = all.filter(b=>b.pressureGroup===pg);
        if(!rooms.length) return '';
        const meta=pgMeta[pg];
        return `
        <tr><td colspan="6" style="padding:10px 8px 4px;color:${meta.color};font-size:11px;font-weight:700;letter-spacing:.02em">${meta.label} (${rooms.length} phòng)</td></tr>
        ${rooms.map(rowHtml).join('')}`;
      };
      const table = `
        <div class="overflow-x-auto">
          <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead><tr style="background:#071325">
              <th style="padding:8px;text-align:left;color:#8eaac2;font-size:10px">Tên phòng</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Gió tươi<br>(L/s/người)</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">ΔP<br>(Pa)</th>
              <th style="padding:8px;color:#8eaac2;font-size:10px">Gió thải<br>cục bộ</th>
              <th style="padding:8px;text-align:left;color:#8eaac2;font-size:10px">Nguồn chuẩn</th>
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${section('positive')}${section('neutral')}${section('negative')}</tbody>
          </table>
        </div>`;
      const addForm=`
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:flex-end;padding-bottom:10px;border-bottom:1px solid rgba(26,48,80,.4)">
          <div><label style="font-size:10px;color:#8eaac2">Tên phòng *</label><br><input id="rt-name" type="text" placeholder="VD: Phòng lưu trữ hồ sơ" style="width:170px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8"></div>
          <div><label style="font-size:10px;color:#8eaac2">Nhóm áp suất</label><br>
            <select id="rt-pgroup" style="width:100px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8">
              <option value="positive">Dương</option><option value="neutral" selected>Trung hòa</option><option value="negative">Âm</option>
            </select></div>
          <div><label style="font-size:10px;color:#8eaac2">Gió tươi (L/s/người)</label><br><input id="rt-fresh" type="number" step="0.1" placeholder="8.5" style="width:80px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8"></div>
          <div><label style="font-size:10px;color:#8eaac2">ΔP (Pa)</label><br><input id="rt-dp" type="number" step="1" placeholder="0" style="width:70px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8"></div>
          <div><label style="font-size:10px;color:#8eaac2">ACH mặc định</label><br><input id="rt-ach" type="number" step="1" placeholder="8" style="width:70px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8"></div>
          <div style="display:flex;align-items:center;gap:5px;padding-bottom:7px"><input id="rt-exhaust" type="checkbox" style="width:14px;height:14px"><label for="rt-exhaust" style="font-size:10px;color:#8eaac2">Có gió thải cục bộ</label></div>
          <div><label style="font-size:10px;color:#8eaac2">Nguồn chuẩn</label><br><input id="rt-stdref" type="text" placeholder="VD: TCVN 5687:2010" style="width:150px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8"></div>
          <button id="btn-add-roomtype" style="background:#059669;border:none;color:white;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer">+ Thêm loại phòng</button>
        </div>`;
      return `<p style="font-size:11px;color:#4a6680;margin-bottom:8px">Nhóm theo dấu ΔP thiết kế. "Ẩn" với phòng có sẵn chỉ gỡ khỏi dropdown chọn — không xóa dữ liệu gốc, phòng đã tạo trước đó vẫn tính đúng.</p>`
        + addForm + table;
    },

    // ── Danh mục vật liệu (tường/kính/ống gió/cách nhiệt/cửa) ──────────────
    // Renderer CHUNG cho mọi danh mục khai báo trong App.data.MATERIAL_CATALOGS_META
    // — thêm danh mục vật liệu mới chỉ cần thêm entry vào META, không sửa hàm này.
    materialCatalogHtml(catKey){
      const meta = App.data.MATERIAL_CATALOGS_META[catKey]; if(!meta) return '';
      const arr = App.data[meta.arrayName]||[];
      const hidden = (App.state.hiddenMaterialIds||{})[catKey]||[];
      const customIds = new Set(((App.state.customMaterials||{})[catKey]||[]).map(x=>x[meta.idField]));
      const rowHtml=(item)=>{
        const key=item[meta.idField];
        const isHidden=hidden.includes(key), isCustom=customIds.has(key);
        return `
        <tr style="border-bottom:1px solid rgba(26,48,80,.4);${isHidden?'opacity:.45':''}">
          ${meta.fields.map(f=>`<td style="padding:6px 8px;color:${f.key==='name'?'#edf2f8':'#8eaac2'};font-size:11px;${f.key==='name'?'font-weight:500':'text-align:right;font-family:monospace'}">${item[f.key]??'—'}${f.key==='name'&&isCustom?' <span style="color:#38bdf8;font-size:9px">· tự thêm</span>':''}${f.key==='name'&&isHidden?' <span style="color:#fb923c;font-size:9px">· đã ẩn</span>':''}</td>`).join('')}
          <td style="padding:4px;text-align:right;white-space:nowrap">
            ${isCustom
              ? `<button data-del-mat="${catKey}:${key}" title="Xóa hẳn (tự thêm)" style="background:none;border:none;color:#f87171;cursor:pointer;padding:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>`
              : (isHidden
                ? `<button data-restore-mat="${catKey}:${key}" title="Khôi phục" style="background:none;border:none;color:#34d399;cursor:pointer;padding:3px;font-size:10px">↺</button>`
                : `<button data-hide-mat="${catKey}:${key}" title="Ẩn khỏi dropdown chọn" style="background:none;border:none;color:#3a5070;cursor:pointer;padding:3px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>`)
            }
          </td>
        </tr>`;
      };
      const table=`
        <div class="overflow-x-auto">
          <table style="width:100%;border-collapse:collapse;min-width:500px">
            <thead><tr style="background:#071325">
              ${meta.fields.map(f=>`<th style="padding:8px;${f.key==='name'?'text-align:left':''};color:#8eaac2;font-size:10px;${f.width?'width:'+f.width+'px':''}">${f.label}</th>`).join('')}
              <th style="width:40px"></th>
            </tr></thead>
            <tbody>${arr.map(rowHtml).join('')}</tbody>
          </table>
        </div>`;
      const addForm=`
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:flex-end;padding-bottom:10px;border-bottom:1px solid rgba(26,48,80,.4)">
          ${meta.fields.map(f=>`
          <div><label style="font-size:10px;color:#8eaac2">${f.label}${f.key==='name'?' *':''}</label><br>
            <input id="mat-${catKey}-${f.key}" type="${f.type}" ${f.step?'step="'+f.step+'"':''} placeholder="${f.placeholder||''}" style="width:${f.width||130}px;background:#0b1420;border:1px solid #1a3050;border-radius:6px;padding:6px 8px;font-size:11px;color:#edf2f8">
          </div>`).join('')}
          <button data-add-mat="${catKey}" style="background:#059669;border:none;color:white;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer">+ Thêm</button>
        </div>`;
      return `<p style="font-size:11px;color:#4a6680;margin-bottom:8px">"Ẩn" với vật liệu có sẵn chỉ gỡ khỏi dropdown chọn — không xóa dữ liệu gốc, phòng/hạng mục đã dùng vật liệu này vẫn tính đúng.</p>`
        + addForm + table;
    },

    elecRefTableHtml(){
      const rows = App.data.elecDeviceRef.map((r,i)=>`
        <tr data-erefidx="${i}">
          <td class="px-2 py-1">${r.name}</td>
          <td class="px-2 py-1">${r.mode}</td>
          <td class="px-2 py-1"><input data-eref="rOhm" type="number" step="0.0001" value="${r.rOhm??''}" class="w-24 bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono-data text-right eref-input" readonly style="opacity:.6;cursor:not-allowed"></td>
          <td class="px-2 py-1"><input data-eref="eta" type="number" step="0.001" value="${r.eta??''}" class="w-20 bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono-data text-right eref-input" readonly style="opacity:.6;cursor:not-allowed"></td>
        </tr>`).join('');
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <span style="background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.25);color:#fb923c;border-radius:5px;padding:3px 8px;font-size:10px;font-weight:700">📝 CÓ THỂ CHỈNH SỬA</span>
          <button id="btn-toggle-eref-edit" style="background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2);color:#38bdf8;border-radius:5px;padding:3px 10px;font-size:10px;font-weight:600;cursor:pointer">
            ✏ Mở khóa để sửa
          </button>
          <span style="font-size:11px;color:#4a6680">Giá trị tham khảo chung — chỉnh sửa theo datasheet thực tế.</span>
        </div>
        <p class="text-[11px] text-amber-400 mb-2 flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></i> Giá trị tham khảo chung — chỉnh sửa theo datasheet thiết bị thực tế của dự án.</p>
        <div class="overflow-x-auto"><table class="zebra w-full text-xs">
          <thead class="text-slate-400"><tr><th class="text-left px-2 py-1.5">Thiết bị</th><th class="text-left px-2 py-1.5">Loại</th><th class="px-2 py-1.5">R (Ω)</th><th class="px-2 py-1.5">η</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;
    },
    climateTableHtml(){
      const rows = App.data.climateSample.map(c=>`
        <tr><td class="px-2 py-1">${c.province}${c.borrowedFrom?` <span class="text-amber-400 text-[10px]">(mượn: ${c.borrowedFrom})</span>`:''}</td>
        <td class="px-2 py-1 text-slate-500">${c.station||''}</td>
        <td class="px-2 py-1 text-right font-mono-data">${c.tv}</td><td class="px-2 py-1 text-right font-mono-data">${c.tt}</td>
        <td class="px-2 py-1 text-right font-mono-data">${c.tn}</td><td class="px-2 py-1 text-right font-mono-data">${c.rh}%</td></tr>`).join('');
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <span style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:#34d399;border-radius:5px;padding:3px 8px;font-size:10px;font-weight:700">🔒 CHỈ ĐỌC — Tiêu chuẩn QCVN</span>
          <span style="font-size:11px;color:#4a6680">Dữ liệu chuẩn không chỉnh sửa. Import CSV để cập nhật.</span>
        </div>
        <p class="text-[11px] text-amber-400 mb-2 flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></i> Nguồn: QCVN 02:2022/BXD, Phụ lục A (63 tỉnh thành). Các tỉnh không có trạm khí tượng riêng trong QCVN (đánh dấu "mượn") dùng số liệu trạm lân cận có khí hậu tương đồng — kiểm tra lại nếu dự án ở các tỉnh này.</p>
        <div class="overflow-x-auto max-h-96 overflow-y-auto"><table class="zebra w-full text-xs">
          <thead class="text-slate-400 sticky top-0 bg-base-900"><tr><th class="text-left px-2 py-1.5">Tỉnh/TP</th><th class="text-left px-2 py-1.5">Trạm</th><th class="px-2 py-1.5">Tv max (°C)</th><th class="px-2 py-1.5">Tt TB (°C)</th><th class="px-2 py-1.5">Tn min (°C)</th><th class="px-2 py-1.5">RH TB (%)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <label class="mt-2 inline-flex border border-slate-700 rounded-lg px-3 py-1.5 text-xs items-center gap-1.5 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg> Import / cập nhật khí hậu .csv/.xlsx
          <input id="input-import-climate" type="file" accept=".csv,.xlsx" class="hidden">
        </label>`;
    },
    bindEvents(root){
      // Equip catalog: thêm thiết bị
      root.querySelector('#btn-add-equip')?.addEventListener('click',()=>{
        if(!App.state.equipCatalog) App.state.equipCatalog=[];
        const eq={
          type:root.querySelector('#eq-type')?.value||'FCU',
          model:root.querySelector('#eq-model')?.value||'',
          qKW:parseFloat(root.querySelector('#eq-qkw')?.value)||null,
          airflowM3h:parseFloat(root.querySelector('#eq-flow')?.value)||null,
          manufacturer:root.querySelector('#eq-mfr')?.value||'',
          note:root.querySelector('#eq-note')?.value||''
        };
        if(!eq.model){ App.ui.toast('warn','Nhập Model thiết bị'); return; }
        App.state.equipCatalog.push(eq);
        App.admin.autoSave(); this.render();
        App.ui.toast('ok','Đã thêm '+eq.type+' '+eq.model);
      });
      // Xóa thiết bị
      root.querySelectorAll('[data-del-equip]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const i=parseInt(btn.getAttribute('data-del-equip'));
          App.state.equipCatalog?.splice(i,1);
          App.admin.autoSave(); this.render();
        });
      });
      // ── Danh mục loại phòng: thêm / ẩn / khôi phục / xóa ──────────────────
      root.querySelector('#btn-add-roomtype')?.addEventListener('click',()=>{
        const name=(root.querySelector('#rt-name')?.value||'').trim();
        if(!name){ App.ui.toast('warn','Nhập tên phòng'); return; }
        const pressureGroup=root.querySelector('#rt-pgroup')?.value||'neutral';
        const freshAirLsP=parseFloat(root.querySelector('#rt-fresh')?.value)||0;
        const deltaPPa=parseFloat(root.querySelector('#rt-dp')?.value)||0;
        const achDefault=parseFloat(root.querySelector('#rt-ach')?.value)||8;
        const hasLocalExhaust=!!root.querySelector('#rt-exhaust')?.checked;
        const stdRef=(root.querySelector('#rt-stdref')?.value||'').trim();
        const id='custom_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
        const bt={
          id, name, category:'custom',
          pressureGroup, standardModule:null,
          hasLocalExhaust, localExhaustNote: hasLocalExhaust?'Do người dùng khai báo — kiểm tra lưu lượng thực tế theo thiết bị':undefined,
          achMin:Math.max(1,Math.round(achDefault*0.6)), achMax:Math.round(achDefault*1.4), achDefault,
          freshAirLsP, deltaPPa, stdRef: stdRef||'Do người dùng tự khai báo — kiểm tra lại theo tiêu chuẩn áp dụng',
          systemRec:'', note:'Loại phòng tự thêm trong tab Database.',
        };
        App.state.customBuildingTypes = App.state.customBuildingTypes||[];
        App.state.customBuildingTypes.push(bt);
        App.data.BUILDING_TYPES.push(bt);
        App.admin.saveRoomTypesSettings();
        this.render();
        App.ui.toast('ok','Đã thêm loại phòng "'+name+'"');
      });
      root.querySelectorAll('[data-hide-roomtype]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const id=btn.getAttribute('data-hide-roomtype');
          App.state.hiddenBuildingTypeIds=App.state.hiddenBuildingTypeIds||[];
          if(!App.state.hiddenBuildingTypeIds.includes(id)) App.state.hiddenBuildingTypeIds.push(id);
          App.admin.saveRoomTypesSettings();
          this.render();
        });
      });
      root.querySelectorAll('[data-restore-roomtype]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const id=btn.getAttribute('data-restore-roomtype');
          App.state.hiddenBuildingTypeIds=(App.state.hiddenBuildingTypeIds||[]).filter(x=>x!==id);
          App.admin.saveRoomTypesSettings();
          this.render();
        });
      });
      root.querySelectorAll('[data-del-roomtype]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const id=btn.getAttribute('data-del-roomtype');
          App.state.customBuildingTypes=(App.state.customBuildingTypes||[]).filter(x=>x.id!==id);
          const idx=(App.data.BUILDING_TYPES||[]).findIndex(x=>x.id===id);
          if(idx>=0) App.data.BUILDING_TYPES.splice(idx,1);
          App.admin.saveRoomTypesSettings();
          this.render();
          App.ui.toast('ok','Đã xóa loại phòng tự thêm');
        });
      });
      // ── Danh mục vật liệu (tường/kính/ống gió/cách nhiệt/cửa): thêm/ẩn/khôi phục/xóa ──
      // Generic — dùng chung cho mọi catKey khai báo trong MATERIAL_CATALOGS_META
      root.querySelectorAll('[data-add-mat]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const catKey=btn.getAttribute('data-add-mat');
          const meta=App.data.MATERIAL_CATALOGS_META[catKey]; if(!meta) return;
          const item={};
          let nameVal='';
          meta.fields.forEach(f=>{
            const el=root.querySelector(`#mat-${catKey}-${f.key}`);
            let v=el?el.value:'';
            if(f.type==='number') v=parseFloat(v)||0;
            item[f.key]=v;
            if(f.key==='name') nameVal=v;
          });
          if(!nameVal.trim()){ App.ui.toast('warn','Nhập tên vật liệu'); return; }
          item[meta.idField]='custom_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
          App.state.customMaterials=App.state.customMaterials||{};
          App.state.customMaterials[catKey]=App.state.customMaterials[catKey]||[];
          App.state.customMaterials[catKey].push(item);
          App.data[meta.arrayName]=App.data[meta.arrayName]||[];
          App.data[meta.arrayName].push(item);
          App.admin.saveRoomTypesSettings();
          this.render();
          App.ui.toast('ok','Đã thêm "'+nameVal+'"');
        });
      });
      root.querySelectorAll('[data-hide-mat]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const [catKey,key]=btn.getAttribute('data-hide-mat').split(':');
          App.state.hiddenMaterialIds=App.state.hiddenMaterialIds||{};
          App.state.hiddenMaterialIds[catKey]=App.state.hiddenMaterialIds[catKey]||[];
          if(!App.state.hiddenMaterialIds[catKey].includes(key)) App.state.hiddenMaterialIds[catKey].push(key);
          App.admin.saveRoomTypesSettings();
          this.render();
        });
      });
      root.querySelectorAll('[data-restore-mat]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const [catKey,key]=btn.getAttribute('data-restore-mat').split(':');
          App.state.hiddenMaterialIds=App.state.hiddenMaterialIds||{};
          App.state.hiddenMaterialIds[catKey]=(App.state.hiddenMaterialIds[catKey]||[]).filter(x=>x!==key);
          App.admin.saveRoomTypesSettings();
          this.render();
        });
      });
      root.querySelectorAll('[data-del-mat]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const [catKey,key]=btn.getAttribute('data-del-mat').split(':');
          const meta=App.data.MATERIAL_CATALOGS_META[catKey]; if(!meta) return;
          App.state.customMaterials=App.state.customMaterials||{};
          App.state.customMaterials[catKey]=(App.state.customMaterials[catKey]||[]).filter(x=>x[meta.idField]!==key);
          const arr=App.data[meta.arrayName]||[];
          const idx=arr.findIndex(x=>x[meta.idField]===key);
          if(idx>=0) arr.splice(idx,1);
          App.admin.saveRoomTypesSettings();
          this.render();
          App.ui.toast('ok','Đã xóa vật liệu tự thêm');
        });
      });
      const newBtn = root.querySelector('#btn-new-project');
      if(newBtn) newBtn.addEventListener('click', ()=> App.admin.openProjectModal());
      root.querySelectorAll('[data-load]').forEach(b=> b.addEventListener('click', ()=> App.admin.loadProject(b.getAttribute('data-load'))));
      root.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=> App.admin.confirmDeleteProject(b.getAttribute('data-del'))));
      const exportBtn = root.querySelector('#btn-export-json');
      if(exportBtn) exportBtn.addEventListener('click', ()=> App.admin.exportJSON());
      const importInput = root.querySelector('#input-import-json');
      if(importInput) importInput.addEventListener('change', (e)=> App.admin.importJSON(e.target.files[0]));
      // Toggle elecRef edit mode
      root.querySelector('#btn-toggle-eref-edit')?.addEventListener('click',btn=>{
        const inputs=root.querySelectorAll('.eref-input');
        const isLocked=inputs[0]?.hasAttribute('readonly');
        inputs.forEach(inp=>{
          if(isLocked){ inp.removeAttribute('readonly'); inp.style.opacity='1'; inp.style.cursor='text'; }
          else{ inp.setAttribute('readonly',''); inp.style.opacity='.6'; inp.style.cursor='not-allowed'; }
        });
        const b=root.querySelector('#btn-toggle-eref-edit');
        if(b) b.textContent=isLocked?'🔒 Khóa lại':'✏ Mở khóa để sửa';
      });
      root.querySelectorAll('[data-eref]').forEach(el=>{
        const tr = el.closest('tr'); const idx = parseInt(tr.getAttribute('data-erefidx'));
        el.addEventListener('change', ()=>{ App.data.elecDeviceRef[idx][el.getAttribute('data-eref')] = parseFloat(el.value); });
      });
      const climateInput = root.querySelector('#input-import-climate');
      if(climateInput) climateInput.addEventListener('change', (e)=> App.admin.importClimateFile(e.target.files[0]));
    }
  };

  // ---- Sub-module: Tab Cài Đặt ----
  App.ui.settings = {
    render(){
      const root = document.getElementById('panel-settings');
      root.innerHTML = App.ui.panelShell('set','tab_settings','settings', `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm">Ngôn ngữ / Language</span>
            <div class="flex gap-1.5">
              <button data-lang="vi" class="lang-btn px-3 py-1.5 rounded-lg text-xs border ${App.state.lang==='vi'?'border-emerald-500 text-emerald-400':'border-slate-700'}">VI</button>
              <button data-lang="en" class="lang-btn px-3 py-1.5 rounded-lg text-xs border ${App.state.lang==='en'?'border-emerald-500 text-emerald-400':'border-slate-700'}">EN</button>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Hệ đơn vị</span>
            <div class="flex gap-1.5">
              <button data-unit="SI" class="unit-btn px-3 py-1.5 rounded-lg text-xs border ${App.state.unit==='SI'?'border-emerald-500 text-emerald-400':'border-slate-700'}">SI</button>
              <button data-unit="IP" class="unit-btn px-3 py-1.5 rounded-lg text-xs border ${App.state.unit==='IP'?'border-emerald-500 text-emerald-400':'border-slate-700'}" disabled title="Phiên bản hiện tại tính theo SI">IP</button>
            </div>
          </div>
          <p class="text-[11px] text-slate-500">Chuyển đơn vị IP (CFM, in.w.g, °F) sẽ bổ sung ở phiên bản kế tiếp — toàn bộ công thức hiện hành tính theo SI.</p>
        </div>
      `);
      root.querySelectorAll('.lang-btn').forEach(b=> b.addEventListener('click', ()=>{
        App.state.lang = b.getAttribute('data-lang');
        // FIX: trước đây thiếu renderNav() — đổi ngôn ngữ cập nhật đúng nội dung các tab
        // nhưng thanh điều hướng (sidebar desktop + drawer mobile) vẫn giữ nguyên nhãn cũ
        // vì renderNav() chỉ được gọi 1 lần lúc khởi động app, không nằm trong luồng đổi
        // ngôn ngữ. Gọi thêm renderNav() để đồng bộ toàn bộ giao diện ngay lập tức.
        App.ui.applyI18n(); App.ui.renderNav(); App.ui.renderAllTabs(); App.admin.autoSave();
      }));
      App.ui.bindPanelToggles(root);
      if(window.lucide) lucide.createIcons();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Tab Phụ Tải Nhiệt — HVAC Heat Load Calculator (Đa phòng, tích hợp Project)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // State được lưu trong App.state.hlRooms/hlMotors/hlParasitic/hlClimate
  // → hoàn toàn tích hợp với hệ thống dự án (IndexedDB autoSave)
  //
  App.ui.heatload = {

    // ── Helpers ──────────────────────────────────────────────────────────────
    uid(){ return (Date.now()*1e3+Math.trunc(Math.random()*999)).toString(36); },
    R(){ return App.state.hlRooms     || (App.state.hlRooms    =[]); },
    M(){ return App.state.hlMotors    || (App.state.hlMotors   =[]); },
    P(){ return App.state.hlParasitic || (App.state.hlParasitic=[]); },
    CL(){ return App.state.hlClimate  || (App.state.hlClimate  ={tOut:35,rhOut:80,tIn:22,rhIn:55,elevationM:0}); },
    G(){ return App.state.hlEquipGroups || (App.state.hlEquipGroups=[]); },
    MODE(){ return App.state.hlCalcMode || 'Peak'; },
    save(){ App.admin.autoSave(); },

    // ── Accordion state — giữ nguyên trạng thái mở khi dropdown thay đổi ──
    _getExpandedIds(){ if(!this.__expIds) this.__expIds=new Set(); return this.__expIds; },
    _saveExpanded(root){
      if(!root) return;
      root.querySelectorAll('[data-ri]').forEach(row=>{
        const i=parseInt(row.getAttribute('data-ri'));
        const rid=this.R()[i]?.id;
        const hidden=row.querySelector('.room-body')?.classList.contains('hidden');
        if(rid){ if(hidden) this._getExpandedIds().delete(rid); else this._getExpandedIds().add(rid); }
      });
    },
    _restoreExpanded(root){
      if(!root||!this._getExpandedIds().size) return;
      root.querySelectorAll('[data-ri]').forEach(row=>{
        const i=parseInt(row.getAttribute('data-ri'));
        const rid=this.R()[i]?.id;
        if(rid&&this._getExpandedIds().has(rid)){
          row.querySelector('.room-body')?.classList.remove('hidden');
          const chev=row.querySelector('.room-chev');
          if(chev) chev.style.transform='rotate(90deg)';
        }
      });
    },

    // Lookup chuẩn cleanroom
    getStd(system, code){
      return (App.data.cleanroomStandards||[]).find(s=>s.system===system && s.code===code);
    },

    // Climate inputs — data-cf
    cfInp(f,v,ph){ return `<input data-cf="${f}" type="number" step="any" value="${v??''}" placeholder="${ph}" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">`; },
    // Room field — data-rf (NO re-render on change)
    rfInp(f,v,ph,type='number'){ return `<input data-rf="${f}" type="${type}" step="any" value="${v??''}" placeholder="${ph}" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">`; },
    rfSel(f,opts,v){ return `<select data-rf="${f}" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">${opts.map(o=>`<option value="${o.v??o}" ${(v===(o.v??o))?'selected':''}>${o.n||o}</option>`).join('')}</select>`; },

    // ── Floor management helpers ──────────────────────────────────────────
    FL(){ return App.state.floors || (App.state.floors=[{id:'fl1',name:'Tầng 1',order:1}]); },
    _getUwall(r){
      if(r.wallTypeId){ const wt=(App.data.WALL_TYPES||[]).find(w=>w.id===r.wallTypeId); if(wt) return wt.U; }
      return parseFloat(r.uWall)||0.45;
    },
    addFloor(){
      const F=this.FL();
      const max=Math.max(0,...F.map(f=>f.order||0));
      F.push({id:'fl'+Date.now().toString(36),name:'Tầng '+(F.length+1),order:max+1});
      this.save(); this.render();
    },
    deleteFloor(fid){
      if(this.FL().length<=1){ App.ui.toast('warn','Phải có ít nhất 1 tầng'); return; }
      const flName=this.FL().find(f=>f.id===fid)?.name||'tầng';
      const cnt=this.R().filter(r=>r.floorId===fid).length;
      App.state.hlRooms=this.R().filter(r=>r.floorId!==fid);
      App.state.floors=this.FL().filter(f=>f.id!==fid);
      this.save(); this.render();
      App.ui.toast('ok','Đã xóa '+flName+' và '+cnt+' phòng');
    },
    addRoomToFloor(floorId){
      const F=this.FL().find(f=>f.id===floorId);
      const n=this.R().filter(r=>r.floorId===floorId).length+1;
      this.R().push({
        id:this.uid(), floorId:floorId,
        name:(F?.name||'Tầng')+'-P'+n,
        buildingType:'office', equipType:'AHU', classSystem:'GENERAL', classCode:'',
        achApplied:8, deltaPPa:5, pressACH:1, freshAirPerPersonLs:8.5,
        L:10, W:8, H:3.2, roomShape:'rect',
        uWall:0.45, wallTypeId:'', aWall:40, dtFactor:1.0,
        lpdApplied:12, aGlass:8, shgc:0.6, sc:1.0, clf:0.7, glassTypeId:'', glassU:5.8,
        nPeople:8, laborLevel:App.data.peopleHeat?.[1]?.level||'Văn phòng / Lao động nhẹ',
        tSupplyDesign:14, rhSupplyDesign:90, espPa:400,
        roofExposed:false, floorOnGround:false, pressMethod:'ach',
        hasLocalExhaustEquip:false, localExhaustRows:[], localExhaustTreated:'ahu',
        faceAreaM2:'', uniVelocityMs:'',
        motorRows:[], paraRows:[], partitionRows:[], doorRows:[], _expanded:false
      });
      this.save(); this.render();
    },
    _roomRowHtml(r, ri, floorId){
      const floorRooms=this.R().filter(x=>x.floorId===floorId||(floorId==='fl1'&&!x.floorId));
      const globalIdx=this.R().indexOf(r);
      const qKW=r._coil?.qCoilKW||0;
      const status=r._valid?.status||'';
      const statusDot=status==='red'?'background:#f87171':status==='yellow'?'background:#fbbf24':'background:#34d399';
      const qStr=qKW>0?`<span style="font-family:monospace;font-size:12px;color:#22d3ee">${qKW.toFixed(1)}</span><span style="font-size:10px;color:#3a5470">kW</span>`:`<span style="font-size:11px;color:#3a5470">—</span>`;
      const area=((r.L||0)*(r.W||0)).toFixed(0);
      const bt=(App.data.BUILDING_TYPES||[]).find(b=>b.id===r.buildingType);
      const btBadge=bt?`<span style="font-size:9px;color:#607080;background:#091525;border-radius:3px;padding:1px 5px">${bt.name.slice(0,10)}</span>`:'';
      const expanded=this._getExpandedIds().has(r.id);
      return `
      <div data-ri="${globalIdx}" style="border-bottom:1px solid #0f1e30">
        <div class="room-hd" data-open-room="${globalIdx}" style="display:flex;align-items:center;gap:8px;padding:9px 14px;cursor:pointer;min-height:44px;user-select:none">
          <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;${statusDot}"></span>
          <span style="flex:1;font-size:13px;color:#c2d4e2;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name||'Phòng'}</span>
          ${btBadge}
          <span style="font-size:11px;color:#3a5470;white-space:nowrap">${area}m²</span>
          <span style="font-size:11px;color:#4a6680;white-space:nowrap">${r.equipType||'—'}</span>
          ${qStr}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a4060" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>
          <button data-copy-room="${globalIdx}" title="Copy phòng" onclick="event.stopPropagation()" style="background:none;border:none;color:#34d399;cursor:pointer;padding:4px;display:flex;align-items:center;flex-shrink:0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          <button data-del-room="${globalIdx}" title="Xóa phòng" onclick="event.stopPropagation()" style="background:none;border:none;color:#3a5070;cursor:pointer;padding:4px;display:flex;align-items:center;flex-shrink:0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
    },
    _floorsHtml(){
      const floors=this.FL().sort((a,b)=>(a.order||0)-(b.order||0));
      const allRooms=this.R();
      return floors.map(fl=>{
        const rooms=allRooms.filter(r=>r.floorId===fl.id||(fl.id==='fl1'&&!r.floorId));
        const totalKW=rooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
        const hasErr=rooms.some(r=>r._valid?.status==='red');
        const hasWarn=rooms.some(r=>r._valid?.status==='yellow');
        const badge=hasErr?'<span style="color:#f87171;font-size:10px">● LỖI</span>':hasWarn?'<span style="color:#fbbf24;font-size:10px">● CẢNH BÁO</span>':'<span style="color:#34d399;font-size:10px">✓ OK</span>';
        const roomRows=rooms.length===0
          ?`<div style="padding:20px;text-align:center;color:#3a5470;font-size:12px">Chưa có phòng nào · <button data-add-room-floor="${fl.id}" style="color:#34d399;background:none;border:none;cursor:pointer;font-size:12px;font-weight:600">+ Thêm phòng</button></div>`
          :rooms.map((r,ri)=>this._roomRowHtml(r,ri,fl.id)).join('');
        return `
        <div class="floor-group" data-floor-id="${fl.id}" style="margin-bottom:10px;border-radius:10px;overflow:hidden;border:1px solid #1a3050">
          <div class="floor-header" style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:linear-gradient(90deg,#0d2038 0%,#091825 100%);border-bottom:1px solid #1a3050;min-height:44px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <input data-floor-rename="${fl.id}" value="${fl.name}" style="background:none;border:none;color:#c2d4e2;font-weight:700;font-size:13px;outline:none;min-width:80px;max-width:160px;padding:2px 4px;border-radius:4px;cursor:text" onclick="event.stopPropagation()" title="Nhấp để đổi tên tầng">
            <span style="color:#3a5470;font-size:11px">${rooms.length} phòng</span>
            ${totalKW>0?`<span style="color:#22d3ee;font-size:12px;font-family:monospace;font-weight:600">${totalKW.toFixed(1)} kW</span>`:''}
            ${badge}
            <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
              <button data-add-room-floor="${fl.id}" style="display:flex;align-items:center;gap:4px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#34d399;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm phòng
              </button>
              <button data-copy-floor="${fl.id}" title="Copy toàn bộ tầng" style="display:flex;align-items:center;gap:4px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2);color:#38bdf8;border-radius:6px;padding:5px 8px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>Copy tầng
              </button>
              ${floors.length>1?`<button data-del-floor="${fl.id}" title="Xóa tầng (các phòng sẽ chuyển về tầng còn lại)" style="background:none;border:1px solid #1e3050;border-radius:5px;color:#3a5470;cursor:pointer;padding:5px;display:flex;align-items:center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>`:''}
            </div>
          </div>
          <div class="floor-rooms" style="background:#0a1626">${roomRows}</div>
        </div>`;
      }).join('')+`
      <button id="btn-add-floor" style="display:flex;align-items:center;gap:6px;background:rgba(56,189,248,.06);border:1px dashed #1a3a55;color:#38bdf8;border-radius:8px;padding:9px 16px;font-size:12px;font-weight:600;width:100%;justify-content:center;cursor:pointer;margin-top:4px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm tầng mới
      </button>`;
    },

    // ── render() chính ────────────────────────────────────────────────────────
    render(){
      const root = document.getElementById('panel-heatload'); if(!root) return;
      this._saveExpanded(root);
      const cl = this.CL();
      const psyOut = App.calc.calcPsychro(cl.tOut, cl.rhOut, cl.elevationM||0);
      const psyIn  = App.calc.calcPsychro(cl.tIn,  cl.rhIn,  cl.elevationM||0);
      root.innerHTML = `<div class="space-y-4">
        <!-- Toolbar -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="font-semibold text-base flex items-center gap-2">
            <i data-lucide="thermometer" class="w-5 h-5 text-amber-400"></i>
            Phụ Tải Nhiệt & Phân Phối Gió
            <span class="text-[11px] text-slate-500 font-normal">${this.R().length} phòng · ${this.G().length} nhóm thiết bị</span>
          </h2>
          <div class="flex gap-2 flex-wrap">
            <select id="hl-calcmode" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs">
              <option value="Peak"   ${this.MODE()==='Peak'  ?'selected':''}>Peak Design</option>
              <option value="Energy" ${this.MODE()==='Energy'?'selected':''}>Energy Simulation</option>
            </select>
<!-- Thêm phòng qua nút per-floor ở mỗi tầng -->
            
          </div>
        </div>
        <!-- Climate -->
        ${App.ui.panelShell('hl-climate','Điều kiện khí hậu thiết kế','cloud',`
          <div style="margin-bottom:12px">
            <label>Tỉnh/TP (T môi trường ống — kiểm tra đọng sương)</label>
            <select data-cf="provinceId" style="width:100%">
              <option value="">── Chọn tỉnh/thành để tự điền T, RH ──</option>
              ${(App.data.climateSample||[]).map(c=>`<option value="${c.province}" ${cl.provinceId===c.province?'selected':''}>${c.province} (tv=${c.tv}°C / RH=${c.rh}%)</option>`).join('')}
            </select>
            ${cl.provinceId?`<p style="font-size:10px;color:#f59e0b;margin-top:3px">Số liệu khí hậu theo QCVN 02:2022/BXD.</p>`:''}
          </div>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><label>T ngoài (°C)</label>${this.cfInp('tOut',cl.tOut,'35')}</div>
            <div><label>RH ngoài (%)</label>${this.cfInp('rhOut',cl.rhOut,'80')}</div>
            <div><label>T trong (°C)</label>${this.cfInp('tIn',cl.tIn,'22')}</div>
            <div><label>RH trong (%)</label>${this.cfInp('rhIn',cl.rhIn,'55')}</div>
            <div><label>Cao độ (m)</label>${this.cfInp('elevationM',cl.elevationM,'0')}</div>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono-data text-slate-400 flex flex-wrap gap-4">
            <span>Ngoài: h=<span class="text-cyan-300">${psyOut.hKJperKg.toFixed(1)}</span> kJ/kg · d=<span class="text-cyan-300">${psyOut.dGperKg.toFixed(1)}</span> g/kg · Td=<span class="text-cyan-300">${psyOut.dewPointC.toFixed(1)}</span>°C</span>
            <span>Trong: h=<span class="text-emerald-300">${psyIn.hKJperKg.toFixed(1)}</span> kJ/kg · d=<span class="text-emerald-300">${psyIn.dGperKg.toFixed(1)}</span> g/kg · P_atm=<span class="text-emerald-300">${psyOut.pAtmKPa.toFixed(3)}</span> kPa</span>
          </div>
        `)}
        <!-- Nhóm thiết bị -->
        ${App.ui.panelShell('hl-groups','Nhóm thiết bị (AHU / PAU)','layers',this._groupsHtml())}
        <!-- Floors + Rooms (phân cấp Tầng → Phòng) -->
        <div id="hl-floors-wrapper">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
            <h3 style="font-size:13px;font-weight:600;color:#c2d4e2;display:flex;align-items:center;gap:8px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/></svg>
              Dự án · ${(App.state.floors||[]).length} tầng · ${this.R().length} phòng
            </h3>
            <button id="hl-recalc-btn-main" style="display:flex;align-items:center;gap:5px;background:#059669;color:white;border:none;border-radius:7px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Tính tải tất cả
            </button>
          </div>
          ${this._floorsHtml()}
        </div>
        <!-- Motors -->
        ${App.ui.panelShell('hl-motors','Motor Heat Gain (IEC 60034-30-1 IE3)','zap',this._motorsHtml())}
        ${App.ui.panelShell('hl-para','Tải Ký Sinh (IQF / Mạ băng / Đá vảy / Rotor)','wind',this._paraHtml())}
        <!-- Parasitic -->
        <!-- Results -->
        <div id="hl-results" class="bg-panel-800/60 border border-slate-800 rounded-xl p-4">
          <div class="text-xs text-slate-400 flex items-center gap-1.5">
            <i data-lucide="info" class="w-3.5 h-3.5"></i>Bấm "Tính tải" để tính toán phụ tải và phân phối gió tất cả phòng.
          </div>
        </div>
      </div>`;
      App.ui.bindPanelToggles(root);
      this._bindClimate(root);
      this._bindGroups(root);
      this._bindRooms(root);
      this._bindFloors(root);
      this._bindPartitions(root);
      this._bindUCalc(root);
      this._bindMotors(root);
      this._bindPara(root);
      root.querySelector('#hl-calcmode')?.addEventListener('change',e=>{App.state.hlCalcMode=e.target.value;});
      root.querySelector('#hl-recalc-btn')?.addEventListener('click',()=>this.recalc());
      root.querySelector('#hl-recalc-btn-main')?.addEventListener('click',()=>this.recalc());
      // hl-add-room global removed — use per-floor add buttons
      this._restoreExpanded(root);
      if(window.lucide) lucide.createIcons();
    },

    // ── Groups panel ─────────────────────────────────────────────────────────
    _groupsHtml(){
      const groups = this.G();
      const TYPE_KEYWORDS = ['AHU','PAU','FCU_OA','FCU','VENT']; // thứ tự: kiểm tra FCU_OA trước FCU (tránh khớp nhầm chuỗi con)
      const rows = groups.map((g,i)=>{
        const roomsInGroup = this.R().filter(r=>r.groupId===g.id);
        const qTotal = roomsInGroup.reduce((s,r)=>s+(r._airflow?.Q_supply||0),0);
        // FIX: cảnh báo khi TÊN nhóm nhắc tới 1 loại hệ thống KHÁC với equipType thực tế đang
        // lưu (vd tên "FCU-Tầng1" nhưng equipType vẫn là AHU) — bảo vệ cho cả trường hợp người
        // dùng tự gõ tên tùy ý (không theo mẫu tự sinh) mà không phải lúc nào cũng đổi đúng
        // ô dropdown loại hệ thống đi kèm.
        const nameUpper=(g.name||'').toUpperCase();
        const mentionedType = TYPE_KEYWORDS.find(t=>nameUpper.includes(t));
        const nameTypeMismatch = mentionedType && mentionedType!==g.equipType;
        return `<div class="border ${nameTypeMismatch?'border-amber-600':'border-slate-700/50'} rounded-lg p-3" data-gi="${i}">
          <div class="flex items-center gap-3">
            <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
              <input data-gf="name" value="${g.name||''}" placeholder="Tên AHU/PAU" type="text"
                class="bg-base-900 border border-slate-700 rounded px-2 py-1.5 text-xs">
              <select data-gf="equipType" class="bg-base-900 border border-slate-700 rounded px-2 py-1.5 text-xs">
                <option value="AHU" ${g.equipType==='AHU'?'selected':''}>AHU (có hồi gió)</option>
                <option value="PAU" ${g.equipType==='PAU'?'selected':''}>PAU (100% gió tươi)</option>
                <option value="FCU" ${g.equipType==='FCU'?'selected':''}>FCU (fan coil có gió hồi)</option>
                <option value="FCU_OA" ${g.equipType==='FCU_OA'?'selected':''}>FCU+OA (fan coil + gió tươi)</option>
                <option value="VENT" ${g.equipType==='VENT'?'selected':''}>VENT (thông gió thuần — chỉ chọn quạt, Q_coil=0)</option>
              </select>
              <input data-gf="description" value="${g.description||''}" placeholder="Mô tả" type="text"
                class="bg-base-900 border border-slate-700 rounded px-2 py-1.5 text-xs col-span-1">
              <div class="text-[11px] font-mono-data text-slate-400 flex items-center gap-2">
                ${roomsInGroup.length} phòng
                ${qTotal>0?`<span class="text-emerald-400">${qTotal.toFixed(0)} m³/h</span>`:''}
              </div>
            </div>
            <button data-gdel="${i}" class="text-slate-500 hover:text-red-400 shrink-0">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          ${nameTypeMismatch?`<p class="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Tên nhóm nhắc tới "${mentionedType}" nhưng đang thực sự thuộc loại "${g.equipType}" — phòng ${mentionedType} sẽ KHÔNG tìm thấy nhóm này. Kiểm tra lại ô loại hệ thống bên trên nếu đây là nhầm lẫn.
          </p>`:''}
        </div>`;
      }).join('');
      return `${rows}
        <button id="hl-add-group" class="mt-1.5 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>Thêm nhóm thiết bị
        </button>
        <p class="text-[11px] text-slate-500 mt-1">Mỗi nhóm = 1 thiết bị (AHU/PAU/FCU/FCU+OA) phục vụ nhiều phòng — <b>nhớ chọn đúng loại hệ thống ở ô dropdown</b> (không chỉ đổi tên), vì phòng chỉ tìm được nhóm khớp CHÍNH XÁC loại hệ thống của nó. Nhóm mới tạo mặc định là AHU, đổi lại nếu cần. Gán phòng vào nhóm trong form từng phòng.</p>`;
    },

    // Helper: defer re-render drawer về next tick (fix WKWebView DOM mutation in handler)
    _reRenderDrawer(){
      const idx=this._drawerRoomIdx;
      if(idx<0) return;
      setTimeout(()=>{ try{ this._openDrawer_impl(idx); }catch(e){ console.warn('[Drawer re-render]',e); } },0);
    },

    _roomsHtml(){
      const rows = this.R();
      if(!rows.length) return `<div class="text-xs text-slate-500 text-center py-4">Chưa có phòng. Bấm "Thêm phòng".</div>`;

      const equipColor = {AHU:'border-cyan-600 text-cyan-400',PAU:'border-violet-600 text-violet-400',FCU:'border-emerald-600 text-emerald-400',FCU_OA:'border-teal-600 text-teal-400',VENT:'border-slate-600 text-slate-400'};
      const laborOpts = App.data.peopleHeat.map(p=>({v:p.level,n:p.level}));
      const panelOpts = App.data.uPanel.map(u=>({v:u.thicknessMm,n:`${u.thicknessMm}mm (U=${u.U})`}));
      const doorOpts  = App.data.doorCatalog.filter(d=>!(App.state.hiddenMaterialIds?.doors||[]).includes(d.code)).map(d=>({v:d.code,n:d.name}));

      return rows.filter(r=>r!=null).map((r,i)=>{
        // bt = preset loại phòng đang chọn — dùng để biết room có standardModule
        // (vd 'cleanroom') hay không, và có hasLocalExhaust hay không (panel B/badge bên dưới)
        const bt = (App.data.BUILDING_TYPES||[]).find(b=>b.id===r.buildingType);
        const stdModule = bt?.standardModule ? (App.data.STANDARD_MODULES||{})[bt.standardModule] : null;
        // std chỉ có ý nghĩa khi buildingType hiện tại thực sự thuộc 1 standardModule —
        // tránh trường hợp phòng từng là cleanroom rồi đổi loại khác nhưng classSystem/
        // classCode cũ vẫn còn lưu, khiến hint ACH/ΔP hiện sai theo tiêu chuẩn cũ.
        const std = stdModule ? this.getStd(r.classSystem, r.classCode) : null;
        const qPreview = r._airflow;

        // Tiêu chuẩn options per system — chỉ có ý nghĩa khi room thuộc 1 standardModule
        // dùng dataSource='cleanroomStandards' (hiện chỉ có module 'cleanroom')
        const isoOpts  = App.data.cleanroomStandards.filter(s=>s.system==='ISO').map(s=>({v:s.code,n:`${s.code} (${s.flowMode==='unidirectional'?'đơn hướng':s.achMin+'-'+s.achMax+' ACH'})`}));
        const gmpOpts  = App.data.cleanroomStandards.filter(s=>s.system==='GMP').map(s=>({v:s.code,n:`${s.code} (${s.flowMode==='unidirectional'?'đơn hướng':s.achMin+'-'+s.achMax+' ACH'})`}));
        const classOpts = r.classSystem==='GMP' ? gmpOpts : isoOpts;

        // Air breakdown badge
        const airBadge = qPreview ? `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-2 p-2 bg-base-900/40 rounded-lg text-[10px] font-mono-data">
            <div class="text-slate-400">Q_cấp <span class="text-emerald-400 font-medium">${qPreview.Q_supply.toFixed(0)} m³/h</span></div>
            <div class="text-slate-400">Q_tươi <span class="text-cyan-400 font-medium">${qPreview.Q_fresh.toFixed(0)} m³/h (${qPreview.freshPct.toFixed(0)}%)</span></div>
            <div class="text-slate-400">Q_tuần hoàn <span class="text-violet-400 font-medium">${qPreview.Q_recirculation.toFixed(0)} m³/h</span></div>
            <div class="text-slate-400">Q_bù áp <span class="text-amber-400 font-medium">${qPreview.Q_pressurization.toFixed(0)} m³/h</span></div>
            <div class="text-slate-400">ACH thực <span class="text-slate-300">${qPreview.ACH_actual?.toFixed(0)||'—'}</span></div>
            <div class="text-slate-400 col-span-3">${qPreview.modeNote||''}</div>
          </div>` : '';

        // Std info badge
        const stdBadge = std ? `<div class="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-2">
          <span>ACH: ${std.achMin??'—'}–${std.achMax??'—'} (default: ${std.achDefault??'đơn hướng'})</span>
          <span>ΔP_min: ${std.deltaPMinPa} Pa</span>
          <span>Gió tươi: ${std.freshAirPctMin}–${std.freshAirPctMax}%</span>
          <span class="text-slate-600">${std.note?.slice(0,60)}...</span>
        </div>` : '';

        return `
        <div class="border border-slate-700/60 rounded-xl overflow-hidden mb-2" data-ri="${i}">
          <div class="flex items-center gap-2 px-3 py-2.5 bg-panel-800/40 cursor-pointer room-hd">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
            <span class="text-sm font-medium flex-1 text-slate-200">${r.name||'(Phòng '+(i+1)+')'}</span>
            ${r._airflow?`<span class="text-[10px] font-mono-data text-emerald-400">${r._airflow.Q_supply.toFixed(0)} m³/h</span>`:''}
            ${r._coil?`<span class="text-[10px] font-mono-data text-amber-400">${(r._coil.qCoilKW||0).toFixed(1)} kW</span>`:''}
            <span class="text-[11px] border px-1.5 py-0.5 rounded ${equipColor[r.equipType]||'border-slate-600 text-slate-400'}">${r.equipType||'—'}</span>
            ${r.groupId?`<span class="text-[10px] text-slate-500">${(this.G().find(g=>g.id===r.groupId)||{}).name||r.groupId}</span>`:''}
            <button data-ri-dup="${i}" class="text-slate-500 hover:text-cyan-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
            <button data-ri-del="${i}" class="text-slate-500 hover:text-red-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
          </div>
          <div class="room-body hidden border-t border-slate-700/40">
            <div class="p-3 space-y-3">

              <!-- A. LOẠI CÔNG TRÌNH — Phân nhóm A/B — AUTO-FILL toàn bộ preset -->
              <div class="p-2.5 bg-slate-900/80 border border-slate-600/60 rounded-lg space-y-2">
                <div class="text-[10px] text-slate-300 font-semibold flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>
                  Chọn loại công trình/phòng — tự động điền preset ACH, ΔP, gió tươi, thiết bị
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div class="md:col-span-2">
                    <label class="text-[10px] text-slate-400">Loại công trình / Loại phòng *</label>
                    ${(()=>{
                      // Ẩn khỏi dropdown các loại phòng built-in mà người dùng đã "ẩn" trong
                      // tab Database → Danh mục loại phòng (không xóa dữ liệu gốc)
                      const hidden = App.state.hiddenBuildingTypeIds||[];
                      const activeTypes = (App.data.BUILDING_TYPES||[]).filter(b=>!hidden.includes(b.id));
                      return `
                      <select data-rf-bt="buildingType" class="bg-base-900 border border-cyan-700 rounded-lg px-2 py-1.5 text-xs w-full font-medium">
                        <option value="">── Chọn loại công trình ──</option>
                        <optgroup label="━━ NHÓM A — Phòng kỹ thuật đặc thù ━━">
                          ${activeTypes.filter(b=>b.category==='cleanroom'||b.category==='technical')
                            .map(b=>`<option value="${b.id}" ${r.buildingType===b.id?'selected':''}>${b.name}</option>`).join('')}
                        </optgroup>
                        <optgroup label="━━ NHÓM B — Dân dụng / Thương mại ━━">
                          ${activeTypes.filter(b=>['residential','commercial','food_service'].includes(b.category))
                            .map(b=>`<option value="${b.id}" ${r.buildingType===b.id?'selected':''}>${b.name}</option>`).join('')}
                        </optgroup>
                        <optgroup label="━━ Y tế / Bệnh viện ━━">
                          ${activeTypes.filter(b=>b.category==='healthcare')
                            .map(b=>`<option value="${b.id}" ${r.buildingType===b.id?'selected':''}>${b.name}</option>`).join('')}
                        </optgroup>
                        <optgroup label="━━ Công nghiệp / Sản xuất ━━">
                          ${activeTypes.filter(b=>['industrial','food_industrial'].includes(b.category))
                            .map(b=>`<option value="${b.id}" ${r.buildingType===b.id?'selected':''}>${b.name}</option>`).join('')}
                        </optgroup>
                        <optgroup label="━━ Phụ trợ / Vệ sinh / Logistics ━━">
                          ${activeTypes.filter(b=>['sanitary','logistics','auxiliary'].includes(b.category))
                            .map(b=>`<option value="${b.id}" ${r.buildingType===b.id?'selected':''}>${b.name}</option>`).join('')}
                        </optgroup>
                        ${activeTypes.some(b=>b.category==='custom')?`
                        <optgroup label="━━ Phòng tự thêm (Database) ━━">
                          ${activeTypes.filter(b=>b.category==='custom')
                            .map(b=>`<option value="${b.id}" ${r.buildingType===b.id?'selected':''}>${b.name}</option>`).join('')}
                        </optgroup>`:''}
                      </select>`;
                    })()}
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-400">Loại hệ thống ĐHKK</label>
                    <select data-rf="equipType" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                      ${App.data.equipTypes.map(e=>`<option value="${e.code}" ${r.equipType===e.code?'selected':''}>${e.name}</option>`).join('')}
                    </select>
                  </div>
                </div>
                ${(()=>{
                  if(!bt) return '<p class="text-[10px] text-slate-600 italic">Chưa chọn loại công trình. Chọn để auto-fill ACH, ΔP, gió tươi, thiết bị gợi ý.</p>';
                  const catColor={cleanroom:'text-violet-400',technical:'text-cyan-400',healthcare:'text-red-400',food_industrial:'text-amber-400'};
                  const col=catColor[bt.category]||'text-emerald-400';
                  const pgBadge={
                    positive:'<span class="text-emerald-400">▲ Nhóm áp dương</span>',
                    neutral:'<span class="text-slate-400">■ Nhóm áp trung hòa</span>',
                    negative:'<span class="text-orange-400">▼ Nhóm áp âm</span>',
                  }[bt.pressureGroup]||'';
                  return `<div class="bg-slate-950/60 rounded-lg p-2 space-y-0.5 text-[10px]">
                    <div class="${col} font-medium flex items-center gap-2">${bt.name} ${pgBadge}</div>
                    <div class="text-slate-400 flex flex-wrap gap-x-4 gap-y-0.5">
                      ${bt.achMin?`<span>ACH: ${bt.achMin}–${bt.achMax} (default ${bt.achDefault})</span>`:''}
                      ${bt.deltaPPa?`<span>ΔP: ${bt.deltaPPa>0?'+':''}${bt.deltaPPa} Pa</span>`:''}
                      ${bt.freshAirLsP?`<span>Gió tươi: ${bt.freshAirLsP} L/s/người</span>`:''}
                      ${bt.lightingWM2?`<span>Chiếu sáng: ${bt.lightingWM2} W/m²</span>`:''}
                    </div>
                    ${bt.systemRec?`<div class="text-slate-500 italic">⚙ Hệ thống đề xuất: ${bt.systemRec}</div>`:''}
                    ${bt.hasLocalExhaust?`<div class="text-amber-400 flex items-start gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:1px;flex-shrink:0"><path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg><span>Gió thải cục bộ: ${bt.localExhaustNote||'cần bổ sung tại thiết bị phát sinh'} — nhập lưu lượng thực tế ở mục Gió thải cục bộ</span></div>`:''}
                    <div class="text-slate-600">${bt.stdRef||''}</div>
                  </div>`;
                })()}
              </div>

              <!-- A2. Thông tin cơ bản -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div class="col-span-2"><label class="text-[10px] text-slate-400">Tên phòng / Mã phòng</label>${this.rfInp('name',r.name,'Tên phòng','text')}</div>
                <div><label class="text-[10px] text-slate-400">Thuộc nhóm thiết bị</label>
                  ${(()=>{
                    // Lọc nhóm thiết bị theo đúng loại hệ thống ĐHKK của phòng (r.equipType) —
                    // nhóm AHU chỉ gán cho phòng AHU, PAU chỉ cho phòng PAU, v.v. Trước đây
                    // dropdown này hiện TẤT CẢ nhóm bất kể loại hệ thống, dễ gán nhầm (vd gán
                    // phòng FCU vào 1 nhóm AHU) khiến tính toán tổng nhóm sai lệch.
                    // FCU và FCU_OA giờ là 2 equipType TÁCH RỜI (tính coil khác nhau — xem
                    // calcCoil), nên khớp CHÍNH XÁC theo equipType, không còn dùng chung nhóm.
                    const compatibleGroups = this.G().filter(g=>g.equipType===r.equipType);
                    // FIX: câu chữ cũ khẳng định "FCU/VENT không thuộc nhóm nào" — nhưng thực
                    // tế người dùng VẪN có thể tự tạo nhóm FCU/VENT (dropdown nhóm thiết bị đã
                    // hỗ trợ đủ mọi loại equipType), gây hiểu lầm là tính năng không áp dụng
                    // được cho các loại này. Đổi thành câu trung lập, đúng cho mọi loại.
                    const fallbackLabel = `Chưa gán nhóm ${r.equipType||''}${compatibleGroups.length?' (có '+compatibleGroups.length+' nhóm khả dụng bên dưới)':''}`;
                    const groupOpts=[{v:'',n:fallbackLabel},...compatibleGroups.map(g=>({v:g.id,n:`${g.equipType}: ${g.name||g.id}`}))];
                    return this.rfSel('groupId',groupOpts,r.groupId||'');
                  })()}
                </div>
              </div>

              <!-- B. Tiêu chuẩn phòng sạch + auto-fill — CHỈ hiện dropdown hệ thống/cấp độ khi
                   loại phòng đang chọn có standardModule (vd 'cleanroom'). Các phòng khác chỉ
                   hiện ACH/ΔP để xem/ghi đè, lấy mặc định trực tiếp từ preset BUILDING_TYPES. -->
              <div class="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg space-y-2">
                <div class="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  ${stdModule ? stdModule.panelLabel : 'Thông số ACH / Chênh áp — lấy mặc định theo loại phòng, có thể ghi đè'}
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  ${stdModule?`
                  <div><label class="text-[10px] text-slate-400">Hệ thống tiêu chuẩn</label>
                    <select data-rf="classSystem" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                      ${stdModule.systemOptions.map(o=>`<option value="${o.v}" ${r.classSystem===o.v?'selected':''}>${o.n}</option>`).join('')}
                    </select>
                  </div>
                  ${r.classSystem!=='GENERAL'?`
                  <div><label class="text-[10px] text-slate-400">Cấp độ sạch</label>
                    <select data-rf="classCode" data-rf-autofill="classCode" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                      ${classOpts.map(o=>`<option value="${o.v}" ${r.classCode===o.v?'selected':''}>${o.n}</option>`).join('')}
                    </select>
                    ${stdBadge}
                  </div>` : ''}` : ''}
                  <div><label class="text-[10px] text-slate-400 ${std?'text-emerald-400':''}">ACH áp dụng (h⁻¹)</label>
                    ${this.rfInp('achApplied',r.achApplied,std?.achDefault??bt?.achDefault??'20')}
                    ${std?.flowMode==='unidirectional'?`<p class="text-[9px] text-amber-400 mt-0.5">Dòng đơn hướng: nhập diện tích mặt cấp bên dưới</p>`:''}
                  </div>
                  <div><label class="text-[10px] text-slate-400">ΔP thiết kế (Pa)</label>
                    ${this.rfInp('deltaPPa',r.deltaPPa,std?.deltaPMinPa??bt?.deltaPPa??'0')}
                    ${std?.deltaPMinPa?`<p class="text-[9px] text-slate-500">Min theo tiêu chuẩn: ${std.deltaPMinPa} Pa</p>`:''}
                  </div>
                </div>
                ${std?.flowMode==='unidirectional'?`
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div><label class="text-[10px] text-amber-400">Diện tích mặt cấp gió (m²)</label>${this.rfInp('faceAreaM2',r.faceAreaM2,'20')}</div>
                  <div><label class="text-[10px] text-amber-400">Vận tốc mặt cấp (m/s) [${std.velMin}–${std.velMax}]</label>${this.rfInp('uniVelocityMs',r.uniVelocityMs||std.velMin,'0.45')}</div>
                </div>`:''}
              </div>

              <!-- C. Phương pháp bù áp dương -->
              <div class="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-lg space-y-2">
                <div class="text-[10px] text-cyan-400 font-medium flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                  Bù áp suất dương — chọn phương pháp tính lưu lượng makeup
                </div>
                <div class="flex gap-3 text-xs">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="pressMethod_${i}" data-rf="pressMethod" value="ach" ${(r.pressMethod||'ach')==='ach'?'checked':''}> Theo thể tích phòng (ACH)
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="pressMethod_${i}" data-rf="pressMethod" value="door" ${r.pressMethod==='door'?'checked':''}> Theo rò rỉ qua khe cửa
                  </label>
                </div>
                ${(r.pressMethod||'ach')==='ach'?`
                <div class="grid grid-cols-2 gap-2">
                  <div><label class="text-[10px] text-slate-400">ACH bù áp (h⁻¹) [${std?.pressACHMin||0.5}–${std?.pressACHMax||5}]</label>${this.rfInp('pressACH',r.pressACH,std?.pressACHMin||1)}</div>
                  <div class="text-[10px] text-slate-500 flex items-end pb-2">Q_bù áp = V × ACH_bù (ISO 14644-4:2022 Annex C)</div>
                </div>`:`
                <div class="space-y-2">
                  <div class="grid grid-cols-2 gap-2">
                    <div><label class="text-[10px] text-slate-400">Khe hở cửa (mm)</label>${this.rfInp('gapWidthMm',r.gapWidthMm,3)}</div>
                    <div class="text-[10px] text-slate-500 flex items-end pb-1">Q = Cd×A_khe×√(2ΔP/ρ)×SF (ISO 14644-4 Annex C)</div>
                  </div>
                  <div class="space-y-1" id="door-rows-${i}">
                    ${(r.doorRows||[{doorCode:'D900x2100-STD',qty:1}]).map((d,di)=>`
                    <div class="p-2 bg-base-900/40 rounded-lg space-y-1.5" data-di="${di}">
                      <select data-drow="doorCode" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-xs w-full">
                        ${App.data.doorCatalog.filter(dc=>!(App.state.hiddenMaterialIds?.doors||[]).includes(dc.code)).map(dc=>`<option value="${dc.code}" ${d.doorCode===dc.code?'selected':''}>${dc.name} (A_khe=${dc.aKheM2.toFixed(4)}m²)</option>`).join('')}
                      </select>
                      <div class="flex gap-2 items-center">
                        <label class="text-[10px] text-slate-500 flex-shrink-0">Số lượng</label>
                        <input data-drow="qty" type="number" value="${d.qty||1}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-16 font-mono-data flex-shrink-0">
                        <span class="text-[10px] text-slate-500">bộ</span>
                        <button data-del-door="${di}" class="ml-auto flex-shrink-0" style="background:none;border:none;color:#f87171;cursor:pointer;padding:4px" title="Xóa cửa này">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>`).join('')}
                    <button data-add-door="${i}" class="text-[10px] text-emerald-400 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm cửa
                    </button>
                  </div>
                </div>`}
              </div>

              <!-- D. Hình dạng + Kích thước phòng — CẬP NHẬT TỨC THÌ -->
              <div class="space-y-2">
                <div class="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div>
                    <label class="text-[10px] text-slate-400">Hình dạng phòng</label>
                    <select data-rf="roomShape" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                      <option value="rect"   ${(r.roomShape||'rect')==='rect'?'selected':''}>⬜ Chữ nhật (L×W)</option>
                      <option value="hex"    ${r.roomShape==='hex'?'selected':''}>⬡ Lục giác (6 cạnh, ×0.866)</option>
                      <option value="oct"    ${r.roomShape==='oct'?'selected':''}>⬠ Bát giác (8 cạnh, ×0.828)</option>
                      <option value="custom" ${r.roomShape==='custom'?'selected':''}>✏ Nhập trực tiếp S sàn</option>
                    </select>
                  </div>
                  ${r.roomShape==='custom'?`
                    <div><label class="text-[10px] text-slate-400">Diện tích sàn (m²)</label>
                      <input data-rf="customAreaM2" type="number" step="0.1" value="${r.customAreaM2||0}"
                        class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full"></div>
                  `:`
                    <div><label class="text-[10px] text-slate-400">${r.roomShape==='hex'||r.roomShape==='oct'?'D₁ (m)':'Dài L (m)'}</label>
                      <input data-rf="L" type="number" step="0.1" value="${r.L||10}"
                        class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full"></div>
                    <div><label class="text-[10px] text-slate-400">${r.roomShape==='hex'||r.roomShape==='oct'?'D₂ (m)':'Rộng W (m)'}</label>
                      <input data-rf="W" type="number" step="0.1" value="${r.W||8}"
                        class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full"></div>
                  `}
                  <div><label class="text-[10px] text-slate-400">Cao trần H (m)</label>
                    <input data-rf="H" type="number" step="0.1" value="${r.H||3}"
                      class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full"></div>
                  <div class="bg-base-900/50 rounded-lg p-2 text-[10px] font-mono-data leading-5">
                    <div id="vol-${i}" class="text-emerald-400 font-medium">V = ${App.ui.heatload._calcVol?.(r)?.toFixed(1)||((r.L||0)*(r.W||0)*(r.H||0)).toFixed(1)} m³</div>
                    <div id="floor-${i}" class="text-slate-400">S = ${App.ui.heatload._calcArea?.(r)?.toFixed(1)||((r.L||0)*(r.W||0)).toFixed(1)} m²</div>
                    ${r.roomShape&&r.roomShape!=='rect'&&r.roomShape!=='custom'?
                      `<div class="text-slate-600">×${r.roomShape==='hex'?'0.866':'0.828'}</div>`:''}
                  </div>
                </div>
              </div>

              <!-- D2. Cấu trúc bao che & tải nhiệt -->
              <div class="space-y-2">
                <!-- D2a. Tường ngoài -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div class="col-span-2">
                    <label class="text-[10px] text-slate-400">Loại tường ngoài (auto-fill U)</label>
                    <select data-rf="wallTypeId" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                      <option value="">-- Chọn hoặc tự nhập U bên dưới --</option>
                      ${(App.data.WALL_TYPES||[]).filter(wt=>!(App.state.hiddenMaterialIds?.wallTypes||[]).includes(wt.id)).map(wt=>`<option value="${wt.id}" ${r.wallTypeId===wt.id?'selected':''}>${wt.name} (U=${wt.U})</option>`).join('')}
                    </select>
                  </div>
                  <div><label class="text-[10px] text-slate-400">U vách (W/m²K)</label>${this.rfInp('uWall',r.uWall||0.45,'0.45')}</div>
                  <div><label class="text-[10px] text-slate-400">S vách nóng (m²)</label>${this.rfInp('aWall',r.aWall||40,'40')}</div>
                  <div><label class="text-[10px] text-slate-400">Vách tiếp xúc với</label>
                    ${this.rfSel('dtFactor',[{v:1.0,n:'Ngoài trời (×1.0)'},{v:0.6,n:'Phòng KĐH (×0.6)'},{v:0.3,n:'Gian giữa (×0.3)'}],r.dtFactor)}
                  </div>
                </div>
                <!-- D2b. Kính & bức xạ mặt trời — Layout gọn 2 hàng -->
                <details class="bg-amber-950/10 border border-amber-900/20 rounded-lg" ${(r.aGlass||0)>0?'open':''}>
                  <summary style="padding:8px 12px;font-size:11px;font-weight:600;color:#fbbf24;cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;user-select:none">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                    Kính & Bức xạ mặt trời
                    <span style="font-size:10px;font-weight:400;color:#4a6680;margin-left:4px">ASHRAE 2001 Ch.29 — CLTD method</span>
                    ${(r.aGlass||0)>0?`<span id="glass-preview-${i}" style="margin-left:auto;font-family:monospace;font-size:10px;color:#fbbf24">S=${r.aGlass}m² · SHGC=${r.shgc||0.6}</span>`:`<span id="glass-preview-${i}" style="margin-left:auto;font-size:10px;color:#3a5470">(nhấp để mở)</span>`}
                  </summary>
                  <div style="padding:10px 12px 12px">
                    <!-- Hàng 1: Diện tích + loại kính + SHGC/U -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2" style="margin-bottom:8px">
                      <div>
                        <label>S kính (m²)</label>
                        ${this.rfInp('aGlass',r.aGlass||0,'0')}
                      </div>
                      <div class="col-span-2">
                        <label>Loại kính — auto-fill SHGC+U</label>
                        <select data-rf="glassTypeId" class="w-full">
                          <option value="">-- Tự nhập SHGC/U bên dưới --</option>
                          ${(App.data.GLASS_CATALOG||[]).filter(g=>!(App.state.hiddenMaterialIds?.glass||[]).includes(g.id)).map(g=>`<option value="${g.id}" ${r.glassTypeId===g.id?'selected':''}>${g.name} (SHGC=${g.SHGC}, U=${g.U})</option>`).join('')}
                        </select>
                      </div>
                      <div>
                        <label>SHGC <span style="font-size:9px;color:#4a6680">(Solar Heat Gain Coef)</span></label>
                        ${this.rfInp('shgc',r.shgc||0.6,'0.60')}
                      </div>
                    </div>
                    <!-- Hàng 2: U kính + SC + CLF -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label>U kính (W/m²K)</label>
                        ${this.rfInp('glassU',r.glassU||5.8,'5.8')}
                      </div>
                      <div>
                        <label>SC — Hệ số che nắng</label>
                        ${this.rfSel('sc',[{v:1.0,n:'Không che (1.0)'},{v:0.8,n:'Rèm ngoài (0.8)'},{v:0.6,n:'Lam ngang (0.6)'},{v:0.4,n:'Brise-soleil (0.4)'}],r.sc||1.0)}
                      </div>
                      <div>
                        <label>CLF — Hệ số tải bức xạ</label>
                        ${this.rfSel('clf',[{v:0.7,n:'Đỉnh trưa (0.7)'},{v:0.55,n:'TB ngày (0.55)'},{v:0.5,n:'Sáng/chiều (0.5)'}],r.clf||0.7)}
                      </div>
                    </div>
                    ${r._ev?.Q_solar>0?`<p style="font-size:10px;font-family:monospace;color:#fbbf24;margin-top:6px">Q_bức_xạ = ${(r._ev.Q_solar/1000).toFixed(3)} kW</p>`:''}
                  </div>
                </details>
                <!-- D2c. Người & thiết bị -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label class="text-[10px] text-slate-400">Số người <span class="text-emerald-400">*</span></label>
                    <input data-rf="nPeople" type="number" step="1" min="0"
                      value="${r.nPeople!=null?r.nPeople:5}"
                      class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">
                  </div>
                  <div class="col-span-2"><label class="text-[10px] text-slate-400">Mức lao động</label>${this.rfSel('laborLevel',laborOpts,r.laborLevel)}</div>
                  <div>
                    <label class="text-[10px] text-slate-400">Gió tươi (L/s/người)</label>
                    <input data-rf="freshAirPerPersonLs" type="number" step="0.5" min="0"
                      value="${r.freshAirPerPersonLs||8.5}"
                      class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">
                    <p class="text-[9px] text-slate-500">ASHRAE 62.1-2022: VP=8.5, y/c=10</p>
                  </div>
                  <div><label class="text-[10px] text-slate-400">LPD đèn (W/m²)</label>${this.rfInp('lpdApplied',r.lpdApplied||12,'12')}</div>
                </div>
              </div>

              <!-- D3. Mái và Sàn — Q_roof + Q_floor -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <!-- Mái -->
                <div class="p-2.5 bg-amber-950/20 border border-amber-800/30 rounded-lg space-y-2">
                  <div class="text-[10px] text-amber-400 font-medium flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
                    Mái (Roof Load — CLTD Method)
                  </div>
                  <label class="flex items-center gap-2 text-xs cursor-pointer">
                    <input data-rf="roofExposed" type="checkbox" ${r.roofExposed?'checked':''} class="rounded">
                    <span class="${r.roofExposed?'text-amber-300':'text-slate-500'}">Phòng có mái tiếp xúc trực tiếp</span>
                  </label>
                  ${r.roofExposed?`
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-400">Loại mái</label>
                      <select data-rf="roofType" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                        ${Object.entries(App.data.CLTD_ROOFS||{}).map(([k,v])=>
                          `<option value="${k}" ${r.roofType===k?'selected':''}>${k}: ${v.name} (U=${v.U})</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400">Diện tích mái (m²) — 0=tự tính từ L×W</label>
                      <input data-rf="roofArea" type="number" step="0.5" value="${r.roofArea||0}"
                        class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">
                    </div>
                  </div>
                  ${r._ev?.Q_roof!=null?`<div class="text-[10px] font-mono-data text-amber-400">Q_mái = ${(r._ev.Q_roof/1000).toFixed(3)} kW</div>`:''}
                  `:'<p class="text-[9px] text-slate-600">Phòng ở tầng trung, mái đã tính qua aWall.</p>'}
                </div>
                <!-- Sàn -->
                <div class="p-2.5 bg-sky-950/20 border border-sky-800/30 rounded-lg space-y-2">
                  <div class="text-[10px] text-sky-400 font-medium flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
                    Sàn (Floor Load — tiếp đất hoặc tiếp không gian lạnh)
                  </div>
                  <label class="flex items-center gap-2 text-xs cursor-pointer">
                    <input data-rf="floorOnGround" type="checkbox" ${r.floorOnGround?'checked':''} class="rounded">
                    <span class="${r.floorOnGround?'text-sky-300':'text-slate-500'}">Sàn tiếp đất / tiếp không gian lạnh bên dưới</span>
                  </label>
                  ${r.floorOnGround?`
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-400">T đất / T bên dưới (°C)</label>
                      <input data-rf="groundTempC" type="number" step="0.5" value="${r.groundTempC??28}"
                        class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400">U sàn (W/m²K)</label>
                      <input data-rf="floorU" type="number" step="0.05" value="${r.floorU||0.8}"
                        class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono-data w-full">
                    </div>
                    <div class="col-span-2 md:col-span-1 flex items-end pb-0.5">
                      ${r._ev?.Q_floor!=null?`<div class="text-[10px] font-mono-data text-sky-400">Q_sàn = ${(r._ev.Q_floor/1000).toFixed(3)} kW</div>`:''}
                    </div>
                  </div>
                  <p class="text-[9px] text-slate-500">VN: T_đất TB ~28°C (sâu). Sàn thường: U≈0.8 W/m²K (bê tông+ceramic). Kho mát: T_đất = T phòng kề.</p>
                  `:'<p class="text-[9px] text-slate-600">Sàn lửng hoặc trên tầng khác — không tính tải sàn.</p>'}
                </div>
              </div>

              </div>

              <!-- Gió thải cục bộ từ thiết bị (hút khói/hơi tại nguồn) — áp dụng được cho
                   MỌI loại phòng, không gò theo mục đích sử dụng cố định (giống cơ chế
                   Mái/Sàn ở trên: mặc định không tick, phòng nào cần thì tự bật). Đề xuất
                   từ thực tế nhà máy chế biến snack: chụp hút khói gas khi đốt, hút hơi từ
                   máy hấp/nướng... cần gió tươi bù để tránh xưởng bị áp âm. -->
              <div class="p-2.5 bg-orange-950/20 border border-orange-800/30 rounded-lg space-y-2">
                <div class="text-[10px] text-orange-400 font-medium flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>
                  Gió thải cục bộ từ thiết bị
                </div>
                <label class="flex items-center gap-2 text-xs cursor-pointer">
                  <input data-rf="hasLocalExhaustEquip" type="checkbox" ${r.hasLocalExhaustEquip?'checked':''} class="rounded">
                  <span class="${r.hasLocalExhaustEquip?'text-orange-300':'text-slate-500'}">Phòng có thiết bị hút thải cục bộ (chụp hút bếp, lò nướng, máy hấp, tủ hàn, hút khói gas...)</span>
                </label>
                ${r.hasLocalExhaustEquip?`
                <div class="space-y-1.5" id="local-exhaust-rows-${i}">
                  ${(r.localExhaustRows||[{name:'',qPerUnitM3h:0,qty:1}]).map((eq,ei)=>`
                  <div class="p-2 bg-base-900/40 rounded-lg space-y-1.5" data-leq-idx="${ei}">
                    <input data-leq="name" type="text" value="${eq.name||''}" placeholder="Tên thiết bị (VD: Chụp hút lò nướng #1)"
                      class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] w-full">
                    <div class="flex gap-2 items-center">
                      <div class="flex-1"><label class="text-[9px] text-slate-500">Lưu lượng hút (m³/h/thiết bị)</label>
                        <input data-leq="qPerUnitM3h" type="number" step="10" value="${eq.qPerUnitM3h||0}" placeholder="m³/h"
                          class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full"></div>
                      <div style="width:70px"><label class="text-[9px] text-slate-500">SL</label>
                        <input data-leq="qty" type="number" step="1" min="1" value="${eq.qty||1}"
                          class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[11px] font-mono-data w-full text-right"></div>
                      <button data-leq-del="${ei}" class="mt-3 flex-shrink-0" style="background:none;border:none;color:#f87171;cursor:pointer;padding:4px" title="Xóa thiết bị này">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>`).join('')}
                  <button data-leq-add="${i}" class="text-[10px] text-emerald-400 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm thiết bị
                  </button>
                </div>
                <div class="text-[10px] font-mono-data text-orange-300">Tổng gió thải cục bộ: ${((r.localExhaustRows||[]).reduce((s,eq)=>s+(eq.qPerUnitM3h||0)*(eq.qty||1),0)).toFixed(0)} m³/h</div>
                <div>
                  <label class="text-[10px] text-slate-400">Gió tươi bù thay thế</label>
                  <select data-rf="localExhaustTreated" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                    <option value="ahu" ${(!r.localExhaustTreated||r.localExhaustTreated==='ahu')?'selected':''}>Xử lý nhiệt qua AHU/PAU chính — cộng vào gió tươi hệ thống, có tính tải lạnh</option>
                    <option value="raw" ${r.localExhaustTreated==='raw'?'selected':''}>Bù thuần túy (quạt cấp bù riêng) — chỉ cân bằng áp suất, KHÔNG tính vào tải lạnh</option>
                  </select>
                  <p class="text-[9px] text-slate-500 mt-1">${r.localExhaustTreated==='raw'?'Gió bù cấp thẳng gần điểm hút, không qua coil — tiết kiệm năng lượng nhưng không kiểm soát nhiệt độ/độ ẩm của luồng gió này.':'Gió bù được xử lý cùng hệ thống điều hòa chính — cộng vào Q_tươi và ảnh hưởng Q_coil.'}</p>
                </div>
                `:'<p class="text-[9px] text-slate-600">Không tick nếu phòng không có thiết bị hút thải cục bộ.</p>'}
              </div>

              <!-- E. AHU/PAU/FCU_OA thông số cấp — FCU_OA cũng cần vì thiết bị xử lý gió tươi
                   riêng của nó tính theo cùng công thức enthalpy AHU/PAU (xem calcCoil) -->
              ${(r.equipType==='AHU'||r.equipType==='PAU'||r.equipType==='FCU_OA')?`
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-700/40">
                <div><label class="text-[10px] text-cyan-400">T cấp thiết kế (°C)${r.equipType==='FCU_OA'?' — thiết bị OA riêng':''}</label>${this.rfInp('tSupplyDesign',r.tSupplyDesign,'14')}</div>
                <div><label class="text-[10px] text-cyan-400">RH cấp (%)${r.equipType==='FCU_OA'?' — thiết bị OA riêng':''}</label>${this.rfInp('rhSupplyDesign',r.rhSupplyDesign,'90')}</div>
                ${r.equipType!=='FCU_OA'?`<div><label class="text-[10px] text-cyan-400">ESP quạt (Pa)</label>${this.rfInp('espPa',r.espPa,'400')}</div>`:''}
              </div>`:''}

              <!-- E2. Tham số đặc thù theo loại phòng -->
              ${(()=>{
                const bt = r.buildingType;
                if(bt==='datacenter'||bt==='server_room') return `
                  <div class="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-lg space-y-2">
                    <div class="text-[10px] text-cyan-400 font-medium flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                      Data Center — ASHRAE TC9.9 2021 (lưu lượng tính từ tải IT, không theo ACH)
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-slate-400">Profile DC (tham chiếu nhanh)</label>
                        <select data-rf="dcProfile" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full mb-1">
                          <option value="">-- Tự nhập --</option>
                          ${(App.data.DC_RACK_PROFILES||[]).map(p=>`<option value="${p.id}" ${r.dcProfile===p.id?'selected':''}>${p.name} (${p.itKWPerRack}kW/rack, PUE=${p.pue})</option>`).join('')}
                        </select>
                    <label class="text-[10px] text-slate-400">Mật độ tải IT (kW/m²)</label>
                        ${this.rfInp('itLoadKWM2',r.itLoadKWM2||1.5,'1.5')}
                        <p class="text-[9px] text-slate-500 mt-0.5">Typ: 1-3 kW/m² (ASHRAE Class A1). Edge DC: 3-10 kW/m²</p>
                      </div>
                      <div>
                        <label class="text-[10px] text-slate-400">ΔT supply→return (°C)</label>
                        ${this.rfInp('deltaT',r.deltaT||12,'12')}
                        <p class="text-[9px] text-slate-500 mt-0.5">Typ: 10-15°C. ASHRAE A1: supply 15-27°C</p>
                      </div>
                    </div>
                    <div class="text-[10px] font-mono-data text-cyan-400">
                      Q_IT_total = ${((r.itLoadKWM2||1.5) * ((r.L||0)*(r.W||0))).toFixed(1)} kW
                      · Q_airflow = ${((r.itLoadKWM2||1.5)*(r.L||0)*(r.W||0)*3600/(1.2*(r.deltaT||12))).toFixed(0)} m³/h
                    </div>
                  </div>`;
                if(bt==='electrical_room'||bt==='control_room') return `
                  <div class="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-lg space-y-3" id="elec-device-section-${i}">
                    <div class="text-[10px] text-amber-400 font-medium flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                      Tải nhiệt nội bộ — Thiết bị điện / ${bt==='control_room'?'PLC/DCS/SCADA':'Tủ điện động lực'}
                    </div>
                    <div class="text-[9px] text-amber-300/60">
                      NFPA 70 / TCVN 9207:2012 / IEC 62271 — Tổng nhiệt tản vào phòng từ VFD, tủ MCC, biến áp, UPS, PLC...
                      Nhiệt kW = P_định_mức × Hệ_số_tải × (1 − η)
                    </div>
                    <!-- Bảng thiết bị -->
                    <div class="overflow-x-auto" style="-webkit-overflow-scrolling:touch">
                      <table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px">
                        <thead><tr style="background:#071325">
                          <th style="padding:6px 8px;text-align:left;color:#8eaac2;border-bottom:1px solid #1e3450">Tên thiết bị</th>
                          <th style="padding:6px 8px;color:#8eaac2;border-bottom:1px solid #1e3450">Loại</th>
                          <th style="padding:6px 8px;color:#8eaac2;border-bottom:1px solid #1e3450">P định mức (kW)</th>
                          <th style="padding:6px 8px;color:#8eaac2;border-bottom:1px solid #1e3450">Số lượng</th>
                          <th style="padding:6px 8px;color:#8eaac2;border-bottom:1px solid #1e3450">H/s tải (0-1)</th>
                          <th style="padding:6px 8px;color:#fbbf24;border-bottom:1px solid #1e3450">Q tản (kW)</th>
                          <th style="width:28px;border-bottom:1px solid #1e3450"></th>
                        </tr></thead>
                        <tbody id="elec-rows-${i}">
                          ${(r.elecDeviceRows||[]).map((d,di)=>{
                            const preset=(App.data.ELEC_DEVICE_CATALOG||[]).find(p=>p.id===d.typeId)||{};
                            const heatFactor=preset.heatFactor||d.heatFactor||0.03;
                            const qLoss=((d.ratedKW||0)*(d.qty||1)*(d.loadFactor||0.8)*heatFactor);
                            return `<tr data-edi="${di}" style="border-bottom:1px solid rgba(26,48,80,.4)">
                              <td style="padding:5px 6px">
                                <input data-elec="name" data-ri="${i}" data-di="${di}" value="${d.name||''}" placeholder="Tên thiết bị" style="width:100%;font-size:11px">
                              </td>
                              <td style="padding:5px 6px">
                                <select data-elec="typeId" data-ri="${i}" data-di="${di}" style="width:120px;font-size:11px">
                                  <option value="">-- Tự nhập --</option>
                                  ${(App.data.ELEC_DEVICE_CATALOG||[]).map(p=>`<option value="${p.id}" ${d.typeId===p.id?'selected':''}>${p.name}</option>`).join('')}
                                </select>
                              </td>
                              <td style="padding:5px 6px">
                                <input data-elec="ratedKW" data-ri="${i}" data-di="${di}" type="number" step="0.1" value="${d.ratedKW||''}" placeholder="${preset.ratedKWDefault||1}" style="width:70px;font-size:11px">
                              </td>
                              <td style="padding:5px 6px">
                                <input data-elec="qty" data-ri="${i}" data-di="${di}" type="number" step="1" min="1" value="${d.qty||1}" style="width:50px;font-size:11px">
                              </td>
                              <td style="padding:5px 6px">
                                <input data-elec="loadFactor" data-ri="${i}" data-di="${di}" type="number" step="0.05" min="0" max="1" value="${d.loadFactor!=null?d.loadFactor:0.8}" style="width:55px;font-size:11px">
                              </td>
                              <td style="padding:5px 6px;font-family:monospace;color:${qLoss>0?'#fbbf24':'#4a6680'};font-weight:700">
                                ${qLoss.toFixed(3)} kW
                              </td>
                              <td style="padding:4px">
                                <button data-del-elec="${di}" data-ri="${i}" style="background:none;border:none;color:#3a5070;cursor:pointer;padding:3px">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                                </button>
                              </td>
                            </tr>`;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                    <!-- Footer: Thêm thiết bị + Tổng -->
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:6px">
                      <button data-add-elec="${i}" style="display:flex;align-items:center;gap:5px;background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.25);color:#fb923c;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Thêm thiết bị
                      </button>
                      <div style="font-family:monospace;font-size:12px;font-weight:700;color:#fbbf24;text-align:right">
                        Q_điện_nội_bộ = 
                        <span style="font-size:14px;color:#fb923c">
                          ${(r.elecDeviceRows||[]).reduce((s,d)=>{
                            const p=(App.data.ELEC_DEVICE_CATALOG||[]).find(x=>x.id===d.typeId)||{};
                            return s+((d.ratedKW||0)*(d.qty||1)*(d.loadFactor!=null?d.loadFactor:0.8)*(p.heatFactor||d.heatFactor||0.03));
                          },0).toFixed(3)}
                        </span> kW
                        <span style="font-size:10px;color:#4a6680;font-weight:400;margin-left:4px">(thêm vào Q_room)</span>
                      </div>
                    </div>
                  </div>`;

                if(bt==='toilet') return `
                  <div class="p-2.5 bg-slate-900/60 border border-slate-700/40 rounded-lg space-y-2">
                    <div class="text-[10px] text-slate-300 font-medium flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/></svg>
                      Nhà vệ sinh — ASHRAE 62.1-2022 §6.2.7 (exhaust theo số thiết bị)
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                      <div><label class="text-[10px] text-slate-400">Số bệt xí (bộ)</label>${this.rfInp('nToilets',r.nToilets||2,'2')}<p class="text-[9px] text-slate-500">25 L/s/bộ</p></div>
                      <div><label class="text-[10px] text-slate-400">Số bồn tiểu (bộ)</label>${this.rfInp('nUrinals',r.nUrinals||0,'0')}<p class="text-[9px] text-slate-500">17.5 L/s/bộ</p></div>
                      <div><label class="text-[10px] text-slate-400">Số phòng tắm</label>${this.rfInp('nShowers',r.nShowers||0,'0')}<p class="text-[9px] text-slate-500">35 L/s/phòng</p></div>
                    </div>
                    <p class="text-[9px] text-slate-500">Hệ thống exhaust-only. Makeup từ hành lang qua cửa khe hở. Không cần AHU riêng.</p>
                  </div>`;
                if(bt==='commercial_kitchen') return `
                  <div class="p-2.5 bg-orange-950/30 border border-orange-800/40 rounded-lg space-y-2">
                    <div class="text-[10px] text-orange-400 font-medium flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
                      Bếp công nghiệp — Capture velocity method (ASHRAE App Ch.31 + NFPA 96)
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div><label class="text-[10px] text-slate-400">Chiều rộng chụp (m)</label>${this.rfInp('hoodWidthM',r.hoodWidthM||3,'3')}</div>
                      <div><label class="text-[10px] text-slate-400">Chiều sâu chụp (m)</label>${this.rfInp('hoodDepthM',r.hoodDepthM||1.2,'1.2')}</div>
                      <div>
                        <label class="text-[10px] text-slate-400">Loại thiết bị bếp</label>
                        <select data-rf="kitchenType" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full">
                          <option value="light"  ${r.kitchenType==='light'  ?'selected':''}>Nhẹ (steamer, oven) — 0.3 m/s</option>
                          <option value="medium" ${r.kitchenType==='medium' ?'selected':''}>Trung bình (gas range) — 0.45 m/s</option>
                          <option value="heavy"  ${r.kitchenType==='heavy'  ?'selected':''}>Nặng (broiler, fryer) — 0.55 m/s</option>
                          <option value="xheavy" ${r.kitchenType==='xheavy' ?'selected':''}>Rất nặng (solid fuel) — 0.65 m/s</option>
                        </select>
                      </div>
                    </div>
                    <div class="text-[10px] font-mono-data text-orange-400">
                      Q_exhaust ≈ ${(((r.hoodWidthM||3)*(r.hoodDepthM||1.2))*0.55*3600*1.1).toFixed(0)} m³/h
                      (v=0.55 m/s, SF=1.1) · Q_makeup ≈ ${((((r.hoodWidthM||3)*(r.hoodDepthM||1.2))*0.55*3600*1.1)*0.85).toFixed(0)} m³/h
                    </div>
                  </div>`;
                if(bt==='hospital_or'||bt==='hospital_isolation') return `
                  <div class="p-2.5 bg-red-950/30 border border-red-800/40 rounded-lg space-y-2">
                    <div class="text-[10px] text-red-400 font-medium flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3H21"/></svg>
                      ${bt==='hospital_or'?'Phòng mổ OR — ASHRAE 170:2021 (áp dương ≥+15 Pa)':'Phòng cách ly — ASHRAE 170:2021 (áp âm ≤-8 Pa)'}
                    </div>
                    <div class="text-[10px] text-slate-400 space-y-0.5">
                      <div>ACH tối thiểu: <span class="text-red-300 font-mono-data">${bt==='hospital_or'?'20':'12'} ACH tổng, ${bt==='hospital_or'?'4':'2'} ACH gió tươi</span> (ASHRAE 170:2021 Table 7.1)</div>
                      <div>Áp suất: <span class="font-mono-data ${bt==='hospital_or'?'text-emerald-400':'text-amber-400'}">${bt==='hospital_or'?'≥+15 Pa vs hành lang':'≤-8 Pa vs hành lang'}</span></div>
                      <div>Lọc: <span class="text-slate-300">HEPA H14 (99.995%) tại cấp gió vào phòng</span></div>
                    </div>
                  </div>`;
                return '';
              })()}

              <!-- E2. Vách ngăn nội bộ (Partition Load) — kề phòng nhiệt độ khác nhau -->
              <div class="p-2.5 bg-violet-950/30 border border-violet-800/40 rounded-lg space-y-2">
                <div class="flex items-center justify-between">
                  <div class="text-[10px] text-violet-400 font-medium flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                    Vách ngăn nội bộ — Q kề phòng nhiệt độ khác
                    <span class="text-slate-500 font-normal">(quan trọng với nhà máy đa zone)</span>
                  </div>
                  <button data-add-partition="${i}"
                    class="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm vách ngăn
                  </button>
                </div>
                ${(r.partitionRows||[]).length===0
                  ? `<p class="text-[10px] text-slate-600 italic">Chưa có vách ngăn nội bộ. Thêm nếu phòng này kề phòng/khu vực có nhiệt độ khác.</p>`
                  : `<div class="space-y-1.5">
                  ${(r.partitionRows||[]).map((p,pi)=>{
                    const Q_par = p._qW;
                    const neg   = Q_par<0;
                    const wallTypeOpts=(App.data.WALL_TYPES||[]).map(w=>
                      `<option value="${w.id}" ${p.wallTypeId===w.id?'selected':''}>${w.name}(U=${w.U})</option>`).join('');
                    const roomOpts2=(App.state._fullRooms||this.R()).filter(r2=>r2.id!==r.id).map(r2=>
                      `<option value="${r2.id}" ${p.adjRoomId===r2.id?'selected':''}>${r2.name||'Phòng?'}</option>`).join('');
                    return `<div class="border border-slate-700/40 rounded-lg p-2 grid grid-cols-1 md:grid-cols-5 gap-1.5 items-center" data-partition-idx="${pi}" data-room-idx="${i}">
                      <div><label class="text-[9px] text-slate-500">Vật liệu vách</label>
                        <select data-part-f="wallTypeId" data-part-room="${i}" data-part-idx="${pi}"
                          class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] w-full">
                          <option value="">-- Tự nhập U --</option>${wallTypeOpts}
                        </select>
                      </div>
                      <div><label class="text-[9px] text-slate-500">U vách (W/m²K)</label>
                        <input data-part-f="uWall" data-part-room="${i}" data-part-idx="${pi}"
                          type="number" step="0.01" value="${p.uWall||0.45}"
                          class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] font-mono-data w-full">
                      </div>
                      <div><label class="text-[9px] text-slate-500">S vách ngăn (m²)</label>
                        <input data-part-f="areaM2" data-part-room="${i}" data-part-idx="${pi}"
                          type="number" step="0.1" value="${p.areaM2||20}"
                          class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] font-mono-data w-full">
                      </div>
                      <div>
                        <label class="text-[9px] text-slate-500">Phía kề</label>
                        <select data-part-f="adjSource" data-part-room="${i}" data-part-idx="${pi}"
                          class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] w-full">
                          <option value="temp" ${p.adjSource==='temp'?'selected':''}>Nhập T (°C)</option>
                          <option value="room" ${p.adjSource==='room'?'selected':''}>Chọn phòng</option>
                        </select>
                        ${p.adjSource==='room'
                          ? `<select data-part-f="adjRoomId" data-part-room="${i}" data-part-idx="${pi}"
                              class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] w-full mt-1">
                              <option value="">-- Chọn phòng kề --</option>${roomOpts2}
                             </select>`
                          : `<input data-part-f="adjTempC" data-part-room="${i}" data-part-idx="${pi}"
                              type="number" step="0.5" value="${p.adjTempC??35}" placeholder="T kề (°C)"
                              class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] font-mono-data w-full mt-1">`
                        }
                      </div>
                      <div class="flex items-end gap-1.5">
                        ${Q_par!=null
                          ? `<span class="font-mono-data text-[10px] ${neg?'text-emerald-400':'text-amber-400'} font-medium">
                              ${(Q_par/1000).toFixed(2)} kW</span>`
                          : '<span class="text-[10px] text-slate-600">—</span>'}
                        <button data-del-partition="${pi}" data-del-part-room="${i}"
                          class="ml-auto text-slate-500 hover:text-red-400 p-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>`;
                  }).join('')}
                </div>`}
                <p class="text-[9px] text-slate-600">Q âm = tải lạnh (phòng kề lạnh hơn). Q dương = tải nhiệt (phòng kề nóng hơn). Nguồn: ASHRAE HOF 2021 Ch.18 §18.3</p>
              </div>

              <!-- E3. Tính U từ cấu tạo lớp thực tế (Inline tool) -->
              <details class="border border-dashed border-emerald-800/50 rounded-lg overflow-hidden">
                <summary class="px-3 py-2 bg-emerald-950/20 text-[10px] text-emerald-400 cursor-pointer flex items-center gap-1.5 hover:bg-emerald-950/40 select-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L8 12"/><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z"/></svg>
                  Công cụ tính U từ cấu tạo lớp thực tế (δ/λ) — Nguồn: ASHRAE HOF 2021 / ISO 6946:2017
                </summary>
                <div class="p-3 space-y-2" id="ucalc-${i}">
                  <p class="text-[10px] text-slate-500">R_total = 1/h_o + Σ(δ/λ) + 1/h_i → U = 1/R_total &nbsp;|&nbsp; h_o=23.3 W/m²K (gió), h_i=11.6 W/m²K (tĩnh)</p>
                  <div class="space-y-1" id="ucalc-layers-${i}">
                    ${(r.wallLayers||[{materialId:'brick_solid',thicknessMm:200},{materialId:'mortar_cement',thicknessMm:15}]).map((lyr,li)=>{
                      const matCats=[
                        {label:'── Gạch, bê tông ──',disabled:true},
                        ...(App.data.CONSTRUCTION_MATERIALS||[]).filter(m=>['masonry','concrete'].includes(m.cat)),
                        {label:'── Vữa ──',disabled:true},
                        ...(App.data.CONSTRUCTION_MATERIALS||[]).filter(m=>m.cat==='mortar'),
                        {label:'── Cách nhiệt ──',disabled:true},
                        ...(App.data.CONSTRUCTION_MATERIALS||[]).filter(m=>m.cat==='insul'),
                        {label:'── Hoàn thiện ──',disabled:true},
                        ...(App.data.CONSTRUCTION_MATERIALS||[]).filter(m=>m.cat==='finish'),
                        {label:'── Kim loại, kính ──',disabled:true},
                        ...(App.data.CONSTRUCTION_MATERIALS||[]).filter(m=>['metal','glass'].includes(m.cat)),
                        {label:'── Khe không khí ──',disabled:true},
                        ...(App.data.CONSTRUCTION_MATERIALS||[]).filter(m=>m.cat==='airgap'),
                      ];
                      const matOpts=matCats.map(m=>m.disabled
                        ? `<option disabled>${m.label}</option>`
                        : `<option value="${m.id}" ${lyr.materialId===m.id?'selected':''}>${m.name}${m.lambda?` (λ=${m.lambda})`:(m.Rfixed?` (R=${m.Rfixed})`:'')} </option>`
                      ).join('');
                      const mat=(App.data.CONSTRUCTION_MATERIALS||[]).find(m=>m.id===lyr.materialId);
                      const Rval=mat?.Rfixed!=null?mat.Rfixed.toFixed(3):
                        (mat?.lambda&&lyr.thicknessMm?(lyr.thicknessMm/1000/mat.lambda).toFixed(4):'—');
                      // FIX: trước đây select (vật liệu) và input (độ dày) nhồi chung 1 dòng
                      // flex — trên một số trình duyệt mobile, select với flex-1 bị co lại
                      // gần như biến mất (hộp trống nhỏ xíu) trong khi input độ dày lại
                      // chiếm phần lớn chiều rộng còn dư — ngược hẳn với nhu cầu thực tế
                      // (tên vật liệu cần rộng để đọc, độ dày chỉ cần vài ký tự số). Tách
                      // thành 2 dòng: dòng 1 = select full-width, dòng 2 = độ dày + R + xóa.
                      return `<div class="p-2 bg-base-900/40 rounded-lg space-y-1.5" data-ucalc-li="${li}" data-ucalc-room="${i}">
                        <select data-ucalc-f="materialId" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1.5 text-[10px] w-full">${matOpts}</select>
                        <div class="flex gap-2 items-center">
                          <label class="text-[10px] text-slate-500 flex-shrink-0">Độ dày</label>
                          <input data-ucalc-f="thicknessMm" type="number" step="1" min="0" value="${lyr.thicknessMm||0}"
                            placeholder="mm" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] w-16 font-mono-data text-right flex-shrink-0">
                          <span class="text-[10px] text-slate-500 flex-shrink-0">mm</span>
                          <span data-ucalc-r="${li}" class="text-[10px] font-mono-data text-cyan-400 flex-shrink-0">R=${Rval}</span>
                          <button data-ucalc-del="${li}" data-ucalc-room="${i}" class="ml-auto text-slate-600 hover:text-red-400 p-0.5 flex-shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                        </div>
                      </div>`;
                    }).join('')}
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <button data-ucalc-add="${i}" class="text-[10px] text-emerald-400 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm lớp
                    </button>
                    <span id="ucalc-result-${i}" class="font-mono-data text-[11px] text-amber-400 font-medium ml-2">U = —</span>
                    <button data-ucalc-apply="${i}"
                      class="ml-auto bg-emerald-700 hover:bg-emerald-600 text-white rounded px-2 py-1 text-[10px] flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Áp dụng U này
                    </button>
                  </div>
                  <!-- FIX (Bước 3): calcULayered() vốn đã tính ra warnings (lớp thiếu λ, độ
                       dày=0 bị bỏ qua, U bất thường...) nhưng trước đây KHÔNG hiện ra đâu cả —
                       người dùng áp dụng U sai mà không biết 1 lớp đã bị âm thầm loại khỏi
                       phép tính. Giờ hiện rõ ngay dưới kết quả. -->
                  <div id="ucalc-warnings-${i}" class="space-y-0.5"></div>
                </div>
              </details>

              <!-- F. Air breakdown preview -->
              ${airBadge}
            </div>
          </div>
        </div>`;
      }).join('') + `<p class="text-[11px] text-slate-500 mt-1">AHU/PAU: Q_tươi xử lý qua mixing point. FCU: Q_tươi cộng thẳng Q_phòng. VENT: Q_coil=0.</p>`;
    },

    // ── Motor + Para HTML (giữ nguyên logic cũ) ───────────────────────────────
    _motorsHtml(){
      const rows = this.M();
      const roomOpts = `<option value="">⚠ Chưa gán phòng</option>`+
        this.R().map(r=>`<option value="${r.id}">${r.name||('Phòng '+(this.R().indexOf(r)+1))}</option>`).join('');
      const tbody = rows.map((m,i)=>{
        const {eta,flag}=App.calc.calcMotorEta(m.pKw||5.5);
        const assigned=!!(m.roomId&&this.R().find(r=>r.id===m.roomId));
        return `<tr data-mi="${i}" class="${assigned?'':'bg-amber-950/20'}">
          <td class="px-2 py-1"><input data-mf="name" value="${m.name||''}" type="text" placeholder="Tên motor"
            class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-24"></td>
          <td class="px-2 py-1">
            <select data-mf="roomId" class="bg-base-900 border ${assigned?'border-emerald-700':'border-amber-500'} rounded px-1.5 py-1 text-xs w-36"
              title="Gán motor vào phòng cụ thể để tính nhiệt tải đúng">
              ${roomOpts.replace(`value="${m.roomId||''}"`,`value="${m.roomId||''}" selected`)}
            </select>
          </td>
          <td class="px-2 py-1"><input data-mf="pKw" type="number" step="0.1" value="${m.pKw||''}"
            class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono-data w-16 text-right"></td>
          <td class="px-2 py-1"><input data-mf="qty" type="number" value="${m.qty||1}"
            class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs font-mono-data w-12 text-right"></td>
          <td class="px-2 py-1"><select data-mf="method" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs">
            <option value="A" ${m.method==='A'?'selected':''}>A (FL×FU)</option>
            <option value="B" ${m.method==='B'?'selected':''}>B (đơn giản)</option>
            <option value="C" ${m.method==='C'?'selected':''}>C (TCVN)</option>
          </select></td>
          <td class="px-2 py-1"><select data-mf="position" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs">
            <option value="TH1" ${m.position==='TH1'?'selected':''}>TH1 (motor+tải trong)</option>
            <option value="TH2" ${m.position==='TH2'?'selected':''}>TH2 (motor trong/tải ngoài)</option>
            <option value="TH3" ${m.position==='TH3'?'selected':''}>TH3 (tải trong/motor ngoài)</option>
          </select></td>
          <td class="px-2 py-1"><input data-mf="FL" type="number" step="0.01" value="${m.FL??1}"
            class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-14 text-right"></td>
          <td class="px-2 py-1"><input data-mf="FU" type="number" step="0.01" value="${m.FU??1}"
            class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-14 text-right"></td>
          <td class="px-2 py-1"><label class="flex items-center gap-1 text-xs cursor-pointer">
            <input data-mf="hasVFD" type="checkbox" ${m.hasVFD?'checked':''} class="rounded"> VFD</label></td>
          <td class="px-2 py-1 text-[10px] font-mono-data text-slate-400">${(eta*100).toFixed(1)}%${flag.startsWith('⚙')?` <span class="text-amber-400">${flag}</span>`:''}</td>
          <td class="px-2 py-1 text-right font-mono-data text-amber-400 text-xs">${m._qKW!=null?m._qKW.toFixed(3)+' kW':'—'}</td>
          <td class="px-2 py-1"><button data-mdel="${i}" class="text-slate-500 hover:text-red-400 p-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button></td>
        </tr>`;
      }).join('');
      const unassigned=rows.filter(m=>!m.roomId).length;
      return `${unassigned?`<div class="text-[11px] text-amber-400 mb-2 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        ${unassigned} motor chưa gán phòng (nền cam) — nhiệt tỏa sẽ không được tính vào bất kỳ phòng nào!
      </div>`:''}
      <div class="overflow-x-auto"><table class="zebra w-full text-xs min-w-[1100px]">
        <thead class="text-slate-400 sticky top-0 bg-base-900"><tr>
          <th class="text-left px-2 py-1.5">Tên motor</th>
          <th class="px-2 text-amber-400">Gán vào phòng *</th>
          <th class="px-2">P(kW)</th><th class="px-2">SL</th>
          <th class="px-2">Phương pháp</th><th class="px-2">Vị trí TH</th>
          <th class="px-2">FL</th><th class="px-2">FU</th><th class="px-2">VFD</th>
          <th class="px-2">η IE3</th><th class="px-2">Q tỏa</th><th></th>
        </tr></thead>
        <tbody>${tbody||'<tr><td colspan="12" class="text-center text-slate-500 py-3 text-xs">Chưa có motor. Thêm motor rồi gán vào phòng tương ứng.</td></tr>'}</tbody>
      </table></div>
      <button id="hl-add-motor" class="mt-2 text-xs text-emerald-400 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm motor
      </button>
      <p class="text-[11px] text-slate-500 mt-1">η nội suy tuyến tính giữa các mức IEC 60034-30-1 IE3. Gán từng motor vào đúng phòng để tính nhiệt tỏa per-room.</p>`;
    },


    // ── Bind events
    _paraHtml(){
      const rows = this.P();
      const doorOpts = (App.data.doorCatalog||[]).filter(d=>!(App.state.hiddenMaterialIds?.doors||[]).includes(d.code)).map(d=>({v:d.code,n:d.name}));
      const roomOpts = `<option value="">⚠ Chưa gán phòng</option>`+
        this.R().map(r=>`<option value="${r.id}">${r.name||('Phòng '+(this.R().indexOf(r)+1))}</option>`).join('');
      const html = rows.map((p,i)=>{
        const qKW = p._qW!=null ? (p._qW/1000).toFixed(3) : '';
        const neg = p._qW!=null && p._qW<0;
        const assigned=!!(p.roomId&&this.R().find(r=>r.id===p.roomId));
        return `<div class="border ${assigned?'border-slate-700/50':'border-amber-800/50'} rounded-lg p-3 mb-2" data-pi="${i}">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <select data-pf="type" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs">
              ${(App.data.parasiticTypes||[]).map(t=>`<option value="${t.code}" ${p.type===t.code?'selected':''}>${t.name}</option>`).join('')}
            </select>
            <input data-pf="name" value="${p.name||''}" placeholder="Tên thiết bị" type="text" class="bg-base-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-36">
            <select data-pf="roomId" title="Gán vào phòng"
              class="bg-base-900 border ${assigned?'border-emerald-700':'border-amber-500'} rounded-lg px-2 py-1.5 text-xs w-40">
              ${roomOpts.replace(`value="${p.roomId||''}"`,`value="${p.roomId||''}" selected`)}
            </select>
            ${qKW?`<span class="font-mono-data text-xs ${neg?'text-emerald-400':'text-amber-400'}">${qKW} kW${neg?' (lạnh ký sinh)':' (nhiệt tỏa)'}</span>`:''}
            <button data-pdel="${i}" class="text-slate-500 hover:text-red-400 ml-auto p-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
          </div>
          ${p.type==='IQF'?`<div class="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div><label class="text-[10px] text-slate-400">L buồng(m)</label><input data-pf="L" type="number" step="0.1" value="${p.L||5}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">W(m)</label><input data-pf="W" type="number" step="0.1" value="${p.W||3}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">H(m)</label><input data-pf="H" type="number" step="0.1" value="${p.H||2.5}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">U vách(W/m²K)</label><input data-pf="uPanel" type="number" step="0.01" value="${p.uPanel||0.22}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">T buồng(°C)</label><input data-pf="tChamber" type="number" value="${p.tChamber??-35}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">Loại cửa</label><select data-pf="doorCode" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full">${doorOpts.map(o=>`<option value="${o.v}" ${p.doorCode===o.v?'selected':''}>${o.n}</option>`).join('')}</select></div>
          </div>
          <p class="text-[9px] text-slate-500 mt-1">Q âm = thiết bị hút nhiệt khỏi phòng ĐHKK → giảm tải (Peak Design: không trừ vào Q_coil để an toàn)</p>`:''}
          ${p.type==='GLAZE'?`<div class="grid grid-cols-3 gap-2">
            <div><label class="text-[10px] text-slate-400">S bể mạ băng(m²)</label><input data-pf="aBasin" type="number" step="0.1" value="${p.aBasin||10}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">T nước mạ(°C)</label><input data-pf="tWater" type="number" value="${p.tWater??0}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">K trao đổi nhiệt</label><input data-pf="kWater" type="number" value="${p.kWater||20}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
          </div>`:''}
          ${p.type==='ICE'?`<div class="grid grid-cols-2 gap-2">
            <div><label class="text-[10px] text-slate-400">Sản lượng đá(kg/h)</label><input data-pf="mIceKgH" type="number" value="${p.mIceKgH||500}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">T nước đầu ra(°C)</label><input data-pf="tWaterOut" type="number" value="${p.tWaterOut??5}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
          </div>`:''}
          ${p.type==='ROTOR'?`<div class="grid grid-cols-3 gap-2">
            <div><label class="text-[10px] text-slate-400">G_gió(m³/h)</label><input data-pf="gAirM3h" type="number" value="${p.gAirM3h||2000}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">T vào Rotor(°C)</label><input data-pf="tInRotor" type="number" value="${p.tInRotor||25}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
            <div><label class="text-[10px] text-slate-400">T ra Rotor(°C)</label><input data-pf="tOutRotor" type="number" value="${p.tOutRotor||40}" class="bg-base-900 border border-slate-700 rounded px-1.5 py-1 text-xs w-full font-mono-data"></div>
          </div>
          <p class="text-[9px] text-slate-500 mt-1">Rotor tỏa nhiệt vào phòng → tải dương, cộng vào Q_sensible phòng được gán.</p>`:''}
        </div>`;
      }).join('');
      const unassigned=rows.filter(p=>!p.roomId).length;
      return `${unassigned?`<p class="text-[11px] text-amber-400 mb-2">⚠ ${unassigned} tải ký sinh chưa gán phòng (viền cam)</p>`:''}
        ${html}<button id="hl-add-para" class="mt-1 text-xs text-emerald-400 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm tải ký sinh</button>
      <p class="text-[11px] text-slate-500 mt-1">
        Tải ký sinh trong phòng ĐHKK nhà máy chế biến: IQF/mạ băng/đá vảy hút nhiệt (âm) → giảm tải ĐHKK.
        Rotor tỏa nhiệt (dương). Peak Design: không trừ tải âm (conservative).
      </p>`;
    },

    _bindPara(root){
      root.querySelector('#hl-add-para')?.addEventListener('click',()=>{
        this.P().push({id:this.uid(),type:'IQF',name:'',roomId:null,
          tChamber:-35,L:5,W:3,H:2.5,uPanel:0.22,doorCode:'D1200x2200-STD'});
        this.save(); this.render();
      });
      root.querySelectorAll('[data-pdel]').forEach(b=>b.addEventListener('click',()=>{
        this.P().splice(parseInt(b.getAttribute('data-pdel')),1); this.save(); this.render();
      }));
      root.querySelectorAll('[data-pi]').forEach(row=>{
        const i=parseInt(row.getAttribute('data-pi'));
        row.querySelectorAll('[data-pf]').forEach(el=>el.addEventListener('change',()=>{
          const f=el.getAttribute('data-pf'); if(!this.P()[i]) return;
          this.P()[i][f]=el.type==='number'?parseFloat(el.value):el.value;
          this.save(); if(f==='type') this.render();
        }));
      });
    },

    // ── Room Drawer: slide-in panel để chỉnh sửa phòng ─────────────────────
    _drawerRoomIdx: -1,
    openDrawer(roomIdx){
      try{ return this._openDrawer_impl(roomIdx); }
      catch(e){ console.warn('[MultiHVAC] openDrawer error:',e.message); App.ui.toast('err','Không mở được form phòng: '+e.message.slice(0,60)); }
    },
    _openDrawer_impl(roomIdx){
      const r=this.R()[roomIdx]; if(!r) return;
      this._drawerRoomIdx=roomIdx;

      const drawer=document.getElementById('room-drawer');
      const panel =document.getElementById('room-drawer-panel');
      const body  =document.getElementById('room-drawer-body');
      const title =document.getElementById('room-drawer-title');
      const sub   =document.getElementById('room-drawer-subtitle');
      if(!drawer||!panel||!body) return;

      // Header: tên phòng + subtitle (tầng · loại phòng)
      const fl=this.FL().find(f=>f.id===r.floorId)||(this.FL()[0]);
      if(title) title.textContent=r.name||'Phòng chưa đặt tên';
      if(sub)   sub.textContent=(fl?.name||'')+(r.buildingType
        ?' · '+((App.data.BUILDING_TYPES||[]).find(b=>b.id===r.buildingType)?.name||''):'');

      // ── Render form HTML vào drawer body (DOMParser) ──────────────────
      const saved=App.state.hlRooms.slice();
      App.state.hlRooms=[r];
      try{
        const rawHtml=this._roomsHtml();
        if(typeof DOMParser!=='undefined'){
          const tmpDoc=new DOMParser().parseFromString(
            '<div id="_root">'+rawHtml+'</div>','text/html');
          const roomBody=tmpDoc.querySelector('.room-body');
          if(roomBody){
            roomBody.classList.remove('hidden');
            body.innerHTML=roomBody.innerHTML;
          } else {
            body.innerHTML=tmpDoc.getElementById('_root')?.innerHTML||rawHtml;
          }
        } else {
          const bStart=rawHtml.indexOf('class="room-body');
          if(bStart>=0){
            const inner=rawHtml.indexOf('>',bStart)+1;
            const end  =rawHtml.lastIndexOf('</div>');
            body.innerHTML=end>inner?rawHtml.slice(inner,end):rawHtml;
          } else { body.innerHTML=rawHtml; }
        }
      }catch(e){
        body.innerHTML='<p style="padding:16px;color:#f87171">Lỗi render form: '+e.message+'</p>';
        console.warn('[Drawer render]',e);
      }
      App.state.hlRooms=saved;

      // ── FIX 1: Re-bind Header Buttons mỗi lần open ───────────────────
      // clone node để xóa toàn bộ listener cũ trước khi gán listener mới
      const reBindBtn=(id,fn)=>{
        const el=document.getElementById(id);
        if(!el) return;
        const clone=el.cloneNode(true);
        el.parentNode.replaceChild(clone,el);
        clone.addEventListener('click',fn);
      };
      reBindBtn('room-drawer-close-bd',  ()=>this.closeDrawer());
      reBindBtn('room-drawer-close-btn', ()=>this.closeDrawer());
      reBindBtn('room-drawer-calc',      ()=>this.calcDrawerRoom());
      reBindBtn('room-drawer-save',      ()=>this.saveAndCloseDrawer());

      // ── FIX 2: Bind Partition buttons trong drawer scope ─────────────
      // _bindPartitions không chạy tự động sau DOMParser inject
      this._bindDrawerPartitions(body, r);

      // ── FIX 3: Bind form fields (data-rf) + DOM sync on auto-fill ────
      this._bindDrawerForm(body, roomIdx);
      this._bindDrawerSpecial(body, r);
      this._updateStaleBanner(r);

      // KPI strip nếu đã tính
      this._updateDrawerKPI(r);

      // Slide-in animation
      drawer.style.display='block';
      setTimeout(()=>{ panel.style.transform='translateX(0)'; },10);
      document.body.style.overflow='hidden';

    },
    closeDrawer(){
      const drawer=document.getElementById('room-drawer');
      const panel=document.getElementById('room-drawer-panel');
      if(!drawer||!panel) return;
      panel.style.transform='translateX(100%)';
      setTimeout(()=>{ drawer.style.display='none'; document.body.style.overflow=''; }, 280);
      this._drawerRoomIdx=-1;
    },
    saveAndCloseDrawer(){
      this.save();
      App.ui.toast('ok','Đã lưu phòng');
      this.closeDrawer();
      this.render(); // Refresh room row để hiển thị kết quả mới
    },
    calcDrawerRoom(){
      const i=this._drawerRoomIdx; if(i<0) return;
      const r=this.R()[i]; if(!r) return;
      const cl=this.CL();
      const C=App.calc;
      try{
        const psyOut=C.calcPsychro(cl.tOut,cl.rhOut,cl.elevationM||0);
        const psyIn=C.calcPsychro(cl.tIn,cl.rhIn,cl.elevationM||0);
        const floorM2=this._calcArea(r);
        const volM3=floorM2*(parseFloat(r.H)||0);
        const airflow=C.calcBuildingTypeAirflow(r,cl);
        r._airflow=airflow;
        // FIX: báo cáo/xuất Excel/bảng nhánh ống gió đọc r._af (L_supply/L_fresh/L_return),
        // KHÔNG đọc r._airflow — nhưng nút "Tính" riêng từng phòng (hàm này) trước đây chỉ
        // set r._airflow, không set r._af. Chỉ "Tính toán tất cả" (recalc() toàn dự án) mới
        // set cả 2. Hậu quả: tính từng phòng riêng lẻ (như bạn đang làm) thì báo cáo luôn
        // hiện "Tổng gió tươi/gió cấp = 0 m³/h" dù từng phòng đã có Q_coil thật. Đồng bộ với
        // đúng logic recalc() đang dùng (dòng ~3582 trong file này) để 2 đường tính khớp nhau.
        r._af={
          L_supply:airflow.Q_supply, L_fresh:airflow.Q_fresh,
          L_return:airflow.Q_recirculation,
          warn:airflow.warnings?.find(w=>w.level==='red')?.msg||null
        };
        const _area=this._calcArea(r);
        const nPeople=parseInt(r.nPeople)||0;
        const uPan=this._getUwall(r);
        // Tính Q điện nội bộ từ thiết bị điện (phòng điện/control room)
        const Q_elec_kW=(r.elecDeviceRows||[]).reduce((s,d)=>{
          const preset=(App.data.ELEC_DEVICE_CATALOG||[]).find(p=>p.id===d.typeId)||{};
          const hF=preset.heatFactor||d.heatFactor||0.03;
          return s+((d.ratedKW||0)*(d.qty||1)*(d.loadFactor!=null?d.loadFactor:0.8)*hF);
        },0);
        const ev=C.calcEnvelopeLoad({uPanel:uPan,aWall:r.aWall||0,dtFactor:parseFloat(r.dtFactor||1),
          aGlass:r.aGlass||0,shgc:r.shgc||0.6,sc:r.sc||1,clf:r.clf||0.7,
          nPeople,laborLevel:r.laborLevel||App.data.peopleHeat[1].level,
          lpdApplied:r.lpdApplied||0,floorAreaM2:_area,dfLighting:0.9,
          lFreshM3h:airflow.Q_fresh,tOut:cl.tOut,tIn:cl.tIn,
          dOut:psyOut.dGperKg,dIn:psyIn.dGperKg,equipType:r.equipType||'AHU'});
        r._ev=ev;
        // FIX: phát hiện thêm khi xây bảng phân tích tải nhiệt trong báo cáo — nút "Tính"
        // riêng phòng này TRƯỚC ĐÂY cũng hoàn toàn bỏ sót tải Mái (Q_roof) và tải Sàn tiếp
        // đất (Q_floor), giống HỆT lỗi vách ngăn đã sửa — chỉ "Tính toán tất cả" mới cộng
        // đúng 2 khoản này (xem đoạn tương ứng trong recalc()). Đồng bộ lại tại đây.
        let Q_roof_W = 0;
        if(r.roofExposed && r.roofType){
          const roofAreaM2 = (r.roofArea&&r.roofArea>0) ? r.roofArea : _area;
          try{
            const rr = C.calcRoofCLTD({roofType:r.roofType, areaM2:roofAreaM2, tRoom:cl.tIn, tOutdoorMean:cl.tOut});
            Q_roof_W = rr.Q_W;
            r._ev.Q_roof = Q_roof_W;
          }catch(e){ r._ev.Q_roof = 0; }
        } else { r._ev.Q_roof = 0; }
        r._ev.Q_sensible += Q_roof_W;
        let Q_floor_W = 0;
        if(r.floorOnGround){
          const T_ground = parseFloat(r.groundTempC??28);
          const U_floor  = parseFloat(r.floorU||0.8);
          Q_floor_W = U_floor * _area * (T_ground - cl.tIn);
          r._ev.Q_floor = Q_floor_W;
        } else { r._ev.Q_floor = 0; }
        r._ev.Q_sensible += Q_floor_W;
        // FIX (Bước 3 — phát hiện thêm trong lúc thêm cảnh báo): nút "Tính" của riêng phòng
        // này TRƯỚC ĐÂY hoàn toàn bỏ sót tải vách ngăn nội bộ (Q_partition_W) — chỉ "Tính
        // toán tất cả" (recalc() toàn dự án) mới cộng đúng. Nghĩa là phòng có vách ngăn,
        // bấm Tính riêng sẽ ra kết quả THẤP HƠN thực tế so với bấm Tính toàn dự án — 2 nút
        // cho 2 kết quả khác nhau với cùng 1 phòng. Đã đồng bộ để cả 2 đường tính đều cộng
        // đúng tải vách ngăn, và cảnh báo nếu vách ngăn thiếu dữ liệu (U/T mặc định).
        let Q_partition_W = 0;
        if(r.partitionRows && r.partitionRows.length > 0){
          const partResult = C.calcPartitionLoad({
            partitions: r.partitionRows, tRoom: cl.tIn, allRooms: this.R()
          });
          Q_partition_W = partResult.Q_total_W;
          r._partitionDetails = partResult.details;
          r._partitionWarnings = partResult.warnings;
        } else {
          r._partitionDetails = [];
          r._partitionWarnings = [];
        }
        const coil=C.calcCoil({
          equipType:r.equipType||'AHU',
          Q_sens_room:ev.Q_sensible + Q_partition_W, Q_lat_room:ev.Q_latent,
          Q_motor_total:Q_elec_kW*1000, // W — tải điện nội bộ từ thiết bị VFD/tủ điện
          Q_parasitic_list:[],
          lSupplyM3h:airflow.Q_supply, lFreshM3h:airflow.Q_fresh,
          lReturnM3h:airflow.Q_recirculation,
          tOut:cl.tOut, hOut:psyOut.hKJperKg, dOut:psyOut.dGperKg,
          hIn:psyIn.hKJperKg, dIn:psyIn.dGperKg,
          tIn:cl.tIn, psyIn,
          tSupplyDesign:r.tSupplyDesign||14,
          rhSupplyDesign:r.rhSupplyDesign||90,
          espPa:r.espPa||400, elevationM:cl.elevationM||0
        });
        r._coil=coil;
        r._calcStale=false;
        // FIX (phát hiện khi rà soát toàn diện): nút "Tính" riêng phòng TRƯỚC ĐÂY không hề
        // set r._valid — chỉ "Tính toán tất cả" (recalc()) mới tính. Hậu quả NGHIÊM TRỌNG:
        // badge "Trạng thái" trong _updateDrawerKPI() đọc `r._valid?.status||'ok'` — khi
        // r._valid không tồn tại, LUÔN mặc định về 'ok' và hiện "✓ ĐẠT" MÀU XANH, bất kể
        // phòng có thật sự đạt hay không (ACH gió tươi không đủ, thiếu diện tích, ΔP cleanroom
        // sai...). Tức là mọi ảnh chụp "✓ ĐẠT" khi chỉ bấm Tính riêng từng phòng (cách dùng
        // phổ biến) đều KHÔNG đáng tin — badge chỉ đang hiện giá trị mặc định, không phải kết
        // quả kiểm tra thật. Đồng bộ đúng công thức recalc() đang dùng (flagParams + airflow
        // warnings → worstSev) để badge phản ánh đúng ngay cả khi chỉ tính riêng 1 phòng.
        const paramFlags=C.flagParams(r);
        const airwFlags=airflow.warnings||[];
        const allFlags=[...paramFlags,...airwFlags];
        const worstSev=allFlags.some(f=>f.severity==='error'||f.level==='red')?'red':
                       allFlags.some(f=>f.severity==='warn' ||f.level==='yellow')?'yellow':'pass';
        r._flags=allFlags;
        r._valid={status:worstSev,flags:allFlags.map(f=>({level:f.severity==='error'?'red':f.severity==='warn'?'yellow':'pass',msg:f.msg||f.code}))};
        this._updateDrawerKPI(r);
        const partWarnCount=(r._partitionWarnings||[]).length;
        App.ui.toast(worstSev!=='pass'?'warn':'ok',
          'Tính xong · Q_coil='+(coil.qCoilKW?.toFixed(2)||'?')+' kW'
          +(worstSev==='red'?` · ❌ ${allFlags.filter(f=>f.severity==='error'||f.level==='red').length} lỗi cần xử lý`:'')
          +(worstSev==='yellow'?` · ⚠ ${allFlags.filter(f=>f.severity==='warn'||f.level==='yellow').length} cảnh báo`:'')
          +(partWarnCount?` · ⚠ ${partWarnCount} cảnh báo vách ngăn (xem chi tiết trong panel Vách ngăn)`:''));
        this.save(); this.render();
        // FIX: đồng bộ khối preview Q_cấp/Q_tươi/Q_tuần hoàn/ACH thực ở CUỐI form —
        // khối đó đọc r._airflow tại thời điểm HTML được vẽ, không tự cập nhật khi
        // chỉ patch riêng KPI phía trên. Trước đây 2 khối lệch nhau: KPI trên cập
        // nhật ngay sau "Tính" nhưng khối dưới giữ nguyên giá trị cũ cho tới khi có
        // hành động khác (đổi loại phòng/phương pháp bù áp...) kích hoạt vẽ lại form
        // — khiến 2 nơi hiện 2 con số khác nhau dù cùng 1 phòng. Vẽ lại toàn bộ drawer
        // ngay sau khi tính để cả 2 khối luôn khớp nhau tức thì.
        this._reRenderDrawer();
      }catch(e){ App.ui.toast('err','Lỗi tính: '+e.message.slice(0,50)); }
    },
    _updateDrawerKPI(r){
      const kpi=document.getElementById('room-drawer-kpi');
      if(!kpi||!r._coil) return;
      kpi.style.display='block';
      const status=r._valid?.status||'ok';
      const sc={red:'color:#f87171',yellow:'color:#fbbf24',pass:'color:#34d399',ok:'color:#34d399'};
      document.getElementById('rd-kpi-coil').textContent=(r._coil?.qCoilKW?.toFixed(2)||'—')+' kW';
      document.getElementById('rd-kpi-supply').textContent=(r._af?.L_supply?.toFixed(0)||r._airflow?.Q_supply?.toFixed(0)||'—')+' m³/h';
      document.getElementById('rd-kpi-fresh').textContent=(r._af?.L_fresh?.toFixed(0)||r._airflow?.Q_fresh?.toFixed(0)||'—')+' m³/h';
      document.getElementById('rd-kpi-ach').textContent=(r._airflow?.ACH_actual?.toFixed(0)||'—')+' ACH';
      const statusEl=document.getElementById('rd-kpi-status');
      statusEl.style.cssText=sc[status]||sc.ok;
      statusEl.textContent=status==='red'?'❌ LỖI':status==='yellow'?'⚠ CẢNH BÁO':'✓ ĐẠT';
      this._updateStaleBanner(r);
    },
    // Hiện/ẩn cảnh báo "số liệu cũ, chưa tính lại" — gọi mỗi khi mở drawer, mỗi khi
    // 1 field thay đổi (đặt r._calcStale=true), và sau khi tính xong (r._calcStale=false)
    _updateStaleBanner(r){
      const el=document.getElementById('rd-kpi-stale');
      if(!el) return;
      el.style.display=(r._calcStale && r._coil) ? 'block' : 'none';
    },
    // FIXED: _bindDrawerPartitions — match đúng data attributes của form HTML
    _bindDrawerPartitions(body, r){
      if(!body||!r) return;
      const hl=this;

      // Thêm vách ngăn mới
      body.querySelectorAll('[data-add-partition]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          if(!r.partitionRows) r.partitionRows=[];
          r.partitionRows.push({
            id:'pt'+Date.now().toString(36),
            wallTypeId:'', uWall:0.45, areaM2:20,
            adjSource:'temp', adjTempC:35, adjRoomId:''
          });
          hl.save();
          hl._reRenderDrawer(); // setTimeout defer — fix WKWebView DOM mutation
        });
      });

      // Xóa vách ngăn — FIX: splice by INDEX (data-del-partition = pi index)
      body.querySelectorAll('[data-del-partition]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const pi=parseInt(btn.getAttribute('data-del-partition'));
          if(!r.partitionRows || isNaN(pi)) return;
          r.partitionRows.splice(pi,1); // FIX: index-based splice
          hl.save();
          hl._reRenderDrawer();
        });
      });

      // FIX: form HTML dùng data-part-f / data-part-idx (không phải data-part-field/id)
      body.querySelectorAll('[data-part-f]').forEach(el=>{
        el.addEventListener('change',()=>{
          const pi=parseInt(el.getAttribute('data-part-idx'));
          const fld=el.getAttribute('data-part-f');
          const p=r.partitionRows?.[pi];
          if(!p || !fld) return;
          p[fld]=el.type==='number'?(parseFloat(el.value)||0):el.value;
          if(fld==='adjSource'){
            hl.save(); hl._reRenderDrawer(); // re-render để show adjRoomId/adjTempC
          } else if(fld==='wallTypeId' && el.value){
            const wt=(App.data.WALL_TYPES||[]).find(w=>w.id===el.value);
            if(wt){ p.uWall=wt.U;
              const uEl=el.closest('[data-partition-idx]')?.querySelector('[data-part-f="uWall"]');
              if(uEl) uEl.value=wt.U;
            }
            hl.save();
          } else { hl.save(); }
        });
      });
    },

    // FIX F: Bind controls đặc biệt trong Drawer (DOMParser xóa listeners)
    _bindDrawerSpecial(body, r){
      if(!body||!r) return;
      const hl=this;

      // ── U-VALUE CALCULATOR ─────────────────────────────────────────
      const refreshU=()=>{
        if(!r.wallLayers?.length) return;
        try{
          const res=App.calc.calcULayered({layers:r.wallLayers, includeFilms:true});
          const el=body.querySelector('#ucalc-result-0');
          if(el&&res.U) el.textContent='U = '+res.U.toFixed(4)+' W/m²K  |  R = '+res.Rtotal.toFixed(4)+' m²K/W';
          if(el&&!res.U) el.textContent='U = — (chưa đủ dữ liệu, xem cảnh báo bên dưới)';
          // FIX (Bước 3): hiện warnings tính sẵn trong calcULayered() — trước đây bị bỏ phí
          const warnEl=body.querySelector('#ucalc-warnings-0');
          if(warnEl){
            warnEl.innerHTML=(res.warnings||[]).map(w=>
              `<div class="text-[10px] text-amber-400 flex items-start gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:1px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${w}</span></div>`
            ).join('');
          }
          // Per-layer R
          body.querySelectorAll('[data-ucalc-li]').forEach(row=>{
            const li=parseInt(row.getAttribute('data-ucalc-li'));
            const lyr=r.wallLayers?.[li];
            const mat=(App.data.CONSTRUCTION_MATERIALS||[]).find(m=>m.id===lyr?.materialId);
            const rEl=row.querySelector('[data-ucalc-r="'+li+'"]');
            if(rEl&&mat&&lyr){
              const R=mat.Rfixed!=null?mat.Rfixed:(mat.lambda&&lyr.thicknessMm?(lyr.thicknessMm/1000/mat.lambda):0);
              rEl.textContent='R='+R.toFixed(4);
            }
          });
        }catch(e){}
      };
      // Thêm lớp vật liệu
      body.querySelectorAll('[data-ucalc-add]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          if(!r.wallLayers) r.wallLayers=[];
          r.wallLayers.push({materialId:'mortar_cement',thicknessMm:15});
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // Xóa lớp vật liệu
      body.querySelectorAll('[data-ucalc-del]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const li=parseInt(btn.getAttribute('data-ucalc-del'));
          if(r.wallLayers) r.wallLayers.splice(li,1);
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // Thay đổi field lớp vật liệu → cập nhật R tức thì
      body.querySelectorAll('[data-ucalc-f]').forEach(el=>{
        ['change','input'].forEach(evt=>el.addEventListener(evt,()=>{
          const f=el.getAttribute('data-ucalc-f');
          const li=parseInt(el.closest('[data-ucalc-li]')?.getAttribute('data-ucalc-li'));
          if(r.wallLayers?.[li]!=null){
            r.wallLayers[li][f]=el.type==='number'?(parseFloat(el.value)||0):el.value;
            if(evt==='change'){ r._calcStale=true; hl.save(); hl._updateStaleBanner(r); }
            refreshU();
          }
        }));
      });
      // Áp dụng U vào phòng
      body.querySelectorAll('[data-ucalc-apply]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          if(!r.wallLayers?.length){ App.ui.toast('warn','Thêm ít nhất 1 lớp vật liệu'); return; }
          try{
            const res=App.calc.calcULayered({layers:r.wallLayers, includeFilms:true});
            if(res.U){
              r.uWall=parseFloat(res.U.toFixed(4));
              r.wallTypeId='';
              const uEl=body.querySelector('[data-rf="uWall"]');
              if(uEl) uEl.value=r.uWall;
              r._calcStale=true; hl.save(); hl._updateStaleBanner(r);
              // FIX (Bước 3): nếu calcULayered() có cảnh báo (lớp bị bỏ qua, U bất thường...)
              // thì báo rõ trong toast luôn — trước đây áp dụng U vẫn "thành công" dù 1 lớp
              // đã bị âm thầm loại khỏi phép tính, người dùng không biết để sửa lại.
              if(res.warnings?.length){
                App.ui.toast('warn','Đã áp U = '+res.U.toFixed(4)+' W/m²K — NHƯNG có '+res.warnings.length+' cảnh báo, xem chi tiết trong bảng lớp vật liệu');
              } else {
                App.ui.toast('ok','Đã áp U = '+res.U.toFixed(4)+' W/m²K');
              }
            } else {
              App.ui.toast('err','Không tính được U — kiểm tra cảnh báo trong bảng lớp vật liệu (thiếu vật liệu hoặc độ dày)');
            }
          }catch(err){ App.ui.toast('err','Lỗi tính U: '+err.message); }
        });
      });
      refreshU(); // Initial display

      // ── DOOR ROWS (Bù áp dương) ────────────────────────────────────
      // Thêm cửa mới
      body.querySelectorAll('[data-add-door]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          if(!r.doorRows) r.doorRows=[];
          r.doorRows.push({doorCode:'D900x2100-STD', qty:1});
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // Xóa cửa
      body.querySelectorAll('[data-del-door]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const di=parseInt(btn.getAttribute('data-del-door'));
          if(r.doorRows) r.doorRows.splice(di,1);
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // Thay đổi door field
      body.querySelectorAll('[data-drow]').forEach(el=>{
        el.addEventListener('change',()=>{
          const f=el.getAttribute('data-drow');
          const di=parseInt(el.closest('[data-di]')?.getAttribute('data-di'));
          if(r.doorRows?.[di]!=null){
            r.doorRows[di][f]=el.type==='number'?(parseFloat(el.value)||1):el.value;
            r._calcStale=true; hl.save(); hl._updateStaleBanner(r);
          }
        });
      });

      // ── ELECTRICAL DEVICE ROWS (phòng điện/control) ─────────────────
      // Thêm thiết bị điện
      body.querySelectorAll('[data-add-elec]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          if(!r.elecDeviceRows) r.elecDeviceRows=[];
          r.elecDeviceRows.push({
            name:'Thiết bị mới', typeId:'vfd_low',
            ratedKW:15, qty:1, loadFactor:0.8, heatFactor:0.04
          });
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // Xóa thiết bị điện
      body.querySelectorAll('[data-del-elec]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const di=parseInt(btn.getAttribute('data-del-elec'));
          if(r.elecDeviceRows) r.elecDeviceRows.splice(di,1);
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // Thay đổi field thiết bị điện
      body.querySelectorAll('[data-elec]').forEach(el=>{
        el.addEventListener('change',()=>{
          const f=el.getAttribute('data-elec');
          const di=parseInt(el.getAttribute('data-di'));
          if(!r.elecDeviceRows?.[di]) return;
          const dev=r.elecDeviceRows[di];
          // Nếu chọn preset typeId → auto-fill heatFactor + ratedKW
          if(f==='typeId'){
            const preset=(App.data.ELEC_DEVICE_CATALOG||[]).find(p=>p.id===el.value);
            if(preset){
              dev.typeId=el.value;
              dev.heatFactor=preset.heatFactor;
              dev.name=dev.name==='Thiết bị mới'?preset.name:dev.name;
              if(!dev.ratedKW||dev.ratedKW===15) dev.ratedKW=preset.ratedKWDefault||dev.ratedKW;
              // Cập nhật DOM
              const row=body.querySelector('[data-edi="'+di+'"]')||el.closest('tr');
              const nameEl=row?.querySelector('[data-elec="name"]');
              const kWEl=row?.querySelector('[data-elec="ratedKW"]');
              if(nameEl&&dev.name==='Thiết bị mới') nameEl.value=preset.name;
              if(kWEl&&preset.ratedKWDefault) kWEl.value=preset.ratedKWDefault;
            }
          } else {
            dev[f]=el.type==='number'?(parseFloat(el.value)||0):el.value;
          }
          r._calcStale=true; hl.save(); hl._updateStaleBanner(r);
          // Cập nhật Q hiển thị ngay
          const preset=(App.data.ELEC_DEVICE_CATALOG||[]).find(p=>p.id===dev.typeId)||{};
          const hF=preset.heatFactor||dev.heatFactor||0.03;
          const q=((dev.ratedKW||0)*(dev.qty||1)*(dev.loadFactor!=null?dev.loadFactor:0.8)*hF);
          const qCell=el.closest('tr')?.querySelector('td:nth-child(6)');
          if(qCell) qCell.textContent=q.toFixed(3)+' kW';
        });
      });

      // ── ROOM SHAPE → cập nhật labels và area ngay ──────────────────
      const shapeSelect=body.querySelector('[data-rf="roomShape"]');
      if(shapeSelect){
        shapeSelect.addEventListener('change',()=>{
          r.roomShape=shapeSelect.value;
          r._calcStale=true; hl.save();
          // Re-render drawer để cập nhật ngay (shape ảnh hưởng nhiều field)
          hl._reRenderDrawer();
        });
      }

      // ── CLEANROOM STANDARD → filter class codes + update ACH/ΔP ───
      const stdSelect=body.querySelector('[data-rf="classSystem"]');
      if(stdSelect){
        stdSelect.addEventListener('change',()=>{
          r.classSystem=stdSelect.value;
          r.classCode=''; // reset class code
          // Re-render để hiện options mới
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      }
      // Class code → auto-fill ACH + ΔP
      const codeSelect=body.querySelector('[data-rf="classCode"]');
      if(codeSelect){
        codeSelect.addEventListener('change',()=>{
          r.classCode=codeSelect.value;
          const std=(App.data.cleanroomStandards||[]).find(s=>s.system===r.classSystem&&s.code===r.classCode);
          if(std){
            r.achApplied=std.achMin||std.ach||20;
            r.deltaPPa=std.deltaPPa||10;
            const achEl=body.querySelector('[data-rf="achApplied"]');
            const dpEl=body.querySelector('[data-rf="deltaPPa"]');
            if(achEl) achEl.value=r.achApplied;
            if(dpEl)  dpEl.value=r.deltaPPa;
            App.ui.toast('ok','ACH='+r.achApplied+' · ΔP='+r.deltaPPa+'Pa từ '+r.classSystem+' '+r.classCode);
          }
          r._calcStale=true; hl.save(); hl._updateStaleBanner(r);
        });
      }

      // ── PHƯƠNG PHÁP BÙ ÁP DƯƠNG (ACH vs khe cửa) → đổi hẳn panel input,
      // cần render lại toàn bộ chứ không chỉ đổi giá trị (giống roomShape/
      // classSystem ở trên) — đây là bug người dùng báo: chọn radio khác
      // nhưng panel không đổi vì trước đây field này không có listener nào
      // kích hoạt render lại, chỉ có ở bản danh sách chính (main list) ──
      body.querySelectorAll('[data-rf="pressMethod"]').forEach(el=>{
        el.addEventListener('change',()=>{
          if(!el.checked) return; // radio: chỉ xử lý khi option này được chọn
          r.pressMethod=el.value;
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      // ── Mái tiếp xúc trực tiếp / Sàn tiếp đất → hiện/ẩn panel con ──────
      const roofChk=body.querySelector('[data-rf="roofExposed"]');
      if(roofChk){
        roofChk.addEventListener('change',()=>{
          r.roofExposed=roofChk.checked;
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      }
      const floorChk=body.querySelector('[data-rf="floorOnGround"]');
      if(floorChk){
        floorChk.addEventListener('change',()=>{
          r.floorOnGround=floorChk.checked;
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      }
      // ── Data Center profile → auto-fill itLoadKWM2 rồi render lại ─────
      const dcSelect=body.querySelector('[data-rf="dcProfile"]');
      if(dcSelect){
        dcSelect.addEventListener('change',()=>{
          r.dcProfile=dcSelect.value;
          if(dcSelect.value){
            const dp=(App.data.DC_RACK_PROFILES||[]).find(p=>p.id===dcSelect.value);
            if(dp) r.itLoadKWM2=dp.itKWPerRack/10;
          }
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      }
      // ── Gió thải cục bộ từ thiết bị → hiện/ẩn panel con + thêm/xóa thiết bị ──
      const leqChk=body.querySelector('[data-rf="hasLocalExhaustEquip"]');
      if(leqChk){
        leqChk.addEventListener('change',()=>{
          r.hasLocalExhaustEquip=leqChk.checked;
          if(leqChk.checked && !(r.localExhaustRows||[]).length) r.localExhaustRows=[{name:'',qPerUnitM3h:0,qty:1}];
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      }
      body.querySelectorAll('[data-leq-add]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          r.localExhaustRows=r.localExhaustRows||[];
          r.localExhaustRows.push({name:'',qPerUnitM3h:0,qty:1});
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      body.querySelectorAll('[data-leq-del]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const idx=parseInt(btn.getAttribute('data-leq-del'));
          r.localExhaustRows.splice(idx,1);
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      body.querySelectorAll('[data-leq]').forEach(el=>{
        el.addEventListener('change',()=>{
          const field=el.getAttribute('data-leq');
          const row=el.closest('[data-leq-idx]');
          const idx=parseInt(row.getAttribute('data-leq-idx'));
          if(!r.localExhaustRows?.[idx]) return;
          r.localExhaustRows[idx][field]=(field==='name')?el.value:(parseFloat(el.value)||0);
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      });
      const leqTreatedSel=body.querySelector('[data-rf="localExhaustTreated"]');
      if(leqTreatedSel){
        leqTreatedSel.addEventListener('change',()=>{
          r.localExhaustTreated=leqTreatedSel.value;
          r._calcStale=true; hl.save(); hl._reRenderDrawer();
        });
      }
    },

    _bindDrawerForm(body, roomIdx){
      const r=this.R()[roomIdx]; if(!r) return;
      // Bind data-rf fields
      body.querySelectorAll('[data-rf],[data-rf-bt]').forEach(el=>{
        const f=el.getAttribute('data-rf')||el.getAttribute('data-rf-bt');
        if(!f) return;
        const evt=el.tagName==='SELECT'?'change':'change';
        el.addEventListener(evt,()=>{
          const val=el.type==='number'?(parseFloat(el.value)||0):
                    el.type==='checkbox'?el.checked:el.value;
          r[f]=val;
          // Đánh dấu kết quả tính toán (Q_cấp/Q_tươi/ACH/Q_coil) đã CŨ so với input hiện
          // tại — trừ field 'name' (không ảnh hưởng vật lý). Xóa cờ này trong
          // calcDrawerRoom() sau khi tính lại. Mục đích: người dùng luôn biết chắc số
          // đang thấy có phản ánh đúng input hiện tại hay chưa, tránh nhầm giữa số cũ
          // và số mới khi 2 khối hiển thị (KPI trên + preview dưới) không đồng bộ cùng lúc.
          if(f!=='name') r._calcStale=true;
          this._updateStaleBanner(r);
          // ── FIX 3: Auto-fill STATE → full re-render drawer ────────────────
          // buildingType: auto-fill preset values rồi render lại toàn bộ form
          // (không dùng domSync từng field riêng lẻ nữa — cách cũ để sót badge
          // thông tin phòng + panel B (dropdown ISO/GMP) không cập nhật ngay
          // khi đổi loại phòng, phải đợi field khác kích hoạt render mới thấy đúng)
          if(f==='buildingType'){
            const bt=(App.data.BUILDING_TYPES||[]).find(b=>b.id===val);
            if(bt){
              if(bt.achDefault!=null)  r.achApplied=bt.achDefault;
              if(bt.deltaPPa!=null)    r.deltaPPa=bt.deltaPPa;
              if(bt.lightingWM2)       r.lpdApplied=bt.lightingWM2;
              if(bt.freshAirLsP)       r.freshAirPerPersonLs=bt.freshAirLsP;
              // Auto-fill T phòng thiết kế theo loại công trình (ASHRAE Handbook)
              if(bt.tInDesign!=null)   r.tIn=bt.tInDesign;
              if(bt.rhInDesign!=null)  r.rhIn=bt.rhInDesign;
              // Auto-fill số người từ tiêu chuẩn nếu chưa nhập
              if(bt.occupancyM2PerPerson && r.L && r.W){
                const suggestedPeople=Math.round((r.L*r.W)/bt.occupancyM2PerPerson);
                if(suggestedPeople>0) r.nPeople=suggestedPeople;
              }
              // Phòng thuộc standardModule 'cleanroom': set classSystem nếu chưa đặt
              if(bt.standardModule==='cleanroom'&&(!r.classSystem||r.classSystem==='GENERAL')){
                r.classSystem='ISO';
                if(!r.classCode) r.classCode='ISO 7';
              }
            }
            // Render lại toàn bộ drawer body (badge thông tin phòng, panel B
            // ISO/GMP, subtitle, mọi input auto-fill) — đồng bộ tuyệt đối với
            // dữ liệu vừa chọn, không cần đợi field khác kích hoạt
            this.save();
            this._reRenderDrawer();
            return;
          }
          // wallTypeId: auto-fill U value → cập nhật DOM
          if(f==='wallTypeId'&&val){
            const wt=(App.data.WALL_TYPES||[]).find(w=>w.id===val);
            if(wt){
              r.uWall=wt.U;
              const uInp=body.querySelector('[data-rf="uWall"]');
              if(uInp) uInp.value=wt.U;
            }
          }
          // glassTypeId: auto-fill SHGC + U → cập nhật DOM + preview header
          if(f==='glassTypeId'&&val){
            const gt=(App.data.GLASS_CATALOG||[]).find(g=>g.id===val);
            if(gt){
              r.shgc=gt.SHGC; r.glassU=gt.U;
              const shgcEl=body.querySelector('[data-rf="shgc"]');
              const guEl  =body.querySelector('[data-rf="glassU"]');
              if(shgcEl) shgcEl.value=gt.SHGC;
              if(guEl)   guEl.value  =gt.U;
              this._updateRoomVolDisplay(body, 0, r);
            }
          }
          // aGlass/shgc gõ tay (không qua glassTypeId) → cập nhật preview header ngay
          if((f==='aGlass'||f==='shgc')) this._updateRoomVolDisplay(body, 0, r);
          // L/W/H/customAreaM2 → cập nhật V/S ngay (roomShape đã có listener riêng full
          // re-render ở _bindDrawerSpecial vì ảnh hưởng nhiều panel con, không chỉ V/S)
          if(['L','W','H','customAreaM2'].includes(f)) this._updateRoomVolDisplay(body, 0, r);
          // equipType: đổi loại hệ thống ĐHKK → nhóm thiết bị (groupId) cũ có thể không còn
          // hợp lệ (vd phòng đổi từ AHU sang FCU nhưng vẫn giữ groupId của 1 nhóm AHU) → tự
          // gỡ gán nếu không còn tương thích, rồi render lại để dropdown nhóm lọc đúng ngay
          if(f==='equipType'){
            if(r.groupId){
              const curGroup=this.G().find(g=>g.id===r.groupId);
              const stillOk = curGroup && curGroup.equipType===val;
              if(!stillOk){ r.groupId=''; App.ui.toast('warn','Đã gỡ khỏi nhóm thiết bị cũ vì không còn khớp loại hệ thống "'+val+'"'); }
            }
            this.save();
            this._reRenderDrawer();
            return;
          }
          // name: cập nhật drawer header title ngay
          if(f==='name'){
            const titleEl=document.getElementById('room-drawer-title');
            if(titleEl) titleEl.textContent=val||'Phòng chưa đặt tên';
          }
        });
      });
      // Delete button
      body.querySelectorAll('[data-rdel]').forEach(btn=>{
        const ri=parseInt(btn.getAttribute('data-rdel'));
        btn.addEventListener('click',()=>{
          App.state.hlRooms.splice(ri,1);
          this.closeDrawer();
          this.save(); this.render();
        });
      });
      // ── Instant volume/preview update khi gõ L/W/H/diện tích kính (mượt hơn
      // là chờ blur/'change') — cùng hàm _updateRoomVolDisplay dùng cho main list
      body.querySelectorAll('[data-rf="L"],[data-rf="W"],[data-rf="H"],[data-rf="customAreaM2"],[data-rf="aGlass"],[data-rf="shgc"]').forEach(el=>{
        el.addEventListener('input',()=>{
          const f=el.getAttribute('data-rf');
          r[f]=parseFloat(el.value)||0;
          this._updateRoomVolDisplay(body, 0, r);
        });
      });
    },

    _bindFloors(root){
      if(!root) return;
      // Xóa phòng
      root.querySelectorAll('[data-del-room]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const idx=parseInt(btn.getAttribute('data-del-room'));
          const r=this.R()[idx]; if(!r) return;
          App.ui.showConfirm('Xóa phòng "'+( r.name||'này')+'"?','Không thể hoàn tác.','Xóa phòng',()=>{
            this.R().splice(idx,1); this.save(); this.render();
          });
        });
      });
      // Copy phòng
      root.querySelectorAll('[data-copy-room]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const idx=parseInt(btn.getAttribute('data-copy-room'));
          const src=this.R()[idx]; if(!src) return;
          const copy=JSON.parse(JSON.stringify(src));
          copy.id=this.uid(); copy.name=(src.name||'Phòng')+' (copy)';
          delete copy._coil; delete copy._ev; delete copy._airflow;
          delete copy._af; delete copy._valid; delete copy._flags;
          this.R().splice(idx+1,0,copy); this.save(); this.render();
          App.ui.toast('ok','Đã copy: '+copy.name);
        });
      });
      // Mở room drawer khi click vào room row (event delegation thay inline onclick)
      root.querySelectorAll('[data-open-room]').forEach(el=>{
        el.addEventListener('click', ()=>{
          try{
            const idx=parseInt(el.getAttribute('data-open-room'));
            this.openDrawer(idx);
          }catch(e){
            console.warn('[MultiHVAC] openDrawer error:',e.message);
            App.ui.toast('err','Lỗi mở form phòng: '+e.message.slice(0,50));
          }
        });
      });
      // Copy tầng
      root.querySelectorAll('[data-copy-floor]').forEach(btn=>{
        btn.addEventListener('click', e=>{ e.stopPropagation();
          const srcFid=btn.getAttribute('data-copy-floor');
          const srcFloor=this.FL().find(f=>f.id===srcFid); if(!srcFloor) return;
          const newFloor={id:'fl'+Date.now().toString(36),
            name:srcFloor.name+' (copy)',order:Math.max(0,...this.FL().map(f=>f.order||0))+1};
          this.FL().push(newFloor);
          const srcRooms=this.R().filter(r=>r.floorId===srcFid);
          srcRooms.forEach(src=>{
            const copy=JSON.parse(JSON.stringify(src));
            copy.id=this.uid(); copy.floorId=newFloor.id;
            delete copy._coil; delete copy._ev; delete copy._airflow;
            delete copy._af; delete copy._valid; delete copy._flags;
            this.R().push(copy);
          });
          this.save(); this.render();
          App.ui.toast('ok','Đã copy '+srcFloor.name+' ('+srcRooms.length+' phòng)');
        });
      });
      // Thêm phòng vào tầng cụ thể
      root.querySelectorAll('[data-add-room-floor]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          this.addRoomToFloor(btn.getAttribute('data-add-room-floor'));
        });
      });
      // Xóa tầng
      root.querySelectorAll('[data-del-floor]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          const fid=btn.getAttribute('data-del-floor');
          const fname=this.FL().find(f=>f.id===fid)?.name||'tầng này';
          App.ui.showConfirm('Xóa '+fname+'?','Toàn bộ phòng thuộc tầng này cũng bị xóa.','Xóa tầng & phòng',()=>this.deleteFloor(fid));
        });
      });
      // Thêm tầng mới
      root.querySelector('#btn-add-floor')?.addEventListener('click',()=>this.addFloor());
      // Đổi tên tầng (blur)
      root.querySelectorAll('[data-floor-rename]').forEach(inp=>{
        inp.addEventListener('blur',()=>{
          const fid=inp.getAttribute('data-floor-rename');
          const f=this.FL().find(x=>x.id===fid);
          if(f&&inp.value.trim()){ f.name=inp.value.trim(); this.save(); }
        });
        inp.addEventListener('keydown',e=>{ if(e.key==='Enter') inp.blur(); });
        inp.addEventListener('click',e=>e.stopPropagation());
      });
      // Room rows now open drawer — no inline expand/collapse needed
    },

    // ── Bind events ──────────────────────────────────────────────────────────
    _bindClimate(root){
      root.querySelectorAll('[data-cf]').forEach(el=>{
        if(el.getAttribute('data-cf')==='provinceId'){
          el.addEventListener('change',()=>{
            const c=(App.data.climateSample||[]).find(x=>x.province===el.value);
            if(c){
              App.state.hlClimate.provinceId=el.value;
              App.state.hlClimate.tOut=c.tv;
              App.state.hlClimate.rhOut=c.rh;
              const tEl=root.querySelector('[data-cf="tOut"]');
              const rEl=root.querySelector('[data-cf="rhOut"]');
              if(tEl) tEl.value=c.tv;
              if(rEl) rEl.value=c.rh;
              App.admin.autoSave(); App.ui.heatload.render();
            } else { App.state.hlClimate.provinceId=''; App.admin.autoSave(); }
          });
          return;
        }
        el.addEventListener('change',()=>{
          const f=el.getAttribute('data-cf');
          this.CL()[f]=parseFloat(el.value);
          this.save(); this.render();
        });
      });
    },

    _bindGroups(root){
      root.querySelector('#hl-add-group')?.addEventListener('click',()=>{
        this.G().push({id:this.uid(),name:'AHU-'+(this.G().length+1),equipType:'AHU',description:''});
        this.save(); this.render();
      });
      root.querySelectorAll('[data-gdel]').forEach(b=>b.addEventListener('click',()=>{
        const i=parseInt(b.getAttribute('data-gdel'));
        const gid = this.G()[i]?.id;
        this.G().splice(i,1);
        this.R().forEach(r=>{ if(r.groupId===gid) r.groupId=null; });
        this.save(); this.render();
      }));
      root.querySelectorAll('[data-gi]').forEach(row=>{
        const i=parseInt(row.getAttribute('data-gi'));
        row.querySelectorAll('[data-gf]').forEach(el=>el.addEventListener('change',()=>{
          const f=el.getAttribute('data-gf');
          const g=this.G()[i];
          if(!g) return;
          // FIX (lỗi thật đã xác nhận): nút tạo nhóm luôn mặc định equipType='AHU' + tên tự
          // sinh 'AHU-N' — nếu người dùng đổi TÊN thành có chữ "FCU" (vd "FCU-Tầng1") nhưng
          // QUÊN đổi luôn ô dropdown loại hệ thống, nhóm vẫn là AHU về bản chất dù tên gọi
          // khác. Hậu quả: (1) phòng FCU không tìm thấy nhóm này khi lọc theo equipType,
          // (2) lọc theo "AHU" vẫn thấy nhóm tên "FCU..." xuất hiện — đúng 2 hiện tượng đã
          // xác nhận qua phản ánh thực tế. Khi đổi ô equipType, TỰ ĐỘNG đổi luôn tên nếu tên
          // hiện tại vẫn đang là dạng tự sinh theo loại cũ (vd "AHU-2") — giữ tên/loại luôn
          // khớp nhau cho người dùng không tự đặt tên riêng. Nếu người dùng đã tự đặt tên
          // khác, không đụng vào (tôn trọng lựa chọn của họ), nhưng sẽ có cảnh báo bên dưới.
          if(f==='equipType'){
            const oldType=g.equipType;
            const autoNamePattern=new RegExp('^'+oldType+'-[0-9]+$');
            if(autoNamePattern.test(g.name||'')){
              g.name = el.value+'-'+(g.name.match(/\d+$/)?.[0]||(i+1));
            }
          }
          g[f]=el.value;
          this.save(); this.render();
        }));
      });
    },

    _bindRooms(root){
      // ── Accordion toggle — cập nhật _expandedIds ──────────────────────────
      root.querySelectorAll('.room-hd').forEach(hd=>{
        hd.addEventListener('click',e=>{
          if(e.target.closest('button')) return;
          const container=hd.closest('[data-ri]');
          const i=parseInt(container?.getAttribute('data-ri'));
          const body=container?.querySelector('.room-body');
          const chev=hd.querySelector('.room-chev');
          body?.classList.toggle('hidden');
          if(chev) chev.style.transform=body?.classList.contains('hidden')?'':'rotate(90deg)';
          // Ghi nhớ trạng thái
          const rid=this.R()[i]?.id;
          if(rid){
            if(body?.classList.contains('hidden')) this._getExpandedIds().delete(rid);
            else this._getExpandedIds().add(rid);
          }
          if(window.lucide) lucide.createIcons();
        });
      });

      // ── Duplicate ─────────────────────────────────────────────────────────
      root.querySelectorAll('[data-ri-dup]').forEach(b=>{
        b.addEventListener('click',e=>{
          e.stopPropagation();
          const i=parseInt(b.getAttribute('data-ri-dup'));
          const copy=JSON.parse(JSON.stringify(this.R()[i]));
          copy.id=this.uid(); copy.name=(copy.name||'Phòng')+' (copy)';
          delete copy._af; delete copy._ev; delete copy._coil; delete copy._airflow;
          this.R().splice(i+1,0,copy); this.save(); this.render();
        });
      });

      // ── Delete ───────────────────────────────────────────────────────────
      root.querySelectorAll('[data-ri-del]').forEach(b=>{
        b.addEventListener('click',e=>{
          e.stopPropagation();
          const rid=this.R()[parseInt(b.getAttribute('data-ri-del'))]?.id;
          this.R().splice(parseInt(b.getAttribute('data-ri-del')),1);
          if(rid) this._getExpandedIds().delete(rid);
          this.save(); this.render();
        });
      });

      // ── Room field changes ────────────────────────────────────────────────
      root.querySelectorAll('[data-ri]').forEach(row=>{
        const i=parseInt(row.getAttribute('data-ri'));
        const r=this.R()[i]; if(!r) return;

        // data-rf fields — save only, no re-render (trừ các field cần re-render)
        const RERENDER_FIELDS=['equipType','classSystem','pressMethod','roomShape',
          'buildingType','roofExposed','floorOnGround','dcProfile'];

        // ── Auto-fill khi chọn loại công trình (buildingType) ─────────────
        row.querySelectorAll('[data-rf-bt]').forEach(el=>{
          el.addEventListener('change',()=>{
            const rid=i; if(!this.R()[rid]) return;
            const btId=el.value;
            this.R()[rid].buildingType=btId;
            const bt=(App.data.BUILDING_TYPES||[]).find(b=>b.id===btId);
            if(bt){
              // Auto-fill ACH
              if(bt.achDefault!=null) this.R()[rid].achApplied=bt.achDefault;
              // Auto-fill ΔP
              if(bt.deltaPPa!=null) this.R()[rid].deltaPPa=bt.deltaPPa;
              // Auto-fill LPD đèn
              if(bt.lightingWM2) this.R()[rid].lpdApplied=bt.lightingWM2;
              // Auto-fill gió tươi per người
              if(bt.freshAirLsP) this.R()[rid].freshAirPerPersonLs=bt.freshAirLsP;
              // Auto-fill equipType dựa vào systemRec
              const rec=bt.systemRec||'';
              if(bt.category==='sanitary') this.R()[rid].equipType='VENT';
              else if(rec.includes('AHU')) this.R()[rid].equipType='AHU';
              else if(rec.includes('PAU')) this.R()[rid].equipType='PAU';
              else if(rec.includes('FCU')) this.R()[rid].equipType='FCU';
              else if(bt.category==='industrial'||bt.category==='food_industrial') this.R()[rid].equipType='VENT';
              // Auto-fill pressACH
              if(bt.pressACHMin) this.R()[rid].pressACH=bt.pressACHMin;
              // Phòng thuộc standardModule 'cleanroom' → mặc định chọn hệ ISO
              // (tổng quát hoá theo bt.standardModule thay vì hardcode theo id,
              // để mở rộng thêm standardModule khác sau này không cần sửa đây)
              if(bt.standardModule==='cleanroom'){
                this.R()[rid].classSystem='ISO';
                if(!this.R()[rid].classCode) this.R()[rid].classCode='ISO 7';
              }
              // Bệnh viện phòng mổ → áp dương + AHU
              if(btId==='hospital_or'){ this.R()[rid].equipType='AHU'; }
              // Phòng cách ly → áp âm
              if(btId==='hospital_isolation'){ this.R()[rid].equipType='AHU'; }
              // DC → equipType=AHU chuyên biệt
              if(btId==='datacenter'||btId==='server_room'){ this.R()[rid].equipType='AHU'; }
            }
            this.save(); this.render();
          });
        });
        row.querySelectorAll('[data-rf]').forEach(el=>{
          el.addEventListener('change',()=>{
            const f=el.getAttribute('data-rf');
            if(!this.R()[i]) return;
            // FIX: đảm bảo nPeople là số nguyên, không để NaN
            let val;
            if(el.type==='number') val = parseFloat(el.value);
            else if(el.type==='checkbox') val = el.checked;
            else val = el.value;
            if(el.type==='number' && isNaN(val)) val=0;
            this.R()[i][f]=val;
            // wallTypeId → tự điền U từ WALL_TYPES
            if(f==='wallTypeId'&&el.value){
              const wt=(App.data.WALL_TYPES||[]).find(w=>w.id===el.value);
              if(wt) this.R()[i].uWall=wt.U;
            }
            // glassTypeId → tự điền SHGC + U kính
            if(f==='glassTypeId'&&el.value){
              const gt=(App.data.GLASS_CATALOG||[]).find(g=>g.id===el.value);
              if(gt){ this.R()[i].shgc=gt.SHGC; this.R()[i].glassU=gt.U; }
            }
            // dcProfile → tự điền itLoadKWM2
            if(f==='dcProfile'&&el.value){
              const dp=(App.data.DC_RACK_PROFILES||[]).find(p=>p.id===el.value);
              if(dp) this.R()[i].itLoadKWM2=dp.itKWPerRack/10; // kW/rack → kW/m² (10 rack/100m² estimate)
            }
            // equipType → gỡ groupId nếu nhóm thiết bị cũ không còn khớp loại hệ thống mới
            // (nhóm AHU chỉ hợp lệ cho phòng AHU, v.v. — xem groupOpts filter trong _roomsHtml)
            if(f==='equipType'&&this.R()[i].groupId){
              const curGroup=this.G().find(g=>g.id===this.R()[i].groupId);
              const stillOk = curGroup && curGroup.equipType===val;
              if(!stillOk){ this.R()[i].groupId=''; App.ui.toast('warn','Đã gỡ khỏi nhóm thiết bị cũ vì không còn khớp loại hệ thống "'+val+'"'); }
            }
            this.save();
            if(RERENDER_FIELDS.includes(f)) this.render();
            else this._updateRoomVolDisplay(row, i);
          });
        });

        // ── Instant volume update khi nhập L/W/H/diện tích kính ─────────────
        row.querySelectorAll('[data-live-dim], [data-rf="L"],[data-rf="W"],[data-rf="H"],[data-rf="customAreaM2"],[data-rf="aGlass"],[data-rf="shgc"]').forEach(el=>{
          el.addEventListener('input',()=>{
            const f=el.getAttribute('data-rf')||el.getAttribute('data-live-dim');
            if(!this.R()[i]) return;
            const val=parseFloat(el.value)||0;
            this.R()[i][f]=val;
            this._updateRoomVolDisplay(row, i);
          });
        });

        // Auto-fill ACH/ΔP khi chọn classCode
        row.querySelectorAll('[data-rf-autofill]').forEach(el=>{
          el.addEventListener('change',()=>{
            const f=el.getAttribute('data-rf-autofill');
            if(!this.R()[i]) return;
            this.R()[i][f]=el.value;
            const std=this.getStd(this.R()[i].classSystem, el.value);
            if(std){
              if(std.achDefault!=null)   this.R()[i].achApplied=std.achDefault;
              if(std.deltaPMinPa!=null)  this.R()[i].deltaPPa=std.deltaPMinPa;
              if(std.pressACHMin!=null)  this.R()[i].pressACH=std.pressACHMin;
              if(std.freshAirPerPersonLs) this.R()[i].freshAirPerPersonLs=std.freshAirPerPersonLs;
              if(std.velMin)             this.R()[i].uniVelocityMs=(std.velMin+std.velMax)/2;
            }
            this.save(); this.render(); // re-render để cập nhật hint text
          });
        });

        // Door rows
        row.querySelectorAll('[data-add-door]').forEach(btn=>{
          btn.addEventListener('click',()=>{
            if(!this.R()[i].doorRows) this.R()[i].doorRows=[];
            this.R()[i].doorRows.push({doorCode:'D900x2100-STD',qty:1});
            this.save(); this.render();
          });
        });
        const doorContainer=row.querySelector(`#door-rows-${i}`);
        if(doorContainer){
          doorContainer.querySelectorAll('[data-di]').forEach(drow=>{
            const di=parseInt(drow.getAttribute('data-di'));
            drow.querySelectorAll('[data-drow]').forEach(el=>el.addEventListener('change',()=>{
              const f=el.getAttribute('data-drow');
              if(!this.R()[i].doorRows) this.R()[i].doorRows=[];
              if(!this.R()[i].doorRows[di]) this.R()[i].doorRows[di]={};
              this.R()[i].doorRows[di][f]=el.type==='number'?parseFloat(el.value):el.value;
              this.save();
            }));
          });
        }
      });
    },

    // ── Cập nhật V/S + preview kính ngay lập tức (không re-render toàn bộ) ──
    // Gộp chung 1 hàm cho cả main list (row/i thật, roomOverride không cần) và
    // drawer (body/0 — id DOM trong drawer luôn hậu tố "0" vì lúc render drawer
    // chỉ có 1 phòng trong mảng tạm — nhưng DỮ LIỆU phải lấy đúng phòng đang mở
    // qua roomOverride, KHÔNG lấy this.R()[0] vì mảng thật đã khôi phục đầy đủ).
    _updateRoomVolDisplay(root, i, roomOverride){
      const r=roomOverride||this.R()[i]; if(!r) return;
      const hl=App.ui.heatload;
      const area=hl._calcArea(r), vol=area*(parseFloat(r.H)||0);
      const vEl=root.querySelector(`#vol-${i}`);
      const fEl=root.querySelector(`#floor-${i}`);
      if(vEl) vEl.textContent=`V = ${vol.toFixed(1)} m³`;
      if(fEl) fEl.textContent=`S = ${area.toFixed(1)} m²`;
      const gEl=root.querySelector(`#glass-preview-${i}`);
      if(gEl){
        if((r.aGlass||0)>0){
          gEl.textContent=`S=${r.aGlass}m² · SHGC=${r.shgc||0.6}`;
          gEl.style.color='#fbbf24'; gEl.style.fontFamily='monospace';
        } else {
          gEl.textContent='(nhấp để mở)';
          gEl.style.color='#3a5470'; gEl.style.fontFamily='';
        }
      }
    },

    _calcArea(r){
      const s=r.roomShape||'rect';
      if(s==='custom') return parseFloat(r.customAreaM2)||0;
      const L=parseFloat(r.L)||0, W=parseFloat(r.W)||0;
      if(s==='hex') return 0.866*L*W;
      if(s==='oct') return 0.828*L*W;
      return L*W;
    },
    _calcVol(r){ return this._calcArea(r)*(parseFloat(r.H)||0); },

    // ── Bind Partition Load ────────────────────────────────────────────────────
    _bindPartitions(root){
      // Add partition button
      root.querySelectorAll('[data-add-partition]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          const ri=parseInt(btn.getAttribute('data-add-partition'));
          const r=this.R()[ri]; if(!r) return;
          if(!r.partitionRows) r.partitionRows=[];
          r.partitionRows.push({id:this.uid(),wallTypeId:'brick_200',uWall:0.45,
            areaM2:20,adjSource:'temp',adjTempC:35,adjRoomId:null});
          this.save(); this.render();
        });
      });
      // Del partition
      root.querySelectorAll('[data-del-partition]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          const pi=parseInt(btn.getAttribute('data-del-partition'));
          const ri=parseInt(btn.getAttribute('data-del-part-room'));
          const r=this.R()[ri]; if(!r?.partitions) return;
          r.partitionRows.splice(pi,1);
          this.save(); this.render();
        });
      });
      // Partition field changes
      root.querySelectorAll('[data-part-f]').forEach(el=>{
        el.addEventListener('change',()=>{
          const f=el.getAttribute('data-part-f');
          const ri=parseInt(el.getAttribute('data-part-room'));
          const pi=parseInt(el.getAttribute('data-part-idx'));
          const r=this.R()[ri]; if(!r?.partitions?.[pi]) return;
          let val = el.type==='number' ? (parseFloat(el.value)||0) : el.value;
          r.partitionRows[pi][f]=val;
          // wallTypeId → auto-fill U
          if(f==='wallTypeId'&&val){
            const wt=(App.data.WALL_TYPES||[]).find(w=>w.id===val);
            if(wt) r.partitionRows[pi].uWall=wt.U;
          }
          this.save();
          if(f==='adjSource') this.render();
        });
      });
    },

    // ── Bind U từ lớp calculator ───────────────────────────────────────────────
    _bindUCalc(root){
      const hl=this;

      // Helper: tính U và cập nhật display
      const refreshUResult=(ri)=>{
        const r=this.R()[ri]; if(!r) return;
        if(!r.wallLayers||!r.wallLayers.length) return;
        try{
          const result=App.calc.calcULayered({layers:r.wallLayers, includeFilms:true});
          const el=root.querySelector(`#ucalc-result-${ri}`);
          if(el && result.U){
            el.textContent=`U = ${result.U.toFixed(4)} W/m²K  |  R_total = ${result.Rtotal.toFixed(4)} m²K/W`;
          }
          if(el && !result.U){
            el.textContent='U = — (chưa đủ dữ liệu, xem cảnh báo bên dưới)';
          }
          // FIX (Bước 3): hiện warnings tính sẵn trong calcULayered() — trước đây bị bỏ phí
          const warnEl=root.querySelector(`#ucalc-warnings-${ri}`);
          if(warnEl){
            warnEl.innerHTML=(result.warnings||[]).map(w=>
              `<div class="text-[10px] text-amber-400 flex items-start gap-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top:1px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${w}</span></div>`
            ).join('');
          }
          // Update per-layer R display
          root.querySelectorAll(`[data-ucalc-li][data-ucalc-room="${ri}"]`).forEach(row=>{
            const li=parseInt(row.getAttribute('data-ucalc-li'));
            const lyr=r.wallLayers[li];
            const mat=(App.data.CONSTRUCTION_MATERIALS||[]).find(m=>m.id===lyr?.materialId);
            const rEl=row.querySelector(`[data-ucalc-r="${li}"]`);
            if(rEl&&mat&&lyr){
              const R=mat.Rfixed!=null?mat.Rfixed:(mat.lambda&&lyr.thicknessMm?(lyr.thicknessMm/1000/mat.lambda):0);
              rEl.textContent=`R=${R.toFixed(4)}`;
            }
          });
        }catch(e){}
      };

      // Add layer
      root.querySelectorAll('[data-ucalc-add]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          const ri=parseInt(btn.getAttribute('data-ucalc-add'));
          const r=this.R()[ri]; if(!r) return;
          if(!r.wallLayers) r.wallLayers=[];
          r.wallLayers.push({materialId:'mortar_cement',thicknessMm:15});
          this.save(); this.render();
        });
      });

      // Del layer
      root.querySelectorAll('[data-ucalc-del]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          const li=parseInt(btn.getAttribute('data-ucalc-del'));
          const ri=parseInt(btn.getAttribute('data-ucalc-room'));
          const r=this.R()[ri]; if(!r?.wallLayers) return;
          r.wallLayers.splice(li,1);
          this.save(); this.render();
        });
      });

      // Layer field changes — instant update R
      root.querySelectorAll('[data-ucalc-f]').forEach(el=>{
        ['change','input'].forEach(evt=>el.addEventListener(evt,()=>{
          const f=el.getAttribute('data-ucalc-f');
          const li=parseInt(el.closest('[data-ucalc-li]')?.getAttribute('data-ucalc-li'));
          const ri=parseInt(el.closest('[data-ucalc-li]')?.getAttribute('data-ucalc-room'));
          const r=this.R()[ri]; if(!r?.wallLayers?.[li]) return;
          r.wallLayers[li][f] = el.type==='number' ? (parseFloat(el.value)||0) : el.value;
          if(evt==='change') this.save();
          refreshUResult(ri);
        }));
      });

      // Apply U button
      root.querySelectorAll('[data-ucalc-apply]').forEach(btn=>{
        btn.addEventListener('click',e=>{
          e.stopPropagation();
          const ri=parseInt(btn.getAttribute('data-ucalc-apply'));
          const r=this.R()[ri]; if(!r?.wallLayers?.length) return;
          try{
            const result=App.calc.calcULayered({layers:r.wallLayers, includeFilms:true});
            if(result.U){
              r.uWall=parseFloat(result.U.toFixed(4));
              r.wallTypeId=''; // clear wall type to use custom U
              this.save(); this.render();
              if(result.warnings?.length){
                App.ui.toast('warn',`Đã áp U = ${result.U.toFixed(4)} W/m²K vào phòng "${r.name||'?'}" — NHƯNG có ${result.warnings.length} cảnh báo, xem chi tiết trong bảng lớp vật liệu`);
              } else {
                App.ui.toast('ok',`Đã áp U = ${result.U.toFixed(4)} W/m²K vào phòng "${r.name||'?'}"`);
              }
            } else {
              App.ui.toast('err','Không tính được U — kiểm tra cảnh báo trong bảng lớp vật liệu (thiếu vật liệu hoặc độ dày)');
            }
          }catch(err){ App.ui.toast('err','Lỗi tính U: '+err.message); }
        });
      });

      // Init display for all rooms on load
      this.R().forEach((r,ri)=>{ if(r.wallLayers?.length) refreshUResult(ri); });
    },

    _bindMotors(root){
      root.querySelector('#hl-add-motor')?.addEventListener('click',()=>{
        this.M().push({id:this.uid(),name:'',pKw:5.5,qty:1,
          method:'A',position:'TH1',FL:1,FU:1,hasVFD:false,roomId:null});
        this.save(); this.render();
      });
      root.querySelectorAll('[data-mdel]').forEach(b=>b.addEventListener('click',()=>{
        this.M().splice(parseInt(b.getAttribute('data-mdel')),1); this.save(); this.render();
      }));
      root.querySelectorAll('tr[data-mi]').forEach(tr=>{
        const i=parseInt(tr.getAttribute('data-mi'));
        tr.querySelectorAll('[data-mf]').forEach(el=>el.addEventListener('change',()=>{
          const f=el.getAttribute('data-mf'); if(!this.M()[i]) return;
          let val;
          if(el.type==='checkbox') val=el.checked;
          else if(el.type==='number') { val=parseFloat(el.value); if(isNaN(val)) val=0; }
          else val=el.value;
          this.M()[i][f]=val;
          this.save();
          // Refresh màu border roomId ngay
          if(f==='roomId'){
            const sel=tr.querySelector('[data-mf="roomId"]');
            const ok=!!(val&&this.R().find(r=>r.id===val));
            sel?.classList.toggle('border-emerald-700',ok);
            sel?.classList.toggle('border-amber-500',!ok);
          }
        }));
      });
    },


    // ── recalc() — tính toán đầy đủ tất cả phòng ────────────────────────────
    recalc(){
      App.ui.setStatus('Đang tính phụ tải nhiệt...');
      try{
        const C=App.calc; const cl=this.CL();
        const psyOut=C.calcPsychro(cl.tOut,cl.rhOut,cl.elevationM||0);
        const psyIn =C.calcPsychro(cl.tIn, cl.rhIn, cl.elevationM||0);
        const calcMode=this.MODE();
        const hl=App.ui.heatload;

        // ── Motor heat — tính theo từng motor, gán vào phòng cụ thể ─────────
        const motorByRoom={}; // {roomId: totalWatt}
        let Q_motor_unassigned=0;
        let Q_motor_total=0; // FIX: khai báo ở scope ngoài để dùng ở _renderResults
        this.M().forEach(m=>{
          if(!m.pKw) return;
          const res=C.calcMotorHeat({pKw:m.pKw||0,qty:m.qty||1,method:m.method||'A',
            position:m.position||'TH1',etaOverride:m.etaOverride,FL:m.FL??1,FU:m.FU??1,
            hasVFD:m.hasVFD,vfdPct:m.vfdPct,K1:m.K1,K2:m.K2,K3:m.K3});
          m._qKW=res.Q_total/1000;
          if(m.roomId){
            motorByRoom[m.roomId]=(motorByRoom[m.roomId]||0)+res.Q_total;
          } else {
            Q_motor_unassigned+=res.Q_total; // motor chưa gán: cộng vào tổng unassigned
          }
        });
        // Motor chưa gán → chia đều cho tất cả phòng (fallback, nhưng cảnh báo)
        const nRooms=this.R().length||1;
        const Q_motor_unassigned_per_room=Q_motor_unassigned/nRooms;

        // ── Parasitic loads — tải ký sinh per-room ─────────────────────────────
        const paraByRoom={};
        const paraList_all=[];
        this.P().forEach(p=>{
          const q=App.calc.calcParasiticLoad({...p,tRoom:cl.tIn});
          p._qW=q; paraList_all.push(q);
          if(p.roomId){
            if(!paraByRoom[p.roomId]) paraByRoom[p.roomId]=[];
            paraByRoom[p.roomId].push(q);
          }
        });

        // ── Per-room tính toán ───────────────────────────────────────────────
        this.R().forEach(r=>{
          // Dùng _calcArea/_calcVol để tính đúng hình dạng phòng
          const floorM2=hl._calcArea(r);
          const volM3=hl._calcVol(r);
          const nPeople=parseInt(r.nPeople)||0; // FIX: đảm bảo là số nguyên

          // U tường: ưu tiên wallTypeId → lookup, sau đó r.uWall, cuối là panel
          let uPan;
          if(r.wallTypeId){
            const wt=(App.data.WALL_TYPES||[]).find(w=>w.id===r.wallTypeId);
            uPan=wt?wt.U:(r.uWall||0.45);
          } else {
            uPan=r.uWall || (App.data.uPanel.find(u=>u.thicknessMm===parseInt(r.panelMm||100))?.U) || 0.45;
          }

          // ── Phân phối gió — dùng calcBuildingTypeAirflow (hub routing) ──
          // Tự động chọn: cleanroom/DC/toilet/kitchen/general theo buildingType
          let airflow;
          try{
            airflow = C.calcBuildingTypeAirflow(r, cl);
          }catch(e){
            // Fallback generic nếu hub lỗi
            const ach=r.achApplied||20;
            const Q_sup=volM3*ach;
            airflow={Q_supply:Q_sup,Q_fresh:Q_sup*0.2,Q_recirculation:Q_sup*0.8,
                     Q_return:Q_sup*0.8,Q_pressurization:0,Q_people_min:0,
                     ACH_actual:ach,freshPct:20,modeNote:'Fallback generic',
                     stdRef:'',warnings:[{level:'yellow',msg:'calcBuildingTypeAirflow error: '+e.message}]};
          }
          r._airflow=airflow;

          // Gán vào _af để duct import tương thích
          r._af={
            L_supply:airflow.Q_supply, L_fresh:airflow.Q_fresh,
            L_return:airflow.Q_recirculation,
            warn:airflow.warnings?.find(w=>w.level==='red')?.msg||null
          };

          // ── Partition Load — vách ngăn kề phòng nhiệt độ khác ─────────────
          let Q_partition_W = 0;
          if(r.partitionRows && r.partitionRows.length > 0){
            const partResult = C.calcPartitionLoad({
              partitions: r.partitionRows,
              tRoom: cl.tIn,
              allRooms: this.R()
            });
            Q_partition_W = partResult.Q_total_W;
            r._partitionDetails = partResult.details;
            r._partitionWarnings = partResult.warnings; // FIX (Bước 3): hiện cảnh báo mặc định
          } else {
            r._partitionDetails = [];
            r._partitionWarnings = [];
          }

          // ── Envelope heat load ──
          r._ev=C.calcEnvelopeLoad({
            uPanel:uPan, aWall:r.aWall||0, dtFactor:parseFloat(r.dtFactor||1.0),
            aGlass:r.aGlass||0, shgc:r.shgc||0.6, sc:r.sc||1, clf:r.clf||0.7,
            nPeople, laborLevel:r.laborLevel||App.data.peopleHeat[1].level,
            lpdApplied:r.lpdApplied||0, floorAreaM2:floorM2, dfLighting:0.9,
            lFreshM3h:airflow.Q_fresh, tOut:cl.tOut, tIn:cl.tIn,
            dOut:psyOut.dGperKg, dIn:psyIn.dGperKg, equipType:r.equipType||'AHU'
          });

          // ── Q_roof — Tải nhiệt qua mái (CLTD Method) ─────────────────────
          let Q_roof_W = 0;
          if(r.roofExposed && r.roofType){
            const roofAreaM2 = (r.roofArea&&r.roofArea>0) ? r.roofArea : floorM2;
            try{
              const rr = C.calcRoofCLTD({roofType:r.roofType, areaM2:roofAreaM2,
                tRoom:cl.tIn, tOutdoorMean:cl.tOut});
              Q_roof_W = rr.Q_W;
              r._ev.Q_roof = Q_roof_W;
            }catch(e){ r._ev.Q_roof = 0; }
          } else { r._ev.Q_roof = 0; }
          r._ev.Q_sensible += Q_roof_W;

          // ── Q_floor — Tải nhiệt qua sàn tiếp đất ─────────────────────────
          let Q_floor_W = 0;
          if(r.floorOnGround){
            const T_ground = parseFloat(r.groundTempC??28);
            const U_floor  = parseFloat(r.floorU||0.8);
            // Q = U × A × (T_ground - T_room) — dương nếu đất ấm hơn phòng
            Q_floor_W = U_floor * floorM2 * (T_ground - cl.tIn);
            r._ev.Q_floor = Q_floor_W;
          } else { r._ev.Q_floor = 0; }
          r._ev.Q_sensible += Q_floor_W;

          // ── Motor per-room + unassigned ──
          const Q_motor_room=(motorByRoom[r.id]||0)+Q_motor_unassigned_per_room;
          Q_motor_total += Q_motor_room; // FIX: cộng dồn để dùng ở _renderResults
          // Tải điện nội bộ từ thiết bị (phòng điện/control room)
          const Q_elec_room_W=(r.elecDeviceRows||[]).reduce((s,d)=>{
            const p=(App.data.ELEC_DEVICE_CATALOG||[]).find(x=>x.id===d.typeId)||{};
            const hF=p.heatFactor||d.heatFactor||0.03;
            return s+((d.ratedKW||0)*(d.qty||1)*(d.loadFactor!=null?d.loadFactor:0.8)*hF*1000);
          },0); // W

          // ── Parasitic per-room ──
          const paraListRoom=paraByRoom[r.id]||[];

          // ── Coil ──
          r._coil=C.calcCoil({
            equipType:r.equipType||'AHU',
            Q_sens_room:r._ev.Q_sensible + Q_partition_W + Q_elec_room_W, // + vách ngăn + thiết bị điện
            Q_lat_room:r._ev.Q_latent,
            Q_motor_total:Q_motor_room,
            Q_parasitic_list:paraListRoom,
            lSupplyM3h:airflow.Q_supply, lFreshM3h:airflow.Q_fresh,
            lReturnM3h:airflow.Q_recirculation,
            tOut:cl.tOut, hOut:psyOut.hKJperKg, dOut:psyOut.dGperKg, hIn:psyIn.hKJperKg,
            tSupplyDesign:r.tSupplyDesign, rhSupplyDesign:r.rhSupplyDesign, espPa:r.espPa||400,
            elevationM:cl.elevationM||0, calcMode
          });
          // ── * Flagging — kiểm tra thông số vượt ngưỡng tiêu chuẩn ──────────
          const paramFlags=C.flagParams(r);
          const airwFlags=airflow.warnings||[];
          const allFlags=[...paramFlags,...airwFlags];
          const worstSev=allFlags.some(f=>f.severity==='error'||f.level==='red')?'red':
                         allFlags.some(f=>f.severity==='warn' ||f.level==='yellow')?'yellow':'pass';
          r._flags=allFlags;
          r._valid={status:worstSev,flags:allFlags.map(f=>({level:f.severity==='error'?'red':f.severity==='warn'?'yellow':'pass',msg:f.msg||f.code}))};
        });

        // ── Group summary ──
        const groups=this.G();
        const groupResults=groups.map(g=>{
          const gRooms=this.R().filter(r=>r.groupId===g.id);
          const Q_supply=gRooms.reduce((s,r)=>s+(r._airflow?.Q_supply||0),0);
          const Q_fresh= gRooms.reduce((s,r)=>s+(r._airflow?.Q_fresh||0),0);
          const Q_return=gRooms.reduce((s,r)=>s+(r._airflow?.Q_recirculation||0),0);
          const Q_coil=  gRooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
          return {...g,Q_supply,Q_fresh,Q_return,Q_coil,roomCount:gRooms.length,rooms:gRooms};
        });
        // FCU rooms (standalone)
        const fcuRooms=this.R().filter(r=>!r.groupId || r.equipType==='FCU' || r.equipType==='FCU_OA');

        // Validation
        const allWarnings=[];
        this.R().forEach(r=>{ (r._airflow?.warnings||[]).forEach(w=>allWarnings.push({...w,roomName:r.name})); });
        const valid=C.runValidation(this.R(),this.M(),this.P(),
          this.R().map(r=>({roomName:r.name||'?',...r._af,warn:r._af?.warn})),this.R());
        allWarnings.forEach(w=>{ if(!valid.flags.find(f=>f.msg===w.msg)) valid.flags.push({level:w.level,code:'STD_'+w.code,msg:`[${w.roomName}] ${w.msg}`}); });
        if(allWarnings.some(w=>w.level==='red')) valid.status='red';
        else if(allWarnings.length && valid.status==='pass') valid.status='yellow';

        this._renderResults(Q_motor_total/1000, paraList_all, valid, groupResults, fcuRooms);
        this._updateValidBadge(valid);
        this.save();
        App.ui.setStatus(`Tính xong ${this.R().length} phòng · ${groups.length} nhóm.`);
        App.ui.toast('ok',`${this.R().length} phòng · ESP tổng xem kết quả · ${valid.flags.length} cờ validation.`);
      }catch(err){
        App.ui.toast('err','Lỗi: '+err.message);
        App.ui.setStatus('Lỗi'); console.error(err);
      }
    },

    // ── Render kết quả ────────────────────────────────────────────────────────
    _renderResults(qMotorKW, paraList, valid, groupResults, fcuRooms){
      const el=document.getElementById('hl-results'); if(!el) return;
      const rooms=this.R();
      const totalCoilKW=rooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
      const totalSupply =rooms.reduce((s,r)=>s+(r._airflow?.Q_supply||0),0);
      const totalFresh  =rooms.reduce((s,r)=>s+(r._airflow?.Q_fresh||0),0);
      const totalRecirc =rooms.reduce((s,r)=>s+(r._airflow?.Q_recirculation||0),0);
      const totalFloor  =rooms.reduce((s,r)=>s+((r.L||0)*(r.W||0)),0);
      const qReheatTotal=rooms.reduce((s,r)=>s+(r._coil?.qReheatKW||0),0);
      const qParaTotal=(paraList||[]).reduce((a,b)=>a+b,0)/1000;

      const vcBadge=valid.status==='pass'?'bg-emerald-700 text-emerald-100':valid.status==='yellow'?'bg-amber-700 text-amber-100':'bg-red-700 text-red-100';
      const vcText =valid.status==='pass'?'✅ PASS':valid.status==='yellow'?`⚠ ${valid.flags.filter(f=>f.level==='yellow').length} cảnh báo`:`❌ ${valid.flags.filter(f=>f.level==='red').length} lỗi`;

      // Per-group summary
      const groupHtml=groupResults.length?`
        <h3 class="font-medium text-xs text-slate-300 mt-4 mb-2 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>Lưu lượng theo nhóm thiết bị
        </h3>
        <div class="overflow-x-auto">
          <table class="zebra w-full text-xs">
            <thead class="text-slate-400"><tr>
              <th class="text-left px-2 py-1.5">Nhóm</th><th class="px-2">Loại</th><th class="px-2">Phòng</th>
              <th class="px-2">Q_cấp tổng (m³/h)</th><th class="px-2">Q_tươi (m³/h)</th><th class="px-2">Q_hồi (m³/h)</th><th class="px-2">Q_coil (kW)</th>
            </tr></thead>
            <tbody>${groupResults.map(g=>`
              <tr>
                <td class="px-2 py-1.5 font-medium">${g.name||'—'}</td>
                <td class="px-2 text-xs ${g.equipType==='AHU'?'text-cyan-400':g.equipType==='PAU'?'text-violet-400':g.equipType==='FCU_OA'?'text-teal-400':'text-emerald-400'}">${g.equipType}</td>
                <td class="px-2 text-center">${g.roomCount}</td>
                <td class="px-2 text-right font-mono-data text-emerald-400">${g.Q_supply.toFixed(0)}</td>
                <td class="px-2 text-right font-mono-data">${g.Q_fresh.toFixed(0)}</td>
                <td class="px-2 text-right font-mono-data">${g.Q_return.toFixed(0)}</td>
                <td class="px-2 text-right font-mono-data text-amber-400">${g.Q_coil.toFixed(2)}</td>
              </tr>
              ${g.rooms.map(r=>`<tr class="opacity-70">
                <td class="px-2 py-0.5 pl-5 text-slate-400">↳ ${r.name||'?'}</td>
                <td></td><td></td>
                <td class="px-2 text-right font-mono-data text-[11px]">${(r._airflow?.Q_supply||0).toFixed(0)}</td>
                <td class="px-2 text-right font-mono-data text-[11px]">${(r._airflow?.Q_fresh||0).toFixed(0)}</td>
                <td class="px-2 text-right font-mono-data text-[11px]">${(r._airflow?.Q_recirculation||0).toFixed(0)}</td>
                <td class="px-2 text-right font-mono-data text-[11px]">${(r._coil?.qCoilKW||0).toFixed(2)}</td>
              </tr>`).join('')}
            `).join('')}
            ${fcuRooms.filter(r=>r.equipType==='FCU'||r.equipType==='FCU_OA').length?`<tr class="border-t border-slate-700/50">
              <td class="px-2 py-1 text-emerald-400 font-medium" colspan="3">FCU riêng lẻ (gồm FCU_OA — Q_coil là tổng cả 2 phần, xem chi tiết từng phòng ở tab Tính toán)</td>
              <td class="px-2 text-right font-mono-data text-emerald-400">${fcuRooms.reduce((s,r)=>s+(r._airflow?.Q_supply||0),0).toFixed(0)}</td>
              <td class="px-2 text-right font-mono-data">${fcuRooms.reduce((s,r)=>s+(r._airflow?.Q_fresh||0),0).toFixed(0)}</td>
              <td class="px-2 text-right font-mono-data">${fcuRooms.reduce((s,r)=>s+(r._airflow?.Q_recirculation||0),0).toFixed(0)}</td>
              <td class="px-2 text-right font-mono-data text-amber-400">${fcuRooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0).toFixed(2)}</td>
            </tr>`:''}
          </table>
        </div>` : '';

      // Per-room detail
      const eqColor={AHU:'text-cyan-400',PAU:'text-violet-400',FCU:'text-emerald-400',VENT:'text-slate-400'};
      const roomRows=rooms.map(r=>`
        <tr class="${r._af?.warn?'bg-red-950/20':''}">
          <td class="px-2 py-1.5 font-medium max-w-xs truncate">${r.name||'—'}</td>
          <td class="px-2 text-[11px] ${eqColor[r.equipType]||''}">${r.equipType}</td>
          <td class="px-2 text-[11px] text-slate-500">${r.classSystem==='GENERAL'?'—':`${r.classSystem} ${r.classCode}`}</td>
          <td class="px-2 text-right font-mono-data text-[11px]">${r._airflow?.ACH_actual?.toFixed(0)||'—'}</td>
          <td class="px-2 text-right font-mono-data text-[11px]">${(r._airflow?.Q_supply||0).toFixed(0)}</td>
          <td class="px-2 text-right font-mono-data text-[11px] ${(r._airflow?.Q_recirculation||0)===0?'text-slate-600':''}">${(r._airflow?.Q_recirculation||0).toFixed(0)}</td>
          <td class="px-2 text-right font-mono-data text-[11px]">${(r._airflow?.Q_fresh||0).toFixed(0)}</td>
          <td class="px-2 text-right font-mono-data text-[11px]">${(r._airflow?.freshPct||0).toFixed(0)}%</td>
          <td class="px-2 text-right font-mono-data text-[11px]">${r._ev?(r._ev.Q_sensible/1000).toFixed(2):'—'}</td>
          <td class="px-2 text-right font-mono-data font-medium text-amber-400">${(r._coil?.qCoilKW||0).toFixed(2)}</td>
          <td class="px-2 text-[10px] ${r._af?.warn?'text-red-400':'text-slate-500'}">${r._af?.warn||''}</td>
        </tr>`).join('');

      el.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <span class="font-medium text-sm flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
            Kết quả — ${rooms.length} phòng · ${groupResults.length} nhóm AHU/PAU
          </span>
          <span class="px-2 py-1 rounded text-[11px] font-medium ${vcBadge}">${vcText}</span>
        </div>
        <!-- KPI -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div class="bg-base-900/60 border border-slate-800 rounded-lg p-2.5"><div class="text-[10px] text-slate-400">Tổng lạnh coil</div><div class="font-mono-data text-lg text-amber-400 font-bold">${totalCoilKW.toFixed(1)} <span class="text-xs text-slate-500">kW = ${(totalCoilKW/3.517).toFixed(1)} TR</span></div></div>
          <div class="bg-base-900/60 border border-slate-800 rounded-lg p-2.5"><div class="text-[10px] text-slate-400">Tổng gió cấp</div><div class="font-mono-data text-lg text-cyan-400 font-bold">${totalSupply.toFixed(0)} <span class="text-xs text-slate-500">m³/h</span></div></div>
          <div class="bg-base-900/60 border border-slate-800 rounded-lg p-2.5"><div class="text-[10px] text-slate-400">Gió tươi / Tuần hoàn</div><div class="font-mono-data text-sm text-emerald-400">${totalFresh.toFixed(0)} / ${totalRecirc.toFixed(0)} <span class="text-xs text-slate-500">m³/h</span></div><div class="text-[10px] text-slate-500">${totalSupply>0?((totalFresh/totalSupply)*100).toFixed(0):0}% tươi/cấp</div></div>
          <div class="bg-base-900/60 border border-slate-800 rounded-lg p-2.5"><div class="text-[10px] text-slate-400">Motor + Tải ký sinh</div><div class="font-mono-data text-sm text-violet-400">${(qMotorKW+qParaTotal).toFixed(2)} <span class="text-xs text-slate-500">kW</span></div><div class="text-[10px] text-slate-500">Motor ${qMotorKW.toFixed(2)} | Ký sinh ${qParaTotal>=0?'+':''}${qParaTotal.toFixed(2)}</div></div>
        </div>
        ${groupHtml}
        <!-- Per-room table -->
        <h3 class="font-medium text-xs text-slate-300 mt-4 mb-2">Chi tiết từng phòng</h3>
        <div class="overflow-x-auto">
          <table class="zebra w-full text-xs min-w-[1000px]">
            <thead class="text-slate-400 sticky top-0 bg-base-900"><tr>
              <th class="text-left px-2 py-1.5">Phòng</th><th class="px-2">Loại TB</th><th class="px-2">Cấp sạch</th>
              <th class="px-2">ACH thực</th><th class="px-2">Q_cấp(m³/h)</th><th class="px-2">Q_tuần hoàn</th>
              <th class="px-2">Q_tươi</th><th class="px-2">% tươi</th>
              <th class="px-2">Q_hiện(kW)</th><th class="px-2">Q_coil(kW)</th><th class="px-2">Ghi chú</th>
            </tr></thead>
            <tbody>${roomRows||'<tr><td colspan="11" class="text-center py-4 text-slate-500">Chưa có phòng</td></tr>'}</tbody>
            <tfoot class="border-t border-slate-700 font-medium"><tr>
              <td class="px-2 py-1.5" colspan="4">Tổng cộng</td>
              <td class="px-2 text-right font-mono-data">${totalSupply.toFixed(0)}</td>
              <td class="px-2 text-right font-mono-data">${totalRecirc.toFixed(0)}</td>
              <td class="px-2 text-right font-mono-data">${totalFresh.toFixed(0)}</td>
              <td class="px-2 text-right font-mono-data">${totalSupply>0?((totalFresh/totalSupply)*100).toFixed(0):0}%</td>
              <td class="px-2 text-right font-mono-data">${(rooms.reduce((s,r)=>s+(r._ev?.Q_sensible||0),0)/1000).toFixed(2)}</td>
              <td class="px-2 text-right font-mono-data text-amber-400">${totalCoilKW.toFixed(2)}</td>
              <td></td>
            </tr></tfoot>
          </table>
        </div>
        ${valid.flags.length?`<div class="mt-3 border border-slate-700/50 rounded-lg p-3 text-xs space-y-1">
          ${valid.flags.map(f=>`<div class="flex items-center gap-1.5 ${f.level==='red'?'text-red-400':'text-amber-400'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>${f.msg}</div>`).join('')}
        </div>`:'<div class="mt-2 text-xs text-emerald-400 flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Không phát hiện lỗi validation.</div>'}

        <!-- ── EQUIPMENT SCHEDULE — Tự động chọn FCU/AHU ── -->
        ${rooms.filter(r=>r._coil?.qCoilKW>0).length>0?`
        <div class="mt-4 border-t border-slate-700/60 pt-4">
          <h3 class="font-medium text-xs text-slate-300 mb-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
            Bảng thiết bị tự chọn (Equipment Schedule) — dựa vào Q_coil từng phòng
          </h3>
          <div class="overflow-x-auto">
            <table class="zebra w-full text-xs min-w-[800px]">
              <thead class="text-slate-400 sticky top-0 bg-base-900"><tr>
                <th class="text-left px-2 py-1.5">Phòng</th>
                <th class="px-2">Loại hệ thống</th>
                <th class="px-2">Q_coil (kW)</th>
                <th class="px-2">Model đề xuất</th>
                <th class="px-2">SL</th>
                <th class="px-2">Tổng CS (kW)</th>
                <th class="px-2">Hiệu suất sử dụng</th>
                <th class="px-2">Lưu lượng (m³/h)</th>
                <th class="px-2">Ghi chú</th>
              </tr></thead>
              <tbody>
              ${rooms.filter(r=>r._coil?.qCoilKW>0).map(r=>{
                // FCU_OA: chọn model catalog theo phần coil FCU riêng (qCoilFcuKW), KHÔNG theo
                // tổng qCoilKW (đã gồm cả phần thiết bị xử lý gió tươi riêng — không có trong
                // catalog FCU/AHU/PAU hiện tại, cần chọn/báo giá riêng ở mục thiết bị khác)
                const q=r.equipType==='FCU_OA' ? (r._coil.qCoilFcuKW??r._coil.qCoilKW) : r._coil.qCoilKW;
                const eqSel=App.calc.selectEquipAuto({
                  qCoilKW:q, equipType:r.equipType||'FCU',
                  designMarginPct:10, preferType:'cassette'
                });
                if(!eqSel) return `<tr><td class="px-2 py-1.5">${r.name}</td><td colspan="8" class="px-2 text-slate-500">VENT — không cần coil</td></tr>`;
                const util=parseInt(eqSel.utilization);
                const utilColor=util<70?'text-slate-400':util<90?'text-emerald-400':'text-amber-400';
                return `<tr class="${eqSel.isOversized?'bg-amber-950/20':''}">
                  <td class="px-2 py-1.5 font-medium max-w-xs truncate">${r.name||'—'}</td>
                  <td class="px-2 text-[11px] text-cyan-400">${r.equipType}</td>
                  <td class="px-2 text-right font-mono-data">${q.toFixed(2)}</td>
                  <td class="px-2 text-emerald-400 font-medium">${eqSel.model.name}</td>
                  <td class="px-2 text-center font-mono-data font-bold">${eqSel.qty}</td>
                  <td class="px-2 text-right font-mono-data">${eqSel.totalCapKW.toFixed(1)}</td>
                  <td class="px-2 text-right font-mono-data ${utilColor}">${eqSel.utilization}</td>
                  <td class="px-2 text-right font-mono-data text-slate-400">${(eqSel.model.airflowM3h*(eqSel.qty||1)).toLocaleString()}</td>
                  <td class="px-2 text-[10px] ${eqSel.warning?'text-amber-400':'text-slate-500'}">${eqSel.warning||eqSel.model.note||''}</td>
                </tr>`;
              }).join('')}
              </tbody>
              <tfoot class="border-t border-slate-700/50 font-medium"><tr>
                <td class="px-2 py-1.5" colspan="2">Tổng thiết bị</td>
                <td class="px-2 text-right font-mono-data text-amber-400">${totalCoilKW.toFixed(2)} kW</td>
                <td colspan="6" class="px-2 text-[10px] text-slate-500">
                  ⚠ Đây là gợi ý tham chiếu. Kỹ sư cần xác nhận với catalog nhà sản xuất thực tế trước khi chọn thiết bị.
                </td>
              </tr></tfoot>
            </table>
          </div>
          <p class="text-[10px] text-slate-500 mt-2">Hiệu suất sử dụng xanh &lt;70% (oversized), vàng 70-90% (tối ưu), đỏ &gt;90% (cần kiểm tra). Design margin: +10%. Catalog tham chiếu thị trường VN 2024.</p>
        </div>`:''}
`;
      if(window.lucide) lucide.createIcons();
    },

    _updateValidBadge(valid){
      let badge=document.getElementById('hl-valid-badge');
      if(!badge){
        badge=document.createElement('div');
        badge.id='hl-valid-badge';
        badge.className='fixed bottom-10 right-4 z-40 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer shadow-lg border';
        document.body.appendChild(badge);
        badge.addEventListener('click',()=>{ App.ui.showTab('heatload'); document.getElementById('hl-results')?.scrollIntoView({behavior:'smooth'}); });
      }
      const cfg=valid.status==='pass'
        ?{cls:'bg-emerald-700 text-emerald-100 border-emerald-600',txt:`✅ 0 lỗi (${this.R().length} phòng)`}
        :valid.status==='yellow'
        ?{cls:'bg-amber-700 text-amber-100 border-amber-600',txt:`⚠ ${valid.flags.filter(f=>f.level==='yellow').length} cảnh báo`}
        :{cls:'bg-red-700 text-red-100 border-red-600',txt:`❌ ${valid.flags.filter(f=>f.level==='red').length} lỗi`};
      badge.className='fixed bottom-10 right-4 z-40 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer shadow-lg border '+cfg.cls;
      badge.textContent=cfg.txt;
    }
  };
  // ---- Sub-module: Tab Hướng Dẫn Sử Dụng ----
  App.ui.guide = {
    render(){
      const root = document.getElementById('panel-guide');
      const section = (title, body) => `
        <div class="bg-panel-800/60 border border-slate-800 rounded-xl p-4">
          <div class="font-medium text-sm text-cyan-400 mb-2">${title}</div>
          <div class="text-xs text-slate-300 space-y-1.5 leading-relaxed">${body}</div>
        </div>`;
      root.innerHTML = `
        <div class="space-y-3">
          ${section('Luồng làm việc — 2 tab chính', `
            <div class="bg-base-900/60 rounded-lg p-3 font-mono-data text-[11px] space-y-2">
              <div class="text-emerald-400 font-medium">Bước 1 → Tab "Phụ Tải Nhiệt"</div>
              <div class="text-slate-300 pl-3">Nhập N phòng (AHU/PAU/FCU/VENT) → khai báo tải nhiệt, motor, ký sinh → bấm "Tính tải" → nhận Q_coil (kW, TR) và L_supply (m³/h) từng phòng.</div>
              <div class="text-cyan-400 font-medium mt-2">Bước 2 → Tab "Thiết Kế Ống Gió"</div>
              <div class="text-slate-300 pl-3">Bấm "Import từ Tab Phụ Tải Nhiệt" để đưa L_supply vào bảng nhánh ống → chọn vật liệu, cách nhiệt, vận tốc → bấm "Tính ống" → nhận kích thước, ΔP ma sát, ESP quạt.</div>
              <div class="text-slate-500 text-[10px] mt-2 pl-3">Hai tab dùng chung dữ liệu dự án (IndexedDB), auto-save liên tục.</div>
            </div>`)}

          ${section('Tab 1 — Thiết Kế Ống Gió (chỉ duct)', `
            <p><b>Phạm vi:</b> Sizing ống gió (chữ nhật W×H hoặc tròn Ø), vật liệu, cách nhiệt, tổn thất ma sát Darcy-Weisbach, kiểm tra đọng sương, NC tiếng ồn, ESP quạt tổng.</p>
            <p><b>Lưu lượng đầu vào:</b> Nhập tay Q (m³/h) cho từng nhánh — hoặc bấm "Import từ Tab Phụ Tải Nhiệt" để kéo tự động L_supply từng phòng đã tính.</p>
            <p><b>Chọn tỉnh/TP:</b> Áp Tv_max và RH_trung_bình vào tất cả nhánh để kiểm tra điểm đọng sương bề mặt ống lạnh.</p>
            <p><b>KHÔNG có trong tab này:</b> tính tải nhiệt phòng, chọn AHU/FCU, motor, tải ký sinh (những thứ đó ở Tab Phụ Tải Nhiệt).</p>`)}

          ${section('Tab 2 — Phụ Tải Nhiệt (multi-room)', `
            <p><b>Điều kiện khí hậu:</b> T_ngoài, RH, cao độ → tự tính enthalpy h, dung ẩm d, điểm sương Td, P_atm hiệu chỉnh (hiển thị live).</p>
            <p><b>Danh sách phòng:</b> Thêm N phòng, mỗi phòng chọn loại: AHU (mixing point), PAU (100% tươi), FCU (tải tươi cộng thẳng vào Q_phòng), VENT (Q_coil=0). Click vào phòng để mở form chi tiết. Nút "copy" để nhân đôi phòng.</p>
            <p><b>Motor IE3:</b> 3 phương pháp A (FL×FU) / B (đơn giản) / C (TCVN K1×K2×K3), 3 vị trí TH1/TH2/TH3. η nội suy tuyến tính giữa các mức IEC 60034-30-1.</p>
            <p><b>Tải ký sinh:</b> IQF/Kho lạnh (vách+khe cửa), Mạ băng, Đá vảy, Rotor tách ẩm. Tải lạnh mang dấu âm, Peak Design không trừ vào Q_coil.</p>
            <p><b>Kết quả:</b> 9 KPI (kW, TR, W/m², %tươi, SHR...) + bảng per-room đầy đủ + validation 6 hạng mục + badge nổi góc màn hình.</p>`)}

          ${section('Xuất báo cáo', `
            <p>Tab <b>Xuất Báo Cáo</b>: PDF đa trang (kèm mộc PASS, bảng per-room) + Excel 5 sheet (Tổng quan · Chi tiết phòng · Motor · Ký sinh · Ống gió). Tên file kèm ngày tháng tự động.</p>`)}

          ${section('Quản lý dữ liệu & sao lưu', `
            <p>Tab <b>Quản Lý Dự Án</b>: tạo/nạp/xoá dự án (IndexedDB, không đồng bộ qua internet). Cột "Phòng" cho biết số phòng nhiệt tải đã khai báo. Export .json để sao lưu toàn bộ (bao gồm cả ống gió + phụ tải), Import .json để khôi phục.</p>`)}

          ${section('Phím tắt', `
            <p><kbd class="font-mono-data bg-slate-800 px-1 rounded">Ctrl/Cmd+K</kbd> tìm nhanh ·
            <kbd class="font-mono-data bg-slate-800 px-1 rounded">Ctrl/Cmd+Enter</kbd> tính toán ·
            <kbd class="font-mono-data bg-slate-800 px-1 rounded">Ctrl/Cmd+S</kbd> lưu ngay ·
            phím số <kbd class="font-mono-data bg-slate-800 px-1 rounded">1–8</kbd> chuyển tab.</p>`)}

          ${section('Giới hạn & lưu ý', `
            <p>Dữ liệu khí hậu từ QCVN 02:2022/BXD; 7 tỉnh không có trạm riêng dùng số liệu lân cận (đánh dấu trong tab Quản Lý). Hệ số tổn thất cục bộ phụ kiện là giá trị sơ bộ (SMACNA), cần hiệu chỉnh theo bản vẽ thực tế. Giá trị R/η motor là tham khảo — cập nhật theo datasheet thực tế trong tab Quản Lý &amp; Admin.</p>`)}
        </div>`;
      if(window.lucide) lucide.createIcons();
    }
  };

  // ---- Sub-module: Tab Trợ Lý AI ----
  App.ui.ai = {
    // Nội dung FAQ — nhóm theo chủ đề, dựa trên các vướng mắc thực tế thường gặp khi dùng app.
    // Thêm câu hỏi mới: chỉ cần thêm 1 object {q,a} vào đúng category, UI tự động cập nhật.
    FAQ_DATA: [
      { cat:'Bắt đầu sử dụng', items:[
        {q:'App có mấy tab chính, dùng theo thứ tự nào?',
         a:'Thứ tự làm việc thông thường: <b>Tầng</b> (tạo tầng/phòng) → <b>Phụ Tải Nhiệt</b> (khai báo thông số từng phòng, bấm Tính) → <b>Tính toán</b> (bảng nhánh ống gió, bấm Tính ống gió) → <b>Xuất Báo Cáo</b> (chọn phạm vi, xuất PDF/Excel). Tab <b>Database</b> dùng khi cần thêm loại phòng/vật liệu mới. Tab <b>Dự Án</b> để nhập thông tin khách hàng/kỹ sư — thông tin này sẽ hiện trên báo cáo xuất ra.'},
        {q:'Dữ liệu có tự lưu không? Mất mạng có bị mất dữ liệu không?',
         a:'App lưu cục bộ trên máy/trình duyệt (IndexedDB), không cần mạng, không gửi dữ liệu lên máy chủ nào. Bấm <b>Lưu</b> trong drawer từng phòng, hoặc Ctrl/Cmd+S để lưu nhanh toàn dự án. Nên thỉnh thoảng Export .json (mục Database) để có bản sao lưu ngoài, phòng khi đổi máy/trình duyệt.'},
      ]},
      { cat:'Tại sao kết quả không cập nhật?', items:[
        {q:'Tôi đổi thông số nhưng số liệu trên màn hình không đổi?',
         a:'App <b>không tự tính lại theo thời gian thực</b> — sau khi đổi thông số (ACH, kích thước, loại phòng...), phải bấm nút <b>"Tính"</b> (trong drawer từng phòng) hoặc <b>"Tính ống gió"</b> (tab Tính toán) để cập nhật. Nếu bạn thấy dòng cảnh báo màu vàng "⚠ Đã đổi input sau lần tính gần nhất" phía trên kết quả, đó là dấu hiệu cần bấm Tính lại.'},
        {q:'Bấm "Tính toán tất cả" báo lỗi dù đã nhập đủ thông tin?',
         a:'Nếu báo "Thiếu diện tích sàn" dù đã nhập Dài/Rộng đầy đủ — đây từng là lỗi đã được sửa (bug đọc sai field dữ liệu). Nếu vẫn gặp trên bản cũ, hãy tải lại app bằng file mới nhất. Nếu lỗi khác, đọc kỹ nội dung lỗi — thường chỉ rõ chính xác phòng nào và thiếu thông số gì.'},
        {q:'Nhánh ống gió không ra kết quả (Kích thước/ΔP hiện dấu "—")?',
         a:'Kiểm tra 2 điều: (1) đã nhập <b>Q (m³/h)</b> chưa, (2) đã có <b>v (m/s)</b> vận tốc chưa — nếu thiếu 1 trong 2, nhánh sẽ bị bỏ qua khi tính. Nhánh tạo mới giờ tự động điền vận tốc mặc định (7 m/s ống chính, 3.75 m/s ống nhánh), bạn có thể sửa lại theo thiết kế thực tế.'},
      ]},
      { cat:'Loại hệ thống ĐHKK (AHU/PAU/FCU)', items:[
        {q:'AHU, PAU, FCU, FCU+OA khác nhau thế nào?',
         a:'<b>AHU</b>: trộn gió hồi + gió tươi tại 1 điểm, tính theo enthalpy hỗn hợp. <b>PAU</b>: 100% gió tươi, không có gió hồi, coil phải xử lý toàn bộ gió tươi từ điều kiện ngoài trời. <b>FCU</b>: chỉ xử lý tải phòng, nếu có gió tươi ghép thẳng (thô, chưa xử lý) thì cộng thẳng vào tải phòng. <b>FCU+OA</b>: có 1 thiết bị xử lý gió tươi riêng (DOAS/PAU nhỏ) trước khi vào phòng — tách thành 2 coil riêng biệt, không cộng gió tươi vào tải FCU như FCU thường.'},
        {q:'Tại sao đổi loại hệ thống mà kết quả khác hẳn dù thông số khác giữ nguyên?',
         a:'Đây là đúng thiết kế, không phải lỗi — mỗi loại hệ thống dùng phương pháp tính hoàn toàn khác nhau (xem câu trên). Lưu ý: nếu đổi PAU cho kết quả NHỎ HƠN AHU với cùng lưu lượng, đó mới là dấu hiệu bất thường cần kiểm tra lại input.'},
        {q:'Nhóm thiết bị (Equipment Group) dùng để làm gì?',
         a:'Gom nhiều phòng dùng chung 1 cụm AHU/PAU/FCU để tính tổng lưu lượng/tải lạnh cho cả nhóm — hữu ích khi 1 AHU cấp cho nhiều phòng. Mỗi phòng chỉ được gán vào nhóm cùng loại hệ thống (phòng AHU chỉ ghép nhóm AHU).'},
      ]},
      { cat:'Bù áp suất & gió tươi', items:[
        {q:'2 phương pháp tính bù áp dương (ACH vs khe cửa) khác nhau thế nào?',
         a:'<b>Theo ACH</b>: Q_bù = Thể tích phòng × ACH_bù (đơn giản, dùng khi chưa rõ chi tiết cửa). <b>Theo khe cửa</b>: tính theo phương trình lỗ rò (Cd×A_khe×√(2ΔP/ρ)), phụ thuộc số lượng/loại cửa thực tế — chính xác hơn khi đã biết rõ cấu tạo cửa. Chọn phương pháp nào thì phải bấm Tính lại để áp dụng.'},
        {q:'Phòng sạch (Cleanroom) tính ACH/ΔP thế nào?',
         a:'Chọn "Phòng sạch ISO/GMP" ở loại công trình → chọn hệ ISO 14644-1 hoặc GMP Annex 1 → chọn cấp độ sạch (VD ISO 7) → ACH và ΔP tối thiểu sẽ tự điền theo tiêu chuẩn, có thể ghi đè nếu cần.'},
      ]},
      { cat:'Database — thêm loại phòng/vật liệu mới', items:[
        {q:'Làm sao thêm 1 loại phòng không có sẵn trong danh sách?',
         a:'Vào tab <b>Database</b> → mục "Danh mục loại phòng & Nhóm áp suất" → điền form thêm mới (tên, nhóm áp suất, gió tươi, ΔP, ACH...) → bấm Thêm. Loại phòng mới sẽ xuất hiện ngay trong dropdown chọn ở form phòng.'},
        {q:'Làm sao thêm vật liệu tường/kính/ống gió mới?',
         a:'Cũng ở tab Database, có các mục riêng: "Vật liệu: Tường/Vách", "Vật liệu: Kính", "Vật liệu: Ống gió", "Vật liệu: Cách nhiệt", "Vật liệu: Cửa" — mỗi mục có form thêm mới tương tự.'},
        {q:'Ẩn 1 loại phòng/vật liệu có sẵn thì dữ liệu cũ có bị mất không?',
         a:'Không — "Ẩn" chỉ gỡ khỏi dropdown chọn cho phòng mới, không xóa dữ liệu gốc. Phòng đã tạo trước đó bằng loại đã ẩn vẫn tính toán bình thường. Có thể bấm "Khôi phục" để hiện lại bất cứ lúc nào.'},
      ]},
      { cat:'Xuất báo cáo', items:[
        {q:'Xuất PDF không hiện tên khách hàng/kỹ sư dù đã nhập ở Tab Dự Án?',
         a:'Đây từng là lỗi (báo cáo đọc sai field dữ liệu so với Tab Dự Án) — đã được sửa. Đảm bảo bạn dùng bản app mới nhất, và đã bấm "Lưu thông tin dự án" sau khi nhập ở Tab Dự Án.'},
        {q:'Báo cáo PDF có đủ để nộp hồ sơ thiết kế không?',
         a:'Báo cáo gồm: thông tin dự án, điều kiện thiết kế, cơ sở tiêu chuẩn áp dụng, bảng phụ tải từng phòng, bảng nhánh ống gió, bảng thiết bị lựa chọn, chẩn đoán lỗi/cảnh báo, và khối ký xác nhận (Người lập/Kiểm tra/Phê duyệt). Đây là bộ số liệu tính toán tham khảo — vẫn cần kỹ sư xác nhận lại thiết bị với catalog nhà sản xuất trước khi đưa vào hồ sơ chính thức.'},
        {q:'Xuất theo từng tầng/từng phòng riêng được không?',
         a:'Được — ở tab Xuất Báo Cáo, dropdown "Phạm vi xuất báo cáo" cho chọn Toàn bộ dự án, theo từng tầng, hoặc từng phòng riêng lẻ.'},
      ]},
      { cat:'Tiêu chuẩn tham chiếu', items:[
        {q:'App dựa trên những tiêu chuẩn nào?',
         a:'ISO 14644-1/4 (phòng sạch), GMP EU Annex 1 / WHO TRS 961, ASHRAE Fundamentals Ch.18/21, ASHRAE 62.1-2022 (thông gió), ASHRAE TC9.9 2021 (Data Center), SMACNA (ống gió), TCVN 5687:2010, QCVN 02:2022/BXD (khí hậu). Xem đầy đủ ở tab Thông Tin hoặc mục "Cơ sở thiết kế" trong báo cáo xuất ra.'},
        {q:'Số liệu khí hậu các tỉnh lấy từ đâu, có đủ 63 tỉnh không?',
         a:'Theo QCVN 02:2022/BXD Phụ lục A. Một số tỉnh chưa có trạm riêng dùng số liệu tỉnh lân cận gần nhất (có ghi chú "≈" trong dropdown chọn tỉnh) — nên kiểm tra lại nếu công trình ở khu vực đặc thù.'},
      ]},
    ],
    FAQ_DATA_EN: [
      { cat:'Getting started', items:[
        {q:'How many main tabs does the app have, and in what order should I use them?',
         a:'Typical workflow: <b>Floors</b> (create floors/rooms) → <b>Heat Load</b> (enter parameters per room, click Calculate) → <b>Calc</b> (duct branch table, click Calculate Ductwork) → <b>Export Report</b> (choose scope, export PDF/Excel). The <b>Database</b> tab is for adding new room types/materials. The <b>Project</b> tab is for entering client/engineer info — this info appears on the exported report.'},
        {q:'Does the app auto-save? Will I lose data if I lose connection?',
         a:'The app saves locally in your device/browser (IndexedDB) — no internet needed, nothing is sent to any server. Click <b>Save</b> in each room drawer, or Ctrl/Cmd+S to quick-save the whole project. It\'s good practice to occasionally Export .json (Database section) as an external backup, in case you switch devices/browsers.'},
      ]},
      { cat:'Why aren\'t results updating?', items:[
        {q:'I changed a parameter but the numbers on screen didn\'t change?',
         a:'The app does <b>not</b> recalculate in real time — after changing a parameter (ACH, dimensions, room type...), you must click <b>"Calculate"</b> (inside each room\'s drawer) or <b>"Calculate Ductwork"</b> (Calc tab) to update. If you see a yellow warning line "⚠ Inputs changed since last calculation" above the results, that\'s the signal to recalculate.'},
        {q:'"Calculate All" shows an error even though I\'ve entered everything?',
         a:'If it says "Missing floor area" despite Length/Width being filled in — this was a bug that has been fixed (it was reading the wrong data field). If you still see it on an old build, reload the app with the latest file. For other errors, read the message carefully — it usually specifies exactly which room and which parameter is missing.'},
        {q:'A duct branch shows no result (Size/ΔP show "—")?',
         a:'Check 2 things: (1) has <b>Q (m³/h)</b> been entered, (2) has a <b>v (m/s)</b> velocity been set — if either is missing, the branch is skipped during calculation. Newly-created branches now auto-fill a default velocity (7 m/s for main duct, 3.75 m/s for branch duct), which you can override to match the actual design.'},
      ]},
      { cat:'AC system types (AHU/PAU/FCU)', items:[
        {q:'What\'s the difference between AHU, PAU, FCU, and FCU+OA?',
         a:'<b>AHU</b>: mixes return air + fresh air at one point, calculated by mixed-air enthalpy. <b>PAU</b>: 100% outdoor air, no return air — the coil must handle all fresh air from outdoor conditions. <b>FCU</b>: only handles room load; if raw (unconditioned) fresh air is ducted straight in, it\'s added directly to the room load. <b>FCU+OA</b>: has a separate fresh-air treatment unit (small DOAS/PAU) before the air enters the room — split into 2 separate coils, fresh air is NOT added to the FCU load like a plain FCU.'},
        {q:'Why does the result change drastically when I switch system type, even with the same other parameters?',
         a:'This is correct behavior, not a bug — each system type uses a completely different calculation method (see above). Note: if switching to PAU gives a result SMALLER than AHU at the same airflow, that would be the abnormal sign worth double-checking your inputs for.'},
        {q:'What is an Equipment Group used for?',
         a:'Groups multiple rooms sharing one AHU/PAU/FCU cluster to total up airflow/cooling load for the whole group — useful when one AHU serves several rooms. A room can only be assigned to a group of the same system type (an AHU room can only join an AHU group).'},
      ]},
      { cat:'Pressurization & fresh air', items:[
        {q:'What\'s the difference between the 2 positive-pressure makeup methods (ACH vs door gap)?',
         a:'<b>By ACH</b>: Q_makeup = Room volume × Makeup ACH (simple, use when door details aren\'t known yet). <b>By door gap</b>: uses the orifice leakage equation (Cd×A_gap×√(2ΔP/ρ)), depends on the actual number/type of doors — more accurate once door construction is known. Whichever method you pick, click Calculate again to apply it.'},
        {q:'How does the app calculate ACH/ΔP for a Cleanroom?',
         a:'Select "Cleanroom ISO/GMP" as the building type → choose the ISO 14644-1 or GMP Annex 1 system → choose the cleanliness class (e.g. ISO 7) → minimum ACH and ΔP auto-fill per the standard, and can be overridden if needed.'},
      ]},
      { cat:'Database — adding new room types/materials', items:[
        {q:'How do I add a room type that isn\'t in the list?',
         a:'Go to the <b>Database</b> tab → "Room Type & Pressure Group Catalog" section → fill in the add-new form (name, pressure group, fresh air, ΔP, ACH...) → click Add. The new room type appears immediately in the room form\'s dropdown.'},
        {q:'How do I add a new wall/glass/duct material?',
         a:'Also in the Database tab, there are dedicated sections: "Material: Wall/Partition", "Material: Glass", "Material: Duct", "Material: Insulation", "Material: Door" — each has a similar add-new form.'},
        {q:'If I hide an existing room type/material, is the old data lost?',
         a:'No — "Hide" only removes it from the dropdown for new rooms, it does not delete the underlying data. Rooms already created with a hidden type still calculate normally. You can click "Restore" to bring it back anytime.'},
      ]},
      { cat:'Exporting reports', items:[
        {q:'The PDF export doesn\'t show the client/engineer name even though I entered it in the Project tab?',
         a:'This was a bug (the report was reading the wrong data field vs. the Project tab) — it has been fixed. Make sure you\'re on the latest app build, and that you clicked "Save project info" after entering it in the Project tab.'},
        {q:'Is the PDF report sufficient for a design submittal package?',
         a:'The report includes: project info, design conditions, applicable design-basis standards, per-room load table, duct branch table, equipment selection table, error/warning diagnostics, and a sign-off block (Prepared by/Checked by/Approved by). This is a reference calculation set — the engineer still needs to confirm equipment with the manufacturer\'s catalog before including it in an official submittal.'},
        {q:'Can I export per floor / per room separately?',
         a:'Yes — in the Export Report tab, the "Report scope" dropdown lets you choose Entire project, per floor, or individual rooms.'},
      ]},
      { cat:'Reference standards', items:[
        {q:'What standards does the app rely on?',
         a:'ISO 14644-1/4 (cleanroom), GMP EU Annex 1 / WHO TRS 961, ASHRAE Fundamentals Ch.18/21, ASHRAE 62.1-2022 (ventilation), ASHRAE TC9.9 2021 (Data Center), SMACNA (ductwork), TCVN 5687:2010 (Vietnam), QCVN 02:2022/BXD (Vietnam climate). See the full list in the About tab or the "Design basis" section of the exported report.'},
        {q:'Where does the provincial climate data come from — does it cover all 63 provinces?',
         a:'Per QCVN 02:2022/BXD Appendix A (Vietnam). Some provinces without their own weather station borrow data from the nearest one (marked "≈" in the province dropdown) — worth double-checking for projects in those specific areas.'},
      ]},
    ],
    render(){
      const root = document.getElementById('panel-ai');
      const cats = App.state.lang==='en' ? this.FAQ_DATA_EN : this.FAQ_DATA;
      const catsHtml = cats.map((c,ci)=>`
        <div data-faq-cat="${ci}">
          <div class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mt-3 mb-1.5 first:mt-0">${c.cat}</div>
          <div class="space-y-1.5">
            ${c.items.map((it,ii)=>`
              <details data-faq-item="${ci}-${ii}" class="bg-base-900/50 border border-slate-800 rounded-lg overflow-hidden">
                <summary class="px-3 py-2 text-xs font-medium text-slate-200 cursor-pointer select-none hover:bg-slate-800/50">${it.q}</summary>
                <div class="px-3 pb-2.5 pt-0.5 text-[11px] text-slate-400 leading-relaxed">${it.a}</div>
              </details>`).join('')}
          </div>
        </div>`).join('');
      root.innerHTML = App.ui.panelShell('aichat','tab_ai','help-circle', `
        <div class="space-y-1">
          <p class="text-[11px] text-slate-500 mb-2">${App.ui.t('faq_intro')}</p>
          <div class="relative">
            <input id="faq-search" type="text" placeholder="${App.ui.t('faq_search_placeholder')}" class="w-full bg-base-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#4a6680"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <div id="faq-list">${catsHtml}</div>
          <div id="faq-empty" class="hidden text-center text-xs text-slate-500 py-6">${App.ui.t('faq_no_match')}</div>
        </div>
      `);
      App.ui.bindPanelToggles(root);
      const search = root.querySelector('#faq-search');
      search.addEventListener('input', ()=>{
        const q = search.value.trim().toLowerCase();
        let anyVisible = false;
        root.querySelectorAll('[data-faq-cat]').forEach(catEl=>{
          let catHasMatch = false;
          catEl.querySelectorAll('[data-faq-item]').forEach(item=>{
            const text = item.textContent.toLowerCase();
            const match = !q || text.includes(q);
            item.style.display = match ? '' : 'none';
            if(match){ catHasMatch = true; anyVisible = true; if(q) item.open = true; }
          });
          catEl.style.display = catHasMatch ? '' : 'none';
        });
        root.querySelector('#faq-empty').classList.toggle('hidden', anyVisible);
      });
      if(window.lucide) lucide.createIcons();
    }
  };

  // ---- Sub-module: Tab Thông Tin ----
  App.ui.about = {
    render(){
      const root = document.getElementById('panel-about');
      root.innerHTML = App.ui.panelShell('about','tab_about','info', `
        <div class="text-sm space-y-3 text-slate-300">
          <p>MultiHVAC Calculator hỗ trợ tính chọn lưu lượng gió, ống gió và thiết bị AHU/FCU/CRAC cho 3 môi trường: Phòng sạch, Data Center, Phòng điện/Tủ điện.</p>
          <div>
            <div class="text-xs text-slate-400 mb-1">Tiêu chuẩn áp dụng</div>
            <ul class="list-disc list-inside text-xs space-y-0.5 text-slate-400">
              <li>ISO 14644-1/4 — Phòng sạch</li>
              <li>GMP EU Annex 1 / WHO TRS 961</li>
              <li>ASHRAE Fundamentals Ch.18, Ch.21</li>
              <li>ASHRAE TC9.9 (2021) — Data Center Thermal Guidelines</li>
              <li>SMACNA HVAC Duct Construction Standards</li>
              <li>TCVN 5687:2010 — Thông gió, điều hoà không khí</li>
              <li>QCVN 02:2022/BXD — Số liệu khí hậu xây dựng</li>
            </ul>
          </div>
          <div class="text-[11px] text-slate-500 pt-2 border-t border-slate-800/70">Created by Quocde · Ver 2606.22.01</div>
        </div>
      `);
      App.ui.bindPanelToggles(root);
      if(window.lucide) lucide.createIcons();
    }
  };

  // ---- Sub-module: Tab Dự Án (Project Overview) ----
  App.ui.project = {
    render(){
      const root=document.getElementById('panel-project');
      const floors=App.state.floors||[];
      const rooms=App.state.hlRooms||[];
      const inp=App.state.inputs||{};
      const totalKW=rooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
      const calcRooms=rooms.filter(r=>r._coil);
      const errRooms=rooms.filter(r=>r._valid?.status==='red');
      const warnRooms=rooms.filter(r=>r._valid?.status==='yellow');

      // Stats per floor
      const floorStats=floors.map(fl=>{
        const fRooms=rooms.filter(r=>r.floorId===fl.id||(fl.id==='fl1'&&!r.floorId));
        const fKW=fRooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
        const fCalc=fRooms.filter(r=>r._coil).length;
        return {fl,fRooms,fKW,fCalc};
      });

      root.innerHTML=`<div class="space-y-4 p-1">
        <!-- Project Info Card -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-dim);border-radius:12px;padding:16px">
          <div style="font-size:13px;font-weight:700;color:#c2d4e2;margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>
            Thông tin dự án
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="grid-column:1/-1">
              <label>Tên dự án</label>
              <input id="proj-name" type="text" value="${inp.projectName||''}" placeholder="VD: Kho lạnh thủy sản Cần Thơ" style="width:100%">
            </div>
            <div>
              <label>Khách hàng</label>
              <input id="proj-client" type="text" value="${inp.client||''}" placeholder="Tên khách hàng" style="width:100%">
            </div>
            <div>
              <label>Ngày lập</label>
              <input id="proj-date" type="date" value="${inp.date||new Date().toISOString().slice(0,10)}" style="width:100%">
            </div>
            <div style="grid-column:1/-1">
              <label>Địa chỉ công trình</label>
              <input id="proj-addr" type="text" value="${inp.address||''}" placeholder="Địa chỉ" style="width:100%">
            </div>
            <div>
              <label>Kỹ sư thiết kế</label>
              <input id="proj-eng" type="text" value="${inp.engineer||''}" placeholder="Họ tên" style="width:100%">
            </div>
            <div>
              <label>Mã dự án</label>
              <input id="proj-code" type="text" value="${inp.projectCode||''}" placeholder="PRJ-2024-001" style="width:100%">
            </div>
          </div>
          <button id="proj-save-btn" style="margin-top:12px;width:100%;background:#059669;color:white;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer">💾 Lưu thông tin dự án</button>
        </div>

        <!-- Summary KPI -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
          ${[
            {label:'Số tầng', val:floors.length, color:'#38bdf8', unit:'tầng'},
            {label:'Số phòng', val:rooms.length, color:'#34d399', unit:'phòng'},
            {label:'Đã tính', val:calcRooms.length+'/'+rooms.length, color:'#a78bfa', unit:'phòng'},
            {label:'Q_coil tổng', val:totalKW.toFixed(1), color:'#fb923c', unit:'kW'},
            {label:'Lỗi / Cảnh báo', val:(errRooms.length?'⛔'+errRooms.length+' ':'')+( warnRooms.length?'⚠'+warnRooms.length:'✓'), color:errRooms.length?'#f87171':warnRooms.length?'#fbbf24':'#34d399', unit:''},
            {label:'Trung bình / phòng', val:calcRooms.length?(totalKW/calcRooms.length).toFixed(1):'—', color:'#22d3ee', unit:'kW/phòng'},
          ].map(k=>`
            <div style="background:var(--bg-raised);border:1px solid var(--border-dim);border-radius:10px;padding:12px">
              <div style="font-size:10px;color:var(--text-low);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${k.label}</div>
              <div style="font-size:20px;font-weight:700;color:${k.color};font-family:monospace">${k.val}</div>
              ${k.unit?`<div style="font-size:10px;color:var(--text-low)">${k.unit}</div>`:''}
            </div>`).join('')}
        </div>

        <!-- Per-floor summary -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-dim);border-radius:12px;overflow:hidden">
          <div style="padding:12px 16px;background:linear-gradient(90deg,#0d2038,#091825);border-bottom:1px solid var(--border-dim);font-size:12px;font-weight:600;color:#c2d4e2">
            Tổng hợp theo tầng
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:#071325">
              <th style="padding:8px 12px;text-align:left;color:var(--text-mid);font-size:10px;text-transform:uppercase">Tầng</th>
              <th style="padding:8px;color:var(--text-mid);font-size:10px;text-transform:uppercase;text-align:center">Phòng</th>
              <th style="padding:8px;color:var(--text-mid);font-size:10px;text-transform:uppercase;text-align:right">Q tổng</th>
              <th style="padding:8px;color:var(--text-mid);font-size:10px;text-transform:uppercase;text-align:right">TB/phòng</th>
              <th style="padding:8px;color:var(--text-mid);font-size:10px;text-transform:uppercase;text-align:center">Trạng thái</th>
            </tr></thead>
            <tbody>
              ${floorStats.map((fs,idx)=>{
                const hasErr=fs.fRooms.some(r=>r._valid?.status==='red');
                const hasWarn=fs.fRooms.some(r=>r._valid?.status==='yellow');
                const st=hasErr?'<span style="color:#f87171">⛔ Lỗi</span>':hasWarn?'<span style="color:#fbbf24">⚠ Cảnh báo</span>':fs.fCalc>0?'<span style="color:#34d399">✓ OK</span>':'<span style="color:#3a5470">—</span>';
                return `<tr style="${idx%2?'background:rgba(7,19,37,.7)':''}">
                  <td style="padding:9px 12px;color:#c2d4e2;font-weight:500">${fs.fl.name}</td>
                  <td style="padding:9px 8px;text-align:center;color:var(--text-mid)">${fs.fRooms.length}</td>
                  <td style="padding:9px 8px;text-align:right;font-family:monospace;color:#22d3ee">${fs.fKW>0?fs.fKW.toFixed(1)+' kW':'—'}</td>
                  <td style="padding:9px 8px;text-align:right;font-family:monospace;color:var(--text-mid)">${fs.fCalc>0&&fs.fKW>0?(fs.fKW/fs.fCalc).toFixed(1)+' kW':'—'}</td>
                  <td style="padding:9px 8px;text-align:center;font-size:11px">${st}</td>
                </tr>`;
              }).join('')}
              ${floorStats.length>1?`<tr style="background:rgba(16,185,129,.06);border-top:1px solid rgba(16,185,129,.2)">
                <td style="padding:9px 12px;color:#34d399;font-weight:700">TỔNG CỘNG</td>
                <td style="padding:9px 8px;text-align:center;color:#34d399;font-weight:700">${rooms.length}</td>
                <td style="padding:9px 8px;text-align:right;font-family:monospace;color:#34d399;font-weight:700">${totalKW.toFixed(1)} kW</td>
                <td style="padding:9px 8px;text-align:right;font-family:monospace;color:var(--text-mid)">${calcRooms.length?( totalKW/calcRooms.length).toFixed(1)+' kW':'—'}</td>
                <td></td>
              </tr>`:''}
            </tbody>
          </table>
        </div>

        <!-- Quick actions -->
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick_safe="heatload_recalc" style="flex:1;min-width:120px;background:#059669;border:none;color:white;border-radius:8px;padding:10px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Tính tất cả phòng
          </button>
          <button onclick_safe="switch_heatload" style="flex:1;min-width:120px;background:rgba(56,189,248,.1);border:1px solid #234168;color:#38bdf8;border-radius:8px;padding:10px;font-size:12px;font-weight:600;cursor:pointer">
            🏢 Tab Phụ Tải
          </button>
          <button onclick_safe="switch_report" style="flex:1;min-width:120px;background:rgba(251,146,60,.1);border:1px solid #234168;color:#fb923c;border-radius:8px;padding:10px;font-size:12px;font-weight:600;cursor:pointer">
            📄 Xuất Báo Cáo
          </button>
        </div>
      </div>`;

      // Bind inputs
      ['name','client','date','addr','eng','code'].forEach(f=>{
        document.getElementById('proj-'+f)?.addEventListener('change',e=>{
          const map={name:'projectName',client:'client',date:'date',addr:'address',eng:'engineer',code:'projectCode'};
          App.state.inputs[map[f]]=e.target.value;
          App.admin.autoSave();
        });
      });
      document.getElementById('proj-save-btn')?.addEventListener('click',()=>{
        App.admin.autoSave();
        App.ui.toast('ok','Đã lưu thông tin dự án');
      });
      // Quick action buttons (dùng data thay inline onclick)
      root.querySelectorAll('[onclick_safe]').forEach(btn=>{
        const action=btn.getAttribute('onclick_safe');
        btn.removeAttribute('onclick_safe');
        btn.addEventListener('click',()=>{
          if(action==='heatload_recalc') App.ui.heatload.recalc();
          else if(action==='switch_heatload') App.ui.showTab('heatload');
          else if(action==='switch_report') App.ui.showTab('report');
        });
      });
    },
  };

  // ---- Sub-module: Tab Xuất Báo Cáo ----
  App.ui.report = {
    render(){
      const root = document.getElementById('panel-report');
      const floors=App.state.floors||[];
      const rooms=App.state.hlRooms||[];
      root.innerHTML = App.ui.panelShell('rep','tab_report','file-down', `
        <div class="space-y-3">
          <!-- Scope selector + buttons -->
          <div class="flex flex-wrap gap-2 items-center">
            <div>
              <label style="font-size:11px;color:#4a6680;display:block;margin-bottom:3px">Phạm vi xuất báo cáo</label>
              <select id="export-scope" style="background:#07111e;border:1.5px solid #234168;border-radius:8px;color:#c2d4e2;padding:7px 12px;font-size:12px;min-height:38px;min-width:200px">
                <option value="all">📋 Toàn bộ dự án (${rooms.length} phòng)</option>
                ${floors.map(f=>{const n=rooms.filter(r=>r.floorId===f.id||(f.id==='fl1'&&!r.floorId)).length;return `<option value="floor:${f.id}">🏢 ${f.name} (${n} phòng)</option>`;}).join('')}
                ${rooms.map(r=>`<option value="room:${r.id}">📌 ${r.name||'Phòng'}</option>`).join('')}
              </select>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <label style="font-size:11px;color:#4a6680">Định dạng</label>
              <div style="display:flex;gap:6px">
                <button id="btn-export-pdf" style="display:flex;align-items:center;gap:6px;background:#b91c1c;border:none;color:white;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>Xuất PDF
                </button>
                <button id="btn-export-xlsx" style="display:flex;align-items:center;gap:6px;background:#047857;border:none;color:white;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>Xuất Excel
                </button>
              </div>
            </div>
          </div>
          <!-- Flags summary -->
          ${rooms.some(r=>r._flags&&r._flags.length>0)?`
          <div style="background:#0d1e10;border:1px solid #1a4020;border-radius:8px;padding:12px;font-size:11px">
            <div style="color:#4ade80;font-weight:600;margin-bottom:6px">⚠ Thông số cần kiểm tra (* Flags)</div>
            ${rooms.filter(r=>r._flags&&r._flags.length>0).map(r=>
              r._flags.map(f=>`<div style="display:flex;gap:8px;margin-bottom:3px">
                <span style="color:${f.severity==='error'||f.level==='red'?'#f87171':'#fbbf24'};min-width:60px;font-weight:600">${f.severity==='error'||f.level==='red'?'⛔ LỖI':'⚠ CẢNH'}</span>
                <span style="color:#8095ab">[${r.name||'?'}]</span>
                <span style="color:#8eaac2">${f.msg||f.code||''}</span>
              </div>`).join('')
            ).join('')}
          </div>`:''}
        </div>
        <div id="report-preview" class="mt-4 bg-white text-slate-900 rounded-lg p-5 text-xs"></div>
      `);
      App.ui.bindPanelToggles(root);
      root.querySelector('#btn-export-pdf').addEventListener('click', ()=>{
              const scope=root.querySelector('#export-scope')?.value||'all';
              App.report.exportPDF(scope);
            });
      root.querySelector('#btn-export-xlsx').addEventListener('click', ()=>{
              const scope=root.querySelector('#export-scope')?.value||'all';
              App.report.exportXLSX(scope);
            });
      if(window.lucide) lucide.createIcons();
    }
  };
  /*UI_MODULE*/

  // ============== CMD — Command Palette ==============
  App.cmd = {
    actions(){
      return [
        ...App.ui.TABS.map(tb=>({label:'Tab: '+App.ui.t(tb.key), run:()=>App.ui.showTab(tb.id)})),
        {label:'Tính toán lại (Recalculate)', run:()=> App.ui.calc.recalc()},
        {label:'Dự án mới', run:()=> App.admin.openProjectModal()},
        {label:'Export toàn bộ dữ liệu .json', run:()=> App.admin.exportJSON()},
        {label:'Xuất báo cáo PDF', run:()=> App.report.exportPDF()},
        {label:'Xuất báo cáo Excel', run:()=> App.report.exportXLSX()},
        {label:'Đổi ngôn ngữ VI/EN', run:()=>{ App.state.lang = App.state.lang==='vi'?'en':'vi'; App.ui.applyI18n(); App.ui.renderNav(); App.ui.renderAllTabs(); App.admin.autoSave(); }}
      ];
    },
    open(){
      const overlay = document.getElementById('cmdk-overlay');
      overlay.classList.remove('hidden'); overlay.classList.add('flex');
      const input = document.getElementById('cmdk-input');
      input.value=''; input.focus();
      this.renderResults('');
      input.oninput = ()=> this.renderResults(input.value);
      input.onkeydown = (e)=>{
        if(e.key==='Escape') this.close();
        if(e.key==='Enter'){
          const first = document.querySelector('#cmdk-results [data-action]');
          if(first) first.click();
        }
      };
    },
    close(){
      const overlay = document.getElementById('cmdk-overlay');
      overlay.classList.add('hidden'); overlay.classList.remove('flex');
    },
    renderResults(query){
      const q = query.toLowerCase();
      const matched = this.actions().filter(a=> a.label.toLowerCase().includes(q));
      const root = document.getElementById('cmdk-results');
      root.innerHTML = matched.map((a,i)=>`<button data-action="${i}" class="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-800 flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>${a.label}</button>`).join('') || `<div class="px-3 py-4 text-sm text-slate-500 text-center">Không tìm thấy</div>`;
      root.querySelectorAll('[data-action]').forEach((b,i)=> b.addEventListener('click', ()=>{ matched[i].run(); this.close(); }));
      if(window.lucide) lucide.createIcons();
    },
    init(){
      document.getElementById('cmdk-overlay').addEventListener('click', (e)=>{ if(e.target.id==='cmdk-overlay') this.close(); });
    }
  };
  /*CMD_MODULE*/

  // ============== KBD — Keyboard shortcuts toàn cục ==============
  App.kbd = {
    init(){
      document.addEventListener('keydown', (e)=>{
        const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
        if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); App.cmd.open(); return; }
        if(!document.getElementById('cmdk-overlay').classList.contains('hidden') && e.key==='Escape'){ App.cmd.close(); return; }
        if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); App.admin.autoSave(true); return; }
        if((e.ctrlKey||e.metaKey) && e.key==='Enter'){ e.preventDefault(); App.ui.calc.recalc(); return; }
        if(!typing && /^[1-8]$/.test(e.key)){
          const idx = parseInt(e.key)-1;
          if(App.ui.TABS[idx]) App.ui.showTab(App.ui.TABS[idx].id);
        }
      });
    }
  };
  /*KBD_MODULE*/

  // ============== ADMIN — CRUD dự án (Modal nội bộ, không dùng prompt/confirm), Import/Export ==============
  App.admin = {
    _saveTimer: null,
    autoSave(force){
      clearTimeout(this._saveTimer);
      const doSave = async ()=>{
        // Lọc bỏ các field _result tính toán tạm thời để giảm dung lượng lưu
        const cleanRooms = (App.state.hlRooms||[]).map(r=>{
          const {_af,_ev,_coil,...rest} = r; return rest;
        });
        const cleanMotors = (App.state.hlMotors||[]).map(m=>{
          const {_qKW,...rest} = m; return rest;
        });
        const cleanPara = (App.state.hlParasitic||[]).map(p=>{
          const {_qW,...rest} = p; return rest;
        });
        const project = {
          id: App.state.activeProjectId,
          // FIX: trước đây có 4 field trùng lặp customer/performer/execDate/version ở đây,
          // đọc từ App.state.inputs.customer/performer/execDate/version — nhưng KHÔNG UI nào
          // trên toàn app từng ghi vào các field đó (Tab Dự Án ghi vào client/engineer/date/
          // projectCode). Từ nay chỉ giữ 1 nguồn dữ liệu duy nhất: inputs: App.state.inputs
          // (đã chứa đầy đủ projectName/client/address/engineer/date/projectCode).
          inputs: App.state.inputs,
          elecDevices: App.state.elecDevices, branches: App.state.branches,
          localExhaust: App.state.localExhaust, workshopDoors: App.state.workshopDoors,
          results: App.state.results,
          // ── Heat load data ──
          floors:     App.state.floors || [{id:'fl1',name:'Tầng 1',order:1}],
          hlRooms:    cleanRooms,
          hlMotors:   cleanMotors,
          hlParasitic:cleanPara,
          hlClimate:  App.state.hlClimate,
          hlCalcMode: App.state.hlCalcMode,
          hlEquipGroups: App.state.hlEquipGroups || [],
          roomCount:  (App.state.hlRooms||[]).length
        };
        const saved = await App.db.saveProject(project);
        App.state.activeProjectId = saved.id;
        localStorage.setItem('multihvac_settings', JSON.stringify({ lang:App.state.lang, unit:App.state.unit, apiKey:App.state.settings.apiKey, customBuildingTypes:App.state.customBuildingTypes||[], hiddenBuildingTypeIds:App.state.hiddenBuildingTypeIds||[] }));
        App.ui.setStatus(App.ui.t('auto_saved')+' '+new Date().toLocaleTimeString());
        App.ui.setStatusProject();
      };
      if(force) doSave(); else this._saveTimer = setTimeout(doSave, 800);
    },

    // Lưu global settings (không theo dự án) cho danh mục loại phòng + vật liệu tự
    // thêm/ẩn — dùng chung cho mọi dự án nên lưu riêng vào multihvac_settings, không
    // qua autoSave (autoSave chỉ lưu dữ liệu theo từng dự án cụ thể vào IndexedDB).
    saveRoomTypesSettings(){
      try{
        const saved = JSON.parse(localStorage.getItem('multihvac_settings')||'{}');
        saved.customBuildingTypes = App.state.customBuildingTypes||[];
        saved.hiddenBuildingTypeIds = App.state.hiddenBuildingTypeIds||[];
        saved.customMaterials = App.state.customMaterials||{};
        saved.hiddenMaterialIds = App.state.hiddenMaterialIds||{};
        saved.lang = App.state.lang; saved.unit = App.state.unit; saved.apiKey = App.state.settings.apiKey;
        localStorage.setItem('multihvac_settings', JSON.stringify(saved));
      }catch(e){ console.warn('[MultiHVAC] saveRoomTypesSettings error:', e.message); }
    },

    closeModal(){ const m = document.getElementById('modal-root'); m.classList.add('hidden'); m.innerHTML=''; },
    openModal(html){
      const m = document.getElementById('modal-root');
      m.innerHTML = `<div class="bg-base-800 border border-slate-700 rounded-xl w-full max-w-md p-5">${html}</div>`;
      m.classList.remove('hidden');
      if(window.lucide) lucide.createIcons();
    },

    openProjectModal(){
      this.openModal(`
        <h3 class="font-medium mb-3">Dự án mới</h3>
        <div class="space-y-2">
          <input id="modal-pname" placeholder="Tên dự án" class="w-full bg-base-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm">
          <input id="modal-cust" placeholder="Khách hàng" class="w-full bg-base-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm">
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button id="modal-cancel" class="px-3 py-1.5 text-sm border border-slate-700 rounded-lg">Hủy</button>
          <button id="modal-confirm" class="px-3 py-1.5 text-sm bg-emerald-600 rounded-lg">Tạo</button>
        </div>
      `);
      document.getElementById('modal-cancel').addEventListener('click', ()=> this.closeModal());
      document.getElementById('modal-confirm').addEventListener('click', ()=>{
        App.state.activeProjectId = null;
        App.state.inputs = { projectName: document.getElementById('modal-pname').value, customer: document.getElementById('modal-cust').value };
        App.state.elecDevices = []; App.state.branches = []; App.state.results = {};
        App.state.localExhaust = []; App.state.workshopDoors = [];
        // ── reset heat load ──
        App.state.hlRooms=[]; App.state.hlMotors=[]; App.state.hlParasitic=[];
        App.state.hlClimate=null; App.state.hlCalcMode='Peak';
        App.state.hlEquipGroups=[];
        this.closeModal();
        App.ui.renderAllTabs();
        this.autoSave(true);
        App.ui.toast('ok','Đã tạo dự án mới.');
      });
    },

    async loadProject(id){
      const projects = await App.db.listProjects();
      const p = projects.find(x=>x.id===id);
      if(!p) return;
      App.state.activeProjectId = p.id;
      App.state.inputs      = p.inputs || {};
      App.state.elecDevices = p.elecDevices || [];
      App.state.localExhaust= p.localExhaust || [];
      App.state.workshopDoors=p.workshopDoors || [];
      App.state.branches    = p.branches || [];
      App.state.results     = p.results || {};
      // ── restore heat load data ──
      App.state.floors     = p.floors     || [{id:'fl1',name:'Tầng 1',order:1}];
      App.state.hlRooms    = p.hlRooms    || [];
      App.state.hlMotors   = p.hlMotors   || [];
      App.state.hlParasitic= p.hlParasitic|| [];
      App.state.hlClimate  = p.hlClimate  || null;
      App.state.hlCalcMode = p.hlCalcMode || 'Peak';
      App.state.hlEquipGroups = p.hlEquipGroups || [];
      App.ui.renderAllTabs();
      App.ui.toast('ok','Đã nạp dự án: '+(p.inputs?.projectName||p.id)+' · '+(p.roomCount||0)+' phòng nhiệt tải');
    },

    confirmDeleteProject(id){
      this.openModal(`
        <h3 class="font-medium mb-3 text-red-400">Xoá dự án?</h3>
        <p class="text-sm text-slate-400 mb-4">Hành động này không thể hoàn tác.</p>
        <div class="flex justify-end gap-2">
          <button id="modal-cancel" class="px-3 py-1.5 text-sm border border-slate-700 rounded-lg">Hủy</button>
          <button id="modal-confirm" class="px-3 py-1.5 text-sm bg-red-600 rounded-lg">Xoá</button>
        </div>
      `);
      document.getElementById('modal-cancel').addEventListener('click', ()=> this.closeModal());
      document.getElementById('modal-confirm').addEventListener('click', async ()=>{
        await App.db.deleteProject(id);
        this.closeModal();
        App.ui.admin.render();
        App.ui.toast('ok','Đã xoá dự án.');
      });
    },

    async exportJSON(){
      const json = await App.db.exportAllJSON();
      const blob = new Blob([json], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'multihvac_backup_'+Date.now()+'.json'; a.click();
      URL.revokeObjectURL(url);
      App.ui.toast('ok','Đã export dữ liệu .json');
    },
    async importJSON(file){
      if(!file) return;
      try{
        const text = await file.text();
        const count = await App.db.importAllJSON(text);
        App.ui.toast('ok', `Đã nhập ${count} dự án.`);
        App.ui.admin.render();
      }catch(err){ App.ui.toast('err','Lỗi import: '+err.message); }
    },
    importClimateFile(file){
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (e)=>{
        try{
          const wb = XLSX.read(e.target.result, {type:'binary'});
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet);
          const parsed = rows.map(r=>({
            province: r.province||r['Tỉnh']||r['province']||'',
            tv: parseFloat(r.tv||r['Tv']||0), tt: parseFloat(r.tt||r['Tt']||0),
            tn: parseFloat(r.tn||r['Tn']||0), rh: parseFloat(r.rh||r['RH']||0)
          })).filter(r=>r.province);
          if(parsed.length===0) throw new Error('Không đọc được dòng dữ liệu hợp lệ.');
          App.data.climateSample = parsed;
          App.ui.toast('ok', `Đã nhập ${parsed.length} dòng dữ liệu khí hậu.`);
          App.ui.admin.render();
        }catch(err){ App.ui.toast('err','Lỗi đọc file: '+err.message); }
      };
      reader.readAsBinaryString(file);
    }
  };
  /*ADMIN_MODULE*/

  // (App.ai chat module đã được thay bằng FAQ tĩnh trong App.ui.ai — xem phía trên,
  // không còn phụ thuộc API key cá nhân của người dùng nữa)
  /*AI_MODULE*/

  // ============== REPORT — Xuất PDF/Excel kèm mộc PASS + per-room data ==============
  App.report = {
    // ── Build nội dung preview HTML (dùng cho cả PDF và hiển thị màn hình) ──
    buildPreviewHtml(){
      const I = App.state.inputs;
      const R = App.state.results;
      const rooms = App.state.hlRooms || [];
      const cl = App.state.hlClimate || {};
      const d = R.diagnostics || {status:'pass', flags:[]};
      const stampColor = d.status==='pass'?'#059669':d.status==='yellow'?'#d97706':'#dc2626';
      const stampText  = d.status==='pass'?'PASS':d.status==='yellow'?'WARNING':'FAIL';

      // KPI tổng hợp từ hlRooms (nếu đã tính)
      const hasHL = rooms.some(r=>r._coil!=null || r._af!=null);
      const totalCoilKW = rooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
      const totalSupply  = rooms.reduce((s,r)=>s+(r._af?.L_supply||0),0);
      const totalFresh   = rooms.reduce((s,r)=>s+(r._af?.L_fresh||0),0);
      const totalFloor   = rooms.reduce((s,r)=>s+((r.L||0)*(r.W||0)),0);

      const roomTableRows = rooms.map(r=>`
        <tr>
          <td style="border:1px solid #ddd;padding:4px 6px;color:#111;">${r.name||'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:center;color:#111;">${r.equipType||'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:#111;">${((r.L||0)*(r.W||0)).toFixed(0)}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:#111;">${r._af?.L_supply.toFixed(0)||'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:${(r._af?.L_return||0)<0?'#dc2626':'#111'};">${r._af?.L_return.toFixed(0)||'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:#111;">${r._af?.L_fresh.toFixed(0)||'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:#111;">${r._ev?(r._ev.Q_sensible/1000).toFixed(2):'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:#111;">${r._ev?(r._ev.Q_latent/1000).toFixed(2):'—'}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;font-weight:bold;color:#b45309;">${(r._coil?.qCoilKW||0).toFixed(2)}</td>
          <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;color:${(r._coil?.qReheatKW||0)>0?'#ea580c':'#111'}">${(r._coil?.qReheatKW||0)>0?r._coil.qReheatKW.toFixed(2):'—'}</td>
        </tr>`).join('');

      const branchRows = (App.state.branches||[]).map(b=>`
        <tr><td style="border:1px solid #ddd;padding:4px;color:#111;">${b.name||''}</td>
        <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${b.qM3h||''}</td>
        <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${b.vMs||''}</td>
        <td style="border:1px solid #ddd;padding:4px;color:#111;">${b._result?b._result.dimsLabel:''}</td>
        <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${b._result?b._result.frictionPa.toFixed(0):''}</td></tr>`).join('');

      // FIX: báo cáo trước đây đọc field 'customer'/'performer'/'execDate'/'version' —
      // nhưng Tab Dự Án (nơi người dùng thực sự nhập thông tin) lại lưu vào field khác
      // hẳn ('client'/'engineer'/'date'/'projectCode'), không có UI nào ghi vào field cũ
      // cả — nên báo cáo xuất ra LUÔN hiện "—" cho Khách hàng/Người thực hiện/Ngày dù đã
      // nhập đầy đủ ở Tab Dự Án. Đọc đúng field Tab Dự Án dùng, fallback field cũ cho dữ
      // liệu từ project đã lưu trước đây (nếu có).
      const repClient = I.client || I.customer || '—';
      const repEngineer = I.engineer || I.performer || '—';
      const repDate = I.date || I.execDate || '—';
      const repCode = I.projectCode || I.version || '—';
      return `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e293b;padding-bottom:8px;margin-bottom:10px;color:#111;">
          <div>
            <div style="font-size:16px;font-weight:bold;color:#0f172a;">${App.ui.t('report_title')}</div>
            <div style="font-size:10px;color:#64748b;">MultiHVAC Calculator · Ver 2606.22.01 · ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <div style="border:2px solid ${stampColor};color:${stampColor};padding:5px 12px;font-weight:bold;border-radius:6px;transform:rotate(-4deg);font-size:13px;">${stampText}</div>
        </div>
        <!-- Thông tin dự án -->
        <table style="width:100%;margin-bottom:12px;border-collapse:collapse;color:#111;">
          <tr><td style="width:50%;padding:2px 0;color:#111;"><b>Khách hàng:</b> ${repClient}</td><td style="color:#111;"><b>Dự án:</b> ${I.projectName||'—'}</td></tr>
          <tr><td style="color:#111;"><b>Địa chỉ:</b> ${I.address||'—'}</td><td style="color:#111;"><b>Kỹ sư thiết kế:</b> ${repEngineer}</td></tr>
          <tr><td style="color:#111;"><b>Ngày:</b> ${repDate}</td><td style="color:#111;"><b>Mã dự án:</b> ${repCode}</td></tr>
          ${cl.tOut?`<tr><td style="color:#111;"><b>Điều kiện thiết kế:</b> Ngoài ${cl.tOut}°C/${cl.rhOut}%RH</td><td style="color:#111;">Trong ${cl.tIn}°C/${cl.rhIn}%RH · Cao độ ${cl.elevationM||0}m</td></tr>`:''}
        </table>
        <!-- Mức độ tin cậy thông số đầu vào — gộp từ các cảnh báo "dùng giá trị mặc định/
             tham khảo" đã có sẵn trong hệ thống (không cần thêm cơ chế theo dõi mới), theo
             đúng tinh thần báo cáo Cold Storage Heat Load Calculator bạn tham khảo: liệt kê
             CỤ THỂ chỗ nào đang dùng số liệu ước lượng, không chỉ nói chung chung. -->
        ${(()=>{
          const notes = [];
          const climateEntry = (App.data.climateSample||[]).find(c=>c.province===cl.provinceId);
          if(climateEntry?.borrowedFrom){
            notes.push(`Dữ liệu khí hậu tỉnh <b>${climateEntry.province}</b> được MƯỢN từ trạm <b>${climateEntry.borrowedFrom}</b> do QCVN 02:2022/BXD không có trạm khí tượng riêng cho tỉnh này.`);
          }
          const partitionDefaultCount = rooms.reduce((s,r)=>s+(r._partitionWarnings||[]).length,0);
          if(partitionDefaultCount>0){
            notes.push(`${partitionDefaultCount} vách ngăn nội bộ đang dùng giá trị mặc định (U và/hoặc nhiệt độ phòng kề chưa nhập cụ thể) — xem chi tiết ở bảng Chẩn đoán &amp; Kiểm tra bên dưới.`);
          }
          const exhaustEmptyCount = rooms.filter(r=>r._airflow?.warnings?.some(w=>w.code==='LOCAL_EXHAUST_EMPTY')).length;
          if(exhaustEmptyCount>0){
            notes.push(`${exhaustEmptyCount} phòng đã khai báo có gió thải cục bộ nhưng chưa nhập đủ lưu lượng thiết bị.`);
          }
          const achDefaultCount = rooms.filter(r=>{
            const bt=(App.data.BUILDING_TYPES||[]).find(b=>b.id===r.buildingType);
            return bt && r.achApplied===bt.achDefault;
          }).length;
          if(achDefaultCount>0){
            notes.push(`${achDefaultCount}/${rooms.length} phòng đang dùng ACH mặc định theo loại phòng (achDefault) — chưa được kỹ sư điều chỉnh riêng theo điều kiện thực tế dự án.`);
          }
          notes.push('Catalog thiết bị (FCU/AHU/PAU) trong app là dữ liệu tổng hợp tham khảo, không phải catalog thật của hãng nào — cần kỹ sư xác nhận với nhà sản xuất trước khi lên đơn hàng.');

          const level = climateEntry?.borrowedFrom || partitionDefaultCount>2 ? 'CẦN THẬN TRỌNG' : (notes.length>1?'TRUNG BÌNH':'CAO');
          const levelColor = level==='CẦN THẬN TRỌNG'?'#dc2626':(level==='TRUNG BÌNH'?'#d97706':'#059669');
          return `<div style="background:#f8fafc;border:1px solid ${levelColor};border-left:4px solid ${levelColor};border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:10px;color:#111;">
            <b style="color:${levelColor};">Mức độ tin cậy thông số đầu vào: ${level}</b>
            ${level!=='CAO'?' — có dùng giá trị mặc định/tham khảo, khuyến nghị đối chiếu kỹ trước khi dùng cho hồ sơ chính thức.':' — phần lớn thông số đã được nhập cụ thể cho dự án này.'}
            <ul style="margin:4px 0 0;padding-left:16px;color:#111;">
              ${notes.map(n=>`<li style="margin:1px 0;color:#111;">${n}</li>`).join('')}
            </ul>
          </div>`;
        })()}
        <!-- Cơ sở thiết kế — Tiêu chuẩn áp dụng -->
        ${(()=>{
          const stdSet=new Set();
          rooms.forEach(r=>{
            const bt=(App.data.BUILDING_TYPES||[]).find(b=>b.id===r.buildingType);
            if(bt?.stdRef) bt.stdRef.split(';').forEach(s=>stdSet.add(s.trim()));
            if(r.classSystem==='ISO') stdSet.add('ISO 14644-1:2015 (Cleanroom)');
            if(r.classSystem==='GMP') stdSet.add('EU GMP Annex 1:2022 (Pharmaceutical)');
          });
          ['ASHRAE 62.1-2022 (Ventilation)','ASHRAE Handbook Fundamentals 2021',
           'QCVN 02:2022/BXD (Số liệu khí hậu)','TCVN 5687:2010 (Thông gió, ĐHKK)',
           'IEC 60034-30-1 IE3 (Hiệu suất động cơ)','ISO 6946:2017 (Tính U cấu tạo lớp)'
          ].forEach(s=>stdSet.add(s));
          if((App.state.branches||[]).length>0) stdSet.add('SMACNA HVAC Duct Construction Standards');
          return `<h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Cơ sở thiết kế — Tiêu chuẩn áp dụng</h3>
          <ul style="margin:0 0 10px;padding-left:16px;font-size:10px;columns:2;color:#111;">
            ${[...stdSet].sort().map(s=>`<li style="margin:1px 0;color:#111;">${s}</li>`).join('')}
          </ul>`;
        })()}
        ${hasHL?`
        <!-- KPI tổng hợp -->
        <h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">KPI Tổng hợp Phụ Tải Nhiệt (${rooms.length} phòng)</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;color:#111;">
          <tr style="background:#f1f5f9;color:#111;">
            <td style="border:1px solid #cbd5e1;padding:4px 8px;color:#111;"><b>Tổng lạnh coil</b></td>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:right;color:#111;"><b style="color:#b45309;">${totalCoilKW.toFixed(1)} kW = ${(totalCoilKW/3.517).toFixed(1)} TR</b></td>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;color:#111;"><b>Tổng gió cấp</b></td>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:right;color:#111;"><b>${totalSupply.toFixed(0)} m³/h</b></td>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;color:#111;">Tổng gió tươi</td>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:right;color:#111;">${totalFresh.toFixed(0)} m³/h (${totalSupply>0?((totalFresh/totalSupply)*100).toFixed(0):0}%)</td>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;color:#111;">Kw/m² sàn</td>
            <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:right;color:#111;">${totalFloor>0?(totalCoilKW/totalFloor*1000).toFixed(0):'-'} W/m²</td>
          </tr>
          ${(()=>{
            const totalLocalExhaust = rooms.reduce((s,r)=>s+(r._airflow?.Q_localExhaust||0),0);
            const totalMakeupRaw = rooms.reduce((s,r)=>s+(r._airflow?.Q_makeupRaw||0),0);
            if(totalLocalExhaust<=0) return '';
            return `<tr>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;color:#111;">Tổng gió thải cục bộ (thiết bị)</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:right;color:#ea580c;">${totalLocalExhaust.toFixed(0)} m³/h</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;color:#111;">Trong đó gió bù thuần túy (không qua coil)</td>
              <td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:right;color:#111;">${totalMakeupRaw.toFixed(0)} m³/h</td>
            </tr>`;
          })()}
        </table>
        <!-- Bảng per-room -->
        <h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Chi tiết phụ tải từng phòng (${rooms.length} phòng)</h3>
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px;color:#111;">
          <thead><tr style="background:#1e293b;color:#fff;">
            <th style="border:1px solid #334155;padding:4px 6px;text-align:left;color:#fff;">Tên phòng</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">Loại TB</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">S.sàn(m²)</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">L_cấp(m³/h)</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">L_hồi</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">L_tươi</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">Q_hiện(kW)</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">Q_ẩn(kW)</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">Q_coil(kW)</th>
            <th style="border:1px solid #334155;padding:4px;color:#fff;">Reheat</th>
          </tr></thead>
          <tbody>${roomTableRows||'<tr><td colspan="10" style="color:#111;">Chưa có dữ liệu</td></tr>'}</tbody>
          <tfoot><tr style="background:#f8fafc;font-weight:bold;color:#111;">
            <td style="border:1px solid #ddd;padding:4px 6px;color:#111;" colspan="2">Tổng cộng</td>
            <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${totalFloor.toFixed(0)}</td>
            <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${totalSupply.toFixed(0)}</td>
            <td style="border:1px solid #ddd;padding:4px;color:#111;"></td>
            <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${totalFresh.toFixed(0)}</td>
            <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${(rooms.reduce((s,r)=>s+(r._ev?.Q_sensible||0),0)/1000).toFixed(1)} kW</td>
            <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${(rooms.reduce((s,r)=>s+(r._ev?.Q_latent||0),0)/1000).toFixed(1)} kW</td>
            <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#b45309;">${totalCoilKW.toFixed(2)} kW</td>
            <td style="border:1px solid #ddd;padding:4px;color:#111;"></td>
          </tr></tfoot>
        </table>
        <!-- Bảng phân tích tải nhiệt theo thành phần (%) — tổng hợp toàn dự án, theo đúng
             phong cách bảng Q1-Q5 của báo cáo Cold Storage Heat Load Calculator bạn tham
             khảo. Dữ liệu lấy từ r._ev đã tính sẵn cho từng phòng (không cần tính lại) —
             chỉ cộng dồn theo từng thành phần: vách, mái, kính/bức xạ, người, đèn, gió
             tươi (chỉ FCU thường cộng thẳng), vách ngăn nội bộ. -->
        <h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Phân tích tải nhiệt theo thành phần (toàn dự án)</h3>
        ${(()=>{
          const sums = {
            'Q1 Vách/tường':       rooms.reduce((s,r)=>s+(r._ev?.Q_wall||0),0),
            'Q2 Mái':              rooms.reduce((s,r)=>s+(r._ev?.Q_roof||0),0),
            'Q3 Kính/bức xạ':      rooms.reduce((s,r)=>s+(r._ev?.Q_solar||0),0),
            'Q4 Người':            rooms.reduce((s,r)=>s+(r._ev?.Q_ps||0)+(r._ev?.Q_pl||0),0),
            'Q5 Chiếu sáng':       rooms.reduce((s,r)=>s+(r._ev?.Q_light||0),0),
            'Q6 Gió tươi (FCU thường)': rooms.reduce((s,r)=>s+(r._ev?.Q_fresh_s||0)+(r._ev?.Q_fresh_l||0),0),
            'Q7 Vách ngăn nội bộ': rooms.reduce((s,r)=>s+(r._partitionDetails||[]).reduce((ps,d)=>ps+(d.Q_W||0),0),0),
          };
          const totalW = Object.values(sums).reduce((a,b)=>a+b,0);
          const rowsHtml = Object.entries(sums).map(([label,w])=>{
            const kw=w/1000, pct=totalW>0?(w/totalW*100):0;
            return `<tr><td style="border:1px solid #ddd;padding:4px 8px;color:#111;">${label}</td><td style="border:1px solid #ddd;padding:4px 8px;text-align:right;color:#111;">${kw.toFixed(2)}</td><td style="border:1px solid #ddd;padding:4px 8px;text-align:right;color:#111;">${pct.toFixed(1)}%</td></tr>`;
          }).join('');
          return `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px;color:#111;">
            <thead><tr style="background:#f1f5f9;color:#111;"><th style="border:1px solid #ddd;padding:4px 8px;text-align:left;color:#111;">Hạng mục</th><th style="border:1px solid #ddd;padding:4px 8px;color:#111;">kW</th><th style="border:1px solid #ddd;padding:4px 8px;color:#111;">%</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot><tr style="background:#f8fafc;font-weight:bold;color:#111;"><td style="border:1px solid #ddd;padding:4px 8px;color:#111;">Tổng tải phòng (trước hệ số an toàn thiết bị)</td><td style="border:1px solid #ddd;padding:4px 8px;text-align:right;color:#111;">${(totalW/1000).toFixed(2)}</td><td style="border:1px solid #ddd;padding:4px 8px;text-align:right;color:#111;">100%</td></tr></tfoot>
          </table>
          <p style="font-size:9px;color:#64748b;margin:0 0 10px;">* Bảng này là tổng tải nhiệt PHÒNG theo từng thành phần (ASHRAE Fundamentals Ch.18) — không nhất thiết bằng Tổng lạnh coil (Q_coil) ở trên, vì Q_coil của hệ AHU/PAU tính theo phương pháp enthalpy lưu lượng gió (không cộng thẳng tải phòng), và Q_coil còn gồm cả tải motor/thiết bị điện chưa tách theo phòng ở đây.</p>`;
        })()}
        `:''}
        ${(()=>{
          const eqRooms=rooms.filter(r=>r._coil?.qCoilKW>0);
          if(!eqRooms.length) return '';
          const eqRows=eqRooms.map(r=>{
            const q=r.equipType==='FCU_OA' ? (r._coil.qCoilFcuKW??r._coil.qCoilKW) : r._coil.qCoilKW;
            const eqSel=App.calc.selectEquipAuto({qCoilKW:q, equipType:r.equipType||'FCU', designMarginPct:10, preferType:'cassette'});
            if(!eqSel) return `<tr><td style="border:1px solid #ddd;padding:4px 6px;color:#111;">${r.name||'—'}</td><td colspan="6" style="border:1px solid #ddd;padding:4px;color:#64748b;">VENT — không cần coil</td></tr>`;
            return `<tr>
              <td style="border:1px solid #ddd;padding:4px 6px;color:#111;">${r.name||'—'}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:center;color:#111;">${r.equipType}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${q.toFixed(2)}</td>
              <td style="border:1px solid #ddd;padding:4px;color:#111;">${eqSel.model.name}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:center;color:#111;">${eqSel.qty}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${eqSel.totalCapKW.toFixed(1)}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${eqSel.utilization}</td>
            </tr>`;
          }).join('');
          const totalCoil2=eqRooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
          return `<h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Bảng thiết bị lựa chọn (Equipment Schedule)</h3>
          <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:6px;color:#111;">
            <thead><tr style="background:#1e293b;color:#fff;">
              <th style="border:1px solid #334155;padding:4px 6px;text-align:left;color:#fff;">Tên phòng</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">Loại HT</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">Q_coil(kW)</th>
              <th style="border:1px solid #334155;padding:4px;text-align:left;color:#fff;">Model đề xuất</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">SL</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">Tổng CS(kW)</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">H.suất SD</th>
            </tr></thead>
            <tbody>${eqRows}</tbody>
            <tfoot><tr style="background:#f8fafc;font-weight:bold;color:#111;">
              <td style="border:1px solid #ddd;padding:4px 6px;color:#111;" colspan="5">Tổng công suất thiết bị</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#b45309;">${totalCoil2.toFixed(2)} kW</td>
              <td style="border:1px solid #ddd;padding:4px;color:#111;"></td>
            </tr></tfoot>
          </table>
          <p style="font-size:9px;color:#64748b;margin:0 0 10px;">⚠ Model đề xuất tham khảo catalog thị trường VN — kỹ sư cần xác nhận với nhà sản xuất trước khi chọn thiết bị chính thức.</p>`;
        })()}
        <!-- Bảng Quạt thông gió / Gió thải cục bộ — bổ sung theo đề xuất người dùng: bảng
             thiết bị lựa chọn ở trên chỉ lọc theo Q_coil>0 (thiết bị làm lạnh), nên MỌI phòng
             VENT (thông gió thuần, Q_coil=0 theo đúng thiết kế) và MỌI thiết bị gió thải cục
             bộ đều bị loại hoàn toàn khỏi báo cáo — dù chúng vẫn cần 1 thiết bị thật (quạt)
             để vận hành. Bảng riêng này dùng selectFanAuto() (chọn theo lưu lượng+cột áp,
             khác cơ chế selectEquipAuto theo công suất lạnh) để không bỏ sót nhóm thiết bị
             này khỏi hồ sơ thiết kế — đúng tinh thần "MultiHVAC" (không chỉ phần đã làm lạnh). -->
        ${(()=>{
          const fanRows=[];
          rooms.forEach(r=>{
            if(r.equipType==='VENT' && r._airflow?.Q_supply>0){
              const staticPa=r.espPa||150;
              const fanSel=App.calc.selectFanAuto({airflowM3h:r._airflow.Q_supply, staticPaRequired:staticPa, preferType:'axial'});
              fanRows.push({room:r.name||'—', type:'VENT (thông gió chính)', flow:r._airflow.Q_supply, staticPa, fanSel});
            }
            if(r.hasLocalExhaustEquip && r._airflow?.Q_localExhaust>0){
              const staticPa=100;
              const fanSel=App.calc.selectFanAuto({airflowM3h:r._airflow.Q_localExhaust, staticPaRequired:staticPa, preferType:'wall_exhaust'});
              fanRows.push({room:r.name||'—', type:'Gió thải cục bộ', flow:r._airflow.Q_localExhaust, staticPa, fanSel});
            }
          });
          if(!fanRows.length) return '';
          const rowsHtml=fanRows.map(fr=>{
            if(!fr.fanSel) return `<tr><td style="border:1px solid #ddd;padding:4px 6px;color:#111;">${fr.room}</td><td style="border:1px solid #ddd;padding:4px;color:#111;">${fr.type}</td><td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${fr.flow.toFixed(0)}</td><td colspan="4" style="border:1px solid #ddd;padding:4px;color:#64748b;">Không tìm được quạt phù hợp trong catalog tham khảo — chọn thủ công</td></tr>`;
            return `<tr>
              <td style="border:1px solid #ddd;padding:4px 6px;color:#111;">${fr.room}</td>
              <td style="border:1px solid #ddd;padding:4px;color:#111;">${fr.type}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${fr.flow.toFixed(0)}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${fr.staticPa}</td>
              <td style="border:1px solid #ddd;padding:4px;color:#111;">${fr.fanSel.model.name}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:center;color:#111;">${fr.fanSel.qty}</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#111;">${fr.fanSel.utilization}</td>
            </tr>`;
          }).join('');
          const totalFlow=fanRows.reduce((s,fr)=>s+fr.flow,0);
          return `<h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Bảng quạt thông gió / gió thải cục bộ</h3>
          <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:6px;color:#111;">
            <thead><tr style="background:#1e293b;color:#fff;">
              <th style="border:1px solid #334155;padding:4px 6px;text-align:left;color:#fff;">Tên phòng</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">Mục đích</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">Lưu lượng(m³/h)</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">Cột áp(Pa)</th>
              <th style="border:1px solid #334155;padding:4px;text-align:left;color:#fff;">Model quạt đề xuất</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">SL</th>
              <th style="border:1px solid #334155;padding:4px;color:#fff;">H.suất SD</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot><tr style="background:#f8fafc;font-weight:bold;color:#111;">
              <td style="border:1px solid #ddd;padding:4px 6px;color:#111;" colspan="2">Tổng lưu lượng quạt</td>
              <td style="border:1px solid #ddd;padding:4px;text-align:right;color:#b45309;">${totalFlow.toFixed(0)} m³/h</td>
              <td style="border:1px solid #ddd;padding:4px;color:#111;" colspan="4"></td>
            </tr></tfoot>
          </table>
          <p style="font-size:9px;color:#64748b;margin:0 0 10px;">⚠ Model quạt tham khảo catalog thị trường VN, cột áp là giá trị mặc định/ước tính (chưa tính tổn thất ma sát ống gió chi tiết) — kỹ sư cần xác nhận cột áp thực tế theo bảng nhánh ống gió và xác nhận model với nhà sản xuất trước khi chọn thiết bị chính thức.</p>`;
        })()}
        ${(App.state.branches||[]).length?`
        <!-- Bảng nhánh ống gió -->
        <h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Bảng nhánh ống gió</h3>
        <table style="width:100%;font-size:10px;border-collapse:collapse;margin-bottom:10px;color:#111;">
          <thead><tr style="background:#f1f5f9;color:#111;"><th style="border:1px solid #ddd;padding:4px;color:#111;">Tên nhánh</th><th style="border:1px solid #ddd;padding:4px;color:#111;">Q(m³/h)</th><th style="border:1px solid #ddd;padding:4px;color:#111;">v(m/s)</th><th style="border:1px solid #ddd;padding:4px;color:#111;">Kích thước</th><th style="border:1px solid #ddd;padding:4px;color:#111;">ΔP ma sát(Pa)</th></tr></thead>
          <tbody>${branchRows}</tbody>
        </table>`:''}
        <!-- Chẩn đoán — bảng checklist đầy đủ (hiện MỌI hạng mục kiểm tra, không chỉ
             hạng mục lỗi) theo đúng kiểu báo cáo Cold Storage Heat Load Calculator bạn
             tham khảo: mỗi hạng mục luôn có 1 dòng, cột "Kết quả" hiện ✓Đạt / ⚠/✗ kèm chi
             tiết cụ thể — giúp người thẩm định thấy rõ ĐàCÓ kiểm tra hạng mục đó, không
             chỉ suy đoán từ việc "không thấy báo lỗi". -->
        <h3 style="margin:8px 0 5px;font-size:12px;color:#0f172a;">Chẩn đoán &amp; Kiểm tra</h3>
        ${(()=>{
          const allFlags = [...d.flags];
          // FIX: cảnh báo từ calcBuildingTypeAirflow() (vd ACH_FRESH_MIN) chỉ được gộp vào
          // d.flags (App.state.results.diagnostics) khi bấm "Tính toán tất cả" — bấm "Tính"
          // riêng từng phòng thì cảnh báo bị kẹt trên r._airflow.warnings, không bao giờ tới
          // được báo cáo. Đọc trực tiếp từ từng phòng ở đây để checklist luôn đúng bất kể
          // người dùng tính theo cách nào (giống cách đã làm với _partitionWarnings).
          rooms.forEach(r=>(r._airflow?.warnings||[]).forEach(w=>{
            const tag=`[${r.name||'?'}] ${w.msg}`;
            if(!allFlags.some(f=>f.msg===tag)) allFlags.push({level:w.level, code:w.code, msg:tag});
          }));
          rooms.forEach(r=>(r._partitionWarnings||[]).forEach(w=>allFlags.push({level:'yellow',code:'PARTITION',msg:`[${r.name||'?'}] ${w}`})));
          const byCode = code => allFlags.filter(f=>f.code===code || (code==='PARTITION'&&f.code==='PARTITION'));
          const rowFor = (label, code, passMsg) => {
            const hits = byCode(code);
            if(!hits.length) return `<tr><td style="border:1px solid #ddd;padding:4px 8px;color:#111;">${label}</td><td style="border:1px solid #ddd;padding:4px 8px;color:#059669;">✓ Đạt${passMsg?' — '+passMsg:''}</td></tr>`;
            return hits.map(f=>`<tr><td style="border:1px solid #ddd;padding:4px 8px;color:#111;">${label}</td><td style="border:1px solid #ddd;padding:4px 8px;color:${f.level==='red'?'#dc2626':'#d97706'};">${f.level==='red'?'✗':'⚠'} ${f.msg}</td></tr>`).join('');
          };
          const knownCodes = ['MISS_AREA','RETURN_NEG','ACH_OUT','ACH_LOW','MOTOR_LOW_FL','FRESH_MIN','ACH_FRESH_MIN','PARTITION'];
          const rowsHtml = [
            rowFor('Diện tích sàn hợp lệ (đã nhập L×W hoặc diện tích tuỳ chỉnh)', 'MISS_AREA'),
            rowFor('Gió hồi không âm (Q_hồi ≥ 0)', 'RETURN_NEG'),
            rowFor('ACH nằm trong dải khuyến nghị theo loại phòng', 'ACH_OUT'),
            rowFor('ACH áp dụng ≥ khuyến nghị tối thiểu', 'ACH_LOW'),
            rowFor('ACH gió tươi đạt yêu cầu riêng (phòng y tế theo ASHRAE 170, nếu có)', 'ACH_FRESH_MIN'),
            rowFor('Gió tươi đạt yêu cầu tối thiểu ASHRAE 62.1 (theo người/diện tích)', 'FRESH_MIN'),
            rowFor('Motor không chạy non tải (FL ≥ 0.5)', 'MOTOR_LOW_FL'),
            rowFor('Vách ngăn nội bộ — đủ dữ liệu U/nhiệt độ phòng kề (không dùng mặc định)', 'PARTITION'),
          ].join('');
          // Các cảnh báo khác không nằm trong danh sách mã đã biết (đề phòng thêm code mới
          // sau này mà quên cập nhật bảng checklist) — vẫn hiện đầy đủ, không bị bỏ sót.
          const otherFlags = allFlags.filter(f=>!knownCodes.includes(f.code));
          const otherRows = otherFlags.map(f=>`<tr><td style="border:1px solid #ddd;padding:4px 8px;color:#111;">${f.code||'Khác'}</td><td style="border:1px solid #ddd;padding:4px 8px;color:${f.level==='red'?'#dc2626':'#d97706'};">${f.level==='red'?'✗':'⚠'} ${f.msg}</td></tr>`).join('');
          return `<table style="width:100%;font-size:10px;border-collapse:collapse;margin-bottom:10px;color:#111;">
            <thead><tr style="background:#f1f5f9;color:#111;"><th style="border:1px solid #ddd;padding:4px 8px;text-align:left;width:55%;color:#111;">Hạng mục</th><th style="border:1px solid #ddd;padding:4px 8px;text-align:left;color:#111;">Kết quả</th></tr></thead>
            <tbody>${rowsHtml}${otherRows}</tbody>
          </table>`;
        })()}
        <!-- Khối ký xác nhận — chuẩn hồ sơ thiết kế kỹ thuật VN -->
        <table style="width:100%;margin-top:24px;border-collapse:collapse;page-break-inside:avoid;color:#111;">
          <tr>
            <td style="width:33%;text-align:center;padding:0 8px;color:#111;">
              <div style="font-size:10px;font-weight:bold;color:#0f172a;">NGƯỜI LẬP</div>
              <div style="font-size:9px;color:#64748b;">(Ký, ghi rõ họ tên)</div>
              <div style="height:60px;color:#111;"></div>
              <div style="border-top:1px solid #94a3b8;padding-top:3px;font-size:10px;color:#111;">${repEngineer!=='—'?repEngineer:'.....................'}</div>
            </td>
            <td style="width:33%;text-align:center;padding:0 8px;color:#111;">
              <div style="font-size:10px;font-weight:bold;color:#0f172a;">KIỂM TRA</div>
              <div style="font-size:9px;color:#64748b;">(Ký, ghi rõ họ tên)</div>
              <div style="height:60px;color:#111;"></div>
              <div style="border-top:1px solid #94a3b8;padding-top:3px;font-size:10px;color:#111;">.....................</div>
            </td>
            <td style="width:33%;text-align:center;padding:0 8px;color:#111;">
              <div style="font-size:10px;font-weight:bold;color:#0f172a;">PHÊ DUYỆT</div>
              <div style="font-size:9px;color:#64748b;">(Ký, ghi rõ họ tên)</div>
              <div style="height:60px;color:#111;"></div>
              <div style="border-top:1px solid #94a3b8;padding-top:3px;font-size:10px;color:#111;">.....................</div>
            </td>
          </tr>
        </table>
        <div style="margin-top:14px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:9px;color:#6b7f96;">Tạo bởi: MultiHVAC Calculator · Created by Quocde · Ver 2606.22.01 — Kết quả tính toán tham khảo, kỹ sư chịu trách nhiệm xác nhận trước khi thi công.</div>
      </div>`;
    },

    async exportPDF(scope='all'){
      // Lọc rooms theo scope
      const allRooms=App.state.hlRooms||[];
      let rooms;
      if(scope==='all'){ rooms=allRooms; }
      else if(scope.startsWith('floor:')){
        const fid=scope.slice(6);
        rooms=allRooms.filter(r=>r.floorId===fid||(fid==='fl1'&&!r.floorId));
      } else if(scope.startsWith('room:')){
        const rid=scope.slice(5);
        rooms=allRooms.filter(r=>r.id===rid);
      } else { rooms=allRooms; }
      const scopeLabel=scope==='all'?'Toàn bộ dự án':scope.startsWith('floor:')?
        (App.state.floors||[]).find(f=>f.id===scope.slice(6))?.name||'Tầng':
        allRooms.find(r=>r.id===scope.slice(5))?.name||'Phòng';
      App.state._exportRooms=rooms; App.state._exportScopeLabel=scopeLabel;
      return this._exportPDF_impl();
    },
    async _exportPDF_impl(){
      const preview = document.getElementById('report-preview');
      preview.innerHTML = this.buildPreviewHtml();
      App.ui.toast('info','Đang tạo PDF...');
      try{
        // FIX (nguyên nhân THẬT của lỗi "chữ nhạt/trắng" trong PDF — xác nhận qua debug file
        // PDF thực tế người dùng gửi): html2canvas được gọi NGAY LẬP TỨC sau khi set
        // innerHTML, không đợi trình duyệt vẽ (paint) xong nội dung vừa chèn vào. Với báo cáo
        // dài, nhiều bảng lồng nhau, trình duyệt cần vài chục mili-giây để tính toán style/
        // layout cho toàn bộ DOM mới — html2canvas đọc style TẠI THỜI ĐIỂM CHỤP, nếu chụp
        // quá sớm sẽ đọc phải style CHƯA HOÀN TẤT (mặc định/rỗng), khiến chữ hiện gần như
        // trắng — càng ở CUỐI trang (trình duyệt xử lý sau) càng dễ bị lỗi nặng hơn, đúng
        // khớp hiện tượng "màu nhạt dần khi xuống dưới" quan sát được trong PDF thật. Đợi 2
        // animation frame (đảm bảo qua ít nhất 1 chu kỳ paint đầy đủ) + ép reflow bằng cách
        // đọc offsetHeight trước khi chụp — cách khắc phục chuẩn, được khuyến nghị rộng rãi
        // cho đúng loại lỗi này của html2canvas.
        void preview.offsetHeight; // ép trình duyệt tính layout ngay lập tức (đồng bộ)
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // Lớp bảo vệ kép: báo cáo càng dài (nhiều bảng, font Google Fonts tùy chỉnh cần tải)
        // càng cần nhiều thời gian style/layout hơn — 2 animation frame có thể chưa đủ trên
        // vài thiết bị yếu/nhiều dữ liệu. Thêm 1 khoảng nghỉ nhỏ cho chắc chắn.
        await new Promise(resolve => setTimeout(resolve, 120));
        const canvas = await html2canvas(preview, {scale:2, backgroundColor:'#ffffff', useCORS:true});
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p','mm','a4');
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgData = canvas.toDataURL('image/png');
        const imgH = canvas.height * pageW / canvas.width;
        let y = 0;
        while(y < imgH){
          if(y>0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH);
          y += pageH;
        }
        pdf.save(`BaoCao_HVAC_${App.state.inputs.projectName||'Draft'}_${new Date().toISOString().slice(0,10)}.pdf`);
        App.ui.toast('ok','Đã xuất PDF.');
      }catch(err){ App.ui.toast('err','Lỗi xuất PDF: '+err.message); }
    },

    exportXLSX(scope='all'){
      const allRooms=App.state.hlRooms||[];
      let rooms;
      if(scope==='all'){ rooms=allRooms; }
      else if(scope.startsWith('floor:')){
        const fid=scope.slice(6);
        rooms=allRooms.filter(r=>r.floorId===fid||(fid==='fl1'&&!r.floorId));
      } else if(scope.startsWith('room:')){
        rooms=allRooms.filter(r=>r.id===scope.slice(5));
      } else { rooms=allRooms; }
      App.state._exportRooms=rooms;
      return this._exportXLSX_impl();
    },
    _exportXLSX_impl(){
      try{
        const wb = XLSX.utils.book_new();
        const I = App.state.inputs;
        const rooms = App.state._exportRooms || App.state.hlRooms || [];

        // Sheet 0: Flags — thông số vượt ngưỡng
        const flaggedRooms=rooms.filter(r=>r._flags&&r._flags.length>0);
        if(flaggedRooms.length>0){
          const flagSheet=[
            ['* THÔNG SỐ CẦN KIỂM TRA (vượt ngưỡng tiêu chuẩn)'],
            ['Phòng','Mức độ','Thông số','Chi tiết','Tiêu chuẩn tham chiếu'],
            ...flaggedRooms.flatMap(r=>r._flags.map(f=>[
              r.name||'—',
              f.severity==='error'||f.level==='red'?'⛔ LỖI':'⚠ CẢNH BÁO',
              f.field||'—',
              f.msg||f.code||'—',
              'ASHRAE 62.1-2022 / ISO 14644-1:2015'
            ]))
          ];
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flagSheet), 'Flags_CanhBao');
        }

        // Sheet 0: Cơ sở thiết kế
        const stdSet=new Set();
        const methodSet=new Set();
        rooms.forEach(r=>{
          const bt=(App.data.BUILDING_TYPES||[]).find(b=>b.id===r.buildingType);
          if(bt?.stdRef) bt.stdRef.split(';').forEach(s=>stdSet.add(s.trim()));
          if(r.classSystem==='ISO') stdSet.add('ISO 14644-1:2015 (Cleanroom)');
          if(r.classSystem==='GMP') stdSet.add('EU GMP Annex 1:2022 (Pharmaceutical)');
          if(r._airflow?.modeNote) methodSet.add(r._airflow.modeNote.slice(0,80));
        });
        ['ASHRAE 62.1-2022','ASHRAE HOF 2021','QCVN 02:2022/BXD','TCVN 5687:2010',
         'IEC 60034-30-1 IE3 (Motor efficiency)','ISO 6946:2017 (U-value calculation)'].forEach(s=>stdSet.add(s));
        methodSet.add('CLTD/CLF Method: ASHRAE HOF 2001 Ch.29');
        if((App.state.branches||[]).length>0) methodSet.add('Duct sizing: Darcy-Weisbach (SMACNA HVAC Duct Design)');
        const cosBasis=[
          ['CƠ SỞ THIẾT KẾ — BASIS OF DESIGN'],[''],
          ['I. TIÊU CHUẨN ÁP DỤNG'],
          ...[...stdSet].sort().map(s=>['• '+s]),
          [''],
          ['II. PHƯƠNG PHÁP TÍNH TOÁN'],
          ...[...methodSet].sort().map(m=>['• '+m]),
          [''],
          ['III. THÔNG SỐ THAM KHẢO THỰC TẾ (không có giá trị pháp lý)'],
          ['• FCU/AHU catalog — dải công suất tham khảo thị trường VN 2024, xác nhận với nhà sản xuất'],
          ['• Đơn giá BOM (VND) — tham khảo thị trường 2024, sai số ±30-50%'],
          ['• Hệ số ζ phụ kiện ống gió — giá trị trung bình SMACNA, tra đồ thị để chính xác'],
          ['• Mật độ tải IT kW/m² DC Rack — ước tính, đo thực tế để thiết kế chính xác'],
          [''],
          ['III. LƯU Ý PHÁP LÝ'],
          ['• Thông số tham khảo thực tế (FCU catalog, đơn giá VND) không có giá trị pháp lý.'],
          ['• Kỹ sư phải xác nhận với catalog nhà sản xuất trước khi chọn thiết bị.'],
          ['• Số liệu khí hậu: QCVN 02:2022/BXD. Một số tỉnh dùng trạm gần nhất.'],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cosBasis), 'Co_So_Thiet_Ke');

        // Sheet 1: Tổng quan dự án
        const totalCoil = rooms.reduce((s,r)=>s+(r._coil?.qCoilKW||0),0);
        const totalSupply= rooms.reduce((s,r)=>s+(r._af?.L_supply||0),0);
        const totalFresh = rooms.reduce((s,r)=>s+(r._af?.L_fresh||0),0);
        const totalFloor = rooms.reduce((s,r)=>s+((r.L||0)*(r.W||0)),0);
        const summary = [
          ['MultiHVAC Calculator — Báo cáo tính toán phụ tải nhiệt'],
          ['Tên dự án', I.projectName||'—'],
          ['Khách hàng', I.client||I.customer||'—'],
          ['Địa chỉ', I.address||'—'],
          ['Kỹ sư thiết kế', I.engineer||I.performer||'—'],
          ['Ngày thực hiện', I.date||I.execDate||'—'],
          ['Mã dự án', I.projectCode||'—'],
          [],
          ['KPI Tổng hợp', 'Giá trị', 'Đơn vị'],
          ['Số phòng', rooms.length, 'phòng'],
          ['Diện tích sàn tổng', totalFloor.toFixed(0), 'm²'],
          ['Tổng lạnh coil', totalCoil.toFixed(2), 'kW'],
          ['Tổng lạnh coil', (totalCoil/3.517).toFixed(2), 'TR'],
          ['Tổng gió cấp', totalSupply.toFixed(0), 'm³/h'],
          ['Tổng gió tươi', totalFresh.toFixed(0), 'm³/h'],
          ['% Gió tươi / Cấp', totalSupply>0?((totalFresh/totalSupply)*100).toFixed(1):0, '%'],
          ['W/m² sàn', totalFloor>0?(totalCoil*1000/totalFloor).toFixed(0):'-', 'W/m²'],
        ];
        const wsSum = XLSX.utils.aoa_to_sheet(summary);
        XLSX.utils.book_append_sheet(wb, wsSum, 'Tong_Quan');

        // Sheet 2: Chi tiết từng phòng (per-room heat load)
        if(rooms.length > 0){
          const roomHeader = [
            'Tên phòng','Loại TB','Dài(m)','Rộng(m)','Cao(m)','S.sàn(m²)','Thể tích(m³)',
            'ACH(h⁻¹)','Số người','T cấp(°C)',
            'L_cấp(m³/h)','L_hồi(m³/h)','L_tươi(m³/h)','Warn',
            'Q_vách(kW)','Q_mái(kW)','Q_sàn(kW)','Q_vách_ngăn(kW)',
            'Q_kính(kW)','Q_người_s(kW)','Q_đèn(kW)','Q_fr_s(kW)',
            'Q_hiện_tổng(kW)','Q_ẩn(kW)','SHR',
            'Q_coil(kW)','Q_coil(TR)','Reheat(kW)','Loại TB'
          ];
          const roomData = rooms.map(r=>{
            const hl=App.ui.heatload;
            const floorM2=(hl?._calcArea?.(r))||((r.L||0)*(r.W||0));
            const volM3=(hl?._calcVol?.(r))||((r.L||0)*(r.W||0)*(r.H||0));
            const partQ=(r._partitionDetails||[]).reduce((s,d)=>s+(d.Q_W||0),0)/1000;
            return [
              r.name||'—', r.equipType||'—',
              r.L||0, r.W||0, r.H||0,
              floorM2.toFixed(1), volM3.toFixed(1),
              r.achApplied||0, r.nPeople||0, r.tSupplyDesign||14,
              r._af?.L_supply.toFixed(0)||'',
              r._af?.L_return.toFixed(0)||'',
              r._af?.L_fresh.toFixed(0)||'',
              r._af?.warn||'OK',
              r._ev?(r._ev.Q_wall/1000).toFixed(3):'',
              r._ev?(r._ev.Q_roof/1000).toFixed(3):'0',
              r._ev?(r._ev.Q_floor/1000).toFixed(3):'0',
              partQ.toFixed(3),
              r._ev?(r._ev.Q_solar/1000).toFixed(3):'',
              r._ev?(r._ev.Q_ps/1000).toFixed(3):'',
              r._ev?(r._ev.Q_light/1000).toFixed(3):'',
              r._ev?(r._ev.Q_fresh_s/1000).toFixed(3):'',
              r._ev?(r._ev.Q_sensible/1000).toFixed(3):'',
              r._ev?(r._ev.Q_latent/1000).toFixed(3):'',
              r._ev?((r._ev.Q_sensible/(r._ev.Q_sensible+r._ev.Q_latent+0.001))).toFixed(3):'',
              (r._coil?.qCoilKW||0).toFixed(3),
              ((r._coil?.qCoilKW||0)/3.517).toFixed(3),
              (r._coil?.qReheatKW||0).toFixed(3),
              r._coil?.type||''
            ];
          });
          const wsRooms = XLSX.utils.aoa_to_sheet([roomHeader, ...roomData]);
          XLSX.utils.book_append_sheet(wb, wsRooms, 'Chi_Tiet_Phong');

        // Sheet: Equipment Schedule
        if(rooms.filter(r=>r._coil?.qCoilKW>0).length>0){
          const eqHeader=['Phòng','Loại phòng','Phương pháp gió','Q_coil(kW)','Model đề xuất','SL','Tổng CS(kW)','Hiệu suất sử dụng(%)','Lưu lượng(m³/h)','Ghi chú'];
          const eqData=rooms.filter(r=>r._coil?.qCoilKW>0).map(r=>{
            // FCU_OA: chọn model theo phần coil FCU riêng (qCoilFcuKW), không theo tổng qCoilKW
            // (đã gồm cả phần thiết bị xử lý gió tươi riêng — không nằm trong catalog FCU/AHU/PAU)
            const qSel = r.equipType==='FCU_OA' ? (r._coil.qCoilFcuKW??r._coil.qCoilKW) : r._coil.qCoilKW;
            const sel=App.calc.selectEquipAuto({qCoilKW:qSel,equipType:r.equipType,designMarginPct:10});
            if(!sel) return [r.name,'VENT','—','Không cần coil','','','','',''];
            return [r.name,r.buildingType||'—',(r._airflow?.modeNote||'general').slice(0,40),(r._coil.qCoilKW).toFixed(2),sel.model.name,sel.qty,(sel.totalCapKW).toFixed(1),sel.utilization,(sel.model.airflowM3h*(sel.qty||1)).toString(),sel.warning||sel.model.note||''];
          });
          eqData.push(['','','','','','','','','⚠ Catalog tham chiếu thị trường VN 2024. Xác nhận với nhà sản xuất trước khi chọn thiết bị.']);
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([eqHeader,...eqData]), 'Equipment_Schedule');
        }

        // Sheet: BOM sơ bộ
        const bom=App.calc.generateBOM(rooms, App.state.ductBranches||App.state.branches||[], App.state.hlEquipGroups||[]);
        if(bom?.items?.length>0){
          const bomHeader=['Hạng mục','Mô tả','Đơn vị','Khối lượng','Đơn giá (VND)','Thành tiền (VND)'];
          const bomData=bom.items.map(b=>[b.cat,b.item,b.unit,b.qty.toFixed(0),b.rate.toLocaleString(),b.cost.toLocaleString()]);
          bomData.push(['','','','','TỔNG CỘNG (VND):',bom.totalVND.toLocaleString()]);
          bomData.push(['','','','','TỔNG CỘNG (triệu VND):',bom.totalMVND]);
          bomData.push(['GHI CHÚ',bom.note,'','','','']);
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([bomHeader,...bomData]), 'BOM_So_Bo');
        }
        }

        // Sheet 3: Motor heat gain
        if((App.state.hlMotors||[]).length > 0){
          const motHeader = ['Tên motor','P(kW)','SL','Phương pháp','Vị trí TH','FL','FU','VFD','Q tỏa(kW)'];
          const motData = App.state.hlMotors.map(m=>[m.name||'',m.pKw||0,m.qty||1,m.method||'A',m.position||'TH1',m.FL||1,m.FU||1,m.hasVFD?'Có':'Không',m._qKW?.toFixed(3)||'']);
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([motHeader,...motData]), 'Motor_Heat');
        }

        // Sheet 4b: Tải ký sinh
        if((App.state.hlParasitic||[]).length > 0){
          const paraHeader=['Tên','Loại','Phòng gán','Q tỏa/hút(kW)','Ghi chú'];
          const paraData=(App.state.hlParasitic||[]).map(p=>{
            const rName=App.state.hlRooms?.find(r=>r.id===p.roomId)?.name||'Chưa gán';
            const qKW=p._qW!=null?(p._qW/1000).toFixed(3):'—';
            const sign=(p._qW||0)<0?'Hút lạnh (âm)':'Tỏa nhiệt (dương)';
            return [p.name||'',p.type||'',rName,qKW,sign];
          });
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([paraHeader,...paraData]), 'Tai_Ky_Sinh');
        }

        // Sheet 5: Ống gió
        if((App.state.branches||[]).length > 0){
          const ductHeader = ['Tên nhánh','Q(m³/h)','v(m/s)','Hình dạng','Vật liệu','Cách nhiệt','L(m)','Kích thước','ΔP ma sát(Pa)','NC','Đọng sương'];
          const ductData = (App.state.branches||[]).map(b=>[
            b.name||'',b.qM3h||0,b.vMs||0,b.shape||'',b.materialId||'',b.insulationId||'',b.lengthM||0,
            b._result?.dimsLabel||'',b._result?.frictionPa.toFixed(0)||'',b._result?.nc||'',b._result?.condensationRisk?'Có nguy cơ':'Không'
          ]);
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([ductHeader,...ductData]), 'Ong_Gio');
        }

        XLSX.writeFile(wb, `BaoCao_HVAC_${I.projectName||'Draft'}_${new Date().toISOString().slice(0,10)}.xlsx`);
        App.ui.toast('ok',`Đã xuất Excel: ${rooms.length} phòng, ${(App.state.branches||[]).length} nhánh ống.`);
      }catch(err){ App.ui.toast('err','Lỗi xuất Excel: '+err.message); }
    }
  };

  // ============== INIT ==============
  App.bootstrap = async function(){
    try{
      const saved = JSON.parse(localStorage.getItem('multihvac_settings')||'{}');
      if(saved.lang) App.state.lang = saved.lang;
      if(saved.unit) App.state.unit = saved.unit;
      if(saved.apiKey) App.state.settings.apiKey = saved.apiKey;
      // Danh mục loại phòng tự thêm/ẩn — lưu ở cấp global (localStorage), không theo
      // từng dự án, vì đây là catalog dùng chung cho mọi dự án. Xem admin.saveRoomTypesSettings()
      if(Array.isArray(saved.customBuildingTypes)) App.state.customBuildingTypes = saved.customBuildingTypes;
      if(Array.isArray(saved.hiddenBuildingTypeIds)) App.state.hiddenBuildingTypeIds = saved.hiddenBuildingTypeIds;
      // Danh mục vật liệu (tường/kính/ống gió/cách nhiệt/cửa) tự thêm/ẩn — cùng cơ chế
      // global settings như trên. Xem App.admin.saveRoomTypesSettings() + MATERIAL_CATALOGS_META.
      if(saved.customMaterials && typeof saved.customMaterials==='object') App.state.customMaterials = saved.customMaterials;
      if(saved.hiddenMaterialIds && typeof saved.hiddenMaterialIds==='object') App.state.hiddenMaterialIds = saved.hiddenMaterialIds;
    }catch(e){}
    App.state.elecDevices = App.state.elecDevices || [];
    App.state.branches = App.state.branches || [];
    App.state.localExhaust = App.state.localExhaust || [];
    App.state.workshopDoors = App.state.workshopDoors || [];
    App.state.hlRooms    = App.state.hlRooms    || [];
    App.state.hlMotors   = App.state.hlMotors   || [];
    App.state.hlCalcMode = App.state.hlCalcMode || 'Peak';
    App.state.hlParasitic= App.state.hlParasitic|| [];
    App.state.hlEquipGroups = App.state.hlEquipGroups || [];
    // Danh mục loại phòng do người dùng tự thêm (persist qua localStorage, xem
    // App.admin.saveRoomTypesSettings()) — merge vào BUILDING_TYPES giống EXTRA_BUILDING_TYPES
    App.state.customBuildingTypes = App.state.customBuildingTypes || [];
    // Danh sách id loại phòng built-in bị người dùng "ẩn" khỏi dropdown chọn (không xóa
    // dữ liệu gốc — phòng đã tạo trước đó bằng loại này vẫn tính toán bình thường)
    App.state.hiddenBuildingTypeIds = App.state.hiddenBuildingTypeIds || [];
    // Merge extra building types if not already present
    if(App.data.EXTRA_BUILDING_TYPES){
      App.data.EXTRA_BUILDING_TYPES.forEach(bt=>{
        if(!App.data.BUILDING_TYPES.find(x=>x.id===bt.id)) App.data.BUILDING_TYPES.push(bt);
      });
    }
    App.state.customBuildingTypes.forEach(bt=>{
      if(!App.data.BUILDING_TYPES.find(x=>x.id===bt.id)) App.data.BUILDING_TYPES.push(bt);
    });
    // Danh mục vật liệu tự thêm — merge vào các mảng dữ liệu gốc theo MATERIAL_CATALOGS_META
    App.state.customMaterials = App.state.customMaterials || {};
    App.state.hiddenMaterialIds = App.state.hiddenMaterialIds || {};
    Object.keys(App.data.MATERIAL_CATALOGS_META||{}).forEach(catKey=>{
      const meta = App.data.MATERIAL_CATALOGS_META[catKey];
      App.state.customMaterials[catKey] = App.state.customMaterials[catKey] || [];
      App.state.hiddenMaterialIds[catKey] = App.state.hiddenMaterialIds[catKey] || [];
      const arr = App.data[meta.arrayName];
      if(!arr) return;
      App.state.customMaterials[catKey].forEach(item=>{
        if(!arr.find(x=>x[meta.idField]===item[meta.idField])) arr.push(item);
      });
    });
    await App.db.init();
    App.ui.init();
    App.cmd.init();
    App.kbd.init();
    App.ui.applyI18n();
  };
  document.addEventListener('DOMContentLoaded', ()=> App.bootstrap());
  /*INIT*/
})();
