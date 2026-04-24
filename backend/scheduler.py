"""
Background scheduler para sincronização automática de wearables.
Roda a cada 30 minutos para todos os usuários com token ativo.
"""
import asyncio
import logging
from datetime import datetime, timezone

from database import db

logger = logging.getLogger(__name__)


async def sync_all_users():
    """Sincroniza wearables de todos os usuários com token ativo."""
    logger.info(f"[SCHEDULER] Iniciando sync em massa - {datetime.now(timezone.utc).isoformat()}")

    try:
        # Busca todos os tokens ativos
        tokens = await db.wearable_tokens.find(
            {"access_token": {"$exists": True, "$ne": None}},
            {"_id": 0, "colaborador_id": 1, "access_token": 1, "refresh_token": 1}
        ).to_list(10000)

        logger.info(f"[SCHEDULER] {len(tokens)} usuários com token ativo")

        success = 0
        failed = 0

        for token_doc in tokens:
            try:
                cid = token_doc["colaborador_id"]
                access_token = token_doc["access_token"]
                refresh_token = token_doc.get("refresh_token")

                # Importa aqui para evitar circular imports
                from services import google_fit_service
                from routes.wearables import _create_real_analysis_from_biometrics, _ensure_connected_device
                from database import db as database

                # Busca dados do Google Fit
                biometrics = await google_fit_service.fetch_biometrics(access_token)

                # Se falhou, tenta refresh do token
                if not biometrics and refresh_token:
                    new_tokens = await google_fit_service.refresh_access_token(refresh_token)
                    if new_tokens and new_tokens.get("access_token"):
                        new_access = new_tokens["access_token"]
                        await database.wearable_tokens.update_one(
                            {"colaborador_id": cid, "provider": "google_health_connect"},
                            {"$set": {"access_token": new_access, "updated_at": datetime.now(timezone.utc).isoformat()}}
                        )
                        biometrics = await google_fit_service.fetch_biometrics(new_access)

                if not isinstance(biometrics, dict) or not biometrics.get("has_real_data"):
                    logger.debug(f"[SCHEDULER] Sem dados reais para {cid}")
                    continue

                # Busca colaborador
                colaborador = await database.colaboradores.find_one(
                    {"id": cid}, {"_id": 0}
                )
                if not colaborador:
                    continue

                biometrics["colaborador_id"] = cid
                biometrics["synced_at"] = datetime.now(timezone.utc).isoformat()
                biometrics["data_mode"] = "real"
                biometrics["has_real_data"] = True
                biometrics["scenario"] = "real"
                biometrics["source"] = biometrics.get("source", "google_fit_scheduler")

                await database.google_fit_data.insert_one(biometrics)
                await _ensure_connected_device(cid, "google_health_connect", "Google Health Connect")
                await _create_real_analysis_from_biometrics(colaborador, biometrics)

                success += 1
                logger.info(f"[SCHEDULER] ✅ {cid} sincronizado")

                # Pequena pausa para não sobrecarregar a API do Google
                await asyncio.sleep(2)

            except Exception as e:
                failed += 1
                logger.error(f"[SCHEDULER] ❌ Erro ao sincronizar {token_doc.get('colaborador_id')}: {e}")

        logger.info(f"[SCHEDULER] Concluído — {success} ok, {failed} falhas")

    except Exception as e:
        logger.error(f"[SCHEDULER] Erro geral: {e}")


async def run_scheduler():
    """Loop principal do scheduler — roda a cada 30 minutos."""
    logger.info("[SCHEDULER] Scheduler iniciado — intervalo: 30 minutos")
    while True:
        await sync_all_users()
        await asyncio.sleep(30 * 60)  # 30 minutos
