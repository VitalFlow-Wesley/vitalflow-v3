import asyncio
from database import db

async def main():
    async for user in db.colaborador.find():
        print(user["email"])

asyncio.run(main())