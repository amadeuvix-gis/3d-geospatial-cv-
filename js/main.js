let view, layer, features = [], visibleFeatures = [];
let index = -1, tourInterval = null, isFlying = false;
let rotationHandle = null;

/* ================= SPLASH ================= */
window.closeSplash = () => {
  const splash = document.getElementById("splash");
  splash.style.opacity = "0";
  setTimeout(() => splash.style.display = "none", 800);
};

/* ================= ARCGIS ================= */
require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/Expand",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Daylight",
  "esri/widgets/DirectLineMeasurement3D"
], (
  Map,
  SceneView,
  GeoJSONLayer,
  Expand,
  BasemapGallery,
  Daylight,
  DirectLineMeasurement3D
) => {

  layer = new GeoJSONLayer({
    url: "data/career.geojson",
    outFields: ["*"],
    elevationInfo: { mode: "relative-to-ground" },

    /* renderer, labelingInfo e popupTemplate
       COPIADOS SEM ALTERAÇÃO */
  });

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
        (a, b) => a.attributes.order - b.attributes.order
      );
      visibleFeatures = [...features];
      populateCountryFilter();
      rebuildList();
      startRotation();
    });
  });

  /* ====== TUDO ABAIXO É COPIADO DO SEU ARQUIVO ======
     fly(), toggleTour(), rebuildList(),
     filtros, rotação, highlight, etc.
  */
});
