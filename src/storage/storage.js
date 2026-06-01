const Storage={
  save(){localStorage.setItem(StoreKey,JSON.stringify(State)); if(window.ProjectManager&&!Storage._savingManager){Storage._savingManager=true;try{ProjectManager.saveCurrent()}finally{Storage._savingManager=false;}}},
  load(){
    let raw=localStorage.getItem(StoreKey);
    if(!raw){for(const k of OldKeys){raw=localStorage.getItem(k);if(raw)break}}
    if(raw){try{const d=JSON.parse(raw);this.merge(d)}catch(e){}}
    if(!State.schedule.startDate)State.schedule.startDate=todayISO();
  },
  merge(d){
    const p=d.project||d.p||{};
    State.project={...State.project,
      name:p.name||p.n||State.project.name,client:p.client||p.c||State.project.client,
      lotWidth:Number(p.lotWidth??p.lw??State.project.lotWidth),lotLength:Number(p.lotLength??p.ll??State.project.lotLength),
      defaultHeight:Number(p.defaultHeight??p.h??State.project.defaultHeight),lossProfile:Number(p.lossProfile??p.loss??State.project.lossProfile),
      notes:p.notes||State.project.notes
    };
    State.rooms=Array.isArray(d.rooms)?d.rooms.map(x=>({
      id:String(x.id||cryptoRandom()),name:x.name||x.n||"Cômodo",type:x.type||"social",
      width:Number(x.width??x.w??0),length:Number(x.length??x.l??0),height:Number(x.height??x.h??State.project.defaultHeight),
      doorCount:Number(x.doorCount??x.dc??1),windowCount:Number(x.windowCount??x.wc??1),
      doorSize:x.doorSize||x.ds||"0.80x2.10",windowSize:x.windowSize||x.ws||"1.20x1.00",
      x:Number.isFinite(Number(x.x))?Number(x.x):null,y:Number.isFinite(Number(x.y))?Number(x.y):null
    })):State.rooms;
    const set=d.settings||d.set||d.materialSettings||{};
    State.settings={...State.settings,
      floorYield:Number(set.floorYield??set.fy??set.floorBoxYield??State.settings.floorYield),
      blocksPerM2:Number(set.blocksPerM2??set.bm??State.settings.blocksPerM2),
      paintYield:Number(set.paintYield??set.py??State.settings.paintYield),
      paintCoats:Number(set.paintCoats??set.co??State.settings.paintCoats)
    };
    const b=d.budget||d.b||{};
    State.budget={...State.budget,
      priceFloorBox:Number(b.priceFloorBox??b.pf??State.budget.priceFloorBox),
      pricePaintLiter:Number(b.pricePaintLiter??b.pp??State.budget.pricePaintLiter),
      priceBlock:Number(b.priceBlock??b.pb??State.budget.priceBlock),
      laborPerM2:Number(b.laborPerM2??b.lm??State.budget.laborPerM2),
      manualLabor:(b.manualLabor??b.lman??null),extraCosts:Number(b.extraCosts??b.ex??State.budget.extraCosts),
      safetyMargin:Number(b.safetyMargin??b.sg??State.budget.safetyMargin),
      profitMargin:Number(b.profitMargin??b.pr??State.budget.profitMargin),
      discount:Number(b.discount??b.dsct??State.budget.discount)
    };
    State.schedule={...State.schedule,...(d.schedule||{})};
    State.tracking={...State.tracking,...(d.tracking||{})};
    if(!State.tracking.stages)State.tracking.stages={};
    if(!Array.isArray(State.tracking.logs))State.tracking.logs=[];
    State.floorplan={...State.floorplan,...(d.floorplan||{})};
    State.purchases={...State.purchases,...(d.purchases||{})};
    if(!State.purchases.items)State.purchases.items={};
    if(!Array.isArray(State.purchases.manual))State.purchases.manual=[];
    State.compositions={...State.compositions,...(d.compositions||{})};
    State.backend={...State.backend,...(d.backend||{})};
    State.installations={...State.installations,...(d.installations||{})};
    if(!State.installations.rooms)State.installations.rooms={};
    State.installations.settings={...{wireMultiplier:2.8,conduitFactor:1.25,pipeFactor:1.15,defaultOutletWireM:8,defaultLightWireM:10,defaultSwitchWireM:6,hydraulicPointPipeM:4,sewerPointPipeM:3},...(State.installations.settings||{})};
  },
  exportJSON(){
    const blob=new Blob([JSON.stringify({app:App,exportedAt:new Date().toISOString(),...State},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="obra-facil-pro-pacote-15.json";a.click();URL.revokeObjectURL(a.href);
  },
  importJSON(e){
    const f=e.target.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{try{this.merge(JSON.parse(rd.result));State.audit=[];this.save();UI.fill();UI.renderAll();UI.toast("Dados importados.");}catch(err){UI.toast("Erro ao importar JSON.")}};
    rd.readAsText(f);e.target.value="";
  }
};
