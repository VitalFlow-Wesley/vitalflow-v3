from datetime import datetime, timezone
from copy import deepcopy


AUDIT_LABELS = {
    "name": "Nome",
    "nome": "Nome",
    "email": "E-mail",
    "role": "Nível hierárquico",
    "nivel_acesso": "Nível hierárquico",
    "cargo": "Cargo",
    "setor": "Setor",
    "equipe": "Equipe",
    "gestor_imediato_id": "Gestor imediato",
    "gestorImediatoId": "Gestor imediato",
    "status": "Status",
    "organizacao_id": "Organização",
}


def normalize_value(value):
    if isinstance(value, str):
        value = value.strip()
        return value if value else None
    return value


def serialize_doc(doc: dict | None):
    if not doc:
        return None

    doc = deepcopy(doc)

    if "_id" in doc:
        doc["_id"] = str(doc["_id"])

    return doc


def build_changes(before=None, after=None, fields_to_track=None):
    before = before or {}
    after = after or {}

    if fields_to_track is None:
        fields_to_track = sorted(set(before.keys()) | set(after.keys()))

    alteracoes = []

    for field in fields_to_track:
        anterior = normalize_value(before.get(field))
        atual = normalize_value(after.get(field))

        if anterior != atual:
            alteracoes.append({
                "campo": field,
                "label": AUDIT_LABELS.get(field, field),
                "anterior": anterior,
                "atual": atual,
            })

    return alteracoes


async def create_audit_log(
    db,
    organizacao_id,
    acao,
    entidade,
    entidade_id,
    entidade_nome,
    feito_por,
    antes=None,
    depois=None,
    alteracoes=None,
    detalhes=None,
):
    feito_por = feito_por or {}
    alteracoes = alteracoes or []
    detalhes = detalhes or {}

    log = {
        "organizacao_id": str(organizacao_id) if organizacao_id is not None else None,
        "acao": acao,
        "entidade": entidade,
        "entidade_id": str(entidade_id) if entidade_id is not None else None,
        "entidade_nome": entidade_nome,
        "feito_por": {
            "id": str(feito_por.get("id")) if feito_por.get("id") is not None else None,
            "name": feito_por.get("name"),
            "email": feito_por.get("email"),
            "role": feito_por.get("role"),
        },
        "data_hora": datetime.now(timezone.utc).isoformat(),
        "antes": serialize_doc(antes),
        "depois": serialize_doc(depois),
        "alteracoes": alteracoes,
        "detalhes": detalhes,
    }

    result = await db.audit_logs.insert_one(log)
    log["_id"] = str(result.inserted_id)

    return log