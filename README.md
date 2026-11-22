# Rastreo Global de Vuelos

Radar de vuelos sobre Latinoamérica con datos de OpenSky Network.
Usa Redis para el estado en vivo y MongoDB para el histórico.

## Cómo ejecutarlo

```bash
docker compose up -d            # levanta MongoDB y Redis
source venv/bin/activate
python app.py                   # http://localhost:5000
```

En la web, pulsa **"Actualizar datos API"** para traer los vuelos actuales.

Opcional: en otra terminal, `python app_ingestor.py` captura vuelos de forma automática cada 60 s.

## Credenciales de OpenSky (opcional)

Sin credenciales, la app usa el acceso anónimo, que tiene menos cuota diaria.
Para usar una cuenta, crea un *API client* en opensky-network.org y guárdalo en `credentials.json`:

```json
{"clientId": "...", "clientSecret": "..."}
```

También puedes usar las variables de entorno `OPENSKY_CLIENT_ID` y `OPENSKY_CLIENT_SECRET`.
