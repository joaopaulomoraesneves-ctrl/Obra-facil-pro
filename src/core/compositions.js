const Compositions={
  defaults(){return{tileMortarKgM2:4.5,mortarBagKg:20,groutKgM2:0.25,plasterThicknessCm:2,plasterCementBagsM3:6,plasterSandM3M3:1.15,subfloorThicknessCm:4,subfloorCementBagsM3:5,subfloorSandM3M3:1.1,chapiscoKgM2:1.5}},
  calculate(log=false){
    const t=Calc.totals(false),c=State.compositions,loss=1+Number(State.project.lossProfile||0);
    const floorArea=Number(t.area)||0,wallArea=Number(t.wallNet)||0;
    const tileMortarKg=round(floorArea*(Number(c.tileMortarKgM2)||0)*loss,1);
    const tileMortarBags=Math.ceil(tileMortarKg/(Number(c.mortarBagKg)||20));
    const groutKg=round(floorArea*(Number(c.groutKgM2)||0)*loss,1);
    const plasterVolume=round(wallArea*((Number(c.plasterThicknessCm)||0)/100)*loss,3);
    const plasterCementBags=Math.ceil(plasterVolume*(Number(c.plasterCementBagsM3)||0));
    const plasterSandM3=round(plasterVolume*(Number(c.plasterSandM3M3)||0),2);
    const subfloorVolume=round(floorArea*((Number(c.subfloorThicknessCm)||0)/100)*loss,3);
    const subfloorCementBags=Math.ceil(subfloorVolume*(Number(c.subfloorCementBagsM3)||0));
    const subfloorSandM3=round(subfloorVolume*(Number(c.subfloorSandM3M3)||0),2);
    const chapiscoKg=round(wallArea*(Number(c.chapiscoKgM2)||0)*loss,1);
    if(log){
      Audit.add("compositions.materials","Composições",`Piso ${round(floorArea)}m², paredes ${round(wallArea)}m², perda ${round((loss-1)*100)}%. Argamassa piso ${tileMortarBags} sacos, rejunte ${groutKg}kg, reboco ${plasterVolume}m³, contrapiso ${subfloorVolume}m³.`,`Argamassa ${tileMortarBags} sacos`);
    }
    return{floorArea,wallArea,tileMortarKg,tileMortarBags,groutKg,plasterVolume,plasterCementBags,plasterSandM3,subfloorVolume,subfloorCementBags,subfloorSandM3,chapiscoKg};
  },
  rows(){
    const c=this.calculate(false);
    return [
      {service:"Piso/revestimento",base:`${round(c.floorArea)} m²`,item:"Argamassa AC",qty:c.tileMortarBags,unit:"sacos",formula:"área × kg/m² × perda ÷ kg/saco"},
      {service:"Piso/revestimento",base:`${round(c.floorArea)} m²`,item:"Rejunte",qty:c.groutKg,unit:"kg",formula:"área × kg/m² × perda"},
      {service:"Chapisco",base:`${round(c.wallArea)} m²`,item:"Material de chapisco",qty:c.chapiscoKg,unit:"kg",formula:"parede útil × kg/m² × perda"},
      {service:"Reboco",base:`${round(c.wallArea)} m²`,item:"Volume de argamassa",qty:c.plasterVolume,unit:"m³",formula:"parede útil × espessura × perda"},
      {service:"Reboco",base:`${round(c.plasterVolume,3)} m³`,item:"Cimento",qty:c.plasterCementBags,unit:"sacos",formula:"volume × sacos/m³"},
      {service:"Reboco",base:`${round(c.plasterVolume,3)} m³`,item:"Areia",qty:c.plasterSandM3,unit:"m³",formula:"volume × fator de areia"},
      {service:"Contrapiso",base:`${round(c.floorArea)} m²`,item:"Volume de argamassa",qty:c.subfloorVolume,unit:"m³",formula:"área piso × espessura × perda"},
      {service:"Contrapiso",base:`${round(c.subfloorVolume,3)} m³`,item:"Cimento",qty:c.subfloorCementBags,unit:"sacos",formula:"volume × sacos/m³"},
      {service:"Contrapiso",base:`${round(c.subfloorVolume,3)} m³`,item:"Areia",qty:c.subfloorSandM3,unit:"m³",formula:"volume × fator de areia"}
    ];
  },
  purchaseItems(){
    const c=this.calculate(false);
    return [
      {id:"tile_mortar_bags",name:"Argamassa para piso/revestimento",unit:"sacos",planned:c.tileMortarBags,defaultPrice:0,source:"Composição de piso"},
      {id:"grout_kg",name:"Rejunte",unit:"kg",planned:c.groutKg,defaultPrice:0,source:"Composição de piso"},
      {id:"chapisco_kg",name:"Material para chapisco",unit:"kg",planned:c.chapiscoKg,defaultPrice:0,source:"Composição de parede"},
      {id:"plaster_cement_bags",name:"Cimento para reboco",unit:"sacos",planned:c.plasterCementBags,defaultPrice:0,source:"Composição de reboco"},
      {id:"plaster_sand_m3",name:"Areia para reboco",unit:"m³",planned:c.plasterSandM3,defaultPrice:0,source:"Composição de reboco"},
      {id:"subfloor_cement_bags",name:"Cimento para contrapiso",unit:"sacos",planned:c.subfloorCementBags,defaultPrice:0,source:"Composição de contrapiso"},
      {id:"subfloor_sand_m3",name:"Areia para contrapiso",unit:"m³",planned:c.subfloorSandM3,defaultPrice:0,source:"Composição de contrapiso"}
    ].filter(x=>Number(x.planned)>0);
  },
  warnings(){
    const w=[],c=State.compositions;
    if(!State.rooms.length)w.push(["warn","Cadastre cômodos para calcular composições."]);
    if((Number(c.plasterThicknessCm)||0)>4)w.push(["warn","Espessura de reboco alta. Confira se esse valor está correto."]);
    if((Number(c.subfloorThicknessCm)||0)>8)w.push(["warn","Espessura de contrapiso alta. Confira se esse valor está correto."]);
    if(!w.length)w.push(["ok","Composições calculadas sem alertas importantes."]);
    return w;
  }
};
