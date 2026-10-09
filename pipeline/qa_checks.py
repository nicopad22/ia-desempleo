#!/usr/bin/env python3.12
"""
qa_checks.py
Controles de calidad y cobertura para validar los datos generados
por el pipeline conforme a data_pipeline.md y WALKTHROUGH.md.
"""

import json
from pathlib import Path

HIERARCHY_PATH = Path("data/public/d3_hierarchy.json")
CATALOG_PATH = Path("data/public/catalogo_carreras.json")

def validate_hierarchy(root):
    leaves = []
    depths = []

    def traverse(node, current_depth):
        depths.append(current_depth)
        if "children" in node and len(node["children"]) > 0:
            for child in node["children"]:
                traverse(child, current_depth + 1)
        else:
            leaves.append((node, current_depth))

    traverse(root, 0)
    return leaves, max(depths)

def run_qa():
    print("=" * 60)
    print("EJECUTANDO CONTROLES DE CALIDAD DEL PIPELINE (QA CHECKS)")
    print("=" * 60)

    # 1. Carga de archivos
    assert HIERARCHY_PATH.exists(), f"Falta archivo {HIERARCHY_PATH}"
    assert CATALOG_PATH.exists(), f"Falta archivo {CATALOG_PATH}"

    with open(HIERARCHY_PATH, "r", encoding="utf-8") as f:
        hierarchy = json.load(f)

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"✓ Archivos JSON cargados correctamente.")

    # 2. Control de jerarquía y profundidad
    leaves, max_depth = validate_hierarchy(hierarchy)
    print(f"✓ Total de ocupaciones hoja (4 dígitos): {len(leaves)}")
    print(f"✓ Profundidad máxima del árbol: {max_depth} (Nivel 0=Root, 1=Gran Grupo, 2=Subgrupo Princ., 3=Subgrupo, 4=Hojas)")
    assert max_depth == 4, f"Error: La profundidad del árbol debe ser exactamente 4, se obtuvo {max_depth}"

    # 3. Control de cobertura de códigos ISCO y campos obligatorios
    all_isco_codes = set()
    total_employment = 0
    scores_valid = 0
    gradients_valid = 0

    for leaf, depth in leaves:
        assert depth == 4, f"La hoja {leaf.get('id')} no está en profundidad 4"
        code = leaf.get("isco08")
        assert code and len(code) == 4, f"Código ISCO inválido: {code}"
        all_isco_codes.add(code)

        # Empleo positivo
        val = leaf.get("value", 0)
        assert val > 0, f"Empleo inválido en {code}: {val}"
        total_employment += val

        # Puntajes OIT
        auto = leaf.get("automatizacion_score")
        aug = leaf.get("aumentacion_score")
        assert 0.0 <= auto <= 1.0, f"Puntaje de automatización fuera de rango [0, 1] en {code}: {auto}"
        assert 0.0 <= aug <= 1.0, f"Puntaje de aumentación fuera de rango [0, 1] en {code}: {aug}"
        scores_valid += 1

        grad = leaf.get("oit_gradiente")
        assert grad and len(grad) > 0, f"Gradiente OIT vacío en {code}"
        gradients_valid += 1

    print(f"✓ Control 100% Códigos ISCO válidos a 4 dígitos: {len(all_isco_codes)} códigos únicos.")
    print(f"✓ Control 100% Puntajes OIT en rango [0.0, 1.0]: {scores_valid}/{len(leaves)} verificados.")
    print(f"✓ Control 100% Gradientes cualitativos presentes: {gradients_valid}/{len(leaves)} verificados.")
    print(f"✓ Volumen total de empleo nacional en Grupos 1 a 3: {total_employment:,.0f} empleos.")

    # 4. Control del catálogo de carreras
    print(f"✓ Total de carreras genéricas en el catálogo: {len(catalog)}")
    careers_with_occupations = 0
    linked_occupations = set()

    for carrera in catalog:
        c_id = carrera.get("id")
        nombre = carrera.get("nombre")
        ocups = carrera.get("ocupaciones", [])
        assert c_id and nombre, f"Carrera sin id o nombre: {carrera}"
        assert len(ocups) > 0, f"Carrera {c_id} sin ocupaciones asociadas"
        careers_with_occupations += 1

        for o in ocups:
            assert o in all_isco_codes, f"La carrera {c_id} apunta a un código ISCO inexistente en el árbol: {o}"
            linked_occupations.add(o)

    print(f"✓ Cobertura de carreras: 100% de carreras ({careers_with_occupations}/{len(catalog)}) con ocupaciones válidas.")
    print(f"✓ Ocupaciones únicas alcanzadas por las carreras: {len(linked_occupations)} ocupaciones.")

    print("=" * 60)
    print("TODOS LOS CONTROLES DE CALIDAD PASARON EXITOSAMENTE (PASS)")
    print("=" * 60)

if __name__ == "__main__":
    run_qa()
