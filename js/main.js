<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Luiz Amadeu Coutinho – 3D Geospatial CV</title>
    <link rel="stylesheet" href="https://js.arcgis.com/4.29/esri/themes/dark/main.css"/>
    <link rel="stylesheet" href="css/style.css"/>
</head>
<body>

<div id="splash">
  <div class="splash-content">
    <img src="assets/Picture1.jpg" alt="Profile" class="profile-img" onerror="this.style.display='none'">
    <h1>Luiz Amadeu Coutinho</h1>
    <p>GIS Consultant with over 20 years of experience delivering ArcGIS-based solutions. Specialist in GeoBIM, Reality Capture, and ArcGIS Enterprise administration.</p>
    <button class="explore-btn" onclick="closeSplash()">Explore My Career Portfolio</button>
  </div>
</div>

<header id="header">
  <div><b>Luiz Amadeu Coutinho</b> | GeoBIM Director</div>
  <div style="display:flex;gap:16px;">
    <a href="assets/Luiz_Amadeu_Coutinho_CV.pdf" download style="color:#38bdf8;text-decoration:none;font-weight:600;border:1px solid #38bdf8;padding:4px 12px;border-radius:8px;">Download CV (PDF)</a>
    <a href="https://www.linkedin.com/in/luizamadeucoutinho/" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:600;padding-top:5px;">LinkedIn</a>
  </div>
</header>

<div id="app">
  <aside id="sidebar">
    <button id="mobileToggle" onclick="toggleSidebar()">︾ Minimize List</button>
    
    <div class="panel">
      <div class="btnrow"><button id="tourBtn" onclick="toggleTour()">▶ Play Auto Tour</button></div>
      <div class="btnrow"><button id="resetBtn">Reset View</button></div>
      <label>Filter by Country</label>
      <select id="countryFilter"><option value="ALL">All Regions</option></select>
      <label>Career Level</label>
      <select id="phaseFilter">
        <option value="ALL">All Levels</option>
        <option>Leadership</option><option>Consultant</option><option>Technical</option><option>Academic</option>
      </select>
    </div>
    <div id="list"></div>
  </aside>
  <main id="viewDiv"></main>
</div>

<script src="https://js.arcgis.com/4.29/"></script>
<script src="js/main.js"></script>
</body>
</html>
