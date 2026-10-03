import json,re
cat=json.load(open('cat_main.json')); K=json.load(open('extra_raw.json'))
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def clean(s): return re.sub(r'\s+',' ',re.sub(r'\(.*?\)','',s)).strip()
DESC=re.compile(r'^(Поддержка|поддержка|эффективность|Модульный|Устойчивость|Блоки питания|Блок питания$)')
BR={'Montech':'Montech','Thermaltake':'Thermaltake','CoolerMaster':'Cooler Master','PowerCase':'PowerCase','Redragon':'Redragon','FSP':'FSP'}
def nm(sn,sec,label,name):
    r=nm0(sn,sec,label,name)
    if r and sn in BR and BR[sn].lower() not in r.lower(): r=BR[sn]+' '+r
    return r
def nm0(sn,sec,label,name):
    if DESC.match(name):
        l=label.split(' ',1)
        return None if not label else label
    return name
# ---- PSU
psu={}
for sn,sec,label,name,p in K['psu']:
    txt=label+' '+name
    m=re.search(r'(\d{3,4})\s?(?:W\b|Watt|w\b)',txt) or re.search(r'(?:PQ|UD|P|GP-P|A|PN|PL|PK|PF|PX|PW|PB|PG|HV|SDA2-|HG2-|HPT2-|HP2-|HA2-|GP|elite v3 )-?(\d{3,4})',txt)
    if not m: continue
    w=int(m.group(1))
    if not 350<=w<=1600: continue
    n=re.sub(r'^(Блок питание|БП|Блок питание -)\s*-?\s*','',nm(sn,sec,label,name) or '')
    n=re.split(r',|\s80\s?\+|\s80\s?PLUS|\s[Мм]ощность|\sполностью|\sМодульный|\sPCIE|\sPower',n)[0]
    n=clean(n)[:40].strip()
    if not n: continue
    if w not in psu or p<psu[w][0]: psu[w]=(p,n)
for w,(p,n) in sorted(psu.items()):
    n=re.sub(r'\s*\(.*$','',n); n=re.sub(r'\s+80\s?[Pp]lus.*$','',n).strip()
    n=re.sub(r'\s*\d{3,4}W$','',n); n=re.sub(r'\s+%d$'%w,'',n)
    n=f'{n} {w}W'
    cat.append(dict(cat='psu',id=f'psu-{w}',name=n,price=round(p),watts=w))
# ---- coolers
cool={}
for sn,sec,label,name,p in K['cooler']:
    if re.search(r'Fan|120V2|140V2|TL120|P28|TLLCD|SL-INF 120|GC-F009|Redragon CC|СЕТ',name+label) and not re.search(r'Trinity|HydroShift',name): continue
    if 'Redragon' in name and 'EFFECT' not in name: continue
    liquid=re.search(r'Водян|водян|Liquid|LIQUID|WATERFORCE|CORELIQUID|HyperFlow|PINKFLOW|DASHFLOW|FX360|DX360|SL360|SL240|SPARTACUS|LM\d|LQ360|LT\d|LS\d|LE360|TG-360|TF 360|PL-A-360|Xi360|HydroShift|Trinity|EFFECT|Панорам|PANORAMA',name)
    if liquid:
        big=re.search(r'360|420|720',name)
        kind='aio'; td=340 if big else 280
        short='Suvli sovutish '+('360 mm' if re.search('360',name) else '420 mm' if '420' in name else '720 mm' if '720' in name else '240 mm')
    else:
        kind='air'
        td=65 if p<=8 else 95 if p<=12 else 125 if p<=20 else 150 if p<=30 else 200 if p<=45 else 250
        short='Havo kuleri'
    k=(kind,td)
    if k not in cool or p<cool[k][0]: cool[k]=(p,re.sub(r'^(Водяной кулер|Кулер)\s+','',clean(name))[:40],short)
for (kind,td),(p,n,short) in sorted(cool.items()):
    cat.append(dict(cat='cooler',id=f'cool-{kind}-{td}',name=f'{n} ({short}, ~{td}W gacha)',price=round(p),maxTdp=td))
# ---- cases
ITX_ONLY=r'A4|TR03|Strafe ITX|CH160|MOD-3 mini|ITX'
MATX=r'M-ATX|mikro|Micro|Mini\b|mATX|M100R|205M|O11 Air Mini|D40|U5|UMX4|CH170|CH260|CH270|ATHENA M|ATLAS M|GC9M|GC10M|M340|S380|CMT380|CC550|C102G|C103G|FORGE|Микро'
LARGE=r'KING|King|Cosmos|CH690|CL6600|O11 Dynamic EVO|LANCOOL II|LUCA|AC300G|XL|Divider 500|C700'
cases={}
for sn,sec,label,name,p in K['case']:
    n=nm(sn,sec,label,name)
    if not n: continue
    if re.match(r'Блок питание',n): continue
    if re.match(r'^(Поддержка|поддержка)',n): continue
    n=n.replace('Pixel - Корпус Микро АТХ','Pixel mikro-ATX korpus'); n=re.sub(r'^(Корпус|Case|ПК Кейс)\s+','',n); n=clean(re.sub(r'\bCase\b','',n))[:44]
    if re.search(ITX_ONLY,n): forms=['ITX']; g=300
    elif re.search(MATX,n): forms=['mATX','ITX']; g=330
    else: forms=['ATX','mATX','ITX']; g=360
    if re.search(LARGE,n): g=max(g,420)
    cls=forms[0]
    b=next(i for i,t in enumerate([20,30,40,50,60,75,100,140,200,1e9]) if p<=t)
    k=(cls,b)
    if k not in cases or p<cases[k][0]: cases[k]=(p,n,forms,g)
for (cls,b),(p,n,forms,g) in sorted(cases.items()):
    cat.append(dict(cat='case',id=f'case-{slug(n)}',name=f'{n} ({"/".join(forms)})',price=round(p),forms=forms,maxGpu=g))
order=['cpu','mb','ram','gpu','ssd','psu','case','cooler']
cat.sort(key=lambda x:(order.index(x['cat']),x['price']))
out='const CATALOG = '+json.dumps(cat,ensure_ascii=False,separators=(',',':')).replace('},{','},\n{')+';\n'
open('../data/catalog.js','w').write(out)
from collections import Counter
print(Counter(c['cat'] for c in cat))
for c in cat:
    if c['cat'] in('psu','case','cooler'): print(c['cat'],c['name'],c['price'])
