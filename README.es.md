# Rastreo Global de Vuelos

> 🇬🇧 [English version](README.md)

Radar de vuelos sobre Latinoamérica con datos de OpenSky Network.
Usa Redis para el estado en vivo y MongoDB para el histórico.

### 🌐 Demo: **[amamemie.github.io/rastreo-global-vuelos](https://amamemie.github.io/rastreo-global-vuelos/)**

![Radar en vivo](screenshots/radar.png)

## Qué incluye

- **Radar en vivo:** globo 3D centrado con todos los aviones entre 55° S y 15° N, orientados según su rumbo y coloreados por altitud. Al elegir un vuelo, la cámara vuela hasta él con vista inclinada.
- **Por país:** filtra el histórico por país de matrícula; el país queda en la URL (`?pais=Chile`).
- **Estadísticas:** totales y top 10 de países, con una columna 3D por país sobre el globo.
- **Historial:** las 100 posiciones más recientes de MongoDB, con filtro.
- **Modo claro y oscuro** (sigue al sistema hasta que eliges uno) e **idiomas español e inglés** (botón ES/EN).
- Hecho con Flask, Redis, MongoDB y MapLibre GL (mapas de OpenFreeMap, sin API key).

## Cómo ejecutarlo

```bash
docker compose up -d            # levanta MongoDB y Redis
source venv/bin/activate
python app.py                   # http://localhost:5000
```

En la web, pulsa **"Actualizar radar"** para traer los vuelos actuales.

Opcional: en otra terminal, `python app_ingestor.py` captura vuelos de forma automática cada 60 s.

## Credenciales de OpenSky (opcional)

Sin credenciales, la app usa el acceso anónimo, que tiene menos cuota diaria.
Para usar una cuenta, crea un *API client* en opensky-network.org y guárdalo en `credentials.json`:

```json
{"clientId": "...", "clientSecret": "..."}
```

También puedes usar las variables de entorno `OPENSKY_CLIENT_ID` y `OPENSKY_CLIENT_SECRET`.

## Publicarlo en internet (gratis)

La app necesita un servidor, así que GitHub Pages no basta. Se usan tres servicios con plan gratuito:

1. **MongoDB Atlas** (mongodb.com/atlas): crea un cluster *M0 Free*, un usuario de base de datos y, en *Network Access*, permite `0.0.0.0/0`. Copia la *connection string* (`mongodb+srv://...`).
2. **Upstash** (upstash.com): crea una base Redis y copia la URL (`rediss://default:...@...upstash.io:6379`).
3. **Render** (render.com): *New → Blueprint*, elige este repositorio de GitHub (lee `render.yaml`) y rellena las variables:
   - `MONGO_URI`: la de Atlas
   - `REDIS_URL`: la de Upstash
   - `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET`: opcional, pero recomendable. Sin ellas, todos los visitantes comparten la cuota anónima.

Render te da una URL pública del tipo `https://radar-latam.onrender.com`. En el plan gratuito, el servidor se duerme tras 15 minutos sin visitas y tarda unos 30 segundos en despertar.

## Versión estática en GitHub Pages

`docs/` contiene una versión sin servidor: una instantánea de MongoDB exportada a JSON que las mismas páginas leen directamente.
Para actualizarla con datos nuevos:

```bash
python exportar_estatico.py     # con MongoDB en marcha
git add docs && git commit -m "Actualizar instantánea" && git push
```

GitHub Pages debe estar configurado con *Branch: main* y la carpeta */docs*.
