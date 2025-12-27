let view, visibleFeatures = [], index = -1, tourInterval = null, isFlying = false, animationHandle = null, features = [], layer;

function closeSplash() { 
    document.getElementById('splash').style.opacity = '0'; 
    setTimeout(() => document.getElementById('splash').style.display = 'none', 800); 
}

require([
  "esri/Map", "esri/views/SceneView", "esri/layers/GeoJSONLayer",
  "esri/widgets/BasemapGallery", "esri/widgets/Daylight", 
  "esri/widgets/DirectLineMeasurement3D", "esri/widgets/Expand"
], (Map, SceneView, GeoJSONLayer, BasemapGallery, Daylight, DirectLineMeasurement3D, Expand) => {

  const createSymbol = (color) => ({
    type: "point-3d", symbolLayers: [{ type: "icon", resource: { primitive: "circle" }, size: 16, material: { color }, outline: { color: "white", size: 2 } }],
    verticalOffset: { screenLength: 60 }, callout: { type: "line", color: "white", size: 2 }
  });

  // Carregando o arquivo externo da pasta data/
  layer = new GeoJSONLayer({
    url: "data/career.geojson",
    outFields: ["*"], 
    elevationInfo: { mode: "relative-to-ground" },
    labelingInfo: [{
      labelPlacement: "above-center", 
      labelExpressionInfo: { expression: "$feature.company" },
      symbol: { type: "label-3d", symbolLayers: [{ type: "text", material: { color: "white" }, halo: { color: "black", size: 1 }, size: 10, font: { weight: "bold" } }] }
    }],
    renderer: {
      type: "unique-value", field: "career_phase",
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
        const a = e.graphic.attributes;
        const chips = (a.stack || "").split(",").map(s => `<span class="chip">${s.trim()}</span>`).join("");
        return `<div class="popup-timeline"><div class="role-item">
            <div class="role-company">${a.company}</div>
            <div style="font-size:13px; font-weight:700; margin:4px 0;">${a.role}</div>
            <p class="role-description">${a.description}</p>
            <div class="chip-wrap">${chips}</div>
          </div></div>`;
      }
    }
  });

  view = new SceneView({
    container: "viewDiv", 
    map: new Map({ basemap: "dark-gray-3d", layers: [layer] }),
    camera: { position: { longitude: -10, latitude: 20, z: 18000000 }, tilt: 0 },
    popup: { dockEnabled: true, dockOptions: { position: "bottom-right", breakpoint: false } }
  });

  const rotate = () => { if(!animationHandle) return; const cam = view.camera.clone(); cam.position.longitude -= 0.1; view.camera = cam; animationHandle = requestAnimationFrame(rotate); };
  window.startRot = () => { if(!animationHandle) { animationHandle = true; rotate(); } };
  window.stopRot = () => { animationHandle = null; };

  window.fly = async (i) => {
    if (isFlying || !visibleFeatures[i]) return;
    isFlying = true; window.stopRot(); index = i;
    const target = visibleFeatures[i];
    await view.goTo({ position: { longitude: target.geometry.longitude, latitude: target.geometry.latitude - 0.008, z: 1200 }, tilt: 65, heading: 0 }, { duration: 3500 });
    view.openPopup({ features: [target], updateLocationEnabled: true });
    window.rebuildList();
    isFlying = false;
  };

  window.toggleTour = () => {
    if (tourInterval) { 
      clearInterval(tourInterval); tourInterval = null; 
      document.getElementById("tourBtn").textContent = "▶ Play Auto Tour"; 
      document.getElementById("tourBtn").classList.remove("active-tour"); 
    } else { 
      document.getElementById("tourBtn").textContent = "■ Stop Tour"; 
      document.getElementById("tourBtn").classList.add("active-tour"); 
      let tourIdx = (index === -1) ? 0 : index; 
      const step = () => { if (!tourInterval) return; window.fly(tourIdx); tourIdx = (tourIdx + 1) % visibleFeatures.length; };
      step(); 
      tourInterval = setInterval(step, 8000); 
    }
  };

  window.rebuildList = () => {
    const list = document.getElementById("list"); list.innerHTML = "";
    visibleFeatures.forEach((f, i) => {
      const a = f.attributes;
      const d = document.createElement("div"); d.className = "card" + (i === index ? " active" : "") + (a.career_phase === "Academic" ? " card-academic" : "");
      d.innerHTML = `<b>${a.company}</b><div class="card-sub"><span>${a.city}</span></div>`;
      d.onclick = () => { if(tourInterval) window.toggleTour(); window.fly(i); }; list.appendChild(d);
    });
  };

  window.applyFilters = () => {
    const country = document.getElementById("countryFilter").value;
    const phase = document.getElementById("phaseFilter").value;
    visibleFeatures = features.filter(f => {
      const matchCountry = (country === "ALL" || f.attributes.country === country);
      const matchPhase = (phase === "ALL" || f.attributes.career_phase === phase);
      return matchCountry && matchPhase;
    });
    let sql = [];
    if (country !== "ALL") sql.push(`country = '${country}'`);
    if (phase !== "ALL") sql.push(`career_phase = '${phase}'`);
    layer.definitionExpression = sql.length > 0 ? sql.join(" AND ") : null;
    index = -1;
    window.rebuildList();
  };

  view.when(() => {
    view.ui.add(new Expand({ view, content: new BasemapGallery({ view }), expandIconClass: "esri-icon-basemap", group: "top-right" }), "top-right");
    view.ui.add(new Expand({ view, content: new Daylight({ view }), expandIconClass: "esri-icon-sunny", group: "top-right" }), "top-right");
    view.ui.add(new Expand({ view, content: new DirectLineMeasurement3D({ view }), expandIconClass: "esri-icon-measure-line", group: "top-right" }), "top-right");

    layer.queryFeatures().then(res => {
      features = res.features.sort((a,b) => (a.attributes.order || 0) - (b.attributes.order || 0));
      visibleFeatures = [...features];
      const cf = document.getElementById("countryFilter");
      [...new Set(features.map(f => f.attributes.country))].sort().forEach(c => {
        const o = document.createElement("option"); o.value = o.textContent = c; cf.appendChild(o);
      });
      window.rebuildList(); window.startRot();
    });
  });

  document.getElementById("countryFilter").onchange = window.applyFilters;
  document.getElementById("phaseFilter").onchange = window.applyFilters;
  document.getElementById("resetBtn").onclick = () => { 
    if(tourInterval) window.toggleTour(); 
    view.goTo({ position: { longitude: -10, latitude: 20, z: 18000000 }, tilt: 0, heading: 0 }, { duration: 3000 })
    .then(() => { window.startRot(); index = -1; window.rebuildList(); });
  };
});
