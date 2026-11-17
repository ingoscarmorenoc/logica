/* ================= INTERFAZ ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('adsoLab.'+k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('adsoLab.'+k,JSON.stringify(v));}catch(e){}}};
const cleanJSON=o=>JSON.parse(JSON.stringify(o,(k,v)=>k.startsWith('_')?undefined:v));

/* ---------- tema y rutas ---------- */
(function(){const t=store.get('theme',null);if(t)document.documentElement.dataset.theme=t;})();
$('#themeBtn').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark';store.set('theme',r.dataset.theme);};
const VIEWS=['inicio','diagramas','tutor','cpp'];
function route(){
  const h=(location.hash||'').replace('#','');const v=VIEWS.includes(h)?h:'inicio';
  document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+v));
  document.querySelectorAll('.steps a').forEach(a=>{if(a.dataset.view===v)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(v==='tutor')chatInit();
  if(v==='cpp')edSync();
  window.scrollTo(0,0);
}
addEventListener('hashchange',route);

/* ================= DIAGRAMAS: dibujo ================= */
let uid=1;
const nid=()=>'b'+(uid++);
function withIds(list){return list.map(b=>{const o={...b,id:nid()};for(const k of ['yes','no','body'])if(b[k])o[k]=withIds(b[k]);else if((b.type==='decision'&&k!=='body')||((b.type==='mientras'||b.type==='para')&&k==='body'))o[k]=[];return o;});}
function maxId(list){for(const b of list){const n=parseInt(String(b.id).slice(1));if(n>=uid)uid=n+1;['yes','no','body'].forEach(k=>b[k]&&maxId(b[k]));}}
const BH=46,GAP=30,DH=72;
const tw=(s,min,max,pad)=>Math.max(min,Math.min(max,s.length*7.6+pad));
const clip=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
const KIND={proceso:'Proceso',entrada:'Leer',salida:'Mostrar',decision:'¿Condición?',mientras:'Mientras',para:'Para'};
function arrow(x1,y1,x2,y2){return `<path class="ln" d="M${x1} ${y1} L${x2} ${y2}" marker-end="url(#ah)"/>`;}
function poly(pts,cls){return `<polygon class="sh ${cls}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;}
function L_seq(list){
  const items=list.map(L_node);
  if(!items.length)return {w:60,cx:30,h:0,draw:()=>''};
  let Lx=0,R=0;items.forEach(it=>{Lx=Math.max(Lx,it.cx);R=Math.max(R,it.w-it.cx);});
  const h=items.reduce((s,it)=>s+it.h,0)+GAP*(items.length-1);
  return {w:Lx+R,cx:Lx,h,draw:(x,y)=>{let s='',cy=y;const c=x+Lx;items.forEach((it,i)=>{if(i>0)s+=arrow(c,cy-GAP,c,cy-2);s+=it.draw(c-it.cx,cy);cy+=it.h+GAP;});return s;}};
}
function L_node(b){
  if(b.type==='decision')return L_dec(b);
  if(b.type==='mientras'||b.type==='para')return L_loop(b);
  return L_simple(b);
}
function blockLines(b){
  if(b.type==='proceso')return (b.text||'').split(/\n|;/).map(s=>s.trim()).filter(Boolean).slice(0,4).map(s=>clip(s,30));
  return [clip((b.text||'').trim()||'…',30)];
}
function L_simple(b){
  const lines=blockLines(b);const longest=lines.reduce((m,l)=>Math.max(m,l.length),0);
  const w=Math.max(150,Math.min(290,longest*7.6+(b.type==='proceso'?34:58)));
  const h=b.type==='proceso'&&lines.length>1?24+lines.length*17:BH+(b.type==='salida'?6:0);
  return {w,cx:w/2,h,draw:(x,y)=>{
    let shape='';const cls='s-'+b.type;
    if(b.type==='proceso')shape=`<rect class="sh ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
    else if(b.type==='entrada')shape=poly([[x+16,y],[x+w,y],[x+w-16,y+h],[x,y+h]],cls);
    else{const hb=h-8;shape=`<path class="sh ${cls}" d="M${x} ${y} H${x+w} V${y+hb} C${x+w*.75} ${y+hb-9} ${x+w*.6} ${y+h+6} ${x+w/2} ${y+hb} S${x+w*.15} ${y+hb+8} ${x} ${y+hb} Z"/>`;}
    const ty=y+(b.type==='proceso'&&lines.length>1?20:h/2-(b.type==='salida'?7:3));
    let t=`<text class="k k-${b.type}" x="${x+(b.type==='entrada'?20:8)}" y="${y+12}">${KIND[b.type]}</text>`;
    lines.forEach((l,i)=>{t+=`<text x="${x+w/2}" y="${ty+i*17+(lines.length>1?0:7)}" text-anchor="middle">${esc(l)}</text>`;});
    return `<g class="blk" data-id="${b.id}">${shape}${t}</g>`;
  }};
}
function diamond(x,y,dw,dh,b,label,cls){
  return `<g class="blk" data-id="${b.id}">${poly([[x,y],[x+dw/2,y+dh/2],[x,y+dh],[x-dw/2,y+dh/2]],cls)}<text class="k k-${cls==='s-loop'?'loop':'decision'}" x="${x}" y="${y+dh/2-12}" text-anchor="middle">${label}</text><text x="${x}" y="${y+dh/2+8}" text-anchor="middle">${esc(clip(b.text||'…',24))}</text></g>`;
}
function L_dec(b){
  const Y=L_seq(b.yes),N=L_seq(b.no);
  const dw=tw(b.text||'',170,250,70);
  const dx=Math.max(dw+40,(N.w-N.cx)+44+Y.cx);
  const xL=N.cx,xR=xL+dx,c=(xL+xR)/2;
  const w=Math.max(xR+(Y.w-Y.cx),c+dw/2);
  const bt=DH+20,bh=Math.max(Y.h,N.h),my=bt+bh+26;
  return {w,cx:c,h:my,draw:(x,y)=>{
    let s=diamond(x+c,y,dw,DH,b,'¿Condición?','s-decision');
    s+=`<path class="ln" d="M${x+c-dw/2} ${y+DH/2} H${x+xL} V${y+bt-2}" ${N.h?'marker-end="url(#ah)"':''}/>`;
    s+=`<path class="ln" d="M${x+c+dw/2} ${y+DH/2} H${x+xR} V${y+bt-2}" ${Y.h?'marker-end="url(#ah)"':''}/>`;
    s+=`<text class="lab" x="${x+c-dw/2-6}" y="${y+DH/2-7}" text-anchor="end">No</text><text class="lab" x="${x+c+dw/2+6}" y="${y+DH/2-7}">Sí</text>`;
    s+=N.draw(x+xL-N.cx,y+bt);s+=Y.draw(x+xR-Y.cx,y+bt);
    s+=`<path class="ln" d="M${x+xL} ${y+bt+N.h} V${y+my} H${x+c}"/><path class="ln" d="M${x+xR} ${y+bt+Y.h} V${y+my} H${x+c}"/>`;
    s+=`<circle cx="${x+c}" cy="${y+my}" r="4" fill="var(--ink-2)"/>`;
    return s;
  }};
}
function L_loop(b){
  const B=L_seq(b.body);
  const label=b.type==='para'?`${b.v||'i'} = ${b.from||'?'} hasta ${b.to||'?'}${b.step&&b.step!=='1'?' paso '+b.step:''}`:(b.text||'');
  const dw=tw(label,170,250,70);const dh=b.type==='para'?56:DH;
  const left=Math.max(B.cx,dw/2)+30,right=Math.max(B.w-B.cx,dw/2)+32;
  const top=16,c=left,w=left+right;
  const bt=top+dh+28,bb=bt+B.h,back=bb+18,exitY=back+24;
  return {w,cx:c,h:exitY,draw:(x,y)=>{
    let s=`<path class="ln" d="M${x+c} ${y} V${y+top-2}" marker-end="url(#ah)"/>`;
    if(b.type==='para'){const hw=dw/2,X=x+c,Y=y+top;s+=`<g class="blk" data-id="${b.id}">${poly([[X-hw+14,Y],[X+hw-14,Y],[X+hw,Y+dh/2],[X+hw-14,Y+dh],[X-hw+14,Y+dh],[X-hw,Y+dh/2]],'s-loop')}<text class="k k-loop" x="${X}" y="${Y+dh/2-8}" text-anchor="middle">Para</text><text x="${X}" y="${Y+dh/2+10}" text-anchor="middle">${esc(clip(label,26))}</text></g>`;}
    else s+=diamond(x+c,y+top,dw,dh,b,'Mientras','s-loop');
    s+=arrow(x+c,y+top+dh,x+c,y+bt-2);
    s+=`<text class="lab" x="${x+c+7}" y="${y+top+dh+16}">Sí</text>`;
    s+=B.draw(x+c-B.cx,y+bt);
    s+=`<path class="ln" d="M${x+c} ${y+bb} V${y+back} H${x+8} V${y+7} H${x+c-3}" marker-end="url(#ah)"/>`;
    s+=`<path class="ln" d="M${x+c+dw/2} ${y+top+dh/2} H${x+w-8} V${y+exitY} H${x+c}"/>`;
    s+=`<text class="lab" x="${x+c+dw/2+6}" y="${y+top+dh/2-7}">No</text>`;
    return s;
  }};
}
function renderFlowSVG(list,opts={}){
  const S=L_seq(list);const TW=150,TH=40;
  const W=Math.max(S.w,TW)+40;const cx=Math.max(S.cx,TW/2)+20;
  let y=10,s='';
  const term=(label,yy,id)=>`<g class="blk" data-id="${id}"><rect class="sh s-term" x="${cx-TW/2}" y="${yy}" width="${TW}" height="${TH}" rx="20"/><text x="${cx}" y="${yy+TH/2+5}" text-anchor="middle" style="font-family:var(--ui);font-weight:700;font-size:14px">${label}</text></g>`;
  s+=term('Inicio',y,'__start');y+=TH+GAP;
  s+=arrow(cx,y-GAP,cx,y-2);
  if(S.h){s+=S.draw(cx-S.cx,y);y+=S.h+GAP;s+=arrow(cx,y-GAP,cx,y-2);}
  s+=term('Fin',y,'__end');y+=TH+12;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}" role="img" aria-label="${esc(opts.label||'Diagrama de flujo')}"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0 0 L10 5 L0 10 z"/></marker></defs>${s}</svg>`;
}

/* ================= DIAGRAMAS: estado y edición ================= */
let flow=store.get('flow',null);
let fRetoId=store.get('flowReto','f2');
const fPassed=new Set(store.get('flowPassed',[]));
if(!Array.isArray(flow))flow=withIds([{type:'entrada',text:'a, b'}]);
maxId(flow);
let selId=null,zoom=1;
const saveFlow=()=>store.set('flow',cleanJSON(flow));
function findBlock(id,list=flow,parent=null){for(let i=0;i<list.length;i++){const b=list[i];if(b.id===id)return {b,list,i};for(const k of ['yes','no','body'])if(b[k]){const r=findBlock(id,b[k]);if(r)return r;}}return null;}
function listByKey(key){if(key==='root')return flow;const [id,k]=key.split(':');const f=findBlock(id);return f?f.b[k]:null;}
const ICONS={
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>'
};
function treeHTML(list,key){
  let h='';
  for(const b of list){
    const label=b.type==='para'?`${b.v} = ${b.from} hasta ${b.to}`:(b.text||'').replace(/\n/g,'; ');
    h+=`<div class="item t-${b.type}${b.id===selId?' sel':''}" data-id="${b.id}"><div class="head"><span class="lbl l-${b.type}">${KIND[b.type].replace('¿Condición?','Decisión')}</span><span class="txt" data-act="edit" title="${esc(label)}">${esc(label)}</span><span class="acts"><button data-act="up" aria-label="Subir">${ICONS.up}</button><button data-act="down" aria-label="Bajar">${ICONS.down}</button><button data-act="edit" aria-label="Editar">${ICONS.edit}</button><button data-act="del" aria-label="Eliminar">${ICONS.del}</button></span></div>`;
    if(b.type==='decision'){h+=`<div class="branch"><div class="bl">Si es verdadera (Sí)</div>${treeHTML(b.yes,b.id+':yes')}</div><div class="branch"><div class="bl">Si es falsa (No)</div>${treeHTML(b.no,b.id+':no')}</div>`;}
    if(b.type==='mientras'||b.type==='para')h+=`<div class="branch"><div class="bl">Se repite</div>${treeHTML(b.body,b.id+':body')}</div>`;
    h+='</div>';
  }
  h+=`<button class="add" data-add="${key}">+ Agregar bloque${key==='root'?'':' aquí'}</button>`;
  return h;
}
function renderFlow(keep){
  if(fr&&!keep){cOut(fOut,'Ejecución detenida porque se modificó el diagrama\n','sys');flowStop();}
  $('#fTree').innerHTML=treeHTML(flow,'root');
  const svg=renderFlowSVG(flow);
  $('#fCanvas').innerHTML=svg;
  const el=$('#fCanvas svg');const W=+el.getAttribute('width'),H=+el.getAttribute('height');el.setAttribute('width',Math.round(W*zoom));el.setAttribute('height',Math.round(H*zoom));
  if(selId){const g=el.querySelector(`[data-id="${selId}"]`);if(g)g.classList.add('sel');}
  saveFlow();
}
$('#fTree').addEventListener('click',e=>{
  const add=e.target.closest('[data-add]');if(add){openDlg({mode:'add',key:add.dataset.add});return;}
  const act=e.target.closest('[data-act]');if(!act)return;
  const id=act.closest('.item').dataset.id;const f=findBlock(id);if(!f)return;
  selId=id;
  switch(act.dataset.act){
    case 'edit':openDlg({mode:'edit',block:f.b});break;
    case 'del':if((f.b.yes&&f.b.yes.length)||(f.b.no&&f.b.no.length)||(f.b.body&&f.b.body.length)){if(!confirm('Este bloque contiene otros bloques. ¿Eliminarlo junto con su contenido?'))return;}f.list.splice(f.i,1);selId=null;break;
    case 'up':if(f.i>0){[f.list[f.i-1],f.list[f.i]]=[f.list[f.i],f.list[f.i-1]];}break;
    case 'down':if(f.i<f.list.length-1){[f.list[f.i+1],f.list[f.i]]=[f.list[f.i],f.list[f.i+1]];}break;
  }
  renderFlow();
});
$('#fCanvas').addEventListener('click',e=>{const g=e.target.closest('.blk');if(!g||g.dataset.id.startsWith('__'))return;const f=findBlock(g.dataset.id);if(f){selId=f.b.id;renderFlow();openDlg({mode:'edit',block:f.b});}});
$('#fClear').onclick=()=>{if(flow.length&&!confirm('¿Borrar todos los bloques del diagrama?'))return;flow=[];selId=null;renderFlow();};
$('#zIn').onclick=()=>{zoom=Math.min(1.6,zoom+.1);renderFlow(true);$('#zReset').textContent=Math.round(zoom*100)+'%';};
$('#zOut').onclick=()=>{zoom=Math.max(.5,zoom-.1);renderFlow(true);$('#zReset').textContent=Math.round(zoom*100)+'%';};
$('#zReset').onclick=()=>{zoom=1;renderFlow(true);$('#zReset').textContent='100%';};

/* ---------- diálogo de bloque ---------- */
const TYPE_INFO={
  entrada:{n:'Entrada',ic:'<svg viewBox="0 0 54 30"><polygon points="10,3 52,3 44,27 2,27" fill="var(--io-soft)" stroke="var(--io)" stroke-width="2"/></svg>'},
  proceso:{n:'Proceso',ic:'<svg viewBox="0 0 54 30"><rect x="3" y="3" width="48" height="24" rx="2" fill="var(--proc-soft)" stroke="var(--ink-2)" stroke-width="2"/></svg>'},
  salida:{n:'Salida',ic:'<svg viewBox="0 0 54 30"><path d="M3 3H51V22C40 18 34 30 27 23S10 26 3 22Z" fill="var(--out-soft)" stroke="var(--out)" stroke-width="2"/></svg>'},
  decision:{n:'Decisión',ic:'<svg viewBox="0 0 54 30"><polygon points="27,2 52,15 27,28 2,15" fill="var(--dec-soft)" stroke="var(--dec)" stroke-width="2"/></svg>'},
  mientras:{n:'Mientras',ic:'<svg viewBox="0 0 54 30"><polygon points="27,2 52,15 27,28 2,15" fill="var(--loop-soft)" stroke="var(--loop)" stroke-width="2"/><path d="M6 24 C2 30 2 6 10 6" fill="none" stroke="var(--loop)" stroke-width="1.5"/></svg>'},
  para:{n:'Para',ic:'<svg viewBox="0 0 54 30"><polygon points="10,3 44,3 52,15 44,27 10,27 2,15" fill="var(--loop-soft)" stroke="var(--loop)" stroke-width="2"/></svg>'}
};
let dlgState=null;
function fieldsFor(t,b){
  const v=k=>esc(b&&b[k]!=null?b[k]:'');
  switch(t){
    case 'entrada':return `<div class="field"><label for="dText">Variables que se leen</label><input id="dText" value="${v('text')}" placeholder="a, b"><p class="hint">Separe varias variables con coma. Los nombres no llevan espacios. Al ejecutar, cada variable pide un dato en la consola.</p></div>`;
    case 'proceso':return `<div class="field"><label for="dText">Asignaciones (una por línea)</label><textarea id="dText" placeholder="suma = a + b">${v('text')}</textarea><p class="hint">Forma: <code>variable = expresión</code> (también <code>&lt;-</code>). Operadores: <code>+ - * / ^</code>, <code>MOD</code> o <code>%</code>. Funciones: <code>raiz(x)</code>, <code>abs(x)</code>, <code>redondear(x)</code>.</p></div>`;
    case 'salida':return `<div class="field"><label for="dText">Qué se muestra</label><input id="dText" value="${v('text')}" placeholder='"La suma es: ", suma'><p class="hint">Textos entre comillas y variables o expresiones separadas por coma: <code>"Total: ", precio * 2</code></p></div>`;
    case 'decision':return `<div class="field"><label for="dText">Condición</label><input id="dText" value="${v('text')}" placeholder="n MOD 2 = 0"><p class="hint">Relacionales: <code>= &lt;&gt; &lt; &gt; &lt;= &gt;=</code> (también <code>== !=</code>). Lógicos: <code>Y</code>, <code>O</code>, <code>NO</code>. Después de guardar, agregue bloques en las ramas Sí y No.</p></div>`;
    case 'mientras':return `<div class="field"><label for="dText">Condición para repetir</label><input id="dText" value="${v('text')}" placeholder="i <= n"><p class="hint">Mientras la condición sea verdadera se repiten los bloques internos. Recuerde cambiar la variable dentro del ciclo para que termine.</p></div>`;
    case 'para':return `<div class="grid4"><div class="field"><label for="dV">Variable</label><input id="dV" value="${v('v')||'i'}"></div><div class="field"><label for="dFrom">Desde</label><input id="dFrom" value="${v('from')||'1'}"></div><div class="field"><label for="dTo">Hasta</label><input id="dTo" value="${v('to')}" placeholder="n"></div><div class="field"><label for="dStep">Paso</label><input id="dStep" value="${v('step')||'1'}"></div></div><p class="hint">La variable toma los valores desde el inicio hasta el final, aumentando según el paso, y repite los bloques internos en cada vuelta.</p>`;
  }
}
function openDlg(st){
  dlgState=st;const b=st.block;const t=b?b.type:(st.type||'proceso');dlgState.type=t;
  $('#dlgTitle').textContent=b?'Editar bloque':'Agregar bloque';
  $('#dlgTypes').innerHTML=Object.entries(TYPE_INFO).map(([k,i])=>`<button type="button" data-type="${k}" aria-pressed="${k===t}" ${b&&k!==t?'disabled':''}>${i.ic}${i.n}</button>`).join('');
  $('#dlgTypes').style.display=b?'none':'grid';
  $('#dlgFields').innerHTML=fieldsFor(t,b);$('#dlgErr').textContent='';
  $('#dlg').showModal();setTimeout(()=>{const f=$('#dlgFields input,#dlgFields textarea');if(f)f.focus();},30);
}
$('#dlgTypes').addEventListener('click',e=>{const bt=e.target.closest('button');if(!bt||bt.disabled)return;dlgState.type=bt.dataset.type;document.querySelectorAll('#dlgTypes button').forEach(x=>x.setAttribute('aria-pressed',x===bt));$('#dlgFields').innerHTML=fieldsFor(bt.dataset.type,null);$('#dlgErr').textContent='';const f=$('#dlgFields input,#dlgFields textarea');if(f)f.focus();});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#dlg').close());
$('#dlgSave').addEventListener('click',e=>{
  e.preventDefault();const t=dlgState.type;
  const data={type:t};
  if(t==='para'){data.v=$('#dV').value.trim();data.from=$('#dFrom').value.trim();data.to=$('#dTo').value.trim();data.step=$('#dStep').value.trim()||'1';}
  else data.text=$('#dText').value.trim();
  const probe={...data,id:'probe'};if(t==='decision'){probe.yes=[];probe.no=[];}if(t==='mientras'||t==='para')probe.body=[];
  try{compileBlock(probe);}catch(err){$('#dlgErr').textContent='Revise el bloque: '+err.message;return;}
  if(dlgState.mode==='edit'){Object.assign(dlgState.block,data);}
  else{const list=listByKey(dlgState.key);const nb={...data,id:nid()};if(t==='decision'){nb.yes=[];nb.no=[];}if(t==='mientras'||t==='para')nb.body=[];list.push(nb);selId=nb.id;}
  $('#dlg').close();renderFlow();
});

/* ---------- retos de diagramas ---------- */
function renderFlowReto(){
  const r=FLOW_RETOS.find(x=>x.id===fRetoId)||FLOW_RETOS[0];fRetoId=r.id;store.set('flowReto',r.id);
  $('#fRetoSel').innerHTML=FLOW_RETOS.map((x,i)=>`<option value="${x.id}" ${x.id===r.id?'selected':''}>${i+1}. ${esc(x.t)}${fPassed.has(x.id)?' ✓':''}</option>`).join('');
  $('#fRetoState').textContent=`${fPassed.size} de ${FLOW_RETOS.length} resueltos`;
  $('#fRetoBox').innerHTML=`<p>${esc(r.d)}</p><div class="tags">${r.conc.map(c=>`<span class="tag">${esc(c)}</span>`).join('')}</div><p><b>Datos de prueba:</b> ${r.tests.map(t=>t.in.join(', ')).join(' · ')}</p><div class="row-btns"><button class="btn small" id="fNew">Diagrama nuevo</button><button class="btn small ghost" id="fSol">Ver solución</button></div>`;
  $('#fNew').onclick=()=>{if(flow.length&&!confirm('Se reemplazará el diagrama actual. ¿Continuar?'))return;flow=[];selId=null;renderFlow();};
  $('#fSol').onclick=()=>{if(!confirm('Se cargará la solución de referencia en lugar de su diagrama. ¿Continuar?'))return;flow=withIds(r.sol);selId=null;renderFlow();};
}
$('#fRetoSel').onchange=e=>{fRetoId=e.target.value;renderFlowReto();$('#fResults').innerHTML='';};

/* ---------- ejecución de diagramas ---------- */
const fOut=$('#fOut');
function cOut(el,html,cls){const s=document.createElement('span');if(cls)s.className=cls;s.innerHTML=html;el.appendChild(s);el.scrollTop=el.scrollHeight;}
let fr=null;
function clearMarks(){document.querySelectorAll('#fCanvas .blk.on,#fCanvas .blk.err').forEach(g=>g.classList.remove('on','err'));document.querySelectorAll('#fTree .item.err').forEach(g=>g.classList.remove('err'));}
function markBlock(id,cls){const g=document.querySelector(`#fCanvas [data-id="${id}"]`);if(g){g.classList.add(cls);if(cls==='on'){const r=g.getBoundingClientRect(),w=$('#fCanvasWrap').getBoundingClientRect();if(r.top<w.top||r.bottom>w.bottom)g.scrollIntoView({block:'center',behavior:'smooth'});}}const t=document.querySelector(`#fTree .item[data-id="${id}"]`);if(t&&cls==='err')t.classList.add('err');}
let lastVars={};
function renderVars(el,vars,mode){
  if(!vars||!vars.length){el.innerHTML='<p class="empty">Aún no hay variables.</p>';return;}
  const tn={double:mode==='cpp'?'double':'número',int:'int',string:mode==='cpp'?'string':'texto',char:'char',bool:mode==='cpp'?'bool':'lógico'};
  el.innerHTML=`<table class="vars"><thead><tr><th>Variable</th><th>Valor</th><th>Tipo</th></tr></thead><tbody>${vars.map(v=>{const val=v.init===false?'<i>sin valor</i>':esc(fmt({t:v.t,v:v.v},mode==='cpp'?'cpp':'p'));const key=v.name;const chg=lastVars[key]!==undefined&&lastVars[key]!==String(v.v)&&mode!=='cpp';return `<tr class="${chg?'chg':''}"><td>${esc(v.name)}</td><td>${v.t==='string'&&v.init!==false?'"'+val+'"':val}</td><td>${tn[v.t]||v.t}</td></tr>`;}).join('')}</tbody></table>`;
  if(mode!=='cpp'){lastVars={};vars.forEach(v=>lastVars[v.name]=String(v.v));}
}
function compileFlow(){
  clearMarks();
  if(!flow.length)throw Object.assign(new CompileError('el diagrama está vacío: agregue al menos un bloque',0),{});
  flow.forEach(compileBlock);
}
function flowSetRunning(on){$('#fRun').disabled=on&&!fr?.step;$('#fStop').disabled=!on;$('#fValidate').disabled=on;}
function flowStart(step){
  if(fr){flowStop(true);}
  fOut.innerHTML='';lastVars={};renderVars($('#fVars'),[],'p');
  try{compileFlow();}catch(e){cOut(fOut,'Error en el diagrama: '+esc(e.message)+'\n','er');if(e.block)markBlock(e.block,'err');return;}
  const io={buf:'',out:s=>cOut(fOut,esc(s))};
  fr={gen:runFlow(flow,io),io,step,timer:null,cur:null};
  cOut(fOut,'▶ Inicio de la ejecución\n','sys');
  flowSetRunning(true);$('#fStep').textContent=step?'Siguiente paso':'Paso a paso';
  advance();
}
function flowDelay(){const v=+$('#fSpeed').value;return Math.round(1200-v*11.5);}
function advance(){
  if(!fr)return;
  let r;
  try{r=fr.gen.next();}catch(e){flowError(e);return;}
  if(r.done){clearMarks();renderVars($('#fVars'),r.value.vars,'p');cOut(fOut,'■ Fin del algoritmo\n','ok');flowStop();return;}
  const v=r.value;
  if(v.need){fr.needName=v.name;$('#fInLbl').textContent=`Ingrese ${v.name}:`;$('#fInForm').classList.add('on');$('#fIn').focus();fr.waiting=true;return;}
  clearMarks();markBlock(v.at,'on');renderVars($('#fVars'),v.vars,'p');
  if(!fr.step)fr.timer=setTimeout(advance,flowDelay());
}
function flowError(e){
  cOut(fOut,'Error: '+esc(e.message)+'\n','er');
  if(e.block){clearMarks();markBlock(e.block,'err');}
  flowStop(true);
}
function flowStop(silent){if(fr&&fr.timer)clearTimeout(fr.timer);fr=null;$('#fInForm').classList.remove('on');flowSetRunning(false);$('#fRun').disabled=false;$('#fStep').textContent='Paso a paso';if(silent===undefined){}}
$('#fRun').onclick=()=>{if(fr&&fr.step){fr.step=false;$('#fStep').textContent='Paso a paso';advance();return;}flowStart(false);};
$('#fStep').onclick=()=>{if(fr&&!fr.step){clearTimeout(fr.timer);fr.step=true;$('#fStep').textContent='Siguiente paso';$('#fRun').disabled=false;return;}if(fr&&fr.step&&!fr.waiting){advance();return;}if(!fr)flowStart(true);};
$('#fStop').onclick=()=>{cOut(fOut,'Ejecución detenida\n','sys');clearMarks();flowStop();};
$('#fInForm').onsubmit=e=>{e.preventDefault();if(!fr)return;const val=$('#fIn').value;if(val.trim()===''){$('#fIn').focus();return;}fr.io.buf+=val+'\n';cOut(fOut,esc(fr.needName+' ← '+val)+'\n','in');$('#fIn').value='';$('#fInForm').classList.remove('on');fr.waiting=false;advance();};
$('#fValidate').onclick=()=>{
  const r=FLOW_RETOS.find(x=>x.id===fRetoId);const box=$('#fResults');
  try{compileFlow();}catch(e){box.innerHTML=`<div class="banner no">El diagrama tiene un error: ${esc(e.message)}</div>`;if(e.block)markBlock(e.block,'err');return;}
  const types=new Set();(function walk(l){for(const b of l){types.add(b.type);['yes','no','body'].forEach(k=>b[k]&&walk(b[k]));}})(flow);
  let html='',all=true;
  if(r.req&&!r.req.some(t=>types.has(t))){all=false;html+=`<div class="r fail"><b>Estructura requerida</b>Este reto debe usar un bloque de tipo ${r.req.map(t=>TYPE_INFO[t].n).join(' o ')}.</div>`;}
  r.tests.forEach((t,i)=>{
    let out='';const io={buf:t.in.join('\n')+'\n',out:s=>out+=s};let err=null;
    try{runToEnd(runFlow(flow,io));}catch(e){err=e.message;}
    const m=err?{ok:false}:matchExpected(out,t.ex);if(!m.ok)all=false;
    html+=`<div class="r ${m.ok?'pass':'fail'}"><b>Prueba ${i+1}: ${m.ok?'correcta':'no supera'}</b>Datos: <code>${esc(t.in.join(', '))}</code><br>Salida obtenida: <code>${esc(out.trim()||'(nada)')}</code>${err?`<br>Error: ${esc(err)}`:''}${!m.ok&&!err?`<br>Se esperaba que mostrara: <code>${esc(t.ex.join(' … '))}</code>`:''}</div>`;
  });
  box.innerHTML=`<div class="banner ${all?'ok':'no'}">${all?'¡Reto superado! Su diagrama resuelve todos los casos.':'Aún no. Revise los casos marcados y use “Paso a paso”.'}</div>`+html;
  if(all){fPassed.add(r.id);store.set('flowPassed',[...fPassed]);renderFlowReto();}
};
function showCode(title,code,go){$('#codeTitle').textContent=title;$('#codeBody').textContent=code;$('#codeGo').hidden=!go;$('#codeGo').onclick=go||null;$('#codeDlg').showModal();}
$('#codeClose').onclick=()=>$('#codeDlg').close();
$('#codeCopy').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText($('#codeBody').textContent).then(()=>{$('#codeCopy').textContent='Copiado';setTimeout(()=>$('#codeCopy').textContent='Copiar',1500);});};
$('#fPseudo').onclick=()=>{try{compileFlow();showCode('Pseudocódigo',flowToPseudo(flow));}catch(e){$('#fResults').innerHTML=`<div class="banner no">Corrija el diagrama antes de convertirlo: ${esc(e.message)}</div>`;if(e.block)markBlock(e.block,'err');}};
$('#fToCpp').onclick=()=>{try{compileFlow();const code=flowToCpp(flow);showCode('Equivalente en C++',code,()=>{$('#codeDlg').close();cppLoadFree(code);location.hash='#cpp';});}catch(e){$('#fResults').innerHTML=`<div class="banner no">Corrija el diagrama antes de convertirlo: ${esc(e.message)}</div>`;if(e.block)markBlock(e.block,'err');}};

/* ================= TUTOR (chat) ================= */
let chat=store.get('chat',{score:0,done:{},cur:null,log:[]});
const allEx=TEMAS.flatMap(t=>t.ej.map((e,i)=>({t,e,i,key:t.id+'-'+i})));
let chatReady=false,botBusy=false;
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
function saveChat(){chat.log=chat.log.slice(-80);store.set('chat',chat);}
function addMsg(who,html,save=true){const d=document.createElement('div');d.className='msg '+who;d.innerHTML=html;$('#cMsgs').appendChild(d);$('#cMsgs').scrollTop=$('#cMsgs').scrollHeight;if(save){chat.log.push({w:who,h:html});saveChat();}}
function setChips(list){$('#cChips').innerHTML=(list||[]).map(c=>`<button type="button" data-v="${esc(c.v)}">${esc(c.l)}</button>`).join('');}
function bot(html,chips){
  return new Promise(res=>{
    botBusy=true;const t=document.createElement('div');t.className='msg bot typing';t.innerHTML='<span></span><span></span><span></span>';$('#cMsgs').appendChild(t);$('#cMsgs').scrollTop=$('#cMsgs').scrollHeight;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(()=>{t.remove();addMsg('bot',html);setChips(chips);botBusy=false;res();},reduce?0:Math.min(900,280+html.length*1.2));
  });
}
function renderProgress(){
  const total=allEx.length*10;
  $('#cScore').innerHTML=`${chat.score} <small>de ${total} puntos</small>`;
  $('#cTopics').innerHTML=TEMAS.map(t=>{const n=t.ej.length;const d=t.ej.filter((_,i)=>chat.done[t.id+'-'+i]!==undefined).length;return `<div class="topic"><div class="tt"><span>${esc(t.nombre)}</span><span>${d}/${n}</span></div><div class="bar"><i style="width:${d/n*100}%"></i></div></div>`;}).join('');
}
const menuChips=()=>TEMAS.map((t,i)=>({l:`${i+1}. ${t.nombre}`,v:'tema '+(i+1)})).concat([{l:'Ruta completa',v:'ruta completa'}]);
function chatInit(){
  if(chatReady)return;chatReady=true;
  renderProgress();
  if(chat.log.length){chat.log.forEach(m=>addMsg(m.w,m.h,false));
    if(chat.cur){const ex=currentEx();setChips(exChips(ex.e));}else setChips(menuChips());
    addMsg('bot','<p>Bienvenido de nuevo. Puedes continuar donde ibas o escribir <code>menú</code> para elegir otro tema.</p>',false);
    return;}
  bot(`<p>Hola, soy tu tutor de lógica de programación. Vamos a entender <b>cómo piensa un algoritmo</b> antes de escribir código.</p><p>Cada tema empieza con una explicación corta y luego te propongo ejercicios. Respondes escribiendo o tocando una opción. Si te atascas, escribe <code>pista</code>.</p><p>¿Por cuál tema quieres empezar?</p>`,menuChips());
}
function currentEx(){if(!chat.cur)return null;const t=TEMAS.find(x=>x.id===chat.cur.tema);return {t,e:t.ej[chat.cur.idx],i:chat.cur.idx};}
function exChips(e){if(e.tipo==='op')return e.o.map((o,i)=>({l:`${'ABCD'[i]}) ${o}`,v:'ABCD'[i]}));return [{l:'Pista',v:'pista'},{l:'Ver explicación',v:'explicar'}];}
async function startTema(t,route=false){
  chat.cur={tema:t.id,idx:0,tries:0,route};saveChat();
  await bot(`<p><b>Tema: ${esc(t.nombre)}</b></p>${t.intro}`);
  // saltar ejercicios ya resueltos
  while(chat.cur.idx<t.ej.length&&chat.done[t.id+'-'+chat.cur.idx]!==undefined)chat.cur.idx++;
  if(chat.cur.idx>=t.ej.length){await bot('<p>Ya resolviste todos los ejercicios de este tema. Puedes repasar otro.</p>',menuChips());chat.cur=null;saveChat();return;}
  await askCurrent();
}
async function askCurrent(){
  const x=currentEx();chat.cur.tries=0;saveChat();
  await bot(`<p><b>Ejercicio ${x.i+1} de ${x.t.ej.length}</b></p>${x.e.q}`,exChips(x.e));
}
function check(e,ans){
  const a=norm(ans);
  if(e.tipo==='op'){const L=a.match(/^(?:opcion\s*)?([a-d])(?:\)|\.|\s|$)/);if(L)return 'abcd'.indexOf(L[1])===e.a;return e.o.findIndex(o=>norm(o)===a)===e.a?true:(e.o.some(o=>norm(o)===a)?false:null);}
  if(e.tipo==='num'){const m=a.replace(',','.').match(/-?\d+(\.\d+)?/);if(!m)return null;return Math.abs(parseFloat(m[0])-e.a)<1e-6;}
  if(e.tipo==='ord'){const s=a.toUpperCase().replace(/[^A-E]/g,'');if(s.length<3)return null;return s===e.a;}
  if(e.tipo==='txt'){if(!a)return null;return e.a.some(x=>a===x||a.split(/\s+/).includes(x));}
}
async function nextEx(){
  const x=currentEx();chat.cur.idx++;
  while(chat.cur.idx<x.t.ej.length&&chat.done[x.t.id+'-'+chat.cur.idx]!==undefined)chat.cur.idx++;
  if(chat.cur.idx<x.t.ej.length){await askCurrent();return;}
  const ti=TEMAS.indexOf(x.t);const route=chat.cur.route;
  const got=x.t.ej.reduce((s,_,i)=>s+(chat.done[x.t.id+'-'+i]||0),0);
  await bot(`<p>Terminaste <b>${esc(x.t.nombre)}</b> con ${got} de ${x.t.ej.length*10} puntos.</p>`);
  if(route&&ti<TEMAS.length-1){await startTema(TEMAS[ti+1],true);return;}
  chat.cur=null;saveChat();
  if(Object.keys(chat.done).length===allEx.length){await bot(`<p>¡Completaste todos los temas! Ya tienes la base lógica para programar. El siguiente paso es el <a href="#cpp">Laboratorio C++</a>, donde escribirás estos mismos algoritmos en código real.</p>`,menuChips());}
  else await bot('<p>¿Qué tema quieres trabajar ahora?</p>',menuChips());
}
async function handle(text,shown){
  if(botBusy)return;
  const raw=text.trim();if(!raw)return;
  addMsg('me',esc(shown||raw));setChips([]);
  const a=norm(raw);
  if(/^(menu|temas|inicio)$/.test(a)){chat.cur=null;saveChat();await bot('<p>Elige un tema:</p>',menuChips());return;}
  if(a==='progreso'){const lines=TEMAS.map(t=>{const d=t.ej.filter((_,i)=>chat.done[t.id+'-'+i]!==undefined).length;return `<li>${esc(t.nombre)}: ${d}/${t.ej.length}</li>`;}).join('');await bot(`<p>Llevas <b>${chat.score}</b> puntos.</p><ul>${lines}</ul>`,chat.cur?exChips(currentEx().e):menuChips());return;}
  const tm=a.match(/^tema\s*(\d)$/)||a.match(/^(\d)$/);
  if(!chat.cur&&tm&&TEMAS[+tm[1]-1]){await startTema(TEMAS[+tm[1]-1]);return;}
  if(tm&&a.startsWith('tema')&&TEMAS[+tm[1]-1]){await startTema(TEMAS[+tm[1]-1]);return;}
  if(a==='ruta completa'){const first=TEMAS.find(t=>t.ej.some((_,i)=>chat.done[t.id+'-'+i]===undefined))||TEMAS[0];await startTema(first,true);return;}
  if(!chat.cur){const t=TEMAS.find(t=>norm(t.nombre).includes(a)||a.includes(norm(t.nombre).split(' ')[0]));if(t){await startTema(t);return;}await bot('<p>No entendí. Elige un tema de la lista o escribe su número.</p>',menuChips());return;}
  const x=currentEx();
  if(a==='pista'){await bot(`<p>💡 ${x.e.hint}</p>`,exChips(x.e));return;}
  if(/^(explicar|explicacion|solucion|respuesta)$/.test(a)){chat.done[x.t.id+'-'+x.i]=0;saveChat();renderProgress();await bot(`<p>${x.e.exp}</p><p>Este ejercicio queda sin puntos. Sigamos.</p>`);await nextEx();return;}
  if(a==='saltar'){await bot('<p>Lo dejamos pendiente; podrás volver a él desde el menú.</p>');const t=x.t;let i=chat.cur.idx+1;while(i<t.ej.length&&chat.done[t.id+'-'+i]!==undefined)i++;if(i<t.ej.length){chat.cur.idx=i;await askCurrent();}else{chat.cur=null;saveChat();await bot('<p>Elige un tema:</p>',menuChips());}return;}
  const ok=check(x.e,raw);
  if(ok===null){await bot(x.e.tipo==='op'?'<p>Responde con la letra de la opción (A, B, C o D).</p>':x.e.tipo==='num'?'<p>Escribe un número como respuesta.</p>':x.e.tipo==='ord'?'<p>Escribe las letras en el orden correcto, por ejemplo <code>ABCDE</code>.</p>':'<p>Escribe tu respuesta.</p>',exChips(x.e));return;}
  if(ok){const pts=chat.cur.tries===0?10:5;chat.done[x.t.id+'-'+x.i]=pts;chat.score+=pts;saveChat();renderProgress();
    await bot(`<p class="verdict ok">¡Correcto! +${pts} puntos</p><p>${x.e.exp}</p>`);await nextEx();return;}
  chat.cur.tries++;saveChat();
  if(chat.cur.tries===1){await bot(`<p class="verdict no">No es correcto todavía.</p><p>💡 ${x.e.hint}</p><p>Inténtalo de nuevo (si aciertas ahora ganas 5 puntos).</p>`,exChips(x.e));return;}
  chat.done[x.t.id+'-'+x.i]=0;saveChat();renderProgress();
  await bot(`<p class="verdict no">Tampoco es correcto.</p><p>${x.e.exp}</p>`);await nextEx();
}
$('#cForm').onsubmit=e=>{e.preventDefault();const v=$('#cIn').value;$('#cIn').value='';handle(v);};
$('#cChips').addEventListener('click',e=>{const b=e.target.closest('button');if(b)handle(b.dataset.v,b.textContent);});
$('#cReset').onclick=()=>{if(!confirm('¿Borrar el puntaje y la conversación del tutor?'))return;chat={score:0,done:{},cur:null,log:[]};saveChat();$('#cMsgs').innerHTML='';chatReady=false;chatInit();};

/* ================= LABORATORIO C++ ================= */
const ed=$('#cppEd'),hl=$('#cppHl'),gut=$('#cppGutter');
let cppRetoId=store.get('cppReto','c1');
const cppPassed=new Set(store.get('cppPassed',[]));
let errLines={e:new Set(),w:new Set()};
const KW=/\b(if|else|while|do|for|switch|case|default|break|continue|return|const|using|namespace|true|false)\b/;
function highlight(src){
  const re=/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(^[ \t]*#[^\n]*)|\b(int|double|float|char|bool|string|void|long|short|unsigned|auto)\b|\b(if|else|while|do|for|switch|case|default|break|continue|return|const|using|namespace|true|false|std|main)\b|\b(cout|cin|endl|getline)\b|(\b\d+(?:\.\d+)?\b)/gm;
  let out='',last=0,m;
  while((m=re.exec(src))){out+=esc(src.slice(last,m.index));const t=esc(m[0]);
    out+=m[1]?`<span class="hl-c">${t}</span>`:m[2]?`<span class="hl-s">${t}</span>`:m[3]?`<span class="hl-p">${t}</span>`:m[4]?`<span class="hl-t">${t}</span>`:m[5]?`<span class="hl-k">${t}</span>`:m[6]?`<span class="hl-io">${t}</span>`:`<span class="hl-n">${t}</span>`;
    last=m.index+m[0].length;}
  return out+esc(src.slice(last))+'\n';
}
function edSync(){
  hl.innerHTML=highlight(ed.value);
  const n=ed.value.split('\n').length;let g='';
  for(let i=1;i<=n;i++)g+=`<div class="${errLines.e.has(i)?'e':errLines.w.has(i)?'w':''}">${i}</div>`;
  gut.innerHTML=g;hl.scrollTop=ed.scrollTop;hl.scrollLeft=ed.scrollLeft;gut.scrollTop=ed.scrollTop;
}
ed.addEventListener('input',()=>{errLines={e:new Set(),w:new Set()};edSync();store.set('code.'+cppRetoId,ed.value);});
ed.addEventListener('scroll',()=>{hl.scrollTop=ed.scrollTop;hl.scrollLeft=ed.scrollLeft;gut.scrollTop=ed.scrollTop;});
ed.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();cppRun();return;}
  if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();insText('    ');}
  else if(e.key==='Enter'){const s=ed.selectionStart;const before=ed.value.slice(0,s);const line=before.slice(before.lastIndexOf('\n')+1);let ind=line.match(/^[ \t]*/)[0];if(/\{\s*$/.test(line))ind+='    ';e.preventDefault();insText('\n'+ind);}
  else if(e.key==='}'){const s=ed.selectionStart;const before=ed.value.slice(0,s);const line=before.slice(before.lastIndexOf('\n')+1);if(/^ {4,}$/.test(line)&&ed.selectionEnd===s){e.preventDefault();ed.setSelectionRange(s-4,s);insText('}');}}
});
function insText(t){ed.focus();let ok=false;try{ok=document.execCommand('insertText',false,t);}catch(e){}if(!ok){ed.setRangeText(t,ed.selectionStart,ed.selectionEnd,'end');ed.dispatchEvent(new Event('input'));}}
function renderCppList(){
  $('#cppList').innerHTML=CPP_RETOS.map((r,i)=>`<li><button data-id="${r.id}" aria-current="${r.id===cppRetoId}"><span class="num">${i+1}</span><span>${esc(r.t)}<small>${esc(r.conc)}</small></span>${cppPassed.has(r.id)?'<span class="st" aria-label="resuelto">✓</span>':''}</button></li>`).join('')+`<li><button data-id="libre" aria-current="${cppRetoId==='libre'}"><span class="num">∞</span><span>Práctica libre<small>escriba cualquier programa</small></span></button></li>`;
  $('#cppDone').textContent=`${cppPassed.size} de ${CPP_RETOS.length}`;
}
function loadCppReto(id){
  cppRetoId=id;store.set('cppReto',id);
  const r=CPP_RETOS.find(x=>x.id===id);
  if(r){$('#cppDesc').innerHTML=`<h3>${esc(r.t)}</h3>${r.d}<p><b>Casos de prueba:</b> ${r.tests.length}</p>`;ed.value=store.get('code.'+id,r.tpl);$('#cppValidate').disabled=false;$('#cppSol').disabled=false;$('#cppReset').disabled=false;}
  else{$('#cppDesc').innerHTML='<h3>Práctica libre</h3><p>Escriba y ejecute cualquier programa con las sentencias básicas. Aquí llega también el código que convierte desde un diagrama de flujo.</p>';ed.value=store.get('code.libre',CPP_HEAD+'int main() {\n    \n    return 0;\n}\n');$('#cppValidate').disabled=true;$('#cppSol').disabled=true;$('#cppReset').disabled=false;}
  $('#cppFname').textContent=r?`reto${CPP_RETOS.indexOf(r)+1}.cpp`:'practica.cpp';
  errLines={e:new Set(),w:new Set()};$('#cppResults').innerHTML='';$('#cppVars').innerHTML='<p class="empty">Se muestran al terminar la ejecución.</p>';edSync();renderCppList();
}
function cppLoadFree(code){store.set('code.libre',code);loadCppReto('libre');}
$('#cppList').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cppStop(true);loadCppReto(b.dataset.id);}});
$('#cppReset').onclick=()=>{const r=CPP_RETOS.find(x=>x.id===cppRetoId);if(!confirm('¿Reemplazar su código por la plantilla inicial?'))return;ed.value=r?r.tpl:CPP_HEAD+'int main() {\n    \n    return 0;\n}\n';store.set('code.'+cppRetoId,ed.value);errLines={e:new Set(),w:new Set()};edSync();};
$('#cppSol').onclick=()=>{const r=CPP_RETOS.find(x=>x.id===cppRetoId);if(!r)return;showCode('Solución de referencia: '+r.t,r.sol,null);};
const cppOutEl=$('#cppOut');
let cr=null;
function compileReport(src,quiet){
  const c=compileCpp(src);
  errLines={e:new Set(c.errors.map(x=>x.line)),w:new Set(c.warnings.map(x=>x.line))};edSync();
  if(!quiet){
    cOut(cppOutEl,'$ g++ main.cpp -o programa\n','sys');
    c.errors.forEach(x=>cOut(cppOutEl,`línea ${x.line}: error: ${esc(x.msg)}\n`,'er'));
    c.warnings.forEach(x=>cOut(cppOutEl,`línea ${x.line}: advertencia: ${esc(x.msg)}\n`,'wa'));
    if(c.errors.length)cOut(cppOutEl,`Compilación fallida: ${c.errors.length} error(es). Corrija la primera línea marcada y vuelva a compilar.\n`,'er');
    else cOut(cppOutEl,`Compilación exitosa (${c.warnings.length} advertencia(s)).\n`,'ok');
  }
  return c;
}
function cppSetRunning(on){$('#cppRun').disabled=on;$('#cppCompile').disabled=on;$('#cppStop').disabled=!on;$('#cppValidate').disabled=on||cppRetoId==='libre';}
function cppRun(){
  cppStop(true);cppOutEl.innerHTML='';
  const c=compileReport(ed.value);if(c.errors.length)return;
  cOut(cppOutEl,'$ ./programa\n','sys');
  let size=0;
  const io={buf:'',out:s=>{size+=s.length;if(size>40000)throw new RunError('la salida es demasiado larga (más de 40 000 caracteres): posible ciclo infinito',0);cOut(cppOutEl,esc(s));},warn:(m,l)=>cOut(cppOutEl,`\n[línea ${l}] ${esc(m)}\n`,'wa')};
  cr={gen:runCpp(c.prog,io),io};cppSetRunning(true);cppStep();
}
function cppStep(){
  if(!cr)return;let r;
  try{r=cr.gen.next();}catch(e){cOut(cppOutEl,`\nError en tiempo de ejecución${e.line?' (línea '+e.line+')':''}: ${esc(e.message)}\n`,'er');if(e.line){errLines.e.add(e.line);edSync();}cppStop(true);return;}
  if(r.done){cOut(cppOutEl,`\n[El programa terminó con código ${r.value.code}]\n`,'sys');renderVars($('#cppVars'),r.value.vars,'cpp');cppStop(true);return;}
  $('#cppInForm').classList.add('on');$('#cppIn').focus();
}
function cppStop(silent){cr=null;$('#cppInForm').classList.remove('on');cppSetRunning(false);}
$('#cppStop').onclick=()=>{cOut(cppOutEl,'\n[Ejecución detenida]\n','sys');cppStop();};
$('#cppInForm').onsubmit=e=>{e.preventDefault();if(!cr)return;const v=$('#cppIn').value;cr.io.buf+=v+'\n';cOut(cppOutEl,esc(v)+'\n','in');$('#cppIn').value='';$('#cppInForm').classList.remove('on');cppStep();};
$('#cppRun').onclick=cppRun;
$('#cppCompile').onclick=()=>{cppStop(true);cppOutEl.innerHTML='';compileReport(ed.value);};
$('#cppValidate').onclick=()=>{
  const r=CPP_RETOS.find(x=>x.id===cppRetoId);if(!r)return;const box=$('#cppResults');
  const c=compileReport(ed.value,true);
  if(c.errors.length){box.innerHTML=`<div class="banner no">El código no compila. Primer error (línea ${c.errors[0].line}): ${esc(c.errors[0].msg)}</div>`;return;}
  let all=true,html='';
  r.tests.forEach((t,i)=>{
    let out='';let err=null;const io={buf:t.in?t.in+'\n':'',out:s=>{out+=s;if(out.length>20000)throw new RunError('salida demasiado larga',0);},warn:()=>{}};
    try{runToEnd(runCpp(c.prog,io));}catch(e){err=e.message;}
    const m=err?{ok:false}:matchExpected(out,t.ex);if(!m.ok)all=false;
    html+=`<div class="r ${m.ok?'pass':'fail'}"><b>Prueba ${i+1}: ${m.ok?'correcta':'no supera'}</b>${t.in?`Entrada: <code>${esc(t.in)}</code><br>`:''}Salida: <code>${esc(out.trim()||'(nada)')}</code>${err?`<br>Error: ${esc(err)}`:''}${!m.ok&&!err?`<br>Debe aparecer: <code>${esc(t.ex.join(' … '))}</code>`:''}</div>`;
  });
  box.innerHTML=`<div class="banner ${all?'ok':'no'}">${all?'¡Reto superado! Su programa pasa todas las pruebas.':'Aún no pasa todas las pruebas.'}</div>`+html;
  if(all){cppPassed.add(r.id);store.set('cppPassed',[...cppPassed]);renderCppList();}
};

/* ================= INICIO: ejemplo y tabla ================= */
(function(){
  const demo=withIds(FLOW_RETOS[3].sol);
  $('#heroSvg').innerHTML=renderFlowSVG(demo,{label:'Diagrama de flujo: par o impar'});
  const svg=$('#heroSvg svg');svg.style.maxWidth='100%';svg.style.height='auto';svg.removeAttribute('height');svg.setAttribute('width','100%');svg.style.maxHeight='360px';
  $('#heroCode').textContent=CPP_RETOS[3].sol.replace('    cout << "Ingrese un numero: ";\n','');
  const sym={
    term:'<svg width="70" height="30"><rect x="2" y="2" width="66" height="26" rx="13" class="sh s-term" style="fill:var(--sena-soft);stroke:var(--sena);stroke-width:2"/></svg>',
    entrada:TYPE_INFO.entrada.ic.replace('viewBox','width="70" height="30" viewBox'),proceso:TYPE_INFO.proceso.ic.replace('viewBox','width="70" height="30" viewBox'),
    salida:TYPE_INFO.salida.ic.replace('viewBox','width="70" height="30" viewBox'),decision:TYPE_INFO.decision.ic.replace('viewBox','width="70" height="30" viewBox'),
    mientras:TYPE_INFO.mientras.ic.replace('viewBox','width="70" height="30" viewBox'),para:TYPE_INFO.para.ic.replace('viewBox','width="70" height="30" viewBox')};
  const rows=[
    [sym.term,'Inicio y fin del algoritmo','Algoritmo … FinAlgoritmo','int main() { … return 0; }'],
    [sym.entrada,'Entrada de datos','Leer a, b','cin >> a >> b;'],
    [sym.proceso,'Proceso o asignación','suma <- a + b','suma = a + b;'],
    [sym.salida,'Salida de resultados','Escribir "Suma: ", suma','cout << "Suma: " << suma << endl;'],
    [sym.decision,'Decisión (condicional)','Si n MOD 2 = 0 Entonces … SiNo … FinSi','if (n % 2 == 0) { … } else { … }'],
    [sym.mientras,'Ciclo mientras','Mientras i <= n Hacer … FinMientras','while (i <= n) { … }'],
    [sym.para,'Ciclo para (contador)','Para i <- 1 Hasta 10 Hacer … FinPara','for (int i = 1; i <= 10; i++) { … }']
  ];
  $('#eqBody').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td><code>${esc(r[2])}</code></td><td><code>${esc(r[3])}</code></td></tr>`).join('');
})();

renderFlow(true);renderFlowReto();renderCppList();loadCppReto(cppRetoId);route();
