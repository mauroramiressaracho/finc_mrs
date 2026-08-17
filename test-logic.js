function monthKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
function dateFromMonth(key){const [y,m]=key.split('-').map(Number);return new Date(y,m-1,1)}
function addMonths(key,amount){const d=dateFromMonth(key);d.setMonth(d.getMonth()+amount);return monthKey(d)}
function buildInstallments(p){const rows=[];for(let n=1;n<=p.totalInstallments;n++){const offset=n-p.currentInstallment;rows.push({number:n,competence:addMonths(p.currentMonth,offset),status:n<p.currentInstallment?'paid':n===p.currentInstallment?'current':'future'})}return rows}
const p={totalInstallments:10,currentInstallment:3,currentMonth:'2026-08'};
const rows=buildInstallments(p);
const checks=[
  [rows.length===10,'gera 10 parcelas'],
  [rows[0].competence==='2026-06','parcela 1 volta para junho'],
  [rows[1].competence==='2026-07','parcela 2 volta para julho'],
  [rows[2].competence==='2026-08'&&rows[2].status==='current','parcela 3 é atual em agosto'],
  [rows[9].competence==='2027-03','parcela 10 termina em março/2027'],
  [rows.filter(r=>r.status==='paid').length===2,'marca 2 anteriores como pagas'],
  [rows.filter(r=>r.status==='future').length===7,'gera 7 futuras']
];
let failed=0;for(const [ok,name] of checks){console.log(`${ok?'PASS':'FAIL'} - ${name}`);if(!ok)failed++}process.exit(failed?1:0)
