# 3D Geospatial CV – Luiz Amadeu Coutinho

Interactive **3D Geospatial Curriculum Vitae** built with **ArcGIS Maps SDK for JavaScript (4.x)**, combining storytelling, globe navigation, and professional experience visualization.

This project demonstrates advanced use of:
- 3D SceneView
- GeoJSON-driven data
- Cinematic camera navigation
- GeoBIM-oriented design
- UI/UX patterns for spatial storytelling

---

## 🌍 Live Concept

The application presents a **global-to-local career tour**, guiding the viewer through:
1. Globe-level overview
2. Country focus
3. City-level context
4. Individual professional experiences

Each experience is spatially anchored and enriched with:
- Role descriptions
- Technology stack chips
- Career phase classification
- Visual callouts and highlights

---

## 📁 Project Structure

```text
3d-geospatial-cv/
│
├── assets/
│   ├── Picture1.jpg                 # Profile image (splash screen)
│   └── Luiz_Amadeu_Coutinho_CV.pdf   # Downloadable CV
│
├── css/
│   └── style.css                    # Full UI styling (extracted from original HTML)
│
├── data/
│   └── career.geojson               # All professional experiences (editable)
│
├── js/
│   └── main.js                      # Application logic (SceneView, tour, filters)
│
├── index.html                       # Minimal HTML shell
└── README.md                        # Project documentation
