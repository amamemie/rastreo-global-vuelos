// Utilidades compartidas: formato por idioma, tema, mapa 3D (MapLibre) y acceso a datos.
const Radar = (() => {
  const { t } = I18n;
  const root = document.documentElement;
  const STATIC = root.dataset.static === '1';

  // ---------- Formato (según idioma activo) ----------
  const cache = {};
  const fmtr = (tipo, opts) => {
    const k = `${I18n.locale}|${tipo}`;
    if (!cache[k]) cache[k] = tipo === 'rel' ? new Intl.RelativeTimeFormat(I18n.locale, opts)
      : tipo.startsWith('dt') ? new Intl.DateTimeFormat(I18n.locale, opts)
      : new Intl.NumberFormat(I18n.locale, opts);
    return cache[k];
  };
  const n0 = (n) => fmtr('n0', { maximumFractionDigits: 0, useGrouping: 'always' }).format(n);
  const n2 = (n) => fmtr('n2', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const parseTs = (ts) => (ts ? new Date(ts.replace(' ', 'T')) : null);

  function hace(date) {
    if (!date) return '—';
    const rtf = fmtr('rel', { numeric: 'auto' });
    const s = Math.round((date - Date.now()) / 1000);
    if (Math.abs(s) < 60) return rtf.format(s, 'second');
    const m = Math.round(s / 60);
    if (Math.abs(m) < 60) return rtf.format(m, 'minute');
    const h = Math.round(m / 60);
    if (Math.abs(h) < 24) return rtf.format(h, 'hour');
    return rtf.format(Math.round(h / 24), 'day');
  }

  const fmt = {
    int: (n) => (n == null ? '—' : n0(n)),
    coord: (n) => (n == null ? '—' : n2(n)),
    alt: (m) => (m ? `${n0(m)} m` : t('ground')),
    vel: (ms) => (ms ? `${n0(ms * 3.6)} km/h` : '—'),
    rumbo: (d) => (d == null ? '—' : `${n0(d)}°`),
    fecha: (ts) => { const d = parseTs(ts); return d ? fmtr('dt-f', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d) : '—'; },
    hora: (d) => (d ? fmtr('dt-h', { hour: '2-digit', minute: '2-digit' }).format(d) : '—'),
  };

  // ---------- Tema ----------
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const tema = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
  const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setTema(nuevo, guardar = true) {
    root.dataset.theme = nuevo;
    if (guardar) { try { localStorage.setItem('radar-theme', nuevo); } catch (e) { /* sin almacenamiento */ } }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', css('--bg'));
    actualizarBotonTema();
    document.dispatchEvent(new CustomEvent('themechange', { detail: nuevo }));
  }
  function actualizarBotonTema() {
    const b = document.getElementById('theme-btn');
    if (b) b.setAttribute('aria-label', t(tema() === 'dark' ? 'theme.toLight' : 'theme.toDark'));
  }

  function altColor(alt, enTierra) {
    if (enTierra || !alt || alt < 300) return css('--alt-ground');
    if (alt < 4000) return css('--alt-low');
    if (alt < 9000) return css('--alt-mid');
    return css('--alt-high');
  }

  // ---------- Mapa 3D ----------
  const ESTILOS = {
    dark: 'https://tiles.openfreemap.org/styles/dark',
    light: 'https://tiles.openfreemap.org/styles/positron',
  };

  function aplicarCielo(map) {
    try {
      const dark = tema() === 'dark';
      map.setSky({
        'sky-color': dark ? '#16304f' : '#dfe8f5',
        'horizon-color': dark ? '#7fa6d6' : '#f4f7fb',
        'fog-color': dark ? '#2a4a72' : '#eef2f8',
        'sky-horizon-blend': 0.6,
        'horizon-fog-blend': 0.6,
        'fog-ground-blend': 0.4,
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
      });
    } catch (e) { /* cielo opcional */ }
  }

  // El estilo oscuro trae tierra y océano casi negros: se aclaran para que el planeta resalte sobre el fondo
  // Cara visible luminosa: océano azul medio, tierra gris azulada clara
  const TINTE_OSCURO = [
    ['background', 'background-color', '#5d6f86'],
    ['water', 'fill-color', '#24507f'],
    ['waterway', 'line-color', '#24507f'],
    ['landcover_ice_shelf', 'fill-color', '#8193a9'],
    ['landcover_glacier', 'fill-color', '#8a9bb0'],
    ['landcover_wood', 'fill-color', '#566a80'],
    ['landuse_park', 'fill-color', '#566a80'],
    ['landuse_residential', 'fill-color', '#64768c'],
    ['building', 'fill-color', '#6b7d93'],
    ['boundary_state', 'line-color', 'rgba(220, 230, 240, .25)'],
    ['boundary_country_z0-4', 'line-color', 'rgba(230, 238, 246, .55)'],
    ['boundary_country_z5-', 'line-color', 'rgba(230, 238, 246, .55)'],
  ];
  function tintarEstilo(map) {
    if (tema() !== 'dark') return;
    for (const [id, prop, color] of TINTE_OSCURO) {
      if (map.getLayer(id)) { try { map.setPaintProperty(id, prop, color); } catch (e) { /* capa sin esa propiedad */ } }
    }
    // Etiquetas claras con halo oscuro, legibles sobre el nuevo fondo
    for (const l of map.getStyle().layers) {
      if (l.type !== 'symbol' || !l.layout || !l.layout['text-field']) continue;
      try {
        map.setPaintProperty(l.id, 'text-color', l.id.startsWith('water') ? '#bcd3ee' : '#eef3f8');
        map.setPaintProperty(l.id, 'text-halo-color', 'rgba(14, 22, 34, .85)');
        map.setPaintProperty(l.id, 'text-halo-width', 1.2);
      } catch (e) { /* capa sin texto */ }
    }
  }

  // Zoom con el que el globo completo ocupa ~86 % del lado menor del mapa
  function zoomGlobo(el) {
    const lado = Math.max(240, Math.min(el.clientWidth, el.clientHeight));
    return Math.log2((0.86 * lado * Math.PI) / 512);
  }

  /** Crea un mapa con globo 3D centrado. onStyle(map) se llama cada vez que el estilo carga (también al cambiar de tema). */
  function crearMapa(container, { center = [-60, -15], zoom = null, pitch = 0, bearing = 0, intro = true, onStyle } = {}) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    const animar = intro && !reducido();
    const zFinal = zoom ?? zoomGlobo(el);
    const map = new maplibregl.Map({
      container: el,
      style: ESTILOS[tema()],
      center: animar ? [-20, 10] : center,
      zoom: animar ? zFinal - 0.9 : zFinal,
      pitch: 0,
      bearing: 0,
      maxPitch: 70,
      attributionControl: false,
      cooperativeGestures: false,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Datos/Data: <a href="https://opensky-network.org">OpenSky Network</a>' }), 'bottom-right');
    map.on('style.load', () => {
      try { map.setProjection({ type: 'globe' }); } catch (e) { /* mercator si no hay globo */ }
      aplicarCielo(map);
      tintarEstilo(map);
      if (!map.hasImage('plane')) map.addImage('plane', imagenAvion(), { sdf: true, pixelRatio: 2 });
      onStyle && onStyle(map);
    });
    map.once('load', () => {
      // Atribución plegada por defecto (se abre con el botón ⓘ)
      map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
      if (animar) map.flyTo({ center, zoom: zFinal, pitch, bearing, duration: 3000, curve: 1.2, essential: false });
      else if (pitch || bearing) map.jumpTo({ pitch, bearing });
    });
    document.addEventListener('themechange', () => map.setStyle(ESTILOS[tema()], { diff: false }));
    return map;
  }

  const PLANE_PATH = 'M12 2c.7 0 1.2.9 1.2 2v5.2l7.8 4.6v2l-7.8-2.4v4.9l2.3 1.7v1.6L12 20.6l-3.5 1v-1.6l2.3-1.7v-4.9L3 15.8v-2l7.8-4.6V4c0-1.1.5-2 1.2-2z';
  function imagenAvion() {
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.scale(s / 24, s / 24);
    g.fillStyle = '#fff';
    g.fill(new Path2D(PLANE_PATH));
    return g.getImageData(0, 0, s, s);
  }

  const aGeoJSON = (vuelos) => ({
    type: 'FeatureCollection',
    features: vuelos.filter((v) => v.latitud != null && v.longitud != null).map((v) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [v.longitud, v.latitud] },
      properties: { icao24: v.icao24, altitud: v.altitud || 0, rumbo: v.rumbo || 0, en_tierra: !!v.en_tierra },
    })),
  });

  /** Añade (o actualiza) la capa de aviones. Devuelve funciones para seleccionar. */
  function capaAviones(map, vuelos, { onClick } = {}) {
    const data = aGeoJSON(vuelos);
    if (!map.hasImage('plane')) map.addImage('plane', imagenAvion(), { sdf: true, pixelRatio: 2 });
    if (onClick && !map._radarClick) {
      map._radarClick = true;
      map.on('click', 'vuelos', (e) => onClick(e.features[0].properties.icao24));
      map.on('mouseenter', 'vuelos', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'vuelos', () => { map.getCanvas().style.cursor = ''; });
    }
    if (map.getSource('vuelos')) { map.getSource('vuelos').setData(data); return; }
    map.addSource('vuelos', { type: 'geojson', data });
    map.addLayer({
      id: 'vuelos-sel', type: 'circle', source: 'vuelos',
      filter: ['==', ['get', 'icao24'], ''],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 10, 8, 18],
        'circle-color': css('--accent-soft'),
        'circle-stroke-color': css('--accent'),
        'circle-stroke-width': 2,
        'circle-pitch-alignment': 'map',
      },
    });
    map.addLayer({
      id: 'vuelos', type: 'symbol', source: 'vuelos',
      layout: {
        'icon-image': 'plane',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 1, 0.34, 4, 0.5, 8, 0.85],
        'icon-rotate': ['get', 'rumbo'],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment': 'viewport',  // 'map' oculta los iconos en el globo (MapLibre 5)
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'symbol-sort-key': ['get', 'altitud'],
      },
      paint: {
        'icon-color': ['case',
          ['any', ['get', 'en_tierra'], ['<', ['get', 'altitud'], 300]], css('--alt-ground'),
          ['<', ['get', 'altitud'], 4000], css('--alt-low'),
          ['<', ['get', 'altitud'], 9000], css('--alt-mid'),
          css('--alt-high')],
      },
    });
  }
  const marcarAvion = (map, icao) => map.getLayer('vuelos-sel') && map.setFilter('vuelos-sel', ['==', ['get', 'icao24'], icao || '']);

  function volarA(map, lngLat, { zoom = 6.5, pitch = 55 } = {}) {
    const opts = { center: lngLat, zoom: Math.max(map.getZoom(), zoom), pitch, bearing: map.getBearing() };
    reducido() ? map.jumpTo(opts) : map.flyTo({ ...opts, duration: 1600, essential: false });
  }

  function popupVuelo(v) {
    const cs = v.callsign && v.callsign !== 'N/A' ? v.callsign : v.icao24;
    return `<div class="pop-title" translate="no">${esc(cs)}</div>
      <div class="pop-sub">${esc(I18n.pais(v.pais))}</div>
      <dl class="pop-grid">
        <dt>${t('pop.alt')}</dt><dd>${fmt.alt(v.altitud)}</dd>
        <dt>${t('pop.vel')}</dt><dd>${fmt.vel(v.velocidad)}</dd>
        <dt>${t('pop.rumbo')}</dt><dd>${fmt.rumbo(v.rumbo)}</dd>
        <dt>${t('pop.pos')}</dt><dd>${fmt.coord(v.latitud)}, ${fmt.coord(v.longitud)}</dd>
        <dt>ICAO24</dt><dd translate="no">${esc(v.icao24)}</dd>
      </dl>`;
  }
  const popup = () => new maplibregl.Popup({ offset: 14, maxWidth: '280px', focusAfterOpen: false });

  // ---------- Datos ----------
  // Modo estático (GitHub Pages): las rutas de la API se leen de archivos JSON exportados
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function rutaEstatica(url) {
    const u = new URL(url, location.href);
    const fin = u.pathname.split('/').pop();
    if (fin === 'vuelos_por_pais') return `data/paises/${slug(u.searchParams.get('pais') || '')}.json`;
    return `data/${fin}.json`;
  }
  async function getJSON(url, opts) {
    const r = await fetch(STATIC ? rutaEstatica(url) : url, STATIC ? undefined : opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || `Error ${r.status}`);
    return data;
  }

  // Indicador de estado en la barra superior
  function estado(texto, tipo = 'on') {
    const dot = document.getElementById('live-dot');
    const txt = document.getElementById('live-text');
    if (!dot || !txt) return;
    dot.className = `dot ${tipo}`;
    txt.textContent = texto;
  }

  function animarNumero(el, hasta, formato = fmt.int) {
    const desde = Number(el.dataset.v || 0);
    el.dataset.v = hasta;
    if (reducido() || desde === hasta) { el.textContent = formato(hasta); return; }
    const t0 = performance.now(), dur = 900;
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = formato(Math.round(desde + (hasta - desde) * e));
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  // ---------- Controles de la barra superior ----------
  function initChrome() {
    I18n.apply();
    actualizarBotonTema();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', css('--bg'));
    document.getElementById('theme-btn')?.addEventListener('click', () => setTema(tema() === 'dark' ? 'light' : 'dark'));
    document.querySelectorAll('[data-lang-btn]').forEach((b) => b.addEventListener('click', () => I18n.set(b.dataset.langBtn)));
    document.addEventListener('langchange', actualizarBotonTema);
    // Si el usuario no eligió tema, seguir al sistema
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      let guardado = null;
      try { guardado = localStorage.getItem('radar-theme'); } catch (err) { /* nada */ }
      if (!guardado) setTema(e.matches ? 'light' : 'dark', false);
    });
    root.classList.remove('i18n-pending');
  }
  initChrome();

  return {
    STATIC, t, esc, fmt, parseTs, hace, css, tema, reducido, altColor,
    crearMapa, capaAviones, marcarAvion, volarA, popupVuelo, popup,
    getJSON, estado, animarNumero,
  };
})();
