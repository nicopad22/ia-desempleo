# Fuentes y bases de datos requeridas

Seis fuentes son obligatorias y dos son opcionales para validar. Las celdas marcadas *"verificar"* se confirman al descargar cada archivo.

| Fuente | Qué aporta | Nivel | Rol |
| :--- | :--- | :--- | :--- |
| **SIES / mifuturo.cl, base de oferta académica** | Carreras, carrera genérica, nivel (TNS, profesional), campo CINE-F 2013 | Programa | Obligatoria · verificar si el campo viene a 2, 3 o 4 dígitos |
| **Estructura ISCO-08 (OIT)** | Códigos, títulos, descripciones y nivel de competencias | 1 a 4 dígitos | Obligatoria |
| **CINE-F 2013 (UNESCO), Tabla 2** | Puente entre campos CINE-F 2013 y CINE 1997 | Campo | Obligatoria |
| **Montt (2015), OECD WP 167** | Campo de estudio → grupos ISCO-08 | ISCO 3 dígitos | Obligatoria, base de la asignación |
| **Tabla 6, enfoque por tareas (2018)** | Campo detallado → ocupación | Campo detallado | Obligatoria, refina a Montt |
| **OIT, WP 140 (2025)** | Puntaje y gradiente de exposición a IA generativa | ISCO 4 dígitos | Obligatoria |
| **ESCO** | Descripciones y competencias por ocupación | ISCO 4 dígitos y más | Opcional, para revisar casos dudosos |
| **Casen o encuestas de seguimiento de titulados** | Ocupaciones reales de titulados | CIUO-08.CL | Opcional, validación empírica · verificar si registra campo de estudio |

> **Nota:** El índice de la OIT es la versión 2025, que reemplaza al de 2023 y presenta los puntajes en cuatro gradientes de exposición. Su anexo trae la exposición por cada ocupación ISCO-08 de 4 dígitos.