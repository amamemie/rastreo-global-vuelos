from flask import Flask, render_template, jsonify, request
import json
import datetime
import os
import opensky

app = Flask(__name__)

# --- CONEXIONES ---
from database import vuelos_historial as vuelos_db, redis_client as cache

# Tiempo mínimo entre consultas a OpenSky, para que los visitantes no agoten la cuota
INTERVALO_MIN = int(os.environ.get('INTERVALO_MIN_ACTUALIZAR', '60'))

# --- RUTAS DE NAVEGACIÓN ---
@app.route('/')
@app.route('/index.html')
def index(): return render_template('index.html')

@app.route('/historial')
@app.route('/historial.html')
def view_historial(): return render_template('historial.html')

@app.route('/estadisticas')
@app.route('/estadisticas.html')
def view_estadisticas(): return render_template('estadisticas.html')

@app.route('/filtro_paises')
@app.route('/filtro_paises.html')
def view_filtro(): return render_template('filtro_paises.html')

# --- ENDPOINTS API ---

@app.route('/api/actualizar_vuelos', methods=['POST'])
def actualizar_vuelos():
    if not cache.set('lock:actualizar', '1', nx=True, ex=INTERVALO_MIN):
        espera = cache.ttl('lock:actualizar')
        en_cache = sum(1 for _ in cache.scan_iter("vuelo_live:*"))
        return jsonify({"status": "success", "count": en_cache, "cached": True, "espera": espera,
                        "message": f"Datos recientes; nueva consulta disponible en {espera}s"})
    try:
        estados = opensky.obtener_estados()
        if not estados:
            return jsonify({"status": "error", "message": "API sin datos"})
        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        vuelos = [opensky.estado_a_vuelo(s, ahora) for s in estados]
        pipe = cache.pipeline()
        for v in vuelos:
            pipe.set(f"vuelo_live:{v['icao24']}", json.dumps(v), ex=300)
        pipe.execute()
        vuelos_db.insert_many([v.copy() for v in vuelos])
        return jsonify({"status": "success", "count": len(vuelos)})
    except Exception as e:
        cache.delete('lock:actualizar')
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/vuelos')
def get_vuelos_live():
    keys = list(cache.scan_iter("vuelo_live:*"))
    valores = cache.mget(keys) if keys else []
    return jsonify([json.loads(v) for v in valores if v])

@app.route('/api/historial_datos')
def get_historial():
    try:
        registros = list(vuelos_db.find({}, {"_id": 0}).sort("timestamp", -1).limit(100))
        return jsonify(registros)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/api/resumen')
def get_resumen():
    ultimo = vuelos_db.find_one({}, {"_id": 0, "timestamp": 1}, sort=[("timestamp", -1)])
    return jsonify({
        "registros": vuelos_db.estimated_document_count(),
        "paises": len(vuelos_db.distinct("pais")),
        "ultimo": ultimo["timestamp"] if ultimo else None,
    })

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
    app.run(debug=os.environ.get('FLASK_DEBUG', '1') == '1', host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))