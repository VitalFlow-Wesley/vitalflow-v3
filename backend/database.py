import os
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = (os.getenv("MONGO_URL") or os.getenv("MONGO_URI") or "").strip()

if mongo_url.startswith("MONGO_URL="):
    mongo_url = mongo_url.split("=", 1)[1].strip()

if mongo_url.startswith("MONGO_URI="):
    mongo_url = mongo_url.split("=", 1)[1].strip()

if not mongo_url:
    raise RuntimeError("Defina MONGO_URL ou MONGO_URI no ambiente")

db_name = os.getenv("DB_NAME", "vitalflow")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
