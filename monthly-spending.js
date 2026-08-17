(() => {
  const data = window.MONTHLY_SPENDING_DATA;
  if (!data) return;

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const pct = v => `${(v * 100).toFixed(1).replace('.', ',')}%`;
  const money = v => currency.format(v);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  if (!document.getElementById('spendingDetailStyles')) {
    const style = document.createElement('style');
    style.id = 'spendingDetailStyles';
    style.textContent = `
      #spendingDetailDialog {
        width: min(820px, calc(100vw - 32px));
        max-width: 820px;
        max-height: calc(100vh - 48px);
        padding: 0;
        overflow: hidden;
      }
      #spendingDetailDialog .spending-detail-shell {
        width: 100%;
        max-width: 100%;
        padding: 24px;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 48px);
        overflow: hidden;
      }
      #spendingDetailDialog .modal-header {
        flex: 0 0 auto;
      }
      #spendingDetailDialog .spending-detail-summary {
        flex: 0 0 auto;
        margin: 0 0 16px;
      }
      #spendingDetailDialog .spending-detail-table-wrap {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      #spendingDetailDialog table {
        width: 100%;
        table-layout: fixed;
      }
      #spendingDetailDialog th,
      #spendingDetailDialog td {
        padding: 13px 14px;
        vertical-align: top;
      }
      #spendingDetailDialog th:nth-child(1),
      #spendingDetailDialog td:nth-child(1) {
        width: 82px;
        white-space: nowrap;
      }
      #spendingDetailDialog th:nth-child(2),
      #spendingDetailDialog td:nth-child(2) {
        width: auto;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      #spendingDetailDialog th:nth-child(3),
      #spendingDetailDialog td:nth-child(3) {
        width: 120px;
        white-space: nowrap;
      }
      #spendingDetailDialog .modal-actions {
        flex: 0 0 auto;
        margin-top: 16px;
      }
      @media (max-width: 600px) {
        #spendingDetailDialog {
          width: calc(100vw - 16px);
          max-height: calc(100vh - 16px);
        }
        #spendingDetailDialog .spending-detail-shell {
          padding: 16px;
          max-height: calc(100vh - 16px);
        }
        #spendingDetailDialog th,
        #spendingDetailDialog td {
          padding: 11px 9px;
          font-size: 11px;
        }
        #spendingDetailDialog th:nth-child(1),
        #spendingDetailDialog td:nth-child(1) { width: 58px; }
        #spendingDetailDialog th:nth-child(3),
        #spendingDetailDialog td:nth-child(3) { width: 94px; }
      }
    `;
    document.head.appendChild(style);
  }

  const nav = document.querySelector('.sidebar nav');
  const dataBtn = nav?.querySelector('[data-section="dados"]');
  if (nav && !nav.querySelector('[data-section="gastos"]')) {
    const btn = document.createElement('button');
    btn.className = 'nav-link';
    btn.dataset.section = 'gastos';
    btn.textContent = 'Gastos do mês';
    nav.insertBefore(btn, dataBtn || null);
    btn.addEventListener('click', () => showSpending());
  }

  const main = document.querySelector('.main-content');
  if (!main || document.getElementById('gastos')) return;

  const top = [...data.categories].filter(c => c.value > 0).sort((a,b) => b.value-a.value);
  const max = top[0]?.value || 1;
  const top2 = top.slice(0,2).reduce((s,c) => s+c.value,0);

  const section = document.createElement('section');
  section.id = 'gastos';
  section.className = 'page-section';
  section.innerHTML = `
    <div class="section-toolbar">
      <div><h2>Gastos do mês</h2><p>Entenda quanto da fatura veio de parcelas antigas e quanto foi consumo novo do ciclo.</p></div>
    </div>
    <div class="summary-grid">
      <article class="metric-card accent"><span>Fatura total</span><strong>${money(data.invoiceTotal)}</strong><small>${data.card} · ago/2026</small></article>
      <article class="metric-card"><span>Parcelas antigas</span><strong>${money(data.installmentsTotal)}</strong><small>${pct(data.installmentsTotal/data.invoiceTotal)} da fatura</small></article>
      <article class="metric-card"><span>Gastos novos do mês</span><strong>${money(data.newSpendingTotal)}</strong><small>${pct(data.newSpendingTotal/data.invoiceTotal)} da fatura</small></article>
      <article class="metric-card"><span>2 maiores categorias</span><strong>${money(top2)}</strong><small>${pct(top2/data.newSpendingTotal)} dos gastos novos</small></article>
    </div>
    <div class="content-grid two-thirds">
      <article class="panel">
        <div class="panel-header"><div><span class="panel-kicker">CATEGORIAS</span><h2>Onde você mais gastou</h2></div></div>
        <div class="bar-list">
          ${top.map(c => `
            <button class="spending-category" data-category="${esc(c.name)}" style="display:block;width:100%;border:0;background:transparent;padding:6px 0 10px;text-align:left;cursor:pointer">
              <div class="bar-row-head"><span>${esc(c.name)}</span><strong>${money(c.value)} · ${pct(c.value/data.newSpendingTotal)}</strong></div>
              <div class="bar-track"><div class="bar-fill" style="width:${(c.value/max)*100}%"></div></div>
            </button>`).join('')}
        </div>
        <p style="margin:14px 0 0;color:#7d8799;font-size:13px">Clique em uma categoria para ver os lançamentos.</p>
      </article>
      <article class="panel insight-panel">
        <span class="panel-kicker">ONDE ATACAR PRIMEIRO</span><h2>Seu gasto novo está concentrado</h2>
        <p><strong>Alimentação</strong> consumiu ${money(top.find(c=>c.name==='Alimentação')?.value || 0)} e <strong>Veículos</strong> ${money(top.find(c=>c.name==='Veículos')?.value || 0)}. Somadas, essas duas categorias representam <strong>${pct(top2/data.newSpendingTotal)}</strong> do consumo novo desta fatura.</p>
        <div class="insight-stat"><span>Gasto novo fora de parcelas</span><strong>${money(data.newSpendingTotal)}</strong></div>
      </article>
    </div>
    <article class="panel"><div class="panel-header"><div><span class="panel-kicker">LEITURA DO MÊS</span><h2>O que isso indica</h2></div></div><p style="line-height:1.75;margin:0">O consumo novo foi maior que o valor das parcelas antigas. Use o detalhamento por categoria para descobrir quais estabelecimentos e pequenas compras estão se repetindo durante o ciclo.</p></article>`;
  main.appendChild(section);

  const dialog = document.createElement('dialog');
  dialog.id = 'spendingDetailDialog';
  dialog.className = 'modal large';
  dialog.innerHTML = `<div class="spending-detail-shell">
    <div class="modal-header"><div><span class="panel-kicker">LANÇAMENTOS DO MÊS</span><h2 id="spendingDetailTitle">Categoria</h2></div><button type="button" class="icon-button" id="closeSpendingDetail">×</button></div>
    <div id="spendingDetailSummary" class="preview-box spending-detail-summary"></div>
    <div class="spending-detail-table-wrap"><table><thead><tr><th>Data</th><th>Estabelecimento</th><th style="text-align:right">Valor</th></tr></thead><tbody id="spendingDetailBody"></tbody></table></div>
    <div class="modal-actions"><button type="button" class="secondary-button" id="closeSpendingDetail2">Fechar</button></div>
  </div>`;
  document.body.appendChild(dialog);

  function openCategory(category){
    const rows=(data.transactions||[]).filter(t=>t.category===category).sort((a,b)=>{
      const [da,ma]=a.date.split('/').map(Number),[db,mb]=b.date.split('/').map(Number);
      return ma-mb || da-db;
    });
    const total=rows.reduce((s,r)=>s+r.value,0);
    const positive=rows.filter(r=>r.value>0);
    const avg=positive.length?positive.reduce((s,r)=>s+r.value,0)/positive.length:0;
    document.getElementById('spendingDetailTitle').textContent=category;
    document.getElementById('spendingDetailSummary').innerHTML=`<strong>${rows.length} lançamento${rows.length===1?'':'s'}</strong> · Total: <strong>${money(total)}</strong>${positive.length?` · Ticket médio: <strong>${money(avg)}</strong>`:''}`;
    document.getElementById('spendingDetailBody').innerHTML=rows.map(r=>`<tr><td>${esc(r.date)}</td><td><strong>${esc(r.description)}</strong></td><td style="text-align:right;${r.value<0?'color:#16845b':''}">${money(r.value)}</td></tr>`).join('') || '<tr><td colspan="3">Nenhum lançamento encontrado.</td></tr>';
    dialog.showModal();
  }

  section.querySelectorAll('.spending-category').forEach(btn=>btn.addEventListener('click',()=>openCategory(btn.dataset.category)));
  document.getElementById('closeSpendingDetail').addEventListener('click',()=>dialog.close());
  document.getElementById('closeSpendingDetail2').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});

  function showSpending(){
    document.querySelectorAll('.page-section').forEach(x => x.classList.toggle('active', x.id === 'gastos'));
    document.querySelectorAll('.nav-link').forEach(x => x.classList.toggle('active', x.dataset.section === 'gastos'));
    const title = document.getElementById('pageTitle'); if (title) title.textContent = 'Gastos do mês';
  }
})();
