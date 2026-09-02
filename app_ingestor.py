import requests
import redis
import json
import time
import datetime
from pymongo import MongoClient
from requests.auth import HTTPBasicAuth

# --- CONFIGURACIÓN DE CREDENCIALES (Usa las tuyas) ---
OPENSKY_USER = 'amamemie-api-client'
OPENSKY_PASS = 'YhZK6ToMja36DhtELH5PToE2YQXM7KXL'

# --- NUEVAS CONEXIONES (BASES DE DATOS DIFERENTES) ---
try:    
    # MongoDB: Nueva base 'db_logistica_externa'
    mongo_client = MongoClient('mongodb://localhost:27017/')
    db_externa = mongo_client['db_logistica_externa']
    coleccion_vuelos = db_externa['captura_api_vuelos']
    
    # Redis: Usamos el DB 1 (el anterior era el 0)
    cache_externa = redis.StrictRedis(host='localhost', port=6379, db=1, decode_responses=True)
    print("✅ Conexión a DB Externa Exitosa (Mongo: db_logistica_externa | Redis: DB 1)")
except Exception as e:
    print(f"❌ Error de conexión: {e}")

# Coordenadas de búsqueda (Latam)
BOUNDS = {'lamin': -55.0, 'lomin': -90.0, 'lamax': 15.0, 'lomax': -30.0}
URL_API = "https://opensky-network.org/api/states/all"

def procesar_y_guardar():
    print(f"🚀 Iniciando captura: {datetime.datetime.now()}")
    
    while True:
        try:
            # 1. Petición a la API
            response = requests.get(
                URL_API, 
                params=BOUNDS, 
                auth=HTTPBasicAuth(OPENSKY_USER, OPENSKY_PASS),
                headers={'User-Agent': 'Mozilla/5.0'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                vuelos_actuales = data.get('states', [])
                
                if vuelos_actuales:
                    documentos_mongo = []
                    
                    for s in vuelos_actuales:
                        vuelo_dict = {
                            'icao24': s[0],
                            'callsign': s[1].strip() if s[1] else "N/A",
                            'pais': s[2],
                            'longitud': s[5],
                            'latitud': s[6],
                            'altitud': s[7] if s[7] else 0,
                            'velocidad': s[9] if s[9] else 0,
                            'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        
                        # 2. Guardar en Redis DB 1 (Estado Vivo)
                        # Expira en 5 minutos para mantener solo lo reciente
                        cache_externa.set(f"api_live:{vuelo_dict['icao24']}", json.dumps(vuelo_dict), ex=300)
                        
                        documentos_mongo.append(vuelo_dict)
                    
                    # 3. Guardar en MongoDB (Historial masivo)
                    coleccion_vuelos.insert_many(documentos_mongo)
                    print(f"📥 Sincronizados {len(documentos_mongo)} vuelos en DB Externa.")
                else:
                    print("☁️ No hay vuelos en el área en este momento.")
            else:
                print(f"⚠️ Error API: {response.status_code}")

        except Exception as e:
            print(f"🔴 Fallo en el ciclo: {e}")

        # Esperar 30 segundos antes de la siguiente consulta (para no ser bloqueado)
        print("Wait 30s...")
        time.sleep(30)

if __name__ == "__main__":
    procesar_y_guardar()