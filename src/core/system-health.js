const SystemHealth={
  collect(){
    const t=Calc.totals(false),b=Calc.budget(false),sc=Schedule.stages(false),track=Tracking.summary(),purchase=Purchases.summary();
    const floorWarnings=Floorplan.validation();
    const projectWarnings=UI.projectWarnings?UI.projectWarnings():[];
    const scheduleWarnings=Schedule.warnings();
    const purchaseWarnings=Purchases.warnings();
    const compositionWarnings=Compositions.warnings();
    const installationWarnings=Installations.warnings();
    const trackingWarnings=Tracking.warnings();
    const all=[
      ...projectWarnings.map(w=>["Projeto",...w]),
      ...floorWarnings.map(w=>["Planta",...w]),
      ...scheduleWarnings.map(w=>["Cronograma",...w]),
      ...purchaseWarnings.map(w=>["Compras",...w]),
      ...compositionWarnings.map(w=>["Composições",...w]),
      ...installationWarnings.map(w=>["Instalações",...w]),
      ...trackingWarnings.map(w=>["Execução",...w])
    ];
    const bad=all.filter(w=>w[1]==="bad").length;
    const warn=all.filter(w=>w[1]==="warn").length;
    const ok=all.filter(w=>w[1]==="ok").length;
    const lastBackup=localStorage.getItem("obra_facil_pro_last_backup")||"";
    const preBackendAlerts=(typeof DataValidator!=="undefined")?DataValidator.validate():[];
    return{t,b,sc,track,purchase,all,bad,warn,ok,lastBackup,preBackendAlerts};
  },
  readiness(){
    const h=this.collect();
    const checks=[
      ["Obra cadastrada",!!State.project.name,"Defina nome da obra na aba Obra."],
      ["Tem cômodos",State.rooms.length>0,"Cadastre pelo menos um cômodo."],
      ["Área calculada",h.t.area>0,"Verifique largura e comprimento dos cômodos."],
      ["Orçamento configurado",h.b.final>0,"Informe preços e mão de obra."],
      ["Cronograma configurado",h.sc.totalDays>0,"Verifique equipe e data de início."],
      ["Planta válida",!Floorplan.validation().some(w=>w[0]==="bad"),"Use Organizar automaticamente na aba Planta."],
      ["Backup geral disponível",!!h.lastBackup,"Clique em Fazer backup geral."],
      ["Compras revisadas",h.purchase.totalItems>0,"Revise a aba Compras."]
    ];
    return checks;
  },
  runFixes(){
    try{
      Floorplan.autoLayout();
      Tracking.ensure();
      Installations.ensure();
      if(!State.meta.status)State.meta.status="orcamento";
      State.audit=Array.isArray(State.audit)?State.audit:[];
      if(!State.purchases.items)State.purchases.items={};
      if(!Array.isArray(State.purchases.manual))State.purchases.manual=[];
      Storage.save();
      UI.fill();
      UI.renderAll();
      UI.toast("Correções seguras aplicadas.");
    }catch(e){
      UI.toast("Não foi possível aplicar todas as correções.");
    }
  },
  clearCurrentAudit(){
    if(!confirm("Limpar auditoria da obra atual? Faça backup antes se precisar do histórico."))return;
    State.audit=[];
    Storage.save();
    UI.renderAll();
    UI.toast("Auditoria limpa.");
  },
  resetCurrentTracking(){
    if(!confirm("Zerar acompanhamento da execução desta obra? Isso apaga status das etapas e diário."))return;
    State.tracking={stages:{},logs:[]};
    Storage.save();
    UI.renderAll();
    UI.toast("Execução zerada.");
  }
};


const ProjectManagerKey="obra_facil_pro_manager_v1";
