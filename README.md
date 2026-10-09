# IA-Desempleo

Una visualización para ayudar a personas de 3ro-4to medio a elegir su carrera.

## La visualización
Se utiliza una visualización tipo "Zoomable circle packing": [Link al ejemplo de Observable](https://observablehq.com/@d3/zoomable-circle-packing)

Cada circulo representará una ocupación definida por ISCO-08, y su tamaño, la cantidad de empleos en dicha ocupación.

Los colores de cada círculo se dibujan en una escala de colores según su exposición a la IA definida por el paper ILO (ver `fuentes.md`).

## Interacción
Para interactuar, el usuario puede seleccionar una o varias carreras chilenas (definidas por el CINE-F 2013), buscándolas mediante texto o eligiéndolas de una lista.

Una vez seleccionadas, estas carreras aparecen bajo una categoría de comparación activa, en el lado derecho de la pantalla (como cards en una lista flotante)

Luego el usuario puede elegir filtrar las ocupaciones mostradas, según las ocupaciones relacionadas a las carreras elegidas.

Para esto, se tiene que preparar una base de datos haciendo un crosswalk entre CINE-F 2013 a ISCO-08 (ver `data_pipeline.md`)

Si el usuario hace click en las carreras elegidas para ver más detalles, puede ver los datos respectivos a esa carrera que pueden ser encontrados en MiFuturo.cl.
