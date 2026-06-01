const ProjectManager={
  data:{currentId:null,projects:[]},
  emptyState(name="Nova obra",status="orcamento"){
    const id=cryptoRandom();
    const now=new Date().toISOString();
    return {
      meta:{id,status,createdAt:now,updatedAt:now},
      project:{name,client:"",lotWidth:6,lotLength:20,defaultHeight:2.8,lossProfile:0.10,notes:""},
      rooms:[],
      settings:{floorYield:2.5,blocksPerM2:12.5,paintYield:12,paintCoats:2},
      budget:{priceFloorBox:0,pricePaintLiter:0,priceBlock:0,laborPerM2:0,manualLabor:null,extraCosts:0,safetyMargin:10,profitMargin:20,discount:0},
      schedule:{startDate:todayISO(),workdaysPerWeek:6,masons:1,helpers:1,complexity:1,scheduleBuffer:10,notes:""},
      tracking:{stages:{},logs:[]},
      floorplan:{grid:0.5,showGrid:true,scale:40},
      purchases:{items:{},manual:[]},
      compositions:Compositions.defaults(),
      installations:{rooms:{},settings:{wireMultiplier:2.8,conduitFactor:1.25,pipeFactor:1.15,defaultOutletWireM:8,defaultLightWireM:10,defaultSwitchWireM:6,hydraulicPointPipeM:4,sewerPointPipeM:3}},
      audit:[]
    };
  },
  compact(state){
    const t=Calc.totals(false);
    const b=Calc.budget(false);
    const sc=Schedule.stages(false);
    return {
      id:state.meta.id,
      name:state.project.name||"Obra sem nome",
      client:state.project.client||"",
      status:state.meta.status||"orcamento",
      updatedAt:state.meta.updatedAt||new Date().toISOString(),
      createdAt:state.meta.createdAt||new Date().toISOString(),
      rooms:state.rooms.length,
      area:round(t.area),
      value:round(b.final,2),
      deadlineDays:sc.totalDays||0
    };
  },
  snapshot(){
    State.meta.updatedAt=new Date().toISOString();
    return JSON.parse(JSON.stringify(State));
  },
  apply(state){
    const clean=JSON.parse(JSON.stringify(state));
    Object.keys(State).forEach(k=>delete State[k]);
    Object.assign(State,clean);
    if(!State.meta)State.meta={id:cryptoRandom(),status:"orcamento",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(!State.project)State.project={name:"",client:"",lotWidth:6,lotLength:20,defaultHeight:2.8,lossProfile:0.10,notes:""};
    if(!Array.isArray(State.rooms))State.rooms=[];
    if(!State.purchases)State.purchases={items:{},manual:[]};
    if(!State.compositions)State.compositions=Compositions.defaults();
    if(!State.installations)State.installations={rooms:{},settings:{wireMultiplier:2.8,conduitFactor:1.25,pipeFactor:1.15,defaultOutletWireM:8,defaultLightWireM:10,defaultSwitchWireM:6,hydraulicPointPipeM:4,sewerPointPipeM:3}};
  },
  load(){
    try{
      const raw=localStorage.getItem(ProjectManagerKey);
      if(raw){
        this.data=JSON.parse(raw);
        if(!Array.isArray(this.data.projects))this.data.projects=[];
      }
    }catch(e){this.data={currentId:null,projects:[]};}
  },
  save(){
    localStorage.setItem(ProjectManagerKey,JSON.stringify(this.data));
  },
  initAfterStorageLoad(){
    this.load();
    if(!State.meta)State.meta={};
    if(!State.meta.id)State.meta.id=cryptoRandom();
    if(!State.meta.createdAt)State.meta.createdAt=new Date().toISOString();
    if(!State.meta.updatedAt)State.meta.updatedAt=new Date().toISOString();
    if(!State.meta.status)State.meta.status="orcamento";

    if(!this.data.projects.length){
      const snap=this.snapshot();
      this.data.currentId=snap.meta.id;
      this.data.projects=[{id:snap.meta.id,summary:this.compact(snap),state:snap}];
      this.save();
      return;
    }

    if(this.data.currentId){
      const found=this.data.projects.find(p=>p.id===this.data.currentId);
      if(found&&found.state){
        this.apply(found.state);
      }
    }
  },
  saveCurrent(){
    if(!State.meta.id)State.meta.id=cryptoRandom();
    State.meta.updatedAt=new Date().toISOString();
    const snap=this.snapshot();
    const index=this.data.projects.findIndex(p=>p.id===snap.meta.id);
    const entry={id:snap.meta.id,summary:this.compact(snap),state:snap};
    if(index>=0)this.data.projects[index]=entry;
    else this.data.projects.unshift(entry);
    this.data.currentId=snap.meta.id;
    this.save();
  },
  create(name,status){
    this.saveCurrent();
    const next=this.emptyState(name||"Nova obra",status||"orcamento");
    this.apply(next);
    this.data.currentId=State.meta.id;
    this.saveCurrent();
    Storage.save();
    UI.fill();
    UI.renderAll();
    UI.go("obra");
    UI.toast("Nova obra criada.");
  },
  open(id){
    this.saveCurrent();
    const found=this.data.projects.find(p=>p.id===id);
    if(!found)return;
    this.apply(found.state);
    this.data.currentId=id;
    this.save();
    Storage.save();
    UI.fill();
    UI.renderAll();
    UI.go("inicio");
    UI.toast("Obra aberta.");
  },
  duplicateCurrent(){
    this.saveCurrent();
    const copy=this.snapshot();
    copy.meta.id=cryptoRandom();
    copy.meta.createdAt=new Date().toISOString();
    copy.meta.updatedAt=new Date().toISOString();
    copy.project.name=(copy.project.name||"Obra")+" — cópia";
    this.apply(copy);
    this.data.currentId=copy.meta.id;
    this.saveCurrent();
    Storage.save();
    UI.fill();
    UI.renderAll();
    UI.go("obra");
    UI.toast("Obra duplicada.");
  },
  remove(id){
    if(this.data.projects.length<=1){UI.toast("Mantenha pelo menos uma obra cadastrada.");return;}
    const project=this.data.projects.find(p=>p.id===id);
    const name=project?.summary?.name||"esta obra";
    if(!confirm(`Excluir ${name}? Faça backup antes se precisar desses dados.`))return;
    this.data.projects=this.data.projects.filter(p=>p.id!==id);
    if(this.data.currentId===id){
      const first=this.data.projects[0];
      this.apply(first.state);
      this.data.currentId=first.id;
    }
    this.save();
    Storage.save();
    UI.fill();
    UI.renderAll();
    UI.toast("Obra excluída.");
  },
  setStatus(id,status){
    const p=this.data.projects.find(x=>x.id===id);
    if(!p)return;
    p.state.meta.status=status;
    p.summary.status=status;
    p.state.meta.updatedAt=new Date().toISOString();
    if(State.meta.id===id)State.meta.status=status;
    this.save();
    Storage.save();
    UI.renderProjects();
    UI.renderHome();
  },
  exportAll(){
    this.saveCurrent();
    const file={app:App,kind:"backup_geral_obras",exportedAt:new Date().toISOString(),manager:this.data};
    const blob=new Blob([JSON.stringify(file,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="obra-facil-pro-backup-geral-pacote-10.json";
    a.click();
    URL.revokeObjectURL(a.href);
    localStorage.setItem("obra_facil_pro_last_backup",new Date().toISOString());
  },
  quickBackup(){
    this.exportAll();
    UI.toast("Backup geral exportado.");
  },
  importAll(event){
    const file=event.target.files[0];
    if(!file)return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const data=JSON.parse(rd.result);
        const incoming=data.manager||data;
        if(!incoming.projects||!Array.isArray(incoming.projects))throw new Error("backup inválido");
        if(!confirm("Importar backup geral? Isso substituirá a lista atual de obras neste navegador."))return;
        this.data=incoming;
        this.save();
        const current=this.data.projects.find(p=>p.id===this.data.currentId)||this.data.projects[0];
        this.data.currentId=current.id;
        this.apply(current.state);
        this.save();
        Storage.save();
        UI.fill();
        UI.renderAll();
        UI.go("obras");
        UI.toast("Backup geral importado.");
      }catch(e){UI.toast("Não foi possível importar o backup geral.");}
    };
    rd.readAsText(file);
    event.target.value="";
  }
};
