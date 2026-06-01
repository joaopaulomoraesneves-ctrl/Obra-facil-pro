const App={name:"Obra Fácil Pro",package:"Pacote 18",engine:"ObraCalc Engine",version:"2.7.0"};
const StoreKey="obra_facil_pro_pacote_18";
const OldKeys=["obra_facil_pro_pacote_17","obra_facil_pro_pacote_16","obra_facil_pro_pacote_15","obra_facil_pro_pacote_14","obra_facil_pro_pacote_13","obra_facil_pro_pacote_12","obra_facil_pro_pacote_11","obra_facil_pro_pacote_10","obra_facil_pro_pacote_09","obra_facil_pro_pacote_08","obra_facil_pro_pacote_07","obra_facil_pro_pacote_06_2","obra_facil_pro_pacote_06_1","obra_facil_pro_pacote_06","obra_facil_pro_pacote_05","obra_facil_pro_pacote_04","obra_facil_pro_pacote_03","obra_facil_pro_pacote_02","obra_facil_pro_pacote_01"];
const State={
  meta:{id:"",status:"orcamento",createdAt:"",updatedAt:""},
  project:{name:"",client:"",lotWidth:6,lotLength:20,defaultHeight:2.8,lossProfile:0.10,notes:""},
  rooms:[],
  settings:{floorYield:2.5,blocksPerM2:12.5,paintYield:12,paintCoats:2},
  budget:{priceFloorBox:0,pricePaintLiter:0,priceBlock:0,laborPerM2:0,manualLabor:null,extraCosts:0,safetyMargin:10,profitMargin:20,discount:0},
  schedule:{startDate:"",workdaysPerWeek:6,masons:1,helpers:1,complexity:1,scheduleBuffer:10,notes:""},
  tracking:{stages:{},logs:[]},
  floorplan:{grid:0.5,showGrid:true,scale:40},
  purchases:{items:{},manual:[]},
  compositions:{tileMortarKgM2:4.5,mortarBagKg:20,groutKgM2:0.25,plasterThicknessCm:2,plasterCementBagsM3:6,plasterSandM3M3:1.15,subfloorThicknessCm:4,subfloorCementBagsM3:5,subfloorSandM3M3:1.1,chapiscoKgM2:1.5},
  installations:{rooms:{},settings:{wireMultiplier:2.8,conduitFactor:1.25,pipeFactor:1.15,defaultOutletWireM:8,defaultLightWireM:10,defaultSwitchWireM:6,hydraulicPointPipeM:4,sewerPointPipeM:3}},
  backend:{tenantName:"Minha Empresa",ownerName:"",ownerEmail:"",plan:"local",cloudReady:false},
  audit:[]
};
const Formulas=[
  ["geometry.area","1.0.0","Área do cômodo","largura × comprimento","Alta"],
  ["geometry.wallNet","1.0.0","Paredes úteis","perímetro × altura - portas - janelas","Alta"],
  ["materials.floor","1.0.0","Caixas de piso","arredondar((área × perda) ÷ rendimento)","Alta"],
  ["materials.paint","1.0.0","Litros de tinta","(parede útil × demãos ÷ rendimento) × perda","Média"],
  ["materials.blocks","1.0.0","Quantidade de blocos","parede útil × blocos/m² × perda","Média"],
  ["budget.total","1.1.0","Valor final","materiais + mão de obra + despesas + segurança + lucro - desconto","Média"],
  ["schedule.duration","1.2.0","Prazo por etapa","quantidade ÷ produtividade ajustada por equipe e complexidade","Média"],
  ["report.summary","1.3.0","Relatório da obra","consolida dados técnicos, financeiros e cronograma","Alta"],
  ["tracking.progress","1.4.0","Progresso da obra","média ponderada do avanço informado por etapa","Média"],
  ["floorplan.validation","1.5.0","Validação da planta","verifica cômodos fora do terreno e sobreposições","Alta"],
  ["purchases.balance","1.6.0","Saldo de materiais","comprado - usado, comparado com quantidade planejada","Média"],
  ["compositions.materials","1.7.0","Composições de serviço","converte áreas e volumes em argamassa, rejunte, cimento e areia","Média"],
  ["installations.basic","1.8.0","Instalações básicas","estima pontos elétricos, hidráulicos, conduíte, fios e tubos","Requer validação técnica"],
  ["projects.manager","1.9.0","Gerenciador de obras","salva múltiplas obras com backup, duplicação e restauração","Alta"],
  ["system.health","2.0.0","Saúde do sistema","verifica dados, alertas, backup e consistência geral","Alta"],
  ["backend.schema","2.1.0","Preparação backend","normaliza dados locais para futura migração PostgreSQL/Supabase","Alta"]
];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const n=(id,d=0)=>{const v=Number($(id).value);return Number.isFinite(v)?v:d};
const round=(v,d=2)=>Math.round(((Number(v)||0)+Number.EPSILON)*10**d)/10**d;
const money=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtDate=iso=>{if(!iso)return "-";const [y,m,d]=iso.split("-");return `${d}/${m}/${y}`};
function parseSize(text){const parts=String(text||"").toLowerCase().replace(",",".").split("x").map(Number);return [parts[0]||0,parts[1]||0]}
function todayISO(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function addWorkDays(iso,days,workdaysPerWeek){let d=new Date(iso+"T12:00:00");let added=0;if(days<=0)return iso;while(added<days-1){d.setDate(d.getDate()+1);const day=d.getDay();const works=workdaysPerWeek>=7||(workdaysPerWeek==6&&day!==0)||(workdaysPerWeek==5&&day!==0&&day!==6);if(works)added++}return d.toISOString().slice(0,10)}
function nextWorkDay(iso,workdaysPerWeek){let d=new Date(iso+"T12:00:00");do{d.setDate(d.getDate()+1);const day=d.getDay();if(workdaysPerWeek>=7||(workdaysPerWeek==6&&day!==0)||(workdaysPerWeek==5&&day!==0&&day!==6))break}while(true);return d.toISOString().slice(0,10)}
function cryptoRandom(){return Date.now()+"_"+Math.random().toString(16).slice(2)}
