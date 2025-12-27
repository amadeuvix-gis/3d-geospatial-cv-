/* main.js — 3D Geospatial CV (ArcGIS Maps SDK for JavaScript 4.29)
   Refactor target: keep 100% of the original behavior/visuals from the single-file version,
   while loading GeoJSON externally for GitHub Pages.

   Expected DOM IDs in index.html:
   - viewDiv, list, countryFilter, phaseFilter, tourBtn, resetBtn, splash (optional)
   - (optional) buttons / links in header are in HTML

   Expected files:
   - data/career.geojson  (pure GeoJSON FeatureCollection — NO "const data =" wrapper)
*/

(() => {
  // ----------------------------
  // Globals expected by HTML
  // ----------------------------
  window.closeSplash = function closeSplash() {
    const splash = document.getElementById("splash");
    if (!splash) return;
    splash.style.opacity = "0";
    setTimeout(() => (splash.style.display = "none"), 800);
    // Auto-start rotation after splash closes (if map already ready)
    if (window.__cvStartRot) window.__cvStartRot();
  };

  // ----------------------------
  // App state
  // ----------------------------
  let view;
  let layer;
  let features = [];
  let visibleFeatures = [];
  let index = -1;

  let tourInterval = null;
  let isFlying = false;

  // rotation loop
  let rotRAF = null;
  let rotEnabled = false;

  // highlight handle
  let highlightHandle = null;

  // ----------------------------
  // Helpers
  // ----------------------------
  const $ = (id) => document.getElementById(id);

  function safeText(v) {
    return (v ?? "").toString();
  }

  function buildChips(stack) {
    const s = safeText(stack).trim();
    if (!s) return "";
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `<span class="chip">${escapeHtml(x)}</span>`)
      .join("");
  }

  function escapeHtml(str) {
    return safeText(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setActiveCard(i) {
    const cards = document.querySelectorAll("#list .card");
    cards.forEach((c, idx) => c.classList.toggle("active", idx === i));
  }

  function stopRotation() {
    rotEnabled = false;
    if (rotRAF) cancelAnimationFrame(rotRAF);
    rotRAF = null;
  }

  function startRotation() {
    if (!view) return;
    rotEnabled = true;
    const step = () => {
      if (!rotEnabled) return;
      // Only rotate when not touring/flying and no popup is actively focused
      if (!isFlying && !tourInterval && index === -1) {
        const cam = view.camera.clone();
        // gentle globe rotation
        cam.position.longitude -= 0.06;
        view.camera = cam;
      }
      rotRAF = requestAnimationFrame(step);
    };
    if (!rotRAF) rotRAF = requestAnimationFrame(step);
  }

  // expose for splash to restart rotation
  window.__cvStartRot = startRotation;

  function computeApproachCamera(point, zMeters = 1600) {
    // We offset latitude depending on hemisphere, so the target point lands above the bottom-right docked popup.
    // In the southern hemisphere, we add latitude; in the northern, we subtract.
    const lat = point.latitude;
    const lon = point.longitude;

    const latOffset = (lat >= 0 ? -1 : 1) * 0.0065; // ~700m
    return {
      position: {
        longitude: lon,
        latitude: lat + latOffset,
        z: zMeters
      },
      tilt: 68,
      heading: 0
    };
  }

  async function highlightGraphic(g) {
    if (!view || !g) return;
    try {
      const lv = await view.whenLayerView(layer);
      if (highlightHandle) {
        highlightHandle.remove();
        highlightHandle = null;
      }
      highlightHandle = lv.highlight(g);
    } catch {
      // ignore
    }
  }

  function clearHighlight() {
    if (highlightHandle) {
      highlightHandle.remove();
      highlightHandle = null;
    }
  }

  function updateTourButton() {
    const btn = $("tourBtn");
    if (!btn) return;
    if (tourInterval) {
      btn.textContent = "■ Stop Tour";
      btn.classList.add("active-tour");
    } else {
      btn.textContent = "▶ Play Auto Tour";
      btn.classList.remove("active-tour");
    }
  }

  function rebuildList() {
    const listEl = $("list");
    if (!listEl) return;

    listEl.innerHTML = "";
    visibleFeatures.forEach((f, i) => {
      const a = f.attributes || {};
      const div = document.createElement("div");
      const phase = safeText(a.career_phase);
      div.className =
        "card" +
        (i === index ? " active" : "") +
        (phase === "Academic" ? " card-academic" : "");
      div.innerHTML = `<b>${escapeHtml(safeText(a.company))}</b>
        <div class="card-sub"><span>${escapeHtml(safeText(a.city))}</span></div>`;
      div.onclick = () => {
        if (tourInterval) toggleTour();
        fly(i);
      };
      listEl.appendChild(div);
    });
  }

  function populateCountryFilter() {
    const cf = $("countryFilter");
    if (!cf) return;
    // keep first option
    const first = cf.querySelector("option[value='ALL'], option[value='All'], option[value='ALL REGIONS']");
    const keepFirst = first ? first.outerHTML : `<option value="ALL">All Regions</option>`;
    cf.innerHTML = keepFirst;

    const countries = [...new Set(features.map((f) => safeText(f.attributes?.country)).filter(Boolean))].sort();
    countries.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      cf.appendChild(opt);
    });
  }

  function applyFilters() {
    const country = ($("countryFilter")?.value || "ALL").toUpperCase() === "ALL" ? "ALL" : $("countryFilter").value;
    const phase = ($("phaseFilter")?.value || "ALL").toUpperCase() === "ALL" ? "ALL" : $("phaseFilter").value;

    visibleFeatures = features.filter((f) => {
      const a = f.attributes || {};
      const matchCountry = country === "ALL" || a.country === country;
      const matchPhase = phase === "ALL" || a.career_phase === phase;
      return matchCountry && matchPhase;
    });

    // Definition expression keeps map + list consistent and performs better for large datasets
    const sql = [];
    if (country !== "ALL") sql.push(`country = '${country.replaceAll("'", "''")}'`);
    if (phase !== "ALL") sql.push(`career_phase = '${phase.replaceAll("'", "''")}'`);
    layer.definitionExpression = sql.length ? sql.join(" AND ") : null;

    // reset selection
    index = -1;
    clearHighlight();
    if (view?.popup) view.popup.close();

    rebuildList();
    startRotation();
  }

  async function fly(i) {
    if (!view) return;
    if (isFlying) return;
    if (!visibleFeatures[i]) return;

    isFlying = true;
    stopRotation();

    index = i;
    const target = visibleFeatures[i];

    // Keep point visible above the docked popup and avoid "point hidden at bottom"
    const cam = computeApproachCamera(target.geometry, 1700);

    try {
      await view.goTo(cam, { duration: 3200, easing: "in-out-cubic" });
    } catch {
      // ignore aborted goTo
    }

    // Open popup and keep it docked (same UI you had before)
    try {
      view.openPopup({
        features: [target],
        updateLocationEnabled: true
      });
    } catch {
      // ignore
    }

    await highlightGraphic(target);
    rebuildList();
    setActiveCard(i);

    isFlying = false;
  }

  function toggleTour() {
    if (tourInterval) {
      clearInterval(tourInterval);
      tourInterval = null;
      updateTourButton();
      startRotation();
      return;
    }

    if (!visibleFeatures.length) return;

    // start
    updateTourButton();
    let tourIdx = index === -1 ? 0 : index;

    const step = () => {
      if (!tourInterval) return;
      fly(tourIdx);
      tourIdx = (tourIdx + 1) % visibleFeatures.length;
    };

    step();
    tourInterval = setInterval(step, 8000);
    updateTourButton();
  }

  async function resetView() {
    if (!view) return;

    if (tourInterval) toggleTour();
    index = -1;
    clearHighlight();
    if (view.popup) view.popup.close();

    stopRotation();

    try {
      await view.goTo(
        {
          position: { longitude: -10, latitude: 20, z: 18000000 },
          tilt: 0,
          heading: 0
        },
        { duration: 2500, easing: "in-out-cubic" }
      );
    } catch {
      // ignore
    }

    rebuildList();
    startRotation();
  }

  // ----------------------------
  // Boot
  // ----------------------------
  async function boot() {
    // Load ArcGIS AMD
    require(
      [
        "esri/Map",
        "esri/views/SceneView",
        "esri/layers/GeoJSONLayer",
        "esri/widgets/BasemapGallery",
        "esri/widgets/Daylight",
        "esri/widgets/DirectLineMeasurement3D",
        "esri/widgets/Expand"
      ],
      async (Map, SceneView, GeoJSONLayer, BasemapGallery, Daylight, DirectLineMeasurement3D, Expand) => {
        // IMPORTANT: external GeoJSON must be valid JSON, not JS.
        // Place your file at: /data/career.geojson
        const geojsonUrl = "data/career.geojson";

        layer = new GeoJSONLayer({
          url: geojsonUrl,
          outFields: ["*"],
          elevationInfo: { mode: "relative-to-ground" },

          // Labels (company)
          labelingInfo: [
            {
              labelPlacement: "above-center",
              labelExpressionInfo: { expression: "$feature.company" },
              symbol: {
                type: "label-3d",
                symbolLayers: [
                  {
                    type: "text",
                    material: { color: "white" },
                    halo: { color: "black", size: 1 },
                    size: 10,
                    font: { weight: "bold" }
                  }
                ]
              }
            }
          ],

          // Renderer by career_phase (keeps the same visual language)
          renderer: {
            type: "unique-value",
            field: "career_phase",
            uniqueValueInfos: [
              { value: "Leadership", symbol: createSymbol("#f97316") },
              { value: "Consultant", symbol: createSymbol("#22c55e") },
              { value: "Technical", symbol: createSymbol("#0ea5e9") },
              { value: "Academic", symbol: createSymbol("#a855f7") }
            ]
          },

          popupTemplate: {
            title: "{city}, {country}",
            content: (e) => {
              const a = e.graphic?.attributes || {};
              const chips = buildChips(a.stack);
              const desc = escapeHtml(safeText(a.description));
              return `
                <div class="popup-timeline">
                  <div class="role-item">
                    <div class="role-company">${escapeHtml(safeText(a.company))}</div>
                    <div style="font-size:13px; font-weight:700; margin:4px 0;">
                      ${escapeHtml(safeText(a.role))}
                    </div>
                    <p class="role-description">${desc}</p>
                    <div class="chip-wrap">${chips}</div>
                  </div>
                </div>`;
            }
          }
        });

        view = new SceneView({
          container: "viewDiv",
          map: new Map({ basemap: "dark-gray-3d", layers: [layer] }),
          camera: { position: { longitude: -10, latitude: 20, z: 18000000 }, tilt: 0 },
          popup: {
            dockEnabled: true,
            dockOptions: { position: "bottom-right", breakpoint: false }
          }
        });

        // Widgets (same as before)
        view.when(() => {
          view.ui.add(
            new Expand({
              view,
              content: new BasemapGallery({ view }),
              expandIconClass: "esri-icon-basemap",
              group: "top-right"
            }),
            "top-right"
          );

          view.ui.add(
            new Expand({
              view,
              content: new Daylight({ view }),
              expandIconClass: "esri-icon-sunny",
              group: "top-right"
            }),
            "top-right"
          );

          view.ui.add(
            new Expand({
              view,
              content: new DirectLineMeasurement3D({ view }),
              expandIconClass: "esri-icon-measure-line",
              group: "top-right"
            }),
            "top-right"
          );
        });

        // Load features and initialize UI
        try {
          const res = await layer.queryFeatures();
          features = (res.features || []).sort(
            (a, b) => (a.attributes?.order || 0) - (b.attributes?.order || 0)
          );
          visibleFeatures = [...features];

          populateCountryFilter();
          rebuildList();
          updateTourButton();

          // Rotation: start immediately, but if splash exists and is visible, rotation will continue anyway;
          // closing splash will call startRotation once more (safe).
          startRotation();
        } catch (err) {
          console.error("Failed to query features. Check your GeoJSON path/content.", err);
        }

        // Wire UI
        const cf = $("countryFilter");
        if (cf) cf.onchange = applyFilters;

        const pf = $("phaseFilter");
        if (pf) pf.onchange = applyFilters;

        const tourBtn = $("tourBtn");
        if (tourBtn) tourBtn.onclick = toggleTour;

        const resetBtn = $("resetBtn");
        if (resetBtn) resetBtn.onclick = resetView;

        // If user clicks the map pin, keep list selection in sync
        view.popup.watch("selectedFeature", (g) => {
          if (!g) return;
          const oid = g.attributes?.order;
          if (oid == null) return;
          const idx = visibleFeatures.findIndex((x) => x.attributes?.order === oid);
          if (idx >= 0) {
            index = idx;
            setActiveCard(idx);
            highlightGraphic(visibleFeatures[idx]);
          }
        });
      }
    );
  }

  function createSymbol(color) {
    return {
      type: "point-3d",
      symbolLayers: [
        {
          type: "icon",
          resource: { primitive: "circle" },
          size: 16,
          material: { color },
          outline: { color: "white", size: 2 }
        }
      ],
      verticalOffset: { screenLength: 60 },
      callout: { type: "line", color: "white", size: 2 }
    };
  }

  // start on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
