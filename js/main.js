/* =========================================================
   GLOBALS (necessários para HTML inline handlers)
========================================================= */
window.closeSplash = function () {
  const splash = document.getElementById("splash");
  splash.style.opacity = "0";
  setTimeout(() => (splash.style.display = "none"), 800);
};

let view, layer, features = [], visibleFeatures = [], index = -1;
let tourInterval = null;
let isFlying = false;

/* =========================================================
   ARCGIS REQUIRE
========================================================= */
require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Daylight",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/Expand"
], function (
  Map,
  SceneView,
  GeoJSONLayer,
  BasemapGallery,
  Daylight,
  DirectLineMeasurement3D,
  Expand
) {

  /* =========================================================
     LOAD GEOJSON (external file)
  ========================================================= */
  layer = new GeoJSONLayer({
    url: "data/career.geojson",
    outFields: ["*"],
    elevationInfo: {
      mode: "relative-to-ground"
    },

    /* ---------------- SYMBOLS + CALLOUT ---------------- */
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

    /* ---------------- LABELS ---------------- */
    labelingInfo: [{
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.company"
      },
      symbol: {
        type: "label-3d",
        symbolLayers: [{
          type: "text",
          material: { color: "white" },
          halo: { color: "black", size: 1 },
          size: 10,
          font: { weight: "bold" }
        }]
      }
    }],

    /* ---------------- POPUP ---------------- */
    popupTemplate: {
      title: "{city}, {country}",
      content: function (e) {
        const a = e.graphic.attributes;

        if (!a) return "No data";

        const chips = (a.stack || "")
          .split(",")
          .map(s => `<span class="chip">${s.trim()}</span>`)
          .join("");

        return `
          <div class="popup-timeline">
            <div class="role-company">${a.company}</div>
            <div style="font-weight:700;margin:4px 0">${a.role}</div>
            <div class="role-description">${a.description}</div>
            <div class="chip-wrap">${chips}</div>
          </div>
        `;
      }
    }
  });

  /* =========================================================
     MAP + VIEW
  ========================================================= */
  const map = new Map({
    basemap: "dark-gray-3d",
    layers: [layer]
  });

  view = new SceneView({
    container: "viewDiv",
    map,
    camera: {
      position: { longitude: -10, latitude: 20, z: 18000000 },
      tilt: 0
    },
    popup: {
      dockEnabled: true,
      dockOptions: { position: "bottom-right", breakpoint: false }
    }
  });

  /* =========================================================
     UI WIDGETS
  ========================================================= */
  view.when(() => {
    view.ui.add(new Expand({
      view,
      content: new BasemapGallery({ view }),
      expandIconClass: "esri-icon-basemap"
    }), "top-right");

    view.ui.add(new Expand({
      view,
      content: new Daylight({ view }),
      expandIconClass: "esri-icon-sunny"
    }), "top-right");

    view.ui.add(new Expand({
      view,
      content: new DirectLineMeasurement3D({ view }),
      expandIconClass: "esri-icon-measure-line"
    }), "top-right");

    layer.queryFeatures().then(res => {
      features = res.features.sort(
        (a, b) => (a.attributes.order || 0) - (b.attributes.order || 0)
      );
      visibleFeatures = [...features];
      rebuildList();
    });
  });

  /* =========================================================
     HELPERS
  ========================================================= */
  function createSymbol(color) {
    return {
      type: "point-3d",
      symbolLayers: [{
        type: "icon",
        resource: { primitive: "circle" },
        size: 16,
        material: { color },
        outline: { color: "white", size: 2 }
      }],
      verticalOffset: { screenLength: 60 },
      callout: { type: "line", color: "white", size: 2 }
    };
  }

  /* =========================================================
     FLY TO
  ========================================================= */
  window.fly = async function (i) {
    if (isFlying || !visibleFeatures[i]) return;
    isFlying = true;
    index = i;

    const g = visibleFeatures[i].geometry;

    await view.goTo({
      position: {
        longitude: g.longitude,
        latitude: g.latitude - 0.006,
        z: 1200
      },
      tilt: 65,
      heading: 0
    }, { duration: 3500 });

    view.openPopup({ features: [visibleFeatures[i]] });
    rebuildList();
    isFlying = false;
  };

  /* =========================================================
     LIST
  ========================================================= */
  function rebuildList() {
    const list = document.getElementById("list");
    list.innerHTML = "";

    visibleFeatures.forEach((f, i) => {
      const a = f.attributes;
      const d = document.createElement("div");
      d.className = "card" + (i === index ? " active" : "");
      d.innerHTML = `<b>${a.company}</b><div>${a.city}</div>`;
      d.onclick = () => fly(i);
      list.appendChild(d);
    });
  }

});
