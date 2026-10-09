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
    "#2563eb", // Azul eléctrico
    "#dc2626", // Rojo
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

// Límites máximos calculados según el máximo real observado en los datos (OIT WP 140)
// para asegurar que los círculos muestren contraste pleno y no se vean deslavados
let maxAutomatizacion = 0.41;
let maxAumentacion = 0.90;

// Escalas de Color Semánticas Monocromáticas (OIT WP 140) calibradas al máximo real
const scaleAutomatizacion = d3.scaleLinear()
    .domain([0.0, maxAutomatizacion])
    .range(["#e2e8f0", "#dc2626"])
    .interpolate(d3.interpolateRgb);

const scaleAumentacion = d3.scaleLinear()
    .domain([0.0, maxAumentacion])
    .range(["#e2e8f0", "#1d4ed8"])
    .interpolate(d3.interpolateRgb);

function updateColorScaleDomains(treeData) {
    if (!treeData) return;
    const leaves = getAllLeaves(treeData);
    if (leaves.length > 0) {
        const autoMax = d3.max(leaves, d => d.automatizacion_score ?? 0);
        const augMax = d3.max(leaves, d => d.aumentacion_score ?? 0);
        if (autoMax) maxAutomatizacion = autoMax;
        if (augMax) maxAumentacion = augMax;
    }
    scaleAutomatizacion.domain([0.0, maxAutomatizacion]);
    scaleAumentacion.domain([0.0, maxAumentacion]);

    // Actualizar valor numérico máximo en la leyenda flotante
    const legendMax = document.getElementById("legend-max-val");
    if (legendMax) {
        legendMax.textContent = activeMetric === 'automatizacion' 
            ? maxAutomatizacion.toFixed(2) 
            : maxAumentacion.toFixed(2);
    }
}

function getSemanticColor(leafData) {
    const score = activeMetric === 'automatizacion' 
        ? (leafData.automatizacion_score ?? 0)
        : (leafData.aumentacion_score ?? 0);
    return activeMetric === 'automatizacion' 
        ? scaleAutomatizacion(score) 
        : scaleAumentacion(score);
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

    return CATALOGO_CARRERAS.filter(carrera => {
        const titleMatch = normalizeText(carrera.nombre).includes(q);
        const areaMatch = normalizeText(carrera.area || carrera.area_cine || "").includes(q);
        const aliases = carrera.alias || carrera.alias_busqueda || [];
        const aliasMatch = aliases.some(a => normalizeText(a).includes(q));
        return titleMatch || areaMatch || aliasMatch;
    });
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

// Transitividad: cuando en vista filtrada una ocupación es la única en una categoría,
// se colapsan los niveles intermedios para que pertenezca directamente a la categoría grande (Gran Grupo).
function applyTransitivity(node, depth = 0) {
    if (!node.children || node.children.length === 0) return { ...node };

    let processedChildren = node.children.map(child => applyTransitivity(child, depth + 1));

    // Si es Root (depth 0), preservamos los Grandes Grupos (depth 1)
    if (depth === 0) {
        return {
            ...node,
            children: processedChildren
        };
    }

    // Para cualquier categoría bajo Root (Grandes Grupos o subcategorías):
    // Colapsar intermediarios redundantes que solo contengan 1 ocupación
    // o intermediarios que solo contengan 1 subcategoría
    const newChildren = [];
    for (const child of processedChildren) {
        if (child.children && child.children.length > 0) {
            const leaves = getAllLeaves(child);
            if (leaves.length === 1) {
                // Transitividad: la ocupación pertenece directamente a la categoría grande
                newChildren.push(leaves[0]);
                continue;
            }
            if (child.children.length === 1 && child.children[0].children) {
                newChildren.push(child.children[0]);
                continue;
            }
        }
        newChildren.push(child);
    }

    return {
        ...node,
        children: newChildren
    };
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
    const size = Math.min(width, height);

    const visibleIscoCodes = getVisibleIscoCodes();

    // Determinar árbol a renderizar según FILTER_MODE
    let activeHierarchyData = ISCO_HIERARCHY_DATA;
    if (FILTER_MODE === 'repack' && visibleIscoCodes !== null) {
        const pruned = pruneHierarchy(ISCO_HIERARCHY_DATA, visibleIscoCodes);
        activeHierarchyData = pruned ? applyTransitivity(pruned) : { name: "Sin resultados", children: [] };
    }

    updateColorScaleDomains(activeHierarchyData);

    const pack = data => d3.pack()
        .size([size, size])
        .padding(4)
        (d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0)));

    const root = pack(activeHierarchyData);
    currentFocusNode = root;

    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("style", "max-width: 100%; height: 100%; display: block; background: #f8fafc;");

    let focus = root;
    let view;

    const depthColor = d3.scaleLinear()
        .domain([0, 3])
        .range(["#f1f5f9", "#cbd5e1"])
        .interpolate(d3.interpolateHcl);

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
            if (d.children) return "#94a3b8";
            // Si es hoja y tiene exactamente 1 carrera seleccionada, se pinta de su color
            const matches = getMatchingSelectedCareers(d.data);
            if (matches.length === 1) return matches[0].color;
            return "#ffffff";
        })
        .attr("stroke-width", d => {
            if (d.children) return "1px";
            const matches = getMatchingSelectedCareers(d.data);
            return matches.length === 1 ? "4px" : "1.5px";
        });

    // Segmentos de arco multicolor cuando una ocupación tiene >= 2 carreras seleccionadas
    const arcGenerator = d3.arc();

    node.each(function(d) {
        if (d.children) return;
        const matches = getMatchingSelectedCareers(d.data);
        if (matches.length >= 2) {
            const m = matches.length;
            const step = (2 * Math.PI) / m;
            const gArcs = d3.select(this).append("g").attr("class", "multi-career-arcs");

            matches.forEach((carrera, i) => {
                gArcs.append("path")
                    .attr("class", "career-arc-segment")
                    .attr("fill", carrera.color)
                    .attr("data-index", i)
                    .attr("data-total", m);
            });
        }
    });

    // Función para partir textos en múltiples líneas legibles
    function wrapTextToLines(text, maxCharsPerLine = 18, maxLines = 3) {
        if (!text) return [];
        const words = text.trim().split(/\s+/);
        const lines = [];
        let current = "";

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = current ? `${current} ${word}` : word;

            if (testLine.length <= maxCharsPerLine) {
                current = testLine;
            } else {
                if (current) lines.push(current);
                if (lines.length >= maxLines - 1) {
                    const remainder = words.slice(i).join(" ");
                    const truncated = remainder.length > maxCharsPerLine 
                        ? remainder.substring(0, maxCharsPerLine - 2).trim() + "…" 
                        : remainder;
                    lines.push(truncated);
                    current = "";
                    break;
                }
                current = word;
            }
        }
        if (current && lines.length < maxLines) {
            lines.push(current);
        }
        return lines;
    }

    // Etiquetas de texto multilínea con tamaños legibles
    const labelGroup = svg.append("g")
        .style("font-family", "system-ui, sans-serif")
        .style("pointer-events", "none")
        .attr("text-anchor", "middle");

    const label = labelGroup.selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("class", d => d.children ? "label-parent" : "label-leaf")
        .style("font-size", d => d.children ? "14px" : "12px")
        .style("font-weight", d => d.children ? "700" : "600")
        .style("fill", "#0f172a")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .each(function(d) {
            const el = d3.select(this);
            const isParent = !!d.children;
            const maxChars = isParent ? 22 : 18;
            const lines = wrapTextToLines(d.data.name || "", maxChars, 3);
            const n = lines.length;
            if (n === 0) return;

            lines.forEach((lineText, idx) => {
                const dy = idx === 0 
                    ? `${-((n - 1) / 2) * 1.2 + 0.35}em` 
                    : "1.2em";

                el.append("tspan")
                    .attr("x", 0)
                    .attr("dy", dy)
                    .text(lineText);
            });
        });

    // Función de actualización de coordenadas y radios con zoom
    function zoomTo(v) {
        const k = size / v[2];
        view = v;

        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        circle.attr("r", d => Math.max(0, d.r * k));

        // Actualizar arcos de borde multicolor
        node.selectAll(".multi-career-arcs path").each(function(d) {
            const i = parseInt(d3.select(this).attr("data-index"), 10);
            const m = parseInt(d3.select(this).attr("data-total"), 10);
            const r = Math.max(0, d.r * k);
            const step = (2 * Math.PI) / m;
            const arcPath = arcGenerator({
                innerRadius: Math.max(0, r - 3),
                outerRadius: r + 1.5,
                startAngle: i * step,
                endAngle: (i + 1) * step
            });
            d3.select(this).attr("d", arcPath);
        });

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    }

    // Zoom inicial
    zoomTo([root.x, root.y, root.r * 2]);

    // Función de transición de zoom
    function zoom(event, d) {
        const prevFocus = focus;
        focus = d;
        currentFocusNode = d;

        // Cancelar transiciones previas de etiquetas para prevenir desfases visuales
        label.interrupt();

        // Mostrar solo etiquetas del nuevo foco o del foco previo durante el zoom
        label.style("display", dNode => (dNode.parent === focus || dNode.parent === prevFocus) ? "inline" : "none");

        const transition = svg.transition()
            .duration(event && event.altKey ? 5000 : 700)
            .tween("zoom", () => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });

        label
            .transition(transition)
            .style("fill-opacity", dNode => dNode.parent === focus ? 1 : 0)
            .on("end", function(dNode) { 
                if (dNode.parent !== focus) {
                    d3.select(this).style("display", "none");
                }
            });
    }

    // Efectos de hover sobre los nodos
    node.on("mouseover", function(event, d) {
        if (d.children) {
            d3.select(this).select("circle").attr("stroke", "#0f172a").attr("stroke-width", "2px");
        } else {
            const matches = getMatchingSelectedCareers(d.data);
            if (matches.length === 0) {
                d3.select(this).select("circle").attr("stroke", "#0f172a").attr("stroke-width", "2.5px");
            }
        }
    })
    .on("mouseout", function(event, d) {
        if (d.children) {
            d3.select(this).select("circle").attr("stroke", "#94a3b8").attr("stroke-width", "1px");
        } else {
            const matches = getMatchingSelectedCareers(d.data);
            if (matches.length === 0) {
                d3.select(this).select("circle").attr("stroke", "#ffffff").attr("stroke-width", "1.5px");
            } else if (matches.length === 1) {
                d3.select(this).select("circle").attr("stroke", matches[0].color).attr("stroke-width", "4px");
            }
        }
    });

    // Regla de progresión estricta de navegación paso a paso
    node.on("click", function(event, d) {
        event.stopPropagation();

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
                // Es una subcategoría: hacer zoom a ella
                zoom(event, nextStep);
            } else {
                // Es un nodo hoja y YA estamos en su categoría inmediata: abrir modal
                openOccupationModal(nextStep.data, focus.data.name);
            }
            return;
        }

        // 3. Si d está en otra rama, zoom a su ancestro común o al padre de d
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

// Cambio instantáneo de paleta de color (sin transiciones)
function updateColorScale() {
    d3.selectAll(".circle-leaf")
        .attr("fill", d => getSemanticColor(d.data));

    const legendBar = document.getElementById("legend-bar");
    legendBar.className = `legend-bar ${activeMetric}`;
    
    const legendTitle = document.getElementById("legend-title");
    legendTitle.textContent = activeMetric === 'automatizacion' ? "Automatización" : "Aumentación";

    const legendMax = document.getElementById("legend-max-val");
    if (legendMax) {
        legendMax.textContent = activeMetric === 'automatizacion' 
            ? maxAutomatizacion.toFixed(2) 
            : maxAumentacion.toFixed(2);
    }
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

    if (selectedCareers.size === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Ninguna carrera seleccionada.</p>
                <span class="empty-subtext">Busca en el panel izquierdo para añadir.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = Array.from(selectedCareers.values()).map(c => `
        <div class="career-card" data-id="${c.id}">
            <div class="career-card-header">
                <div class="career-title-group">
                    <span class="career-color-dot" style="background-color: ${c.color};"></span>
                    <span class="career-name">${c.nombre}</span>
                </div>
                <button class="btn-remove-career" onclick="removeCareer('${c.id}')" title="Quitar">&times;</button>
            </div>
            <div class="career-card-meta">
                <span>${c.nivel} · ${c.ocupaciones.length} ocupaciones</span>
            </div>
        </div>
    `).join("");
}

// =============================================================================
// 6. VENTANA EMERGENTE CENTRAL (MODAL DE DETALLE DE OCUPACIÓN)
// =============================================================================

function openOccupationModal(leafData, groupName) {
    const modal = document.getElementById("occupation-modal");
    const backdrop = document.getElementById("modal-backdrop");

    document.getElementById("modal-isco-code").textContent = `ISCO-08: ${leafData.isco08}`;
    document.getElementById("modal-title").textContent = leafData.name;
    document.getElementById("modal-parent-group").textContent = groupName || "Gran Grupo";

    const empFormatted = leafData.value ? Number(leafData.value).toLocaleString("es-CL") : "Sin dato";
    document.getElementById("modal-employment").textContent = empFormatted;

    document.getElementById("modal-gradient").textContent = leafData.oit_gradiente || "N/A";

    const autoScore = leafData.automatizacion_score ?? 0;
    const augScore = leafData.aumentacion_score ?? 0;

    document.getElementById("modal-auto-score").textContent = autoScore.toFixed(2);
    document.getElementById("modal-auto-bar").style.width = `${Math.round(autoScore * 100)}%`;

    document.getElementById("modal-aug-score").textContent = augScore.toFixed(2);
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
                <button class="btn-add-career-sm" ${isAlreadySelected ? 'disabled' : ''} onclick="addCareer('${carrera.id}')">
                    ${isAlreadySelected ? 'Seleccionada' : '+ Comparar'}
                </button>
            `;
            careersListEl.appendChild(li);
        });
    }

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
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
        renderChart();
    });

    // Botón limpiar carreras
    document.getElementById("btn-clear-all").addEventListener("click", clearAllCareers);

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
                CATALOGO_CARRERAS = await cRes.json();
                renderChart();
            }
        } catch (e) {
            // Se usa el dataset local de respaldo
        }
    }

    // Render inicial
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