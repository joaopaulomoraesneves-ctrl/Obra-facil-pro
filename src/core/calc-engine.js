const Calc={
  room(room,log=false){
    const area=room.width*room.length;
    const perimeter=2*(room.width+room.length);
    const [dw,dh]=parseSize(room.doorSize),[ww,wh]=parseSize(room.windowSize);
    const openings=room.doorCount*dw*dh+room.windowCount*ww*wh;
    const wallGross=perimeter*room.height;
    const wallNet=Math.max(0,wallGross-openings);
    const floorBoxes=Math.ceil((area*(1+Number(State.project.lossProfile)))/(State.settings.floorYield||1));
    const paintLiters=round((wallNet*State.settings.paintCoats/(State.settings.paintYield||1))*(1+Number(State.project.lossProfile)),1);
    const blocks=Math.ceil(wallNet*State.settings.blocksPerM2*(1+Number(State.project.lossProfile)));
    const baseboard=Math.max(0,perimeter-room.doorCount*dw);
    if(log){
      Audit.add("geometry.area",room.name,`${room.width}m × ${room.length}m = ${round(area)}m²`,`${round(area)}m²`);
      Audit.add("geometry.wallNet",room.name,`${round(perimeter)}m perímetro × ${room.height}m - ${round(openings)}m² aberturas = ${round(wallNet)}m²`,`${round(wallNet)}m²`);
      Audit.add("materials.floor",room.name,`${round(area)}m² × ${(1+Number(State.project.lossProfile)).toFixed(2)} ÷ ${State.settings.floorYield}m²/caixa = ${floorBoxes} caixas`,`${floorBoxes} caixas`);
      Audit.add("materials.paint",room.name,`${round(wallNet)}m² × ${State.settings.paintCoats} demãos ÷ ${State.settings.paintYield} × perda = ${paintLiters}L`,`${paintLiters}L`);
      Audit.add("materials.blocks",room.name,`${round(wallNet)}m² × ${State.settings.blocksPerM2} blocos/m² × perda = ${blocks} blocos`,`${blocks} blocos`);
    }
    return{area,perimeter,openings,wallGross,wallNet,floorBoxes,paintLiters,blocks,baseboard,volume:area*room.height};
  },
  totals(log=false){
    if(log)State.audit=[];
    return State.rooms.map(r=>this.room(r,log)).reduce((a,c)=>{for(const k of ["area","wallNet","wallGross","openings","floorBoxes","paintLiters","blocks","baseboard","volume"])a[k]+=c[k]||0;return a},{area:0,wallNet:0,wallGross:0,openings:0,floorBoxes:0,paintLiters:0,blocks:0,baseboard:0,volume:0});
  },
  budget(log=false){
    const t=this.totals(false),b=State.budget;
    const floorCost=t.floorBoxes*b.priceFloorBox;
    const paintCost=t.paintLiters*b.pricePaintLiter;
    const blockCost=t.blocks*b.priceBlock;
    const materials=floorCost+paintCost+blockCost;
    const labor=b.manualLabor!==null&&b.manualLabor!==""?Number(b.manualLabor):t.area*b.laborPerM2;
    const base=materials+labor+b.extraCosts;
    const safety=base*b.safetyMargin/100;
    const minimum=base+safety;
    const profit=minimum*b.profitMargin/100;
    const final=Math.max(0,minimum+profit-b.discount);
    if(log){
      Audit.add("budget.total","Orçamento",`Materiais ${money(materials)} + mão de obra ${money(labor)} + despesas ${money(b.extraCosts)} + segurança ${money(safety)} + lucro ${money(profit)} - desconto ${money(b.discount)}`,money(final));
    }
    return{floorCost,paintCost,blockCost,materials,labor,base,safety,minimum,profit,final,pricePerM2:t.area?final/t.area:0};
  }
};

const Schedule={
  crewFactor(){
    const s=State.schedule;
    return Math.max(0.5,Number(s.masons||0)+Number(s.helpers||0)*0.45);
  },
  stages(log=false){
    const t=Calc.totals(false);
    const lot=State.project.lotWidth*State.project.lotLength;
    const s=State.schedule;
    const crew=this.crewFactor();
    const complexity=Number(s.complexity)||1;
    const buffer=(1+(Number(s.scheduleBuffer)||0)/100);
    const data=[
      {name:"Preparação e marcação",metric:`Terreno ${round(lot)}m²`,qty:Math.max(lot,1),rate:80,dep:"Início"},
      {name:"Fundação / baldrame",metric:`Área construída ${round(t.area)}m²`,qty:Math.max(t.area,1),rate:18,dep:"Preparação"},
      {name:"Alvenaria",metric:`${Math.round(t.blocks)} blocos`,qty:Math.max(t.blocks,1),rate:280,dep:"Fundação"},
      {name:"Laje ou telhado",metric:`Cobertura ${round(t.area)}m²`,qty:Math.max(t.area,1),rate:22,dep:"Alvenaria"},
      {name:"Elétrica e hidráulica básica",metric:`${State.rooms.length} cômodos`,qty:Math.max(State.rooms.length,1),rate:1.4,dep:"Alvenaria"},
      {name:"Chapisco/reboco",metric:`Paredes ${round(t.wallNet)}m²`,qty:Math.max(t.wallNet,1),rate:32,dep:"Instalações"},
      {name:"Contrapiso",metric:`Piso ${round(t.area)}m²`,qty:Math.max(t.area,1),rate:38,dep:"Reboco"},
      {name:"Piso e revestimento",metric:`Piso ${round(t.area)}m²`,qty:Math.max(t.area,1),rate:18,dep:"Contrapiso"},
      {name:"Pintura",metric:`Paredes ${round(t.wallNet)}m²`,qty:Math.max(t.wallNet,1),rate:55,dep:"Reboco/piso"},
      {name:"Acabamentos finais",metric:`${State.rooms.length} cômodos`,qty:Math.max(State.rooms.length,1),rate:0.85,dep:"Piso e pintura"}
    ];
    let cursor=s.startDate||todayISO();
    const rows=data.map((x,i)=>{
      const adjustedRate=x.rate*crew/complexity;
      const raw=x.qty/adjustedRate;
      const days=Math.max(1,Math.ceil(raw*buffer));
      const start=i===0?cursor:nextWorkDay(cursor,Number(s.workdaysPerWeek)||6);
      const end=addWorkDays(start,days,Number(s.workdaysPerWeek)||6);
      cursor=end;
      if(log)Audit.add("schedule.duration",x.name,`${x.metric}; produtividade base ${x.rate}; equipe ajustada ${round(crew,2)}; complexidade ${complexity}; folga ${round((buffer-1)*100)}%; resultado ${days} dia(s)`,`${days} dia(s)`);
      return{...x,days,start,end,raw};
    });
    const totalDays=rows.reduce((a,r)=>a+r.days,0);
    return{rows,totalDays,start:rows[0]?.start||s.startDate,end:rows.at(-1)?.end||s.startDate,crew};
  },
  warnings(){
    const w=[];
    if(!State.rooms.length)w.push(["bad","Cadastre cômodos para o prazo ficar mais realista."]);
    if((State.schedule.masons||0)+(State.schedule.helpers||0)<=0)w.push(["bad","Informe pelo menos um profissional na equipe."]);
    if(Calc.totals(false).area<=0)w.push(["bad","A área construída está zerada."]);
    if(!State.schedule.startDate)w.push(["warn","Defina uma data de início para gerar datas previstas."]);
    return w;
  }
};
