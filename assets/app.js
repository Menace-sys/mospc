/* ===== UI ===== */
const $=s=>document.querySelector(s);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in(attrs||{})){const v=attrs[k];if(k==="class")e.className=v;else if(k.startsWith("on"))e[k]=v;else if(v===true)e.setAttribute(k,"");else if(v===false||v==null){}else e.setAttribute(k,v)}
 for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e}
CATALOG.forEach(p=>{p.shop="Age Computers";p.url="https://t.me/agecomputer"});
let rate=12500,mk=10;
try{rate=+localStorage.getItem("qb_rate")||12500;const v=localStorage.getItem("qb_mk");if(v!=null)mk=+v}catch(e){}
$("#rate").value=rate;$("#mk").value=mk;applyMarkup(mk);
$("#rate").oninput=e=>{rate=+e.target.value||12500;try{localStorage.setItem("qb_rate",rate)}catch(x){}render()};
$("#mk").oninput=e=>{mk=+e.target.value||0;try{localStorage.setItem("qb_mk",mk)}catch(x){}applyMarkup(mk);render()};
const money=n=>"$"+Math.round(n);
const som=n=>"≈ "+(Math.round(n*rate/1000)*1000).toLocaleString("ru-RU").replace(/ /g," ")+" so'm";
const SPEC={
 cpu:p=>`${p.socket} · ${p.tdp}W${p.igpu?" · grafika bor":""}`,
 mb:p=>`${p.socket} · ${p.ram} · ${p.form}`,
 ram:p=>`${p.type} · ${p.gb}GB`,
 gpu:p=>`taxminan ${p.tdp}W · ${p.len}mm`,
 ssd:p=>`${p.gb>=1000?p.gb/1000+"TB":p.gb+"GB"}`,
 psu:p=>`${p.watts}W`,
 case:p=>`${p.forms.join(" / ")} · videokarta ${p.maxGpu}mm gacha`,
 cooler:p=>`~${p.maxTdp}W gacha`};
let pick=Object.fromEntries(ORDER.map(c=>[c,null])),purpose="game",budget=800,msg="",picker=null;
function sel0(){pick=Object.fromEntries(ORDER.map(c=>[c,null]))}
function auto(){
 const s=autoBuild(budget,purpose,{});
 if(!s){sel0();msg="Bu byudjetga mos to'liq PC chiqmadi. Byudjetni oshirib ko'ring."}
 else{msg="";pick={};ORDER.forEach(c=>pick[c]=s[c]||null)}
 render();
}
function okWith(c,p){return !evaluate(Object.assign({},pick,{[c]:p})).issues.some(i=>i.l==="error")}
function openPicker(c){picker={c,q:"",all:false};render()}
function pickerView(){
 const {c}=picker;
 const ov=h("div",{class:"ov",onclick:e=>{if(e.target===ov){picker=null;render()}}});
 const q=h("input",{placeholder:"Qidirish...",style:"width:100%",value:picker.q,oninput:e=>{picker.q=e.target.value;list()}});
 const all=h("input",{type:"checkbox",checked:picker.all,onchange:e=>{picker.all=e.target.checked;list()}});
 const ls=h("div",{class:"ls"});
 function list(){
  ls.replaceChildren();
  const items=partsOf(c).filter(p=>p.name.toLowerCase().includes(picker.q.toLowerCase())).map(p=>({p,ok:okWith(c,p)})).filter(x=>picker.all||x.ok).sort((a,b)=>a.p.price-b.p.price);
  if(!items.length)ls.append(h("div",{class:"empty"},"Mos qism topilmadi."+(picker.all?"":" \"Hammasini ko'rsat\" ni yoqing.")));
  items.forEach(({p,ok})=>ls.append(h("div",{class:"opt",onclick:()=>{pick[c]=p;picker=null;render()}},
   h("div",null,h("div",{class:"pn"},p.name),h("div",{class:"sp"},SPEC[c](p)+(ok?"":" · MOS EMAS")),h("div",{class:"shop"},p.shop)),
   h("div",{style:"text-align:right"},h("div",{class:"pr"},money(p.price)),h("div",{class:"so"},som(p.price))))));
 }
 ov.append(h("div",{class:"sheet"},h("div",{class:"hd"},h("div",{class:"li"},h("b",null,CATS[c].n+" tanlang"),h("button",{class:"add",onclick:()=>{picker=null;render()}},"✕ Yopish")),h("div",{style:"margin-top:8px"},q),
  h("label",{style:"margin:8px 0 0"},all," Mos kelmaydiganlarni ham ko'rsat")),ls));
 list();return ov;
}
function build(){
 const box=h("div");
 const so=h("div",{class:"so"},som(budget));
 box.append(h("div",{class:"card"},h("h2",null,"Byudjet bo'yicha avto-yig'ish"),
  h("div",{class:"row"},
   h("div",{class:"f"},h("label",null,"Byudjet ($)"),h("input",{type:"number",value:budget,style:"width:100%",oninput:e=>{budget=+e.target.value||0;so.textContent=som(budget)}})),
   h("div",{class:"f"},h("label",null,"Maqsad"),h("select",{style:"width:100%",onchange:e=>purpose=e.target.value},[["game","O'yin"],["office","Ofis / o'qish"],["edit","Montaj / dizayn"]].map(([k,v])=>h("option",{value:k,selected:purpose===k},v))))),
  so,
  h("div",{class:"row",style:"margin-top:10px"},h("button",{class:"b",onclick:auto},"Avto yig'ish"),h("button",{class:"b g",onclick:()=>{sel0();msg="";render()}},"Tozalash")),
  msg&&h("div",{class:"is warn"},msg)));
 const card=h("div",{class:"card"});
 ORDER.forEach(c=>{
  const p=pick[c];
  const hd=h("div",{class:"sh"},h("span",{class:"chip"},CATS[c].e+" "+CATS[c].n),
   !p&&h("button",{class:"add",onclick:()=>openPicker(c)},"+ Qo'shish"));
  const s=h("div",{class:"slot"},hd);
  if(p){
   s.append(h("div",{class:"pn"},p.name),h("div",{class:"sp"},SPEC[c](p)),
    h("div",{class:"pl"},h("div",null,h("div",{class:"pr"},money(p.price)),h("div",{class:"so"},som(p.price))),
     h("div",{style:"text-align:right"},h("div",{class:"shop"},p.shop),h("a",{class:"b",href:p.url,target:"_blank",rel:"noopener"},"Sotib olish"))),
    h("div",{class:"acts"},h("button",{class:"b ln",onclick:()=>openPicker(c)},"⚙ O'zgartirish"),h("button",{class:"b ln",onclick:()=>{pick[c]=null;render()}},"✕ O'chirish")));
  }else if(c==="gpu"){s.append(h("div",{class:"sp"},"Tanlanmasa protsessordagi grafika ishlatiladi (agar bo'lsa)."))}
  card.append(s);
 });
 box.append(card);
 const r=evaluate(pick);
 const t=h("div",{class:"tot"},h("div",{class:"li"},h("b",null,"Jami"),h("div",{style:"text-align:right"},h("div",{class:"pr"},money(r.total)),h("div",{class:"so"},som(r.total)))),h("div",{class:"so"},"Taxminiy iste'mol: ~"+r.watts+" W"));
 if(r.ok)t.append(h("div",{class:"is ok"},"Hammasi mos. Yig'ishga tayyor!"));
 r.issues.forEach(i=>t.append(h("div",{class:"is "+i.l},i.t)));
 if(ORDER.some(c=>pick[c])){
  const out=h("textarea",{readonly:"",style:"display:none;margin-top:8px;min-height:150px;width:100%;font:inherit;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:8px"});
  const st=h("div",{class:"so"});
  t.append(h("div",{style:"margin-top:8px"},h("button",{class:"b g",onclick:async()=>{
   const txt=listText(r);out.value=txt;out.style.display="block";out.select();let ok=false;
   try{await navigator.clipboard.writeText(txt);ok=true}catch(e){try{ok=document.execCommand("copy")}catch(x){}}
   st.textContent=ok?"Nusxalandi. Telegramga qo'yishingiz mumkin.":"Avtomatik nusxalanmadi: matnni belgilab nusxalang.";
  }},"Ro'yxatni nusxalash")),st,out);
 }
 box.append(t);return box;
}
function listText(r){
 const L=["Mening PC yig'imim (Qismbozor):",""];
 ORDER.forEach(c=>{const p=pick[c];if(p)L.push(`${CATS[c].n}: ${p.name} — ${money(p.price)} (${p.shop})`)});
 if(!pick.gpu&&pick.cpu&&pick.cpu.igpu)L.push("Videokarta: yo'q (protsessordagi grafika)");
 L.push("","Jami: "+money(r.total)+" ("+som(r.total).replace("≈ ","≈")+")");
 L.push(r.ok?"Moslik: hammasi mos":"Moslik: muammolar bor");
 r.issues.forEach(i=>L.push((i.l==="error"?"! ":"- ")+i.t));
 return L.join("\n");
}
function render(){const v=$("#v");v.replaceChildren(build(),...(picker?[pickerView()]:[]))}
render();
/* ===== END UI ===== */
