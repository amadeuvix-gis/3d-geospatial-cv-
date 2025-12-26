# 3D Geospatial CV – Luiz Amadeu Coutinho

An interactive **3D Geospatial Curriculum Vitae** built with **ArcGIS Maps SDK for JavaScript (4.x)**, combining spatial storytelling, globe navigation, and professional experience visualization.

This project showcases advanced usage of **3D GIS**, **GeoJSON-driven content**, and **cinematic camera transitions**, designed as both a **personal portfolio** and a **technical reference**.

---

## 🌍 Live Demo

> 🔗 **Live version (GitHub Pages):**  
> https://SEU_USUARIO.github.io/3d-geospatial-cv/

---

## 🎯 Project Concept

The application presents a **global-to-local career journey**, guiding the viewer through:

1. 🌐 Global overview (rotating globe)  
2. 🌍 Country-level focus  
3. 🏙️ City-level context  
4. 📍 Individual professional experiences  

Each experience is spatially anchored and enriched with descriptive content, technology stack, and visual cues.

---

## 📁 Project Structure

3d-geospatial-cv/
│
├── index.html                # Minimal HTML shell
│
├── assets/
│   ├── Picture1.jpg          # Profile image (splash screen)
│   └── Luiz_Amadeu_Coutinho_CV.pdf
│
├── css/
│   └── style.css             # Complete UI styling
│
├── js/
│   └── main.js               # Application logic (SceneView, tour, UI)
│
├── data/
│   └── career.geojson        # Professional experiences (editable)
│
└── README.md

---

## 🚀 Features

### 🗺️ GIS & 3D
- ArcGIS **SceneView** with `dark-gray-3d` basemap
- 3D point symbols with callouts and vertical offsets
- Career phase–based symbology
- 3D text labeling

### 🎥 Storytelling & Navigation
- Automatic cinematic tour (Play / Stop)
- Smooth `goTo()` camera transitions
- Global auto-rotation (idle mode)
- Reset view to globe overview

### 🧭 UI / UX
- Splash screen introduction
- Left-side synchronized experience list
- Active highlight synchronization (map ↔ list)
- Filters by country and career phase
- Docked, rich-content popup
- Download CV (PDF) and LinkedIn links

### 🧩 Data Design
- External GeoJSON for easy customization
- Ordered timeline using `order` attribute
- Technology stack rendered as visual chips
- Academic vs professional visual differentiation

---

## 🧱 Technology Stack

- ArcGIS Maps SDK for JavaScript 4.29
- HTML5
- CSS3
- Vanilla JavaScript
- GeoJSON

---

## ▶️ How to Run Locally

Because the app loads external files (GeoJSON), it must be served via a local web server.

### Option 1 — Python

python -m http.server 8000

Open:

http://localhost:8000

### Option 2 — VS Code

- Install Live Server
- Right-click index.html → Open with Live Server

---

## 🌐 Deploy on GitHub Pages

1. Push the repository to GitHub  
2. Go to Settings → Pages  
3. Select:
   - Branch: main  
   - Folder: / (root)  
4. Save and wait a few seconds  

Your site will be available at:

https://SEU_USUARIO.github.io/3d-geospatial-cv/

---

## 👤 Author

**Luiz Amadeu Coutinho**  
GeoBIM & Geospatial Consultant  

LinkedIn: https://www.linkedin.com/in/luizamadeucoutinho/
