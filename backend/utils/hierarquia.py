from typing import Any


def normalizar_matricula(valor: Any) -> str | None:
    if valor is None:
        return None

    valor = str(valor).strip()
    return valor or None


async def montar_cadeia_gestao(
    db,
    gestor_imediato_matricula: str | None,
    organizacao_id: str | None = None,
    max_niveis: int = 20,
) -> list[str]:
    """
    Monta a cadeia de gestão subindo a partir do gestor imediato.

    Exemplo:
    colaborador -> supervisor -> coordenador -> gerente

    Resultado:
    ["mat_supervisor", "mat_coordenador", "mat_gerente"]
    """
    cadeia: list[str] = []
    atual = normalizar_matricula(gestor_imediato_matricula)
    visitados: set[str] = set()
    niveis = 0

    while atual and atual not in visitados and niveis < max_niveis:
        filtro = {"matricula": atual}

        if organizacao_id is not None:
            filtro["organizacao_id"] = organizacao_id

        gestor = await db.colaboradores.find_one(
            filtro,
            {
                "_id": 0,
                "matricula": 1,
                "gestor_imediato_matricula": 1,
            },
        )

        if not gestor:
            break

        matricula_gestor = normalizar_matricula(gestor.get("matricula"))
        if not matricula_gestor:
            break

        cadeia.append(matricula_gestor)
        visitados.add(matricula_gestor)

        atual = normalizar_matricula(gestor.get("gestor_imediato_matricula"))
        niveis += 1

    return cadeia


def pode_ver_colaborador(usuario_logado: dict, alvo: dict) -> bool:
    """
    Regra de visibilidade:
    - CEO vê todos da organização
    - o usuário vê a si mesmo
    - o usuário vê quem tiver sua matrícula na cadeia de gestão
    """
    if not usuario_logado or not alvo:
        return False

    matricula_usuario = normalizar_matricula(usuario_logado.get("matricula"))
    matricula_alvo = normalizar_matricula(alvo.get("matricula"))

    if matricula_usuario and matricula_usuario == matricula_alvo:
        return True

    if usuario_logado.get("nivel_acesso") == "CEO":
        return True

    cadeia = alvo.get("cadeia_gestao_matriculas") or []
    cadeia_normalizada = [m for m in (normalizar_matricula(x) for x in cadeia) if m]

    return matricula_usuario in cadeia_normalizada


def filtrar_visiveis(usuario_logado: dict, colaboradores: list[dict]) -> list[dict]:
    """
    Retorna apenas os colaboradores que o usuário logado pode enxergar.
    """
    if not colaboradores:
        return []

    return [c for c in colaboradores if pode_ver_colaborador(usuario_logado, c)]


async def recalcular_cadeia_colaborador(
    db,
    colaborador: dict,
    organizacao_id: str | None = None,
) -> dict:
    """
    Recalcula a cadeia de gestão de um colaborador e devolve o doc atualizado em memória.
    Não salva sozinho no banco.
    """
    gestor_imediato_matricula = normalizar_matricula(
        colaborador.get("gestor_imediato_matricula")
    )

    cadeia = await montar_cadeia_gestao(
        db=db,
        gestor_imediato_matricula=gestor_imediato_matricula,
        organizacao_id=organizacao_id,
    )

    colaborador["gestor_imediato_matricula"] = gestor_imediato_matricula
    colaborador["cadeia_gestao_matriculas"] = cadeia

    return colaborador


async def atualizar_cadeia_e_salvar(
    db,
    colaborador_id: str,
    organizacao_id: str | None = None,
) -> dict | None:
    """
    Busca um colaborador por id, recalcula a cadeia e salva no banco.
    """
    filtro = {"id": colaborador_id}
    if organizacao_id is not None:
        filtro["organizacao_id"] = organizacao_id

    colaborador = await db.colaboradores.find_one(filtro)

    if not colaborador:
        return None

    colaborador = await recalcular_cadeia_colaborador(
        db=db,
        colaborador=colaborador,
        organizacao_id=organizacao_id,
    )

    await db.colaboradores.update_one(
        {"id": colaborador_id},
        {
            "$set": {
                "gestor_imediato_matricula": colaborador.get("gestor_imediato_matricula"),
                "cadeia_gestao_matriculas": colaborador.get("cadeia_gestao_matriculas", []),
            }
        },
    )

    return colaborador


async def recalcular_subordinados_recursivamente(
    db,
    matricula_gestor: str,
    organizacao_id: str | None = None,
    max_niveis: int = 20,
) -> int:
    """
    Quando um gestor muda, isso ajuda a recalcular a cadeia de todos abaixo dele.
    Retorna quantos colaboradores foram atualizados.
    """
    matricula_gestor = normalizar_matricula(matricula_gestor)
    if not matricula_gestor:
        return 0

    atualizados = 0
    fila = [matricula_gestor]
    visitados: set[str] = set()
    niveis = 0

    while fila and niveis < max_niveis:
        matricula_atual = fila.pop(0)

        if matricula_atual in visitados:
            continue

        visitados.add(matricula_atual)

        filtro = {"gestor_imediato_matricula": matricula_atual}
        if organizacao_id is not None:
            filtro["organizacao_id"] = organizacao_id

        subordinados = await db.colaboradores.find(
            filtro,
            {"_id": 0, "id": 1, "matricula": 1},
        ).to_list(1000)

        for subordinado in subordinados:
            colaborador_id = subordinado.get("id")
            matricula_subordinado = normalizar_matricula(subordinado.get("matricula"))

            if colaborador_id:
                atualizado = await atualizar_cadeia_e_salvar(
                    db=db,
                    colaborador_id=colaborador_id,
                    organizacao_id=organizacao_id,
                )
                if atualizado:
                    atualizados += 1

            if matricula_subordinado:
                fila.append(matricula_subordinado)

        niveis += 1

    return atualizados