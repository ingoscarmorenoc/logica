/* ================= NÚCLEO: léxico, sintaxis e intérpretes ================= */
class CompileError extends Error{constructor(msg,line){super(msg);this.line=line;this.kind='compile';}}
class RunError extends Error{constructor(msg,line){super(msg);this.line=line;this.kind='run';}}

const OPS=['<<=','>>=','<<','>>','<=','>=','==','!=','<>','&&','||','++','--','+=','-=','*=','/=','%=','::','->','<-','+','-','*','/','%','<','>','=','!','(',')','{','}','[',']',';',',','.','?',':','&','|','^','~'];

function lex(src,mode){
  const toks=[];let i=0,line=1;const n=src.length;
  const err=m=>{throw new CompileError(m,line);};
  const idStart=mode==='cpp'?/[A-Za-z_]/:/[A-Za-z_áéíóúÁÉÍÓÚñÑ]/;
  const idChar=mode==='cpp'?/[A-Za-z0-9_]/:/[A-Za-z0-9_áéíóúÁÉÍÓÚñÑ]/;
  while(i<n){
    const c=src[i];
    if(c==='\n'){line++;i++;continue;}
    if(c===' '||c==='\t'||c==='\r'||c==='\u00a0'){i++;continue;}
    if(c==='/'&&src[i+1]==='/'){while(i<n&&src[i]!=='\n')i++;continue;}
    if(c==='/'&&src[i+1]==='*'){i+=2;while(i<n&&!(src[i]==='*'&&src[i+1]==='/')){if(src[i]==='\n')line++;i++;}if(i>=n)err('comentario /* sin cerrar');i+=2;continue;}
    if(mode==='cpp'&&c==='#'){const s=i;while(i<n&&src[i]!=='\n')i++;toks.push({type:'pre',value:src.slice(s,i).trim(),line});continue;}
    if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(src[i+1]||''))){
      const s=i;let isF=false;
      while(i<n&&/[0-9]/.test(src[i]))i++;
      if(src[i]==='.'&&/[0-9]/.test(src[i+1]||'')){isF=true;i++;while(i<n&&/[0-9]/.test(src[i]))i++;}
      else if(src[i]==='.'&&mode==='cpp'){isF=true;i++;}
      if(/[eE]/.test(src[i]||'')&&/[0-9+\-]/.test(src[i+1]||'')){isF=true;i++;if(/[+\-]/.test(src[i]))i++;while(i<n&&/[0-9]/.test(src[i]))i++;}
      const txt=src.slice(s,i);
      if(mode==='cpp'&&/[fF]/.test(src[i]||'')){i++;isF=true;}
      if(idStart.test(src[i]||''))err(`sufijo inválido en la constante numérica '${txt}${src[i]}'`);
      toks.push({type:'num',value:parseFloat(txt),isF,line});continue;
    }
    if(idStart.test(c)){const s=i;while(i<n&&idChar.test(src[i]))i++;toks.push({type:'id',value:src.slice(s,i),line});continue;}
    if(mode==='cpp'&&/[áéíóúÁÉÍÓÚñÑ]/.test(c))err(`carácter '${c}' no válido en un identificador: en C++ los nombres no llevan tildes ni ñ`);
    const readEsc=()=>{i++;const e=src[i++];const map={n:'\n',t:'\t','\\':'\\','"':'"',"'":"'",'0':'\0'};if(!(e in map))err(`secuencia de escape desconocida '\\${e}'`);return map[e];};
    if(c==='"'||(mode!=='cpp'&&(c==="'"||c==='“'))){
      const close=c==='“'?'”':c;i++;let s='';
      while(i<n&&src[i]!==close){if(src[i]==='\n')err('falta la comilla de cierre del texto');if(src[i]==='\\'&&mode==='cpp')s+=readEsc();else s+=src[i++];}
      if(i>=n)err('falta la comilla de cierre del texto');i++;toks.push({type:'str',value:s,line});continue;
    }
    if(mode==='cpp'&&c==="'"){
      i++;let ch;if(src[i]==='\\')ch=readEsc();else{if(src[i]==="'"||src[i]==='\n'||i>=n)err('constante de carácter vacía');ch=src[i++];}
      if(src[i]!=="'")err("una constante char lleva un solo carácter entre comillas simples; para textos use comillas dobles y string");
      i++;toks.push({type:'chr',value:ch.charCodeAt(0),line});continue;
    }
    if(mode==='cpp'&&(c==='“'||c==='”'||c==='‘'||c==='’'))err(`comillas tipográficas ${c} no válidas: use comillas rectas "`);
    if(mode!=='cpp'&&c==='←'){toks.push({type:'op',value:'<-',line});i++;continue;}
    let op=null;
    for(const o of OPS){if((o==='<-'||o==='<>')&&mode==='cpp')continue;if(src.startsWith(o,i)){op=o;break;}}
    if(!op)err(`carácter inesperado '${c}'`);
    toks.push({type:'op',value:op,line});i+=op.length;
  }
  toks.push({type:'eof',value:'',line});
  return toks;
}

const TYPEWORDS={int:'int',long:'int',short:'int',unsigned:'int',signed:'int',float:'double',double:'double',char:'char',bool:'bool',string:'string'};
const CPP_KW=new Set(['int','long','short','unsigned','signed','float','double','char','bool','string','if','else','while','do','for','switch','case','default','break','continue','return','const','true','false','void','using','namespace','class','struct','new','delete','auto']);
const BIN={'||':2,'&&':3,'==':4,'!=':4,'<':5,'>':5,'<=':5,'>=':5,'+':6,'-':6,'*':7,'/':7,'%':7,'^':8};
const ASSIGN={'=':1,'+=':1,'-=':1,'*=':1,'/=':1,'%=':1};
const PSEUDO_WORDS={Y:'&&',y:null,AND:'&&',and:'&&',O:'||',OR:'||',or:'||',MOD:'%',mod:'%',Mod:'%'};
const MATH={sqrt:1,pow:2,fmod:2,abs:1,fabs:1,round:1,floor:1,ceil:1,trunc:1};
const PSEUDO_FN={raiz:'sqrt',rc:'sqrt',sqrt:'sqrt',abs:'abs',redondear:'round',round:'round',truncar:'trunc',trunc:'trunc',potencia:'pow',pow:'pow'};

function desc(t){return t.type==='eof'?'el final del código':`'${t.type==='str'?'"'+t.value+'"':t.value}'`;}

class Parser{
  constructor(toks,mode){this.t=toks;this.p=0;this.mode=mode;}
  peek(o=0){return this.t[Math.min(this.p+o,this.t.length-1)];}
  prev(){return this.t[Math.max(0,this.p-1)];}
  next(){const k=this.peek();if(this.p<this.t.length-1)this.p++;return k;}
  is(v,o=0){const k=this.peek(o);return (k.type==='op'||k.type==='id')&&k.value===v;}
  accept(v){return this.is(v)?this.next():null;}
  expect(v,msg){if(this.is(v))return this.next();const k=this.peek();throw new CompileError(msg||`se esperaba '${v}' antes de ${desc(k)}`,k.line);}
  semi(){if(this.is(';'))return this.next();throw new CompileError(`se esperaba ';' al final de la instrucción (antes de ${desc(this.peek())})`,this.prev().line);}
  // ---------- expresiones ----------
  opOf(k){
    if(k.type==='op'){let v=k.value;if(this.mode!=='cpp'){if(v==='=')v='==';if(v==='<>')v='!=';}return v;}
    if(k.type==='id'&&this.mode!=='cpp'&&PSEUDO_WORDS[k.value])return PSEUDO_WORDS[k.value];
    return null;
  }
  expr(min=0){
    let left=this.unary();
    for(;;){
      const k=this.peek();const op=this.opOf(k);if(!op)break;
      if(this.mode==='cpp'&&ASSIGN[op]&&min<=1){
        this.next();if(left.k!=='var')throw new CompileError('el lado izquierdo de una asignación debe ser una variable',k.line);
        left={k:'assign',op,target:left.name,e:this.expr(1),line:k.line};continue;
      }
      if(this.mode==='cpp'&&op==='?'&&min<=1){this.next();const a=this.expr(1);this.expect(':');const b=this.expr(1);left={k:'tern',c:left,a,b,line:k.line};continue;}
      if(this.mode==='cpp'&&op==='^')throw new CompileError("en C++ '^' no es potencia: use pow(base, exponente) con #include <cmath>",k.line);
      if(this.mode==='cpp'&&op==='='&&min>1)throw new CompileError("'=' asigna; para comparar use '=='",k.line);
      const pr=BIN[op];if(pr===undefined||pr<min)break;
      this.next();const r=this.expr(op==='^'?pr:pr+1);left={k:'bin',op,l:left,r,line:k.line};
    }
    return left;
  }
  unary(){
    const k=this.peek();
    if(k.type==='op'&&(k.value==='!'||k.value==='-'||k.value==='+')){this.next();return {k:'un',op:k.value,e:this.unary(),line:k.line};}
    if(k.type==='id'&&this.mode!=='cpp'&&/^(NO|no|NOT|not)$/.test(k.value)){this.next();return {k:'un',op:'!',e:this.unary(),line:k.line};}
    if(this.mode==='cpp'&&k.type==='op'&&(k.value==='++'||k.value==='--')){
      this.next();const t=this.unary();if(t.k!=='var')throw new CompileError(`'${k.value}' solo se aplica a variables`,k.line);
      return {k:'inc',op:k.value,pre:true,target:t.name,line:k.line};
    }
    let e=this.primary();
    while(this.mode==='cpp'&&(this.is('++')||this.is('--'))){const o=this.next();if(e.k!=='var')throw new CompileError(`'${o.value}' solo se aplica a variables`,o.line);e={k:'inc',op:o.value,pre:false,target:e.name,line:o.line};}
    return e;
  }
  primary(){
    const k=this.next();
    if(k.type==='num')return {k:'num',t:(this.mode==='cpp'&&!k.isF&&Number.isInteger(k.value))?'int':'double',v:k.value,line:k.line};
    if(k.type==='str')return {k:'str',v:k.value,line:k.line};
    if(k.type==='chr')return {k:'chr',v:k.value,line:k.line};
    if(k.type==='id'){
      let name=k.value;
      if(this.mode==='cpp'&&name==='std'&&this.is('::')){this.next();name=this.next().value;}
      if(this.mode==='cpp'&&(name==='true'||name==='false'))return {k:'bool',v:name==='true',line:k.line};
      if(this.mode!=='cpp'&&/^(verdadero|falso)$/i.test(name))return {k:'bool',v:/^v/i.test(name),line:k.line};
      if(this.mode==='cpp'&&(name==='cout'||name==='cin'||name==='endl'))throw new CompileError(`'${name}' no puede usarse dentro de una expresión`,k.line);
      if(this.is('(')){
        this.next();const args=[];
        if(!this.is(')')){do{args.push(this.expr(1));}while(this.accept(','));}
        this.expect(')',`se esperaba ')' para cerrar la llamada a ${name}()`);
        if(this.mode!=='cpp'){const f=PSEUDO_FN[name.toLowerCase()];if(!f)throw new CompileError(`función desconocida '${name}'. Disponibles: raiz, abs, redondear, truncar, potencia`,k.line);name=f;}
        return {k:'call',name,args,line:k.line};
      }
      if(this.mode==='cpp'&&CPP_KW.has(name))throw new CompileError(`no se esperaba la palabra reservada '${name}' aquí`,k.line);
      return {k:'var',name,line:k.line};
    }
    if(k.type==='op'&&k.value==='('){
      if(this.mode==='cpp'&&this.peek().type==='id'&&TYPEWORDS[this.peek().value]&&this.is(')',1)){const t=TYPEWORDS[this.next().value];this.next();return {k:'cast',t,e:this.unary(),line:k.line};}
      const e=this.expr(0);this.expect(')',`falta ')' para cerrar el paréntesis`);return e;
    }
    throw new CompileError(`expresión incompleta o inválida: no se esperaba ${desc(k)}`,k.line);
  }
  end(){if(this.peek().type!=='eof')throw new CompileError(`sobra ${desc(this.peek())} al final de la expresión`,this.peek().line);}
  // ---------- programa C++ ----------
  program(){
    const prog={includes:[],usingStd:false,main:null};
    for(;;){
      const k=this.peek();
      if(k.type==='pre'){
        this.next();const m=k.value.match(/^#\s*include\s*<\s*([\w.]+)\s*>$/)||k.value.match(/^#\s*include\s*"\s*([\w.]+)\s*"$/);
        if(m){prog.includes.push(m[1]);if(/\.h$/.test(m[1])&&m[1]!=='math.h')throw new CompileError(`'${m[1]}': esa librería no existe en C++ moderno; use <${m[1].replace('.h','')}>`,k.line);continue;}
        if(/^#\s*include/.test(k.value))throw new CompileError('directiva #include mal escrita. Ejemplo: #include <iostream>',k.line);
        throw new CompileError(`directiva '${k.value.split(/\s/)[0]}' no soportada en este simulador`,k.line);
      }
      if(k.type==='eof')break;
      if(this.is('using')){this.next();this.expect('namespace',"se esperaba 'namespace' después de 'using'");this.expect('std',"se esperaba 'std'");this.semi();prog.usingStd=true;continue;}
      if(k.type==='id'&&(TYPEWORDS[k.value]||k.value==='void')&&this.peek(1).type==='id'){
        const nm=this.peek(1);
        if(nm.value==='main'){
          if(k.value!=='int')throw new CompileError("'main' debe retornar 'int': escriba int main()",k.line);
          if(prog.main)throw new CompileError("redefinición de 'int main()'",k.line);
          this.next();this.next();this.expect('(');this.accept('void');this.expect(')',"main() no recibe parámetros en este simulador");
          if(!this.is('{'))throw new CompileError("se esperaba '{' para abrir el cuerpo de main()",this.peek().line);
          prog.main=this.block();continue;
        }
        if(this.is('(',2))throw new CompileError(`este simulador trabaja con un solo bloque: escriba su código dentro de int main() (función '${nm.value}' no soportada)`,k.line);
        throw new CompileError('las variables deben declararse dentro de int main()',k.line);
      }
      if(this.is('main'))throw new CompileError("falta el tipo de retorno: escriba int main()",k.line);
      throw new CompileError(`no se esperaba ${desc(k)} fuera de main()`,k.line);
    }
    if(!prog.main)throw new CompileError("no se encontró la función principal 'int main()'",this.peek().line);
    return prog;
  }
  block(){
    const o=this.expect('{');const body=[];
    while(!this.is('}')){
      if(this.peek().type==='eof')throw new CompileError("se esperaba '}' al final del código: falta cerrar una llave '{' ",o.line);
      body.push(this.stmt());
    }
    this.next();return {k:'block',body,line:o.line};
  }
  isStream(name){return this.is(name)||(this.is('std')&&this.is('::',1)&&this.is(name,2));}
  takeStream(){if(this.is('std')){this.next();this.next();this.next();return true;}this.next();return false;}
  decl(){
    const k=this.peek();let isConst=false;
    if(this.accept('const'))isConst=true;
    let qualified=false;
    if(this.is('std')&&this.is('::',1)){this.next();this.next();qualified=true;}
    const tw=this.next();let t=TYPEWORDS[tw.value];
    if(!t)throw new CompileError(`tipo de dato desconocido '${tw.value}'`,tw.line);
    while(this.peek().type==='id'&&TYPEWORDS[this.peek().value]&&TYPEWORDS[this.peek().value]==='int'&&t==='int')this.next();
    const vars=[];
    do{
      const nm=this.next();
      if(nm.type!=='id'||CPP_KW.has(nm.value))throw new CompileError(`se esperaba un nombre de variable después de '${tw.value}' (encontrado ${desc(nm)})`,nm.line);
      if(this.is('['))throw new CompileError('los arreglos no están incluidos en este simulador básico',nm.line);
      let init=null;
      if(this.accept('='))init=this.expr(1);
      else if(this.is('{')){this.next();init=this.expr(1);this.expect('}');}
      else if(this.is('(')&&!this.is(')',1)){this.next();init=this.expr(1);this.expect(')');}
      if(isConst&&!init)throw new CompileError(`la constante '${nm.value}' debe inicializarse`,nm.line);
      vars.push({name:nm.value,init,line:nm.line});
    }while(this.accept(','));
    return {k:'decl',t,isConst,qualified,stringWord:tw.value==='string',vars,line:k.line};
  }
  isDecl(){return this.peek().type==='id'&&(TYPEWORDS[this.peek().value]||this.is('const')||(this.is('std')&&this.is('::',1)&&this.is('string',2)));}
  stmt(){
    const k=this.peek();
    if(this.is('{'))return this.block();
    if(this.is(';')){this.next();return {k:'empty',line:k.line};}
    if(this.isDecl()){const d=this.decl();this.semi();return d;}
    if(this.is('if')){this.next();this.expect('(',"se esperaba '(' después de if");const c=this.expr(0);this.expect(')',"falta ')' para cerrar la condición del if");if(this.is(';'))throw new CompileError("hay un ';' justo después del if: el bloque quedaría vacío",this.peek().line);const a=this.stmt();let b=null;if(this.accept('else'))b=this.stmt();return {k:'if',c,a,b,line:k.line};}
    if(this.is('else'))throw new CompileError("'else' sin un 'if' previo (revise llaves y puntos y coma)",k.line);
    if(this.is('while')){this.next();this.expect('(',"se esperaba '(' después de while");const c=this.expr(0);this.expect(')',"falta ')' para cerrar la condición del while");if(this.is(';'))throw new CompileError("hay un ';' justo después del while: generaría un ciclo vacío",this.peek().line);return {k:'while',c,body:this.stmt(),line:k.line};}
    if(this.is('do')){this.next();const body=this.stmt();this.expect('while',"se esperaba 'while' al final del do");this.expect('(');const c=this.expr(0);this.expect(')');this.semi();return {k:'do',c,body,line:k.line};}
    if(this.is('for')){
      this.next();this.expect('(',"se esperaba '(' después de for");
      let init=null;if(!this.is(';')){init=this.isDecl()?this.decl():{k:'expr',e:this.expr(0),line:k.line};}
      this.expect(';',"el for necesita ';' entre sus tres partes: for(inicio; condición; incremento)");
      let c=null;if(!this.is(';'))c=this.expr(0);
      this.expect(';',"el for necesita ';' entre sus tres partes: for(inicio; condición; incremento)");
      let up=null;if(!this.is(')'))up=this.expr(0);
      this.expect(')',"falta ')' para cerrar el for");
      if(this.is(';'))throw new CompileError("hay un ';' justo después del for: generaría un ciclo vacío",this.peek().line);
      return {k:'for',init,c,up,body:this.stmt(),line:k.line};
    }
    if(this.is('switch')){
      this.next();this.expect('(');const e=this.expr(0);this.expect(')');const o=this.expect('{',"se esperaba '{' después del switch");
      const cases=[],body=[];let def=-1;
      while(!this.is('}')){
        if(this.peek().type==='eof')throw new CompileError("falta '}' para cerrar el switch",o.line);
        if(this.is('case')){const c=this.next();const v=this.expr(2);this.expect(':',"se esperaba ':' después del valor del case");cases.push({v,idx:body.length,line:c.line});continue;}
        if(this.is('default')){this.next();this.expect(':');def=body.length;continue;}
        body.push(this.stmt());
      }
      this.next();return {k:'switch',e,cases,def,body,line:k.line};
    }
    if(this.is('break')||this.is('continue')){this.next();this.semi();return {k:k.value,line:k.line};}
    if(this.is('return')){this.next();let e=null;if(!this.is(';'))e=this.expr(0);this.semi();return {k:'return',e,line:k.line};}
    if(this.isStream('cout')){
      const q=this.takeStream();const items=[];
      if(this.is('>>'))throw new CompileError("cout usa '<<' para mostrar datos (cin usa '>>')",k.line);
      while(this.accept('<<')){
        if(this.isStream('endl')){const eq=this.takeStream();items.push({endl:true,q:eq});}
        else items.push({e:this.expr(6)});
      }
      if(!items.length)throw new CompileError("se esperaba '<<' después de cout",k.line);
      if(this.is('>>'))throw new CompileError("no mezcle '>>' con cout",this.peek().line);
      this.semi();return {k:'cout',items,q,line:k.line};
    }
    if(this.isStream('cin')){
      const q=this.takeStream();
      if(this.accept('.')){const m=this.next();if(m.value!=='ignore')throw new CompileError(`cin.${m.value}() no está soportado (use cin >> variable)`,m.line);this.expect('(');const args=[];if(!this.is(')')){do{args.push(this.expr(1));}while(this.accept(','));}this.expect(')');this.semi();return {k:'ignore',all:args.length>0,q,line:k.line};}
      if(this.is('<<'))throw new CompileError("cin usa '>>' para leer datos (cout usa '<<')",k.line);
      const targets=[];
      while(this.accept('>>')){const v=this.next();if(v.type!=='id'||CPP_KW.has(v.value))throw new CompileError(`cin >> necesita una variable (encontrado ${desc(v)})`,v.line);if(v.value==='endl')throw new CompileError('endl no se usa con cin',v.line);targets.push({name:v.value,line:v.line});}
      if(!targets.length)throw new CompileError("se esperaba '>>' después de cin",k.line);
      this.semi();return {k:'cin',targets,q,line:k.line};
    }
    if(this.is('getline')){this.next();this.expect('(');if(!this.isStream('cin'))throw new CompileError('use getline(cin, variable)',k.line);const q=this.takeStream();this.expect(',');const v=this.next();this.expect(')');this.semi();return {k:'getline',name:v.value,q,line:k.line};}
    const e=this.expr(0);this.semi();return {k:'expr',e,line:k.line};
  }
}

/* ---------- valores ---------- */
const V=(t,v)=>({t,v});
const isNumT=t=>t==='int'||t==='double'||t==='char'||t==='bool';
const nv=x=>x.t==='bool'?(x.v?1:0):x.v;
function fmtDouble(d){
  if(Number.isNaN(d))return 'nan';if(!isFinite(d))return d<0?'-inf':'inf';
  if(d===0)return '0';
  let s=d.toPrecision(6);
  if(s.includes('e')){let [m,e]=s.split('e');if(m.includes('.'))m=m.replace(/0+$/,'').replace(/\.$/,'');const sg=e[0]==='-'?'-':'+';e=e.replace(/[+-]/,'');return m+'e'+sg+e.padStart(2,'0');}
  if(s.includes('.'))s=s.replace(/0+$/,'').replace(/\.$/,'');return s;
}
function fmtP(d){if(!isFinite(d))return String(d);if(Number.isInteger(d))return String(d);return String(parseFloat(d.toFixed(6)));}
function fmt(x,mode){
  if(x.t==='string')return x.v;
  if(x.t==='char')return String.fromCharCode(x.v);
  if(x.t==='bool')return mode==='cpp'?(x.v?'1':'0'):(x.v?'Verdadero':'Falso');
  if(x.t==='int')return String(x.v);
  return mode==='cpp'?fmtDouble(x.v):fmtP(x.v);
}
const toI32=x=>{x=Math.trunc(x);return Number.isFinite(x)?(x|0):0;};
function convert(t,x,line,mode){
  if(t==='string'){if(x.t==='string')return x;if(x.t==='char')return V('string',String.fromCharCode(x.v));throw new RunError(`no se puede asignar un valor numérico a una variable string`,line);}
  if(x.t==='string')throw new RunError(`no se puede convertir un texto (string) a ${t}`,line);
  const n=nv(x);
  if(t==='int')return V('int',toI32(n));
  if(t==='double')return V('double',n);
  if(t==='char')return V('char',toI32(n)&255);
  if(t==='bool')return V('bool',n!==0);
  return x;
}
function truthy(x,line,mode){
  if(x.t==='string'){if(mode==='cpp')throw new RunError('un string no puede usarse como condición',line);return x.v!=='';}
  return nv(x)!==0;
}
function binop(op,a,b,line,mode){
  if(a.t==='string'||b.t==='string'){
    const s=x=>x.t==='string'?x.v:x.t==='char'?String.fromCharCode(x.v):(mode==='cpp'?null:fmt(x,mode));
    if(op==='+'){const l=s(a),r=s(b);if(l===null||r===null)throw new RunError("no se puede sumar un string con un número: muestre ambos con cout << texto << número",line);return V('string',l+r);}
    if(['==','!=','<','>','<=','>='].includes(op)){
      if(mode==='cpp'&&(a.t!=='string'||b.t!=='string')&&!(a.t==='char'||b.t==='char'))throw new RunError('no se puede comparar un string con un número',line);
      const l=s(a),r=s(b);const res={'==':l===r,'!=':l!==r,'<':l<r,'>':l>r,'<=':l<=r,'>=':l>=r}[op];return V('bool',res);
    }
    throw new RunError(`operador '${op}' no válido para textos`,line);
  }
  const x=nv(a),y=nv(b);const isD=mode!=='cpp'||a.t==='double'||b.t==='double';
  let r;
  switch(op){
    case '+':r=x+y;break;case '-':r=x-y;break;case '*':r=x*y;break;
    case '/':if(!isD){if(y===0)throw new RunError('división entera entre cero',line);r=Math.trunc(x/y);}else{if(y===0&&mode!=='cpp')throw new RunError('división entre cero',line);r=x/y;}break;
    case '%':if(mode==='cpp'&&isD)throw new RunError("el operador % solo funciona con enteros (int)",line);if(y===0)throw new RunError('residuo (%) entre cero',line);r=x%y;break;
    case '^':r=Math.pow(x,y);break;
    case '==':return V('bool',x===y);case '!=':return V('bool',x!==y);case '<':return V('bool',x<y);case '>':return V('bool',x>y);case '<=':return V('bool',x<=y);case '>=':return V('bool',x>=y);
    default:throw new RunError(`operador '${op}' no soportado`,line);
  }
  return isD?V('double',r):V('int',toI32(r));
}
function callMath(name,args,line,mode){
  const need=MATH[name];if(args.length!==need)throw new RunError(`${name}() recibe ${need} argumento(s)`,line);
  const xs=args.map(a=>{if(a.t==='string')throw new RunError(`${name}() necesita números`,line);return nv(a);});
  const f={fmod:(a,b)=>a%b,sqrt:Math.sqrt,pow:Math.pow,abs:Math.abs,fabs:Math.abs,round:Math.round,floor:Math.floor,ceil:Math.ceil,trunc:Math.trunc}[name];
  if(name==='sqrt'&&xs[0]<0&&mode!=='cpp')throw new RunError('raíz de un número negativo',line);
  if(name==='round')return V('double',Math.sign(xs[0])*Math.round(Math.abs(xs[0])));
  if(name==='abs'&&mode==='cpp'&&args[0].t==='int')return V('int',Math.abs(xs[0]));
  return V('double',f(...xs));
}

/* ---------- entorno ---------- */
class Env{
  constructor(){this.sc=[new Map()];}
  push(){this.sc.push(new Map());}pop(){this.sc.pop();}
  find(n){for(let i=this.sc.length-1;i>=0;i--){const v=this.sc[i].get(n);if(v)return v;}return null;}
  declare(n,cell){this.sc[this.sc.length-1].set(n,cell);}
  snapshot(){const o=[];const seen=new Set();for(let i=this.sc.length-1;i>=0;i--)for(const [k,c] of this.sc[i]){if(seen.has(k))continue;seen.add(k);o.push({name:k,...c});}return o.reverse();}
}

function makeEval(env,ctx,mode){
  const get=(name,line)=>{
    const c=env.find(name);
    if(!c){if(mode==='cpp')throw new RunError(`'${name}' no fue declarada`,line);throw new RunError(`la variable '${name}' se usa antes de tener un valor (léala con Entrada o asígnela en un Proceso)`,line);}
    if(!c.init){if(!c.warned){c.warned=true;ctx.warn(`advertencia: '${name}' se usa sin inicializar (su valor es impredecible; aquí se toma 0)`,line);}return V(c.t,c.t==='string'?'':0);}
    return V(c.t,c.v);
  };
  const set=(name,val,line)=>{
    const c=env.find(name);
    if(mode!=='cpp'){if(c){c.t=val.t;c.v=val.v;c.init=true;}else env.declare(name,{t:val.t,v:val.v,init:true});return val;}
    if(!c)throw new RunError(`'${name}' no fue declarada`,line);
    if(c.isConst)throw new RunError(`'${name}' es constante y no se puede modificar`,line);
    const cv=convert(c.t,val,line,mode);c.v=cv.v;c.init=true;return cv;
  };
  function ev(e){
    switch(e.k){
      case 'num':return V(e.t,e.v);case 'str':return V('string',e.v);case 'chr':return V('char',e.v);case 'bool':return V('bool',e.v);
      case 'var':return get(e.name,e.line);
      case 'un':{const x=ev(e.e);if(e.op==='!')return V('bool',!truthy(x,e.line,mode));if(x.t==='string')throw new RunError(`'${e.op}' no aplica a textos`,e.line);if(e.op==='-'){return x.t==='double'?V('double',-x.v):V(mode==='cpp'?'int':'double',-nv(x));}return x;}
      case 'bin':{
        if(e.op==='&&'){return V('bool',truthy(ev(e.l),e.line,mode)&&truthy(ev(e.r),e.line,mode));}
        if(e.op==='||'){return V('bool',truthy(ev(e.l),e.line,mode)||truthy(ev(e.r),e.line,mode));}
        return binop(e.op,ev(e.l),ev(e.r),e.line,mode);
      }
      case 'tern':return truthy(ev(e.c),e.line,mode)?ev(e.a):ev(e.b);
      case 'assign':{let r=ev(e.e);if(e.op!=='='){r=binop(e.op[0],get(e.target,e.line),r,e.line,mode);}return set(e.target,r,e.line);}
      case 'inc':{const old=get(e.target,e.line);if(old.t==='string')throw new RunError(`'${e.op}' no aplica a textos`,e.line);const nw=binop(e.op[0],old,V('int',1),e.line,mode);const r=set(e.target,nw,e.line);return e.pre?r:old;}
      case 'call':return callMath(e.name,e.args.map(ev),e.line,mode);
      case 'cast':return convert(e.t,ev(e.e),e.line,mode);
    }
    throw new RunError('expresión no soportada',e.line);
  }
  return {ev,get,set};
}

/* ---------- análisis semántico C++ ("compilación") ---------- */
function compileCpp(src){
  const errors=[],warnings=[];let prog=null;
  try{const toks=lex(src,'cpp');prog=new Parser(toks,'cpp').program();}
  catch(e){if(e instanceof CompileError){errors.push({line:e.line,msg:e.message});return {errors,warnings,prog:null};}throw e;}
  const inc=h=>prog.includes.includes(h);
  const E=(line,msg)=>{if(!errors.some(x=>x.line===line&&x.msg===msg))errors.push({line,msg});};
  const W=(line,msg)=>{if(!warnings.some(x=>x.line===line&&x.msg===msg))warnings.push({line,msg});};
  const scopes=[new Map()];let loopDepth=0,switchDepth=0;
  const look=n=>{for(let i=scopes.length-1;i>=0;i--)if(scopes[i].has(n))return scopes[i].get(n);return null;};
  const needStd=(q,name,line)=>{if(!q&&!prog.usingStd)E(line,`'${name}' no fue declarado en este ámbito: agregue 'using namespace std;' o escriba std::${name}`);};
  if(!inc('iostream')){ /* se valida al usar cout/cin */ }
  function ty(e){
    switch(e.k){
      case 'num':return e.t;case 'str':return 'cstr';case 'chr':return 'char';case 'bool':return 'bool';
      case 'var':{const d=look(e.name);if(!d){E(e.line,`'${e.name}' no fue declarada en este ámbito`+(/^[a-z]+$/i.test(e.name)?` (¿olvidó declararla, por ejemplo: int ${e.name};?)`:''));return 'unk';}return d.t;}
      case 'un':{const t=ty(e.e);if(e.op==='!')return 'bool';if(t==='string'||t==='cstr')E(e.line,`operador '${e.op}' inválido para textos`);return t==='double'?'double':'int';}
      case 'bin':{
        const a=ty(e.l),b=ty(e.r);const sa=a==='string'||a==='cstr',sb=b==='string'||b==='cstr';
        if(['&&','||','==','!=','<','>','<=','>='].includes(e.op)){if((sa&&!sb&&b!=='char'&&b!=='unk')||(sb&&!sa&&a!=='char'&&a!=='unk'))E(e.line,'no se puede comparar un texto con un número');if(a==='cstr'&&b==='cstr')W(e.line,'comparar dos literales de texto no compara su contenido');return 'bool';}
        if(sa||sb){if(e.op!=='+')E(e.line,`operador '${e.op}' inválido para textos`);else if(a==='cstr'&&b==='cstr')E(e.line,'no se pueden sumar dos literales "..." directamente; use cout << "a" << "b"');else if((sa&&!['string','cstr','char','unk'].includes(b))||(sb&&!['string','cstr','char','unk'].includes(a)))E(e.line,'no se puede sumar un texto con un número: muéstrelos por separado con <<');return 'string';}
        if(e.op==='%'&&(a==='double'||b==='double'))E(e.line,"operandos inválidos para %: el residuo solo funciona con int");
        return (a==='double'||b==='double')?'double':'int';
      }
      case 'tern':ty(e.c);{const a=ty(e.a);ty(e.b);return a;}
      case 'assign':{const d=look(e.target);const r=ty(e.e);if(!d){E(e.line,`'${e.target}' no fue declarada en este ámbito`);return 'unk';}if(d.isConst)E(e.line,`asignación a la constante '${e.target}' (de solo lectura)`);compat(d.t,r,e.line);return d.t;}
      case 'inc':{const d=look(e.target);if(!d){E(e.line,`'${e.target}' no fue declarada en este ámbito`);return 'unk';}if(d.isConst)E(e.line,`no se puede modificar la constante '${e.target}'`);if(d.t==='string')E(e.line,`'${e.op}' no aplica a string`);return d.t;}
      case 'call':{e.args.forEach(ty);if(!(e.name in MATH)){E(e.line,`'${e.name}' no fue declarada en este ámbito (función no disponible)`);return 'unk';}if(e.name!=='abs'&&!inc('cmath')&&!inc('math.h'))E(e.line,`'${e.name}' no fue declarada: agregue #include <cmath>`);if(e.args.length!==MATH[e.name])E(e.line,`${e.name}() recibe ${MATH[e.name]} argumento(s)`);return 'double';}
      case 'cast':ty(e.e);return e.t;
    }
    return 'unk';
  }
  function compat(t,r,line){
    if(r==='unk')return;
    const rs=r==='string'||r==='cstr';
    if(t==='string'&&!rs&&r!=='char')E(line,`no se puede convertir '${r}' a 'string'`);
    if(t!=='string'&&rs)E(line,`no se puede convertir un texto a '${t}'`+(t==='char'?" (un char va entre comillas simples: 'a')":''));
    if(t==='int'&&r==='double')W(line,'conversión de double a int: se pierden los decimales');
  }
  function st(s){
    if(!s)return;
    switch(s.k){
      case 'block':scopes.push(new Map());s.body.forEach(st);scopes.pop();break;
      case 'decl':
        if(s.t==='string'){needStd(s.qualified,'string',s.line);}
        for(const v of s.vars){if(v.init)compat(s.t,ty(v.init),v.line);if(scopes[scopes.length-1].has(v.name))E(v.line,`redeclaración de '${v.name}' (ya fue declarada antes)`);scopes[scopes.length-1].set(v.name,{t:s.t,isConst:s.isConst});}
        break;
      case 'expr':{const t=ty(s.e);if(!['assign','inc','call'].includes(s.e.k))W(s.line,'esta instrucción no tiene ningún efecto'+(s.e.k==='bin'&&s.e.op==='=='?" (¿quiso asignar con '='?)":''));break;}
      case 'if':ty(s.c);if(s.c.k==='assign'&&s.c.op==='=')W(s.line,"hay una asignación '=' dentro del if; para comparar use '=='");st(s.a);st(s.b);break;
      case 'while':case 'do':ty(s.c);if(s.c.k==='assign'&&s.c.op==='=')W(s.line,"asignación '=' usada como condición; ¿quiso '=='?");loopDepth++;st(s.body);loopDepth--;break;
      case 'for':scopes.push(new Map());if(s.init){if(s.init.k==='decl')st(s.init);else ty(s.init.e);}if(s.c)ty(s.c);if(s.up)ty(s.up);loopDepth++;st(s.body);loopDepth--;scopes.pop();break;
      case 'switch':{const t=ty(s.e);if(t==='string'||t==='double')E(s.line,`switch solo acepta enteros o char (no ${t})`);const seen=new Set();for(const c of s.cases){if(!['num','chr','un'].includes(c.v.k))E(c.line,'el valor de un case debe ser una constante (número o carácter)');const key=JSON.stringify(c.v);if(seen.has(key))E(c.line,'valor de case duplicado');seen.add(key);}switchDepth++;scopes.push(new Map());s.body.forEach(st);scopes.pop();switchDepth--;break;}
      case 'break':if(!loopDepth&&!switchDepth)E(s.line,"'break' solo puede usarse dentro de un ciclo o un switch");break;
      case 'continue':if(!loopDepth)E(s.line,"'continue' solo puede usarse dentro de un ciclo");break;
      case 'return':if(s.e)ty(s.e);break;
      case 'cout':if(!inc('iostream'))E(s.line,"'cout' no fue declarado: agregue #include <iostream>");needStd(s.q,'cout',s.line);for(const it of s.items){if(it.endl)needStd(it.q,'endl',s.line);else ty(it.e);}break;
      case 'cin':case 'ignore':case 'getline':
        if(!inc('iostream'))E(s.line,"'cin' no fue declarado: agregue #include <iostream>");needStd(s.q,'cin',s.line);
        if(s.k==='cin')for(const t of s.targets){const d=look(t.name);if(!d)E(t.line,`'${t.name}' no fue declarada en este ámbito: declárela antes de leerla`);else if(d.isConst)E(t.line,`no se puede leer en la constante '${t.name}'`);}
        if(s.k==='getline'){const d=look(s.name);if(!d)E(s.line,`'${s.name}' no fue declarada`);else if(d.t!=='string')E(s.line,'getline solo lee en variables string');}
        break;
    }
  }
  st(prog.main);
  const last=prog.main.body[prog.main.body.length-1];
  if(!last||last.k!=='return')W(prog.main.line,"main() no termina con 'return 0;' (es buena práctica incluirlo)");
  if(prog.main.body.some(s=>s.k==='decl'&&s.t==='string')&&!inc('string'))W(prog.main.line,'usa string: se recomienda agregar #include <string>');
  errors.sort((a,b)=>a.line-b.line);warnings.sort((a,b)=>a.line-b.line);
  return {errors,warnings,prog};
}

/* ---------- ejecución C++ (generador: pausa para cin) ---------- */
const STEP_LIMIT=300000;
function* runCpp(prog,io){
  const env=new Env();const mode='cpp';
  const ctx={steps:0,warn:(m,l)=>io.warn(m,l)};
  const {ev,set}=makeEval(env,ctx,mode);
  const tick=line=>{if(++ctx.steps>STEP_LIMIT)throw new RunError('se superó el límite de ejecución: posible ciclo infinito (revise que la condición del ciclo llegue a ser falsa)',line);};
  function* fill(){while(/^\s*$/.test(io.buf)){const r=yield {need:'input'};if(r===false)throw new RunError('el programa esperaba más datos de entrada',0);}}
  function* readTok(){yield* fill();io.buf=io.buf.replace(/^\s+/,'');const m=io.buf.match(/^\S+/);const t=m[0];io.buf=io.buf.slice(t.length);return t;}
  function* exec(s){
    tick(s.line);
    switch(s.k){
      case 'block':env.push();try{for(const x of s.body){const r=yield* exec(x);if(r)return r;}}finally{env.pop();}return null;
      case 'empty':return null;
      case 'decl':for(const v of s.vars){let val=null;if(v.init)val=convert(s.t,ev(v.init),v.line,mode);env.declare(v.name,{t:s.t,v:val?val.v:(s.t==='string'?'':0),init:!!v.init||s.t==='string',isConst:s.isConst});}return null;
      case 'expr':ev(s.e);return null;
      case 'if':if(truthy(ev(s.c),s.line,mode))return yield* exec(s.a);if(s.b)return yield* exec(s.b);return null;
      case 'while':while(truthy(ev(s.c),s.line,mode)){tick(s.line);const r=yield* exec(s.body);if(r){if(r.sig==='break')break;if(r.sig==='continue')continue;return r;}}return null;
      case 'do':do{tick(s.line);const r=yield* exec(s.body);if(r){if(r.sig==='break')break;if(r.sig==='continue')continue;return r;}}while(truthy(ev(s.c),s.line,mode));return null;
      case 'for':env.push();try{if(s.init){if(s.init.k==='decl')yield* exec(s.init);else ev(s.init.e);}
        for(;;){if(s.c&&!truthy(ev(s.c),s.line,mode))break;tick(s.line);const r=yield* exec(s.body);if(r){if(r.sig==='break')break;if(r.sig!=='continue')return r;}if(s.up)ev(s.up);}}finally{env.pop();}return null;
      case 'switch':{const v=nv(ev(s.e));let idx=-1;for(const c of s.cases){if(nv(ev(c.v))===v){idx=c.idx;break;}}if(idx<0)idx=s.def;if(idx<0)return null;env.push();try{for(let i=idx;i<s.body.length;i++){const r=yield* exec(s.body[i]);if(r){if(r.sig==='break')break;return r;}}}finally{env.pop();}return null;}
      case 'break':return {sig:'break'};case 'continue':return {sig:'continue'};
      case 'return':return {sig:'return',v:s.e?ev(s.e):V('int',0)};
      case 'cout':for(const it of s.items)io.out(it.endl?'\n':fmt(ev(it.e),mode));return null;
      case 'cin':for(const t of s.targets){
          const c=env.find(t.name);
          if(c.t==='char'){yield* fill();io.buf=io.buf.replace(/^\s+/,'');set(t.name,V('char',io.buf.charCodeAt(0)),t.line);io.buf=io.buf.slice(1);io.echoTok&&io.echoTok();continue;}
          const tok=yield* readTok();
          if(c.t==='string'){set(t.name,V('string',tok),t.line);continue;}
          if(c.t==='int'||c.t==='bool'){const m=tok.match(/^[+-]?\d+/);if(!m){io.warn(`la entrada '${tok}' no es un número entero válido para '${t.name}' (cin falla y la variable queda en 0)`,t.line);set(t.name,V('int',0),t.line);continue;}if(m[0].length<tok.length){io.buf=tok.slice(m[0].length)+io.buf;}set(t.name,V('int',parseInt(m[0],10)),t.line);continue;}
          const m=tok.replace(',','.').match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
          if(!m){io.warn(`la entrada '${tok}' no es un número válido para '${t.name}' (cin falla y la variable queda en 0)`,t.line);set(t.name,V('double',0),t.line);continue;}
          if(tok.includes(','))io.warn('use punto decimal (3.5), no coma (3,5)',t.line);
          set(t.name,V('double',parseFloat(m[0])),t.line);
        }return null;
      case 'ignore':if(s.all){const k=io.buf.indexOf('\n');io.buf=k<0?'':io.buf.slice(k+1);}else io.buf=io.buf.slice(1);return null;
      case 'getline':{while(!io.buf.includes('\n')){const r=yield {need:'input'};if(r===false)throw new RunError('el programa esperaba más datos de entrada',s.line);}const k=io.buf.indexOf('\n');set(s.name,V('string',io.buf.slice(0,k)),s.line);io.buf=io.buf.slice(k+1);return null;}
    }
    throw new RunError('instrucción no soportada',s.line);
  }
  env.push();let r=null;
  for(const x of prog.main.body){r=yield* exec(x);if(r)break;}
  return {code:r&&r.sig==='return'?nv(r.v):0,vars:env.snapshot()};
}

/* ---------- diagramas de flujo: compilación y ejecución ---------- */
function parsePseudo(text,what){
  const toks=lex(text,'pseudo');const p=new Parser(toks,'pseudo');
  if(toks[0].type==='eof')throw new CompileError(`${what} está vacío`,0);
  const e=p.expr(0);p.end();return e;
}
function parsePseudoList(text){
  const toks=lex(text,'pseudo');const p=new Parser(toks,'pseudo');const list=[];
  if(toks[0].type==='eof')throw new CompileError('escriba qué desea mostrar, por ejemplo: "Resultado: ", suma',0);
  do{list.push(p.expr(0));}while(p.accept(','));p.end();return list;
}
const ID_RE=/^[A-Za-z_áéíóúÁÉÍÓÚñÑ][A-Za-z0-9_áéíóúÁÉÍÓÚñÑ]*$/;
const RESERVED_P=/^(Y|O|NO|AND|OR|NOT|mod|MOD|verdadero|falso)$/i;
function compileBlock(b){
  const fail=m=>{const e=new CompileError(m,0);e.block=b.id;throw e;};
  try{
    switch(b.type){
      case 'proceso':{
        const lines=b.text.split(/\n|;/).map(s=>s.trim()).filter(Boolean);
        if(!lines.length)fail('el bloque de proceso está vacío');
        b._c=lines.map(l=>{const m=l.match(/^([A-Za-z_áéíóúÁÉÍÓÚñÑ][\wáéíóúÁÉÍÓÚñÑ]*)\s*(<-|←|:=|=)\s*(.+)$/);
          if(!m)fail(`"${l}" no es una asignación. Use la forma variable = expresión (ej.: suma = a + b)`);
          if(RESERVED_P.test(m[1]))fail(`'${m[1]}' es palabra reservada, use otro nombre`);
          return {target:m[1],e:parsePseudo(m[3],'la expresión')};});break;}
      case 'entrada':{const vs=b.text.split(',').map(s=>s.trim()).filter(Boolean);if(!vs.length)fail('indique qué variable(s) leer, ej.: a, b');for(const v of vs){if(!ID_RE.test(v))fail(`'${v}' no es un nombre de variable válido (sin espacios ni símbolos)`);if(RESERVED_P.test(v))fail(`'${v}' es palabra reservada`);}b._c=vs;break;}
      case 'salida':b._c=parsePseudoList(b.text);break;
      case 'decision':case 'mientras':b._c=parsePseudo(b.text,'la condición');break;
      case 'para':if(!ID_RE.test((b.v||'').trim()))fail('el ciclo Para necesita una variable contadora válida (ej.: i)');b._c={v:b.v.trim(),a:parsePseudo(b.from,'el valor inicial'),z:parsePseudo(b.to,'el valor final'),s:parsePseudo(b.step||'1','el incremento')};break;
    }
  }catch(e){if(e instanceof CompileError&&!e.block){e.block=b.id;e.message=e.message;}throw e;}
  for(const k of ['yes','no','body'])if(b[k])b[k].forEach(compileBlock);
}
function* runFlow(blocks,io){
  const env=new Env();const mode='pseudo';const ctx={steps:0,warn:()=>{}};
  const {ev,set}=makeEval(env,ctx,mode);
  const tick=()=>{if(++ctx.steps>20000)throw new RunError('se superó el límite de pasos: posible ciclo infinito (revise que la condición llegue a ser Falsa)',0);};
  const E=(b,fn)=>{try{return fn();}catch(e){if(e instanceof RunError)e.block=b.id;throw e;}};
  function* seq(list){for(const b of list)yield* blk(b);}
  function* blk(b){
    tick();yield {at:b.id,vars:env.snapshot()};
    switch(b.type){
      case 'proceso':for(const a of b._c)E(b,()=>set(a.target,ev(a.e),0));break;
      case 'entrada':for(const v of b._c){while(!io.buf.includes('\n')){const r=yield {need:'input',name:v,at:b.id};if(r===false){const e=new RunError(`el diagrama pidió el dato '${v}' pero no hay más datos de prueba`,0);e.block=b.id;throw e;}}
          const k=io.buf.indexOf('\n');let raw=io.buf.slice(0,k).trim();io.buf=io.buf.slice(k+1);
          const num=raw.replace(',','.');set(v,/^[+-]?(\d+\.?\d*|\.\d+)$/.test(num)?V('double',parseFloat(num)):/^(verdadero|falso)$/i.test(raw)?V('bool',/^v/i.test(raw)):V('string',raw),0);}break;
      case 'salida':{const s=E(b,()=>b._c.map(e=>fmt(ev(e),mode)).join(''));io.out(s+'\n');break;}
      case 'decision':if(E(b,()=>truthy(ev(b._c),0,mode)))yield* seq(b.yes);else yield* seq(b.no);break;
      case 'mientras':while(E(b,()=>truthy(ev(b._c),0,mode))){tick();yield* seq(b.body);yield {at:b.id,vars:env.snapshot()};}break;
      case 'para':{const c=b._c;const st=E(b,()=>nv(ev(c.s)));if(st===0){const e=new RunError('el incremento del ciclo Para no puede ser 0',0);e.block=b.id;throw e;}
        E(b,()=>set(c.v,ev(c.a),0));
        while(E(b,()=>{const v=nv(ev({k:'var',name:c.v})),z=nv(ev(c.z));return st>0?v<=z:v>=z;})){tick();yield* seq(b.body);E(b,()=>set(c.v,V('double',nv(ev({k:'var',name:c.v}))+st),0));yield {at:b.id,vars:env.snapshot()};}
        break;}
    }
  }
  yield* seq(blocks);
  return {vars:env.snapshot()};
}

/* ---------- conversión de diagrama a pseudocódigo y C++ ---------- */
const PREC={'||':2,'&&':3,'==':4,'!=':4,'<':5,'>':5,'<=':5,'>=':5,'+':6,'-':6,'*':7,'/':7,'%':7,'^':8};
function exprTo(e,lang,parent=0){
  const q=s=>'"'+s.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
  switch(e.k){
    case 'num':return lang==='cpp'&&e.v%1!==0?String(e.v):String(e.v);
    case 'str':return q(e.v);case 'bool':return lang==='cpp'?(e.v?'true':'false'):(e.v?'Verdadero':'Falso');
    case 'var':return e.name;
    case 'un':{const op=e.op==='!'?(lang==='cpp'?'!':'NO '):e.op;return op+exprTo(e.e,lang,9);}
    case 'call':{const nm=lang==='cpp'?e.name:({sqrt:'raiz',round:'redondear',trunc:'truncar',pow:'potencia'}[e.name]||e.name);return nm+'('+e.args.map(a=>exprTo(a,lang)).join(', ')+')';}
    case 'bin':{
      if(e.op==='^'&&lang==='cpp')return `pow(${exprTo(e.l,lang)}, ${exprTo(e.r,lang)})`;
      if(e.op==='%'&&lang==='cpp'){const s=`fmod(${exprTo(e.l,lang)}, ${exprTo(e.r,lang)})`;return s;}
      const pr=PREC[e.op];let op=e.op;
      if(lang!=='cpp')op={'&&':'Y','||':'O','==':'=','!=':'<>','%':'MOD'}[op]||op;
      const s=exprTo(e.l,lang,pr)+' '+op+' '+exprTo(e.r,lang,pr+1);return pr<parent?'('+s+')':s;
    }
  }
  return '?';
}
function flowToPseudo(blocks){
  const out=['Algoritmo mi_algoritmo'];
  const w=(list,d)=>{const pad='    '.repeat(d);for(const b of list){
    switch(b.type){
      case 'proceso':b._c.forEach(a=>out.push(pad+a.target+' <- '+exprTo(a.e,'p')));break;
      case 'entrada':out.push(pad+'Leer '+b._c.join(', '));break;
      case 'salida':out.push(pad+'Escribir '+b._c.map(e=>exprTo(e,'p')).join(', '));break;
      case 'decision':out.push(pad+'Si '+exprTo(b._c,'p')+' Entonces');w(b.yes,d+1);if(b.no.length){out.push(pad+'SiNo');w(b.no,d+1);}out.push(pad+'FinSi');break;
      case 'mientras':out.push(pad+'Mientras '+exprTo(b._c,'p')+' Hacer');w(b.body,d+1);out.push(pad+'FinMientras');break;
      case 'para':out.push(`${pad}Para ${b._c.v} <- ${exprTo(b._c.a,'p')} Hasta ${exprTo(b._c.z,'p')} Con Paso ${exprTo(b._c.s,'p')} Hacer`);w(b.body,d+1);out.push(pad+'FinPara');break;
    }}};
  w(blocks,1);out.push('FinAlgoritmo');return out.join('\n');
}
function flowToCpp(blocks){
  const types=new Map();let math=false,strs=false;
  const usesMath=e=>{if(!e||typeof e!=='object')return;if(e.k==='call'||(e.k==='bin'&&(e.op==='^'||e.op==='%')))math=true;for(const k of ['l','r','e'])if(e[k])usesMath(e[k]);if(e.args)e.args.forEach(usesMath);};
  const isStrE=e=>e.k==='str'||(e.k==='bin'&&e.op==='+'&&(isStrE(e.l)||isStrE(e.r)))||(e.k==='var'&&types.get(e.name)==='string');
  const isBoolE=e=>e.k==='bool'||(e.k==='bin'&&['==','!=','<','>','<=','>=','&&','||'].includes(e.op))||(e.k==='un'&&e.op==='!');
  const scan=list=>{for(const b of list){
    if(b.type==='proceso')b._c.forEach(a=>{usesMath(a.e);if(!types.has(a.target))types.set(a.target,isStrE(a.e)?'string':isBoolE(a.e)?'bool':'double');});
    if(b.type==='entrada')b._c.forEach(v=>{if(!types.has(v))types.set(v,/^(nombre|apellido|ciudad|texto|palabra|mensaje|correo|direccion|pais|color|frase)/i.test(v)?'string':'double');});
    if(b.type==='para'){if(!types.has(b._c.v))types.set(b._c.v,'int');[b._c.a,b._c.z,b._c.s].forEach(usesMath);}
    if(b.type==='salida')b._c.forEach(usesMath);if(b.type==='decision'||b.type==='mientras')usesMath(b._c);
    ['yes','no','body'].forEach(k=>b[k]&&scan(b[k]));}};
  scan(blocks);
  // entradas comparadas con texto -> string
  const strCmp=e=>{if(!e||typeof e!=='object')return;if(e.k==='bin'&&['==','!='].includes(e.op)){if(e.l.k==='var'&&e.r.k==='str')types.set(e.l.name,'string');if(e.r.k==='var'&&e.l.k==='str')types.set(e.r.name,'string');}['l','r','e'].forEach(k=>strCmp(e[k]));};
  const scan2=list=>{for(const b of list){if(b.type==='decision'||b.type==='mientras')strCmp(b._c);['yes','no','body'].forEach(k=>b[k]&&scan2(b[k]));}};scan2(blocks);
  for(const t of types.values())if(t==='string')strs=true;
  const L=['// Código generado desde el diagrama de flujo.','// Revise los tipos de datos: el simulador los infiere de forma aproximada.','#include <iostream>'];
  if(strs)L.push('#include <string>');if(math)L.push('#include <cmath>');
  L.push('using namespace std;','','int main() {');
  const byT={};for(const [n,t] of types){(byT[t]=byT[t]||[]).push(n);}
  for(const t of ['int','double','bool','string'])if(byT[t])L.push(`    ${t} ${byT[t].join(', ')};`);
  if(Object.keys(byT).length)L.push('');
  const w=(list,d)=>{const pad='    '.repeat(d);for(const b of list){
    switch(b.type){
      case 'proceso':b._c.forEach(a=>L.push(`${pad}${a.target} = ${exprTo(a.e,'cpp')};`));break;
      case 'entrada':b._c.forEach(v=>{L.push(`${pad}cout << "Ingrese ${v}: ";`);L.push(`${pad}cin >> ${v};`);});break;
      case 'salida':L.push(`${pad}cout << ${b._c.map(e=>{const s=exprTo(e,'cpp');return e.k==='bin'&&e.op==='+'&&isStrE(e)?flatPlus(e):s;}).join(' << ')} << endl;`);break;
      case 'decision':L.push(`${pad}if (${exprTo(b._c,'cpp')}) {`);w(b.yes,d+1);if(b.no.length){L.push(`${pad}} else {`);w(b.no,d+1);}L.push(pad+'}');break;
      case 'mientras':L.push(`${pad}while (${exprTo(b._c,'cpp')}) {`);w(b.body,d+1);L.push(pad+'}');break;
      case 'para':{const c=b._c;const neg=c.s.k==='un'&&c.s.op==='-';L.push(`${pad}for (${c.v} = ${exprTo(c.a,'cpp')}; ${c.v} ${neg?'>=':'<='} ${exprTo(c.z,'cpp')}; ${c.v} += ${exprTo(c.s,'cpp')}) {`);w(b.body,d+1);L.push(pad+'}');break;}
    }}};
  function flatPlus(e){if(e.k==='bin'&&e.op==='+')return flatPlus(e.l)+' << '+flatPlus(e.r);return exprTo(e,'cpp');}
  w(blocks,1);L.push('','    return 0;','}');
  return L.join('\n');
}

/* ---------- validación de resultados ---------- */
function normTokens(s){return (s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-zñ]+|-?\d+(?:\.\d+)?/g)||[]);}
function matchExpected(output,expect){
  const toks=normTokens(output);let i=0;
  for(const ex of expect){
    const e=normTokens(String(ex));
    let found=false;
    while(i<toks.length){
      let ok=true;
      for(let j=0;j<e.length;j++){const a=toks[i+j],b=e[j];if(a===undefined){ok=false;break;}const na=parseFloat(a),nb=parseFloat(b);if(!isNaN(nb)){if(isNaN(na)||Math.abs(na-nb)>1e-4){ok=false;break;}}else if(a!==b){ok=false;break;}}
      if(ok){i+=e.length;found=true;break;}i++;
    }
    if(!found)return {ok:false,missing:ex};
  }
  return {ok:true};
}
function runToEnd(gen){
  let r=gen.next();
  while(!r.done){if(r.value&&r.value.need){r=gen.next(false);}else r=gen.next();}
  return r.value;
}

if(typeof module!=='undefined')module.exports={lex,Parser,compileCpp,runCpp,compileBlock,runFlow,flowToPseudo,flowToCpp,matchExpected,runToEnd,fmtDouble,CompileError,RunError,normTokens};
