// Utilidades compartidas por todas las vistas.
const Radar = (() => {
  const nf0 = new Intl.NumberFormat('es', { maximumFractionDigits: 0, useGrouping: 'always' });
  const nf2 = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dtf = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tf = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function altColor(alt, enTierra) {
    if (enTierra || !alt || alt < 300) return css('--alt-ground');
    if (alt < 4000) return css('--alt-low');
    if (alt < 9000) return css('--alt-mid');
    return css('--alt-high');
  }

  function parseTs(ts) {
    // "YYYY-MM-DD HH:MM:SS" en hora local del servidor
    return ts ? new Date(ts.replace(' ', 'T')) : null;
  }

  function hace(date) {
    if (!date) return '—';
    const s = Math.round((date - Date.now()) / 1000);
    if (Math.abs(s) < 60) return rtf.format(s, 'second');
    const m = Math.round(s / 60);
    if (Math.abs(m) < 60) return rtf.format(m, 'minute');
    const h = Math.round(m / 60);
    if (Math.abs(h) < 24) return rtf.format(h, 'hour');
    return rtf.format(Math.round(h / 24), 'day');
  }

  const fmt = {
    int: (n) => (n == null ? '—' : nf0.format(n)),
    coord: (n) => (n == null ? '—' : nf2.format(n)),
    alt: (m) => (m ? `${nf0.format(m)} m` : 'En tierra'),
    vel: (ms) => (ms ? `${nf0.format(ms * 3.6)} km/h` : '—'),
    rumbo: (d) => (d == null ? '—' : `${nf0.format(d)}°`),
    fecha: (ts) => { const d = parseTs(ts); return d ? dtf.format(d) : '—'; },
    hora: (d) => (d ? tf.format(d) : '—'),
  };

  // --- Mapa ---
  function crearMapa(id, center = [-16, -62], zoom = 4) {
    if (window.innerWidth < 760) zoom = Math.max(2, zoom - 1);
    const map = L.map(id, { zoomControl: true, worldCopyJump: true, preferCanvas: false }).setView(center, zoom);
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
    L.tileLayer(esri + 'World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Mapa &copy; Esri, HERE, Garmin, &copy; OpenStreetMap · Datos: <a href="https://opensky-network.org">OpenSky</a>',
    }).addTo(map);
    L.tileLayer(esri + 'World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, pane: 'shadowPane', opacity: .7 }).addTo(map);
    return map;
  }

  const PLANE_PATH = 'M12 2c.7 0 1.2.9 1.2 2v5.2l7.8 4.6v2l-7.8-2.4v4.9l2.3 1.7v1.6L12 20.6l-3.5 1v-1.6l2.3-1.7v-4.9L3 15.8v-2l7.8-4.6V4c0-1.1.5-2 1.2-2z';

  function iconoAvion(v, size = 22) {
    const color = altColor(v.altitud, v.en_tierra);
    const rot = v.rumbo || 0;
    return L.divIcon({
      className: 'plane',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="rotate:${rot}deg" aria-hidden="true"><path d="${PLANE_PATH}" fill="${color}"/></svg>`,
    });
  }

  function popupVuelo(v) {
    const cs = v.callsign && v.callsign !== 'N/A' ? v.callsign : v.icao24;
    return `<div class="pop-title" translate="no">${esc(cs)}</div>
      <div class="pop-sub">${esc(v.pais)}</div>
      <dl class="pop-grid">
        <dt>Altitud</dt><dd>${fmt.alt(v.altitud)}</dd>
        <dt>Velocidad</dt><dd>${fmt.vel(v.velocidad)}</dd>
        <dt>Rumbo</dt><dd>${fmt.rumbo(v.rumbo)}</dd>
        <dt>Posición</dt><dd>${fmt.coord(v.latitud)}, ${fmt.coord(v.longitud)}</dd>
        <dt>ICAO24</dt><dd translate="no">${esc(v.icao24)}</dd>
      </dl>`;
  }

  // Modo estático (GitHub Pages): las rutas de la API se leen de archivos JSON exportados
  const STATIC = document.documentElement.dataset.static === '1';
  const slug = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  return { STATIC, esc, fmt, altColor, parseTs, hace, crearMapa, iconoAvion, popupVuelo, getJSON, estado };
})();
