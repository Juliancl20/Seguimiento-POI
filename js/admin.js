<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Administración — Seguimiento POI</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>
.sem-verde{background:#dcfce7;color:#166534}.sem-rojo{background:#fee2e2;color:#991b1b}.sem-amarillo{background:#fef9c3;color:#854d0e}
</style>
</head>
<body class="bg-slate-100 min-h-screen">
<header class="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
  <div><h1 class="font-bold text-lg">🗂️ Administración del Catálogo</h1><p class="text-xs text-blue-200" id="user-email"></p></div>
  <a href="app.html" class="bg-blue-700 hover:bg-blue-600 text-sm px-3 py-1.5 rounded-lg">← Volver al aplicativo</a>
</header>
<main class="max-w-6xl mx-auto p-4">

  <div class="bg-white rounded-xl shadow p-5 mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 class="text-lg font-bold text-slate-800">Catálogo por año (CC, Áreas, Actividades, OEI, AEI)</h2>
    <div class="flex items-center gap-2">
      <span class="text-sm text-slate-600">Año:</span>
      <select id="adm-anio" class="border rounded-lg px-3 py-2"></select>
      <button id="btn-nuevo-anio" class="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">➕ Abrir año nuevo</button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
    <div class="bg-white rounded-xl shadow p-6"><h3 class="font-bold text-slate-700 mb-3">➕ Agregar Área</h3>
      <div class="space-y-2">
        <select id="na-cc" class="w-full border rounded-lg px-3 py-2"></select>
        <input id="na-nombre" placeholder="Nombre del área" class="w-full border rounded-lg px-3 py-2">
        <button id="btn-add-area" class="bg-green-700 text-white text-sm px-4 py-2 rounded-lg">Guardar área</button>
      </div></div>
    <div class="bg-white rounded-xl shadow p-6"><h3 class="font-bold text-slate-700 mb-3">➕ Agregar Actividad Operativa</h3>
      <div class="space-y-2">
        <select id="naa-cc" class="w-full border rounded-lg px-3 py-2"></select>
        <select id="naa-area" class="w-full border rounded-lg px-3 py-2"><option value="">— Área —</option></select>
        <input id="naa-codigo" placeholder="Código AOI (ej. AOI00108200000)" class="w-full border rounded-lg px-3 py-2">
        <input id="naa-nombre" placeholder="Nombre de la actividad" class="w-full border rounded-lg px-3 py-2">
        <div class="grid grid-cols-2 gap-2">
          <input id="naa-um" placeholder="Unidad de medida" class="border rounded-lg px-3 py-2">
          <select id="naa-oei" class="border rounded-lg px-3 py-2"></select>
        </div>
        <select id="naa-aei" class="w-full border rounded-lg px-3 py-2"><option value="">— AEI —</option></select>
        <input id="naa-resp" placeholder="Responsable (opcional)" class="w-full border rounded-lg px-3 py-2">
        <button id="btn-add-aoi" class="bg-green-700 text-white text-sm px-4 py-2 rounded-lg">Guardar actividad</button>
      </div></div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
    <div class="bg-white rounded-xl shadow p-6"><h3 class="font-bold text-slate-700 mb-3">➕ Nuevo OEI</h3>
      <div class="space-y-2">
        <input id="noei-cod" placeholder="Código (ej. OEI.08)" class="w-full border rounded-lg px-3 py-2">
        <input id="noei-nom" placeholder="Nombre del OEI (completo)" class="w-full border rounded-lg px-3 py-2">
        <button id="btn-add-oei" class="bg-slate-700 text-white text-sm px-4 py-2 rounded-lg">Guardar OEI</button>
      </div></div>
    <div class="bg-white rounded-xl shadow p-6"><h3 class="font-bold text-slate-700 mb-3">➕ Nueva AEI</h3>
      <div class="space-y-2">
        <select id="naei-oei" class="w-full border rounded-lg px-3 py-2"></select>
        <input id="naei-cod" placeholder="Código (ej. AEI.06.06)" class="w-full border rounded-lg px-3 py-2">
        <input id="naei-nom" placeholder="Nombre de la AEI (completo)" class="w-full border rounded-lg px-3 py-2">
        <button id="btn-add-aei" class="bg-slate-700 text-white text-sm px-4 py-2 rounded-lg">Guardar AEI</button>
      </div></div>
  </div>

  <div class="bg-white rounded-xl shadow p-6 mb-4"><h3 class="font-bold text-slate-700 mb-3">🗂️ Gestión de Áreas</h3>
    <div class="flex gap-2 mb-3"><select id="ga-cc" class="border rounded-lg px-3 py-2"><option value="">— Seleccione Centro de Costo —</option></select></div>
    <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-800 text-white"><tr>
      <th class="p-2 text-left">Área</th><th class="p-2">Actividades</th><th class="p-2">Presupuesto</th><th class="p-2">Estado</th><th class="p-2">Acciones</th>
    </tr></thead><tbody id="ga-tabla" class="divide-y"></tbody></table></div>
    <p id="ga-vacio" class="text-sm text-slate-500 p-4 text-center">Seleccione un Centro de Costo para ver sus áreas.</p>
  </div>

  <div class="bg-white rounded-xl shadow p-6"><h3 class="font-bold text-slate-700 mb-3">🗂️ Gestión de Actividades Operativas</h3>
    <div class="flex gap-2 mb-3">
      <select id="ac-cc" class="border rounded-lg px-3 py-2"><option value="">— Centro de Costo —</option></select>
      <select id="ac-area" class="border rounded-lg px-3 py-2"><option value="">— Área —</option></select>
    </div>
    <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-800 text-white"><tr>
      <th class="p-2 text-left">Cód. AOI</th><th class="p-2 text-left">Actividad</th><th class="p-2">UM</th><th class="p-2 text-left">OEI / AEI</th><th class="p-2">Presup.</th><th class="p-2">Estado</th><th class="p-2">Acciones</th>
    </tr></thead><tbody id="ac-tabla" class="divide-y"></tbody></table></div>
    <p id="ac-vacio" class="text-sm text-slate-500 p-4 text-center">Seleccione un Centro de Costo y un Área para ver sus actividades.</p>
  </div>

  <div id="modal" class="hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div id="modal-body" class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"></div>
  </div>
</main>
<script>
const sb = supabase.createClient('https://ylpglzsjgblsvjgxqatm.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscGdsenNqZ2Jsc3ZqZ3hxYXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDY5NTcsImV4cCI6MjEwMTUyMjk1N30.T-PlhfwgQzLuf7zyfWauEEPCoAgKXHHwEfBnqcPPu2s');
let ANIO = parseInt(localStorage.getItem('poi_anio')||'2026',10);
let CENTROS=[],AREAS=[],ACTS=[],OEIS=[],AEIS=[],PRES={};

async function init(){
  const {data:{session}} = await sb.auth.getSession();
  if(!session){ location.href='index.html'; return; }
  const {data:prof} = await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  if(!prof || prof.rol!=='admin'){ alert('Solo el administrador puede acceder a Administración.'); location.href='app.html'; return; }
  document.getElementById('user-email').textContent = session.user.email + ' | Rol: admin';
  await cargarTodo();
  document.getElementById('btn-add-area').onclick = addArea;
  document.getElementById('btn-add-aoi').onclick = addAct;
  document.getElementById('btn-add-oei').onclick = addOEI;
  document.getElementById('btn-add-aei').onclick = addAEI;
  document.getElementById('btn-nuevo-anio').onclick = abrirNuevoAnio;
  document.getElementById('adm-anio').onchange = e=>{ ANIO=+e.target.value; localStorage.setItem('poi_anio',String(ANIO)); location.reload(); };
  document.getElementById('na-cc').onchange = ()=>poblarAreas('na-cc','naa-area');
  document.getElementById('naa-cc').onchange = ()=>poblarAreas('naa-cc','naa-area');
  document.getElementById('naa-oei').onchange = e=>poblarAEI('naa-oei','naa-aei');
  document.getElementById('naei-oei').onchange = e=>poblarAEI('naei-oei',null);
  document.getElementById('ga-cc').onchange = renderAreas;
  document.getElementById('ac-cc').onchange = ()=>{ poblarAreas('ac-cc','ac-area'); renderActs(); };
  document.getElementById('ac-area').onchange = renderActs;
}

async function cargarTodo(){
  const [an,cc,ar,ac,oe,ae,pm] = await Promise.all([
    sb.from('anios').select('*').order('anio'),
    sb.from('centros_costos').select('*').order('codigo'),
    sb.from('areas').select('*').order('nombre'),
    sb.from('actividades_operativas').select('*').eq('anio',ANIO).order('codigo'),
    sb.from('oeis').select('*').order('codigo'),
    sb.from('aeis').select('*').order('codigo'),
    sb.from('programacion_metas').select('actividad_id, meta_financiera, pim').eq('anio',ANIO)
  ]);
  CENTROS=cc.data||[]; AREAS=ar.data||[]; ACTS=ac.data||[]; OEIS=oe.data||[]; AEIS=ae.data||[]; PRES={};
  (pm.data||[]).forEach(r=>{ if((Number(r.meta_financiera)||0)>0||(Number(r.pim)||0)>0) PRES[r.actividad_id]=true; });
  const sAnio=document.getElementById('adm-anio');
  sAnio.innerHTML=(an.data||[]).map(x=>'<option value="'+x.anio+'" '+(x.anio===ANIO?'selected':'')+'>'+x.anio+'</option>').join('');
  opcCC('na-cc',false); opcCC('naa-cc',false); opcCC('ga-cc',true); opcCC('ac-cc',true);
  opcOEI('naa-oei'); opcOEI('naei-oei');
  poblarAreas('naa-cc','naa-area');
  renderAreas(); renderActs();
}
function opcCC(id,conVacio){
  document.getElementById(id).innerHTML=(conVacio?'<option value="">— Seleccione Centro de Costo —</option>':'')+CENTROS.map(c=>'<option value="'+c.id+'">'+c.codigo+' — '+c.nombre+'</option>').join('');
}
function opcOEI(id){
  document.getElementById(id).innerHTML=OEIS.map(o=>'<option value="'+o.codigo+'">'+o.codigo+' — '+o.nombre+'</option>').join('');
}
function poblarAEI(oeiSel,aeiSel){
  const oei=document.getElementById(oeiSel).value;
  const html=AEIS.filter(x=>x.oei_codigo===oei).map(x=>'<option value="'+x.codigo+'">'+x.codigo+' — '+x.nombre+'</option>').join('');
  if(aeiSel) document.getElementById(aeiSel).innerHTML='<option value="">— AEI —</option>'+html;
  return html;
}
function poblarAreas(ccSel,areaSel){
  const cc=document.getElementById(ccSel).value;
  document.getElementById(areaSel).innerHTML='<option value="">— Área —</option>'+AREAS.filter(a=>a.centro_costo_id===cc).map(a=>'<option value="'+a.id+'">'+a.nombre+'</option>').join('');
}
const ccNom=id=>(CENTROS.find(c=>c.id===id)||{}).nombre||'';
const oeiNom=c=>{const o=OEIS.find(x=>x.codigo===c);return o?o.codigo+' — '+o.nombre:'';};
const aeiNom=c=>{const o=AEIS.find(x=>x.codigo===c);return o?o.codigo+' — '+o.nombre:'';};
const actConPres=id=>!!PRES[id];
const areaConActs=id=>ACTS.some(a=>a.area_id===id);
const areaConPres=id=>ACTS.some(a=>a.area_id===id&&PRES[a.id]);

function renderAreas(){
  const cc=document.getElementById('ga-cc').value;
  const vac=document.getElementById('ga-vacio');
  if(!cc){ vac.style.display='block'; document.getElementById('ga-tabla').innerHTML=''; return; }
  vac.style.display='none';
  document.getElementById('ga-tabla').innerHTML=AREAS.filter(a=>a.centro_costo_id===cc).map(a=>{
    const n=ACTS.filter(x=>x.area_id===a.id).length;
    const pres=areaConPres(a.id); const inact=a.activo===false;
    return '<tr class="hover:bg-slate-50"><td class="p-2 font-medium">'+a.nombre+'</td>'+
      '<td class="p-2 text-center">'+n+'</td>'+
      '<td class="p-2 text-center">'+(pres?'<span class="sem-amarillo px-2 py-1 rounded-full text-xs font-bold">Con presupuesto</span>':'<span class="text-slate-400 text-xs">—</span>')+'</td>'+
      '<td class="p-2 text-center">'+(inact?'<span class="sem-rojo px-2 py-1 rounded-full text-xs font-bold">INACTIVO</span>':'<span class="sem-verde px-2 py-1 rounded-full text-xs font-bold">ACTIVO</span>')+'</td>'+
      '<td class="p-2 whitespace-nowrap">'+
      '<button class="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-1" onclick="editArea(\''+a.id+'\')">✏️ Editar</button>'+
      '<button class="bg-amber-600 text-white text-xs px-2 py-1 rounded mr-1" onclick="toggleArea(\''+a.id+'\','+inact+')">'+(inact?'✅ Activar':'🚫 Desactivar')+'</button>'+
      '<button class="bg-red-600 text-white text-xs px-2 py-1 rounded" onclick="delArea(\''+a.id+'\')">🗑️ Eliminar</button></td></tr>';
  }).join('');
}
function renderActs(){
  const cc=document.getElementById('ac-cc').value, ar=document.getElementById('ac-area').value;
  const vac=document.getElementById('ac-vacio');
  if(!cc||!ar){ vac.style.display='block'; document.getElementById('ac-tabla').innerHTML=''; return; }
  vac.style.display='none';
  document.getElementById('ac-tabla').innerHTML=ACTS.filter(a=>a.area_id===ar).map(a=>{
    const pres=actConPres(a.id); const inact=a.activo===false;
    return '<tr class="hover:bg-slate-50"><td class="p-2 font-mono text-xs">'+a.codigo+'</td>'+
      '<td class="p-2">'+a.nombre+'</td><td class="p-2">'+(a.unidad_medida||'')+'</td>'+
      '<td class="p-2 text-xs">'+oeiNom(a.oei)+'<br>'+aeiNom(a.aei)+'</td>'+
      '<td class="p-2 text-center">'+(pres?'<span class="sem-amarillo px-2 py-1 rounded-full text-xs font-bold">Con presupuesto</span>':'<span class="text-slate-400 text-xs">—</span>')+'</td>'+
      '<td class="p-2 text-center">'+(inact?'<span class="sem-rojo px-2 py-1 rounded-full text-xs font-bold">INACTIVO</span>':'<span class="sem-verde px-2 py-1 rounded-full text-xs font-bold">ACTIVO</span>')+'</td>'+
      '<td class="p-2 whitespace-nowrap">'+
      '<button class="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-1" onclick="editAct(\''+a.id+'\')">✏️ Editar</button>'+
      '<button class="bg-amber-600 text-white text-xs px-2 py-1 rounded mr-1" onclick="toggleAct(\''+a.id+'\','+inact+')">'+(inact?'✅ Activar':'🚫 Desactivar')+'</button>'+
      '<button class="bg-red-600 text-white text-xs px-2 py-1 rounded" onclick="delAct(\''+a.id+'\')">🗑️ Eliminar</button></td></tr>';
  }).join('');
}

async function addArea(){
  const cc=document.getElementById('na-cc').value, nom=(document.getElementById('na-nombre').value||'').trim().toUpperCase();
  if(!nom){alert('Ingrese el nombre del área');return;}
  const {error}=await sb.from('areas').insert({centro_costo_id:cc,nombre:nom,activo:true});
  if(error){alert('Error: '+error.message);return;}
  document.getElementById('na-nombre').value=''; await cargarTodo();
}
async function addAct(){
  const reg={ area_id:document.getElementById('naa-area').value, codigo:(document.getElementById('naa-codigo').value||'').trim(),
    nombre:(document.getElementById('naa-nombre').value||'').trim(), unidad_medida:(document.getElementById('naa-um').value||'').trim(),
    oei:document.getElementById('naa-oei').value, aei:document.getElementById('naa-aei').value,
    responsable:(document.getElementById('naa-resp').value||'').trim(), anio:ANIO, activo:true, pia_bloqueado:false };
  if(!reg.area_id||!reg.codigo||!reg.nombre){alert('Área, código y nombre son obligatorios');return;}
  const {error}=await sb.from('actividades_operativas').insert(reg);
  if(error){alert('Error: '+error.message);return;}
  document.getElementById('naa-codigo').value=''; document.getElementById('naa-nombre').value=''; await cargarTodo();
}
async function addOEI(){
  const cod=(document.getElementById('noei-cod').value||'').trim().toUpperCase(), nom=(document.getElementById('noei-nom').value||'').trim();
  if(!cod||!nom){alert('Código y nombre obligatorios');return;}
  const {error}=await sb.from('oeis').insert({codigo:cod,nombre:nom});
  if(error){alert('Error: '+error.message);return;}
  document.getElementById('noei-cod').value=''; document.getElementById('noei-nom').value=''; await cargarTodo();
}
async function addAEI(){
  const oei=document.getElementById('naei-oei').value, cod=(document.getElementById('naei-cod').value||'').trim().toUpperCase(), nom=(document.getElementById('naei-nom').value||'').trim();
  if(!oei||!cod||!nom){alert('OEI, código y nombre obligatorios');return;}
  const {error}=await sb.from('aeis').insert({codigo:cod,oei_codigo:oei,nombre:nom});
  if(error){alert('Error: '+error.message);return;}
  document.getElementById('naei-cod').value=''; document.getElementById('naei-nom').value=''; await cargarTodo();
}

function toggleArea(id,inact){
  if(!inact && areaConPres(id)){ alert('⚠️ No se puede desactivar: el área tiene actividades con presupuesto asignado.'); return; }
  sb.from('areas').update({activo:inact?true:false}).eq('id',id).then(()=>cargarTodo());
}
function delArea(id){
  if(areaConActs(id)){ alert('⚠️ No se puede eliminar: el área tiene actividades asociadas. Reasigne o elimine sus actividades primero.'); return; }
  if(areaConPres(id)){ alert('⚠️ No se puede eliminar: el área tiene actividades con presupuesto asignado.'); return; }
  if(!confirm('¿Eliminar el área?')) return;
  sb.from('areas').delete().eq('id',id).then(()=>cargarTodo());
}
function toggleAct(id,inact){
  if(!inact && actConPres(id)){ alert('⚠️ No se puede desactivar: la actividad tiene presupuesto asignado.'); return; }
  sb.from('actividades_operativas').update({activo:inact?true:false}).eq('id',id).then(()=>cargarTodo());
}
function delAct(id){
  if(actConPres(id)){ alert('⚠️ No se puede eliminar: la actividad tiene presupuesto asignado.'); return; }
  if(!confirm('¿Eliminar la actividad?')) return;
  sb.from('actividades_operativas').delete().eq('id',id).then(()=>cargarTodo());
}

function showModal(html){ document.getElementById('modal-body').innerHTML=html; document.getElementById('modal').classList.remove('hidden'); }
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }

function editArea(id){
  const a=AREAS.find(x=>x.id===id);
  showModal('<h3 class="font-bold text-lg mb-3">✏️ Editar Área</h3>'+
    '<label class="text-sm text-slate-600">Nombre del área</label>'+
    '<input id="ed-nombre" class="w-full border rounded-lg px-3 py-2 mb-3" value="'+a.nombre+'">'+
    '<div class="flex justify-end gap-2"><button class="bg-slate-500 text-white px-4 py-2 rounded-lg" onclick="closeModal()">Cancelar</button>'+
    '<button class="bg-blue-700 text-white px-4 py-2 rounded-lg" onclick="saveArea(\''+id+'\')">Guardar</button></div>');
}
async function saveArea(id){
  const nom=(document.getElementById('ed-nombre').value||'').trim().toUpperCase();
  if(!nom){alert('Ingrese nombre');return;}
  await sb.from('areas').update({nombre:nom}).eq('id',id);
  closeModal(); await cargarTodo();
}
function editAct(id){
  const a=ACTS.find(x=>x.id===id);
  showModal('<h3 class="font-bold text-lg mb-3">✏️ Editar Actividad</h3>'+
    '<label class="text-sm text-slate-600">Nombre</label><input id="ed-nombre" class="w-full border rounded-lg px-3 py-2 mb-2" value="'+a.nombre+'">'+
    '<label class="text-sm text-slate-600">Unidad de medida</label><input id="ed-um" class="w-full border rounded-lg px-3 py-2 mb-2" value="'+(a.unidad_medida||'')+'">'+
    '<label class="text-sm text-slate-600">OEI</label><select id="ed-oei" class="w-full border rounded-lg px-3 py-2 mb-2" onchange="poblarAEIModal(this.value,\''+(a.aei||'')+'\')">'+OEIS.map(o=>'<option value="'+o.codigo+'" '+(o.codigo===a.oei?'selected':'')+'>'+o.codigo+' — '+o.nombre+'</option>').join('')+'</select>'+
    '<label class="text-sm text-slate-600">AEI</label><select id="ed-aei" class="w-full border rounded-lg px-3 py-2 mb-2"></select>'+
    '<label class="text-sm text-slate-600">Responsable</label><input id="ed-resp" class="w-full border rounded-lg px-3 py-2 mb-3" value="'+(a.responsable||'')+'">'+
    '<div class="flex justify-end gap-2"><button class="bg-slate-500 text-white px-4 py-2 rounded-lg" onclick="closeModal()">Cancelar</button>'+
    '<button class="bg-blue-700 text-white px-4 py-2 rounded-lg" onclick="saveAct(\''+id+'\')">Guardar</button></div>');
  poblarAEIModal(a.oei, a.aei||'');
}
function poblarAEIModal(oei,sel){
  document.getElementById('ed-aei').innerHTML=AEIS.filter(x=>x.oei_codigo===oei).map(x=>'<option value="'+x.codigo+'" '+(x.codigo===sel?'selected':'')+'>'+x.codigo+' — '+x.nombre+'</option>').join('');
}
async function saveAct(id){
  const reg={ nombre:(document.getElementById('ed-nombre').value||'').trim(), unidad_medida:(document.getElementById('ed-um').value||'').trim(),
    oei:document.getElementById('ed-oei').value, aei:document.getElementById('ed-aei').value, responsable:(document.getElementById('ed-resp').value||'').trim() };
  await sb.from('actividades_operativas').update(reg).eq('id',id);
  closeModal(); await cargarTodo();
}

async function abrirNuevoAnio(){
  const nuevo=ANIO+1;
  if(!confirm('Se abrirá el año '+nuevo+' copiando el catálogo de actividades del año '+ANIO+'. ¿Continuar?')) return;
  const copias=ACTS.map(r=>({ area_id:r.area_id, codigo:r.codigo, nombre:r.nombre, unidad_medida:r.unidad_medida, oei:r.oei, aei:r.aei, codigo_registro:r.codigo_registro, responsable:r.responsable, anio:nuevo, activo:true, pia_bloqueado:false }));
  if(copias.length) await sb.from('actividades_operativas').insert(copias);
  await sb.from('anios').upsert({anio:nuevo},{onConflict:'anio'});
  ANIO=nuevo; localStorage.setItem('poi_anio',String(nuevo)); location.reload();
}
init();
</script>
</body>
</html>
