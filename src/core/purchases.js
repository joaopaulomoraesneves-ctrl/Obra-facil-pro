const Purchases={
  estimatedItems(){
    const t=Calc.totals(false),b=State.budget;
    const base=[
      {id:"floor_boxes",name:"Piso / revestimento",unit:"caixas",planned:t.floorBoxes,defaultPrice:b.priceFloorBox,source:"Cálculo de piso"},
      {id:"paint_liters",name:"Tinta",unit:"litros",planned:round(t.paintLiters,1),defaultPrice:b.pricePaintLiter,source:"Cálculo de pintura"},
      {id:"blocks",name:"Blocos / tijolos",unit:"unidades",planned:Math.round(t.blocks),defaultPrice:b.priceBlock,source:"Cálculo de alvenaria"},
      {id:"baseboard",name:"Rodapé",unit:"metros",planned:round(t.baseboard,1),defaultPrice:0,source:"Perímetro dos cômodos"}
    ];
    return [...base,...Compositions.purchaseItems(),...Installations.purchaseItems()];
  },
  get(id){
    if(!State.purchases.items[id])State.purchases.items[id]={bought:0,used:0,actualPrice:null,supplier:"",status:"pendente",note:""};
    return State.purchases.items[id];
  },
  allItems(){
    const estimated=this.estimatedItems().map(item=>({...item,type:"estimated"}));
    const manual=State.purchases.manual.map(item=>({...item,type:"manual"}));
    return [...estimated,...manual];
  },
  summary(){
    let plannedCost=0,boughtCost=0,usedValue=0,missingItems=0;
    this.allItems().forEach(item=>{
      const data=item.type==="estimated"?this.get(item.id):item;
      const planned=Number(item.planned)||0;
      const bought=Number(data.bought)||0;
      const used=Number(data.used)||0;
      const price=Number(data.actualPrice ?? item.defaultPrice ?? item.price ?? 0)||0;
      plannedCost+=planned*price;
      boughtCost+=bought*price;
      usedValue+=used*price;
      if(bought<planned)missingItems++;
    });
    return{plannedCost,boughtCost,usedValue,missingItems,totalItems:this.allItems().length};
  },
  warnings(){
    const s=this.summary(),w=[];
    if(!State.rooms.length)w.push(["warn","Cadastre cômodos para gerar uma lista de compras real."]);
    if(s.missingItems>0)w.push(["warn",`${s.missingItems} item(ns) ainda têm compra menor que o planejado.`]);
    if(s.boughtCost>Calc.budget(false).materials && Calc.budget(false).materials>0)w.push(["bad","O custo comprado já passou do custo de materiais previsto no orçamento."]);
    if(!w.length)w.push(["ok","Lista de compras sem alertas importantes."]);
    return w;
  }
};
