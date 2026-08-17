(() => {
  const STORAGE_KEY='comprometido_v1';
  const META={
    '9100':{final:'9100',holder:'Mauro',label:'Final 9100 · Mauro'},
    '3779':{final:'3779',holder:'Mauro',label:'Final 3779 · Mauro'},
    '6511':{final:'6511',holder:'Mauro',label:'Final 6511 · Mauro'},
    '3010':{final:'3010',holder:'Jackeline',label:'Final 3010 · Jackeline'},
    '2002':{final:'2002',holder:'Jackeline',label:'Final 2002 · Jackeline'},
    '8918':{final:'8918',holder:'Mauro',label:'Final 8918 · Mauro'},
    'SERVICOS':{final:'SERVIÇOS',holder:'Conta',label:'Produtos / serviços'}
  };
  window.CARD_SOURCE_META=META;

  const purchaseMap={
    'itau-202608-001':'3779','itau-202608-002':'9100','itau-202608-003':'9100','itau-202608-004':'9100','itau-202608-005':'9100','itau-202608-006':'9100','itau-202608-007':'9100','itau-202608-008':'9100','itau-202608-009':'9100','itau-202608-010':'9100','itau-202608-011':'9100','itau-202608-012':'9100','itau-202608-013':'6511','itau-202608-014':'3010','itau-202608-015':'3010','itau-202608-016':'3010','itau-202608-017':'3010','itau-202608-018':'3010','itau-202608-019':'3010','itau-202608-020':'3010','itau-202608-021':'3010','itau-202608-022':'3010','itau-202608-023':'2002','itau-202608-024':'2002','itau-202608-025':'2002','itau-202608-026':'2002','itau-202608-027':'8918','itau-202608-028':'8918','itau-202608-029':'8918','itau-202608-030':'SERVICOS'
  };

  try{
    const state=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(state&&Array.isArray(state.purchases)){
      let changed=false;
      state.purchases.forEach(p=>{
        const code=purchaseMap[p.id];
        if(code&&META[code]){
          const m=META[code];
          if(p.sourceFinal!==m.final||p.holder!==m.holder){p.sourceFinal=m.final;p.holder=m.holder;changed=true;}
        }
      });
      if(changed)localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    }
  }catch(_){ }

  const data=window.MONTHLY_SPENDING_DATA;
  if(data&&Array.isArray(data.transactions)){
    let source='9100';
    data.transactions.forEach(t=>{
      if(t.description==='NUNES SUPERM-CT UANAND'&&t.date==='05/07')source='2002';
      if(t.description==='ENVIO MENS.AUTOMATICA')source='SERVICOS';
      const m=META[source];
      t.sourceFinal=m.final;t.holder=m.holder;t.sourceLabel=m.label;
    });
    data.cardBreakdown=[
      {final:'9100',holder:'Mauro',value:6206.19},
      {final:'3779',holder:'Mauro',value:57.14},
      {final:'6511',holder:'Mauro',value:41.01},
      {final:'3010',holder:'Jackeline',value:242.19},
      {final:'2002',holder:'Jackeline',value:975.56},
      {final:'8918',holder:'Mauro',value:101.88},
      {final:'SERVIÇOS',holder:'Conta',value:7.99}
    ];
  }
})();