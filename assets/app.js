(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ICON={
 cpu:'<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
 mb:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="5" height="5"/><path d="M16 8v8M8 17h5"/>',
 ram:'<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M6 16v3M10 16v3M14 16v3M18 16v3M7 11h2M11 11h2M15 11h2"/>',
 gpu:'<rect x="2" y="7" width="20" height="9" rx="1.5"/><circle cx="8" cy="11.5" r="2.5"/><circle cx="15" cy="11.5" r="2.5"/><path d="M5 16v3"/>',
 ssd:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6"/><circle cx="12" cy="17" r="1"/>',
 psu:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M13 8l-3 4h4l-3 4"/>',
 case:'<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="9" r="2"/><path d="M9 16h6"/>',
 cooler:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5"/><path d="M12 10.5C12 7 14 5 16 6M13.5 12C17 12 19 14 18 16M12 13.5C12 17 10 19 8 18M10.5 12C7 12 5 10 6 8"/>'};
const icon=c=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[c]}</svg>`;
const HUE={cpu:28,mb:150,ram:200,gpu:340,ssd:260,psu:50,case:100,cooler:180};
const SPEC={
 cpu:p=>`${p.socket}, ${p.tdp} W${p.igpu?", grafikasi bor":""}`,
 mb:p=>`${p.socket}, ${p.ram}, ${p.form}`,
 ram:p=>`${p.type}, ${p.gb} GB`,
 gpu:p=>`taxminan ${p.tdp} W, ${p.len} mm`,
 ssd:p=>p.gb>=1000?`${p.gb/1000} TB`:`${p.gb} GB`,
 psu:p=>`${p.watts} W`,
 case:p=>`${p.forms.join(", ")}, videokarta ${p.maxGpu} mm gacha`,
 cooler:p=>`taxminan ${p.maxTdp} W gacha`};
const PURPOSE={game:"O'yin",office:"Ofis va o'qish",edit:"Montaj va dizayn"};

/* ---------- state ---------- */
const S={cur:"uzs",mk:10,rate:12500,budget:1000,purpose:"game",pick:{},saved:[]};
ORDER.forEach(c=>S.pick[c]=null);
const store={
  get(k,d){try{const v=localStorage.getItem("mospc_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem("mospc_"+k,JSON.stringify(v))}catch(e){}}};
S.cur=store.get("cur","uzs");S.mk=store.get("mk",10);S.rate=store.get("rate",12500);S.saved=store.get("saved",[]);
S.budget=store.get("budget",1000);S.purpose=store.get("purpose","game");
const theme=store.get("theme",null);if(theme)document.documentElement.dataset.theme=theme;
applyMarkup(S.mk);

/* ---------- format ---------- */
const nf=n=>Math.round(n).toLocaleString("en-US").replace(/,/g," ");
const uzs=usd=>nf(Math.round(usd*S.rate/1000)*1000)+" so'm";
const usdf=usd=>"$"+nf(usd);
const m1=usd=>S.cur==="uzs"?uzs(usd):usdf(usd);
const m2=usd=>S.cur==="uzs"?usdf(usd):uzs(usd);

/* ---------- build logic ---------- */
const minMemo={};
function minBudget(p){
  if(minMemo[p]!=null&&minMemo[p].mk===S.mk)return minMemo[p].v;
  let b=250;while(b<3000&&!autoBuild(b,p,{}))b+=10;
  minMemo[p]={mk:S.mk,v:b};return b;}
function maxBudget(){return 3500}
function autoRun(){
  const lo=minBudget(S.purpose);
  if(S.budget<lo)S.budget=lo;
  const s=autoBuild(S.budget,S.purpose,{});
  ORDER.forEach(c=>S.pick[c]=s&&s[c]?s[c]:null);
  store.set("budget",S.budget);store.set("purpose",S.purpose);
}
const okWith=(c,p)=>!evaluate(Object.assign({},S.pick,{[c]:p})).issues.some(i=>i.l==="error");
const reasonWith=(c,p)=>{const i=evaluate(Object.assign({},S.pick,{[c]:p})).issues.find(i=>i.l==="error");return i?i.t:""};

/* ---------- board ---------- */
const NODES={cooler:[24,24],cpu:[236,24],ram:[448,24],gpu:[24,168],mb:[236,150],ssd:[448,196],case:[24,312],psu:[236,312]};
const NW=168,NH=58;
const EDGES=[
 ["cooler-cpu","M192 53H236","cooler","cpu"],
 ["cpu-mb","M320 82V150","cpu","mb"],
 ["ram-mb","M532 82V122H404V176","ram","mb"],
 ["gpu-mb","M192 197H236","gpu","mb"],
 ["ssd-mb","M448 225H404","ssd","mb"],
 ["psu","M320 312V258","psu","mb"],
 ["mb-case","M236 240H214V341H192","mb","case"],
 ["gpu-case","M108 226V312","gpu","case"]];
function boardSVG(r){
  const st={};r.issues.forEach(i=>{if(i.g){const prev=st[i.g];if(!prev||i.l==="error")st[i.g]=i.l}});
  let tr="",pads="";
  EDGES.forEach(([k,d,a,b])=>{
    let cls="off";
    if(st[k]==="error")cls="err";else if(st[k]==="warn")cls="warn";else if(S.pick[a]&&S.pick[b])cls="";
    tr+=`<path class="tr ${cls}" d="${d}"/>`;
    const nums=d.match(/-?\d+/g).map(Number);
    const x0=nums[0],y0=nums[1];
    pads+=`<circle class="pad ${cls}" cx="${x0}" cy="${y0}" r="3.5"/>`;
  });
  let nd="";
  ORDER.forEach(c=>{
    const [x,y]=NODES[c];const p=S.pick[c];const h=c==="mb"?90:NH;
    const nm=p?(p.name.length>24?p.name.slice(0,23)+"…":p.name):"Tanlanmagan";
    nd+=`<g class="nd ${p?"":"empty"} ${c==="mb"?"mb":""}" data-c="${c}" role="button" tabindex="0" aria-label="${esc(CATS[c].n)}: ${esc(p?p.name:"tanlanmagan")}">
      <rect x="${x}" y="${y}" width="${NW}" height="${h}" rx="8"/>
      <text class="k" x="${x+12}" y="${y+19}">${esc(CATS[c].n)}</text>
      <text class="v" x="${x+12}" y="${y+38}">${esc(nm)}</text>
      ${p?`<text class="p" x="${x+12}" y="${y+h-9}">${esc(m1(p.price))}</text>`:""}</g>`;
  });
  return `<svg viewBox="0 0 640 392" role="img" aria-label="Qismlar orasidagi moslik sxemasi">${tr}${pads}${nd}</svg>`;
}

/* ---------- render ---------- */
function summaryHTML(r){
  const pw=r.watts,psu=S.pick.psu?S.pick.psu.watts:0;
  const pct=psu?Math.min(100,Math.round(pw/psu*100)):0;
  const pcls=!psu?"":pct>=100?"err":pct>=75?"warn":"";
  const bpct=Math.min(100,Math.round(r.total/Math.max(1,S.budget)*100));
  const left=S.budget-r.total;
  let bk="",lg="";
  ORDER.forEach(c=>{const p=S.pick[c];if(!p||!r.total)return;
    const w=p.price/r.total*100;
    bk+=`<i style="width:${w}%;background:hsl(${HUE[c]} 52% var(--cl))" title="${esc(CATS[c].n)}"></i>`;
    lg+=`<span><b style="background:hsl(${HUE[c]} 52% var(--cl))"></b>${esc(CATS[c].n)}<em class="num">${Math.round(w)}%</em></span>`;});
  const errs=r.issues.filter(i=>i.l==="error"),warns=r.issues.filter(i=>i.l==="warn");
  let iss="";
  if(r.ok)iss+=`<li class="o"><span>Hammasi mos. Yig'ishga tayyor.</span></li>`;
  errs.concat(warns).forEach(i=>iss+=`<li class="${i.l==="error"?"e":"w"}"><span>${esc(i.t)}</span></li>`);
  if(!iss)iss=`<li class="w"><span>Qism tanlang, moslik shu yerda ko'rinadi.</span></li>`;
  const sv=S.saved.map((b,i)=>`<div class="sv"><span class="n">${esc(b.name)}</span><span class="t num">${esc(m1(b.total))}</span><button class="btn quiet sm" data-load="${i}" type="button">Ochish</button><button class="btn quiet sm" data-del="${i}" type="button" aria-label="${esc(b.name)}ni o'chirish">O'chirish</button></div>`).join("");
  return `
  <div><div class="tot-l">Jami</div><div class="tot num">${esc(m1(r.total))}</div><div class="price-sub num">${esc(m2(r.total))}</div>
    <div class="meter" role="img" aria-label="Byudjetning ${bpct}% sarflandi"><i class="${bpct>100?"err":""}" style="width:${bpct}%"></i></div>
    <div class="row2" style="margin-top:8px"><span>Byudjet ${esc(m1(S.budget))}</span><span class="num">${left>=0?"Qoldi "+esc(m1(left)):"Oshdi "+esc(m1(-left))}</span></div></div>
  <div><div class="row2"><span>Taxminiy iste'mol</span><span class="num">${pw} W${psu?" / blok "+psu+" W":""}</span></div>
    <div class="meter" role="img" aria-label="Quvvat bloki yuklamasi ${pct}%"><i class="${pcls}" style="width:${pct}%"></i></div></div>
  ${r.total?`<div><h3>Narx taqsimoti</h3><div class="bk">${bk}</div><div class="lg">${lg}</div></div>`:""}
  <ul class="iss">${iss}</ul>
  <div><button class="btn pri" id="copy" type="button" ${r.total?"":"disabled"}>Ro'yxatni nusxalash</button>
    <div class="toast" id="toast" role="status"></div></div>
  <div><h3>Saqlangan yig'malar</h3>
    <div class="savef"><input type="text" id="svn" maxlength="30" placeholder="Nomi, masalan O'yin PC" aria-label="Yig'ma nomi"><button class="btn sec sm" id="svb" type="button" ${r.total?"":"disabled"}>Saqlash</button></div>
    <div class="saved">${sv||'<div class="price-sub" style="margin-top:4px">Hali saqlanmagan.</div>'}</div></div>`;
}
function partsHTML(){
  return ORDER.map(c=>{
    const p=S.pick[c];
    if(!p){
      const n=partsOf(c).filter(x=>okWith(c,x)).length;
      return `<div class="part empty"><div class="ico">${icon(c)}</div>
        <div><div class="cat">${esc(CATS[c].n)}</div><div class="nm" style="color:var(--mute);font-weight:500">${c==="gpu"?"Tanlanmagan":"Tanlanmagan"}</div></div>
        <button class="btn sec sm go" data-add="${c}" type="button">Qo'shish</button>
        <div class="hint">${c==="gpu"?"Tanlanmasa, protsessordagi grafika ishlatiladi. ":""}Mos variant: ${n} ta</div></div>`;}
    return `<div class="part"><div class="ico">${icon(c)}</div>
      <div><div class="cat">${esc(CATS[c].n)}</div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(SPEC[c](p))}</div></div>
      <div class="pr"><div class="price num">${esc(m1(p.price))}</div><div class="price-sub num">${esc(m2(p.price))}</div></div>
      <div class="acts"><button class="btn sec sm" data-add="${c}" type="button">O'zgartirish</button>
        <button class="btn quiet sm grow" data-rm="${c}" type="button">Olib tashlash</button></div></div>`;
  }).join("");
}
let lastR=null;
function render(){
  const r=evaluate(S.pick);lastR=r;
  /* hero */
  const lo=minBudget(S.purpose),hi=maxBudget();
  const bud=$("#bud");bud.min=lo;bud.max=hi;bud.step=10;bud.value=S.budget;
  $("#rmin").textContent=m1(lo);$("#rmax").textContent=m1(hi);
  $("#amt").textContent=m1(S.budget);$("#amt-sub").textContent=m2(S.budget);
  bud.setAttribute("aria-valuetext",m1(S.budget));
  document.querySelectorAll(".chip").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.p===S.purpose)));
  $("#board").innerHTML=boardSVG(r);
  const errs=r.issues.filter(i=>i.l==="error").length;
  const stat=$("#stat");
  const filled=ORDER.filter(c=>S.pick[c]).length;
  stat.className="stat"+(errs?" err":r.ok?"":" warn");
  $("#stat-t").textContent=errs?`${errs} ta mos kelmaslik`:r.ok?"Hammasi mos":`${filled}/8 qism tanlangan`;
  /* builder */
  $("#parts").innerHTML=partsHTML();
  $("#summary").innerHTML=summaryHTML(r);
  $("#dock-t").textContent=m1(r.total);
  document.querySelectorAll("#cur-uzs,#cur-usd").forEach(b=>b.setAttribute("aria-pressed",String((b.id==="cur-uzs")===(S.cur==="uzs"))));
  store.set("pick",Object.fromEntries(ORDER.map(c=>[c,S.pick[c]?S.pick[c].id:null])));
}

/* ---------- picker ---------- */
let pk=null;
function openPicker(c,from){
  closePicker();
  pk={c,q:"",sort:"price",all:false,from:from||document.activeElement};
  const ov=document.createElement("div");ov.className="ov";ov.id="ov";
  ov.innerHTML=`<div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(CATS[c].n)} tanlash">
    <div class="dlg-h"><div class="dlg-t"><b>${esc(CATS[c].n)}</b><button class="btn quiet sm" id="pk-x" type="button">Yopish</button></div>
    <div class="dlg-c"><input type="search" id="pk-q" placeholder="Qidirish" aria-label="Qidirish">
      <select id="pk-s" aria-label="Saralash"><option value="price">Arzoni birinchi</option><option value="priceDesc">Qimmati birinchi</option><option value="name">Nomi bo'yicha</option></select>
      <label><input type="checkbox" id="pk-a"> Mos kelmaydiganlarni ham ko'rsat</label></div></div>
    <div class="dlg-l" id="pk-l"></div></div>`;
  document.body.appendChild(ov);
  ov.addEventListener("click",e=>{if(e.target===ov)closePicker()});
  $("#pk-x").onclick=closePicker;
  $("#pk-q").oninput=e=>{pk.q=e.target.value;fillPicker()};
  $("#pk-s").onchange=e=>{pk.sort=e.target.value;fillPicker()};
  $("#pk-a").onchange=e=>{pk.all=e.target.checked;fillPicker()};
  $("#pk-l").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(!b)return;S.pick[pk.c]=BYID[b.dataset.id];track("pick_part",{category:pk.c,item_name:BYID[b.dataset.id].name});closePicker();render()});
  fillPicker();$("#pk-q").focus();
}
function fillPicker(){
  const c=pk.c,q=pk.q.trim().toLowerCase();
  let items=partsOf(c).filter(p=>p.name.toLowerCase().includes(q)).map(p=>({p,bad:okWith(c,p)?"":reasonWith(c,p)}));
  if(!pk.all)items=items.filter(x=>!x.bad);
  items.sort((a,b)=>pk.sort==="priceDesc"?b.p.price-a.p.price:pk.sort==="name"?a.p.name.localeCompare(b.p.name):a.p.price-b.p.price);
  const cur=S.pick[c]?S.pick[c].id:null;
  $("#pk-l").innerHTML=items.length?items.map(({p,bad})=>`<button class="opt ${p.id===cur?"cur":""}" type="button" data-id="${esc(p.id)}">
    <span><span class="nm">${esc(p.name)}</span><br><span class="sp">${esc(SPEC[c](p))}</span>${bad?`<br><span class="bad">${esc(bad)}</span>`:""}</span>
    <span style="text-align:right"><span class="price num">${esc(m1(p.price))}</span><br><span class="price-sub num">${esc(m2(p.price))}</span></span></button>`).join("")
    :`<div class="none">Mos qism topilmadi.${pk.all?"":" \"Mos kelmaydiganlarni ham ko'rsat\"ni yoqib ko'ring."}</div>`;
}
function closePicker(){const ov=$("#ov");if(ov)ov.remove();if(pk&&pk.from&&pk.from.focus&&document.contains(pk.from))try{pk.from.focus()}catch(e){}pk=null}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closePicker();$("#pop").hidden=true;$("#gear").setAttribute("aria-expanded","false")}});

/* ---------- actions ---------- */
function track(n,p){try{if(window.gtag)gtag("event",n,p||{})}catch(e){}}
function listText(r){
  const L=["MosPC yig'mam:",""];
  ORDER.forEach(c=>{const p=S.pick[c];if(p)L.push(`${CATS[c].n}: ${p.name}, ${usdf(p.price)} (${uzs(p.price)})`)});
  if(!S.pick.gpu&&S.pick.cpu&&S.pick.cpu.igpu)L.push("Videokarta: yo'q, protsessordagi grafika ishlatiladi");
  L.push("","Jami: "+usdf(r.total)+" ("+uzs(r.total)+")",r.ok?"Moslik: hammasi mos":"Moslik: muammolar bor");
  r.issues.filter(i=>i.l==="error").forEach(i=>L.push("! "+i.t));
  return L.join("\n");
}
async function copyList(){
  const txt=listText(lastR);let ok=false;
  try{await navigator.clipboard.writeText(txt);ok=true}catch(e){}
  if(!ok){const t=document.createElement("textarea");t.value=txt;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();try{ok=document.execCommand("copy")}catch(e){}t.remove()}
  track("copy_list",{value:Math.round(lastR.total),currency:"USD",ok:ok?1:0});
  const el=$("#toast");if(el)el.textContent=ok?"Nusxalandi. Telegramga qo'yishingiz mumkin.":"Nusxalanmadi. Brauzer ruxsat bermadi.";
}
function saveBuild(){
  const inp=$("#svn");const name=(inp.value.trim()||"Yig'ma "+(S.saved.length+1));
  S.saved.unshift({name,total:lastR.total,pick:Object.fromEntries(ORDER.map(c=>[c,S.pick[c]?S.pick[c].id:null]))});
  S.saved=S.saved.slice(0,8);store.set("saved",S.saved);render();track("save_build",{value:Math.round(lastR.total),currency:"USD"});
  const el=$("#toast");if(el)el.textContent="Saqlandi.";
}
function loadBuild(i){
  const b=S.saved[i];if(!b)return;
  ORDER.forEach(c=>S.pick[c]=b.pick[c]&&BYID[b.pick[c]]?BYID[b.pick[c]]:null);
  render();track("load_build");
}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-add],[data-rm],[data-c],[data-load],[data-del],#copy,#svb");
  if(!t){if(!e.target.closest("#pop,#gear")){$("#pop").hidden=true;$("#gear").setAttribute("aria-expanded","false")}return}
  if(t.dataset.add)return openPicker(t.dataset.add,t);
  if(t.dataset.rm){S.pick[t.dataset.rm]=null;return render()}
  if(t.dataset.c&&t.closest("#board"))return openPicker(t.dataset.c,t);
  if(t.dataset.load!=null)return loadBuild(+t.dataset.load);
  if(t.dataset.del!=null){S.saved.splice(+t.dataset.del,1);store.set("saved",S.saved);return render()}
  if(t.id==="copy")return copyList();
  if(t.id==="svb")return saveBuild();
});
$("#board").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){const g=e.target.closest("[data-c]");if(g){e.preventDefault();openPicker(g.dataset.c,g)}}});
$("#bud").addEventListener("input",e=>{S.budget=+e.target.value;autoRun();render()});
$("#bud").addEventListener("change",e=>track("budget_set",{value:+e.target.value,currency:"USD",purpose:S.purpose}));
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{S.purpose=b.dataset.p;autoRun();render();track("purpose_select",{purpose:b.dataset.p})});
$("#cur-uzs").onclick=()=>{S.cur="uzs";store.set("cur","uzs");render()};
$("#cur-usd").onclick=()=>{S.cur="usd";store.set("cur","usd");render();track("currency_usd")};
$("#theme").onclick=()=>{
  const root=document.documentElement;
  const dark=root.dataset.theme?root.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme=dark?"light":"dark";store.set("theme",root.dataset.theme);
};
$("#gear").onclick=()=>{const p=$("#pop");p.hidden=!p.hidden;$("#gear").setAttribute("aria-expanded",String(!p.hidden))};
$("#mk").value=S.mk;$("#rate").value=S.rate;
$("#mk").oninput=e=>{S.mk=Math.max(0,Math.min(100,+e.target.value||0));store.set("mk",S.mk);applyMarkup(S.mk);autoRun();render()};
$("#rate").oninput=e=>{S.rate=Math.max(1000,+e.target.value||12500);store.set("rate",S.rate);render()};

/* ---------- start ---------- */
autoRun();render();
})();
