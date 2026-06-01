const Tracking={
  ensure(){
    const sc=Schedule.stages(false);
    sc.rows.forEach(row=>{
      if(!State.tracking.stages[row.name]){
        State.tracking.stages[row.name]={status:"pendente",percent:0,actualStart:"",actualEnd:"",note:""};
      }
    });
    Object.keys(State.tracking.stages).forEach(name=>{
      if(!sc.rows.some(r=>r.name===name))delete State.tracking.stages[name];
    });
  },
  summary(){
    this.ensure();
    const sc=Schedule.stages(false);
    const stages=sc.rows;
    const totalPlannedDays=sc.totalDays||1;
    let weighted=0,done=0,inProgress=0,pending=0;
    stages.forEach(row=>{
      const data=State.tracking.stages[row.name]||{};
      const percent=Math.max(0,Math.min(100,Number(data.percent)||0));
      weighted+=percent*row.days;
      if(data.status==="concluido")done++;
      else if(data.status==="andamento")inProgress++;
      else pending++;
    });
    const progress=round(weighted/totalPlannedDays,1);
    const extraCosts=State.tracking.logs.reduce((a,l)=>a+(Number(l.extraCost)||0),0);
    const hours=State.tracking.logs.reduce((a,l)=>a+(Number(l.hours)||0),0);
    return{progress,done,inProgress,pending,total:stages.length,extraCosts,hours};
  },
  expectedProgress(){
    const sc=Schedule.stages(false);
    if(!sc.start||!sc.end)return 0;
    const start=new Date(sc.start+"T12:00:00");
    const now=new Date();
    const total=Math.max(1,sc.totalDays||1);
    const elapsed=Math.max(0,Math.ceil((now-start)/(1000*60*60*24)));
    return Math.max(0,Math.min(100,round((elapsed/total)*100,1)));
  },
  warnings(){
    const s=this.summary(),expected=this.expectedProgress(),w=[];
    if(!State.rooms.length)w.push(["bad","Cadastre cômodos para acompanhar uma obra real."]);
    if(s.progress+15<expected)w.push(["bad",`O progresso informado (${s.progress}%) está abaixo do esperado pelo cronograma (${expected}%).`]);
    if(s.extraCosts>0)w.push(["warn",`Existem custos extras registrados no diário: ${money(s.extraCosts)}.`]);
    if(!w.length)w.push(["ok","Acompanhamento sem alertas importantes."]);
    return w;
  }
};
