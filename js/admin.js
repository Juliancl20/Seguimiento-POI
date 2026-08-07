/* ============ MÓDULO ADMINISTRACIÓN v2 ============ */
let ADM = { anio: parseInt(localStorage.getItem('poi_anio')||'2026',10), oeis:[], aeis:[], acts:[], pres:{} };

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[data-tab="admin"]');
  if (!btn) return;
  const cl = btn.cloneNode(true);            // elimina listeners antiguos
  btn.parentNode.replaceChild(cl, btn);
  cl.addEventListener('click', () => { if (window.PERFIL && PERFIL.rol==='admin') { cambiarTab('admin'); renderAdmin(); } });
});

const CC_OPTS  = () => CENTROS.map(c=>`<option value="${c.id}">${c.codigo} — ${c.nombre}</option>`).join('');
const OEI_OPTS = () => ADM.oeis.map(o=>`<option value="${o.codigo}">${o.codigo} — ${o.nombre}</option>`).join('');
const AEI_OPTS = (oei) => ADM.aeis.filter(a=>a.oei===oei).map(a=>`<option value="${a.codigo}">${a.codigo} — ${a.nombre}</option>`).join('');
const oeiNom = c => (ADM.oeis.find(x=>x.codigo===c)||{}).nombre || '';
const aeiNom = c => (ADM.aeis.find(x=>x.codigo===c)||{}).nombre || '';
const actConPres = id => (ADM.pres[id]||0) > 0;
const ANIO_OPTS = () => { let s=''; for(let y=2026;y<=2100;y++) s+=`<option value="${y}" ${y===ADM.anio?'selected':''}>${y}</option>`; return s; };

async function admBase(){
  const [oe,ae,ac,pr] = await Promise.all([
    supabase.from('oeis').select('*').order('codigo'),
    supabase.from('aeis').select('*').order('codigo'),
    supabase.from('actividades_operativas').select('*').eq('anio',ADM.anio),
    supabase.from('programacion_metas').select('actividad_id, meta_financiera, pim').eq('anio',ADM.anio)
  ]);
  ADM.oeis=oe.data||[]; ADM.aeis=ae.data||[]; ADM.acts=ac.data||[]; ADM.pres={};
  (pr.data||[]).forEach(r=>{ ADM.pres[r.actividad_id]=(ADM.pres[r.actividad_id]||0)+(Number(r.meta_financiera)||0)+(Number(r.pim)||0); });
}

async function renderAdmin(){
  await admBase();
  const sec=document.getElementById('tab-admin'); if(!sec) return;
  sec.innerHTML = `
  <div class="bg-white rounded-xl shadow p-5 mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 class="text-lg font-bold text-slate-800">🗂️ Administración del Catálogo</h2>
    <div class="flex items-center gap-2"><span class="text-sm text-slate-600">Año:</span>
      <select id="adm-anio" class="border rounded-lg px-3 py-2">${ANIO_OPTS()}</select>
      <button id="adm-nuevo-anio" class="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">➕ Abrir año nuevo</button></div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
    <div class="bg-white rounded-xl shadow p-5"><h3 class="font-bold text-slate-700 mb-3">➕ Agregar Área</h3>
      <div class="space-y-2"><select id="na-cc" class="w-full border rounded-lg px-3 py-2">${CC_OPTS()}</select>
      <input id="na-nombre" placeholder="Nombre del área" class="w-full border rounded-lg px-3 py-2">
      <button id="na-guardar" class="bg-green-700 text-white text-sm px-4 py-2 rounded-lg">Guardar área</button></div></div>
    <div class="bg-white rounded-xl shadow p-5"><h3 class="font-bold text-slate-700 mb-3">➕ Agregar Actividad Operativa</h3>
      <div class="space-y-2"><select id="naa-cc" class="w-full border rounded-lg px-3 py-2">${CC_OPTS()}</select>
      <select id="naa-area" class="w-full border rounded-lg px-3 py-2"><option value="">— Área —</option></select>
      <input id="naa-codigo" placeholder="Código AOI" class="w-full border rounded-lg px-3 py-2">
      <input id="naa-nombre" placeholder="Nombre de la actividad" class="w-full border rounded-lg px-3 py-2">
      <div class="grid grid-cols-2 gap-2"><input id="naa-um" placeholder="Unidad de medida" class="border rounded-lg px-3 py-2">
      <select id="naa-oei" class="border rounded-lg px-3 py-2">${OEI_OPTS()}</select></div>
      <select id="naa-aei" class="w-full border rounded-lg px-3 py-2"><option value="">— AEI —</option></select>
      <button id="naa-guardar" class="bg-green-700 text-white text-sm px-4 py-2 rounded-lg">Guardar actividad</button></div></div>
  </div>
  <div class="bg-white rounded-xl shadow p-5 mb-4"><h3 class="font-bold text-slate-700 mb-3">🗂️ Gestión de Áreas</h3>
    <div class="flex gap-2 mb-3"><select id="ga-cc" class="border rounded-lg px-3 py-2">${CC_OPTS()}</select></div>
    <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-800 text-white"><tr>
      <th class="p-2 text-left">Área</th><th class="p-2">Actividades</th><th class="p-2">Presupuesto</th><th class="p-2">Estado</th><th class="p-2">Acciones</th></tr></thead>
      <tbody id="ga-tabla" class="divide-y"></tbody></table></div></div>
  <div class="bg-white rounded-xl shadow p-5"><h3 class="font-bold text-slate-700 mb-3">🗂️ Gestión de Actividades Operativas</h3>
    <div class="flex gap-2 mb-3"><select id="ac-cc" class="border rounded-lg px-3 py-2">${CC_OPTS()}</select>
    <select id="ac-area" class="border rounded-lg px-3 py-2"><option value="">— Seleccione área —</option></select></div>
    <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-800 text-white"><tr>
      <th class="p-2 text-left">Cód. AOI</th><th class="p-2 text-left">Actividad</th><th class="p-2 text-left">OEI / AEI</th><th class="p-2">UM</th><th class="p-2">Presup.</th><th class="p-2">Estado</th><th class="p-2">Acciones</th></tr></thead>
      <tbody id="ac-tabla" class="divide-y"></tbody></table></div>
    <p id="ac-vacio" class="text-sm text-slate-500 p-4 text-center">Seleccione un Centro de Costo y un Área para ver sus actividades.</p></div>
  <div id="adm-modal" class="hidden fixed inset-0 z-50 bg-black/50 items-center justify-center p-4"><div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg" id="adm-modal-body"></div></div>`;
  wire();
  const fcc = CENTROS[0]?CENTROS[0].id:'';
  ['na-cc','naa-cc','ga-cc','ac-cc'].forEach(id=>{const el=document.getElementById(id); if(el) el.value=fcc;});
  fillAreaSelects(); renderAreas(); renderActs();
}

function wire(){
  document.getElementById('adm-anio').onchange = e=>{ ADM.anio=+e.target.value; localStorage.setItem('poi_anio',ADM.anio); renderAdmin(); };
  document.getElementById('adm-nuevo-anio').onclick = abrirNuevoAnio;
  document.getElementById('na-guardar').onclick = addArea;
  document.getElementById('naa-cc').onchange = fillAreaSelects;
  document.getElementById('naa-oei').onchange = e=>{ document.getElementById('naa-aei').innerHTML = '<option value="">— AEI —</option>'+AEI_OPTS(e.target.value); };
  document.getElementById('naa-guardar').onclick = addAct;
  document.getElementById('ga-cc').onchange = renderAreas;
  document.getElementById('ac-cc').onchange = ()=>{ fillAreaSelects(); renderActs(); };
  document.getElementById('ac-area').onchange = renderActs;
}

function fillAreaSelects(){
  const cc1=document.getElementById('naa-cc').value, cc2=document.getElementById('ac-cc').value;
  const a1=AREAS.filter(a=>a.centro_costo_id===cc1).map(a=>`<option value="${a.id}">${a.nombre}</option>`).join('');
  const a2=AREAS.filter(a=>a.centro_costo_id===cc2).map(a=>`<option value="${a.id}">${a.nombre}</option>`).join('');
  document.getElementById('naa-area').innerHTML = '<option value="">— Área —</option>'+a1;
  document.getElementById('ac-area').innerHTML = '<option value="">— Seleccione área —</option>'+a2;
}

function renderAreas(){
  const cc=document.getElementById('ga-cc').value;
  const rows=AREAS.filter(a=>a.centro_costo_id===cc).map(a=>{
    const acts=ADM.acts.filter(x=>x.area_id===a.id);
    const pres=acts.some(x=>actConPres(x.id));
    const inact=a.activo===false;
    return `<tr class="hover:bg-slate-50"><td class="p-2 font-medium">${a.nombre}</td>
    <td class="p-2 text-center">${acts.length}</td>
    <td class="p-2 text-center">${pres?'<span class="sem-amarillo px-2 py-1 rounded-full text-xs font-bold">Con presupuesto</span>':'<span class="text-slate-400 text-xs">—</span>'}</td>
    <td class="p-2 text-center">${inact?'<span class="sem-rojo px-2 py-1 rounded-full text-xs font-bold">INACTIVO</span>':'<span class="sem-verde px-2 py-1 rounded-full text-xs font-bold">ACTIVO</span>'}</td>
    <td class="p-2 whitespace-nowrap">
      <button class="bg-blue-600 text-white text-xs px-2 py-1 rounded" onclick="openEditArea('${a.id}')">✏️ Editar</button>
      <button class="bg-amber-600 text-white text-xs px-2 py-1 rounded" onclick="toggleArea('${a.id}',${inact})">${inact?'✅ Activar':'🚫 Desactivar'}</button>
      <button class="bg-red-600 text-white text-xs px-2 py-1 rounded" onclick="delArea('${a.id}')">🗑️ Eliminar</button></td></tr>`;
  }).join('');
  document.getElementById('ga-tabla').innerHTML = rows || '<tr><td colspan="5" class="p-4 text-center text-slate-500">Sin áreas.</td></tr>';
}

function renderActs(){
  const area=document.getElementById('ac-area').value;
  const vacio=document.getElementById('ac-vacio');
  if(!area){ vacio.style.display='block'; document.getElementById('ac-tabla').innerHTML=''; return; }
  vacio.style.display='none';
  const rows=ADM.acts.filter(x=>x.area_id===area).map(a=>{
    const pres=actConPres(a.id); const inact=a.activo===false;
    return `<tr class="hover:bg-slate-50"><td class="p-2 font-mono text-xs">${a.codigo}</td>
    <td class="p-2">${a.nombre}</td>
    <td class="p-2 text-xs">${a.oei||''} ${oeiNom(a.oei)}<br>${a.aei||''} ${aeiNom(a.aei)}</td>
    <td class="p-2">${a.unidad_medida||''}</td>
    <td class="p-2 text-center">${pres?'<span class="sem-amarillo px-2 py-1 rounded-full text-xs font-bold">Con presupuesto</span>':'<span class="text-slate-400 text-xs">—</span>'}</td>
    <td class="p-2 text-center">${inact?'<span class="sem-rojo px-2 py-1 rounded-full text-xs font-bold">INACTIVO</span>':'<span class="sem-verde px-2 py-1 rounded-full text-xs font-bold">ACTIVO</span>'}</td>
    <td class="p-2 whitespace-nowrap">
      <button class="bg-blue-600 text-white text-xs px-2 py-1 rounded" onclick="openEditAct('${a.id}')">✏️ Editar</button>
      <button class="bg-amber-600 text-white text-xs px-2 py-1 rounded" onclick="toggleAct('${a.id}',${inact})">${inact?'✅ Activar':'🚫 Desactivar'}</button>
      <button class="bg-red-600 text-white text-xs px-2 py-1 rounded" onclick="delAct('${a.id}')">🗑️ Eliminar</button></td></tr>`;
  }).join('');
  document.getElementById('ac-tabla').innerHTML = rows || '<tr><td colspan="7" class="p-4 text-center text-slate-500">Sin actividades.</td></tr>';
}

/* ---- Acciones con protección de presupuesto ---- */
async function addArea(){
  const cc=document.getElementById('na-cc').value, nom=(document.getElementById('na-nombre').value||'').trim().toUpperCase();
  if(!nom){ alert('Ingrese el nombre del área'); return; }
  await supabase.from('areas').insert({centro_costo_id:cc, nombre:nom, activo:true});
  document.getElementById('na-nombre').value=''; renderAdmin();
}
async function addAct(){
  const reg={ area_id:document.getElementById('naa-area').value, codigo:(document.getElementById('naa-codigo').value||'').trim(),
    nombre:(document.getElementById('naa-nombre').value||'').trim(), unidad_medida:(document.getElementById('naa-um').value||'').trim(),
    oei:document.getElementById('naa-oei').value, aei:document.getElementById('naa-aei').value, anio:ADM.anio, activo:true };
  if(!reg.area_id||!reg.codigo||!reg.nombre){ alert('Área, código y nombre son obligatorios'); return; }
  await supabase.from('actividades_operativas').insert(reg);
  renderAdmin();
}
async function toggleArea(id, estabaInactiva){
  const a=AREAS.find(x=>x.id===id); const acts=ADM.acts.filter(x=>x.area_id===id);
  if(!estabaInactiva && acts.some(x=>actConPres(x.id))){ alert('⚠️ No se puede desactivar: el área tiene actividades con presupuesto asignado.'); return; }
  await supabase.from('areas').update({activo: estabaInactiva?true:false}).eq('id',id); renderAdmin();
}
async function delArea(id){
  const acts=ADM.acts.filter(x=>x.area_id===id);
  if(acts.length){ alert('⚠️ No se puede eliminar: el área tiene actividades asociadas.'); return; }
  if(acts.some(x=>actConPres(x.id))){ alert('⚠️ No se puede eliminar: el área tiene presupuesto asignado.'); return; }
  if(!confirm('¿Eliminar el área?')) return;
  await supabase.from('areas').delete().eq('id',id); renderAdmin();
}
async function toggleAct(id, estabaInactiva){
  if(!estabaInactiva && actConPres(id)){ alert('⚠️ No se puede desactivar: la actividad tiene presupuesto asignado.'); return; }
  await supabase.from('actividades_operativas').update({activo: estabaInactiva?true:false}).eq('id',id); renderActs();
}
async function delAct(id){
  if(actConPres(id)){ alert('⚠️ No se puede eliminar: la actividad tiene presupuesto asignado.'); return; }
  if(!confirm('¿Eliminar la actividad?')) return;
  await supabase.from('actividades_operativas').delete().eq('id',id); renderActs();
}

/* ---- Edición ---- */
function openEditArea(id){
  const a=AREAS.find(x=>x.id===id);
  showModal(`<h3 class="font-bold mb-3">✏️ Editar Área</h3>
    <label class="text-sm text-slate-600">Nombre</label>
    <input id="ea-nombre" class="w-full border rounded-lg px-3 py-2 mb-3" value="${a.nombre}">
    <div class="flex justify-end gap-2"><button class="bg-slate-500 text-white px-4 py-2 rounded-lg" onclick="closeModal()">Cancelar</button>
    <button class="bg-blue-700 text-white px-4 py-2 rounded-lg" onclick="saveArea('${id}')">Guardar</button></div>`);
}
async function saveArea(id){
  await supabase.from('areas').update({nombre:document.getElementById('ea-nombre').value.trim().toUpperCase()}).eq('id',id);
  closeModal(); renderAdmin();
}
function openEditAct(id){
  const a=ADM.acts.find(x=>x.id===id);
  showModal(`<h3 class="font-bold mb-3">✏️ Editar Actividad</h3>
    <label class="text-sm text-slate-600">Nombre</label><input id="ea-nombre" class="w-full border rounded-lg px-3 py-2 mb-2" value="${a.nombre}">
    <label class="text-sm text-slate-600">Unidad de medida</label><input id="ea-um" class="w-full border rounded-lg px-3 py-2 mb-2" value="${a.unidad_medida||''}">
    <label class="text-sm text-slate-600">OEI</label><select id="ea-oei" class="w-full border rounded-lg px-3 py-2 mb-2" onchange="document.getElementById('ea-aei').innerHTML=AEI_OPTS(this.value)">${OEI_OPTS()}</select>
    <label class="text-sm text-slate-600">AEI</label><select id="ea-aei" class="w-full border rounded-lg px-3 py-2 mb-3">${AEI_OPTS(a.oei)}</select>
    <div class="flex justify-end gap-2"><button class="bg-slate-500 text-white px-4 py-2 rounded-lg" onclick="closeModal()">Cancelar</button>
    <button class="bg-blue-700 text-white px-4 py-2 rounded-lg" onclick="saveAct('${id}')">Guardar</button></div>`);
  document.getElementById('ea-oei').value=a.oei||''; document.getElementById('ea-aei').value=a.aei||'';
}
async function saveAct(id){
  await supabase.from('actividades_operativas').update({
    nombre:document.getElementById('ea-nombre').value.trim(), unidad_medida:document.getElementById('ea-um').value.trim(),
    oei:document.getElementById('ea-oei').value, aei:document.getElementById('ea-aei').value }).eq('id',id);
  closeModal(); renderAdmin();
}
function showModal(html){ const m=document.getElementById('adm-modal'); document.getElementById('adm-modal-body').innerHTML=html; m.classList.remove('hidden'); m.classList.add('flex'); }
function closeModal(){ const m=document.getElementById('adm-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }

async function abrirNuevoAnio(){
  const nuevo=ADM.anio+1;
  if(!confirm('Se abrirá el año '+nuevo+' copiando el catálogo del año '+ADM.anio+'. ¿Continuar?')) return;
  const copias=ADM.acts.map(r=>({area_id:r.area_id,codigo:r.codigo,nombre:r.nombre,unidad_medida:r.unidad_medida,oei:r.oei,aei:r.aei,anio:nuevo,activo:true}));
  if(copias.length) await supabase.from('actividades_operativas').insert(copias);
  await supabase.from('anios').upsert({anio:nuevo},{onConflict:'anio'});
  ADM.anio=nuevo; localStorage.setItem('poi_anio',nuevo); renderAdmin();
}
