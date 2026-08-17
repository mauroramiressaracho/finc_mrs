(() => {
  const STORAGE_KEY = 'comprometido_v1';
  const SEED_KEY = 'comprometido_seed_itau_platinum_202608_v1';

  if (localStorage.getItem(SEED_KEY) === '1') return;

  let state = { cards: [], purchases: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.cards) && Array.isArray(saved.purchases)) state = saved;
  } catch (_) {}

  const cardName = 'Cartão Itau Platinum';
  let card = state.cards.find(c => String(c.name || '').trim().toLowerCase() === cardName.toLowerCase());

  if (!card) {
    card = {
      id: 'itau-platinum',
      name: cardName,
      limit: 35000,
      color: '#ec7000',
      closingDay: 3,
      dueDay: 10
    };
    state.cards.push(card);
  }

  const month = '2026-08';
  const imported = [
    ['itau-202608-001','PG *18 STORE CONF','Roupas',57.14,1,6],
    ['itau-202608-002','PETIZ IMPRESSOES - 23/03','Outros',434.73,5,12],
    ['itau-202608-003','MOTO 13','Moto',21.00,4,10],
    ['itau-202608-004','PETIZ IMPRESSOES - 01/05','Outros',373.68,4,10],
    ['itau-202608-005','JIM.COM ALLO','Outros',73.34,3,3],
    ['itau-202608-006','PAF UTILIDAD','Outros',43.50,3,4],
    ['itau-202608-007','MF COMERCIO','Outros',111.08,3,4],
    ['itau-202608-008','PETIZ IMPRESSOES - 26/06','Outros',351.48,2,12],
    ['itau-202608-009','MP*BIGCOLCHOES','Casa',79.00,1,12],
    ['itau-202608-010','PETIZ IMPRESSOES - 20/07','Outros',462.55,1,12],
    ['itau-202608-011','FARM GRUPO M F2','Saúde',42.70,1,2],
    ['itau-202608-012','DROGASIL 426','Saúde',77.15,1,3],
    ['itau-202608-013','IG*ASSOCIACAODE','Outros',41.01,1,10],
    ['itau-202608-014','SHOPEE *PLOCPRODUT','Outros',20.10,3,3],
    ['itau-202608-015','SHOPEE *DIDIFASHIO','Roupas',59.40,3,3],
    ['itau-202608-016','NAT*Natura Pagamento','Outros',38.94,1,3],
    ['itau-202608-017','SITE HAVAN.COM','Outros',23.36,1,6],
    ['itau-202608-018','SHOPEE *ENCANTODEB','Outros',13.53,1,2],
    ['itau-202608-019','SHOPEE *L2Home','Casa',12.93,1,2],
    ['itau-202608-020','SHOPEE *wodafLM','Outros',10.61,1,4],
    ['itau-202608-021','SHOPEE *NOVA7CONFE','Roupas',13.88,1,5],
    ['itau-202608-022','NATURA PAY*Natura','Outros',49.44,1,6],
    ['itau-202608-023','BRUNA ALVES DE JES','Outros',222.11,4,10],
    ['itau-202608-024','LOJAS AVENIDA FILI','Roupas',69.98,2,3],
    ['itau-202608-025','LOJAS AVENID CT LI','Roupas',30.73,1,2],
    ['itau-202608-026','FARM GRUPO M F00','Saúde',38.38,1,3],
    ['itau-202608-027','SHOPEE *MTGEscapam','Moto',64.12,3,12],
    ['itau-202608-028','SHOPEE *UnoToys','Outros',11.48,3,10],
    ['itau-202608-029','SHOPEE *MotoMixSto','Moto',26.28,1,12],
    ['itau-202608-030','ANUIDADE DIFERENCIADA','Tarifas',62.00,4,12]
  ].map(([id, description, category, installmentValue, currentInstallment, totalInstallments]) => ({
    id,
    description,
    cardId: card.id,
    category,
    installmentValue,
    currentInstallment,
    totalInstallments,
    currentMonth: month
  }));

  const existingIds = new Set(state.purchases.map(p => p.id));
  for (const purchase of imported) {
    if (!existingIds.has(purchase.id)) state.purchases.push(purchase);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(SEED_KEY, '1');
})();
