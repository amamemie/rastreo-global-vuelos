"""Cliente mínimo para la API de OpenSky Network.

OpenSky eliminó la autenticación básica (usuario/contraseña) y ahora usa
OAuth2 "client credentials". Las credenciales se leen de credentials.json
(claves clientId / clientSecret) o de las variables de entorno
OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET. Si no hay credenciales o son
inválidas, se usa el acceso anónimo (menos cuota diaria, pero funciona).
"""
import json
import os
import time

import requests

TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
STATES_URL = "https://opensky-network.org/api/states/all"
LATAM_BOUNDS = {'lamin': -55.0, 'lomin': -90.0, 'lamax': 15.0, 'lomax': -30.0}

_CRED_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'credentials.json')
_token = {'value': None, 'expires': 0.0}
_creds_invalidas = False


def _cargar_credenciales():
    cid = os.environ.get('OPENSKY_CLIENT_ID')
    secret = os.environ.get('OPENSKY_CLIENT_SECRET')
    if cid and secret:
        return cid, secret
    try:
        with open(_CRED_FILE) as f:
            data = json.load(f)
        return data.get('clientId'), data.get('clientSecret')
    except (OSError, ValueError):
        return None, None


def _obtener_token():
    global _creds_invalidas
    if _creds_invalidas:
        return None
    if _token['value'] and time.time() < _token['expires']:
        return _token['value']
    cid, secret = _cargar_credenciales()
    if not cid or not secret:
        return None
    try:
        r = requests.post(TOKEN_URL, data={
            'grant_type': 'client_credentials',
            'client_id': cid,
            'client_secret': secret,
        }, timeout=15)
    except requests.RequestException as e:
        print(f"⚠️ No se pudo obtener token de OpenSky: {e}")
        return None
    if r.status_code != 200:
        print(f"⚠️ Credenciales de OpenSky rechazadas ({r.status_code}); usando acceso anónimo.")
        _creds_invalidas = True
        return None
    data = r.json()
    _token['value'] = data['access_token']
    _token['expires'] = time.time() + data.get('expires_in', 1800) - 60
    return _token['value']


def obtener_estados(bounds=LATAM_BOUNDS, timeout=30):
    """Devuelve la lista 'states' de OpenSky (puede ser vacía). Lanza excepción si falla."""
    token = _obtener_token()
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    r = requests.get(STATES_URL, params=bounds, headers=headers, timeout=timeout)
    if r.status_code == 401 and token:
        # token caducado o revocado: reintentar una vez sin él
        _token['value'] = None
        r = requests.get(STATES_URL, params=bounds, timeout=timeout)
    if r.status_code == 429:
        raise RuntimeError("Cuota de OpenSky agotada (429). Intenta más tarde.")
    r.raise_for_status()
    return (r.json() or {}).get('states') or []


def estado_a_vuelo(s, timestamp):
    return {
        'icao24': s[0],
        'callsign': s[1].strip() if s[1] else "N/A",
        'pais': s[2],
        'longitud': s[5],
        'latitud': s[6],
        'altitud': s[7] if s[7] else 0,
        'velocidad': s[9] if s[9] else 0,
        'rumbo': s[10] if s[10] else 0,
        'en_tierra': bool(s[8]),
        'timestamp': timestamp,
    }
