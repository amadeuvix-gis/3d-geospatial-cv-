require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Daylight",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/Expand"
], (
  Map,
  SceneView,
  GeoJSONLayer,
  BasemapGallery,
  Daylight,
  DirectLineMeasurement3D,
  Expand
) => {

  let view;
  let layer;
  let features = [];
  let visibleFeatures = [];
  let index = -1;
  let tourInterval = null;
  let isFlying = false;
  let rotationHandle = null;

  /* -------------------------------------------------- */
  /* SYMBOL FACTORY                                     */
  /* -------------------------------------------------- */

  function createPointSymbol(color) {
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

  /* -------------------------------------------------- */
  /* GEOJSON LAYER                                      */
  /* -------------------------------------------------- */

  layer = new GeoJSONLayer({
    url: "data/career.geojson",
    outFields: ["*"],
    elevationInfo: { mode: "relative-to-ground" },

    labelingInfo: [
      {
        labelPlacement: "above-center",
        labelExpressionInfo: {
          expression: "$feature.company"
        },
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

    renderer: {
      type: "unique-value",
      field: "career_phase",
      uniqueValueInfos: [
        { value: "Leadership", symbol: createPointSymbol("#f97316") },
        { value: "Consultant", symbol: createPointSymbol("#22c55e") },
        { value: "Technical", symbol: createPointSymbol("#0ea5e9") },
        { value: "Academic", symbol: createPointSymbol("#a855f7") }
      ]
    },

    popupTemplate: {
      title: "{city}, {country}",
      content: (e) => {
        const a = e.graphic.attributes;
        const chips = (a.stack || "")
          .split(",")
          .map(s => `<span class="chip">${s.trim()}</span>`)
          .join("");

        return `
          <div class="popup-timeline">
            <div class="role-company">${a.company}</div>
            <div style="font-size:13px;font-weight:700;margin:4px 0;">
              ${a.role}
            </div>
            <p class="role-description">${a.description}</p>
            <div class="chip-wrap">${chips}</div>
          </div>
        `;
      }
    }
  });

  /* -------------------------------------------------- */
  /* MAP + VIEW                                         */
  /* -------------------------------------------------- */

  view = new SceneView({
    container: "viewDiv",
    map: new Map({
      basemap: "dark-gray-3d",
      layers: [layer]
    }),
    camera: {
      position: { longitude: -10, latitude: 20, z: 18000000 },
      tilt: 0
    },
    popup: {
      dockEnabled: true,
      dockOptions: {
        position: "bottom-right",
        breakpoint: false
      }
    }
  });

  /* -------------------------------------------------- */
  /* UI WIDGETS                                         */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* DATA INIT                                          */
  /* -------------------------------------------------- */

  view.when(() => {
    layer.queryFeatures().then(res => {
      features = res.features.sort(
        (a, b) => (a.attributes.order || 0) - (b.attributes.order || 0)
      );
      visibleFeatures = [...features];
      populateCountryFilter();
      rebuildList();
      startRotation();
    });
  });

  /* -------------------------------------------------- */
  /* ROTATION                                           */
  /* -------------------------------------------------- */

  function startRotation() {
    if (rotationHandle) return;
    const rotate = () => {
      const cam = view.camera.clone();
      cam.position.longitude -= 0.05;
      view.camera = cam;
      rotationHandle = requestAnimationFrame(rotate);
    };
    rotate();
  }

  function stopRotation() {
    if (rotationHandle) {
      cancelAnimationFrame(rotationHandle);
      rotationHandle = null;
    }
  }

  /* -------------------------------------------------- */
  /* FLY TO                                             */
  /* -------------------------------------------------- */

  window.fly = async (i) => {
    if (isFlying || !visibleFeatures[i]) return;
    isFlying = true;
    stopRotation();
    index = i;

    const g = visibleFeatures[i];
    await view.goTo(
      {
        position: {
          longitude: g.geometry.longitude,
          latitude: g.geometry.latitude - 0.008,
          z: 1200
        },
        tilt: 65,
        heading: 0
      },
      { duration: 3500 }
    );

    view.openPopup({ features: [g] });
    rebuildList();
    isFlying = false;
  };

  /* -------------------------------------------------- */
  /* TOUR                                               */
  /* -------------------------------------------------- */

  window.toggleTour = () => {
    const btn = document.getElementById("tourBtn");

    if (tourInterval) {
      clearInterval(tourInterval);
      tourInterval = null;
      btn.textContent = "▶ Play Auto Tour";
      btn.classList.remove("active-tour");
      return;
    }

    btn.textContent = "■ Stop Tour";
    btn.classList.add("active-tour");

    let i = index < 0 ? 0 : index;
    const step = () => {
      fly(i);
      i = (i + 1) % visibleFeatures.length;
    };

    step();
    tourInterval = setInterval(step, 8000);
  };

  /* -------------------------------------------------- */
  /* LIST + FILTERS                                     */
  /* -------------------------------------------------- */

  function rebuildList() {
    const list = document.getElementById("list");
    list.innerHTML = "";

    visibleFeatures.forEach((f, i) => {
      const a = f.attributes;
      const card = document.createElement("div");

      card.className =
        "card" +
        (i === index ? " active" : "") +
        (a.career_phase === "Academic" ? " card-academic" : "");

      card.innerHTML = `<b>${a.company}</b><div>${a.city}</div>`;
      card.onclick = () => {
        if (tourInterval) toggleTour();
        fly(i);
      };

      list.appendChild(card);
    });
  }

  function populateCountryFilter() {
    const select = document.getElementById("countryFilter");
    const countries = [...new Set(features.map(f => f.attributes.country))].sort();
    countries.forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      select.appendChild(o);
    });
  }

  window.applyFilters = () => {
    const country = document.getElementById("countryFilter").value;
    const level = document.getElementById("phaseFilter").value;

    visibleFeatures = features.filter(f => {
      const a = f.attributes;
      return (
        (country === "ALL" || a.country === country) &&
        (level === "ALL" || a.career_phase === level)
      );
    });

    const clauses = [];
    if (country !== "ALL") clauses.push(`country='${country}'`);
    if (level !== "ALL") clauses.push(`career_phase='${level}'`);

    layer.definitionExpression = clauses.length ? clauses.join(" AND ") : null;
    index = -1;
    rebuildList();
  };

  document.getElementById("countryFilter").onchange = applyFilters;
  document.getElementById("phaseFilter").onchange = applyFilters;

  document.getElementById("resetBtn").onclick = () => {
    if (tourInterval) toggleTour();
    view.goTo(
      { position: { longitude: -10, latitude: 20, z: 18000000 }, tilt: 0 },
      { duration: 3000 }
    ).then(() => {
      startRotation();
      index = -1;
      rebuildList();
    });
  };
});
