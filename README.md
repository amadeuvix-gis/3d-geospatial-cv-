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
│
├── index.html                       # Minimal HTML shell
└── README.md                        # Project documentation

🚀 Features
Core GIS & 3D

ArcGIS SceneView with dark-gray-3d basemap

3D callouts with vertical offsets

Career phase–based symbology

Labeling using 3D text symbols

Storytelling & Navigation

Automatic cinematic tour (Play / Stop)

Smooth goTo() transitions

Global auto-rotation (idle mode)

Reset view to globe overview

UI / UX

Left-side synchronized experience list

Active highlight synchronization (map ↔ list)

Filters by country and career phase

Docked popup with rich HTML content

Splash screen intro

Data Design

External GeoJSON for easy editing

Ordered timeline using order attribute

Technology stack rendered as visual chips

Academic vs professional visual differentiation

🧩 Technology Stack

ArcGIS Maps SDK for JavaScript 4.29

HTML5 / CSS3

Vanilla JavaScript (no frameworks)

GeoJSON

🗂️ GeoJSON Schema (data/career.geojson)

Each feature follows this structure:
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "properties": {
    "order": 1,
    "company": "Company Name",
    "role": "Role Title",
    "career_phase": "Leadership | Consultant | Technical | Academic",
    "city": "City",
    "country": "Country",
    "period": "Date range",
    "description": "Detailed role description",
    "stack": "Comma-separated list of technologies"
  }
}

You can:

Add new experiences

Reorder the timeline

Adapt the content for your own CV or portfolio

🛠️ How to Run Locally

Because the app loads external files (GeoJSON), you must run it via a local web server.

Option 1 – Python
python -m http.server 8000


Then open:

http://localhost:8000

Option 2 – VS Code

Use Live Server extension.

🎨 Customization Guide
Change personal info

Header text → index.html

Splash text → index.html

Profile image → assets/Picture1.jpg

CV PDF → assets/Luiz_Amadeu_Coutinho_CV.pdf

Change styling

Edit css/style.css

No inline CSS is used

Change data

Edit data/career.geojson

No code changes required

📌 Design Principles

Zero regression philosophy
Visual, behavioral, and interaction consistency preserved during refactors.

Data-driven UI
All experience content lives in GeoJSON.

Framework-free
Pure ArcGIS JS API + vanilla JS for maximum clarity and portability.

📄 License

This project is released for portfolio and educational purposes.

If you reuse or adapt it, attribution is appreciated.

👤 Author

Luiz Amadeu Coutinho
GeoBIM & Geospatial Consultant

LinkedIn: https://www.linkedin.com/in/luizamadeucoutinho/

Portfolio: (add if applicable)

⭐ Final Note

This project is both:

A professional CV

A technical demonstration of advanced 3D GIS capabilities
