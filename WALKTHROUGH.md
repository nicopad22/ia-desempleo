# Contexto y Especificación Técnica: Visualizador IA-Desempleo

## 1. Visión General del Proyecto
Herramienta interactiva de orientación vocacional dirigida a estudiantes de 3ro y 4to medio en Chile. Su objetivo es permitir la exploración visual del impacto de la Inteligencia Artificial Generativa en el mercado laboral chileno, vinculando las carreras de educación superior (SIES / MiFuturo.cl) con ocupaciones estándar (ISCO-08) y sus métricas de empleo y exposición a IA.

---

## 2. Fuentes de Datos y Reglas de Integración

1. **Catálogo de Carreras y Métricas Laborales:**
   - **Fuente:** SIES / MiFuturo.cl (Base de oferta académica).
   - **Nivel de agregación:** Carrera Genérica (ej. *Ingeniería Civil en Computación*).
   - **Métricas por carrera:** Ingreso promedio al 4to año, empleabilidad al 1er y 2do año, arancel anual promedio, duración formal vs. real.
   - **Clasificador:** Código CINE-F 2013 a 4 dígitos asignado o inferido a nivel de campo detallado.

2. **Volumen de Empleo Nacional:**
   - **Fuente:** Encuesta Nacional de Empleo (ENE - INE Chile).
   - **Tratamiento:** Promedio anual de los últimos 4 trimestres móviles.
   - **Cálculo de volumen:** Suma ponderada del factor de calibración (`fact_cal`):
     $$\text{Empleo}(o) = \sum_{i \in \text{Ocupados}(o)} \text{fact\_cal}_i$$
   - **Homologación:** CIUO-08.CL $\rightarrow$ ISCO-08 (resolviendo adaptaciones locales a 4 dígitos).

3. **Métricas de Exposición a Inteligencia Artificial:**
   - **Fuente:** OIT / ILO Working Paper 140 (2025) a nivel ISCO-08 de 4 dígitos.
   - **Métricas obligatorias:**
     - `automatizacion_score` ($[0.0, 1.0]$): Probabilidad de sustitución de tareas.
     - `aumentacion_score` ($[0.0, 1.0]$): Potencial de complementariedad y aumento de productividad.
     - `oit_gradiente`: Categoría cualitativa definida por la OIT.

4. **Matriz de Asignaciones (Crosswalk):**
   - Relación $N:M$ entre Carrera Genérica e ISCO-08 (vía CINE-F 2013 $\rightarrow$ CINE 1997 $\rightarrow$ Montt 2015 $\rightarrow$ Tabla 6 de tareas).
   - Tipos de relación: `directa`, `afin_por_campo`, `trayectoria` (Grandes grupos 1) y `fuera_de_filtro` (Grupos 4 a 8 para carreras TNS).

---

## 3. Contratos de Datos (JSON Schemas)

### `carreras_mifuturo.json`
```json
[
  {
    "carrera_id": "GEN-0613-01",
    "nombre": "Ingeniería Civil en Computación / Informática",
    "nivel": "Profesional",
    "cine_f_codigo": "0613",
    "area_cine": "Tecnologías de la información y la comunicación",
    "metricas_mifuturo": {
      "ingreso_promedio_4to_ano": 2450000,
      "empleabilidad_1er_ano": 0.912,
      "empleabilidad_2do_ano": 0.948,
      "duracion_formal_semestres": 11.0,
      "duracion_real_semestres": 13.4,
      "arancel_anual_promedio": 6800000
    },
    "alias_busqueda": ["computacion", "software", "sistemas", "programacion", "informatica"]
  }
]

```

### `d3_hierarchy.json` (Árbol ISCO-08 Completo)

```json
{
  "name": "Mercado Laboral Chile",
  "id": "root",
  "children": [
    {
      "name": "Profesionales científicos e intelectuales",
      "id": "group_2",
      "gran_grupo": "2",
      "children": [
        {
          "name": "Profesionales de tecnología de la información",
          "id": "subgroup_25",
          "children": [
            {
              "name": "Desarrolladores y analistas de software",
              "id": "minor_251",
              "children": [
                {
                  "name": "Desarrolladores de software",
                  "id": "leaf_2512",
                  "isco08": "2512",
                  "value": 42150,
                  "automatizacion_score": 0.28,
                  "aumentacion_score": 0.84,
                  "oit_gradiente": "Aumento significativo",
                  "carreras_relacionadas": ["GEN-0613-01", "GEN-0612-02"]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

```

---

## 4. Visualización D3.js (Zoomable Circle Packing)

1. **Jerarquía (Profundidad 4):**
* Nivel 0: `Root`
* Nivel 1: Gran Grupo (1 dígito ISCO)
* Nivel 2: Subgrupo Principal (2 dígitos ISCO)
* Nivel 3: Subgrupo (3 dígitos ISCO)
* Nivel 4 (Hojas): Grupo Unitario (4 dígitos ISCO).
* *Nota:* Solo las hojas tienen `value` asignado (número de empleos ponderado de la ENE) y color semántico. Los nodos intermedios sirven para navegación y zoom concéntrico.


2. **Filtro de Carreras (Lógica de Unión):**
* Dada una selección activa de carreras $\mathcal{S} = \{c_1, c_2, \dots, c_k\}$, el conjunto de hojas visibles es:

$$\mathcal{O}_{\text{visibles}} = \bigcup_{c \in \mathcal{S}} \text{Relaciones}(c)$$


* **Comportamiento visual:** Recomputar `d3.pack()` sobre el subárbol podado manteniendo una transición interpolada de radio y coordenadas $(x, y)$.
* Si $\mathcal{S} = \emptyset$, el empaquetado renderiza todas las ocupaciones del catálogo.
* Si una ocupación está vinculada a más de una carrera en $\mathcal{S}$, se destaca visualmente mediante un borde multicolor o segmentado representativo de cada carrera.


3. **Escalas de Color Semánticas (Toggle Switch):**
* **Modo Automatización (Default):** Escala secuencial de `automatizacion_score` ($0.0 \rightarrow 1.0$) de Gris Neutro (`#E2E8F0`) $\rightarrow$ Amarillo (`#FACC15`) $\rightarrow$ Rojo Intenso (`#DC2626`).
* **Modo Aumentación:** Escala secuencial de `aumentacion_score` ($0.0 \rightarrow 1.0$) de Gris Neutro (`#E2E8F0`) $\rightarrow$ Celeste (`#38BDF8`) $\rightarrow$ Azul Marino (`#1D4ED8`).



---

## 5. Requerimientos de UI / UX

1. **Búsqueda y Selección:**
* Búsqueda difusa (fuzzy search) sobre nombres de carreras genéricas y alias populares (ej. "computación" encuentra "Ingeniería Civil en Computación / Informática").
* Selección múltiple de carreras reflejada en un panel de comparación flotante / lateral.


2. **Bidireccionalidad:**
* **Carrera $\rightarrow$ Ocupación:** Seleccionar una carrera filtra y resalta los círculos de ocupación correspondientes.
* **Ocupación $\rightarrow$ Carrera:** Al hacer clic en un círculo hoja (4 dígitos), se abre un drawer/modal con:
* Título y descripción ISCO-08.
* Estimación de empleo nacional (ENE).
* Puntaje y gradiente de Automatización y Aumentación (OIT).
* Lista de carreras de educación superior que conducen a esta ocupación, con botón directo para añadir cada una a la barra de comparación.




3. **Adaptabilidad (Responsive Layout):**
* **Desktop:** Layout de 2 columnas (70% Canvas D3 interactivo a la izquierda, 30% Panel lateral derecho con carreras seleccionadas y fichas de detalle).
* **Mobile:**
* Barra superior compacta con métricas activas, switch de color y botón contador del comparador.
* Canvas D3 central optimizado para gestos táctiles (*pinch-to-zoom*, *drag*, *tap*).
* *Bottom sheet* deslizable inferior para el buscador de carreras y el modal de detalle de ocupaciones.