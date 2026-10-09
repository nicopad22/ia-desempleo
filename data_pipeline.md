# Pipeline carreras → ISCO-08 → exposición a IA

## Objetivo y producto final
El pipeline produce una tabla larga con una fila por par carrera × ocupación ISCO-08 de 4 dígitos, más el puntaje de exposición a IA generativa de la OIT para esa ocupación. Su prioridad es la cobertura: toda relación plausible entra, y se etiqueta su fuerza en vez de descartarla.

- **Unidad de carrera:** la carrera genérica del SIES, que agrupa los programas equivalentes de distintas instituciones. Cada programa conserva el vínculo a su carrera genérica.
- **Unidad de ocupación:** el grupo unitario ISCO-08 de 4 dígitos, porque el índice de la OIT está publicado a ese nivel.
- Relación de muchos a muchos, sin límite por carrera ni por ocupación.
- **Destino de uso:** orientación vocacional, para que una persona vea a qué ocupaciones conduce una carrera y cuán expuestas están a la IA generativa.

---

## Fuentes de datos
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

---

## Decisión: filtro de grandes grupos ISCO 1, 2 y 3
El filtro mejora la precisión, pero deja sin destino a parte de las carreras técnicas, así que se aplica con una válvula de escape. Los grandes grupos 1 a 3 son los que la OIT asocia a educación terciaria: el grupo 2 (profesionales) al nivel de competencias 4, el grupo 3 (técnicos) al nivel 3, y el grupo 1 (directivos) a los niveles 3 y 4.

### Lo que el filtro resuelve:
- Elimina las asignaciones ruidosas hacia los grupos 4 a 9, que en las tablas de campo de estudio aparecen por afinidad temática y no porque la carrera sea necesaria.
- Alinea la tabla con la pregunta del usuario final: a qué ocupación calificada lleva esta carrera.

### Lo que el filtro rompe:
- Varias carreras TNS conducen a ocupaciones de los grupos 5 y 7, por ejemplo mecánica automotriz, electricidad, gastronomía o peluquería. Con el filtro estricto quedarían sin ocupación o mal asignadas.
- El grupo 1 es alcanzable desde casi cualquier carrera. Si se trata igual que los grupos 2 y 3, todas las carreras apuntarían a todas las ocupaciones directivas.

### Regla adoptada:
1. La tabla principal contiene solo grupos 1, 2 y 3.
2. Las asignaciones al grupo 1 se etiquetan como `trayectoria`, es decir, una ocupación a la que se llega con experiencia y no al titularse.
3. Una carrera que termina con cero ocupaciones en los grupos 1 a 3 no se descarta. Pasa a una tabla de extensión con su mejor destino en los grupos 4 a 8, marcado `fuera_de_filtro`. Así ninguna carrera queda sin información de exposición a IA.
4. Si el equipo decide mantener el filtro estricto, basta con no publicar la tabla de extensión, sin rehacer el pipeline.

---

## Etapas del pipeline
Son nueve etapas en secuencia. Las etapas 1 a 4 generan candidatos amplios y las 5 a 6 los etiquetan; ninguna etapa borra un par, solo cambia su etiqueta.

1. **Ingesta:** Cargar las seis fuentes obligatorias tal como se descargan y guardar cada archivo crudo con su fecha. Normalizar códigos como texto con ceros a la izquierda (`0111`, no `111`).
2. **Catálogo de carreras:** Agrupar los programas del SIES por carrera genérica y nivel (TNS, profesional, profesional con licenciatura). Asignar a cada carrera genérica un campo CINE-F 2013 de 4 dígitos. Si el SIES solo trae área o subárea, el campo detallado se infiere del nombre y queda marcado `cine_inferido` para revisión.
3. **Puente de clasificaciones de educación:** Pasar cada campo CINE-F 2013 a su campo CINE 1997 con la Tabla 2 de la UNESCO. Los campos que se dividen entre dos campos antiguos, como TIC o Medio ambiente, conservan ambos destinos.
4. **Candidatos por campo:** Aplicar la tabla de Montt para obtener los grupos ISCO-08 de 3 dígitos de cada campo. Quedarse con los grupos 1, 2 y 3, y expandir cada grupo de 3 dígitos a todos sus grupos unitarios de 4 dígitos. Etiqueta inicial: `afin_por_campo`.
5. **Refinamiento por campo detallado:** Cruzar con la Tabla 6 del enfoque por tareas, que trabaja a nivel de campo detallado. Los pares que aparecen allí suben a `directa`. Los que no aparecen se mantienen como `afin_por_campo`.
6. **Reglas de nivel y revisión:** Aplicar estas reglas:
   - *Carrera TNS:* los grupos unitarios del grupo 3 suben de prioridad, y los del grupo 2 se marcan `requiere_continuidad`.
   - *Carrera profesional:* los del grupo 2 suben de prioridad.
   - *Grupo 1:* siempre `trayectoria`.
   - *Pares dudosos:* revisión humana con las descripciones ISCO o ESCO, registrando quién decidió y por qué.
7. **Validación empírica (opcional):** Si hay una fuente con carrera u área de estudio y ocupación, marcar los pares observados en la realidad como `observado`, y listar las ocupaciones frecuentes que la tabla no tenía. Esas ocupaciones entran a revisión, no automáticamente.
8. **Extensión fuera del filtro:** Las carreras sin ningún par en los grupos 1 a 3 reciben su destino de los grupos 4 a 8, marcado `fuera_de_filtro`, en la tabla de extensión.
9. **Unión con el índice de la OIT:** Unir por código ISCO-08 de 4 dígitos y traer el puntaje y el gradiente de exposición. Si la validación usa CIUO-08.CL, convertir primero a ISCO-08 y revisar los códigos que el INE adaptó.

---

## Esquema de la tabla final
La tabla final `asignaciones` tiene una fila por par carrera × ocupación. Cada columna dice de dónde salió el dato, para que cualquier fila se pueda rastrear hasta su fuente.

| Columna | Tipo | Ejemplo | Origen |
| :--- | :--- | :--- | :--- |
| `carrera_id` | texto | código de carrera genérica | SIES |
| `carrera_nombre` | texto | Enfermería | SIES |
| `nivel` | categoría | profesional | SIES |
| `cine_f_2013` | texto, 4 dígitos | 0913 | SIES o inferido |
| `cine_inferido` | sí/no | no | Etapa 2 |
| `cine_1997` | texto | 72 | Etapa 3 |
| `isco08` | texto, 4 dígitos | 2221 | Etapa 4 |
| `isco08_titulo` | texto | Profesionales de enfermería | Estructura ISCO-08 |
| `gran_grupo` | 1, 2 o 3 | 2 | Estructura ISCO-08 |
| `tipo_relacion` | categoría | directa | Etapas 4 a 6 |
| `requiere_continuidad` | sí/no | no | Etapa 6 |
| `observado` | sí/no/sin dato | sin dato | Etapa 7 |
| `regla_fuente` | texto | Montt + Tabla 6 | Etapas 4 a 6 |
| `revisado_por` | texto | iniciales o vacío | Etapa 6 |
| `oit_puntaje` | número | según anexo OIT | Etapa 9 |
| `oit_gradiente` | categoría | según anexo OIT | Etapa 9 |

- **Valores de `tipo_relacion`:** `directa`, `afin_por_campo`, `trayectoria` y `fuera_de_filtro` (este último solo en la tabla de extensión).

### Tablas auxiliares que acompañan la entrega:
- `carreras`: catálogo de carreras genéricas con sus programas.
- `puente_cine`: CINE-F 2013 → CINE 1997, con las divisiones marcadas.
- `montt_isco`: la tabla de Montt digitalizada.
- `extension`: carreras sin destino en los grupos 1 a 3.
- `no_asignados`: ocupaciones de los grupos 1 a 3 sin ninguna carrera, y carreras con mapeo ambiguo.
- `decisiones`: registro de cada revisión humana.

---

## Controles de calidad y cobertura
El pipeline se da por bueno solo si pasa estos siete controles. Cada uno produce un número o una lista que se revisa en cada corrida:

1. **Cobertura de carreras:** El 100 % de las carreras genéricas tiene al menos un par en `asignaciones` o en `extension`.
2. **Cobertura de ocupaciones:** Cuántos grupos unitarios de los grupos 1 a 3 no tienen ninguna carrera. Se espera que sean pocos, y cada uno debe tener una explicación.
3. **Unión con la OIT:** El 100 % de los códigos de 4 dígitos encuentra su puntaje. Un código sin puntaje indica un error de formato o un código inexistente.
4. **Campos inferidos:** Cuántas carreras tienen `cine_inferido = sí`, y que todas hayan sido revisadas.
5. **Casos límite:** Una muestra fija de carreras conocidas se revisa a mano en cada corrida (por ejemplo: Medicina, Enfermería, Derecho, Ingeniería Comercial, Pedagogía en Educación Básica, TNS en Mecánica Automotriz y Bachillerato).
6. **Concentración:** Listar las carreras con más ocupaciones asignadas. Un número muy alto señala que el campo es demasiado amplio y la carrera necesita refinamiento.
7. **Reproducibilidad:** La misma entrada produce exactamente la misma salida, y cada cambio manual queda en `decisiones`.

---

## Limitaciones y próximos pasos
La tabla dice a qué ocupaciones puede conducir una carrera, no a cuáles conduce en la práctica ni con qué probabilidad. Eso conviene decirlo en la interfaz que vean los usuarios.

### Limitaciones conocidas:
- Montt y la Tabla 6 se construyeron con datos de países de la OCDE y Europa. Algunas carreras chilenas sin equivalente directo, como Ingeniería Comercial o Ingeniería en Ejecución, requieren decisión manual.
- El índice de la OIT mide exposición de la ocupación, no de la carrera. Un promedio por carrera mezcla ocupaciones muy distintas, así que conviene mostrar la distribución por gradiente y no un número único.
- Sin la validación empírica de la etapa 7, la calidad depende del criterio de las tablas y de la revisión humana.

### Próximos pasos:
- [ ] Descargar la base de oferta académica del SIES y confirmar a cuántos dígitos viene el campo CINE-F.
- [ ] Descargar el anexo de exposición por ocupación del WP 140 de la OIT.
- [ ] Digitalizar la tabla de Montt (2015) y la Tabla 6 del enfoque por tareas.
- [ ] Decidir si se publica la tabla de extensión o se mantiene el filtro estricto 1 a 3.
- [ ] Identificar una fuente para la validación empírica.
- [ ] Implementar las etapas 1 a 9 y correr los controles de calidad.