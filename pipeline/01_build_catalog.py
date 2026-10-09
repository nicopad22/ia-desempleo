#!/usr/bin/env python3.12
"""
01_build_catalog.py
Construye el catálogo exhaustivo de carreras de educación superior chilena
(Universitarias, Profesionales y Técnicos de Nivel Superior - CINE-F 2013 / MiFuturo)
y su mapeo cruzado (crosswalk) hacia las 207 ocupaciones ISCO-08 (Grupos 1 a 3).
"""

import json
from pathlib import Path

OUTPUT_DIR = Path("data/processed")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DIR = Path("data/public")
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

CARRERAS_DATA = [
    # =========================================================================
    # 1. SALUD Y BIENESTAR (CINE-F 091)
    # =========================================================================
    {
        "id": "GEN-0912-01",
        "nombre": "Medicina",
        "cine_f_codigo": "0912",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["medico", "medicina", "doctor", "cirujano", "salud", "clinica", "pediatria"],
        "ocupaciones": ["2211", "2212"]
    },
    {
        "id": "GEN-0913-01",
        "nombre": "Enfermería",
        "cine_f_codigo": "0913",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["enfermera", "enfermero", "enfermeria", "salud", "cuidados", "clinica"],
        "ocupaciones": ["2221"]
    },
    {
        "id": "GEN-0913-02",
        "nombre": "Obstetricia y Puericultura (Matronería)",
        "cine_f_codigo": "0913",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["matrona", "matron", "obstetricia", "puericultura", "parto", "neonatologia", "salud sexual"],
        "ocupaciones": ["2222"]
    },
    {
        "id": "GEN-0911-01",
        "nombre": "Odontología",
        "cine_f_codigo": "0911",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["dentista", "odontologo", "odontologia", "dientes", "salud bucal", "ortodoncia"],
        "ocupaciones": ["2261"]
    },
    {
        "id": "GEN-0914-01",
        "nombre": "Kinesiología y Terapia Física",
        "cine_f_codigo": "0914",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["kinesiologo", "kinesiologia", "fisioterapia", "rehabilitacion", "salud", "kine"],
        "ocupaciones": ["2264"]
    },
    {
        "id": "GEN-0915-01",
        "nombre": "Nutrición y Dietética",
        "cine_f_codigo": "0915",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["nutricionista", "nutricion", "dietetica", "alimentacion", "dietista"],
        "ocupaciones": ["2265"]
    },
    {
        "id": "GEN-0915-02",
        "nombre": "Fonoaudiología",
        "cine_f_codigo": "0915",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["fonoaudiologo", "fonoaudiologia", "voz", "audicion", "lenguaje", "deglucion"],
        "ocupaciones": ["2266"]
    },
    {
        "id": "GEN-0915-03",
        "nombre": "Terapia Ocupacional",
        "cine_f_codigo": "0915",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["terapeuta ocupacional", "terapia ocupacional", "rehabilitacion", "inclusion"],
        "ocupaciones": ["2269"]
    },
    {
        "id": "GEN-0916-01",
        "nombre": "Química y Farmacia",
        "cine_f_codigo": "0916",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["farmaceutico", "farmacia", "quimica y farmacia", "medicamentos", "boticario", "farmacologia"],
        "ocupaciones": ["2262"]
    },
    {
        "id": "GEN-0916-02",
        "nombre": "Bioquímica",
        "cine_f_codigo": "0916",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["bioquimico", "bioquimica", "laboratorio", "biologia molecular", "analisis clinico"],
        "ocupaciones": ["2113", "2131"]
    },
    {
        "id": "GEN-0914-02",
        "nombre": "Tecnología Médica",
        "cine_f_codigo": "0914",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["tecnologo medico", "tecnologia medica", "bioanalisis", "imagenologia", "oftalmologia"],
        "ocupaciones": ["2212", "3211", "3212"]
    },
    {
        "id": "GEN-0841-01",
        "nombre": "Medicina Veterinaria",
        "cine_f_codigo": "0841",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["veterinario", "veterinaria", "animales", "salud animal", "mascotas"],
        "ocupaciones": ["2250"]
    },
    {
        "id": "TNS-0913-01",
        "nombre": "Técnico en Enfermería de Nivel Superior (TENS)",
        "cine_f_codigo": "0913",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tens", "tecnico enfermeria", "enfermeria tecnica", "salud", "hospital", "clinica"],
        "ocupaciones": ["3221"]
    },
    {
        "id": "TNS-0911-01",
        "nombre": "Técnico en Odontología e Higiene Dental",
        "cine_f_codigo": "0911",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["higienista dental", "tecnico dental", "asistente dental", "odontologia"],
        "ocupaciones": ["3251"]
    },
    {
        "id": "TNS-0914-01",
        "nombre": "Técnico en Laboratorio Clínico y Banco de Sangre",
        "cine_f_codigo": "0914",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["laboratorio clinico", "muestras", "sangre", "banco de sangre", "analisis"],
        "ocupaciones": ["3212"]
    },
    {
        "id": "TNS-0914-02",
        "nombre": "Técnico en Radiología e Imagenología",
        "cine_f_codigo": "0914",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["radiologia", "rayos x", "imagenologia", "resonancia", "tac", "scanner"],
        "ocupaciones": ["3211"]
    },
    {
        "id": "TNS-0916-01",
        "nombre": "Técnico en Farmacia",
        "cine_f_codigo": "0916",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tecnico farmacia", "farmacia", "dispensacion", "medicamentos", "botica"],
        "ocupaciones": ["3213"]
    },
    {
        "id": "TNS-0841-01",
        "nombre": "Técnico Veterinario y Asistente de Clínica Veterinaria",
        "cine_f_codigo": "0841",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tecnico veterinario", "asistente veterinario", "veterinaria", "animales"],
        "ocupaciones": ["3240"]
    },
    {
        "id": "TNS-0915-01",
        "nombre": "Técnico en Masoterapia y Terapias Complementarias",
        "cine_f_codigo": "0915",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["masoterapia", "masajista", "naturopatia", "terapias naturales"],
        "ocupaciones": ["3230", "3255"]
    },

    # =========================================================================
    # 2. TECNOLOGÍA DE LA INFORMACIÓN Y COMUNICACIONES (CINE-F 061)
    # =========================================================================
    {
        "id": "GEN-0613-01",
        "nombre": "Ingeniería Civil en Computación / Informática",
        "cine_f_codigo": "0613",
        "area_cine": "Tecnología de la información",
        "nivel": "Profesional",
        "alias_busqueda": ["computacion", "software", "sistemas", "programacion", "informatica", "desarrollo", "it", "cs"],
        "ocupaciones": ["2511", "2512", "2513", "2521", "2522", "1330"]
    },
    {
        "id": "GEN-0612-01",
        "nombre": "Ingeniería en Ejecución en Computación e Informática",
        "cine_f_codigo": "0612",
        "area_cine": "Tecnología de la información",
        "nivel": "Profesional",
        "alias_busqueda": ["desarrollador", "programador", "ingeniero ejecucion", "software", "aplicaciones"],
        "ocupaciones": ["2512", "2514", "3514"]
    },
    {
        "id": "GEN-0612-02",
        "nombre": "Ingeniería Civil en Telemática / Telecomunicaciones",
        "cine_f_codigo": "0612",
        "area_cine": "Tecnología de la información",
        "nivel": "Profesional",
        "alias_busqueda": ["telecomunicaciones", "telematica", "redes", "comunicaciones", "fibra optica"],
        "ocupaciones": ["2153", "2523"]
    },
    {
        "id": "GEN-0612-03",
        "nombre": "Ingeniería en Ciberseguridad",
        "cine_f_codigo": "0612",
        "area_cine": "Tecnología de la información",
        "nivel": "Profesional",
        "alias_busqueda": ["ciberseguridad", "seguridad informatica", "ethical hacking", "seguridad ti"],
        "ocupaciones": ["2529", "3512"]
    },
    {
        "id": "GEN-0612-04",
        "nombre": "Ingeniería en Ciencia de Datos e Inteligencia Artificial",
        "cine_f_codigo": "0612",
        "area_cine": "Tecnología de la información",
        "nivel": "Profesional",
        "alias_busqueda": ["data science", "ciencia de datos", "inteligencia artificial", "machine learning", "big data"],
        "ocupaciones": ["2120", "2511", "2512"]
    },
    {
        "id": "TNS-0612-01",
        "nombre": "Técnico en Conectividad y Redes / Soporte TIC",
        "cine_f_codigo": "0612",
        "area_cine": "Tecnología de la información",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["redes", "soporte", "tecnico informatica", "conectividad", "hardware", "mesa de ayuda"],
        "ocupaciones": ["3511", "3512", "3513"]
    },
    {
        "id": "TNS-0613-01",
        "nombre": "Técnico en Análisis de Sistemas y Programación",
        "cine_f_codigo": "0613",
        "area_cine": "Tecnología de la información",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["programador", "analista programador", "codigo", "frontend", "backend", "web"],
        "ocupaciones": ["3514"]
    },
    {
        "id": "TNS-0612-02",
        "nombre": "Técnico en Telecomunicaciones",
        "cine_f_codigo": "0612",
        "area_cine": "Tecnología de la información",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["telecomunicaciones", "antenas", "fibra", "redes telefonicas", "cableado"],
        "ocupaciones": ["3522"]
    },

    # =========================================================================
    # 3. INGENIERÍA, INDUSTRIA Y CONSTRUCCIÓN (CINE-F 071, 072, 073)
    # =========================================================================
    {
        "id": "GEN-0711-01",
        "nombre": "Ingeniería Civil Industrial",
        "cine_f_codigo": "0711",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["industrial", "procesos", "operaciones", "gestion", "optimizacion", "cadena de suministro"],
        "ocupaciones": ["1219", "2141", "2421"]
    },
    {
        "id": "GEN-0732-01",
        "nombre": "Ingeniería Civil en Obras Civiles / Construcción",
        "cine_f_codigo": "0732",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["obras civiles", "civil", "estructuras", "puentes", "carreteras", "hidraulica"],
        "ocupaciones": ["1323", "2142"]
    },
    {
        "id": "GEN-0732-02",
        "nombre": "Construcción Civil / Ingeniería en Construcción",
        "cine_f_codigo": "0732",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["constructor", "construccion", "edificacion", "obras", "contratista"],
        "ocupaciones": ["2142", "3123"]
    },
    {
        "id": "GEN-0731-01",
        "nombre": "Arquitectura",
        "cine_f_codigo": "0731",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["arquitecto", "arquitectura", "diseno edificios", "planos", "urbanismo"],
        "ocupaciones": ["2161"]
    },
    {
        "id": "GEN-0731-02",
        "nombre": "Arquitectura del Paisaje y Paisajismo",
        "cine_f_codigo": "0731",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["paisajismo", "paisajista", "areas verdes", "jardines", "parques"],
        "ocupaciones": ["2162"]
    },
    {
        "id": "GEN-0731-03",
        "nombre": "Urbanismo y Planificación Territorial",
        "cine_f_codigo": "0731",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["urbanista", "urbanismo", "planificacion urbana", "ciudad", "territorio"],
        "ocupaciones": ["2164", "2165"]
    },
    {
        "id": "GEN-0714-01",
        "nombre": "Ingeniería Civil Mecánica",
        "cine_f_codigo": "0714",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["mecanica", "termofluido", "maquinas", "motores", "diseno mecanico"],
        "ocupaciones": ["2144"]
    },
    {
        "id": "GEN-0713-01",
        "nombre": "Ingeniería Civil Eléctrica",
        "cine_f_codigo": "0713",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["electrica", "potencia", "energia", "redes electricas", "subestaciones"],
        "ocupaciones": ["2151"]
    },
    {
        "id": "GEN-0713-02",
        "nombre": "Ingeniería Civil Electrónica y Automatización",
        "cine_f_codigo": "0713",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["electronica", "automatizacion", "robotica", "control", "sensores"],
        "ocupaciones": ["2152", "2153"]
    },
    {
        "id": "GEN-0711-02",
        "nombre": "Ingeniería Civil Química / Biotecnología",
        "cine_f_codigo": "0711",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["quimica", "procesos quimicos", "bioprocesos", "biotecnologia", "refineria"],
        "ocupaciones": ["2145"]
    },
    {
        "id": "GEN-0724-01",
        "nombre": "Ingeniería Civil en Minas",
        "cine_f_codigo": "0724",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["minas", "mineria", "yacimientos", "extraccion", "cobre", "chile minero"],
        "ocupaciones": ["1322", "2146"]
    },
    {
        "id": "GEN-0724-02",
        "nombre": "Ingeniería Civil Metalúrgica",
        "cine_f_codigo": "0724",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["metalurgia", "fundicion", "lixiviacion", "materiales", "minerales"],
        "ocupaciones": ["2146"]
    },
    {
        "id": "GEN-0532-01",
        "nombre": "Geología",
        "cine_f_codigo": "0532",
        "area_cine": "Ciencias naturales, matemáticas y estadística",
        "nivel": "Profesional",
        "alias_busqueda": ["geologo", "geologia", "rocas", "mineralogia", "sismologia", "yacimientos"],
        "ocupaciones": ["2114"]
    },
    {
        "id": "GEN-0712-01",
        "nombre": "Ingeniería en Prevención de Riesgos",
        "cine_f_codigo": "0712",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["prevencionista", "prevencion de riesgos", "seguridad laboral", "salud ocupacional"],
        "ocupaciones": ["2263", "3257"]
    },
    {
        "id": "GEN-0712-02",
        "nombre": "Ingeniería Ambiental / Recursos Naturales",
        "cine_f_codigo": "0712",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["ambiental", "medio ambiente", "sustentabilidad", "evaluacion ambiental", "residuos"],
        "ocupaciones": ["2133", "2143"]
    },
    {
        "id": "GEN-0714-02",
        "nombre": "Ingeniería en Mecánica Automotriz y Autotrónica",
        "cine_f_codigo": "0714",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["automotriz", "autos", "mecanica automotriz", "autotronica", "vehiculos"],
        "ocupaciones": ["2144", "3115"]
    },
    {
        "id": "GEN-0719-01",
        "nombre": "Ingeniería Biomédica",
        "cine_f_codigo": "0719",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["biomedica", "equipos medicos", "bioingenieria", "tecnologia hospitalaria"],
        "ocupaciones": ["2149"]
    },
    {
        "id": "GEN-0732-03",
        "nombre": "Ingeniería en Geomensura y Topografía",
        "cine_f_codigo": "0732",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["geomensura", "topografia", "medicion de terrenos", "cartografia", "gis"],
        "ocupaciones": ["2165", "3112"]
    },
    {
        "id": "TNS-0732-01",
        "nombre": "Técnico en Construcción y Obras Civiles",
        "cine_f_codigo": "0732",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tecnico construccion", "edificacion", "capataz", "obra"],
        "ocupaciones": ["3123"]
    },
    {
        "id": "TNS-0732-02",
        "nombre": "Técnico en Topografía y Geomensura",
        "cine_f_codigo": "0732",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["topografo", "nivelacion", "terrenos", "gps topografico"],
        "ocupaciones": ["3112"]
    },
    {
        "id": "TNS-0714-01",
        "nombre": "Técnico en Mecánica Automotriz y Autotrónica",
        "cine_f_codigo": "0714",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["mecanico", "taller mecanico", "inyeccion electronica", "frenos", "motor"],
        "ocupaciones": ["3115"]
    },
    {
        "id": "TNS-0714-02",
        "nombre": "Técnico en Mantenimiento Industrial y Maquinaria Pesada",
        "cine_f_codigo": "0714",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["mantenimiento", "maquinaria pesada", "palas", "camiones mineros", "hidraulica industrial"],
        "ocupaciones": ["3115", "3122"]
    },
    {
        "id": "TNS-0713-01",
        "nombre": "Técnico en Electricidad y Eficiencia Energética",
        "cine_f_codigo": "0713",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["electricista", "instalaciones electricas", "tableros", "sec", "energia solar"],
        "ocupaciones": ["3113"]
    },
    {
        "id": "TNS-0713-02",
        "nombre": "Técnico en Automatización y Control Industrial",
        "cine_f_codigo": "0713",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["plc", "scada", "automatizacion", "instrumentacion", "robotica"],
        "ocupaciones": ["3119"]
    },
    {
        "id": "TNS-0724-01",
        "nombre": "Técnico en Operaciones Mineras y Metalurgia",
        "cine_f_codigo": "0724",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["minero", "chancado", "flotacion", "turno minero", "cobre"],
        "ocupaciones": ["3117"]
    },
    {
        "id": "TNS-0712-01",
        "nombre": "Técnico en Prevención de Riesgos",
        "cine_f_codigo": "0712",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["prevencionista tecnico", "epp", "seguridad en faenas", "accidentes"],
        "ocupaciones": ["3257"]
    },
    {
        "id": "TNS-0714-03",
        "nombre": "Técnico en Climatización y Refrigeración",
        "cine_f_codigo": "0714",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["aire acondicionado", "refrigeracion", "hvac", "calefaccion", "camaras de frio"],
        "ocupaciones": ["3115"]
    },
    {
        "id": "TNS-0716-01",
        "nombre": "Piloto Comercial y Operaciones de Vuelo",
        "cine_f_codigo": "0716",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["piloto", "aviacion", "avion", "aeronautica", "vuelo", "linea aerea"],
        "ocupaciones": ["3153", "3154"]
    },

    # =========================================================================
    # 4. ADMINISTRACIÓN, NEGOCIOS Y COMERCIO (CINE-F 041)
    # =========================================================================
    {
        "id": "GEN-0413-01",
        "nombre": "Ingeniería Comercial",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["comercial", "administracion", "negocios", "finanzas", "marketing", "economia"],
        "ocupaciones": ["1120", "1211", "1219", "1221", "2412", "2421", "2431"]
    },
    {
        "id": "GEN-0411-01",
        "nombre": "Contador Auditor / Contabilidad Pública",
        "cine_f_codigo": "0411",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["contador", "auditor", "contabilidad", "finanzas", "tributaria", "impuestos", "sii"],
        "ocupaciones": ["2411", "2412", "2413"]
    },
    {
        "id": "GEN-0413-02",
        "nombre": "Ingeniería en Información y Control de Gestión",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["control de gestion", "kpi", "bi", "cuadro de mando", "auditoria de gestion"],
        "ocupaciones": ["2412", "2421", "2511"]
    },
    {
        "id": "GEN-0413-03",
        "nombre": "Ingeniería en Administración de Empresas",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["administrador", "gestion", "pyme", "gerencia", "negocios"],
        "ocupaciones": ["1211", "1219", "2421"]
    },
    {
        "id": "GEN-0414-01",
        "nombre": "Ingeniería en Marketing / Comercialización",
        "cine_f_codigo": "0414",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["marketing", "mercadotecnia", "ventas", "growth", "marca", "consumidor"],
        "ocupaciones": ["1221", "2431"]
    },
    {
        "id": "GEN-0413-04",
        "nombre": "Ingeniería en Recursos Humanos",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["rrhh", "recursos humanos", "seleccion", "talento", "capacitacion", "clima laboral"],
        "ocupaciones": ["1212", "2423"]
    },
    {
        "id": "GEN-0413-05",
        "nombre": "Ingeniería en Comercio Exterior / Logística",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["comercio exterior", "comex", "aduanas", "importaciones", "exportaciones", "logistica"],
        "ocupaciones": ["1324", "3331"]
    },
    {
        "id": "GEN-0412-01",
        "nombre": "Ingeniería en Finanzas",
        "cine_f_codigo": "0412",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["finanzas", "inversiones", "banca", "riesgo financiero", "mercado de capitales"],
        "ocupaciones": ["1211", "2412", "2413", "3311"]
    },
    {
        "id": "TNS-0411-01",
        "nombre": "Técnico en Contabilidad General",
        "cine_f_codigo": "0411",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tecnico contable", "contabilidad", "libros", "facturacion", "remuneraciones"],
        "ocupaciones": ["3313"]
    },
    {
        "id": "TNS-0413-01",
        "nombre": "Técnico en Administración de Empresas",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["asistente administrativo", "oficina", "gestion empresas", "tramites"],
        "ocupaciones": ["3343"]
    },
    {
        "id": "TNS-0413-02",
        "nombre": "Técnico en Administración de Recursos Humanos",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["asistente rrhh", "contratos", "finiquitos", "asistencia personal"],
        "ocupaciones": ["3333"]
    },
    {
        "id": "TNS-0413-03",
        "nombre": "Técnico en Logística y Gestión de Operaciones",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["bodega", "despacho", "inventario", "distribucion", "transporte"],
        "ocupaciones": ["3331"]
    },
    {
        "id": "TNS-0413-04",
        "nombre": "Técnico en Comercio Exterior y Aduanas",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["agente aduanero", "embarques", "contenedores", "puertos"],
        "ocupaciones": ["3331"]
    },
    {
        "id": "TNS-0414-01",
        "nombre": "Técnico en Marketing y Ventas",
        "cine_f_codigo": "0414",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["ventas", "vendedor tecnico", "promocion", "canales digitales"],
        "ocupaciones": ["3322"]
    },
    {
        "id": "TNS-0412-01",
        "nombre": "Técnico en Finanzas y Servicios Bancarios",
        "cine_f_codigo": "0412",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["cajero", "ejecutivo de cuentas", "banco", "creditos"],
        "ocupaciones": ["3311", "3312"]
    },

    # =========================================================================
    # 5. CIENCIAS SOCIALES, JURÍDICAS Y HUMANIDADES (CINE-F 031, 042, 023)
    # =========================================================================
    {
        "id": "GEN-0421-01",
        "nombre": "Derecho",
        "cine_f_codigo": "0421",
        "area_cine": "Ciencias sociales y jurídicas",
        "nivel": "Profesional",
        "alias_busqueda": ["abogado", "abogacia", "leyes", "juridico", "derecho", "tribunales", "juez", "fiscal"],
        "ocupaciones": ["2611", "2612", "2619"]
    },
    {
        "id": "GEN-0313-01",
        "nombre": "Psicología",
        "cine_f_codigo": "0313",
        "area_cine": "Ciencias sociales",
        "nivel": "Profesional",
        "alias_busqueda": ["psicologo", "psicologia", "salud mental", "terapia", "psicoanalisis", "clinica"],
        "ocupaciones": ["2634"]
    },
    {
        "id": "GEN-0923-01",
        "nombre": "Trabajo Social / Asistencia Social",
        "cine_f_codigo": "0923",
        "area_cine": "Ciencias sociales",
        "nivel": "Profesional",
        "alias_busqueda": ["trabajador social", "asistente social", "familia", "comunidad", "bienestar social"],
        "ocupaciones": ["1344", "2635"]
    },
    {
        "id": "GEN-0314-01",
        "nombre": "Sociología",
        "cine_f_codigo": "0314",
        "area_cine": "Ciencias sociales",
        "nivel": "Profesional",
        "alias_busqueda": ["sociologo", "sociologia", "estudios sociales", "investigacion cuantitativa", "politicas"],
        "ocupaciones": ["2632"]
    },
    {
        "id": "GEN-0314-02",
        "nombre": "Antropología y Arqueología",
        "cine_f_codigo": "0314",
        "area_cine": "Ciencias sociales",
        "nivel": "Profesional",
        "alias_busqueda": ["antropologo", "arqueologo", "cultura", "patrimonio", "etnografia"],
        "ocupaciones": ["2632"]
    },
    {
        "id": "GEN-0312-01",
        "nombre": "Ciencia Política y Administración Pública",
        "cine_f_codigo": "0312",
        "area_cine": "Ciencias sociales",
        "nivel": "Profesional",
        "alias_busqueda": ["administrador publico", "politologo", "gobierno", "estado", "ministerios", "municipios"],
        "ocupaciones": ["1112", "2422"]
    },
    {
        "id": "GEN-0321-01",
        "nombre": "Periodismo y Comunicación Social",
        "cine_f_codigo": "0321",
        "area_cine": "Comunicaciones",
        "nivel": "Profesional",
        "alias_busqueda": ["periodista", "prensa", "comunicacion", "medios", "periodismo", "television", "radio"],
        "ocupaciones": ["2642"]
    },
    {
        "id": "GEN-0321-02",
        "nombre": "Publicidad",
        "cine_f_codigo": "0321",
        "area_cine": "Comunicaciones",
        "nivel": "Profesional",
        "alias_busqueda": ["publicista", "publicidad", "campanas", "creativo", "agencia", "copywriter"],
        "ocupaciones": ["2431"]
    },
    {
        "id": "GEN-0321-03",
        "nombre": "Relaciones Públicas y Comunicación Corporativa",
        "cine_f_codigo": "0321",
        "area_cine": "Comunicaciones",
        "nivel": "Profesional",
        "alias_busqueda": ["relaciones publicas", "rrpp", "comunicacion estrategica", "voceria"],
        "ocupaciones": ["1222", "2432"]
    },
    {
        "id": "GEN-0231-01",
        "nombre": "Traducción e Interpretación",
        "cine_f_codigo": "0231",
        "area_cine": "Humanidades y lenguas",
        "nivel": "Profesional",
        "alias_busqueda": ["traductor", "interprete", "idiomas", "traduccion ingles", "simultanea"],
        "ocupaciones": ["2643"]
    },
    {
        "id": "GEN-0222-01",
        "nombre": "Historia y Geografía",
        "cine_f_codigo": "0222",
        "area_cine": "Humanidades y lenguas",
        "nivel": "Profesional",
        "alias_busqueda": ["historiador", "historia", "geografo", "geografia", "patrimonio historico"],
        "ocupaciones": ["2632", "2633"]
    },
    {
        "id": "GEN-0322-01",
        "nombre": "Bibliotecología y Gestión de Información",
        "cine_f_codigo": "0322",
        "area_cine": "Humanidades y lenguas",
        "nivel": "Profesional",
        "alias_busqueda": ["bibliotecario", "archivero", "documentacion", "archivos", "patrimonio bibliografico"],
        "ocupaciones": ["2621", "2622"]
    },
    {
        "id": "TNS-0421-01",
        "nombre": "Técnico Jurídico",
        "cine_f_codigo": "0421",
        "area_cine": "Ciencias sociales y jurídicas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["asistente judicial", "notaria", "tribunales", "receptor", "estudio juridico"],
        "ocupaciones": ["3411"]
    },
    {
        "id": "TNS-0923-01",
        "nombre": "Técnico en Trabajo Social y Gestión Comunitaria",
        "cine_f_codigo": "0923",
        "area_cine": "Ciencias sociales",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["asistente comunitario", "municipalidad", "desarrollo social", "ong"],
        "ocupaciones": ["3412"]
    },

    # =========================================================================
    # 6. EDUCACIÓN Y PEDAGOGÍA (CINE-F 011)
    # =========================================================================
    {
        "id": "GEN-0114-01",
        "nombre": "Pedagogía en Educación Básica",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["profesor basica", "educacion basica", "maestro", "docente basica", "colegio"],
        "ocupaciones": ["2341"]
    },
    {
        "id": "GEN-0112-01",
        "nombre": "Educación Parvularia / Educación Inicial",
        "cine_f_codigo": "0112",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["parvularia", "educadora de parvulos", "jardin infantil", "sala cuna", "primera infancia"],
        "ocupaciones": ["1341", "2342"]
    },
    {
        "id": "GEN-0114-02",
        "nombre": "Pedagogía en Educación Media (Asignaturas Científicas y Humanistas)",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["profesor media", "profesor matematicas", "profesor lenguaje", "profesor historia", "docente"],
        "ocupaciones": ["2330"]
    },
    {
        "id": "GEN-0114-03",
        "nombre": "Pedagogía en Educación Diferencial / Necesidades Especiales",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["educacion diferencial", "pie", "educadora diferencial", "inclusion", "nee"],
        "ocupaciones": ["2352"]
    },
    {
        "id": "GEN-0114-04",
        "nombre": "Pedagogía en Inglés e Idiomas Extranjeros",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["profesor ingles", "docente ingles", "pedagogia ingles", "idiomas"],
        "ocupaciones": ["2353"]
    },
    {
        "id": "GEN-0114-05",
        "nombre": "Pedagogía en Educación Física y Deportes",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["educacion fisica", "profesor gimnasia", "deportes", "motricidad"],
        "ocupaciones": ["2359"]
    },
    {
        "id": "GEN-0114-06",
        "nombre": "Pedagogía en Música y Artes",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["profesor musica", "profesor artes", "educacion artistica"],
        "ocupaciones": ["2354", "2355"]
    },
    {
        "id": "TNS-0112-01",
        "nombre": "Técnico en Educación Parvularia y Primer Ciclo Básico",
        "cine_f_codigo": "0112",
        "area_cine": "Educación",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["asistente de parvulos", "tecnico parvulos", "sala cuna", "junji", "integra"],
        "ocupaciones": ["3412"]
    },
    {
        "id": "TNS-0114-01",
        "nombre": "Técnico en Educación Diferencial e Inclusión",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["asistente de aula diferencial", "tecnico diferencial", "apoyo pie"],
        "ocupaciones": ["3412"]
    },
    {
        "id": "TNS-0114-02",
        "nombre": "Técnico en Preparación Física y Entrenamiento Deportivo",
        "cine_f_codigo": "0114",
        "area_cine": "Educación",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["preparador fisico", "personal trainer", "gimnasio", "entrenador"],
        "ocupaciones": ["3422"]
    },

    # =========================================================================
    # 7. ARTES, DISEÑO Y COMUNICACIÓN AUDIOVISUAL (CINE-F 021)
    # =========================================================================
    {
        "id": "GEN-0211-01",
        "nombre": "Diseño Gráfico y Comunicación Visual",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["disenador grafico", "diseno", "branding", "ilustracion", "editorial", "ux ui"],
        "ocupaciones": ["2166"]
    },
    {
        "id": "GEN-0211-02",
        "nombre": "Diseño Industrial y de Productos",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["diseno industrial", "productos", "mobiliario", "prototipos", "ergonomia"],
        "ocupaciones": ["2163"]
    },
    {
        "id": "GEN-0211-03",
        "nombre": "Cine, Dirección Audiovisual y Televisión",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["cineasta", "director de cine", "audiovisual", "guionista", "documental", "ficcion"],
        "ocupaciones": ["2654"]
    },
    {
        "id": "GEN-0211-04",
        "nombre": "Animación Digital y Desarrollo de Videojuegos",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["animador digital", "animacion 3d", "videojuegos", "game dev", "vfx"],
        "ocupaciones": ["2166", "2513"]
    },
    {
        "id": "GEN-0215-01",
        "nombre": "Música e Interpretación Musical",
        "cine_f_codigo": "0215",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["musico", "compositor", "instrumentista", "canto", "orquesta"],
        "ocupaciones": ["2652"]
    },
    {
        "id": "GEN-0215-02",
        "nombre": "Teatro, Actuación y Artes Escénicas",
        "cine_f_codigo": "0215",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["actor", "actriz", "teatro", "dramaturgia", "artes escenicas"],
        "ocupaciones": ["2655"]
    },
    {
        "id": "GEN-0213-01",
        "nombre": "Artes Visuales y Plásticas",
        "cine_f_codigo": "0213",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["artista visual", "pintor", "escultor", "galeria", "arte contemporaneo"],
        "ocupaciones": ["2651"]
    },
    {
        "id": "GEN-0215-03",
        "nombre": "Ingeniería y Producción en Sonido",
        "cine_f_codigo": "0215",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["ingeniero en sonido", "productor musical", "estudio de grabacion", "mezcla", "masterizacion"],
        "ocupaciones": ["2652", "3521"]
    },
    {
        "id": "TNS-0211-01",
        "nombre": "Técnico en Diseño Gráfico Digital",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tecnico diseno", "photoshop", "illustrator", "redes sociales", "arte digital"],
        "ocupaciones": ["3432"]
    },
    {
        "id": "TNS-0211-02",
        "nombre": "Técnico en Producción Audiovisual y Cámara",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["camarografo", "iluminador", "edicion de video", "postproduccion"],
        "ocupaciones": ["3521"]
    },
    {
        "id": "TNS-0211-03",
        "nombre": "Técnico en Sonido y Refuerzo Sonoro",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["sonidista", "conciertos", "microfonista", "audio en vivo"],
        "ocupaciones": ["3521"]
    },
    {
        "id": "TNS-0211-04",
        "nombre": "Fotografía Profesional",
        "cine_f_codigo": "0211",
        "area_cine": "Artes y diseño",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["fotografo", "fotografia", "estudio fotografico", "camara", "iluminacion"],
        "ocupaciones": ["3431"]
    },

    # =========================================================================
    # 8. CIENCIAS NATURALES Y MATEMÁTICAS (CINE-F 051, 052, 053, 054)
    # =========================================================================
    {
        "id": "GEN-0533-01",
        "nombre": "Licenciatura en Astronomía y Astrofísica",
        "cine_f_codigo": "0533",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["astronomo", "astronomia", "telescopios", "observatorio", "universo", "astrofisica"],
        "ocupaciones": ["2111"]
    },
    {
        "id": "GEN-0533-02",
        "nombre": "Licenciatura en Física",
        "cine_f_codigo": "0533",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["fisico", "fisica", "fisica teorica", "materia condensada", "cuantica"],
        "ocupaciones": ["2111"]
    },
    {
        "id": "GEN-0531-01",
        "nombre": "Licenciatura en Química",
        "cine_f_codigo": "0531",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["quimico", "quimica", "sintesis", "laboratorio quimico"],
        "ocupaciones": ["2113"]
    },
    {
        "id": "GEN-0541-01",
        "nombre": "Licenciatura en Matemáticas y Estadística",
        "cine_f_codigo": "0541",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["matematico", "estadistico", "actuario", "probabilidades", "modelamiento"],
        "ocupaciones": ["2120"]
    },
    {
        "id": "GEN-0511-01",
        "nombre": "Licenciatura en Biología / Biología Marina",
        "cine_f_codigo": "0511",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["biologo", "biologia", "biologo marino", "oceanografia", "ecosistemas", "fauna"],
        "ocupaciones": ["2131"]
    },
    {
        "id": "TNS-0531-01",
        "nombre": "Técnico en Análisis Químico y Control de Calidad",
        "cine_f_codigo": "0531",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["analista quimico", "control de calidad", "laboratorio industrial"],
        "ocupaciones": ["3111"]
    },

    # =========================================================================
    # 9. AGROPECUARIA, SILVICULTURA Y PESCA (CINE-F 081, 082)
    # =========================================================================
    {
        "id": "GEN-0811-01",
        "nombre": "Agronomía / Ingeniería Agronómica",
        "cine_f_codigo": "0811",
        "area_cine": "Agropecuaria y medio ambiente",
        "nivel": "Profesional",
        "alias_busqueda": ["agronomo", "agricultura", "cultivos", "fruticultura", "riego", "suelos"],
        "ocupaciones": ["1311", "2132"]
    },
    {
        "id": "GEN-0821-01",
        "nombre": "Ingeniería Forestal",
        "cine_f_codigo": "0821",
        "area_cine": "Agropecuaria y medio ambiente",
        "nivel": "Profesional",
        "alias_busqueda": ["forestal", "bosques", "silvicultura", "madera", "plantaciones"],
        "ocupaciones": ["1311", "2132"]
    },
    {
        "id": "GEN-0831-01",
        "nombre": "Ingeniería en Acuicultura y Pesca",
        "cine_f_codigo": "0831",
        "area_cine": "Agropecuaria y medio ambiente",
        "nivel": "Profesional",
        "alias_busqueda": ["acuicultura", "salmonicultura", "cultivo de peces", "pesca"],
        "ocupaciones": ["1312", "2131"]
    },
    {
        "id": "TNS-0811-01",
        "nombre": "Técnico Agrícola y Agropecuario",
        "cine_f_codigo": "0811",
        "area_cine": "Agropecuaria y medio ambiente",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["tecnico agricola", "campo", "siembra", "cosecha", "riego tecnificado"],
        "ocupaciones": ["3142"]
    },
    {
        "id": "TNS-0821-01",
        "nombre": "Técnico Forestal y Manejo del Fuego",
        "cine_f_codigo": "0821",
        "area_cine": "Agropecuaria y medio ambiente",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["brigadista forestal", "manejo de bosques", "aserradero", "vivero"],
        "ocupaciones": ["3143"]
    },
    {
        "id": "TNS-0811-02",
        "nombre": "Técnico en Vitivinicultura y Enología",
        "cine_f_codigo": "0811",
        "area_cine": "Agropecuaria y medio ambiente",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["vino", "bodega de vinos", "vinos chilenos", "vendimia", "enologo"],
        "ocupaciones": ["3142"]
    },

    # =========================================================================
    # 10. SERVICIOS, TURISMO Y GASTRONOMÍA (CINE-F 101)
    # =========================================================================
    {
        "id": "GEN-1013-01",
        "nombre": "Administración Hotelera y de Turismo",
        "cine_f_codigo": "1013",
        "area_cine": "Servicios y turismo",
        "nivel": "Profesional",
        "alias_busqueda": ["turismo", "hoteleria", "administrador hotelero", "resort", "agencia de viajes"],
        "ocupaciones": ["1411", "1439"]
    },
    {
        "id": "GEN-1013-02",
        "nombre": "Dirección y Gestión Gastronómica",
        "cine_f_codigo": "1013",
        "area_cine": "Servicios y turismo",
        "nivel": "Profesional",
        "alias_busqueda": ["administrador gastronomico", "restaurante", "culinario", "gerente de restaurante"],
        "ocupaciones": ["1412", "3434"]
    },
    {
        "id": "TNS-1013-01",
        "nombre": "Técnico en Gastronomía Internacional y Arte Culinario",
        "cine_f_codigo": "1013",
        "area_cine": "Servicios y turismo",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["chef", "cocinero", "gastronomia", "pasteleria", "cocina internacional"],
        "ocupaciones": ["3434"]
    },
    {
        "id": "TNS-1013-02",
        "nombre": "Técnico en Turismo y Guía de Ecoturismo",
        "cine_f_codigo": "1013",
        "area_cine": "Servicios y turismo",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["guia turistico", "ecoturismo", "trekking", "tours", "patagonia"],
        "ocupaciones": ["3434"]
    },
    {
        "id": "TNS-1013-03",
        "nombre": "Técnico en Hotelería y Operaciones de Alojamiento",
        "cine_f_codigo": "1013",
        "area_cine": "Servicios y turismo",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["recepcionista hotel", "housekeeping", "concierge", "front desk"],
        "ocupaciones": ["1411", "3434"]
    }
,
    # 11. OTRAS CARRERAS PROFESIONALES Y TÉCNICAS ESPECÍFICAS
    # =========================================================================
    {
        "id": "GEN-0311-01",
        "nombre": "Licenciatura en Economía / Ciencias Económicas",
        "cine_f_codigo": "0311",
        "area_cine": "Ciencias sociales",
        "nivel": "Profesional",
        "alias_busqueda": ["economista", "economia", "macroeconomia", "microeconomia", "banco central", "politica monetaria"],
        "ocupaciones": ["2631", "1346", "1211"]
    },
    {
        "id": "GEN-0532-02",
        "nombre": "Meteorología y Ciencias Atmosféricas",
        "cine_f_codigo": "0532",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["meteorologo", "clima", "pronostico", "tiempo", "atmosfera"],
        "ocupaciones": ["2112"]
    },
    {
        "id": "GEN-0232-01",
        "nombre": "Literatura, Letras y Creación Narrativa",
        "cine_f_codigo": "0232",
        "area_cine": "Humanidades y lenguas",
        "nivel": "Profesional",
        "alias_busqueda": ["escritor", "literatura", "letras", "narrativa", "editorial", "redactor"],
        "ocupaciones": ["2641", "2643"]
    },
    {
        "id": "GEN-0215-04",
        "nombre": "Danza, Coreografía y Artes del Movimiento",
        "cine_f_codigo": "0215",
        "area_cine": "Artes y diseño",
        "nivel": "Profesional",
        "alias_busqueda": ["bailarin", "danza", "coreografo", "ballet", "danza contemporanea"],
        "ocupaciones": ["2653"]
    },
    {
        "id": "GEN-0321-04",
        "nombre": "Locución y Conducción de Radio y Televisión",
        "cine_f_codigo": "0321",
        "area_cine": "Comunicaciones",
        "nivel": "Profesional",
        "alias_busqueda": ["locutor", "animador", "conductor", "radio", "podcaster", "presentador"],
        "ocupaciones": ["2656", "3431"]
    },
    {
        "id": "GEN-0914-03",
        "nombre": "Tecnología Médica en Oftalmología y Optometría",
        "cine_f_codigo": "0914",
        "area_cine": "Salud y bienestar",
        "nivel": "Profesional",
        "alias_busqueda": ["optometrista", "oftalmologia", "lentes", "vision", "optica"],
        "ocupaciones": ["2267", "3254"]
    },
    {
        "id": "GEN-0512-01",
        "nombre": "Ingeniería en Biotecnología / Bioingeniería",
        "cine_f_codigo": "0512",
        "area_cine": "Ciencias naturales y exactas",
        "nivel": "Profesional",
        "alias_busqueda": ["biotecnologo", "biotecnologia", "genetica", "fermentacion", "biorreactores"],
        "ocupaciones": ["2131", "3141"]
    },
    {
        "id": "GEN-0414-02",
        "nombre": "Visitador Médico y Representación Farmacéutica",
        "cine_f_codigo": "0414",
        "area_cine": "Administración de empresas",
        "nivel": "Profesional",
        "alias_busqueda": ["visitador medico", "farmaceutica", "ventas medicas", "laboratorios"],
        "ocupaciones": ["2433", "3213"]
    },
    {
        "id": "GEN-0414-03",
        "nombre": "Ingeniería en Ventas y Soluciones TIC",
        "cine_f_codigo": "0414",
        "area_cine": "Tecnología de la información",
        "nivel": "Profesional",
        "alias_busqueda": ["ventas ti", "soluciones software", "cloud sales", "preventa tic"],
        "ocupaciones": ["2434", "3322"]
    },
    {
        "id": "GEN-0716-02",
        "nombre": "Oficial de Marina Mercante y Transporte Marítimo",
        "cine_f_codigo": "0716",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Profesional",
        "alias_busqueda": ["marina mercante", "capitan de barco", "navegacion maritima", "oficial de puente"],
        "ocupaciones": ["3151", "3152"]
    },
    {
        "id": "TNS-0716-02",
        "nombre": "Técnico en Mantenimiento Aeronáutico",
        "cine_f_codigo": "0716",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["mecanico de aviones", "aviones", "hangar", "turbinas", "aeronaves"],
        "ocupaciones": ["3155"]
    },
    {
        "id": "TNS-0911-02",
        "nombre": "Técnico en Laboratorio Dental y Prótesis",
        "cine_f_codigo": "0911",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["protesista dental", "laboratorio dental", "coronas", "protesis"],
        "ocupaciones": ["3214", "3251"]
    },
    {
        "id": "TNS-0413-05",
        "nombre": "Técnico en Administración de Salud y Secretariado Médico",
        "cine_f_codigo": "0413",
        "area_cine": "Salud y bienestar",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["secretaria medica", "admision clinica", "isapre", "fonasa", "fichas clinicas"],
        "ocupaciones": ["3344", "1342"]
    },
    {
        "id": "TNS-0732-03",
        "nombre": "Técnico en Dibujo Arquitectónico, Estructural y BIM",
        "cine_f_codigo": "0732",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["dibujante proyectista", "autocad", "revit", "bim", "planos"],
        "ocupaciones": ["3118"]
    },
    {
        "id": "TNS-0413-06",
        "nombre": "Técnico en Gestión Inmobiliaria y Corretaje de Propiedades",
        "cine_f_codigo": "0413",
        "area_cine": "Administración de empresas",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["corredor de propiedades", "inmobiliaria", "bienes raices", "arriendos", "ventas de casas"],
        "ocupaciones": ["3334"]
    },
    {
        "id": "TNS-0713-03",
        "nombre": "Técnico en Operación de Plantas Industriales y Energía",
        "cine_f_codigo": "0713",
        "area_cine": "Ingeniería y profesiones afines",
        "nivel": "Técnico Nivel Superior",
        "alias_busqueda": ["operador de planta", "termoelectrica", "sala de control", "calderas"],
        "ocupaciones": ["3131", "3132", "3133"]
    },
    {
        "id": "GEN-0222-02",
        "nombre": "Conservación, Restauración y Museología",
        "cine_f_codigo": "0222",
        "area_cine": "Humanidades y lenguas",
        "nivel": "Profesional",
        "alias_busqueda": ["museologo", "restaurador", "conservador", "museo", "patrimonio cultural"],
        "ocupaciones": ["2621", "3433"]
    },
    {
        "id": "GEN-0221-01",
        "nombre": "Teología y Ciencias Religiosas",
        "cine_f_codigo": "0221",
        "area_cine": "Humanidades y lenguas",
        "nivel": "Profesional",
        "alias_busqueda": ["teologo", "pastor", "sacerdote", "teologia", "religion"],
        "ocupaciones": ["2636", "3413"]
    },
    {
        "id": "GEN-0111-01",
        "nombre": "Gestión y Liderazgo Educativo",
        "cine_f_codigo": "0111",
        "area_cine": "Educación",
        "nivel": "Profesional",
        "alias_busqueda": ["director de colegio", "director de escuela", "rector", "jefe utp", "gestion educativa"],
        "ocupaciones": ["1345", "2351"]
    }

]

def main():
    print(f"Total de carreras genéricas chilenas en catálogo: {len(CARRERAS_DATA)}")
    
    # Validar unicidad de IDs
    ids = [c["id"] for c in CARRERAS_DATA]
    assert len(ids) == len(set(ids)), "Error: Existen IDs duplicados en el catálogo"
    
    # Exportar a processed y public
    out_processed = OUTPUT_DIR / "catalogo_carreras.json"
    out_public = PUBLIC_DIR / "catalogo_carreras.json"
    
    with open(out_processed, "w", encoding="utf-8") as f:
        json.dump(CARRERAS_DATA, f, ensure_ascii=False, indent=2)
        
    with open(out_public, "w", encoding="utf-8") as f:
        json.dump(CARRERAS_DATA, f, ensure_ascii=False, indent=2)
        
    print(f"Catálogo generado exitosamente en:")
    print(f" - {out_processed}")
    print(f" - {out_public}")

if __name__ == "__main__":
    main()
