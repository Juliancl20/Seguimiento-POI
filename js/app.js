let SESION = null, PERFIL = null, CENTROS = [], AREAS = [], AOIS = [];
const fmt = n => Number(n || 0).toLocaleString('es-PE', { maximumFractionDigits: 2 });
const nombreArea = id => (AREAS.find(a => a.id === id) || {}).nombre || '';
const centroDeArea = id => {
  const a = AREAS.find(x => x.id === id) || {};
  return (CENTROS.find(c => c.id === a.centro_costo_id) || {}).nombre || '';
};

document.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
  SESION = await requerirSesion();
  if (!SESION) return;
  document.getElementById('usuario-email').textContent = SESION.user.email;

  const [c, a, o, p] = await Promise.all([
    supabase.from('centros_costos').select('*').order('codigo'),
    supabase.from('areas').select('*').order('nombre'),
    supabase.from('actividades_operativas').select('*').order('codigo'),
    supabase.from('profiles').select('*').eq('id', SESION.user.id).maybeSingle()
  ]);
  CENTROS = c.data || []; AREAS = a.data || []; AOIS = o.data || [];
  PERFIL = p || { rol: 'consulta', area_id: null, centro_costo_id: null };

  aplicarPermisos();
  renderInicio();
  llenarSelectAreas();
  llenarSelectCentrosCosto();

  document.querySelectorAll('[data-tab]').forEach(b =>
    b.addEventListener('click', () => cambiarTab(b.dataset.tab)));
  document.getElementById('btn-cerrar').addEventListener('click', cerrarSesion);
  document.getElementById('sel-area-reg').addEventListener('change', cargarAOIsDeArea);
  document.getElementById('sel-aoi-reg').addEventListener('change', cargarEjecucionExistente);
  document.getElementById('reg-mes').addEventListener('change', cargarEjecucionExistente);
  document.getElementById('form-registro').addEventListener('submit', guardarEjecucion);
  document.getElementById('sel-cc-mod').addEventListener('change', cargarModificacionExistente);
  document.getElementById('mod-mes').addEventListener('change', cargarModificacionExistente);
  document.getElementById('form-modificaciones').addEventListener('submit', guardarModificacion);
  document.getElementById('btn-reporte').addEventListener('click', generarReporte);
  generarReporte();
}

function aplicarPermisos() {
  const rol = PERFIL.rol;
  const tabReg = document.querySelector('[data-tab="registro"]');
  const tabMod = document.querySelector('[data-tab="modificaciones"]');
  if (rol === 'usuario_area') {
    tabMod.style.display = 'none';
    AREAS = AREAS.filter(a => a.id === PERFIL.area_id);
  } else if (rol === 'usuario_cc') {
    tabReg.style.display = 'none';
  } else if (rol === 'consulta') {
    tabReg.style.display = 'none';
    tabMod.style.display = 'none';
  }
}

function cambiarTab(nombre) {
  ['inicio','registro','modificaciones','reportes'].forEach(t =>
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

function llenarSelectAreas() {
  const sel = document.getElementById('sel-area-reg');
  if (!sel) return;
  sel.innerHTML = AREAS.map(a => `<option value="${a.id}">${a.nombre} — ${centroDeArea(a.id)}</option>`).join('');
  cargarAOIsDeArea();
}

function llenarSelectCentrosCosto() {
  const sel = document.getElementById('sel-cc-mod');
  if (!sel) return;
  let lista = CENTROS;
  if (PERFIL.rol === 'usuario_cc') lista = CENTROS.filter(c => c.id === PERFIL.centro_costo_id);
  sel.innerHTML = lista.map(c => `<option value="${c.id}">${c.codigo} — ${c.nombre}</option>`).join('');
  cargarModificacionExistente();
}

function cargarAOIsDeArea() {
  const areaId = document.getElementById('sel-area-reg').value;
  const aois = AOIS.filter(o => o.area_id === areaId);
  document.getElementById('sel-aoi-reg').innerHTML =
    aois.map(o => `<option value="${o.id}">${o.codigo} — ${o.nombre}</option>`).join('');
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
  if (error) {
    msg.textContent = '❌ Error: ' + error.message;
    msg.className = 'text-sm text-red-600';
  } else {
    msg.textContent = '✅ Ejecución guardada correctamente.';
    msg.className = 'text-sm text-green-700';
  }
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
  if (error) {
    msg.textContent = '❌ Error: ' + error.message;
    msg.className = 'text-sm text-red-600';
  } else {
    msg.textContent = '✅ Modificaciones guardadas correctamente.';
    msg.className = 'text-sm text-green-700';
  }
}

async function generarReporte() {
  const anio = parseInt(document.getElementById('rep-anio').value);
  const mes = parseInt(document.getElementById('rep-mes').value);
  const [p, e] = await Promise.all([
    supabase.from('programacion_metas').select('*').eq('anio', anio).lte('mes', mes),
    supabase.from('ejecucion_mensual').select('*').eq('anio', anio).lte('mes', mes)
  ]);
  const prog = p.data || [], ejec = e.data || [];
  let html = '', tm = 0, te = 0, tfp = 0, tfe = 0;

  AOIS.forEach(o => {
    const pr = prog.filter(x => x.actividad_id === o.id);
    const ej = ejec.filter(x => x.actividad_id === o.id);
    if (!pr.length && !ej.length) return;
    const metaAcum = pr.reduce((s, x) => s + Number(x.meta_fisica || 0), 0);
    const ejecAcum = ej.reduce((s, x) => s + Number(x.ejecucion_fisica || 0), 0);
    const finProg = pr.reduce((s, x) => s + Number(x.meta_financiera || 0), 0);
    const finEjec = ej.reduce((s, x) => s + Number(x.ejecucion_financiera || 0), 0);
    const pct = metaAcum > 0 ? (ejecAcum / metaAcum * 100) : 0;
    const clase = pct >= 90 ? 'sem-verde' : pct >= 50 ? 'sem-amarillo' : 'sem-rojo';
    tm += metaAcum; te += ejecAcum; tfp += finProg; tfe += finEjec;
    html += `<tr class="hover:bg-slate-50">
      <td class="p-2">${nombreArea(o.area_id)}</td>
      <td class="p-2">${o.codigo}</td>
      <td class="p-2">${o.unidad_medida || ''}</td>
      <td class="p-2 text-right">${fmt(metaAcum)}</td>
      <td class="p-2 text-right">${fmt(ejecAcum)}</td>
      <td class="p-2 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${clase}">${pct.toFixed(1)}%</span></td></tr>`;
  });

  document.getElementById('tabla-reporte').innerHTML = html ||
    '<tr><td colspan="6" class="p-4 text-center text-slate-500">Sin datos para el periodo seleccionado.</td></tr>';
  document.getElementById('kpi-fisico').textContent = tm > 0 ? (te / tm * 100).toFixed(1) + '%' : '—';
  document.getElementById('kpi-financiero').textContent = tfp > 0 ? (tfe / tfp * 100).toFixed(1) + '%' : '—';
}
