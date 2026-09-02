from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
import redis
import requests
from requests.auth import HTTPBasicAuth
import json
import datetime

app = Flask(__name__)

# --- CONFIGURACIÓN ---
OPENSKY_USER = 'amamemie-api-client'
OPENSKY_PASS = 'YhZK6ToMja36DhtELH5PToE2YQXM7KXL'
LATAM_BOUNDS = {'lamin': -55.0, 'lomin': -90.0, 'lamax': 15.0, 'lomax': -30.0}

# --- CONEXIONES ---
try:
    mongo_client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = mongo_client['rastreo_logistica']
    vuelos_db = db['historico_vuelos']
    
    cache = redis.StrictRedis(host='localhost', port=6379, db=1, decode_responses=True)
    print("✅ Conexión exitosa a MongoDB y Redis")
except Exception as e:
    print(f"❌ Error de conexión: {e}")

# --- RUTAS DE NAVEGACIÓN ---
@app.route('/')
def index(): return render_template('index.html')

@app.route('/historial')
def view_historial(): return render_template('historial.html')

@app.route('/estadisticas')
def view_estadisticas(): return render_template('estadisticas.html')

@app.route('/filtro_paises')
def view_filtro(): return render_template('filtro_paises.html')

# --- ENDPOINTS API ---

@app.route('/api/actualizar_vuelos', methods=['POST'])
def actualizar_vuelos():
    url = "https://opensky-network.org/api/states/all"
    try:
        res = requests.get(url, params=LATAM_BOUNDS, auth=HTTPBasicAuth(OPENSKY_USER, OPENSKY_PASS), timeout=20)
        if res.status_code == 200:
            data = res.json()
            conteo = 0
            if data.get('states'):
                for s in data['states']:
                    vuelo = {
                        'icao24': s[0],
                        'callsign': s[1].strip() if s[1] else "N/A",
                        'pais': s[2],
                        'longitud': s[5],
                        'latitud': s[6],
                        'altitud': s[7] if s[7] else 0,
                        'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    cache.set(f"vuelo_live:{vuelo['icao24']}", json.dumps(vuelo), ex=300)
                    vuelos_db.insert_one(vuelo.copy())
                    conteo += 1
                return jsonify({"status": "success", "count": conteo})
        return jsonify({"status": "error", "message": "API sin datos"})
    except Exception as e:
        # CORRECCIÓN AQUÍ: str(e) unido
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/vuelos')
def get_vuelos_live():
    keys = cache.keys("vuelo_live:*")
    return jsonify([json.loads(cache.get(k)) for k in keys])

@app.route('/api/historial_datos')
def get_historial():
    try:
        registros = list(vuelos_db.find({}, {"_id": 0}).sort("timestamp", -1).limit(100))
        return jsonify(registros)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/top_paises')
def get_top_paises():
    pipeline = [
        {"$group": {"_id": "$pais", "total": {"$sum": 1}, "lat": {"$avg": "$latitud"}, "lon": {"$avg": "$longitud"}}},
        {"$sort": {"total": -1}}, {"$limit": 10}
    ]
    return jsonify(list(vuelos_db.aggregate(pipeline)))

@app.route('/api/vuelos_por_pais')
def get_vuelos_por_pais():
    pais = request.args.get('pais', '')
    query = {"pais": {"$regex": pais, "$options": "i"}} if pais else {}
    return jsonify(list(vuelos_db.find(query, {"_id": 0}).sort("timestamp", -1).limit(50)))

@app.route('/api/rutas_por_pais')
def get_rutas_por_pais():
    pais_origen = request.args.get('pais', '')
    pipeline = [
        {"$match": {"pais": pais_origen}},
        {
            "$group": {
                "_id": {"lat": "$lat_dest", "lon": "$lon_dest"},
                "total": {"$sum": 1},
                "lat_origen": {"$first": "$latitud"}, # Corregido: latitud
                "lon_origen": {"$first": "$longitud"}
            }
        },
        {"$sort": {"total": -1}}    
    ]
    return jsonify(list(vuelos_db.aggregate(pipeline)))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)