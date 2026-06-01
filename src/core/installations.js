const Installations={
  defaultsForRoom(room){
    const type=room.type||"social";
    const base={outlets:2,switches:1,lights:1,coldWater:0,sewer:0,shower:0,toilet:0,sink:0,tank:0};
    if(type==="kitchen")return{...base,outlets:4,coldWater:2,sewer:1,sink:1};
    if(type==="bathroom")return{...base,outlets:1,coldWater:3,sewer:2,shower:1,toilet:1,sink:1};
    if(type==="service")return{...base,outlets:2,coldWater:2,sewer:1,tank:1};
    if(type==="bedroom")return{...base,outlets:3};
    if(type==="external")return{...base,outlets:1,lights:1};
    return base;
  },
  ensure(){
    State.rooms.forEach(room=>{
      if(!State.installations.rooms[room.id]){
        State.installations.rooms[room.id]=this.defaultsForRoom(room);
      }
    });
    Object.keys(State.installations.rooms).forEach(id=>{
      if(!State.rooms.some(r=>r.id===id))delete State.installations.rooms[id];
    });
  },
  calculate(log=false){
    this.ensure();
    const s=State.installations.settings;
    let outlets=0,switches=0,lights=0,coldWater=0,sewer=0,shower=0,toilet=0,sink=0,tank=0;
    State.rooms.forEach(room=>{
      const r=State.installations.rooms[room.id]||this.defaultsForRoom(room);
      outlets+=Number(r.outlets)||0;
      switches+=Number(r.switches)||0;
      lights+=Number(r.lights)||0;
      coldWater+=Number(r.coldWater)||0;
      sewer+=Number(r.sewer)||0;
      shower+=Number(r.shower)||0;
      toilet+=Number(r.toilet)||0;
      sink+=Number(r.sink)||0;
      tank+=Number(r.tank)||0;
    });
    const totalElectricalPoints=outlets+switches+lights;
    const conduitM=round((outlets*s.defaultOutletWireM+lights*s.defaultLightWireM+switches*s.defaultSwitchWireM)*s.conduitFactor,1);
    const wire15M=round((lights*s.defaultLightWireM+switches*s.defaultSwitchWireM)*s.wireMultiplier,1);
    const wire25M=round(outlets*s.defaultOutletWireM*s.wireMultiplier,1);
    const boxes4x2=Math.ceil(outlets+switches);
    const ceilingBoxes=Math.ceil(lights);
    const breakers=Math.max(1,Math.ceil(totalElectricalPoints/8));
    const hydraulicPoints=coldWater+shower+sink+tank+toilet;
    const sewerPoints=sewer+toilet+sink+tank;
    const waterPipeM=round(hydraulicPoints*s.hydraulicPointPipeM*s.pipeFactor,1);
    const sewerPipeM=round(sewerPoints*s.sewerPointPipeM*s.pipeFactor,1);
    const elbows=Math.ceil((hydraulicPoints+sewerPoints)*2.2);
    const tees=Math.ceil((hydraulicPoints+sewerPoints)*0.8);
    const registers=Math.ceil(Math.max(1,shower+sink+tank));
    if(log){
      Audit.add("installations.basic","Instalações",`Pontos elétricos: ${totalElectricalPoints}; conduíte ${conduitM}m; fio 1,5mm ${wire15M}m; fio 2,5mm ${wire25M}m. Pontos hidráulicos: ${hydraulicPoints}; tubo água ${waterPipeM}m; esgoto ${sewerPipeM}m.`,`${totalElectricalPoints} pontos elétricos e ${hydraulicPoints} pontos hidráulicos`);
    }
    return{outlets,switches,lights,coldWater,sewer,shower,toilet,sink,tank,totalElectricalPoints,conduitM,wire15M,wire25M,boxes4x2,ceilingBoxes,breakers,hydraulicPoints,sewerPoints,waterPipeM,sewerPipeM,elbows,tees,registers};
  },
  purchaseItems(){
    const c=this.calculate(false);
    return [
      {id:"electrical_conduit_m",name:"Conduíte elétrico",unit:"m",planned:c.conduitM,defaultPrice:0,source:"Instalações elétricas"},
      {id:"wire_15_m",name:"Fio 1,5mm²",unit:"m",planned:c.wire15M,defaultPrice:0,source:"Iluminação/interruptores"},
      {id:"wire_25_m",name:"Fio 2,5mm²",unit:"m",planned:c.wire25M,defaultPrice:0,source:"Tomadas"},
      {id:"box_4x2",name:"Caixa elétrica 4x2",unit:"un.",planned:c.boxes4x2,defaultPrice:0,source:"Tomadas/interruptores"},
      {id:"ceiling_box",name:"Caixa de teto/ponto de luz",unit:"un.",planned:c.ceilingBoxes,defaultPrice:0,source:"Pontos de luz"},
      {id:"breakers",name:"Disjuntores estimados",unit:"un.",planned:c.breakers,defaultPrice:0,source:"Quadro elétrico básico"},
      {id:"water_pipe_m",name:"Tubo água fria",unit:"m",planned:c.waterPipeM,defaultPrice:0,source:"Instalação hidráulica"},
      {id:"sewer_pipe_m",name:"Tubo esgoto",unit:"m",planned:c.sewerPipeM,defaultPrice:0,source:"Instalação sanitária"},
      {id:"hydraulic_elbows",name:"Joelhos/conexões",unit:"un.",planned:c.elbows,defaultPrice:0,source:"Instalações hidráulicas"},
      {id:"hydraulic_tees",name:"Tês/conexões",unit:"un.",planned:c.tees,defaultPrice:0,source:"Instalações hidráulicas"},
      {id:"registers",name:"Registros hidráulicos",unit:"un.",planned:c.registers,defaultPrice:0,source:"Água fria"}
    ].filter(x=>Number(x.planned)>0);
  },
  warnings(){
    const c=this.calculate(false),w=[];
    if(!State.rooms.length)w.push(["warn","Cadastre cômodos para estimar instalações."]);
    if(c.totalElectricalPoints>0)w.push(["bad","Elétrica é estimativa básica. Dimensionamento de circuitos, disjuntores, bitolas e carga deve ser validado por profissional habilitado."]);
    if(c.hydraulicPoints>0)w.push(["bad","Hidráulica é estimativa básica. Diâmetros, pressão, queda, esgoto e normas devem ser validados tecnicamente."]);
    if(c.outlets<Math.max(1,State.rooms.length))w.push(["warn","Quantidade de tomadas pode estar baixa para a quantidade de cômodos."]);
    if(!w.length)w.push(["ok","Sem alertas importantes de instalações."]);
    return w;
  }
};
