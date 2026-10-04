/* ===== PCB BACKGROUND: copper traces with data pulses ===== */
(()=>{
const cv=document.createElement("canvas");cv.id="pcb";cv.setAttribute("aria-hidden","true");
document.body.prepend(cv);
const ctx=cv.getContext("2d");
const RM=matchMedia("(prefers-reduced-motion: reduce)");
let W=0,H=0,DPR=1,traces=[],pulses=[],col={tr:"",pad:"",pl:""},raf=0,last=0;
const G=26; /* grid step */
const DIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1));

function readColors(){
  const s=getComputedStyle(document.documentElement);
  const cu=(s.getPropertyValue("--cu")||"#E4A15C").trim();
  const dark=document.documentElement.dataset.theme==="dark"||(!document.documentElement.dataset.theme&&matchMedia("(prefers-color-scheme: dark)").matches);
  const hex=dark?cu:(s.getPropertyValue("--accent")||"#A85F14").trim();
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  col={tr:`rgba(${r},${g},${b},${dark?.13:.12})`,pad:`rgba(${r},${g},${b},${dark?.22:.2})`,pl:[r,g,b],dark};
}

function build(){
  const cols=Math.ceil(W/G)+2,rows=Math.ceil(H/G)+2,occ=new Uint8Array(cols*rows);
  const free=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows&&!occ[y*cols+x];
  const mark=(x,y)=>{occ[y*cols+x]=1};
  traces=[];
  const target=Math.round(W*H/(G*G*7));
  let tries=0;
  while(traces.length<target&&tries<target*12){
    tries++;
    let x=ri(0,cols-1),y=ri(0,rows-1);if(!free(x,y))continue;
    let d=ri(0,3)*2; /* start straight */
    const pts=[[x,y]];mark(x,y);
    let segLeft=ri(2,8),steps=0,maxSteps=ri(8,34);
    while(steps<maxSteps){
      if(segLeft<=0){
        /* bend by 45deg, prefer returning to straight */
        d=(d+(Math.random()<.5?1:7))%8;segLeft=d%2?ri(1,3):ri(3,9);
      }
      const nx=x+DIRS[d][0],ny=y+DIRS[d][1];
      if(!free(nx,ny))break;
      /* diagonal crossings: keep neighbours clear */
      if(d%2&&(!free(x+DIRS[d][0],y)||!free(x,y+DIRS[d][1])))break;
      x=nx;y=ny;mark(x,y);segLeft--;steps++;
      const lp=pts[pts.length-1],pp=pts[pts.length-2];
      if(pp&&Math.sign(lp[0]-pp[0])===DIRS[d][0]&&Math.sign(lp[1]-pp[1])===DIRS[d][1])pts[pts.length-1]=[x,y];
      else pts.push([x,y]);
    }
    if(steps<4)continue;
    const P=pts.map(([a,b])=>[a*G-G/2,b*G-G/2]);
    let len=0;const L=[0];for(let i=1;i<P.length;i++){len+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);L.push(len)}
    traces.push({P,L,len,w:Math.random()<.18?2:1.2});
  }
  pulses=[];
  const n=Math.min(Math.round(traces.length*(W<720?.12:.2)),W<720?10:28);
  for(let i=0;i<n;i++)pulses.push(newPulse(true));
}
function newPulse(anywhere){
  const tr=traces[ri(0,traces.length-1)];
  const v=rnd(55,130),dir=Math.random()<.5?1:-1;
  return {tr,dir,v,s:anywhere?rnd(0,tr.len):(dir>0?0:tr.len),tail:rnd(34,70),wait:anywhere?0:rnd(.2,2.5)};
}
function at(tr,s){
  s=Math.max(0,Math.min(tr.len,s));
  let i=1;while(i<tr.L.length-1&&tr.L[i]<s)i++;
  const a=tr.P[i-1],b=tr.P[i],seg=tr.L[i]-tr.L[i-1]||1,k=(s-tr.L[i-1])/seg;
  return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
}
function drawStatic(){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=col.tr;
  for(const t of traces){ctx.lineWidth=t.w;ctx.beginPath();t.P.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
  ctx.fillStyle=col.pad;ctx.strokeStyle=col.pad;ctx.lineWidth=1.2;
  for(const t of traces){
    for(const [x,y] of [t.P[0],t.P[t.P.length-1]]){ctx.beginPath();ctx.arc(x,y,t.w>1.5?3.4:2.6,0,7);ctx.stroke()}
  }
}
let base=null;
function snapshot(){drawStatic();base=ctx.getImageData(0,0,cv.width,cv.height)}
function frame(ts){
  raf=requestAnimationFrame(frame);
  const dt=Math.min(.05,(ts-(last||ts))/1000);last=ts;
  ctx.setTransform(1,0,0,1,0,0);ctx.putImageData(base,0,0);
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.lineCap="round";
  const [r,g,b]=col.pl,core=col.dark?.85:.7;
  for(let i=0;i<pulses.length;i++){
    const p=pulses[i];
    if(p.wait>0){p.wait-=dt;continue}
    p.s+=p.v*dt*p.dir;
    const head=p.s,tailS=head-p.tail*p.dir;
    if((p.dir>0&&tailS>p.tr.len)||(p.dir<0&&tailS<0)){pulses[i]=newPulse(false);continue}
    const N=8;
    for(let k=0;k<N;k++){
      const s0=head-(p.tail*p.dir)*(k/N),s1=head-(p.tail*p.dir)*((k+1)/N);
      if((s0<0&&s1<0)||(s0>p.tr.len&&s1>p.tr.len))continue;
      const [x0,y0]=at(p.tr,s0),[x1,y1]=at(p.tr,s1),a=(1-k/N);
      ctx.strokeStyle=`rgba(${r},${g},${b},${(a*a*.22).toFixed(3)})`;ctx.lineWidth=p.tr.w+4;
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
      ctx.strokeStyle=`rgba(${r},${g},${b},${(a*core).toFixed(3)})`;ctx.lineWidth=p.tr.w+.6;
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    }
    if(head>=0&&head<=p.tr.len){const [hx,hy]=at(p.tr,head);ctx.fillStyle=`rgba(${r},${g},${b},${core})`;ctx.beginPath();ctx.arc(hx,hy,p.tr.w+.9,0,7);ctx.fill()}
  }
}
function start(){cancelAnimationFrame(raf);last=0;if(!RM.matches&&!document.hidden&&traces.length)raf=requestAnimationFrame(frame)}
function setup(){
  DPR=Math.min(window.devicePixelRatio||1,W<720?1.5:2);
  W=innerWidth;H=innerHeight;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  readColors();build();snapshot();start();
}
let rt=0,lastW=0;
addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{
  /* mobile address-bar show/hide changes height only: keep traces, avoid reshuffle */
  if(innerWidth===lastW&&Math.abs(innerHeight-H)<160)return;lastW=innerWidth;setup()},200)});
document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else start()});
RM.addEventListener?.("change",()=>{snapshot();start()});
const recolor=()=>{readColors();snapshot();start()};
new MutationObserver(recolor).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",recolor);
lastW=innerWidth;setup();
})();
