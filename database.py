from pymongo import MongoClient
import redis

# Configuración MongoDB (Capa Histórica)
mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['rastreo_logistica']
vuelos_historial = db['historico_vuelos']

# Configuración Redis (Capa Live - DB 1)
# Se usa db=1 para aislar los datos de tiempo real
redis_client = redis.StrictRedis(
    host='localhost', 
    port=6379, 
    db=1, 
    decode_responses=True
)