/* ===== READY BUILDS =====
 Requirements are mapped onto catalog scores (logic: cpu.score / gpu.score).
 Reference points: GTX 1650=25, RX 580=32, GTX 1660S=40, RTX 2060S=46, RTX 3060=55, RTX 5060=66,
 RX 9060 XT=78, RX 9070=115, RTX 5070 Ti=126 | i3-12100F=45, i5-12400F=58, i5-13400F=68,
 R5 7500F=72, R5 7600X=80, R7 7700=85, R7 7800X3D=100.
 gpu:0 means integrated graphics is enough. vram in GB. ssd in GB. */
const PRESETS=[
 {id:"gta5",k:"game",n:"GTA V",t:[
   {cpu:45,gpu:18,ram:16,ssd:512},{cpu:52,gpu:32,ram:16,ssd:512},{cpu:58,gpu:55,ram:16,ssd:1000}]},
 {id:"gta6",k:"game",n:"GTA VI",est:true,t:[
   {cpu:60,gpu:46,ram:16,ssd:1000,vram:8},{cpu:72,gpu:66,ram:16,ssd:1000,vram:8},{cpu:90,gpu:115,ram:32,ssd:1000,vram:12}]},
 {id:"cp2077",k:"game",n:"Cyberpunk 2077",t:[
   {cpu:52,gpu:40,ram:16,ssd:512},{cpu:72,gpu:66,ram:16,ssd:512,vram:8},{cpu:90,gpu:115,ram:32,ssd:1000,vram:12}]},
 {id:"wt",k:"game",n:"War Thunder",t:[
   {cpu:45,gpu:18,ram:16,ssd:512},{cpu:58,gpu:40,ram:16,ssd:512},{cpu:72,gpu:66,ram:16,ssd:1000}]},
 {id:"cs2",k:"game",n:"Counter-Strike 2",t:[
   {cpu:45,gpu:25,ram:16,ssd:512},{cpu:68,gpu:46,ram:16,ssd:512},{cpu:100,gpu:78,ram:32,ssd:1000}]},
 {id:"dota2",k:"game",n:"Dota 2",t:[
   {cpu:45,gpu:18,ram:16,ssd:256},{cpu:58,gpu:32,ram:16,ssd:512},{cpu:72,gpu:55,ram:16,ssd:512}]},
 {id:"pubg",k:"game",n:"PUBG: Battlegrounds",t:[
   {cpu:52,gpu:32,ram:16,ssd:512},{cpu:68,gpu:55,ram:16,ssd:512},{cpu:85,gpu:78,ram:32,ssd:1000}]},
 {id:"valorant",k:"game",n:"Valorant",t:[
   {cpu:45,gpu:18,ram:16,ssd:256},{cpu:58,gpu:32,ram:16,ssd:512},{cpu:80,gpu:55,ram:16,ssd:512}]},
 {id:"fortnite",k:"game",n:"Fortnite",t:[
   {cpu:45,gpu:25,ram:16,ssd:512},{cpu:58,gpu:46,ram:16,ssd:512},{cpu:80,gpu:78,ram:32,ssd:1000}]},
 {id:"warzone",k:"game",n:"Call of Duty: Warzone",t:[
   {cpu:52,gpu:40,ram:16,ssd:512},{cpu:68,gpu:66,ram:16,ssd:1000},{cpu:90,gpu:115,ram:32,ssd:1000}]},
 {id:"rdr2",k:"game",n:"Red Dead Redemption 2",t:[
   {cpu:52,gpu:32,ram:16,ssd:512},{cpu:68,gpu:55,ram:16,ssd:512},{cpu:85,gpu:115,ram:32,ssd:1000}]},
 {id:"fc",k:"game",n:"EA Sports FC",t:[
   {cpu:52,gpu:32,ram:16,ssd:512},{cpu:60,gpu:46,ram:16,ssd:512},{cpu:72,gpu:66,ram:16,ssd:512}]},
 {id:"resolve",k:"app",n:"DaVinci Resolve",t:[
   {cpu:58,gpu:46,ram:16,ssd:512,vram:8},{cpu:72,gpu:78,ram:32,ssd:1000,vram:12},{cpu:100,gpu:126,ram:64,ssd:2000,vram:16}]},
 {id:"premiere",k:"app",n:"Adobe Premiere Pro",t:[
   {cpu:58,gpu:36,ram:16,ssd:512},{cpu:72,gpu:66,ram:32,ssd:1000,vram:8},{cpu:100,gpu:115,ram:64,ssd:2000,vram:12}]},
 {id:"ae",k:"app",n:"Adobe After Effects",t:[
   {cpu:68,gpu:46,ram:16,ssd:512},{cpu:85,gpu:66,ram:32,ssd:1000,vram:8},{cpu:110,gpu:115,ram:64,ssd:2000,vram:12}]},
 {id:"ps",k:"app",n:"Adobe Photoshop",t:[
   {cpu:45,gpu:18,ram:16,ssd:512},{cpu:58,gpu:36,ram:16,ssd:1000},{cpu:80,gpu:55,ram:32,ssd:1000}]},
 {id:"blender",k:"app",n:"Blender",t:[
   {cpu:58,gpu:46,ram:16,ssd:512},{cpu:80,gpu:79,ram:32,ssd:1000,vram:8},{cpu:110,gpu:126,ram:64,ssd:2000,vram:16}]},
 {id:"autocad",k:"app",n:"AutoCAD / 3ds Max",t:[
   {cpu:52,gpu:18,ram:16,ssd:512},{cpu:72,gpu:36,ram:32,ssd:1000},{cpu:90,gpu:66,ram:32,ssd:1000,vram:8}]},
 {id:"office",k:"app",n:"Office, 1C",t:[
   {cpu:45,gpu:0,ram:16,ssd:256},{cpu:58,gpu:0,ram:16,ssd:512},{cpu:68,gpu:0,ram:32,ssd:1000}]}
];
const vramOf=g=>{const m=/(\d+)\s*GB/i.exec(g.name);return m?+m[1]:0};
/* cheapest compatible build meeting a requirement; null if impossible */
function cheapestBuild(q){
  const by=c=>partsOf(c).slice().sort((a,b)=>a.price-b.price);
  const cpus=by("cpu").filter(p=>p.score>=q.cpu),mbs=by("mb"),rams=by("ram").filter(r=>r.gb>=q.ram),
    gpus=q.gpu>0?by("gpu").filter(g=>g.score>=q.gpu&&vramOf(g)>=(q.vram||0)):[null],
    ssd=by("ssd").filter(s=>s.gb>=q.ssd)[0],psus=by("psu"),cases=by("case"),cools=by("cooler");
  if(!ssd)return null;
  let best=null;
  for(const cpu of cpus)for(const mb of mbs){
    if(mb.socket!==cpu.socket)continue;
    const ram=rams.find(r=>r.type===mb.ram);if(!ram)continue;
    for(const gpu of gpus){
      if(!gpu&&!cpu.igpu)continue;
      const cs=cases.find(c=>c.forms.includes(mb.form)&&(!gpu||gpu.len<=c.maxGpu));if(!cs)continue;
      const cool=cools.find(c=>c.maxTdp>=cpu.tdp);if(!cool)continue;
      const need=cpu.tdp+(gpu?gpu.tdp:0)+100;
      const psu=psus.find(p=>p.watts>=need*1.35)||psus.find(p=>p.watts>=need);if(!psu)continue;
      const sel={cpu,mb,ram,gpu,ssd,psu,case:cs,cooler:cool};
      const r=evaluate(sel);
      if(!r.ok||r.issues.some(i=>i.k==="i.vrm"))continue;
      if(!best||r.total<best.total)best={sel,total:r.total};
      break; /* gpus sorted by price: first valid is cheapest for this cpu/mb */
    }
  }
  return best;
}
/* ===== END READY BUILDS ===== */
