"""Conexiones compartidas. En local usa los contenedores de docker-compose;
en la nube se configuran con las variables de entorno MONGO_URI y REDIS_URL."""
import os

import redis
from pymongo import MongoClient

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')

# Capa histórica (MongoDB)
mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = mongo_client[os.environ.get('MONGO_DB', 'rastreo_logistica')]
vuelos_historial = db['historico_vuelos']

# Capa en vivo (Redis)
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
