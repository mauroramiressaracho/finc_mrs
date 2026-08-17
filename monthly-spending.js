(() => {
  const data = window.MONTHLY_SPENDING_DATA;
  if (!data) return;

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const pct = v => `${(v * 100).toFixed(1).replace('.', ',')}%`;
  const money = v => currency.format(v);

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
      <div>
        <h2>Gastos do mês</h2>
        <p>Entenda quanto da fatura veio de parcelas antigas e quanto foi consumo novo do ciclo.</p>
      </div>
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
            <div>
              <div class="bar-row-head"><span>${c.name}</span><strong>${money(c.value)} · ${pct(c.value/data.newSpendingTotal)}</strong></div>
              <div class="bar-track"><div class="bar-fill" style="width:${(c.value/max)*100}%"></div></div>
            </div>`).join('')}
        </div>
      </article>

      <article class="panel insight-panel">
        <span class="panel-kicker">ONDE ATACAR PRIMEIRO</span>
        <h2>Seu gasto novo está concentrado</h2>
        <p><strong>Alimentação</strong> consumiu ${money(top.find(c=>c.name==='Alimentação')?.value || 0)} e <strong>Veículos</strong> ${money(top.find(c=>c.name==='Veículos')?.value || 0)}. Somadas, essas duas categorias representam <strong>${pct(top2/data.newSpendingTotal)}</strong> do consumo novo desta fatura.</p>
        <div class="insight-stat"><span>Gasto novo fora de parcelas</span><strong>${money(data.newSpendingTotal)}</strong></div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-header"><div><span class="panel-kicker">LEITURA DO MÊS</span><h2>O que isso indica</h2></div></div>
      <p style="line-height:1.75;margin:0">O peso principal desta fatura não veio somente das parcelas. O consumo novo foi maior que o valor das parcelas antigas. Para economizar, o maior potencial imediato está em controlar gastos recorrentes de alimentação e uso do cartão em despesas ligadas a veículos, sem criar novas parcelas enquanto o comprometimento futuro diminui.</p>
    </article>`;

  main.appendChild(section);

  function showSpending(){
    document.querySelectorAll('.page-section').forEach(x => x.classList.toggle('active', x.id === 'gastos'));
    document.querySelectorAll('.nav-link').forEach(x => x.classList.toggle('active', x.dataset.section === 'gastos'));
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = 'Gastos do mês';
  }
})();
