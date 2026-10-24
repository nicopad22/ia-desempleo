/**
 * IA y Mercado Laboral en Chile - Visualizador Interactivo
 * Orientador vocacional para estudiantes de educación media.
 * Desarrollado con D3.js v7 y Vanilla JS.
 */

// =============================================================================
// 1. CONFIGURACIÓN Y ESTADO GLOBAL
// =============================================================================

// Modo de filtro: 'repack' (por defecto) | 'ghost' (cuando "Mostrar todo" está activo)
let FILTER_MODE = 'repack';

// Métrica de color activa: 'automatizacion' | 'aumentacion'
let activeMetric = 'automatizacion';

// Paleta de colores distintivos para las carreras seleccionadas
const CAREER_PALETTE = [
    "#d4eb25", // Azul eléctrico
    "#00ffaa", // Rojo
    "#16a34a", // Verde esmeralda
    "#9333ea", // Púrpura
    "#ea580c", // Naranja
    "#0891b2", // Cian
    "#db2777", // Magenta
    "#d97706", // Ámbar
    "#4f46e5", // Índigo
    "#059669"  // Esmeralda oscuro
];

// Estado de selección de carreras: Map(id -> { ...carrera, color })
const selectedCareers = new Map();

// Etiquetas de los 4 tramos de exposición (de menor a mayor)
const EXPOSURE_LABELS = ["Baja", "Media-baja", "Media-alta", "Alta"];

// Escalas de color discretas (4 tramos): de rosado/celeste suave a rojo/azul oscuro.
// El dominio se fija una sola vez al cargar los datos (ver setColorScaleDomains).
const scaleAutomatizacion = d3.scaleQuantize()
    .domain([0.0, 1.0])
    .range(["#fecaca", "#f87171", "#dc2626", "#7f1d1d"]);

const scaleAumentacion = d3.scaleQuantize()
    .domain([0.0, 1.0])
    .range(["#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"]);

// El máximo se calcula sobre el dataset completo, así los colores no cambian al filtrar
function setColorScaleDomains(treeData) {
    const leaves = getAllLeaves(treeData);
    scaleAutomatizacion.domain([0.0, d3.max(leaves, d => d.automatizacion_score ?? 0)]);
    scaleAumentacion.domain([0.0, d3.max(leaves, d => d.aumentacion_score ?? 0)]);
}

// Etiqueta del tramo de un puntaje (ej: "Media-alta")
function getExposureLabel(score, scale) {
    return EXPOSURE_LABELS[scale.range().indexOf(scale(score))];
}

function getSemanticColor(leafData) {
    const score = activeMetric === 'automatizacion' 
        ? (leafData.automatizacion_score ?? 0)
        : (leafData.aumentacion_score ?? 0);
    return activeMetric === 'automatizacion' 
        ? scaleAutomatizacion(score) 
        : scaleAumentacion(score);
}

// Tramo y puntaje de la métrica activa (ej: "Media-baja · 0.21")
function getMetricText(leafData) {
    const isAuto = activeMetric === 'automatizacion';
    const score = (isAuto ? leafData.automatizacion_score : leafData.aumentacion_score) ?? 0;
    return `${getExposureLabel(score, isAuto ? scaleAutomatizacion : scaleAumentacion)} · ${score.toFixed(2)}`;
}

// Color del texto de una ocupación: oscuro sobre rellenos claros, blanco sobre rellenos oscuros
function getLeafTextColor(leafData, opacity = 1) {
    const color = d3.color(d3.lab(getSemanticColor(leafData)).l > 60 ? "#1c1917" : "#ffffff");
    color.opacity = opacity;
    return color.formatRgb();
}

// Asignar el siguiente color disponible a una carrera
function getNextCareerColor() {
    const usedColors = new Set(Array.from(selectedCareers.values()).map(c => c.color));
    for (const color of CAREER_PALETTE) {
        if (!usedColors.has(color)) return color;
    }
    return CAREER_PALETTE[selectedCareers.size % CAREER_PALETTE.length];
}

// =============================================================================
// 2. CATÁLOGO DE CARRERAS Y DATOS ISCO-08 (CARGADOS DINÁMICAMENTE VÍA FETCH)
// =============================================================================

let CATALOGO_CARRERAS = [];
let ISCO_HIERARCHY_DATA = null;

// Títulos ISCO con traducciones poco naturales en Chile -> nombre que se muestra
const NOMBRES_CHILE = {
    "Profesionales de partería": "Matronas y matrones"
};

function applyChileanNames(node) {
    if (NOMBRES_CHILE[node.name]) node.name = NOMBRES_CHILE[node.name];
    (node.children || []).forEach(applyChileanNames);
}

// =============================================================================
// 3. UTILIDADES DE BÚSQUEDA Y FILTRADO
// =============================================================================

function normalizeText(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function searchCareers(query) {
    const q = normalizeText(query);
    if (!q) return [...CATALOGO_CARRERAS];

    // Relevancia: 0 = el nombre empieza con la búsqueda, 1 = el nombre la contiene,
    // 2 = coincide por área o alias, -1 = no coincide
    function rank(carrera) {
        const title = normalizeText(carrera.nombre);
        if (title.startsWith(q)) return 0;
        if (title.includes(q)) return 1;
        const areaMatch = normalizeText(carrera.area || carrera.area_cine || "").includes(q);
        const aliases = carrera.alias || carrera.alias_busqueda || [];
        const aliasMatch = aliases.some(a => normalizeText(a).includes(q));
        return areaMatch || aliasMatch ? 2 : -1;
    }

    return CATALOGO_CARRERAS
        .map(carrera => ({ carrera, r: rank(carrera) }))
        .filter(item => item.r >= 0)
        .sort((a, b) => a.r - b.r)
        .map(item => item.carrera);
}

// "1 ocupación" / "N ocupaciones"
function formatOcupaciones(n) {
    return n === 1 ? "1 ocupación" : `${n} ocupaciones`;
}

function getVisibleIscoCodes() {
    if (selectedCareers.size === 0) return null;
    const visibleCodes = new Set();
    for (const carrera of selectedCareers.values()) {
        for (const isco of carrera.ocupaciones) {
            visibleCodes.add(isco);
        }
    }
    return visibleCodes;
}

function pruneHierarchy(node, visibleIscoCodes) {
    if (!node.children || node.children.length === 0) {
        return visibleIscoCodes.has(node.isco08) ? { ...node } : null;
    }

    const prunedChildren = [];
    for (const child of node.children) {
        const pruned = pruneHierarchy(child, visibleIscoCodes);
        if (pruned) prunedChildren.push(pruned);
    }

    if (prunedChildren.length === 0) return null;

    return {
        ...node,
        children: prunedChildren
    };
}

function getAllLeaves(node) {
    if (!node.children || node.children.length === 0) return [node];
    return node.children.flatMap(getAllLeaves);
}

// Vista filtrada con muchas ocupaciones: se reemplaza cada grupo que tiene un solo hijo
// por ese hijo, para no dibujar anillos vacíos (la raíz se mantiene)
function collapseSingleChild(node, isRoot = true) {
    if (!node.children || node.children.length === 0) return { ...node };
    const children = node.children.map(child => collapseSingleChild(child, false));
    if (!isRoot && children.length === 1) return children[0];
    return { ...node, children };
}

// Vista filtrada con pocas ocupaciones: todas las ocupaciones al mismo nivel, sin grupos.
// Se guarda el nombre del grupo original para mostrarlo en el detalle.
function flattenLeaves(node, groupName) {
    if (!node.children || node.children.length === 0) return [{ ...node, grupo: groupName }];
    return node.children.flatMap(child => flattenLeaves(child, node.name));
}

// Obtener las carreras seleccionadas asociadas a una ocupación
function getMatchingSelectedCareers(leafData) {
    if (!leafData || !leafData.carreras_relacionadas) return [];
    const matches = [];
    for (const cId of leafData.carreras_relacionadas) {
        if (selectedCareers.has(cId)) {
            matches.push(selectedCareers.get(cId));
        }
    }
    return matches;
}

// =============================================================================
// 4. VISUALIZACIÓN D3 (ZOOMABLE CIRCLE PACKING A PANTALLA COMPLETA)
// =============================================================================

// Con esta cantidad de ocupaciones o menos, la vista filtrada no muestra grupos
const MAX_FLAT_OCCUPATIONS = 15;

let resetZoomFunction = null;
let currentFocusNode = null;

function renderChart() {
    const chartContainer = document.getElementById("chart");
    chartContainer.innerHTML = "";

    if (!ISCO_HIERARCHY_DATA) {
        chartContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.95rem;">Cargando datos...</div>';
        return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    // El gráfico usa casi todo el alto; el encabezado y los paneles flotan encima.
    // En pantallas anchas se deja libre el ancho de los paneles laterales (260px + márgenes).
    const TOP_OFFSET = 60;
    const BOTTOM_MARGIN = 12;
    const size = Math.min(width > 1000 ? width - 2 * 292 : width, height - TOP_OFFSET - BOTTOM_MARGIN);

    const visibleIscoCodes = getVisibleIscoCodes();

    // Determinar árbol a renderizar según FILTER_MODE
    let activeHierarchyData = ISCO_HIERARCHY_DATA;
    if (FILTER_MODE === 'repack' && visibleIscoCodes !== null) {
        const pruned = pruneHierarchy(ISCO_HIERARCHY_DATA, visibleIscoCodes);
        if (!pruned) {
            activeHierarchyData = { name: "Sin resultados", children: [] };
        } else if (getAllLeaves(pruned).length <= MAX_FLAT_OCCUPATIONS) {
            activeHierarchyData = { ...pruned, children: flattenLeaves(pruned, pruned.name) };
        } else {
            activeHierarchyData = collapseSingleChild(pruned);
        }
    }

    // Aviso cuando el filtro deja menos de 3 ocupaciones visibles
    const visibleCount = visibleIscoCodes === null ? null
        : getAllLeaves(ISCO_HIERARCHY_DATA).filter(l => visibleIscoCodes.has(l.isco08)).length;
    const showNotice = FILTER_MODE === 'repack' && visibleCount !== null && visibleCount < 3;
    document.getElementById("chart-notice").classList.toggle("hidden", !showNotice);
    document.getElementById("chart-notice-text").textContent = visibleCount === 0
        ? "Ninguna ocupación del gráfico está relacionada con tus carreras."
        : `Solo hay ${formatOcupaciones(visibleCount)} relacionada${visibleCount === 1 ? "" : "s"} con tus carreras.`;

    const pack = data => d3.pack()
        .size([size, size])
        .padding(4)
        (d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0)));

    const root = pack(activeHierarchyData);
    currentFocusNode = root;

    // Relleno de los grupos según la profundidad (como en el ejemplo de Observable),
    // en grises cálidos para no confundirse con los colores de exposición
    const depthColor = d3.scaleLinear()
        .domain([0, 4])
        .range(["#f5f4f0", "#c9c3b8"])
        .interpolate(d3.interpolateHcl);

    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2 + (TOP_OFFSET - BOTTOM_MARGIN) / 2} ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("style", `max-width: 100%; height: 100%; display: block; background: ${depthColor(0)};`);

    let focus = root;
    let view;

    // Contenedor de nodos
    const nodeGroup = svg.append("g");

    // Grupos individuales para cada nodo
    const node = nodeGroup.selectAll("g.node-item")
        .data(root.descendants().slice(1))
        .join("g")
        .attr("class", d => d.children ? "node-item node--parent" : "node-item node--leaf");

    // Círculo principal de cada nodo
    const circle = node.append("circle")
        .attr("class", d => d.children ? "circle-parent" : "circle-leaf node-fill")
        .attr("fill", d => d.children ? depthColor(d.depth) : getSemanticColor(d.data))
        .attr("stroke", d => {
            if (d.children) return null;
            // Si es hoja y tiene exactamente 1 carrera seleccionada, se pinta de su color
            const matches = getMatchingSelectedCareers(d.data);
            if (matches.length === 1) return matches[0].color;
            return null;
        })
        .attr("stroke-width", d => {
            if (d.children) return null;
            const matches = getMatchingSelectedCareers(d.data);
            return matches.length === 1 ? "4px" : null;
        });

    // Anillos concéntricos finos (uno por carrera) cuando una ocupación tiene >= 2 carreras seleccionadas
    node.each(function(d) {
        if (d.children) return;
        const matches = getMatchingSelectedCareers(d.data);
        if (matches.length >= 2) {
            const gRings = d3.select(this).append("g").attr("class", "career-rings");
            matches.forEach((carrera, i) => {
                gRings.append("circle")
                    .attr("fill", "none")
                    .attr("stroke", carrera.color)
                    .attr("stroke-width", 2.5)
                    .attr("data-index", i);
            });
        }
    });

    // Función para partir textos en múltiples líneas completas (sin cortar con "...")
    function wrapTextToLines(text) {
        if (!text) return [];
        const words = text.trim().split(/\s+/);
        const maxCharsPerLine = Math.max(14, Math.min(26, Math.ceil(Math.sqrt(text.length * 4))));
        const lines = [];
        let current = "";

        for (const word of words) {
            const testLine = current ? `${current} ${word}` : word;
            if (testLine.length <= maxCharsPerLine || !current) {
                current = testLine;
            } else {
                lines.push(current);
                current = word;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    // Límite de radio en pantalla para evitar que una única ocupación ocupe toda la ventana
    const MAX_LEAF_SCREEN_RADIUS = Math.min(size * 0.22, 135);
    // Radio mínimo en pantalla a partir del cual una ocupación muestra su título y abre detalle directo
    const DIRECT_LEAF_MIN_RADIUS = 34;

    function getTargetView(targetNode) {
        const leaves = targetNode.leaves();
        const maxLeafR = d3.max(leaves, l => l.r) || 0;
        const minDiameter = maxLeafR > 0 ? (maxLeafR * size) / MAX_LEAF_SCREEN_RADIUS : 0;
        const diameter = Math.max(targetNode.r * 2, minDiameter);
        return [targetNode.x, targetNode.y, diameter];
    }

    // Como en el ejemplo de Observable: solo se ven los nombres de los hijos del nodo con foco
    // (en "Mostrar todo", las ocupaciones atenuadas no muestran nombre)
    function isLabelVisible(d, focusNode) {
        if (FILTER_MODE === 'ghost' && visibleIscoCodes !== null && !d.children && !visibleIscoCodes.has(d.data.isco08)) {
            return false;
        }
        return d.parent === focusNode;
    }

    // Nombre de ocupación en dos líneas como máximo: se parte en el espacio que deja las
    // líneas más parejas; si una línea supera 26 caracteres, se corta con "…"
    function wrapLeafName(name) {
        const words = name.trim().split(/\s+/);
        if (name.length <= 16 || words.length === 1) return [name];
        let best = null;
        for (let i = 1; i < words.length; i++) {
            const lines = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
            if (!best || Math.max(...lines.map(l => l.length)) < Math.max(...best.map(l => l.length))) best = lines;
        }
        return best.map(l => l.length > 26 ? l.slice(0, 25).trimEnd() + "…" : l);
    }

    function getDynamicFontSize(d, k) {
        const r = d.r * k;
        const lines = d._lines || [];
        const n = Math.max(1, lines.length);
        const maxLen = d._maxLineLen || 10;
        const fitWidth = (r * 1.7) / (maxLen * 0.56);
        const fitHeight = (r * 1.55) / (n * 1.18);
        const rawSize = Math.min(fitWidth, fitHeight);
        const maxFont = d.children ? 12 : 14;
        return Math.max(9, Math.min(maxFont, rawSize));
    }

    // Etiquetas de texto multilínea con tamaños dinámicos
    const labelGroup = svg.append("g")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("font-weight", "500")
        .style("pointer-events", "none")
        .attr("text-anchor", "middle");

    // Cada etiqueta es un grupo <g>; los nombres de grupo llevan además una píldora blanca de fondo
    const label = labelGroup.selectAll("g")
        .data(root.descendants().slice(1))
        .join("g")
        .attr("class", d => d.children ? "label-parent" : "label-leaf")
        .each(function(d) {
            if (d.children) d3.select(this).append("rect").attr("class", "label-pill");
            const el = d3.select(this).append("text")
                .style("fill", d.children ? "#1c1917" : getLeafTextColor(d.data));
            const lines = d.children
                ? wrapTextToLines(d.data.name || "")
                : wrapLeafName(d.data.name || "");
            // En la vista filtrada, las ocupaciones muestran además su tramo y puntaje
            const showMetric = !d.children && visibleIscoCodes !== null;
            d._lines = showMetric ? [...lines, getMetricText(d.data)] : lines;
            d._maxLineLen = Math.max(1, ...d._lines.map(l => l.length));
            const n = d._lines.length;
            if (n === 0) return;

            lines.forEach((lineText, idx) => {
                const dy = idx === 0 
                    ? `${-((n - 1) / 2) * 1.18 + 0.35}em` 
                    : "1.18em";

                el.append("tspan")
                    .attr("x", 0)
                    .attr("dy", dy)
                    .text(lineText);
            });

            if (showMetric) {
                el.append("tspan")
                    .attr("class", "metric-line")
                    .style("fill", getLeafTextColor(d.data, 0.75))
                    .attr("x", 0)
                    .attr("dy", "1.3em")
                    .text(getMetricText(d.data));
            }
        });

    // Función de actualización de coordenadas, radios y tamaño de texto dinámico
    function zoomTo(v) {
        const k = size / v[2];
        view = v;

        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        circle.attr("r", d => Math.max(0, d.r * k));

        // Anillos de carreras: cada uno 3px más adentro que el anterior
        node.selectAll(".career-rings circle")
            .attr("r", function(d) { return Math.max(0, d.r * k - 1 - this.getAttribute("data-index") * 3); });

        label
            .attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
            .style("font-size", d => `${getDynamicFontSize(d, k).toFixed(1)}px`);

        // Tamaño aproximado de la píldora según el largo y la cantidad de líneas del texto
        label.select(".label-pill").each(function(d) {
            const fontSize = getDynamicFontSize(d, k);
            const w = d._maxLineLen * fontSize * 0.6 + 14;
            const h = d._lines.length * fontSize * 1.18 + 6;
            d3.select(this)
                .attr("x", -w / 2).attr("y", -h / 2)
                .attr("width", w).attr("height", h)
                .attr("rx", Math.min(h / 2, 10));
        });
    }

    // Nombre del nivel raíz en el breadcrumb
    const rootLabel = FILTER_MODE === 'repack' && visibleIscoCodes !== null
        ? "Ocupaciones relacionadas"
        : "Todas las ocupaciones";
    renderBreadcrumb(root, rootLabel, n => zoom(null, n));

    // Zoom inicial y visibilidad inicial de etiquetas
    const initialView = getTargetView(root);
    zoomTo(initialView);
    label
        .style("fill-opacity", d => isLabelVisible(d, root) ? 1 : 0)
        .style("display", d => isLabelVisible(d, root) ? "inline" : "none");

    // Función de transición de zoom
    function zoom(event, d) {
        const prevFocus = focus;
        focus = d;
        currentFocusNode = d;
        renderBreadcrumb(focus, rootLabel, n => zoom(null, n));

        const targetView = getTargetView(focus);

        // Cancelar transiciones previas de etiquetas para prevenir desfases visuales
        label.interrupt();

        // Mostrar etiquetas visibles en el foco previo o en el nuevo foco durante la transición
        label.style("display", dNode => (isLabelVisible(dNode, focus) || isLabelVisible(dNode, prevFocus)) ? "inline" : "none");

        const transition = svg.transition()
            .duration(event && event.altKey ? 5000 : 700)
            .tween("zoom", () => {
                const i = d3.interpolateZoom(view, targetView);
                return t => zoomTo(i(t));
            });

        label
            .transition(transition)
            .style("fill-opacity", dNode => isLabelVisible(dNode, focus) ? 1 : 0)
            .on("end", function(dNode) { 
                if (!isLabelVisible(dNode, focus)) {
                    d3.select(this).style("display", "none");
                }
            });
    }

    // Efectos de hover sobre los nodos
    node.on("mouseover", function(event, d) {
        if (d.children) {
            d3.select(this).select("circle").attr("stroke", "#1c1917").attr("stroke-width", "1px");
        } else {
            const matches = getMatchingSelectedCareers(d.data);
            if (matches.length === 0) {
                d3.select(this).select("circle").attr("stroke", "#1c1917").attr("stroke-width", "1px");
            }
        }
    })
    .on("mouseout", function(event, d) {
        if (d.children) {
            d3.select(this).select("circle").attr("stroke", null);
        } else {
            const matches = getMatchingSelectedCareers(d.data);
            if (matches.length === 0) {
                d3.select(this).select("circle").attr("stroke", null);
            } else if (matches.length === 1) {
                d3.select(this).select("circle").attr("stroke", matches[0].color).attr("stroke-width", "4px");
            }
        }
    });

    // Navegación: acceso directo al detalle si la ocupación es suficientemente grande, o progresión por nivel
    node.on("click", function(event, d) {
        event.stopPropagation();
        const currentK = size / view[2];

        // 0. Si es una ocupación (hoja) suficientemente grande o hija directa del foco, abrir su detalle directo
        if (!d.children && (d.parent === focus || d.r * currentK >= DIRECT_LEAF_MIN_RADIUS)) {
            const parentName = d.parent ? d.parent.data.name : "Gran Grupo";
            openOccupationModal(d.data, parentName);
            return;
        }

        // 1. Si se hace clic en la categoría que YA está en foco -> retroceder al nivel anterior
        if (d === focus) {
            if (focus.parent) {
                zoom(event, focus.parent);
            }
            return;
        }

        // 2. Si d es descendiente de focus, avanzar solo un nivel hacia d
        let nextStep = d;
        while (nextStep.parent && nextStep.parent !== focus) {
            nextStep = nextStep.parent;
        }

        if (nextStep.parent === focus) {
            if (nextStep.children) {
                zoom(event, nextStep);
            } else {
                openOccupationModal(nextStep.data, focus.data.name);
            }
            return;
        }

        // 3. Si d está en otra rama, zoom al padre de d
        if (d.parent) {
            zoom(event, d.parent);
        }
    });

    // Clic en el fondo aleja un nivel
    svg.on("click", (event) => {
        if (focus && focus.parent) {
            zoom(event, focus.parent);
        }
    });

    // Reset zoom directo a root
    resetZoomFunction = () => zoom(null, root);

    // Estado ghosting cuando "Mostrar todo" está activo
    if (FILTER_MODE === 'ghost' && visibleIscoCodes !== null) {
        node.each(function(d) {
            if (!d.children) {
                const isMatch = visibleIscoCodes.has(d.data.isco08);
                d3.select(this).classed("node--dimmed", !isMatch);
            }
        });
    }

    const chartElement = svg.node();
    chartContainer.appendChild(chartElement);
}

// Breadcrumb con la ruta desde la raíz hasta el foco actual; onSelect hace zoom al nivel clickeado
function renderBreadcrumb(focusNode, rootLabel, onSelect) {
    const nav = document.getElementById("breadcrumb");
    nav.innerHTML = "";
    focusNode.ancestors().reverse().forEach((n, i) => {
        if (i > 0) nav.append(" › ");
        const btn = document.createElement("button");
        btn.textContent = i === 0 ? rootLabel : n.data.name;
        btn.disabled = n === focusNode;
        btn.addEventListener("click", () => onSelect(n));
        nav.append(btn);
    });
}

// Cambio instantáneo de paleta de color (sin transiciones)
function updateColorScale() {
    d3.selectAll(".circle-leaf")
        .attr("fill", d => getSemanticColor(d.data));
    d3.selectAll(".label-leaf text")
        .style("fill", d => getLeafTextColor(d.data));
    d3.selectAll(".metric-line")
        .text(d => getMetricText(d.data))
        .style("fill", d => getLeafTextColor(d.data, 0.75));

    renderLegend();
}

// Leyenda: un bloque de color por tramo, con su etiqueta
function renderLegend() {
    const isAuto = activeMetric === 'automatizacion';
    const scale = isAuto ? scaleAutomatizacion : scaleAumentacion;
    document.getElementById("legend-title").textContent = isAuto
        ? "¿Cuánto podría la IA reemplazar tareas de este trabajo?"
        : "¿Cuánto podría la IA ayudar en este trabajo?";
    document.getElementById("legend-steps").innerHTML = scale.range().map((color, i) => `
        <div class="legend-step">
            <span class="legend-swatch" style="background-color: ${color};"></span>
            <span>${EXPOSURE_LABELS[i]}</span>
        </div>
    `).join("");
}

// =============================================================================
// 5. GESTIÓN DEL PANEL DE CARRERAS Y BÚSQUEDA
// =============================================================================

function setupCareerSearch() {
    const searchInput = document.getElementById("career-search-input");
    const resultsContainer = document.getElementById("search-results");

    function renderCareerDropdown() {
        const query = searchInput.value.trim();
        const matches = searchCareers(query);

        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div class="search-result-item"><span class="item-meta">No se encontraron carreras</span></div>`;
            resultsContainer.classList.remove("hidden");
            return;
        }

        resultsContainer.innerHTML = matches.map(c => {
            const isSelected = selectedCareers.has(c.id);
            return `
                <div class="search-result-item ${isSelected ? 'already-selected' : ''}" data-id="${c.id}">
                    <span class="item-title">${c.nombre} ${isSelected ? '✓' : ''}</span>
                    <span class="item-meta">${c.nivel} · ${c.area || c.area_cine || ""}</span>
                </div>
            `;
        }).join("");
        resultsContainer.classList.remove("hidden");
    }

    searchInput.addEventListener("focus", renderCareerDropdown);
    searchInput.addEventListener("click", renderCareerDropdown);
    searchInput.addEventListener("input", renderCareerDropdown);

    resultsContainer.addEventListener("click", (e) => {
        const item = e.target.closest(".search-result-item");
        if (item && item.dataset.id) {
            addCareer(item.dataset.id);
            searchInput.value = "";
            resultsContainer.classList.add("hidden");
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box")) {
            resultsContainer.classList.add("hidden");
        }
    });
}

function addCareer(careerId) {
    const career = CATALOGO_CARRERAS.find(c => c.id === careerId);
    if (!career || selectedCareers.has(careerId)) return;

    const assignedColor = getNextCareerColor();
    selectedCareers.set(careerId, { ...career, color: assignedColor });

    renderSelectedCareers();
    renderChart();
}

function removeCareer(careerId) {
    if (selectedCareers.delete(careerId)) {
        renderSelectedCareers();
        renderChart();
    }
}

function clearAllCareers() {
    selectedCareers.clear();
    renderSelectedCareers();
    renderChart();
}

function renderSelectedCareers() {
    const container = document.getElementById("selected-careers-list");
    const countEl = document.getElementById("selected-count");
    const clearBtn = document.getElementById("btn-clear-all");

    countEl.textContent = selectedCareers.size;
    clearBtn.style.display = selectedCareers.size > 0 ? "inline-block" : "none";

    updateCareerSteps();
    // Aviso tras agregar la primera carrera (solo cuando el gráfico se filtra)
    document.getElementById("career-added-hint").classList.toggle("hidden", selectedCareers.size !== 1 || FILTER_MODE !== 'repack');

    if (selectedCareers.size === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Ninguna carrera seleccionada.</p>
                <span class="empty-subtext">Busca en el panel izquierdo para añadir.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <p class="career-border-hint">El color de cada carrera es el borde de sus ocupaciones en el gráfico. Si una ocupación es de varias carreras, tiene un anillo por cada una.</p>
    ` + Array.from(selectedCareers.values()).map(c => `
        <div class="career-card" data-id="${c.id}">
            <div class="career-card-header">
                <div class="career-title-group">
                    <span class="career-color-dot" style="border-color: ${c.color};" title="Borde en el gráfico"></span>
                    <span class="career-name">${c.nombre}</span>
                </div>
                <button class="btn-remove-career" onclick="removeCareer('${c.id}')" title="Quitar">&times;</button>
            </div>
            <div class="career-card-meta">
                <span>${c.nivel} · ${formatOcupaciones(c.ocupaciones.length)}</span>
                <a href="https://www.mifuturo.cl/buscador-de-estadisticas-por-carrera/" target="_blank" rel="noopener noreferrer" class="career-mifuturo-link">
                    MiFuturo.cl &nearr;
                </a>
            </div>
        </div>
    `).join("");
}

// Guía de pasos: el paso 1 se completa al elegir una carrera; los pasos 2 y 3, al abrir
// el detalle de una ocupación. Se resaltan los pasos que faltan por hacer.
let hasOpenedDetail = false;

function updateCareerSteps() {
    const hasCareers = selectedCareers.size > 0;
    if (!hasCareers) hasOpenedDetail = false;
    const done = { 1: hasCareers, 2: hasOpenedDetail, 3: hasOpenedDetail };
    document.querySelectorAll("#career-steps li").forEach(li => {
        const step = li.dataset.step;
        li.classList.toggle("done", done[step]);
        li.classList.toggle("active", !done[step] && (step === "1") === !hasCareers);
    });
}

function toggleCareerFromModal(careerId, btnEl) {
    if (selectedCareers.has(careerId)) {
        removeCareer(careerId);
        btnEl.textContent = "+ Comparar";
        btnEl.classList.remove("is-selected");
    } else {
        addCareer(careerId);
        btnEl.textContent = "Seleccionada";
        btnEl.classList.add("is-selected");
    }
}

// =============================================================================
// 6. VENTANA EMERGENTE CENTRAL (MODAL DE DETALLE DE OCUPACIÓN)
// =============================================================================

function openOccupationModal(leafData, groupName) {
    const modal = document.getElementById("occupation-modal");
    const backdrop = document.getElementById("modal-backdrop");

    document.getElementById("modal-isco-code").textContent = `ISCO-08: ${leafData.isco08}`;
    document.getElementById("modal-title").textContent = leafData.name;
    document.getElementById("modal-parent-group").textContent = leafData.grupo || groupName || "Gran Grupo";

    const empFormatted = leafData.value ? Number(leafData.value).toLocaleString("es-CL") : "Sin dato";
    document.getElementById("modal-employment").textContent = empFormatted;

    document.getElementById("modal-gradient").textContent = leafData.oit_gradiente || "N/A";

    const autoScore = leafData.automatizacion_score ?? 0;
    const augScore = leafData.aumentacion_score ?? 0;

    document.getElementById("modal-auto-score").textContent = `${autoScore.toFixed(2)} · ${getExposureLabel(autoScore, scaleAutomatizacion)}`;
    document.getElementById("modal-auto-bar").style.width = `${Math.round(autoScore * 100)}%`;

    document.getElementById("modal-aug-score").textContent = `${augScore.toFixed(2)} · ${getExposureLabel(augScore, scaleAumentacion)}`;
    document.getElementById("modal-aug-bar").style.width = `${Math.round(augScore * 100)}%`;

    const careersListEl = document.getElementById("modal-careers-list");
    careersListEl.innerHTML = "";

    const relatedIds = leafData.carreras_relacionadas || [];
    if (relatedIds.length === 0) {
        careersListEl.innerHTML = `<li class="related-career-item"><span class="item-meta">Sin carreras mapeadas en este prototipo.</span></li>`;
    } else {
        relatedIds.forEach(cId => {
            const carrera = CATALOGO_CARRERAS.find(c => c.id === cId);
            if (!carrera) return;

            const isAlreadySelected = selectedCareers.has(cId);
            const li = document.createElement("li");
            li.className = "related-career-item";
            li.innerHTML = `
                <div>
                    <strong>${carrera.nombre}</strong><br>
                    <span class="item-meta">${carrera.nivel}</span>
                </div>
                <button class="btn-add-career-sm ${isAlreadySelected ? 'is-selected' : ''}" onclick="toggleCareerFromModal('${carrera.id}', this)">
                    ${isAlreadySelected ? 'Seleccionada' : '+ Comparar'}
                </button>
            `;
            careersListEl.appendChild(li);
        });
    }

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");

    if (selectedCareers.size > 0) {
        hasOpenedDetail = true;
        updateCareerSteps();
    }
}

function closeOccupationModal() {
    document.getElementById("occupation-modal").classList.add("hidden");
    document.getElementById("modal-backdrop").classList.add("hidden");
}

// =============================================================================
// 7. INICIALIZACIÓN Y EVENT LISTENERS
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Cambio instantáneo de métrica de color
    const btnAuto = document.getElementById("btn-automatizacion");
    const btnAug = document.getElementById("btn-aumentacion");

    btnAuto.addEventListener("click", () => {
        if (activeMetric !== 'automatizacion') {
            activeMetric = 'automatizacion';
            btnAuto.classList.add("active");
            btnAug.classList.remove("active");
            updateColorScale();
        }
    });

    btnAug.addEventListener("click", () => {
        if (activeMetric !== 'aumentacion') {
            activeMetric = 'aumentacion';
            btnAug.classList.add("active");
            btnAuto.classList.remove("active");
            updateColorScale();
        }
    });

    // Botón flotante de reinicio de zoom
    document.getElementById("btn-reset-zoom").addEventListener("click", () => {
        if (resetZoomFunction) resetZoomFunction();
    });

    // Switch "Mostrar todo":
    // Si está marcado (true) -> FILTER_MODE = 'ghost' (se muestra todo, atenuando lo no seleccionado)
    // Si está desmarcado (false) -> FILTER_MODE = 'repack' (se re-empaqueta solo lo relacionado)
    const toggleShowAll = document.getElementById("toggle-show-all");
    toggleShowAll.addEventListener("change", (e) => {
        FILTER_MODE = e.target.checked ? 'ghost' : 'repack';
        renderSelectedCareers();
        renderChart();
    });

    // Botón limpiar carreras
    document.getElementById("btn-clear-all").addEventListener("click", clearAllCareers);

    // Botón global "Limpiar todo": quita carreras, desactiva "Mostrar todo", cierra el modal
    // y vuelve a la raíz (renderChart siempre dibuja desde la raíz)
    document.getElementById("btn-clear-everything").addEventListener("click", () => {
        selectedCareers.clear();
        toggleShowAll.checked = false;
        FILTER_MODE = 'repack';
        closeOccupationModal();
        renderSelectedCareers();
        renderChart();
    });

    // Aviso de vista con pocas ocupaciones: "Ver todas las ocupaciones" activa "Mostrar todo"
    document.getElementById("btn-show-all-occupations").addEventListener("click", () => {
        toggleShowAll.checked = true;
        toggleShowAll.dispatchEvent(new Event("change"));
    });

    // Cerrar modal central
    document.getElementById("btn-close-modal").addEventListener("click", closeOccupationModal);
    document.getElementById("modal-backdrop").addEventListener("click", closeOccupationModal);

    // Buscador
    setupCareerSearch();

    // Cargar datos oficiales generados por el pipeline (o usar respaldo local)
    async function loadOfficialData() {
        try {
            const [hRes, cRes] = await Promise.all([
                fetch("data/public/d3_hierarchy.json"),
                fetch("data/public/catalogo_carreras.json")
            ]);
            if (hRes.ok && cRes.ok) {
                ISCO_HIERARCHY_DATA = await hRes.json();
                applyChileanNames(ISCO_HIERARCHY_DATA);
                CATALOGO_CARRERAS = await cRes.json();
                setColorScaleDomains(ISCO_HIERARCHY_DATA);
                renderChart();
            }
        } catch (e) {
            // Se usa el dataset local de respaldo
        }
    }

    // Render inicial
    renderLegend();
    renderChart();
    loadOfficialData();

    // Redimensionamiento
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderChart();
        }, 150);
    });
});