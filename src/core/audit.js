const Audit={
  add(formula,context,steps,result){State.audit.unshift({at:new Date().toISOString(),formula,context,steps,result});State.audit=State.audit.slice(0,160)},
  clear(){State.audit=[];Storage.save();UI.renderAudit(false);UI.toast("Auditoria limpa.")}
};
