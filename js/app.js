let SESION = null, PERFIL = null, CENTROS = [], AREAS = [], AOIS = [], REPORTE = null, EDIT_USU = null, MODO_LECTURA_REG = false;
const fmt = n => Number(n || 0).toLocaleString('es-PE', { maximumFractionDigits: 2 });
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
const nombreArea = id => (AREAS.find(a => a.id === id) || {}).nombre || '';
const centroDeArea = id => {
  const a = AREAS.find(x => x.id === id) || {};
  return (CENTROS.find(c => c.id === a.centro_costo_id) || {});
};

document.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
  SESION = await requerirSesion();
  if (!SESION) return;

  const [c, a, o, p] = await Promise.all([
    supabase.from('centros_costos').select('*').order('codigo'),
    supabase.from('areas').select('*').order('nombre'),
    supabase.from('actividades_operativas').select('*').order('codigo'),
    supabase.from('profiles').select('*').eq('id', SESION.user.id).maybeSingle()
  ]);
  CENTROS = c.data || []; AREAS = a.data || []; AOIS = o.data || [];
  PERFIL = p.data || { rol: 'consulta', area_id: null, centro_costo_id: null, estado: 'activo' };

  if (PERFIL.estado && PERFIL.estado !== 'activo') {
    alert('Su usuario se encuentra ' + PERFIL.estado + '. Contacte al administrador.');
    await cerrarSesion();
    return;
  }

  document.getElementById('usuario-email').textContent = SESION.user.email + '  |  Rol: ' + PERFIL.rol;

  aplicarPermisos();
  construirUIReportes();
  if (PERFIL.rol === 'usuario_cc') {
    const rc = document.getElementById('rep-cc');
    if (rc) rc.value = PERFIL.centro_costo_id;
  }
  renderInicio();
  llenarSelectCCReg();
  llenarSelectCentrosCosto();
  llenarSelectsUsuario();
  if (PERFIL.rol === 'admin') cargarUsuarios();

  document.querySelectorAll('[data-tab]').forEach(b =>
    b.addEventListener('click', () => cambiarTab(b.dataset.tab)));
  document.getElementById('btn-cerrar').addEventListener('click', cerrarSesion);
  document.getElementById('sel-cc-reg').addEventListener('change', cargarAreasDeCC);
  document.getElementById('sel-area-reg').addEventListener('change', cargarAOIsDeArea);
  document.getElementById('sel-aoi-reg').addEventListener('change', cargarEjecucionExistente);
  document.getElementById('reg-anio').addEventListener('change', cargarEjecucionExistente);
  document.getElementById('reg-mes').addEventListener('change', cargarEjecucionExistente);
  document.getElementById('form-registro').addEventListener('submit', guardarEjecucion);
  document.getElementById('sel-cc-mod').addEventListener('change', cargarModificacionExistente);
  document.getElementById('mod-mes').addEventListener('change', cargarModificacionExistente);
  document.getElementById('form-modificaciones').addEventListener('submit', guardarModificacion);
  document.getElementById('form-usuario').addEventListener('submit', guardarUsuario);
  document.getElementById('btn-usu-cancelar').addEventListener('click', cancelarEdicion);
  document.getElementById('btn-reporte').addEventListener('click', generarReporte);
  document.getElementById('btn-excel').addEventListener('click', exportarExcel);
  document.getElementById('btn-pdf').addEventListener('click', exportarPDF);
  generarReporte();
}

function aplicarPermisos() {
  const rol = PERFIL.rol;
  const tabReg = document.querySelector('[data-tab="registro"]');
  const tabMod = document.querySelector('[data-tab="modificaciones"]');
  const tabUsu = document.querySelector('[data-tab="usuarios"]');
  if (rol !== 'admin') tabUsu.style.display = 'none';

  if (rol === 'usuario_area') {
    tabMod.style.display = 'none';
    AREAS = AREAS.filter(a => a.id === PERFIL.area_id);
    AOIS = AOIS.filter(o => o.area_id === PERFIL.area_id);
  } else if (rol === 'usuario_cc') {
    MODO_LECTURA_REG = true;
    AREAS = AREAS.filter(a => a.centro_costo_id === PERFIL.centro_costo_id);
    AOIS = AOIS.filter(o => AREAS.some(a => a.id === o.area_id));
  } else if (rol === 'consulta') {
    tabReg.style.display = 'none';
    tabMod.style.display = 'none';
  }

  if (MODO_LECTURA_REG) {
    ['reg-fisica','reg-financiera','reg-logros','reg-limitaciones','reg-medidas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });
    const btn = document.querySelector('#form-registro button[type="submit"]');
    if (btn) btn.style.display = 'none';
    const nota = document.createElement('p');
    nota.className = 'text-sm text-amber-700 bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4';
    nota.textContent = '👁️ Modo consulta: usted visualiza el seguimiento mensual de las áreas de su Centro de Costos.';
    document.getElementById('form-registro').prepend(nota);
  }
}

function cambiarTab(nombre) {
  ['inicio','registro','modificaciones','usuarios','reportes'].forEach(t =>
    document.getElementById('tab-' + t).classList.toggle('hidden', t !== nombre));
  document.querySelectorAll('[data-tab]').forEach(b =>
    b.classList.toggle('tab-activa', b.dataset.tab === nombre));
}

function renderInicio() {
  document.getElementById('card-centros').textContent = CENTROS.length;
  document.getElementById('card-areas').textContent = AREAS.length;
  document.getElementById('card-aois').textContent = AOIS.length;
  let html = '';
  CENTROS.forEach(c => {
    AREAS.filter(a => a.centro_costo_id === c.id).forEach(a => {
      AOIS.filter(o => o.area_id === a.id).forEach(o => {
        html += `<tr class="hover:bg-slate-50">
          <td class="p-2">${c.codigo}</td><td class="p-2">${c.nombre}</td>
          <td class="p-2">${a.nombre}</td><td class="p-2">${o.codigo}</td>
          <td class="p-2">${o.nombre}</td></tr>`;
      });
    });
  });
  document.getElementById('tabla-catalogo').innerHTML = html;
}

function llenarSelectCCReg() {
  const sel = document.getElementById('sel-cc-reg');
  if (!sel) return;
  let lista = CENTROS;
  if (PERFIL.rol !== 'admin') lista = CENTROS.filter(c => c.id === PERFIL.centro_costo_id);
  sel.innerHTML = lista.map(c => `<option value="${c.id}">${c.codigo} — ${c.nombre}</option>`).join('');
  cargarAreasDeCC();
}

function cargarAreasDeCC() {
  const ccId = document.getElementById('sel-cc-reg').value;
  const areas = AREAS.filter(a => a.centro_costo_id === ccId);
  document.getElementById('sel-area-reg').innerHTML =
    areas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('') || '<option value="">Sin áreas</option>';
  cargarAOIsDeArea();
}

function cargarAOIsDeArea() {
  const areaId = document.getElementById('sel-area-reg').value;
  const aois = AOIS.filter(o => o.area_id === areaId);
  document.getElementById('sel-aoi-reg').innerHTML =
    aois.map(o => `<option value="${o.id}">${o.codigo} — ${o.nombre}</option>`).join('') || '<option value="">Sin AOI</option>';
  cargarEjecucionExistente();
}

async function cargarEjecucionExistente() {
  const aoiId = document.getElementById('sel-aoi-reg').value;
  if (!aoiId) return;
  const anio = parseInt(document.getElementById('reg-anio').value);
  const mes = parseInt(document.getElementById('reg-mes').value);
  const { data } = await supabase.from('ejecucion_mensual')
    .select('*').eq('actividad_id', aoiId).eq('anio', anio).eq('mes', mes).maybeSingle();
  document.getElementById('reg-fisica').value = data ? data.ejecucion_fisica : '';
  document.getElementById('reg-financiera').value = data ? data.ejecucion_financiera : '';
  document.getElementById('reg-logros').value = data ? (data.logros || '') : '';
  document.getElementById('reg-limitaciones').value = data ? (data.limitaciones || '') : '';
  document.getElementById('reg-medidas').value = data ? (data.medidas_adoptadas || '') : '';
}

async function guardarEjecucion(e) {
  e.preventDefault();
  if (MODO_LECTURA_REG) return;
  const msg = document.getElementById('msg-registro');
  const registro = {
    actividad_id: document.getElementById('sel-aoi-reg').value,
    anio: parseInt(document.getElementById('reg-anio').value),
    mes: parseInt(document.getElementById('reg-mes').value),
    ejecucion_fisica: parseFloat(document.getElementById('reg-fisica').value) || 0,
    ejecucion_financiera: parseFloat(document.getElementById('reg-financiera').value) || 0,
    logros: document.getElementById('reg-logros').value,
    limitaciones: document.getElementById('reg-limitaciones').value,
    medidas_adoptadas: document.getElementById('reg-medidas').value,
    estado: 'enviado',
    usuario_id: SESION.user.id,
    fecha_envio: new Date().toISOString()
  };
  const { error } = await supabase.from('ejecucion_mensual')
    .upsert(registro, { onConflict: 'actividad_id,anio,mes' });
  msg.classList.remove('hidden');
  msg.textContent = error ? '❌ Error: ' + error.message : '✅ Seguimiento guardado correctamente.';
  msg.className = 'text-sm ' + (error ? 'text-red-600' : 'text-green-700');
}

function llenarSelectCentrosCosto() {
  const sel = document.getElementById('sel-cc-mod');
  if (!sel) return;
  let lista = CENTROS;
  if (PERFIL.rol === 'usuario_cc') lista = CENTROS.filter(c => c.id === PERFIL.centro_costo_id);
  sel.innerHTML = lista.map(c => `<option value="${c.id}">${c.codigo} — ${c.nombre}</option>`).join('');
  cargarModificacionExistente();
}

async function cargarModificacionExistente() {
  const ccId = document.getElementById('sel-cc-mod').value;
  if (!ccId) return;
  const anio = parseInt(document.getElementById('mod-anio').value);
  const mes = parseInt(document.getElementById('mod-mes').value);
  const { data } = await supabase.from('modificaciones_mensuales_cc')
    .select('*').eq('centro_costo_id', ccId).eq('anio', anio).eq('mes', mes).maybeSingle();
  document.getElementById('mod-pia').value = data ? data.pia : '';
  document.getElementById('mod-pim').value = data ? data.pim : '';
  document.getElementById('mod-comentario').value = data ? (data.comentario || '') : '';
}

async function guardarModificacion(e) {
  e.preventDefault();
  const msg = document.getElementById('msg-mod');
  const registro = {
    centro_costo_id: document.getElementById('sel-cc-mod').value,
    anio: parseInt(document.getElementById('mod-anio').value),
    mes: parseInt(document.getElementById('mod-mes').value),
    pia: parseFloat(document.getElementById('mod-pia').value) || 0,
    pim: parseFloat(document.getElementById('mod-pim').value) || 0,
    comentario: document.getElementById('mod-comentario').value,
    usuario_id: SESION.user.id,
    fecha_registro: new Date().toISOString()
  };
  const { error } = await supabase.from('modificaciones_mensuales_cc')
    .upsert(registro, { onConflict: 'centro_costo_id,anio,mes' });
  msg.classList.remove('hidden');
  msg.textContent = error ? '❌ Error: ' + error.message : '✅ Modificaciones guardadas correctamente.';
  msg.className = 'text-sm ' + (error ? 'text-red-600' : 'text-green-700');
}

function llenarSelectsUsuario() {
  const sa = document.getElementById('usu-area');
  const sc = document.getElementById('usu-cc');
  if (!sa || !sc) return;
  sa.innerHTML = '<option value="">—</option>' + AREAS.map(a => `<option value="${a.id}">${a.nombre} — ${centroDeArea(a.id).nombre || ''}</option>`).join('');
  sc.innerHTML = '<option value="">—</option>' + CENTROS.map(c => `<option value="${c.id}">${c.codigo} — ${c.nombre}</option>`).join('');
}

async function cargarUsuarios() {
  const { data } = await supabase.from('profiles').select('*').order('email');
  const rows = (data || []).map(p => {
    const area = AREAS.find(a => a.id === p.area_id);
    const cc = CENTROS.find(c => c.id === p.centro_costo_id);
    const asign = area ? area.nombre : (cc ? cc.codigo + ' ' + cc.nombre : '—');
    const est = p.estado || 'activo';
    const cls = est === 'activo' ? 'sem-verde' : (est === 'inactivo' ? 'sem-amarillo' : 'sem-rojo');
    const yo = p.id === SESION.user.id ? ' (usted)' : '';
    return `<tr class="hover:bg-slate-50">
      <td class="p-2">${p.nombres || ''}${yo}</td>
      <td class="p-2">${p.email}</td>
      <td class="p-2">${p.rol}</td>
      <td class="p-2">${asign}</td>
      <td class="p-2 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${cls}">${est}</span></td>
      <td class="p-2 whitespace-nowrap">
        <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded" onclick="editarUsuario('${p.id}')">✏️ Reasignar</button>
        <button class="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2 py-1 rounded" onclick="toggleEstado('${p.id}')">${est === 'activo' ? '🚫 Desactivar' : '✅ Activar'}</button>
        <button class="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded" onclick="eliminarUsuario('${p.id}')">🗑️ Eliminar</button>
      </td></tr>`;
  }).join('');
  document.getElementById('tabla-usuarios').innerHTML = rows || '<tr><td colspan="6" class="p-4 text-center text-slate-500">Sin usuarios.</td></tr>';
}

async function guardarUsuario(e) {
  e.preventDefault();
  const msg = document.getElementById('msg-usu');
  msg.classList.remove('hidden');
  const nombres = document.getElementById('usu-nombres').value;
  const email = document.getElementById('usu-email').value;
  const rol = document.getElementById('usu-rol').value;
  let area_id = document.getElementById('usu-area').value || null;
  let centro_costo_id = document.getElementById('usu-cc').value || null;
  if (!centro_costo_id && area_id) {
    const ar = AREAS.find(a => a.id === area_id);
    if (ar) centro_costo_id = ar.centro_costo_id;
  }

  if (EDIT_USU) {
    const { error } = await supabase.from('profiles').update({ nombres, rol, area_id, centro_costo_id }).eq('id', EDIT_USU);
    msg.textContent = error ? '❌ Error: ' + error.message : '✅ Usuario reasignado correctamente.';
    msg.className = 'text-sm ' + (error ? 'text-red-600' : 'text-green-700');
    cancelarEdicion();
  } else {
    const password = document.getElementById('usu-password').value;
    if (!email || !password) { msg.textContent = '❌ Complete correo y contraseña.'; msg.className = 'text-sm text-red-600'; return; }
    const tmp = window.crearCliente({ auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await tmp.auth.signUp({ email, password, options: { data: { nombres } } });
    if (error) { msg.textContent = '❌ Error al crear: ' + error.message; msg.className = 'text-sm text-red-600'; return; }
    const { error: e2 } = await supabase.from('profiles').update({ nombres, rol, area_id, centro_costo_id, estado: 'activo' }).eq('id', data.user.id);
    msg.textContent = e2 ? '❌ Error al asignar rol: ' + e2.message : '✅ Usuario creado y asignado correctamente.';
    msg.className = 'text-sm ' + (e2 ? 'text-red-600' : 'text-green-700');
    document.getElementById('usu-password').value = '';
  }
  cargarUsuarios();
}

async function editarUsuario(id) {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!data) return;
  EDIT_USU = id;
  document.getElementById('usu-nombres').value = data.nombres || '';
  document.getElementById('usu-email').value = data.email;
  document.getElementById('usu-rol').value = data.rol;
  document.getElementById('usu-area').value = data.area_id || '';
  document.getElementById('usu-cc').value = data.centro_costo_id || '';
  document.getElementById('btn-usu-guardar').textContent = '💾 Guardar cambios';
  document.getElementById('btn-usu-cancelar').classList.remove('hidden');
}

function cancelarEdicion() {
  EDIT_USU = null;
  document.getElementById('form-usuario').reset();
  document.getElementById('btn-usu-guardar').textContent = '➕ Crear usuario';
  document.getElementById('btn-usu-cancelar').classList.add('hidden');
}

async function toggleEstado(id) {
  if (id === SESION.user.id) { alert('No puede desactivar su propio usuario.'); return; }
  const { data } = await supabase.from('profiles').select('estado').eq('id', id).maybeSingle();
  if (!data) return;
  const nuevo = (data.estado === 'activo') ? 'inactivo' : 'activo';
  await supabase.from('profiles').update({ estado: nuevo }).eq('id', id);
  cargarUsuarios();
}

async function eliminarUsuario(id) {
  if (id === SESION.user.id) { alert('No puede eliminar su propio usuario.'); return; }
  if (!confirm('Se eliminará el usuario (perderá el acceso al sistema). ¿Desea continuar?')) return;
  await supabase.from('profiles').update({ estado: 'eliminado', rol: 'consulta', area_id: null, centro_costo_id: null }).eq('id', id);
  cargarUsuarios();
}

function construirUIReportes() {
  const hoy = new Date();
  document.getElementById('tab-reportes').innerHTML = `
    <div class="bg-white rounded-xl shadow p-6 mb-4 no-print">
      <h2 class="text-lg font-bold text-slate-800 mb-4">📈 Reportes de Ejecución Física y Financiera</h2>
      <div class="flex flex-wrap gap-4 items-end">
        <div><label class="text-sm font-medium text-slate-600">Año</label><input id="rep-anio" type="number" value="${hoy.getFullYear()}" class="w-full border rounded-lg px-3 py-2"></div>
        <div><label class="text-sm font-medium text-slate-600">Mes de corte</label><select id="rep-mes" class="w-full border rounded-lg px-3 py-2">${MESES.slice(1).map((m,i)=>`<option value="${i+1}" ${i+1===hoy.getMonth()+1?'selected':''}>${m}</option>`).join('')}</select></div>
        <div><label class="text-sm font-medium text-slate-600">Centro de Costos</label><select id="rep-cc" class="w-full border rounded-lg px-3 py-2"><option value="">Todos</option>${CENTROS.map(c=>`<option value="${c.id}">${c.codigo} — ${c.nombre}</option>`).join('')}</select></div>
        <button id="btn-reporte" class="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg">Generar</button>
        <button id="btn-excel" class="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2.5 rounded-lg">⬇️ Excel</button>
        <button id="btn-pdf" class="bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-lg">🖨️ PDF</button>
      </div>
    </div>
    <div id="zona-imprimir">
      <h2 class="text-lg font-bold text-slate-800 mb-1">Seguimiento POI — Programa Nuestras Ciudades</h2>
      <p class="text-sm text-slate-500 mb-4" id="rep-periodo"></p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div class="bg-white rounded-xl shadow p-5 text-center"><p class="text-2xl font-bold text-blue-700" id="kpi-fisico">—</p><p class="text-sm text-slate-500">% Avance físico acumulado</p></div>
        <div class="bg-white rounded-xl shadow p-5 text-center"><p class="text-2xl font-bold text-blue-700" id="kpi-financiero">—</p><p class="text-sm text-slate-500">% Ejecución financiera acumulada</p></div>
        <div class="bg-white rounded-xl shadow p-5 text-center"><p class="text-2xl font-bold text-blue-700" id="kpi-pim">—</p><p class="text-sm text-slate-500">PIM al corte (S/)</p></div>
      </div>
      <div class="bg-white rounded-xl shadow overflow-x-auto mb-6">
        <table class="w-full text-sm"><thead class="bg-slate-800 text-white"><tr>
          <th class="p-2 text-left">C. Costo</th><th class="p-2 text-left">Área / AOI</th><th class="p-2">Unidad</th>
          <th class="p-2 text-right">Meta Mes</th><th class="p-2 text-right">Ejec. Mes</th><th class="p-2">% Mes</th>
          <th class="p-2 text-right">Meta Acum.</th><th class="p-2 text-right">Ejec. Acum.</th><th class="p-2">% Acum.</th>
        </tr></thead><tbody id="tabla-reporte" class="divide-y"></tbody></table>
      </div>
      <div class="bg-white rounded-xl shadow overflow-x-auto mb-6">
        <h3 class="p-3 font-bold text-slate-700">💰 Ejecución Financiera por Centro de Costos</h3>
        <table class="w-full text-sm"><thead class="bg-slate-800 text-white"><tr>
          <th class="p-2 text-left">Centro de Costos</th><th class="p-2 text-right">PIA (S/)</th><th class="p-2 text-right">PIM (S/)</th><th class="p-2 text-right">% Var.</th><th class="p-2 text-right">Devengado Acum. (S/)</th><th class="p-2">% Ejec.</th>
        </tr></thead><tbody id="tabla-fin" class="divide-y"></tbody></table>
      </div>
      <div id="zona-mods" class="mb-6"></div>
    </div>`;
}

async function generarReporte() {
  const anio = parseInt(document.getElementById('rep-anio').value);
  const mes = parseInt(document.getElementById('rep-mes').value);
  const ccFiltro = document.getElementById('rep-cc').value;
  const [p, e, m] = await Promise.all([
    supabase.from('programacion_metas').select('*').eq('anio', anio).lte('mes', mes),
    supabase.from('ejecucion_mensual').select('*').eq('anio', anio).lte('mes', mes),
    supabase.from('modificaciones_mensuales_cc').select('*').eq('anio', anio).lte('mes', mes)
  ]);
  const prog = p.data || [], ejec = e.data || [], mods = m.data || [];

  let aoisRep = AOIS;
  if (ccFiltro) {
    const areasCC = AREAS.filter(a => a.centro_costo_id === ccFiltro).map(a => a.id);
    aoisRep = AOIS.filter(o => areasCC.includes(o.area_id));
  }

  const filas = [];
  let tm = 0, te = 0;
  aoisRep.forEach(o => {
    const pr = prog.filter(x => x.actividad_id === o.id);
    const ej = ejec.filter(x => x.actividad_id === o.id);
    if (!pr.length && !ej.length) return;
    const metaMes = pr.filter(x => x.mes === mes).reduce((s,x) => s + Number(x.meta_fisica||0), 0);
    const ejecMes = ej.filter(x => x.mes === mes).reduce((s,x) => s + Number(x.ejecucion_fisica||0), 0);
    const metaAcum = pr.reduce((s,x) => s + Number(x.meta_fisica||0), 0);
    const ejecAcum = ej.reduce((s,x) => s + Number(x.ejecucion_fisica||0), 0);
    const pctMes = metaMes > 0 ? ejecMes/metaMes*100 : 0;
    const pctAcum = metaAcum > 0 ? ejecAcum/metaAcum*100 : 0;
    tm += metaAcum; te += ejecAcum;
    const cc = centroDeArea(o.area_id);
    filas.push({ ccCodigo: cc.codigo || '', area: nombreArea(o.area_id), codigo: o.codigo, nombre: o.nombre, um: o.unidad_medida || '', metaMes, ejecMes, pctMes, metaAcum, ejecAcum, pctAcum });
  });

  document.getElementById('rep-periodo').textContent = 'Periodo: Enero – ' + MESES[mes] + ' ' + anio + (ccFiltro ? ' | ' + (CENTROS.find(c=>c.id===ccFiltro)||{}).nombre : ' | Todos los Centros de Costos');

  document.getElementById('tabla-reporte').innerHTML = filas.map(f => {
    const clase = f.pctAcum >= 90 ? 'sem-verde' : f.pctAcum >= 50 ? 'sem-amarillo' : 'sem-rojo';
    return `<tr class="hover:bg-slate-50">
      <td class="p-2">${f.ccCodigo}</td>
      <td class="p-2"><b>${f.area}</b><br><span class="text-xs text-slate-500">${f.codigo}</span></td>
      <td class="p-2">${f.um}</td>
      <td class="p-2 text-right">${fmt(f.metaMes)}</td>
      <td class="p-2 text-right">${fmt(f.ejecMes)}</td>
      <td class="p-2 text-center">${f.pctMes.toFixed(1)}%</td>
      <td class="p-2 text-right">${fmt(f.metaAcum)}</td>
      <td class="p-2 text-right">${fmt(f.ejecAcum)}</td>
      <td class="p-2 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${clase}">${f.pctAcum.toFixed(1)}%</span></td></tr>`;
  }).join('') || '<tr><td colspan="9" class="p-4 text-center text-slate-500">Sin datos para el periodo.</td></tr>';

  const ccsRep = ccFiltro ? CENTROS.filter(c => c.id === ccFiltro) : CENTROS;
  let tfpim = 0, tfdev = 0;
  const finFilas = ccsRep.map(c => {
    const mod = mods.filter(x => x.centro_costo_id === c.id).sort((a,b) => b.mes - a.mes)[0];
    const pia = mod ? Number(mod.pia||0) : 0;
    const pim = mod ? Number(mod.pim||0) : 0;
    const areasCC = AREAS.filter(a => a.centro_costo_id === c.id).map(a => a.id);
    const aoisCC = AOIS.filter(o => areasCC.includes(o.area_id)).map(o => o.id);
    const dev = ejec.filter(x => aoisCC.includes(x.actividad_id)).reduce((s,x) => s + Number(x.ejecucion_financiera||0), 0);
    const varPct = pia > 0 ? (pim-pia)/pia*100 : 0;
    const ejecPct = pim > 0 ? dev/pim*100 : 0;
    tfpim += pim; tfdev += dev;
    return { cc: c.codigo + ' — ' + c.nombre, pia, pim, varPct, dev, ejecPct };
  });

  document.getElementById('tabla-fin').innerHTML = finFilas.map(f => `<tr class="hover:bg-slate-50">
    <td class="p-2">${f.cc}</td>
    <td class="p-2 text-right">${fmt(f.pia)}</td>
    <td class="p-2 text-right">${fmt(f.pim)}</td>
    <td class="p-2 text-right">${f.varPct.toFixed(2)}%</td>
    <td class="p-2 text-right">${fmt(f.dev)}</td>
    <td class="p-2 text-center">${f.ejecPct.toFixed(1)}%</td></tr>`).join('');

  const modsMes = mods.filter(x => x.mes === mes);
  document.getElementById('zona-mods').innerHTML = '<h3 class="font-bold text-slate-700 mb-2">📝 Modificaciones Presupuestales — ' + MESES[mes] + ' ' + anio + '</h3>' +
    (modsMes.map(x => {
      const c = CENTROS.find(cc => cc.id === x.centro_costo_id) || {};
      return `<div class="bg-white rounded-xl shadow p-4 mb-3">
        <p class="font-bold text-slate-800">${c.codigo} — ${c.nombre} <span class="text-xs text-slate-500">(PIA S/ ${fmt(x.pia)} | PIM S/ ${fmt(x.pim)})</span></p>
        <p class="text-sm text-slate-600 mt-1 whitespace-pre-line">${x.comentario || 'Sin modificaciones registradas.'}</p></div>`;
    }).join('') || '<p class="text-sm text-slate-500">Sin modificaciones registradas en el mes.</p>');

  document.getElementById('kpi-fisico').textContent = tm > 0 ? (te/tm*100).toFixed(1) + '%' : '—';
  document.getElementById('kpi-financiero').textContent = tfpim > 0 ? (tfdev/tfpim*100).toFixed(1) + '%' : '—';
  document.getElementById('kpi-pim').textContent = fmt(tfpim);

  REPORTE = { anio, mes, filas, finFilas, modsMes };
}

function exportarExcel() {
  if (!REPORTE) { alert('Primero genere el reporte.'); return; }
  const q = t => '"' + String(t || '').replace(/"/g,'""') + '"';
  let csv = '\uFEFF';
  csv += 'SEGUIMIENTO POI - PROGRAMA NUESTRAS CIUDADES\n';
  csv += 'Periodo: Enero - ' + MESES[REPORTE.mes] + ' ' + REPORTE.anio + '\n\n';
  csv += 'EJECUCIÓN FÍSICA\n';
  csv += 'C.Costo;Área;AOI;Actividad;Unidad;Meta Mes;Ejec Mes;% Mes;Meta Acum;Ejec Acum;% Acum\n';
  REPORTE.filas.forEach(f => {
    csv += [f.ccCodigo, q(f.area), f.codigo, q(f.nombre), f.um, f.metaMes, f.ejecMes, f.pctMes.toFixed(1), f.metaAcum, f.ejecAcum, f.pctAcum.toFixed(1)].join(';') + '\n';
  });
  csv += '\nEJECUCIÓN FINANCIERA POR CENTRO DE COSTOS\n';
  csv += 'Centro de Costos;PIA;PIM;% Variación;Devengado Acum;% Ejecución\n';
  REPORTE.finFilas.forEach(f => {
    csv += [q(f.cc), f.pia, f.pim, f.varPct.toFixed(2), f.dev, f.ejecPct.toFixed(1)].join(';') + '\n';
  });
  csv += '\nMODIFICACIONES PRESUPUESTALES - ' + MESES[REPORTE.mes].toUpperCase() + '\n';
  csv += 'Centro de Costos;PIA;PIM;Comentario\n';
  REPORTE.modsMes.forEach(x => {
    const c = CENTROS.find(cc => cc.id === x.centro_costo_id) || {};
    csv += [q(c.codigo + ' - ' + c.nombre), x.pia, x.pim, q(x.comentario)].join(';') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Reporte_POI_' + REPORTE.anio + '_' + String(REPORTE.mes).padStart(2,'0') + '.csv';
  a.click();
}

function exportarPDF() {
  if (!document.getElementById('css-print')) {
    const st = document.createElement('style');
    st.id = 'css-print';
    st.innerHTML = '@media print { header, nav, .no-print { display: none !important; } main { max-width: 100% !important; padding: 0 !important; } section { display: none !important; } #tab-reportes { display: block !important; } table { font-size: 10px; } .bg-white { box-shadow: none !important; } }';
    document.head.appendChild(st);
  }
  window.print();
}
// ============ GUÍA 6: WORD (IMPORTAR INFORME / EXPORTAR EJECUTIVO) ============
const MES_IDX = {enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,setiembre:9,septiembre:9,octubre:10,noviembre:11,diciembre:12};

function parsearInformeWord(texto){
  const lineas = texto.split(/\r?\n/);
  const comments = {}, modifs = {};
  let curCC=null, curSection=null, curAOI=null, curMes=null, buf=[];
  const limpiar = s => s.replace(/\s+/g,' ').trim();
  const flush = () => {
    const txt = buf.join(' ').trim(); buf=[];
    if(!txt) return;
    if(curSection==='modificaciones'){ if(curCC&&curMes) (modifs[curCC]=modifs[curCC]||{})[curMes]=txt; }
    else if(['logros','limitaciones','medidas'].includes(curSection) && curAOI && curMes){
      const c=(comments[curAOI]=comments[curAOI]||{});
      (c[curMes]=c[curMes]||{})[curSection]=txt;
    }
  };
  for(const raw of lineas){
    const s=limpiar(raw); if(!s) continue;
    const mcc=s.match(/CENTRO DE COSTOS?\.?\s*(03\.07(?:\.\d+)?)/i);
    if(mcc){flush(); curCC=mcc[1]; curSection=null; curAOI=null; curMes=null; continue;}
    if(/PRINCIPALES LOGROS/i.test(s)){flush(); curSection='logros'; curAOI=null; curMes=null; continue;}
    if(/LIMITACIONES/i.test(s)){flush(); curSection='limitaciones'; curAOI=null; curMes=null; continue;}
    if(/MEDIDAS ADOPTADAS/i.test(s)){flush(); curSection='medidas'; curAOI=null; curMes=null; continue;}
    if(/\bMODIFICACIONES\b/i.test(s)){flush(); curSection='modificaciones'; curAOI=null; curMes=null; continue;}
    if(/RESUMEN EJECUTIVO/i.test(s)){flush(); curSection='resumen'; continue;}
    const ma=s.match(/AOI\s*([0-9]{8,})/i);
    if(ma){flush(); curAOI='AOI'+ma[1]; curMes=null; continue;}
    const low=s.toLowerCase();
    if(MES_IDX[low] && s.length<=12){flush(); curMes=MES_IDX[low]; continue;}
    if(['logros','limitaciones','medidas','modificaciones'].includes(curSection)) buf.push(s);
  }
  flush();
  return {comments, modifs};
}

async function importarInformeWord(file){
  const res = await window.mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()});
  const {comments, modifs} = parsearInformeWord(res.value||'');
  const anio = parseInt(document.getElementById('reg-anio').value||'2026',10);
  let nE=0, nM=0;
  for(const aoi of Object.keys(comments)){
    const {data: act} = await supabase.from('actividades_operativas').select('id').eq('codigo',aoi).eq('anio',anio).maybeSingle();
    if(!act) continue;
    for(const ms of Object.keys(comments[aoi])){
      const mes=+ms, c=comments[aoi][ms];
      const {data: ex} = await supabase.from('ejecucion_mensual').select('ejecucion_fisica, ejecucion_financiera').eq('actividad_id',act.id).eq('anio',anio).eq('mes',mes).maybeSingle();
      await supabase.from('ejecucion_mensual').upsert({
        actividad_id: act.id, anio, mes,
        ejecucion_fisica: ex? ex.ejecucion_fisica:0,
        ejecucion_financiera: ex? ex.ejecucion_financiera:0,
        logros: c.logros||'', limitaciones: c.limitaciones||'', medidas_adoptadas: c.medidas||'',
        estado:'enviado', usuario_id: SESION.user.id, fecha_envio: new Date().toISOString()
      }, {onConflict:'actividad_id,anio,mes'});
      nE++;
    }
  }
  for(const cc of Object.keys(modifs)){
    const {data: ccRow} = await supabase.from('centros_costos').select('id').eq('codigo',cc).maybeSingle();
    if(!ccRow) continue;
    for(const ms of Object.keys(modifs[cc])){
      await supabase.from('modificaciones_mensuales_cc').upsert({
        centro_costo_id: ccRow.id, anio, mes:+ms, comentario: modifs[cc][ms], usuario_id: SESION.user.id
      }, {onConflict:'centro_costo_id,anio,mes'});
      nM++;
    }
  }
  alert('✅ Importación completada:\n• '+nE+' registros de seguimiento (logros/limitaciones/medidas)\n• '+nM+' notas de modificaciones por Centro de Costo.');
  location.reload();
}

async function exportarWord(){
  const anio=+document.getElementById('rep-anio').value;
  const mes=+document.getElementById('rep-mes').value;
  const {data: ejec} = await supabase.from('ejecucion_mensual')
    .select('mes, logros, limitaciones, medidas_adoptadas, actividades_operativas(codigo, nombre, areas(nombre, centros_costos(codigo, nombre)))')
    .eq('anio',anio).lte('mes',mes);
  const {data: mods} = await supabase.from('modificaciones_mensuales_cc')
    .select('mes, pia, pim, comentario, centros_costos(codigo, nombre)')
    .eq('anio',anio).lte('mes',mes);
  const porCC={};
  (ejec||[]).forEach(r=>{
    const act=r.actividades_operativas||{};
    const cc=(act.areas&&act.areas.centros_costos)||{};
    const cod=cc.codigo||'SIN CC';
    if(!porCC[cod]) porCC[cod]={nombre: cc.nombre||'', aois:{}};
    if(!porCC[cod].aois[act.codigo]) porCC[cod].aois[act.codigo]={nombre: act.nombre||'', meses:{}};
    porCC[cod].aois[act.codigo].meses[r.mes]=r;
  });
  let html='<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Arial;font-size:11pt;line-height:1.4}h1{font-size:16pt;text-align:center}h2{font-size:13pt;border-bottom:2px solid #C9A350;margin-top:14pt}h3{font-size:11pt;margin-top:10pt}p{text-align:justify}</style></head><body>';
  html+='<h1>Resumen Ejecutivo de Seguimiento mensual del POI (al mes de '+MESES[mes]+')</h1>';
  html+='<p style="text-align:center">PROGRAMA NUESTRAS CIUDADES<br>'+anio+'</p>';
  Object.keys(porCC).sort().forEach(cod=>{
    const g=porCC[cod];
    html+='<p><u><b>CENTRO DE COSTOS '+cod+' - '+(g.nombre||'').toUpperCase()+'</b></u></p>';
    html+='<h2>II. PRINCIPALES LOGROS</h2>';
    Object.keys(g.aois).forEach(aoi=>{ const a=g.aois[aoi];
      html+='<h3>'+aoi+': '+a.nombre+'</h3>';
      Object.keys(a.meses).sort((x,y)=>x-y).forEach(m=>{ html+='<p><b>'+MESES[m]+'</b><br>'+(a.meses[m].logros||'Sin registro.')+'</p>'; });
    });
    html+='<h2>III. LIMITACIONES</h2>';
    Object.keys(g.aois).forEach(aoi=>{ const a=g.aois[aoi];
      html+='<h3>'+aoi+': '+a.nombre+'</h3>';
      Object.keys(a.meses).sort((x,y)=>x-y).forEach(m=>{ html+='<p><b>'+MESES[m]+'</b><br>'+(a.meses[m].limitaciones||'Sin registro.')+'</p>'; });
    });
    html+='<h2>IV. MEDIDAS ADOPTADAS PARA CUMPLIR LAS METAS</h2>';
    Object.keys(g.aois).forEach(aoi=>{ const a=g.aois[aoi];
      html+='<h3>'+aoi+': '+a.nombre+'</h3>';
      Object.keys(a.meses).sort((x,y)=>x-y).forEach(m=>{ html+='<p><b>'+MESES[m]+'</b><br>'+(a.meses[m].medidas_adoptadas||'Sin registro.')+'</p>'; });
    });
    html+='<h2>V. MODIFICACIONES</h2>';
    (mods||[]).filter(x=>x.centros_costos&&x.centros_costos.codigo===cod).sort((a,b)=>a.mes-b.mes).forEach(x=>{
      html+='<p><b>'+MESES[x.mes]+'</b><br>PIA S/ '+Number(x.pia||0).toLocaleString('es-PE',{minimumFractionDigits:2})+' | PIM S/ '+Number(x.pim||0).toLocaleString('es-PE',{minimumFractionDigits:2})+'<br>'+(x.comentario||'')+'</p>';
    });
  });
  html+='</body></html>';
  const blob=new Blob(['\ufeff',html],{type:'application/msword'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='Reporte_Ejecutivo_POI_'+anio+'_al_'+MESES[mes]+'.doc'; a.click();
  URL.revokeObjectURL(a.href);
}

document.addEventListener('DOMContentLoaded', () => {
  const fw=document.getElementById('file-word');
  if(fw) fw.addEventListener('change', e=>{ const f=e.target.files[0]; if(f) importarInformeWord(f); e.target.value=''; });
  setTimeout(()=>{
    const bx=document.getElementById('btn-excel');
    const toolbar=bx? bx.parentElement : null;
    if(toolbar && !document.getElementById('btn-word')){
      const b=document.createElement('button');
      b.id='btn-word'; b.className='bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-4 py-2.5 rounded-lg';
      b.textContent='⬇️ Word';
      b.addEventListener('click', exportarWord);
      toolbar.appendChild(b);
    }
  }, 800);
});
