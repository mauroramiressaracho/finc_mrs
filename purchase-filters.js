(() => {
  const STORAGE_KEY='comprometido_v1';
  const section=document.getElementById('compras');
  const tablePanel=section?.querySelector('.table-panel');
  const body=document.getElementById('purchasesTableBody');
  const empty=document.getElementById('purchasesEmpty');
  if(!section||!tablePanel||!body)return;

  const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const monthLongFmt=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const money=v=>currency.format(Number(v)||0);
  const dateFromMonth=key=>{const [y,m]=key.split('-').map(Number);return new Date(y,m-1,1)};
  const addMonths=(key,amount)=>{const d=dateFromMonth(key);d.setMonth(d.getMonth()+amount);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  const formatMonth=key=>monthLongFmt.format(dateFromMonth(key));
  const now=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  const getState=()=>{try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return s&&Array.isArray(s.purchases)&&Array.isArray(s.cards)?s:{purchases:[],cards:[]}}catch{return {purchases:[],cards:[]}}};

  const controls=document.createElement('div');
  controls.className='purchase-controls';
  controls.innerHTML=`
    <div class="purchase-filter-grid">
      <div class="purchase-filter-field search-field"><label>Buscar compra</label><input id="purchaseSearch" type="search" placeholder="Ex.: Shopee, Petiz, moto..." /></div>
      <div class="purchase-filter-field"><label>Cartão</label><select id="purchaseFilterCard"><option value="">Todos os cartões</option></select></div>
      <div class="purchase-filter-field"><label>Categoria</label><select id="purchaseFilterCategory"><option value="">Todas as categorias</option></select></div>
      <div class="purchase-filter-field"><label>Situação</label><select id="purchaseFilterStatus"><option value="">Todas</option><option value="ending">Termina este mês</option><option value="active">Continua nos próximos meses</option><option value="finished">Já terminou</option></select></div>
      <div class="purchase-filter-field"><label>Ordenar por</label><select id="purchaseSort"><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option><option value="value-desc">Maior parcela</option><option value="value-asc">Menor parcela</option><option value="remaining-desc">Maior saldo restante</option><option value="remaining-asc">Menor saldo restante</option><option value="end-asc">Termina primeiro</option><option value="end-desc">Termina por último</option><option value="progress-desc">Mais avançada</option><option value="progress-asc">Menos avançada</option></select></div>
    </div>
    <div class="purchase-controls-footer"><span id="purchaseResultsCount" class="purchase-results-count"></span><button id="purchaseClearFilters" class="purchase-clear" type="button">Limpar filtros</button></div>`;
  tablePanel.parentNode.insertBefore(controls,tablePanel);

  const search=document.getElementById('purchaseSearch');
  const cardSel=document.getElementById('purchaseFilterCard');
  const catSel=document.getElementById('purchaseFilterCategory');
  const statusSel=document.getElementById('purchaseFilterStatus');
  const sortSel=document.getElementById('purchaseSort');
  const countEl=document.getElementById('purchaseResultsCount');

  function syncOptions(){
    const state=getState();
    const cardValue=cardSel.value,catValue=catSel.value;
    cardSel.innerHTML='<option value="">Todos os cartões</option>'+state.cards.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const cats=[...new Set(state.purchases.map(p=>p.category||'Outros'))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    catSel.innerHTML='<option value="">Todas as categorias</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if([...cardSel.options].some(o=>o.value===cardValue))cardSel.value=cardValue;
    if([...catSel.options].some(o=>o.value===catValue))catSel.value=catValue;
  }

  function buildRows(){
    const state=getState();
    const cards=new Map(state.cards.map(c=>[c.id,c]));
    const monthNow=now();
    let rows=state.purchases.map(p=>{
      const end=addMonths(p.currentMonth,p.totalInstallments-p.currentInstallment);
      const remaining=Math.max(0,p.totalInstallments-p.currentInstallment+1);
      const remainingValue=remaining*Number(p.installmentValue||0);
      const progress=Number(p.currentInstallment||0)/Math.max(1,Number(p.totalInstallments||1));
      return {...p,end,remaining,remainingValue,progress,cardName:cards.get(p.cardId)?.name||'Sem cartão'};
    });

    const q=search.value.trim().toLocaleLowerCase('pt-BR');
    if(q)rows=rows.filter(p=>`${p.description} ${p.category||''} ${p.cardName}`.toLocaleLowerCase('pt-BR').includes(q));
    if(cardSel.value)rows=rows.filter(p=>p.cardId===cardSel.value);
    if(catSel.value)rows=rows.filter(p=>(p.category||'Outros')===catSel.value);
    if(statusSel.value==='ending')rows=rows.filter(p=>p.end===monthNow);
    if(statusSel.value==='active')rows=rows.filter(p=>p.end>monthNow);
    if(statusSel.value==='finished')rows=rows.filter(p=>p.end<monthNow);

    const [field,dir]=sortSel.value.split('-');
    const mult=dir==='desc'?-1:1;
    rows.sort((a,b)=>{
      let cmp=0;
      if(field==='name')cmp=a.description.localeCompare(b.description,'pt-BR');
      if(field==='value')cmp=Number(a.installmentValue)-Number(b.installmentValue);
      if(field==='remaining')cmp=a.remainingValue-b.remainingValue;
      if(field==='end')cmp=a.end.localeCompare(b.end);
      if(field==='progress')cmp=a.progress-b.progress;
      return cmp*mult;
    });
    return {rows,total:state.purchases.length};
  }

  let internal=false;
  function render(){
    syncOptions();
    const {rows,total}=buildRows();
    internal=true;
    body.innerHTML=rows.map(p=>`<tr><td><strong>${esc(p.description)}</strong><br><span style="color:#939cad">${esc(p.category||'Outros')}</span></td><td>${esc(p.cardName)}</td><td><span class="tag">${p.currentInstallment}/${p.totalInstallments}</span></td><td>${money(p.installmentValue)}</td><td>${formatMonth(p.end)}</td><td>${money(p.remainingValue)}</td><td><div class="row-actions"><button class="small-action danger" onclick="deletePurchase('${esc(p.id)}')">Excluir</button></div></td></tr>`).join('');
    if(empty)empty.style.display='none';
    let filterEmpty=document.getElementById('purchaseFilteredEmpty');
    if(!filterEmpty){filterEmpty=document.createElement('div');filterEmpty.id='purchaseFilteredEmpty';filterEmpty.className='purchase-empty-filter';tablePanel.appendChild(filterEmpty)}
    filterEmpty.style.display=rows.length?'none':'block';
    filterEmpty.textContent=total?'Nenhuma compra encontrada com os filtros selecionados.':'Nenhuma compra cadastrada.';
    countEl.textContent=`${rows.length} de ${total} compra${total===1?'':'s'}`;
    internal=false;
  }

  [search,cardSel,catSel,statusSel,sortSel].forEach(el=>el.addEventListener(el===search?'input':'change',render));
  document.getElementById('purchaseClearFilters').addEventListener('click',()=>{search.value='';cardSel.value='';catSel.value='';statusSel.value='';sortSel.value='name-asc';render()});

  const observer=new MutationObserver(()=>{if(!internal)setTimeout(render,0)});
  observer.observe(body,{childList:true});
  render();
})();