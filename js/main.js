let view, layer;
let features = [];
let visibleFeatures = [];
let index = -1;
let tourInterval = null;
let isFlying = false;
let rotationHandle = null;

/* ================= SPLASH ================= */
window.closeSplash = () => {
  const splash = document.getElementById("splash");
  splash.style.opacity = "0";
  setTimeout(() => splash.style.display = "none", 800);
};

/* ================= ROTATION ================= */
function startRotation() {
  if (rotationHandle) return;
  const rotate = () => {
    const cam = view.camera.clone();
    cam.position.longitude -= 0.05;
    view.camera = cam;
    rotationHandle = requestAnimationFrame(rotate);
  };
  rotationHandle = requestAnimationFrame(rotate);
}

function stopRotation() {
  if (rotationHandle) {
    cancelAnimationFrame(rotationHandle);
    rotationHandle = null;
  }
}

/* ================= LIST ================= */
function rebuildList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  visibleFeatures.forEach((f, i) => {
    const a = f.attributes;
    const div = document.createElement("div");

    div.className =
      "card" +
      (i === index ? " active" : "") +
      (a.career_phase === "Academic" ? " card-academic" : "");

    div.innerHTML = `
      <b>${a.company}</b>
      <div class="card-sub">${a.city}</div>
    `;

    div.onclick = () => {
      if (tourInterval) toggleTour();
      flyTo(i);
    };

    list.appendChild(div);
  });
}

/* ================= FLY ================= */
async function flyTo(i) {
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

  view.openPopup({
    features: [g],
    updateLocationEnabled: true
  });

  rebuildList();
  isFlying = false;
}

/* ================= TOUR ================= */
function toggleTour() {
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

  let t = index === -1 ? 0 : index;

  const step = () => {
    flyTo(t);
    t = (t + 1) % visibleFeatures.length;
  };

  step();
  tourInterval = setInterval(step, 8000);
}

/* ================= FILTERS ================= */
function populateCountryFilter() {
  const select = document.getElementById("countryFilter");
  select.innerHTML = `<option value="ALL">All Regions</option>`;

  const countries = [
    ...new Set(features.map(f => f.attributes.country))
  ].sort();

  countries.forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    select.appendChild(o);
  });
}

function applyFilters() {
  const country = document.getElementById("countryFilter").value;
  const phase = document.getElementById("phaseFilter").value;

  visibleFeatures = features.filter(f => {
    const a = f.attributes;
    return (
      (country === "ALL" || a.country === country) &&
      (phase === "ALL" || a.career_phase === phase)
    );
  });

  let sql = [];
  if (country !== "ALL") sql.push(`country = '${country}'`);
  if (phase !== "ALL") sql.push(`career_phase = '${phase}'`);

  layer.definitionExpression = sql.length ? sql.join(" AND ") : null;
  index = -1;
  rebuildList();
}

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
    elevationInfo: { mode: "relative-to-ground" }
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
    view.ui.add(
      new Expand({
        view,
        content: new BasemapGallery({ view }),
        expandIconClass: "esri-icon-basemap"
      }),
      "top-right"
    );

    view.ui.add(
      new Expand({
        view,
        content: new Daylight({ view }),
        expandIconClass: "esri-icon-sunny"
      }),
      "top-right"
    );

    view.ui.add(
      new Expand({
        view,
        content: new DirectLineMeasurement3D({ view }),
        expandIconClass: "esri-icon-measure-line"
      }),
      "top-right"
    );

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

  document.getElementById("countryFilter").onchange = applyFilters;
  document.getElementById("phaseFilter").onchange = applyFilters;
  document.getElementById("resetBtn").onclick = () => {
    if (tourInterval) toggleTour();
    view.goTo(
      {
        position: { longitude: -10, latitude: 20, z: 18000000 },
        tilt: 0,
        heading: 0
      },
      { duration: 3000 }
    ).then(() => {
      startRotation();
      index = -1;
      rebuildList();
    });
  };

  document.getElementById("tourBtn").onclick = toggleTour;
});
