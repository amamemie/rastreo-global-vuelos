"""Genera la versión estática del sitio en docs/ para GitHub Pages.

Toma una instantánea de MongoDB (la última captura completa y el histórico),
la guarda como JSON en docs/data/ y renderiza las plantillas en modo estático.

Uso:  python exportar_estatico.py   (con MongoDB en marcha)
"""
import json
import os
import re
import shutil
import unicodedata

from flask import render_template

from app import app, vuelos_db

RAIZ = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(RAIZ, 'docs')
DATA = os.path.join(DOCS, 'data')

PAGINAS = {
    'index.html': 'index.html',
    'filtro_paises.html': 'filtro_paises.html',
    'estadisticas.html': 'estadisticas.html',
    'historial.html': 'historial.html',
}
ENLACES = {
    'href="/"': 'href="index.html"',
    'href="/filtro_paises"': 'href="filtro_paises.html"',
    'href="/estadisticas"': 'href="estadisticas.html"',
    'href="/historial"': 'href="historial.html"',
    '"/static/': '"static/',
}


def slug(texto):
    t = unicodedata.normalize('NFD', texto)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def guardar(ruta, datos):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, separators=(',', ':'))


def exportar_datos():
    sin_id = {'_id': 0}
    ultimo = vuelos_db.find_one({}, {'_id': 0, 'timestamp': 1}, sort=[('timestamp', -1)])
    if not ultimo:
        raise SystemExit('MongoDB no tiene registros. Actualiza el radar antes de exportar.')
    ts = ultimo['timestamp']

    # La última captura completa hace de "vuelos en vivo"
    vuelos = list(vuelos_db.find({'timestamp': ts}, sin_id))
    guardar(os.path.join(DATA, 'vuelos.json'), vuelos)

    guardar(os.path.join(DATA, 'historial_datos.json'),
            list(vuelos_db.find({}, sin_id).sort('timestamp', -1).limit(100)))

    top = list(vuelos_db.aggregate([
        {'$group': {'_id': '$pais', 'total': {'$sum': 1}, 'lat': {'$avg': '$latitud'}, 'lon': {'$avg': '$longitud'}}},
        {'$sort': {'total': -1}}, {'$limit': 10},
    ]))
    guardar(os.path.join(DATA, 'top_paises.json'), top)

    guardar(os.path.join(DATA, 'resumen.json'), {
        'registros': vuelos_db.count_documents({}),
        'paises': len(vuelos_db.distinct('pais')),
        'ultimo': ts,
    })

    shutil.rmtree(os.path.join(DATA, 'paises'), ignore_errors=True)
    for p in top:
        guardar(os.path.join(DATA, 'paises', f"{slug(p['_id'])}.json"),
                list(vuelos_db.find({'pais': p['_id']}, sin_id).sort('timestamp', -1).limit(50)))
    return ts, len(vuelos)


def exportar_paginas(ts):
    with app.test_request_context():
        for plantilla, salida in PAGINAS.items():
            html = render_template(plantilla, static_mode=True, snapshot=ts)
            for a, b in ENLACES.items():
                html = html.replace(a, b)
            with open(os.path.join(DOCS, salida), 'w', encoding='utf-8') as f:
                f.write(html)
    shutil.rmtree(os.path.join(DOCS, 'static'), ignore_errors=True)
    shutil.copytree(os.path.join(RAIZ, 'static'), os.path.join(DOCS, 'static'))
    open(os.path.join(DOCS, '.nojekyll'), 'w').close()


if __name__ == '__main__':
    ts, n = exportar_datos()
    exportar_paginas(ts)
    print(f'✅ docs/ generado: instantánea {ts} con {n} vuelos.')
