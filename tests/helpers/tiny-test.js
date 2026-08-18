// tiny-test.js — Bộ "chạy test" tối giản, không cần cài thêm thư viện test nào khác.
// Mỗi file test gọi test(tên, hàm) cho từng trường hợp cần kiểm tra; hàm đó dùng
// assertEqual/assertClose/assertTrue để khẳng định kết quả đúng. Cuối cùng gọi
// summary() để in ra tổng kết PASS/FAIL và thoát với mã lỗi nếu có test nào fail
// (mã lỗi khác 0 để dùng được trong CI — quy trình kiểm tra tự động trên GitHub sau này).

let results = [];
let currentSuite = '(chung)';

function suite(name, fn){
  currentSuite = name;
  fn();
  currentSuite = '(chung)';
}

async function test(name, fn){
  const full = `[${currentSuite}] ${name}`;
  try{
    await fn();
    results.push({ name: full, pass: true });
  }catch(err){
    results.push({ name: full, pass: false, error: err.message });
  }
}

function assertEqual(actual, expected, msg){
  if(actual !== expected){
    throw new Error(`${msg||'assertEqual thất bại'}: mong đợi ${JSON.stringify(expected)}, thực tế ${JSON.stringify(actual)}`);
  }
}

function assertTrue(cond, msg){
  if(!cond) throw new Error(msg || 'assertTrue thất bại: điều kiện là false');
}

// So sánh số thực với sai số cho phép (bắt buộc cho vật lý/công thức dấu phẩy động —
// không bao giờ so sánh số thực bằng === tuyệt đối).
function assertClose(actual, expected, tolerance, msg){
  const diff = Math.abs(actual - expected);
  if(diff > tolerance){
    throw new Error(`${msg||'assertClose thất bại'}: mong đợi ${expected} ± ${tolerance}, thực tế ${actual} (lệch ${diff.toFixed(4)})`);
  }
}

function summary(){
  const passed = results.filter(r=>r.pass);
  const failed = results.filter(r=>!r.pass);
  console.log('');
  console.log('═'.repeat(60));
  failed.forEach(r=>{
    console.log(`✗ FAIL — ${r.name}`);
    console.log(`  ${r.error}`);
  });
  if(failed.length===0){
    console.log(`✓ TẤT CẢ ${passed.length} TEST ĐỀU PASS`);
  } else {
    console.log(`✗ ${failed.length}/${results.length} TEST FAIL — ${passed.length} PASS`);
  }
  console.log('═'.repeat(60));
  process.exitCode = failed.length > 0 ? 1 : 0;
}

module.exports = { suite, test, assertEqual, assertTrue, assertClose, summary };
