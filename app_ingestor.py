"""Ingestor en segundo plano: consulta OpenSky periódicamente y guarda en
Redis (estado en vivo) y MongoDB (histórico). Usa las mismas bases que app.py,
así el radar web muestra lo que captura este proceso."""
import json
import time
import datetime

import opensky
from database import vuelos_historial, redis_client

INTERVALO = 60  # segundos; el acceso anónimo tiene cuota diaria limitada


def procesar_y_guardar():
    print(f"🚀 Iniciando captura: {datetime.datetime.now()}")
    while True:
        try:
            estados = opensky.obtener_estados()
            if estados:
                ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                vuelos = [opensky.estado_a_vuelo(s, ahora) for s in estados]
                pipe = redis_client.pipeline()
                for v in vuelos:
                    pipe.set(f"vuelo_live:{v['icao24']}", json.dumps(v), ex=300)
                pipe.execute()
                vuelos_historial.insert_many([v.copy() for v in vuelos])
                print(f"📥 Sincronizados {len(vuelos)} vuelos.")
            else:
                print("☁️ No hay vuelos en el área en este momento.")
        except Exception as e:
            print(f"🔴 Fallo en el ciclo: {e}")
        print(f"Esperando {INTERVALO}s...")
        time.sleep(INTERVALO)


if __name__ == "__main__":
    procesar_y_guardar()
