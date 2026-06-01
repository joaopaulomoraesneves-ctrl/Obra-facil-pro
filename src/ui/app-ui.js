const UI={
  go(id){
    document.querySelectorAll(".page").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("on"));
    $(id).classList.add("on");const b=document.querySelector(`[data-tab="${id}"]`);if(b)b.classList.add("on");
    if(id==="prebackend")this.renderPreBackend();if(id==="backend")this.renderBackend();if(id==="sistema")this.renderSystemHealth();if(id==="obras")this.renderProjects();if(id==="composicoes")this.renderCompositions();if(id==="instalacoes")this.renderInstallations();if(id==="compras")this.renderPurchases();if(id==="planta")this.renderFloorplan();if(id==="acompanhamento")this.renderTracking();if(id==="relatorio")this.renderReport();if(id==="auditoria")this.renderAudit(false);
    scrollTo({top:0,behavior:"smooth"});
  },
  toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(this.t);this.t=setTimeout(()=>el.classList.remove("show"),2500)},
  createNewProject(){
    ProjectManager.create(newProjectName.value.trim()||"Nova obra",newProjectStatus.value||"orcamento");
    newProjectName.value="";
  },
  renderProjects(){
    if(!$("projectsList"))return;
    ProjectManager.saveCurrent();
    const projects=ProjectManager.data.projects||[];
    const totals={
      all:projects.length,
      orcamento:projects.filter(p=>p.summary.status==="orcamento").length,
      andamento:projects.filter(p=>p.summary.status==="andamento").length,
      finalizada:projects.filter(p=>p.summary.status==="finalizada").length
    };
    managerTotals.innerHTML=this.stat([[totals.all,"Obras"],[totals.orcamento,"Em orçamento"],[totals.andamento,"Em andamento"],[totals.finalizada,"Finalizadas"]]);
    projectsList.innerHTML=projects.length?projects.map(p=>{
      const s=p.summary||{};
      const active=p.id===ProjectManager.data.currentId;
      return `<div class="projectCard ${active?"activeProject":""}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div>
            <h3>${esc(s.name||"Obra sem nome")}</h3>
            <div class="mut">Cliente: ${esc(s.client||"Não informado")}</div>
            ${active?`<div class="currentProjectPill">Obra aberta agora</div>`:""}
          </div>
          <select onchange="ProjectManager.setStatus('${p.id}',this.value)">
            <option value="orcamento" ${s.status==="orcamento"?"selected":""}>Orçamento</option>
            <option value="andamento" ${s.status==="andamento"?"selected":""}>Em andamento</option>
            <option value="pausada" ${s.status==="pausada"?"selected":""}>Pausada</option>
            <option value="finalizada" ${s.status==="finalizada"?"selected":""}>Finalizada</option>
          </select>
        </div>
        <div class="projectMeta">
          <div><b>${s.rooms||0}</b><span>Cômodos</span></div>
          <div><b>${round(s.area||0)}m²</b><span>Área</span></div>
          <div><b>${money(s.value||0)}</b><span>Valor</span></div>
          <div><b>${s.deadlineDays||0} dias</b><span>Prazo</span></div>
        </div>
        <div class="projectActions">
          <button onclick="ProjectManager.open('${p.id}')">Abrir</button>
          <button class="sec" onclick="ProjectManager.open('${p.id}');ProjectManager.duplicateCurrent()">Duplicar</button>
          <button class="danger" onclick="ProjectManager.remove('${p.id}')">Excluir</button>
        </div>
        <p class="mut">Atualizada em ${new Date(s.updatedAt||Date.now()).toLocaleString("pt-BR")}</p>
      </div>`;
    }).join(""):`<div class="empty">Nenhuma obra cadastrada.</div>`;
  },


  saveBackendSettings(){
    State.backend={
      tenantName:tenantName.value.trim()||"Minha Empresa",
      ownerName:ownerName.value.trim(),
      ownerEmail:ownerEmail.value.trim(),
      plan:backendPlan.value||"local",
      cloudReady:BackendPrep.readiness().every(x=>x[1])
    };
    Storage.save();
    this.renderBackend();
    this.renderReport();
    this.toast("Preparação de backend salva.");
  },
  renderBackend(){
    if(!$("backendReadiness"))return;
    const checks=BackendPrep.readiness();
    const ready=checks.filter(x=>x[1]).length;
    backendReadiness.innerHTML=[
      ["Prontidão",Math.round((ready/checks.length)*100)+"%",ready===checks.length?"healthOk":"healthWarn"],
      ["Tabelas sugeridas",BackendPrep.tables().length,"healthOk"],
      ["Obras no pacote",ProjectManager.data.projects.length,"healthOk"],
      ["Plano",State.backend?.plan||"local","healthOk"]
    ].map(x=>`<div class="healthItem ${x[2]}"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
    backendWarnings.innerHTML=this.warnings(BackendPrep.warnings());

    dataModelList.innerHTML=BackendPrep.tables().map(t=>`<div class="backendStep"><b>${esc(t[0])}</b><span class="mut">${esc(t[1])}</span></div>`).join("");

    migrationChecklist.innerHTML=checks.map(c=>`<div class="warn ${c[1]?"ok":"bad"}"><b>${c[1]?"✓":"!"} ${esc(c[0])}</b><br>${c[1]?"Pronto":esc(c[2])}</div>`).join("");

    const normalized=BackendPrep.normalized();
    normalizedPreview.textContent=JSON.stringify({
      schemaVersion:normalized.schemaVersion,
      tenant:normalized.tenant,
      currentProjectId:normalized.currentProjectId,
      projectsCount:normalized.projects.length,
      sampleProject:normalized.current.project,
      sampleRooms:normalized.current.rooms.slice(0,2)
    },null,2);
    sqlPreview.textContent=BackendPrep.sql();
  },
  renderSystemHealth(){
    if(!$("healthTotals"))return;
    const h=SystemHealth.collect();
    const readiness=SystemHealth.readiness();
    const score=Math.round((readiness.filter(x=>x[1]).length/readiness.length)*100);
    healthTotals.innerHTML=[
      ["Pontuação",score+"%","healthOk"],
      ["Alertas graves",h.bad,h.bad?"healthBad":"healthOk"],
      ["Avisos",h.warn,h.warn?"healthWarn":"healthOk"],
      ["Obras salvas",ProjectManager.data.projects.length,"healthOk"],
      ["Área atual",round(h.t.area)+"m²","healthOk"],
      ["Valor atual",money(h.b.final),h.b.final>0?"healthOk":"healthWarn"],
      ["Prazo",h.sc.totalDays+" dias",h.sc.totalDays>0?"healthOk":"healthWarn"],
      ["Backup",h.lastBackup?new Date(h.lastBackup).toLocaleDateString("pt-BR"):"não feito",h.lastBackup?"healthOk":"healthWarn"]
    ].map(x=>`<div class="healthItem ${x[2]}"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");

    readinessList.innerHTML=readiness.map(item=>`<div class="warn ${item[1]?"ok":"bad"}"><b>${item[1]?"✓":"!"} ${esc(item[0])}</b><br>${item[1]?"Pronto":esc(item[2])}</div>`).join("");

    allSystemWarnings.innerHTML=h.all.length?h.all.map(w=>`<div class="warn ${w[1]==="bad"?"bad":w[1]==="ok"?"ok":""}"><b>${esc(w[0])}:</b> ${esc(w[2])}</div>`).join(""):`<div class="warn ok">Nenhum alerta encontrado.</div>`;
  },
  fill(){
    const p=State.project,s=State.settings,b=State.budget,c=State.schedule;
    projectName.value=p.name;clientName.value=p.client;if($("projectStatus"))projectStatus.value=State.meta.status||"orcamento";lotWidth.value=p.lotWidth;lotLength.value=p.lotLength;defaultHeight.value=p.defaultHeight;lossProfile.value=String(p.lossProfile);projectNotes.value=p.notes;
    roomHeight.value=p.defaultHeight;
    floorYield.value=s.floorYield;blocksPerM2.value=s.blocksPerM2;paintYield.value=s.paintYield;paintCoats.value=s.paintCoats;
    priceFloorBox.value=b.priceFloorBox;pricePaintLiter.value=b.pricePaintLiter;priceBlock.value=b.priceBlock;laborPerM2.value=b.laborPerM2;manualLabor.value=b.manualLabor??"";extraCosts.value=b.extraCosts;safetyMargin.value=b.safetyMargin;profitMargin.value=b.profitMargin;discount.value=b.discount;
    startDate.value=c.startDate||todayISO();workdaysPerWeek.value=c.workdaysPerWeek;masons.value=c.masons;helpers.value=c.helpers;complexity.value=String(c.complexity);scheduleBuffer.value=c.scheduleBuffer;scheduleNotes.value=c.notes||"";
    if($("tileMortarKgM2")){const cp=State.compositions;tileMortarKgM2.value=cp.tileMortarKgM2;mortarBagKg.value=cp.mortarBagKg;groutKgM2.value=cp.groutKgM2;chapiscoKgM2.value=cp.chapiscoKgM2;plasterThicknessCm.value=cp.plasterThicknessCm;plasterCementBagsM3.value=cp.plasterCementBagsM3;plasterSandM3M3.value=cp.plasterSandM3M3;subfloorThicknessCm.value=cp.subfloorThicknessCm;subfloorCementBagsM3.value=cp.subfloorCementBagsM3;subfloorSandM3M3.value=cp.subfloorSandM3M3;}
    if($("wireMultiplier")){const is=State.installations.settings;wireMultiplier.value=is.wireMultiplier;conduitFactor.value=is.conduitFactor;pipeFactor.value=is.pipeFactor;hydraulicPointPipeM.value=is.hydraulicPointPipeM;sewerPointPipeM.value=is.sewerPointPipeM;defaultOutletWireM.value=is.defaultOutletWireM;defaultLightWireM.value=is.defaultLightWireM;defaultSwitchWireM.value=is.defaultSwitchWireM;}
    if($("tenantName")){tenantName.value=State.backend?.tenantName||"";ownerName.value=State.backend?.ownerName||"";ownerEmail.value=State.backend?.ownerEmail||"";backendPlan.value=State.backend?.plan||"local";}
  },
  saveProject(){
    State.project={name:projectName.value.trim(),client:clientName.value.trim(),lotWidth:n("lotWidth",6),lotLength:n("lotLength",20),defaultHeight:n("defaultHeight",2.8),lossProfile:n("lossProfile",.10),notes:projectNotes.value.trim()};
    State.meta.status=projectStatus.value||State.meta.status||"orcamento";
    Storage.save();this.renderAll();this.toast("Obra salva.");
  },
  saveSettings(){State.settings={floorYield:n("floorYield",2.5),blocksPerM2:n("blocksPerM2",12.5),paintYield:n("paintYield",12),paintCoats:n("paintCoats",2)};Storage.save();this.renderAll();this.toast("Configurações salvas.")},
  saveBudget(){State.budget={priceFloorBox:n("priceFloorBox"),pricePaintLiter:n("pricePaintLiter"),priceBlock:n("priceBlock"),laborPerM2:n("laborPerM2"),manualLabor:manualLabor.value===""?null:n("manualLabor"),extraCosts:n("extraCosts"),safetyMargin:n("safetyMargin",10),profitMargin:n("profitMargin",20),discount:n("discount")};Storage.save();this.renderAll();this.toast("Orçamento salvo.")},
  saveSchedule(){State.schedule={startDate:startDate.value||todayISO(),workdaysPerWeek:n("workdaysPerWeek",6),masons:n("masons",1),helpers:n("helpers",1),complexity:n("complexity",1),scheduleBuffer:n("scheduleBuffer",10),notes:scheduleNotes.value.trim()};Storage.save();this.renderAll();this.toast("Cronograma salvo.")},
  addRoom(){
    const room={id:cryptoRandom(),name:roomName.value.trim()||`Cômodo ${State.rooms.length+1}`,type:roomType.value,width:n("roomWidth"),length:n("roomLength"),height:n("roomHeight",State.project.defaultHeight),doorCount:n("doorCount"),windowCount:n("windowCount"),doorSize:doorSize.value||"0.80x2.10",windowSize:windowSize.value||"1.20x1.00",x:null,y:null};
    if(room.width<=0||room.length<=0||room.height<=0){this.toast("Informe medidas válidas.");return}
    State.rooms.push(room);Storage.save();roomName.value=roomWidth.value=roomLength.value="";roomHeight.value=State.project.defaultHeight;this.renderAll();this.toast("Cômodo adicionado.");
  },
  removeRoom(id){State.rooms=State.rooms.filter(r=>r.id!==id);Storage.save();this.renderAll();this.toast("Cômodo removido.")},
  addSamples(){
    const h=State.project.defaultHeight||2.8;
    [["Sala","social",3.5,4],["Cozinha","kitchen",3,3],["Quarto 1","bedroom",3,3.2],["Banheiro","bathroom",1.5,2.4],["Área serviço","service",1.8,2.2]].forEach(x=>State.rooms.push({id:cryptoRandom(),name:x[0],type:x[1],width:x[2],length:x[3],height:h,doorCount:1,windowCount:1,doorSize:"0.80x2.10",windowSize:"1.20x1.00",x:null,y:null}));
    Storage.save();this.renderAll();this.toast("Exemplo adicionado.");
  },
  renderAll(){this.renderHome();this.renderBackend();this.renderSystemHealth();this.renderProjects();this.renderProject();this.renderRooms();this.renderCalculations();this.renderCompositions();this.renderInstallations();this.renderBudget();this.renderSchedule();this.renderPurchases();this.renderTracking();this.renderReport();this.renderFloorplan();this.renderAudit(false)},
  stat(items){return items.map(i=>`<div class="stat"><b>${i[0]}</b><span>${i[1]}</span></div>`).join("")},
  renderHome(){
    const t=Calc.totals(false),b=Calc.budget(false),s=Schedule.stages(false),lot=State.project.lotWidth*State.project.lotLength;
    dash.innerHTML=this.stat([[State.rooms.length,"Cômodos"],[round(t.area)+" m²","Área construída"],[money(b.final),"Valor sugerido"],[s.totalDays+" dias","Prazo estimado"],[fmtDate(s.start),"Início"],[fmtDate(s.end),"Término"],[round(lot)+" m²","Terreno"],[Math.round(t.blocks),"Blocos"]]);
    homeWarns.innerHTML=this.warnings([...this.projectWarnings(),...Schedule.warnings()]);
  },
  projectWarnings(){
    const w=[],lot=State.project.lotWidth*State.project.lotLength,t=Calc.totals(false);
    if(!State.project.name)w.push(["warn","A obra ainda não tem nome."]);
    if(State.project.lotWidth<=0||State.project.lotLength<=0)w.push(["bad","Medidas do terreno inválidas."]);
    if(t.area>lot&&lot>0)w.push(["bad",`Área dos cômodos (${round(t.area)}m²) ultrapassa o terreno (${round(lot)}m²).`]);
    return w;
  },
  renderProject(){projectWarnings.innerHTML=this.warnings(this.projectWarnings())},
  warnings(list){if(!list.length)return`<div class="warn ok">Nenhum alerta importante encontrado.</div>`;return list.map(w=>`<div class="warn ${w[0]==="bad"?"bad":""}">${esc(w[1])}</div>`).join("")},
  renderRooms(){
    roomsList.innerHTML=State.rooms.length?State.rooms.map(r=>{const c=Calc.room(r,false);return`<div class="room"><div class="roomHead"><div><b>${esc(r.name)}</b><div class="mut">${r.width}m × ${r.length}m × ${r.height}m</div></div><button class="danger" onclick="UI.removeRoom('${r.id}')">Remover</button></div><div class="mini"><div><span>Área</span><b>${round(c.area)}m²</b></div><div><span>Paredes úteis</span><b>${round(c.wallNet)}m²</b></div><div><span>Caixas piso</span><b>${c.floorBoxes}</b></div><div><span>Blocos</span><b>${c.blocks}</b></div></div></div>`}).join(""):`<div class="empty">Nenhum cômodo cadastrado.</div>`;
  },
  renderCalculations(){
    const t=Calc.totals(false);
    calcTotals.innerHTML=this.stat([[round(t.area)+" m²","Área de piso"],[round(t.wallNet)+" m²","Paredes úteis"],[t.floorBoxes,"Caixas piso"],[round(t.paintLiters,1)+" L","Tinta"],[Math.round(t.blocks),"Blocos"],[round(t.baseboard)+" m","Rodapé"],[round(t.volume)+" m³","Volume"],[round(t.openings)+" m²","Aberturas"]]);
    materialsRows.innerHTML=State.rooms.length?State.rooms.map(r=>{const c=Calc.room(r,false);return`<tr><td><b>${esc(r.name)}</b></td><td>${round(c.area)}m²</td><td>${round(c.wallNet)}m²</td><td>${c.floorBoxes}</td><td>${round(c.paintLiters,1)}L</td><td>${c.blocks}</td><td><span class="badge high">Área alta</span><br><span class="badge mid">Materiais média</span></td></tr>`}).join(""):`<tr><td colspan="7">Cadastre cômodos.</td></tr>`;
  },

  saveCompositions(){
    State.compositions={
      tileMortarKgM2:n("tileMortarKgM2",4.5),
      mortarBagKg:n("mortarBagKg",20),
      groutKgM2:n("groutKgM2",0.25),
      chapiscoKgM2:n("chapiscoKgM2",1.5),
      plasterThicknessCm:n("plasterThicknessCm",2),
      plasterCementBagsM3:n("plasterCementBagsM3",6),
      plasterSandM3M3:n("plasterSandM3M3",1.15),
      subfloorThicknessCm:n("subfloorThicknessCm",4),
      subfloorCementBagsM3:n("subfloorCementBagsM3",5),
      subfloorSandM3M3:n("subfloorSandM3M3",1.1)
    };
    Storage.save();this.renderCompositions();this.renderPurchases();this.renderReport();this.toast("Composições salvas.");
  },
  resetCompositions(){
    State.compositions=Compositions.defaults();
    this.fill();
    Storage.save();this.renderCompositions();this.renderPurchases();this.renderReport();this.toast("Composições restauradas.");
  },
  renderCompositions(){
    if(!$("compositionRows"))return;
    const c=Compositions.calculate(false);
    compositionTotals.innerHTML=this.stat([[c.tileMortarBags+" sacos","Argamassa piso"],[round(c.groutKg,1)+" kg","Rejunte"],[round(c.plasterVolume,3)+" m³","Volume reboco"],[round(c.subfloorVolume,3)+" m³","Volume contrapiso"],[c.plasterCementBags+c.subfloorCementBags+" sacos","Cimento estimado"],[round(c.plasterSandM3+c.subfloorSandM3,2)+" m³","Areia estimada"]]);
    compositionWarnings.innerHTML=this.warnings(Compositions.warnings());
    compositionRows.innerHTML=Compositions.rows().map(r=>`<tr><td><b>${esc(r.service)}</b></td><td>${esc(r.base)}</td><td>${esc(r.item)}</td><td><b>${round(r.qty,2)} ${esc(r.unit)}</b></td><td><span class="compFormula">${esc(r.formula)}</span></td></tr>`).join("");
  },
  renderBudget(){
    const t=Calc.totals(false),b=Calc.budget(false),bud=State.budget;
    budgetTotals.innerHTML=this.stat([[money(b.materials),"Materiais"],[money(b.labor),"Mão de obra"],[money(b.safety),"Segurança"],[money(b.profit),"Lucro"],[money(b.final),"Valor final"],[money(b.pricePerM2),"Preço/m²"]]);
    budgetRows.innerHTML=[
      ["Piso",`${t.floorBoxes} caixas`,money(bud.priceFloorBox),money(b.floorCost),"Cálculo de materiais"],
      ["Tinta",`${round(t.paintLiters,1)} L`,money(bud.pricePaintLiter),money(b.paintCost),"Paredes úteis"],
      ["Blocos",`${Math.round(t.blocks)} un.`,money(bud.priceBlock),money(b.blockCost),"Alvenaria estimada"],
      ["Mão de obra",bud.manualLabor!==null?"manual":`${round(t.area)}m² × ${money(bud.laborPerM2)}`,"-",money(b.labor),"Orçamento"],
      ["Outras despesas","manual","-",money(bud.extraCosts),"Orçamento"],
      ["Margem segurança",`${bud.safetyMargin}%`,"-",money(b.safety),"Risco/perdas"],
      ["Lucro",`${bud.profitMargin}%`,"-",money(b.profit),"Margem"],
      ["Desconto","manual","-",`-${money(bud.discount)}`,"Negociação"]
    ].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join("");
  },
  renderSchedule(){
    const sc=Schedule.stages(false);
    scheduleTotals.innerHTML=this.stat([[sc.totalDays+" dias","Duração estimada"],[fmtDate(sc.start),"Início"],[fmtDate(sc.end),"Término"],[round(sc.crew,2),"Força de equipe"],[State.schedule.masons,"Pedreiros"],[State.schedule.helpers,"Ajudantes"]]);
    scheduleWarnings.innerHTML=this.warnings(Schedule.warnings());
    const total=sc.totalDays||1,work=Number(State.schedule.workdaysPerWeek)||6;
    scheduleRows.innerHTML=sc.rows.map(r=>{const pct=Math.min(100,round(r.days/total*100,1));return`<tr><td><b>${r.name}</b></td><td>${r.metric}</td><td>${r.days}</td><td>${fmtDate(r.start)}</td><td>${fmtDate(r.end)}</td><td>${r.dep}</td><td><div class="progress"><div class="bar" style="width:${pct}%"></div></div><small>${pct}% do prazo</small></td></tr>`}).join("");
  },




  saveInstallationSettings(){
    State.installations.settings={
      wireMultiplier:n("wireMultiplier",2.8),
      conduitFactor:n("conduitFactor",1.25),
      pipeFactor:n("pipeFactor",1.15),
      hydraulicPointPipeM:n("hydraulicPointPipeM",4),
      sewerPointPipeM:n("sewerPointPipeM",3),
      defaultOutletWireM:n("defaultOutletWireM",8),
      defaultLightWireM:n("defaultLightWireM",10),
      defaultSwitchWireM:n("defaultSwitchWireM",6)
    };
    Storage.save();this.renderInstallations();this.renderPurchases();this.renderReport();this.toast("Parâmetros de instalações salvos.");
  },
  renderInstallations(){
    if(!$("installationRows"))return;
    Installations.ensure();
    const c=Installations.calculate(false);
    installationTotals.innerHTML=this.stat([[c.totalElectricalPoints,"Pontos elétricos"],[c.hydraulicPoints,"Pontos hidráulicos"],[round(c.conduitM,1)+" m","Conduíte"],[round(c.wire15M+c.wire25M,1)+" m","Fios"],[round(c.waterPipeM,1)+" m","Tubo água"],[round(c.sewerPipeM,1)+" m","Tubo esgoto"]]);
    installationWarnings.innerHTML=this.warnings(Installations.warnings());
    installationRooms.innerHTML=State.rooms.length?State.rooms.map(room=>{
      const d=State.installations.rooms[room.id]||Installations.defaultsForRoom(room);
      return `<div class="installCard">
        <h3>${esc(room.name)}</h3>
        <div class="installGrid">
          <div><label>Tomadas</label><input type="number" min="0" step="1" value="${d.outlets||0}" onchange="UI.updateInstallation('${room.id}','outlets',this.value)"></div>
          <div><label>Interruptores</label><input type="number" min="0" step="1" value="${d.switches||0}" onchange="UI.updateInstallation('${room.id}','switches',this.value)"></div>
          <div><label>Pontos de luz</label><input type="number" min="0" step="1" value="${d.lights||0}" onchange="UI.updateInstallation('${room.id}','lights',this.value)"></div>
          <div><label>Água fria</label><input type="number" min="0" step="1" value="${d.coldWater||0}" onchange="UI.updateInstallation('${room.id}','coldWater',this.value)"></div>
          <div><label>Esgoto</label><input type="number" min="0" step="1" value="${d.sewer||0}" onchange="UI.updateInstallation('${room.id}','sewer',this.value)"></div>
          <div><label>Chuveiro</label><input type="number" min="0" step="1" value="${d.shower||0}" onchange="UI.updateInstallation('${room.id}','shower',this.value)"></div>
          <div><label>Vaso sanitário</label><input type="number" min="0" step="1" value="${d.toilet||0}" onchange="UI.updateInstallation('${room.id}','toilet',this.value)"></div>
          <div><label>Pia/lavatório</label><input type="number" min="0" step="1" value="${d.sink||0}" onchange="UI.updateInstallation('${room.id}','sink',this.value)"></div>
          <div><label>Tanque</label><input type="number" min="0" step="1" value="${d.tank||0}" onchange="UI.updateInstallation('${room.id}','tank',this.value)"></div>
        </div>
      </div>`;
    }).join(""):`<div class="empty">Cadastre cômodos para configurar instalações.</div>`;
    installationRows.innerHTML=Installations.purchaseItems().map(item=>`<tr><td><b>${esc(item.name)}</b></td><td>${round(item.planned,1)} ${esc(item.unit)}</td><td>${esc(item.source)}</td><td><span class="badge tech">Validação técnica</span></td></tr>`).join("")||`<tr><td colspan="4">Nenhum material de instalação calculado.</td></tr>`;
  },
  updateInstallation(roomId,field,value){
    Installations.ensure();
    if(!State.installations.rooms[roomId])State.installations.rooms[roomId]={};
    State.installations.rooms[roomId][field]=Math.max(0,Number(value)||0);
    Storage.save();
    this.renderInstallations();
    this.renderPurchases();
    this.renderReport();
  },
  renderPurchases(){
    if(!$("purchaseRows"))return;
    const sum=Purchases.summary();
    purchaseTotals.innerHTML=[
      ["Custo planejado",money(sum.plannedCost)],
      ["Custo comprado",money(sum.boughtCost)],
      ["Valor usado",money(sum.usedValue)],
      ["Itens com falta",sum.missingItems]
    ].map(x=>`<div class="purchaseCell"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
    purchaseWarnings.innerHTML=this.warnings(Purchases.warnings());

    const rows=[];
    Purchases.estimatedItems().forEach(item=>{
      const data=Purchases.get(item.id);
      rows.push(this.purchaseRow(item,data,false));
    });
    State.purchases.manual.forEach((item,index)=>{
      rows.push(this.purchaseRow(item,item,true,index));
    });
    purchaseRows.innerHTML=rows.join("")||`<tr><td colspan="9">Nenhum material encontrado.</td></tr>`;
  },
  purchaseRow(item,data,isManual,index=null){
    const planned=Number(item.planned)||0;
    const bought=Number(data.bought)||0;
    const used=Number(data.used)||0;
    const price=Number(data.actualPrice ?? item.defaultPrice ?? item.price ?? 0)||0;
    const balance=round(bought-used,2);
    const missing=Math.max(0,round(planned-bought,2));
    const rowId=isManual?`manual:${index}`:item.id;
    return `<tr>
      <td><b>${esc(item.name)}</b><br><span class="mut">${esc(item.source||"Material manual")}</span></td>
      <td>${round(planned,2)} ${esc(item.unit)}</td>
      <td><input class="qtyInput" type="number" step=".01" value="${bought}" onchange="UI.updatePurchase('${rowId}','bought',this.value)"></td>
      <td><input class="qtyInput" type="number" step=".01" value="${used}" onchange="UI.updatePurchase('${rowId}','used',this.value)"></td>
      <td><span class="badge ${missing>0?'mid':'high'}">${balance} ${esc(item.unit)}</span><br><small>${missing>0?`faltam ${missing}`:"planejado ok"}</small></td>
      <td><input class="qtyInput" type="number" step=".01" value="${price}" onchange="UI.updatePurchase('${rowId}','actualPrice',this.value)"></td>
      <td><input class="wideInput" value="${esc(data.supplier||item.supplier||"")}" onchange="UI.updatePurchase('${rowId}','supplier',this.value)"></td>
      <td>
        <select onchange="UI.updatePurchase('${rowId}','status',this.value)">
          <option value="pendente" ${(data.status||"pendente")==="pendente"?"selected":""}>Pendente</option>
          <option value="comprar" ${data.status==="comprar"?"selected":""}>Comprar</option>
          <option value="comprado" ${data.status==="comprado"?"selected":""}>Comprado</option>
          <option value="entregue" ${data.status==="entregue"?"selected":""}>Entregue</option>
          <option value="usado" ${data.status==="usado"?"selected":""}>Usado</option>
        </select>
      </td>
      <td>${isManual?`<button class="danger" onclick="UI.removeManualMaterial(${index})">Remover</button>`:`<span class="badge statusPill">Calculado</span>`}</td>
    </tr>`;
  },
  updatePurchase(rowId,field,value){
    let target;
    if(rowId.startsWith("manual:")){
      const index=Number(rowId.split(":")[1]);
      target=State.purchases.manual[index];
      if(!target)return;
    }else{
      target=Purchases.get(rowId);
    }
    if(["bought","used","actualPrice"].includes(field))value=Number(value)||0;
    target[field]=value;
    Storage.save();
    this.renderPurchases();
    this.renderReport();
  },
  addManualMaterial(){
    const name=manualMaterialName.value.trim();
    if(!name){this.toast("Informe o nome do material.");return}
    State.purchases.manual.push({
      id:cryptoRandom(),
      name,
      unit:manualMaterialUnit.value.trim()||"un.",
      planned:n("manualMaterialPlanned",0),
      bought:0,
      used:0,
      actualPrice:n("manualMaterialPrice",0),
      supplier:manualMaterialSupplier.value.trim(),
      status:"comprar",
      source:"Material manual"
    });
    manualMaterialName.value="";
    manualMaterialUnit.value="";
    manualMaterialPlanned.value="";
    manualMaterialPrice.value="";
    manualMaterialSupplier.value="";
    Storage.save();
    this.renderPurchases();
    this.renderReport();
    this.toast("Material manual adicionado.");
  },
  removeManualMaterial(index){
    State.purchases.manual.splice(index,1);
    Storage.save();
    this.renderPurchases();
    this.renderReport();
    this.toast("Material removido.");
  },
  renderTracking(){
    Tracking.ensure();
    const sc=Schedule.stages(false),sum=Tracking.summary(),expected=Tracking.expectedProgress();
    trackingTotals.innerHTML=this.stat([[sum.progress+"%","Progresso real"],[expected+"%","Progresso esperado"],[sum.done+"/"+sum.total,"Etapas concluídas"],[money(sum.extraCosts),"Custos extras"],[round(sum.hours,1)+" h","Horas registradas"],[sum.inProgress,"Em andamento"]]);
    trackingWarnings.innerHTML=this.warnings(Tracking.warnings());

    if($("floorScale"))floorScale.value=State.floorplan.scale||40;
    if($("floorGrid"))floorGrid.value=State.floorplan.grid||0.5;
    logDate.value=logDate.value||todayISO();
    logStage.innerHTML=sc.rows.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join("");

    trackingRows.innerHTML=sc.rows.map((row,i)=>{
      const data=State.tracking.stages[row.name]||{status:"pendente",percent:0,actualStart:"",actualEnd:"",note:""};
      return `<tr>
        <td><b>${esc(row.name)}</b><br><span class="mut">${esc(row.metric)}</span></td>
        <td>${fmtDate(row.start)} até ${fmtDate(row.end)}<br><span class="mut">${row.days} dia(s)</span></td>
        <td>
          <select class="statusSelect" onchange="UI.updateStage(${i},'status',this.value)">
            <option value="pendente" ${data.status==="pendente"?"selected":""}>Pendente</option>
            <option value="andamento" ${data.status==="andamento"?"selected":""}>Em andamento</option>
            <option value="concluido" ${data.status==="concluido"?"selected":""}>Concluído</option>
            <option value="pausado" ${data.status==="pausado"?"selected":""}>Pausado</option>
          </select>
        </td>
        <td><input class="smallInput" type="number" min="0" max="100" step="1" value="${Number(data.percent)||0}" onchange="UI.updateStage(${i},'percent',this.value)">%</td>
        <td><input class="smallInput" type="date" value="${esc(data.actualStart||"")}" onchange="UI.updateStage(${i},'actualStart',this.value)"></td>
        <td><input class="smallInput" type="date" value="${esc(data.actualEnd||"")}" onchange="UI.updateStage(${i},'actualEnd',this.value)"></td>
        <td><textarea style="min-width:180px;min-height:54px" onchange="UI.updateStage(${i},'note',this.value)">${esc(data.note||"")}</textarea></td>
      </tr>`;
    }).join("");

    logsList.innerHTML=State.tracking.logs.length?State.tracking.logs.map((log,i)=>`<div class="logItem">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div><h4>${fmtDate(log.date)} — ${esc(log.stage)}</h4><div class="mut">Custo extra: ${money(log.extraCost)} | Horas: ${round(log.hours,1)}</div></div>
        <button class="danger" onclick="UI.removeLog(${i})">Remover</button>
      </div>
      <p>${esc(log.text)}</p>
    </div>`).join(""):`<div class="empty">Nenhum registro diário cadastrado.</div>`;
  },
  updateStage(index,field,value){
    const sc=Schedule.stages(false),row=sc.rows[index];
    if(!row)return;
    Tracking.ensure();
    if(field==="percent")value=Math.max(0,Math.min(100,Number(value)||0));
    State.tracking.stages[row.name][field]=value;
    if(field==="status"&&value==="concluido"){
      State.tracking.stages[row.name].percent=100;
      if(!State.tracking.stages[row.name].actualEnd)State.tracking.stages[row.name].actualEnd=todayISO();
    }
    if(field==="status"&&value==="andamento"&&!State.tracking.stages[row.name].actualStart){
      State.tracking.stages[row.name].actualStart=todayISO();
    }
    Storage.save();
    this.renderTracking();
  },
  addLog(){
    if(!logText.value.trim()){this.toast("Escreva um registro do diário.");return}
    State.tracking.logs.unshift({
      id:cryptoRandom(),
      date:logDate.value||todayISO(),
      stage:logStage.value||"Geral",
      text:logText.value.trim(),
      extraCost:n("logExtraCost",0),
      hours:n("logHours",0)
    });
    State.tracking.logs=State.tracking.logs.slice(0,120);
    logText.value="";logExtraCost.value=0;logHours.value=0;
    Storage.save();this.renderTracking();this.renderReport();this.toast("Registro adicionado ao diário.");
  },
  removeLog(index){
    State.tracking.logs.splice(index,1);
    Storage.save();this.renderTracking();this.renderReport();this.toast("Registro removido.");
  },
  renderReport(){
    Floorplan.ensurePositions();
    const p=State.project,t=Calc.totals(false),b=Calc.budget(false),sc=Schedule.stages(false),track=Tracking.summary(),expected=Tracking.expectedProgress(),floorWarningsList=Floorplan.validation(),purchaseSummary=Purchases.summary(),comp=Compositions.calculate(false),inst=Installations.calculate(false),health=SystemHealth.collect(),backendReady=BackendPrep.readiness().filter(x=>x[1]).length,backendTotal=BackendPrep.readiness().length;
    const areaTerreno=(p.lotWidth||0)*(p.lotLength||0);
    const rowsMaterials=[
      ["Área de piso",`${round(t.area)} m²`,"Base dos cômodos"],
      ["Paredes úteis",`${round(t.wallNet)} m²`,"Desconta portas e janelas"],
      ["Caixas de piso",`${t.floorBoxes} caixas`,"Inclui perda configurada"],
      ["Tinta",`${round(t.paintLiters,1)} L`,"Considera demãos e perda"],
      ["Blocos/tijolos",`${Math.round(t.blocks)} un.`,"Estimativa inicial"],
      ["Rodapé",`${round(t.baseboard)} m`,"Perímetro menos portas"]
    ];
    const rowsBudget=[
      ["Materiais",money(b.materials)],
      ["Mão de obra",money(b.labor)],
      ["Outras despesas",money(State.budget.extraCosts)],
      ["Margem de segurança",money(b.safety)],
      ["Lucro estimado",money(b.profit)],
      ["Desconto",`- ${money(State.budget.discount)}`],
      ["Valor final sugerido",money(b.final)],
      ["Preço por m²",money(b.pricePerM2)]
    ];
    const scheduleRows=sc.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.days} dia(s)</td><td>${fmtDate(r.start)}</td><td>${fmtDate(r.end)}</td></tr>`).join("");
    const materialRows=rowsMaterials.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join("");
    const budgetRows=rowsBudget.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join("");
    $("reportDocument").innerHTML=`
      <div class="reportHead">
        <div>
          <h2>Relatório da Obra</h2>
          <p>Gerado pelo ${App.name} — ${App.package} — ${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        <div style="text-align:right">
          <b>${esc(p.name||"Obra sem nome")}</b><br>
          <span class="mut">Cliente: ${esc(p.client||"Não informado")}</span>
        </div>
      </div>

      <div class="reportGrid">
        <div class="reportBox">
          <h3>1. Dados gerais</h3>
          <table class="reportTable">
            <tr><th>Campo</th><th>Informação</th></tr>
            <tr><td>Obra</td><td>${esc(p.name||"Não informado")}</td></tr>
            <tr><td>Cliente</td><td>${esc(p.client||"Não informado")}</td></tr><tr><td>Status</td><td>${esc(State.meta.status||"Orçamento")}</td></tr><tr><td>Saúde do sistema</td><td>${health.bad} alerta(s) grave(s), ${health.warn} aviso(s)</td></tr><tr><td>Prontidão backend</td><td>${backendReady}/${backendTotal} itens prontos</td></tr>
            <tr><td>Terreno</td><td>${round(p.lotWidth)}m × ${round(p.lotLength)}m = ${round(areaTerreno)}m²</td></tr>
            <tr><td>Área cadastrada</td><td>${round(t.area)}m²</td></tr>
            <tr><td>Altura padrão</td><td>${round(p.defaultHeight)}m</td></tr>
          </table>
        </div>

        <div class="reportBox">
          <h3>2. Resumo financeiro</h3>
          <table class="reportTable">
            <tr><th>Item</th><th>Valor</th></tr>
            ${budgetRows}
          </table>
        </div>

        <div class="reportBox">
          <h3>3. Levantamento de materiais</h3>
          <table class="reportTable">
            <tr><th>Item</th><th>Quantidade</th><th>Origem</th></tr>
            ${materialRows}
          </table>
        </div>

        <div class="reportBox">
          <h3>3.1 Controle de compras</h3>
          <table class="reportTable">
            <tr><th>Indicador</th><th>Resultado</th></tr>
            <tr><td>Custo planejado de compra</td><td>${money(purchaseSummary.plannedCost)}</td></tr>
            <tr><td>Custo já comprado</td><td>${money(purchaseSummary.boughtCost)}</td></tr>
            <tr><td>Valor já usado</td><td>${money(purchaseSummary.usedValue)}</td></tr>
            <tr><td>Itens com falta</td><td>${purchaseSummary.missingItems}</td></tr>
          </table>
        </div>

        <div class="reportBox">
          <h3>3.2 Composições de serviço</h3>
          <table class="reportTable">
            <tr><th>Insumo</th><th>Quantidade</th></tr>
            <tr><td>Argamassa para piso/revestimento</td><td>${comp.tileMortarBags} sacos</td></tr>
            <tr><td>Rejunte</td><td>${round(comp.groutKg,1)} kg</td></tr>
            <tr><td>Cimento para reboco</td><td>${comp.plasterCementBags} sacos</td></tr>
            <tr><td>Areia para reboco</td><td>${round(comp.plasterSandM3,2)} m³</td></tr>
            <tr><td>Cimento para contrapiso</td><td>${comp.subfloorCementBags} sacos</td></tr>
            <tr><td>Areia para contrapiso</td><td>${round(comp.subfloorSandM3,2)} m³</td></tr>
          </table>
        </div>

        <div class="reportBox">
          <h3>3.3 Instalações básicas</h3>
          <table class="reportTable">
            <tr><th>Item</th><th>Quantidade</th></tr>
            <tr><td>Pontos elétricos</td><td>${inst.totalElectricalPoints}</td></tr>
            <tr><td>Conduíte estimado</td><td>${round(inst.conduitM,1)} m</td></tr>
            <tr><td>Fio 1,5mm²</td><td>${round(inst.wire15M,1)} m</td></tr>
            <tr><td>Fio 2,5mm²</td><td>${round(inst.wire25M,1)} m</td></tr>
            <tr><td>Pontos hidráulicos</td><td>${inst.hydraulicPoints}</td></tr>
            <tr><td>Tubo água fria</td><td>${round(inst.waterPipeM,1)} m</td></tr>
            <tr><td>Tubo esgoto</td><td>${round(inst.sewerPipeM,1)} m</td></tr>
          </table>
        </div>

        <div class="reportBox">
          <h3>4. Prazo estimado</h3>
          <table class="reportTable">
            <tr><th>Resumo</th><th>Informação</th></tr>
            <tr><td>Início previsto</td><td>${fmtDate(sc.start)}</td></tr>
            <tr><td>Término previsto</td><td>${fmtDate(sc.end)}</td></tr>
            <tr><td>Duração estimada</td><td>${sc.totalDays} dia(s) úteis/trabalhados</td></tr>
            <tr><td>Equipe</td><td>${State.schedule.masons} pedreiro(s) e ${State.schedule.helpers} ajudante(s)</td></tr>
          </table>
        </div>

        <div class="reportBox">
          <h3>5. Acompanhamento</h3>
          <table class="reportTable">
            <tr><th>Indicador</th><th>Resultado</th></tr>
            <tr><td>Progresso informado</td><td>${track.progress}%</td></tr>
            <tr><td>Progresso esperado</td><td>${expected}%</td></tr>
            <tr><td>Etapas concluídas</td><td>${track.done} de ${track.total}</td></tr>
            <tr><td>Custos extras registrados</td><td>${money(track.extraCosts)}</td></tr>
            <tr><td>Horas registradas</td><td>${round(track.hours,1)} h</td></tr>
          </table>
        </div>
        <div class="reportBox">
          <h3>6. Planta baixa 2D</h3>
          <table class="reportTable">
            <tr><th>Validação</th><th>Resultado</th></tr>
            ${floorWarningsList.slice(0,5).map(w=>`<tr><td>${w[0]==="bad"?"Alerta":w[0]==="ok"?"OK":"Aviso"}</td><td>${esc(w[1])}</td></tr>`).join("")}
            ${floorWarningsList.length>5?`<tr><td>Resumo</td><td>Há mais ${floorWarningsList.length-5} alerta(s). Corrija na aba Planta antes de enviar o relatório final.</td></tr>`:""}
          </table>
        </div>
      </div>

      <div class="reportBox" style="margin-top:12px">
        <h3>7. Etapas da obra</h3>
        <table class="reportTable">
          <tr><th>Etapa</th><th>Duração</th><th>Início</th><th>Término</th></tr>
          ${scheduleRows}
        </table>
      </div>


      <div class="reportBox" style="margin-top:12px">
        <h3>8. Últimos registros do diário</h3>
        <table class="reportTable">
          <tr><th>Data</th><th>Etapa</th><th>Registro</th><th>Custo extra</th></tr>
          ${State.tracking.logs.slice(0,6).map(l=>`<tr><td>${fmtDate(l.date)}</td><td>${esc(l.stage)}</td><td>${esc(l.text)}</td><td>${money(l.extraCost)}</td></tr>`).join("")||`<tr><td colspan="4">Nenhum registro diário cadastrado.</td></tr>`}
        </table>
      </div>

      <div class="reportBox" style="margin-top:12px">
        <h3>9. Observações</h3>
        <p>${esc(p.notes||"Nenhuma observação cadastrada.")}</p>
        <p>${esc(State.schedule.notes||"Nenhuma observação específica de cronograma cadastrada.")}</p>
        <div class="reportNote">
          Este relatório é uma estimativa de apoio para levantamento, orçamento e planejamento. Cálculos estruturais, fundação, vigas, pilares, lajes, regularização legal e responsabilidade técnica devem ser validados por profissional habilitado.
        </div>
      </div>

      <div class="signatureArea">
        <div class="signatureLine">Responsável pela obra</div>
        <div class="signatureLine">Cliente</div>
      </div>
    `;
  },
  printReport(){
    this.renderReport();
    this.toast("Abrindo impressão. Escolha Salvar como PDF no navegador.");
    setTimeout(()=>window.print(),250);
  },
  exportReportHTML(){
    this.renderReport();
    const content=$("reportDocument").innerHTML;
    const file=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Obra Fácil Pro</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:24px}.reportDoc{max-width:980px;margin:auto}.reportHead{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px}.reportGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.reportBox{background:white;border:1px solid #cbd5e1;border-radius:14px;padding:12px;margin-bottom:12px}.reportTable{width:100%;border-collapse:collapse}.reportTable th,.reportTable td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left}.reportTable th{background:#e2e8f0}.reportNote{border-left:4px solid #f59e0b;background:#fffbeb;padding:10px;border-radius:10px}.signatureArea{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px}.signatureLine{border-top:1px solid #334155;padding-top:8px;text-align:center}</style></head><body><div class="reportDoc">${content}</div></body></html>`;
    const blob=new Blob([file],{type:"text/html"});
    const a=document.createElement("a");
    const safe=(State.project.name||"relatorio-obra-facil-pro").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
    a.href=URL.createObjectURL(blob);a.download=`${safe||"relatorio-obra-facil-pro"}.html`;a.click();URL.revokeObjectURL(a.href);
  },
  renderFloorplan(){
    if(!$("floorSvg"))return;
    Floorplan.ensurePositions();
    if($("floorScale"))floorScale.value=State.floorplan.scale||40;
    if($("floorGrid"))floorGrid.value=State.floorplan.grid||0.5;
    const svg=$("floorSvg"),lotW=State.project.lotWidth||6,lotL=State.project.lotLength||20;
    const scale=Number(State.floorplan.scale)||40,x0=45,y0=55,lotPxW=lotW*scale,lotPxH=lotL*scale;
    const invalid=Floorplan.invalidRooms();
    const colors={social:"#38bdf8",bedroom:"#a78bfa",kitchen:"#f59e0b",bathroom:"#22c55e",service:"#14b8a6",external:"#94a3b8"};
    let htmlSvg=`<rect width="900" height="560" fill="transparent"/>`;
    for(let gx=0;gx<=lotW;gx+=Number(State.floorplan.grid)||0.5){const x=x0+gx*scale;htmlSvg+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0+lotPxH}" stroke="rgba(148,163,184,.12)" stroke-width="1"/>`}
    for(let gy=0;gy<=lotL;gy+=Number(State.floorplan.grid)||0.5){const y=y0+gy*scale;htmlSvg+=`<line x1="${x0}" y1="${y}" x2="${x0+lotPxW}" y2="${y}" stroke="rgba(148,163,184,.12)" stroke-width="1"/>`}
    htmlSvg+=`<rect x="${x0}" y="${y0}" width="${lotPxW}" height="${lotPxH}" fill="rgba(15,23,42,.35)" stroke="rgba(34,197,94,.90)" stroke-width="3" rx="8"/><text x="${x0+8}" y="${y0-18}" fill="#cbd5e1" font-size="15" font-weight="800">Terreno ${round(lotW)}m × ${round(lotL)}m</text>`;
    if(!State.rooms.length)htmlSvg+=`<text x="450" y="285" text-anchor="middle" fill="#94a3b8" font-size="18">Adicione cômodos para gerar a planta</text>`;
    State.rooms.forEach(room=>{const x=x0+(Number(room.x)||0)*scale,y=y0+(Number(room.y)||0)*scale,w=room.width*scale,h=room.length*scale;const bad=invalid.has(room.id),stroke=bad?"#fb7185":(colors[room.type]||"#38bdf8");htmlSvg+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bad?'rgba(251,113,133,.20)':'rgba(56,189,248,.14)'}" stroke="${stroke}" stroke-width="2.5" rx="5"/><text x="${x+w/2}" y="${y+h/2-10}" text-anchor="middle" fill="#e5e7eb" font-size="12" font-weight="800">${esc(room.name)}</text><text x="${x+w/2}" y="${y+h/2+7}" text-anchor="middle" fill="#cbd5e1" font-size="10">${round(room.width)}m × ${round(room.length)}m</text><text x="${x+w/2}" y="${y+h/2+22}" text-anchor="middle" fill="#94a3b8" font-size="10">X:${round(room.x)} Y:${round(room.y)}</text>`});
    svg.innerHTML=htmlSvg;
    if($("floorWarnings"))floorWarnings.innerHTML=`<div class="floorHint">Se aparecer sobreposição, clique em <b>Organizar automaticamente</b>. Depois ajuste X/Y manualmente se necessário.</div><div class="compactWarn">${this.warnings(Floorplan.validation())}</div>`;
    if($("floorRows"))floorRows.innerHTML=State.rooms.length?State.rooms.map((room,index)=>{const c=Calc.room(room,false),bad=invalid.has(room.id);return`<tr><td><b>${esc(room.name)}</b></td><td>${round(room.width)}m × ${round(room.length)}m</td><td><input class="coordInput" type="number" step="${State.floorplan.grid||0.5}" value="${round(room.x)}" onchange="UI.updateRoomCoord(${index},'x',this.value)"></td><td><input class="coordInput" type="number" step="${State.floorplan.grid||0.5}" value="${round(room.y)}" onchange="UI.updateRoomCoord(${index},'y',this.value)"></td><td>${round(c.area)}m²</td><td><span class="badge ${bad?'tech':'high'}">${bad?'Verificar':'OK'}</span></td></tr>`}).join(""):`<tr><td colspan="6">Cadastre cômodos para editar a planta.</td></tr>`;
  },
  cleanDuplicateRooms(){
    const seen=new Set(),clean=[];
    State.rooms.forEach(room=>{const key=[room.name,room.width,room.length,room.height].join("|");if(!seen.has(key)){seen.add(key);clean.push(room)}});
    const removed=State.rooms.length-clean.length;State.rooms=clean;Floorplan.autoLayout();Storage.save();this.renderAll();this.toast(removed?`${removed} cômodo(s) duplicado(s) removido(s).`:"Nenhum cômodo duplicado encontrado.");
  },
  saveFloorSettings(){State.floorplan.scale=Math.max(20,Math.min(80,n("floorScale",40)));State.floorplan.grid=Math.max(.1,n("floorGrid",.5));Storage.save();this.renderFloorplan();this.toast("Configurações da planta salvas.")},
  autoLayoutFloorplan(){Floorplan.autoLayout();Storage.save();this.renderFloorplan();this.renderReport();this.toast("Planta organizada automaticamente.")},
  updateRoomCoord(index,field,value){const room=State.rooms[index];if(!room)return;room[field]=Floorplan.snap(value);Storage.save();this.renderFloorplan();this.renderReport()},
  exportFloorplanSVG(){this.renderFloorplan();const svg=$("floorSvg").outerHTML;const file=`<!doctype html><html><head><meta charset="utf-8"><title>Planta baixa - Obra Fácil Pro</title></head><body style="margin:0;background:#0f172a">${svg}</body></html>`;const blob=new Blob([file],{type:"text/html"});const a=document.createElement("a");const safe=(State.project.name||"planta-baixa").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");a.href=URL.createObjectURL(blob);a.download=`${safe||"planta-baixa"}-planta.html`;a.click();URL.revokeObjectURL(a.href)},
  renderAudit(refresh){
    if(refresh){Calc.totals(true);Calc.budget(true);Schedule.stages(true);Audit.add("tracking.progress","Acompanhamento",`Progresso informado ${Tracking.summary().progress}% versus esperado ${Tracking.expectedProgress()}%`,`${Tracking.summary().progress}%`);Audit.add("floorplan.validation","Planta baixa",Floorplan.validation().map(w=>w[1]).join("\n"),Floorplan.invalidRooms().size?`${Floorplan.invalidRooms().size} alerta(s)`:"Planta OK");Storage.save()}
    formulaBox.innerHTML=Formulas.map(f=>`<div class="audit"><b>${f[2]} <span class="badge">v${f[1]}</span></b><p class="mut">${f[3]}</p><span class="badge ${f[4]==='Alta'?'high':f[4]==='Média'?'mid':'tech'}">${f[4]}</span></div>`).join("");
    auditList.innerHTML=State.audit.length?State.audit.map(a=>`<div class="audit"><h4>${esc(a.formula)}</h4><p><b>Contexto:</b> ${esc(a.context)}</p><p><b>Resultado:</b> ${esc(a.result)}</p><code>${esc(a.steps)}</code></div>`).join(""):`<div class="empty">Clique em “Atualizar auditoria” para gerar o log.</div>`;
  }
};

Storage.load();if(typeof Floorplan!=="undefined"){Floorplan.ensurePositions();Storage.save();}UI.fill();UI.renderAll();
window.UI=UI;window.Storage=Storage;window.Audit=Audit;window.ProjectManager=ProjectManager;window.BackendPrep=BackendPrep;
