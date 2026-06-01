const Floorplan={
  snap(value){const grid=Number(State.floorplan.grid)||0.5;return round(Math.round((Number(value)||0)/grid)*grid,2)},
  ensurePositions(){
    const lotW=Number(State.project.lotWidth)||6,rooms=State.rooms||[];
    if(!rooms.length)return;
    const missing=rooms.some(room=>!Number.isFinite(Number(room.x))||!Number.isFinite(Number(room.y)));
    const allZero=rooms.length>1&&rooms.every(room=>(Number(room.x)||0)===0&&(Number(room.y)||0)===0);
    const keys=rooms.map(room=>`${Number(room.x)||0},${Number(room.y)||0}`);
    const repeated=keys.length!==new Set(keys).size;
    if(missing||allZero||repeated){this.autoLayout();return;}
    let cursorX=0,cursorY=0,rowH=0;rooms.forEach(room=>{if(Number.isFinite(Number(room.x))&&Number.isFinite(Number(room.y)))return;if(cursorX+room.width>lotW&&cursorX>0){cursorX=0;cursorY+=rowH;rowH=0}room.x=this.snap(cursorX);room.y=this.snap(cursorY);cursorX+=room.width;rowH=Math.max(rowH,room.length)})
  },
  autoLayout(){let cursorX=0,cursorY=0,rowH=0;const lotW=Number(State.project.lotWidth)||6;State.rooms.forEach(room=>{if(cursorX+room.width>lotW&&cursorX>0){cursorX=0;cursorY+=rowH;rowH=0}room.x=this.snap(cursorX);room.y=this.snap(cursorY);cursorX+=room.width;rowH=Math.max(rowH,room.length)})},
  rect(room){return{x:Number(room.x)||0,y:Number(room.y)||0,w:Number(room.width)||0,h:Number(room.length)||0}},
  overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y},
  validation(){
    this.ensurePositions();const lotW=Number(State.project.lotWidth)||0,lotL=Number(State.project.lotLength)||0,warnings=[],seen=new Set();
    const add=(type,text)=>{const key=type+"|"+text;if(!seen.has(key)){warnings.push([type,text]);seen.add(key)}};
    if(!State.rooms.length)add("warn","Cadastre cômodos para gerar a planta.");
    State.rooms.forEach(room=>{const r=this.rect(room);if(r.x<0||r.y<0||r.x+r.w>lotW||r.y+r.h>lotL)add("bad",`${room.name} está fora dos limites do terreno.`)});
    let overlapCount=0;
    for(let i=0;i<State.rooms.length;i++){for(let j=i+1;j<State.rooms.length;j++){if(this.overlaps(this.rect(State.rooms[i]),this.rect(State.rooms[j]))){overlapCount++;if(overlapCount<=6)add("bad",`${State.rooms[i].name} está sobreposto com ${State.rooms[j].name}.`)}}}
    if(overlapCount>6)add("bad",`Existem ${overlapCount} sobreposições no total. Use “Organizar automaticamente” para corrigir a distribuição inicial.`);
    const totalArea=Calc.totals(false).area,lotArea=lotW*lotL;if(lotArea>0&&totalArea>lotArea)add("bad",`A soma dos cômodos (${round(totalArea)}m²) ultrapassa o terreno (${round(lotArea)}m²).`);
    if(!warnings.length)add("ok","Planta sem sobreposição e dentro do terreno.");return warnings
  },
  invalidRooms(){const invalid=new Set(),lotW=Number(State.project.lotWidth)||0,lotL=Number(State.project.lotLength)||0;State.rooms.forEach(room=>{const r=this.rect(room);if(r.x<0||r.y<0||r.x+r.w>lotW||r.y+r.h>lotL)invalid.add(room.id)});for(let i=0;i<State.rooms.length;i++){for(let j=i+1;j<State.rooms.length;j++){if(this.overlaps(this.rect(State.rooms[i]),this.rect(State.rooms[j]))){invalid.add(State.rooms[i].id);invalid.add(State.rooms[j].id)}}}return invalid}
};
