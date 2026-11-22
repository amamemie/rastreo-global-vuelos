// Traducciones ES / EN. Uso: I18n.t('clave', {var: valor}); atributos data-i18n* en el HTML.
const I18n = (() => {
  const dict = {
    es: {
      'skip': 'Saltar al contenido',
      'brand.aria': 'Radar Latam, inicio',
      'nav.aria': 'Secciones',
      'nav.radar': 'Radar en vivo',
      'nav.filtro': 'Por país',
      'nav.stats': 'Estadísticas',
      'nav.hist': 'Historial',
      'lang.aria': 'Idioma',
      'theme.toLight': 'Cambiar a modo claro',
      'theme.toDark': 'Cambiar a modo oscuro',
      'live.connecting': 'Conectando…',
      'live.live': 'En vivo · {n}',
      'live.snapshot': 'Instantánea · {n}',
      'live.empty': 'Sin datos en caché',
      'live.offline': 'Sin conexión',
      'live.records': '{n} registros',
      'unit.records': '{n} registros',
      'unknown': 'Desconocido',
      'ground': 'En tierra',
      'ground.short': 'Tierra',

      'pop.alt': 'Altitud', 'pop.vel': 'Velocidad', 'pop.rumbo': 'Rumbo', 'pop.pos': 'Posición',

      'idx.title': 'Radar en vivo · Radar Latam',
      'idx.mapAria': 'Mapa de tráfico aéreo en 3D',
      'idx.legend': 'Altitud',
      'idx.low': '< 4.000 m', 'idx.mid': '< 9.000 m', 'idx.high': 'Crucero',
      'idx.panelAria': 'Panel de control',
      'idx.h1': 'Aeronaves en el aire',
      'idx.sub': 'sobre Latinoamérica, entre 55° S y 15° N',
      'idx.kAlt': 'Alt. media', 'idx.kPais': 'País líder', 'idx.kHora': 'Actualizado',
      'idx.snapEyebrow': 'Instantánea',
      'idx.snapText': 'Posiciones capturadas de OpenSky el {fecha} y guardadas en MongoDB.',
      'idx.btn': 'Actualizar radar',
      'idx.btnLoading': 'Consultando OpenSky…',
      'idx.hint': 'Consulta OpenSky y guarda en Redis y MongoDB.',
      'idx.downloading': 'Descargando posiciones actuales…',
      'idx.saved': '{n} posiciones guardadas en Redis y MongoDB.',
      'idx.cached': 'Datos recientes. Nueva consulta disponible en {s} s.',
      'idx.error': '{msg}. Vuelve a intentarlo en unos segundos.',
      'idx.flights': 'Vuelos',
      'idx.searchLabel': 'Buscar vuelo',
      'idx.searchPh': 'Vuelo, ICAO o país…',
      'idx.of': '{a} de {b}',
      'idx.noMatch': 'Sin coincidencias', 'idx.noMatchTip': 'Prueba con otro vuelo, código ICAO o país.',
      'idx.noCache': 'No hay vuelos en caché', 'idx.noCacheTip': 'Pulsa “Actualizar radar” para traer el tráfico actual.',
      'idx.noServer': 'No se pudo leer el servidor', 'idx.noServerTip': 'Comprueba que Flask y Redis estén en marcha.',
      'idx.flightsN': '{n} vuelos',

      'st.title': 'Estadísticas · Radar Latam',
      'st.eyebrow': 'Histórico en MongoDB',
      'st.h1': 'Estadísticas por país',
      'st.lead': 'Qué países registran más aeronaves en el espacio aéreo latinoamericano, según todas las capturas guardadas.',
      'st.summary': 'Resumen',
      'st.kReg': 'Posiciones registradas', 'st.kPai': 'Países de matrícula', 'st.kUlt': 'Última captura',
      'st.never': 'Nunca',
      'st.map': 'Volumen por país', 'st.mapHint': 'Altura = registros',
      'st.rank': 'Top 10 países', 'st.rankHint': 'Selecciona uno',
      'st.loading': 'Cargando datos…',
      'st.empty': 'Aún no hay registros', 'st.emptyTip': 'Actualiza el radar para empezar a acumular histórico.',
      'st.err': 'No se pudo leer MongoDB', 'st.errTip': 'Comprueba que el contenedor esté en marcha.',

      'hi.title': 'Historial · Radar Latam',
      'hi.h1': 'Historial de posiciones',
      'hi.lead': 'Las 100 posiciones más recientes guardadas en la base de datos.',
      'hi.filterLabel': 'Filtrar registros', 'hi.filterPh': 'Filtrar por vuelo o país…',
      'hi.refresh': 'Refrescar',
      'hi.aria': 'Registros',
      'hi.thDate': 'Fecha y hora', 'hi.thFlight': 'Vuelo', 'hi.thCountry': 'País de matrícula', 'hi.thAlt': 'Altitud', 'hi.thVel': 'Velocidad',
      'hi.loading': 'Consultando la base de datos…',
      'hi.of': '{a} de {b} registros',
      'hi.noMatchTip': 'Prueba con otro vuelo o país.',
      'hi.emptyTip': 'Ve al Radar en vivo y pulsa “Actualizar radar”.',
      'hi.errTip': 'Comprueba que el contenedor esté en marcha y refresca.',
      'hi.read': 'Leído {h}',

      'fi.title': 'Por país · Radar Latam',
      'fi.aria': 'Filtro',
      'fi.h1': 'Vuelos por país',
      'fi.label': 'País de matrícula',
      'fi.all': 'Todos los países',
      'fi.recent': 'registros recientes',
      'fi.recentAll': 'registros recientes, todos los países',
      'fi.recentOf': 'registros recientes de {p}',
      'fi.none': 'Sin registros', 'fi.noneTip': 'Actualiza el radar para acumular datos.',
      'fi.mapAria': 'Mapa de registros',
    },
    en: {
      'skip': 'Skip to content',
      'brand.aria': 'Radar Latam, home',
      'nav.aria': 'Sections',
      'nav.radar': 'Live radar',
      'nav.filtro': 'By country',
      'nav.stats': 'Statistics',
      'nav.hist': 'History',
      'lang.aria': 'Language',
      'theme.toLight': 'Switch to light mode',
      'theme.toDark': 'Switch to dark mode',
      'live.connecting': 'Connecting…',
      'live.live': 'Live · {n}',
      'live.snapshot': 'Snapshot · {n}',
      'live.empty': 'No cached data',
      'live.offline': 'Offline',
      'live.records': '{n} records',
      'unit.records': '{n} records',
      'unknown': 'Unknown',
      'ground': 'On ground',
      'ground.short': 'Ground',

      'pop.alt': 'Altitude', 'pop.vel': 'Speed', 'pop.rumbo': 'Heading', 'pop.pos': 'Position',

      'idx.title': 'Live radar · Radar Latam',
      'idx.mapAria': '3D air traffic map',
      'idx.legend': 'Altitude',
      'idx.low': '< 4,000 m', 'idx.mid': '< 9,000 m', 'idx.high': 'Cruise',
      'idx.panelAria': 'Control panel',
      'idx.h1': 'Aircraft airborne',
      'idx.sub': 'over Latin America, between 55° S and 15° N',
      'idx.kAlt': 'Avg. altitude', 'idx.kPais': 'Top country', 'idx.kHora': 'Updated',
      'idx.snapEyebrow': 'Snapshot',
      'idx.snapText': 'Positions captured from OpenSky on {fecha} and stored in MongoDB.',
      'idx.btn': 'Refresh radar',
      'idx.btnLoading': 'Querying OpenSky…',
      'idx.hint': 'Fetches OpenSky and stores the result in Redis and MongoDB.',
      'idx.downloading': 'Downloading current positions…',
      'idx.saved': '{n} positions stored in Redis and MongoDB.',
      'idx.cached': 'Recent data. Next fetch available in {s} s.',
      'idx.error': '{msg}. Try again in a few seconds.',
      'idx.flights': 'Flights',
      'idx.searchLabel': 'Search flight',
      'idx.searchPh': 'Flight, ICAO or country…',
      'idx.of': '{a} of {b}',
      'idx.noMatch': 'No matches', 'idx.noMatchTip': 'Try another flight, ICAO code or country.',
      'idx.noCache': 'No flights in cache', 'idx.noCacheTip': 'Press “Refresh radar” to load current traffic.',
      'idx.noServer': 'Couldn’t reach the server', 'idx.noServerTip': 'Check that Flask and Redis are running.',
      'idx.flightsN': '{n} flights',

      'st.title': 'Statistics · Radar Latam',
      'st.eyebrow': 'MongoDB history',
      'st.h1': 'Statistics by country',
      'st.lead': 'Which countries register the most aircraft in Latin American airspace, across every stored capture.',
      'st.summary': 'Summary',
      'st.kReg': 'Positions stored', 'st.kPai': 'Registration countries', 'st.kUlt': 'Last capture',
      'st.never': 'Never',
      'st.map': 'Volume by country', 'st.mapHint': 'Height = records',
      'st.rank': 'Top 10 countries', 'st.rankHint': 'Pick one',
      'st.loading': 'Loading data…',
      'st.empty': 'No records yet', 'st.emptyTip': 'Refresh the radar to start building history.',
      'st.err': 'Couldn’t read MongoDB', 'st.errTip': 'Check that the container is running.',

      'hi.title': 'History · Radar Latam',
      'hi.h1': 'Position history',
      'hi.lead': 'The 100 most recent positions stored in the database.',
      'hi.filterLabel': 'Filter records', 'hi.filterPh': 'Filter by flight or country…',
      'hi.refresh': 'Refresh',
      'hi.aria': 'Records',
      'hi.thDate': 'Date & time', 'hi.thFlight': 'Flight', 'hi.thCountry': 'Registration country', 'hi.thAlt': 'Altitude', 'hi.thVel': 'Speed',
      'hi.loading': 'Querying the database…',
      'hi.of': '{a} of {b} records',
      'hi.noMatchTip': 'Try another flight or country.',
      'hi.emptyTip': 'Go to Live radar and press “Refresh radar”.',
      'hi.errTip': 'Check that the container is running, then refresh.',
      'hi.read': 'Read at {h}',

      'fi.title': 'By country · Radar Latam',
      'fi.aria': 'Filter',
      'fi.h1': 'Flights by country',
      'fi.label': 'Registration country',
      'fi.all': 'All countries',
      'fi.recent': 'recent records',
      'fi.recentAll': 'recent records, all countries',
      'fi.recentOf': 'recent records from {p}',
      'fi.none': 'No records', 'fi.noneTip': 'Refresh the radar to collect data.',
      'fi.mapAria': 'Records map',
    },
  };

  // OpenSky entrega los países en inglés
  const paisesEs = {
    'Argentina': 'Argentina', 'Australia': 'Australia', 'Austria': 'Austria', 'Bahamas': 'Bahamas',
    'Belgium': 'Bélgica', 'Belize': 'Belice', 'Bermuda': 'Bermudas', 'Bolivia': 'Bolivia', 'Brazil': 'Brasil',
    'Canada': 'Canadá', 'Cayman Islands': 'Islas Caimán', 'Chile': 'Chile', 'China': 'China', 'Colombia': 'Colombia',
    'Costa Rica': 'Costa Rica', 'Cuba': 'Cuba', 'Denmark': 'Dinamarca', 'Dominican Republic': 'República Dominicana',
    'Ecuador': 'Ecuador', 'El Salvador': 'El Salvador', 'Ethiopia': 'Etiopía', 'France': 'Francia', 'Germany': 'Alemania',
    'Guatemala': 'Guatemala', 'Guyana': 'Guyana', 'Honduras': 'Honduras', 'Ireland': 'Irlanda', 'Israel': 'Israel',
    'Italy': 'Italia', 'Jamaica': 'Jamaica', 'Japan': 'Japón', 'Kingdom of the Netherlands': 'Países Bajos',
    'Luxembourg': 'Luxemburgo', 'Malta': 'Malta', 'Mexico': 'México', 'Morocco': 'Marruecos', 'Netherlands': 'Países Bajos',
    'New Zealand': 'Nueva Zelanda', 'Nicaragua': 'Nicaragua', 'Norway': 'Noruega', 'Panama': 'Panamá', 'Paraguay': 'Paraguay',
    'Peru': 'Perú', 'Poland': 'Polonia', 'Portugal': 'Portugal', 'Qatar': 'Catar', 'Republic of Korea': 'Corea del Sur',
    'Russian Federation': 'Rusia', 'Singapore': 'Singapur', 'South Africa': 'Sudáfrica', 'Spain': 'España',
    'Suriname': 'Surinam', 'Sweden': 'Suecia', 'Switzerland': 'Suiza', 'Trinidad and Tobago': 'Trinidad y Tobago',
    'Turkey': 'Turquía', 'Türkiye': 'Turquía', 'United Arab Emirates': 'Emiratos Árabes Unidos',
    'United Kingdom': 'Reino Unido', 'United States': 'Estados Unidos', 'Uruguay': 'Uruguay', 'Venezuela': 'Venezuela',
  };

  let lang = document.documentElement.lang === 'en' ? 'en' : 'es';

  function t(key, vars) {
    let s = dict[lang][key] ?? dict.es[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return s;
  }

  const pais = (nombre) => (lang === 'es' && nombre ? (paisesEs[nombre] || nombre) : (nombre || t('unknown')));

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    const titulo = document.querySelector('title[data-i18n-key]');
    if (titulo) document.title = t(titulo.dataset.i18nKey);
    document.querySelectorAll('[data-lang-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langBtn === lang)));
  }

  function set(nuevo) {
    if (nuevo === lang) return;
    lang = nuevo;
    document.documentElement.lang = lang;
    try { localStorage.setItem('radar-lang', lang); } catch (e) { /* almacenamiento no disponible */ }
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  return {
    t, pais, apply, set,
    get lang() { return lang; },
    get locale() { return lang === 'en' ? 'en-US' : 'es'; },
  };
})();
