/* ===== LOGIC ===== */
const CATS = {
  cpu:{n:"Protsessor",e:"🧠"}, mb:{n:"Plata",e:"🔌"}, ram:{n:"Operativ xotira",e:"📏"},
  gpu:{n:"Videokarta",e:"🎮"}, ssd:{n:"SSD",e:"💾"}, psu:{n:"Quvvat bloki",e:"⚡"},
  case:{n:"Korpus",e:"🧱"}, cooler:{n:"Kuler",e:"❄️"}
};
const ORDER = ["cpu","mb","ram","gpu","ssd","psu","case","cooler"];
const BYID = {}; CATALOG.forEach(p=>{BYID[p.id]=p;p.base=p.price});
function applyMarkup(m){CATALOG.forEach(p=>{p.price=Math.round(p.base*(1+m/100))})}
const partsOf = c => CATALOG.filter(p=>p.cat===c);

/* sel: {cat: part|null} (part may carry .price override) */
function evaluate(sel){
  const iss=[]; const e=t=>iss.push({l:"error",t}), w=t=>iss.push({l:"warn",t});
  const {cpu,mb,ram,gpu,psu,case:cs,cooler,ssd}=sel;
  if(cpu&&mb&&cpu.socket!==mb.socket) e(`Protsessor soketi ${cpu.socket}, plata soketi ${mb.socket}: mos emas.`);
  if(mb&&ram&&mb.ram!==ram.type) e(`Plata ${mb.ram} xotira qabul qiladi, siz ${ram.type} tanladingiz.`);
  if(mb&&cs&&!cs.forms.includes(mb.form)) e(`${mb.form} plata bu korpusga sig'maydi.`);
  if(gpu&&cs&&gpu.len>cs.maxGpu) e(`Videokarta ${gpu.len} mm, korpusga eng ko'pi ${cs.maxGpu} mm sig'adi.`);
  if(cpu&&cooler&&cooler.maxTdp<cpu.tdp) e(`Bu kuler ${cpu.tdp}W protsessorni sovita olmaydi.`);
  if(cpu&&!gpu&&!cpu.igpu) e("Bu protsessorda o'rnatilgan grafika yo'q: videokarta kerak.");
  const need=(cpu?cpu.tdp:0)+(gpu?gpu.tdp:0)+100;
  if(psu&&(cpu||gpu)){
    if(psu.watts<need) e(`Quvvat bloki yetmaydi: kamida ${need}W kerak.`);
    else if(psu.watts<need*1.35) w(`Quvvat bloki chegarada: ${Math.ceil(need*1.35/50)*50}W tavsiya etiladi.`);
  }
  if(cpu&&mb&&cpu.tdp>=105&&/H610|A620|B840|B450/.test(mb.name)) w("Bu plata kuchli protsessor uchun oddiy: quvvat tizimi zaif bo'lishi mumkin.");
  if(ram&&ram.gb<16) w("8GB xotira hozir kam, 16GB tavsiya etiladi.");
  if(cpu&&gpu&&gpu.score>cpu.score*1.8) w("Videokarta protsessordan ancha kuchli: protsessor to'sqinlik qilishi mumkin.");
  const miss=ORDER.filter(c=>c!=="gpu"&&!sel[c]);
  if(miss.length) w("Hali tanlanmagan: "+miss.map(c=>CATS[c].n).join(", ")+".");
  const total=ORDER.reduce((s,c)=>s+(sel[c]?sel[c].price:0),0);
  return {issues:iss,total,watts:need,ok:!iss.some(i=>i.l==="error")&&miss.length===0};
}

/* offers: {partId: usedPrice}; allowUsed picks cheaper used option */
function eff(p,offers){
  const u=offers&&offers[p.id];
  return (u!=null&&u<p.price)?Object.assign({},p,{price:u,used:true}):p;
}
const WEIGHTS={game:{cpu:.5,gpu:1,ram:.1},office:{cpu:1,gpu:0,ram:.3,pen:.25},edit:{cpu:.7,gpu:.8,ram:.4,pen:0}};
function autoBuild(budget,purpose,offers){
  const W=WEIGHTS[purpose]||WEIGHTS.game; let best=null;
  const E=c=>partsOf(c).map(p=>eff(p,offers));
  const cpus=E("cpu"),mbs=E("mb"),rams=E("ram"),gpus=E("gpu").concat([null]),ssds=E("ssd"),
    psus=E("psu").sort((a,b)=>a.price-b.price),cases=E("case"),cools=E("cooler").sort((a,b)=>a.price-b.price);
  const cheapest=(arr,ok)=>arr.filter(ok).sort((a,b)=>a.price-b.price)[0];
  for(const cpu of cpus)for(const mb of mbs){ if(mb.socket!==cpu.socket)continue;
   for(const ram of rams){ if(ram.type!==mb.ram||ram.gb<16)continue;
    for(const gpu of gpus){
     if(!gpu&&!cpu.igpu)continue;
     if(purpose==="game"&&!gpu)continue;
     const cs=cheapest(cases,c=>c.forms.includes(mb.form)&&(!gpu||gpu.len<=c.maxGpu)); if(!cs)continue;
     const cool=cheapest(cools,c=>c.maxTdp>=cpu.tdp); if(!cool)continue;
     const need=cpu.tdp+(gpu?gpu.tdp:0)+100;
     const psu=cheapest(psus,p=>p.watts>=need*1.35)||cheapest(psus,p=>p.watts>=need); if(!psu)continue;
     const ssd=cheapest(ssds,s=>s.gb>=512);
     const sel={cpu,mb,ram,gpu,ssd,psu,case:cs,cooler:cool};
     const r=evaluate(sel); if(!r.ok||r.total>budget)continue;
     if(r.issues.some(i=>i.t.includes("oddiy: quvvat")))continue;
     const sc=W.cpu*cpu.score+(gpu?W.gpu*gpu.score:0)+W.ram*Math.min(ram.gb,32)+(r.issues.some(i=>i.l==="warn"&&i.t.includes("to'sqinlik"))?25:0)*-1+(cpu.igpu&&!gpu?5:0)-(W.pen||0)*r.total/10;
     if(!best||sc>best.sc||(sc===best.sc&&r.total<best.total))best={sel,sc,total:r.total};
    }}}
  if(!best)return null;
  let left=budget-best.total; const up=ssds.filter(s=>s.gb>best.sel.ssd.gb&&s.gb<=2000&&s.price-best.sel.ssd.price<=left).sort((a,b)=>b.gb-a.gb)[0];
  if(up)best.sel.ssd=up;
  return best.sel;
}
/* ===== END LOGIC ===== */
