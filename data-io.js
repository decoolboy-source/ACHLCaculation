/* DataIO — Xuất/Nhập dữ liệu dùng chung cho các PWA trên decoolboy-source.github.io.
   Xử lý hoàn toàn trên trình duyệt: đọc/ghi file JSON trên máy người dùng, không gửi dữ liệu đi đâu.
   File xuất: <ten-repo>_YYYYMMDD.json = { app, schemaVersion, exportedAt, projectCount, data }.
   Khi nhập: kiểm tra định dạng, app, schemaVersion TRƯỚC khi ghi; báo số dự án; hỏi Gộp/Thay thế; xác nhận. */
window.DataIO = window.DataIO || (function () {
  'use strict';

  function stamp(d) {
    d = d || new Date();
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }

  function download(filename, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function pickFile() {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json'; input.style.display = 'none';
      input.addEventListener('change', function () { resolve(input.files && input.files[0] || null); input.remove(); });
      document.body.appendChild(input); input.click();
    });
  }

  // ── Hộp thoại nội bộ (không dùng confirm()/alert() của trình duyệt) ──
  var STYLE_ID = 'dataio-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = '' +
      '.dataio-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(5,12,20,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.dataio-box{background:#fff;color:#14202e;max-width:30rem;width:100%;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.35);padding:20px 20px 16px}' +
      '.dataio-box h2{margin:0 0 8px;font-size:1.1rem;line-height:1.3}' +
      '.dataio-box .dataio-msg{margin:0 0 16px;font-size:.95rem;line-height:1.55;white-space:pre-line}' +
      '.dataio-btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}' +
      '.dataio-btns button{font:inherit;font-size:.92rem;font-weight:600;padding:.5rem 1rem;border-radius:8px;border:1px solid #b9c6d4;background:#fff;color:#14202e;cursor:pointer}' +
      '.dataio-btns button.p{background:#0a6ebd;border-color:#0a6ebd;color:#fff}' +
      '.dataio-btns button.d{background:#fff;border-color:#c0392b;color:#c0392b}' +
      '@media (prefers-color-scheme:dark){.dataio-box{background:#16202b;color:#e3eaf2}.dataio-btns button{background:#1d2a38;color:#e3eaf2;border-color:#33465a}' +
      '.dataio-btns button.p{background:#3d9be0;border-color:#3d9be0;color:#06131f}.dataio-btns button.d{background:#1d2a38;color:#ff8a7a;border-color:#ff8a7a}}';
    var st = document.createElement('style'); st.id = STYLE_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  /* buttons: [{label, value, kind:'p'|'d'|''}] → Promise<value> (Esc hoặc bấm nền = nút cuối cùng) */
  function dialog(title, message, buttons) {
    ensureStyle();
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'dataio-ov';
      var box = document.createElement('div'); box.className = 'dataio-box';
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
      var h = document.createElement('h2'); h.textContent = title;
      var p = document.createElement('p'); p.className = 'dataio-msg'; p.textContent = message;
      var row = document.createElement('div'); row.className = 'dataio-btns';
      function close(v) { document.removeEventListener('keydown', onKey); ov.remove(); resolve(v); }
      function onKey(e) { if (e.key === 'Escape') close(buttons[buttons.length - 1].value); }
      buttons.forEach(function (b) {
        var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = b.label;
        if (b.kind) btn.className = b.kind;
        btn.addEventListener('click', function () { close(b.value); });
        row.appendChild(btn);
      });
      ov.addEventListener('click', function (e) { if (e.target === ov) close(buttons[buttons.length - 1].value); });
      document.addEventListener('keydown', onKey);
      box.appendChild(h); box.appendChild(p); box.appendChild(row); ov.appendChild(box);
      document.body.appendChild(ov);
      var first = row.querySelector('button.p') || row.querySelector('button'); if (first) first.focus();
    });
  }
  function info(title, message) { return dialog(title, message, [{ label: 'Đóng', value: true, kind: 'p' }]); }

  /* Đọc và kiểm tra file. Trả về data đã kiểm tra hoặc ném Error với thông báo tiếng Việt. Không ghi gì. */
  function parseFile(text, opts) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('File không phải JSON hợp lệ (có thể bị hỏng hoặc không phải file xuất từ ứng dụng này).'); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('File JSON không đúng định dạng dữ liệu của ' + opts.app + '.');
    if ('app' in obj && 'schemaVersion' in obj) {
      if (obj.app !== opts.app) throw new Error('File này được xuất từ ứng dụng "' + obj.app + '", không phải ' + opts.app + '.');
      if (obj.schemaVersion !== opts.schemaVersion) {
        throw new Error('File có phiên bản dữ liệu ' + obj.schemaVersion + ', ứng dụng này đọc phiên bản ' + opts.schemaVersion +
          '. Hãy cập nhật ứng dụng lên bản mới nhất rồi thử lại.');
      }
      if (!obj.data || typeof obj.data !== 'object') throw new Error('File thiếu phần dữ liệu (data).');
      return obj.data;
    }
    // File sao lưu kiểu cũ của chính app (trước khi có trường app/schemaVersion)
    if (opts.legacy) {
      var legacy = opts.legacy(obj);
      if (legacy) return legacy;
    }
    throw new Error('File thiếu trường "app"/"schemaVersion" — không phải file xuất dữ liệu của ' + opts.app + '.');
  }

  /* opts: { app, schemaVersion, collect: async () => ({ data, projectCount }),
             save?: async (filename, payload) => void   // thay cách lưu file mặc định (VD bản đóng gói app gốc) } */
  async function exportData(opts) {
    try {
      var r = await opts.collect();
      var filename = opts.app + '_' + stamp() + '.json';
      var payload = { app: opts.app, schemaVersion: opts.schemaVersion, exportedAt: new Date().toISOString(),
        projectCount: r.projectCount, data: r.data };
      if (opts.save) await opts.save(filename, payload); else download(filename, payload);
      await info('Đã xuất dữ liệu', 'Đã tải về file "' + filename + '" gồm ' + r.projectCount + ' dự án.\n' +
        'File chỉ nằm trên máy của anh/chị; ứng dụng không gửi dữ liệu đi đâu.');
    } catch (e) {
      await info('Không xuất được dữ liệu', String(e && e.message || e));
    }
  }

  /* opts: { app, schemaVersion, legacy?(obj)->data|null,
             describe(data) -> { count, text }   (ném Error nếu cấu trúc sai),
             mergeNote, replaceNote,
             apply: async (data, mode) => void,  // mode: 'merge' | 'replace'
             after?: () => void } */
  async function importData(opts) {
    var file = await pickFile();
    if (!file) return;
    var data, d;
    try {
      var text = await file.text();
      data = parseFile(text, opts);
      d = opts.describe(data);
    } catch (e) {
      await info('Không nhập được dữ liệu', String(e && e.message || e) + '\n\nKhông có dữ liệu nào bị thay đổi.');
      return;
    }
    if (!d.count) {
      await info('File không có dự án', 'File "' + file.name + '" không chứa dự án nào để nhập.\n\nKhông có dữ liệu nào bị thay đổi.');
      return;
    }
    var mode = await dialog('Nhập dữ liệu',
      'File "' + file.name + '" có ' + d.text + '.\n\nChọn cách nhập:\n' +
      '• Gộp: ' + opts.mergeNote + '\n• Thay thế: ' + opts.replaceNote,
      [{ label: 'Gộp', value: 'merge', kind: 'p' }, { label: 'Thay thế', value: 'replace', kind: 'd' }, { label: 'Hủy', value: null }]);
    if (!mode) return;
    var ok = await dialog('Xác nhận nhập dữ liệu',
      (mode === 'replace'
        ? 'THAY THẾ: dữ liệu dự án hiện có sẽ bị thay bằng ' + d.text + ' trong file. Không hoàn tác được.\n' +
          'Nên xuất dữ liệu hiện tại ra file trước khi tiếp tục.'
        : 'GỘP: thêm ' + d.text + ' vào dữ liệu hiện có.') + '\n\nTiếp tục?',
      [{ label: mode === 'replace' ? 'Thay thế' : 'Gộp', value: true, kind: mode === 'replace' ? 'd' : 'p' }, { label: 'Hủy', value: false }]);
    if (!ok) return;
    try {
      await opts.apply(data, mode);
    } catch (e) {
      await info('Lỗi khi ghi dữ liệu', String(e && e.message || e));
      return;
    }
    await info('Đã nhập dữ liệu', 'Đã ' + (mode === 'replace' ? 'thay thế bằng ' : 'gộp ') + d.text + '.');
    if (opts.after) opts.after();
  }

  /* Bộ chuyển đổi cho app lưu "một phiếu dự án" trong localStorage (các app tra cứu thiết bị):
     cfg = { listKey, objKeys: { tên: khóa localStorage }, itemId(item) -> chuỗi định danh thiết bị }
     data = { equipment: [...], <tên>: {...} } */
  function singleProjectAdapter(cfg) {
    var names = Object.keys(cfg.objKeys);
    function read(k, fb) {
      try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; } catch (e) { return fb; }
    }
    function hasValues(o) {
      return Object.keys(o || {}).some(function (k) { return o[k] !== '' && o[k] != null && o[k] !== false; });
    }
    function countOf(d) { return (d.equipment.length || names.some(function (n) { return hasValues(d[n]); })) ? 1 : 0; }
    return {
      collect: async function () {
        var data = { equipment: read(cfg.listKey, []) };
        names.forEach(function (n) { data[n] = read(cfg.objKeys[n], {}); });
        return { data: data, projectCount: countOf(data) };
      },
      describe: function (d) {
        if (!Array.isArray(d.equipment)) throw new Error('File thiếu danh sách thiết bị (equipment).');
        d.equipment.forEach(function (it) {
          if (!it || typeof it !== 'object' || Array.isArray(it)) throw new Error('Danh sách thiết bị trong file có mục không đúng định dạng.');
        });
        names.forEach(function (n) {
          if (d[n] != null && (typeof d[n] !== 'object' || Array.isArray(d[n]))) throw new Error('Mục "' + n + '" trong file không đúng định dạng.');
        });
        return { count: countOf(d), text: '1 dự án (' + d.equipment.length + ' thiết bị)' };
      },
      mergeNote: 'thêm thiết bị trong file vào danh sách hiện có (bỏ qua thiết bị đã có); thông tin dự án chỉ điền vào ô đang trống.',
      replaceNote: 'danh sách thiết bị và thông tin dự án hiện có được thay bằng nội dung file.',
      apply: async function (d, mode) {
        if (mode === 'replace') {
          localStorage.setItem(cfg.listKey, JSON.stringify(d.equipment));
          names.forEach(function (n) { localStorage.setItem(cfg.objKeys[n], JSON.stringify(d[n] || {})); });
          return;
        }
        var cur = read(cfg.listKey, []), seen = {};
        cur.forEach(function (it) { seen[cfg.itemId(it)] = 1; });
        d.equipment.forEach(function (it) { var k = cfg.itemId(it); if (!seen[k]) { cur.push(it); seen[k] = 1; } });
        localStorage.setItem(cfg.listKey, JSON.stringify(cur));
        names.forEach(function (n) {
          var o = read(cfg.objKeys[n], {}), src = d[n] || {};
          Object.keys(src).forEach(function (f) { if (o[f] === undefined || o[f] === null || o[f] === '') o[f] = src[f]; });
          localStorage.setItem(cfg.objKeys[n], JSON.stringify(o));
        });
      },
      after: function () { location.reload(); }
    };
  }

  return { stamp: stamp, download: download, dialog: dialog, info: info, parseFile: parseFile,
           exportData: exportData, importData: importData, singleProjectAdapter: singleProjectAdapter };
})();
