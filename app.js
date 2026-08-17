const STORAGE_KEY='comprometido_v1';
const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const monthFmt=new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit'});
const monthLongFmt=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});

function uid(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`}
function monthKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
function dateFromMonth(key){const [y,m]=key.split('-').map(Number);return new Date(y,m-1,1)}
function addMonths(key,amount){const d=dateFromMonth(key);d.setMonth(d.getMonth()+amount);return monthKey(d)}
function currentMonthKey(){const d=new Date();return monthKey(new Date(d.getFullYear(),d.getMonth(),1))}
function formatMonth(key,long=false){const label=(long?monthLongFmt:monthFmt).format(dateFromMonth(key));return label.replace('.','')}
function money(value){return currency.format(Number(value)||0)}

let state=loadState();
function defaultState(){return {cards:[],purchases:[]}}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||defaultState()}catch{return defaultState()}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}

function buildInstallments(purchase){
  const rows=[];
  for(let n=1;n<=purchase.totalInstallments;n++){
    const offset=n-purchase.currentInstallment;
    const competence=addMonths(purchase.currentMonth,offset);
    rows.push({number:n,competence,value:Number(purchase.installmentValue),status:n<purchase.currentInstallment?'paid':n===purchase.currentInstallment?'current':'future'});
  }
  return rows;
}
function getAllInstallments(){return state.purchases.flatMap(p=>buildInstallments(p).map(i=>({...i,purchaseId:p.id,cardId:p.cardId,description:p.description,category:p.category})))}
function futureInstallments(){const now=currentMonthKey();return getAllInstallments().filter(i=>i.competence>=now)}
function getCard(id){return state.cards.find(c=>c.id===id)}

function renderAll(){renderCardSelect();renderCards();renderPurchases();renderDashboard()}
function renderDashboard(){
  const now=currentMonthKey();
  const future=futureInstallments();
  const current=future.filter(i=>i.competence===now);
  document.getElementById('currentMonthTotal').textContent=money(current.reduce((s,i)=>s+i.value,0));
  document.getElementById('currentMonthLabel').textContent=formatMonth(now,true);
  document.getElementById('futureBalance').textContent=money(future.reduce((s,i)=>s+i.value,0));
  document.getElementById('activePurchases').textContent=state.purchases.filter(p=>buildInstallments(p).some(i=>i.competence>=now)).length;

  const endings=state.purchases.map(p=>({purchase:p,endMonth:addMonths(p.currentMonth,p.totalInstallments-p.currentInstallment),value:Number(p.installmentValue)})).filter(x=>x.endMonth>=now).sort((a,b)=>a.endMonth.localeCompare(b.endMonth));
  const next=endings[0];
  document.getElementById('nextReliefValue').textContent=next?money(next.value):money(0);
  document.getElementById('nextReliefLabel').textContent=next?`${next.purchase.description} termina em ${formatMonth(next.endMonth,true)}`:'nenhuma parcela encerrando';
  renderProjection();renderEndingSoon(endings);renderCardBreakdown(future);renderDebtFree(future);
}
function renderProjection(){
  const count=Number(document.getElementById('projectionMonths').value||12);const start=currentMonthKey();const all=futureInstallments();
  const data=Array.from({length:count},(_,idx)=>{const key=addMonths(start,idx);return {key,total:all.filter(i=>i.competence===key).reduce((s,i)=>s+i.value,0)}});
  const max=Math.max(...data.map(d=>d.total),1);const el=document.getElementById('projectionChart');
  el.innerHTML=data.map(d=>`<div class="chart-col" title="${formatMonth(d.key,true)}: ${money(d.total)}"><span class="chart-value">${d.total?money(d.total).replace('R$ ',''):''}</span><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max((d.total/max)*100,d.total?2:0)}%"></div></div><span class="chart-label">${formatMonth(d.key)}</span></div>`).join('');
}
function renderEndingSoon(endings){
  const el=document.getElementById('endingSoonList');if(!endings.length){el.className='ending-list empty-state';el.textContent='Nenhuma compra cadastrada.';return}
  el.className='ending-list';el.innerHTML=endings.slice(0,6).map(x=>`<div class="ending-item"><div><strong>${escapeHtml(x.purchase.description)}</strong><span>${escapeHtml(getCard(x.purchase.cardId)?.name||'Sem cartão')}</span></div><div style="text-align:right"><strong>${money(x.value)}/mês</strong><span>${formatMonth(x.endMonth,true)}</span></div></div>`).join('')
}
function renderCardBreakdown(future){
  const totals=state.cards.map(c=>({card:c,total:future.filter(i=>i.cardId===c.id).reduce((s,i)=>s+i.value,0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);const el=document.getElementById('cardBreakdown');
  if(!totals.length){el.className='bar-list empty-state';el.textContent='Cadastre cartões e compras.';return}const max=totals[0].total;el.className='bar-list';el.innerHTML=totals.map(x=>`<div><div class="bar-row-head"><span>${escapeHtml(x.card.name)}</span><strong>${money(x.total)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${(x.total/max)*100}%;background:${x.card.color}"></div></div></div>`).join('')
}
function renderDebtFree(future){
  const sidebar=document.getElementById('debtFreeSidebar'), insight=document.getElementById('debtFreeInsight'), relief=document.getElementById('finalReliefValue');if(!future.length){sidebar.textContent='Cadastre suas parcelas para ver quando elas terminam.';insight.textContent='Cadastre suas parcelas para obter uma projeção.';relief.textContent=money(0);return}
  const last=[...future].sort((a,b)=>b.competence.localeCompare(a.competence))[0].competence;const currentTotal=future.filter(i=>i.competence===currentMonthKey()).reduce((s,i)=>s+i.value,0);const after=addMonths(last,1);
  sidebar.textContent=`Suas parcelas atuais chegam a zero em ${formatMonth(after,true)}.`;
  insight.innerHTML=`Mantendo o cenário atual, a última parcela termina em <strong>${formatMonth(last,true)}</strong>. A partir de <strong>${formatMonth(after,true)}</strong>, essas dívidas deixam de comprometer sua renda mensal.`;
  relief.textContent=money(currentTotal)
}
function renderPurchases(){
  const body=document.getElementById('purchasesTableBody'),empty=document.getElementById('purchasesEmpty');
  if(!state.purchases.length){body.innerHTML='';empty.style.display='block';return}empty.style.display='none';
  body.innerHTML=[...state.purchases].sort((a,b)=>a.description.localeCompare(b.description)).map(p=>{const end=addMonths(p.currentMonth,p.totalInstallments-p.currentInstallment);const remaining=p.totalInstallments-p.currentInstallment+1;return `<tr><td><strong>${escapeHtml(p.description)}</strong><br><span style="color:#939cad">${escapeHtml(p.category||'Outros')}</span></td><td>${escapeHtml(getCard(p.cardId)?.name||'Sem cartão')}</td><td><span class="tag">${p.currentInstallment}/${p.totalInstallments}</span></td><td>${money(p.installmentValue)}</td><td>${formatMonth(end,true)}</td><td>${money(remaining*Number(p.installmentValue))}</td><td><div class="row-actions"><button class="small-action danger" onclick="deletePurchase('${p.id}')">Excluir</button></div></td></tr>`}).join('')
}
function renderCards(){
  const grid=document.getElementById('cardsGrid');if(!state.cards.length){grid.innerHTML='<div class="panel empty-state">Nenhum cartão cadastrado.</div>';return}
  grid.innerHTML=state.cards.map(c=>`<article class="credit-card" style="background:linear-gradient(135deg,${c.color},${shadeColor(c.color,-28)})"><div><small>CARTÃO</small><strong>${escapeHtml(c.name)}</strong></div><div class="credit-card-footer"><div><small>Limite</small><div>${money(c.limit)}</div></div><div><small>Fecha / vence</small><div>${c.closingDay||'—'} / ${c.dueDay||'—'}</div></div><button class="card-delete" onclick="deleteCard('${c.id}')">Excluir</button></div></article>`).join('')
}
function renderCardSelect(){const select=document.getElementById('purchaseCard');const selected=select.value;select.innerHTML='<option value="">Selecione</option>'+state.cards.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');if(state.cards.some(c=>c.id===selected))select.value=selected}

function deletePurchase(id){if(confirm('Excluir esta compra e todas as parcelas geradas?')){state.purchases=state.purchases.filter(p=>p.id!==id);saveState()}}
function deleteCard(id){if(state.purchases.some(p=>p.cardId===id)){alert('Este cartão possui compras vinculadas. Exclua as compras primeiro.');return}if(confirm('Excluir este cartão?')){state.cards=state.cards.filter(c=>c.id!==id);saveState()}}
window.deletePurchase=deletePurchase;window.deleteCard=deleteCard;

function openPurchase(){if(!state.cards.length){alert('Cadastre pelo menos um cartão antes de adicionar uma compra.');showSection('cartoes');return}const form=document.getElementById('purchaseForm');form.reset();document.getElementById('currentMonth').value=currentMonthKey();renderCardSelect();updatePreview();document.getElementById('purchaseDialog').showModal()}
function updatePreview(){const val=Number(document.getElementById('installmentValue').value);const cur=Number(document.getElementById('currentInstallment').value);const total=Number(document.getElementById('totalInstallments').value);const month=document.getElementById('currentMonth').value;const el=document.getElementById('purchasePreview');if(!val||!cur||!total||!month||cur>total){el.textContent='Preencha os dados corretamente para visualizar a projeção das parcelas.';return}const previous=cur-1,future=total-cur,end=addMonths(month,total-cur);el.innerHTML=`Serão cadastradas <strong>${total} parcelas</strong>: ${previous} anterior${previous===1?'':'es'} marcada${previous===1?'':'s'} como paga${previous===1?'':'s'}, <strong>1 atual</strong> e ${future} futura${future===1?'':'s'}. Valor total estimado: <strong>${money(val*total)}</strong>. Término em <strong>${formatMonth(end,true)}</strong>.`}

function showSection(id){document.querySelectorAll('.page-section').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.section===id));const names={dashboard:'Visão geral',compras:'Compras parceladas',cartoes:'Cartões',dados:'Dados e backup'};document.getElementById('pageTitle').textContent=names[id]}

document.querySelectorAll('.nav-link').forEach(btn=>btn.addEventListener('click',()=>showSection(btn.dataset.section)));
document.querySelectorAll('.close-dialog').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog').close()));
document.getElementById('quickAddPurchase').addEventListener('click',openPurchase);document.getElementById('addPurchaseButton').addEventListener('click',openPurchase);
document.getElementById('addCardButton').addEventListener('click',()=>{document.getElementById('cardForm').reset();document.getElementById('cardColor').value='#6d5dfc';document.getElementById('cardDialog').showModal()});
document.getElementById('projectionMonths').addEventListener('change',renderProjection);
['installmentValue','currentInstallment','totalInstallments','currentMonth'].forEach(id=>document.getElementById(id).addEventListener('input',updatePreview));

document.getElementById('cardForm').addEventListener('submit',e=>{e.preventDefault();state.cards.push({id:uid(),name:document.getElementById('cardName').value.trim(),limit:Number(document.getElementById('cardLimit').value||0),color:document.getElementById('cardColor').value,closingDay:Number(document.getElementById('cardClosing').value||0),dueDay:Number(document.getElementById('cardDue').value||0)});saveState();document.getElementById('cardDialog').close();toast('Cartão cadastrado.')});
document.getElementById('purchaseForm').addEventListener('submit',e=>{e.preventDefault();const cur=Number(document.getElementById('currentInstallment').value),total=Number(document.getElementById('totalInstallments').value);if(cur>total){alert('A parcela atual não pode ser maior que o total de parcelas.');return}state.purchases.push({id:uid(),description:document.getElementById('purchaseDescription').value.trim(),cardId:document.getElementById('purchaseCard').value,category:document.getElementById('purchaseCategory').value,installmentValue:Number(document.getElementById('installmentValue').value),currentInstallment:cur,totalInstallments:total,currentMonth:document.getElementById('currentMonth').value});saveState();document.getElementById('purchaseDialog').close();toast(`${total} parcelas geradas automaticamente.`)});

document.getElementById('exportData').addEventListener('click',()=>{const payload={version:1,exportedAt:new Date().toISOString(),...state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`comprometido-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)});
document.getElementById('importData').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.cards)||!Array.isArray(data.purchases))throw new Error();if(confirm('Importar este backup substituirá os dados atuais. Continuar?')){state={cards:data.cards,purchases:data.purchases};saveState();toast('Backup importado.')}}catch{alert('Arquivo JSON inválido.')}e.target.value=''});
document.getElementById('clearData').addEventListener('click',()=>{if(confirm('Tem certeza que deseja apagar todos os dados deste navegador?')){state=defaultState();saveState();toast('Dados apagados.')}});

function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function shadeColor(hex,percent){let num=parseInt(hex.replace('#',''),16),amt=Math.round(2.55*percent),R=(num>>16)+amt,G=(num>>8&255)+amt,B=(num&255)+amt;return '#'+(0x1000000+(R<255?R<1?0:R:255)*0x10000+(G<255?G<1?0:G:255)*0x100+(B<255?B<1?0:B:255)).toString(16).slice(1)}
function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),2400)}
renderAll();
