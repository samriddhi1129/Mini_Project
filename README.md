# SmartCart — Customer Segmentation Dashboard

Full-stack ML project: Flask backend + React frontend with 3D PCA visualization.

## Project Structure

```
smartcart/
├── backend/
│   ├── app.py                  # Flask API (7 endpoints)
│   ├── ml_pipeline.py          # ML pipeline (matches notebook exactly)
│   ├── smartcart_customers.csv # Dataset
│   ├── requirements.txt
│   └── models/                 # Auto-created: saved scaler, OHE, PCA, KMeans
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx              # Router + sidebar layout
        ├── index.js
        ├── components/
        │   └── shared.jsx       # StatCard, Card, useFetch hook
        └── pages/
            ├── Overview.jsx     # Stat cards + pie chart
            ├── Clusters.jsx     # Bar charts + cluster profile cards
            ├── PCAPage.jsx      # 3D scatter (react-three-fiber)
            ├── ElbowPage.jsx    # WCSS + Silhouette line charts
            ├── ModelComparison.jsx  # KMeans vs Agglo vs DBSCAN
            ├── Recommendations.jsx  # Marketing strategies per segment
            └── Predict.jsx      # Form → predict cluster + strategy
```

---

## ML Pipeline (matches your notebook)

1. Load `smartcart_customers.csv`
2. Fill missing `Income` with median
3. Feature engineering:
   - `Age` = 2026 - Year_Birth
   - `Customer_Tenure_Days` from Dt_Customer
   - `Total_Spending` = sum of all Mnt columns
   - `Total_Children` = Kidhome + Teenhome
4. Group Education → Graduate/Postgraduate/Undergraduate
5. Group Marital_Status → Living_With (Alone/Partner)
6. Drop original columns + individual Mnt columns
7. Remove outliers (Age < 90, Income < 600,000)
8. OneHotEncode Education + Living_With
9. StandardScaler on all features
10. PCA (3 components) — used for clustering + 3D visualization
11. KMeans (k=4), Agglomerative Ward (k=4), DBSCAN
12. Cluster characterization uses Agglomerative labels (matching notebook)

## 4 Customer Segments (from analysis)

| # | Name | Color | Key Traits |
|---|------|-------|-----------|
| 0 | Family Shoppers | Red | Low income, more children, high web visits, low purchases |
| 1 | Premium Customers | Blue | High income, high spending, store/catalog buyers |
| 2 | Digital Browsers | Yellow | Low income, live alone, high web visits, low conversion |
| 3 | High Value Singles | Green | Mod-high income, best ad response, all channels high |

---

## Setup Instructions

### Step 1 — Backend (Flask)

```bash
cd smartcart/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install flask flask-cors pandas numpy scikit-learn kneed

# Start Flask server
python app.py
```


The ML pipeline runs automatically on first start (~5 seconds).

### Step 2 — Frontend (React)

Open a new terminal:

```bash
cd smartcart/frontend

# Install dependencies
npm install

# Start React dev server
npm start
```


## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/overview` | GET | Total customers, avg income/spending, segment % |
| `/api/cluster-summary` | GET | Per-cluster mean statistics |
| `/api/pca-scatter` | GET | 3D PCA points with cluster labels |
| `/api/elbow` | GET | WCSS + silhouette for k=1..10 |
| `/api/compare-models` | GET | KMeans vs Agglomerative vs DBSCAN metrics |
| `/api/recommendations` | GET | All 4 segment strategies |
| `/api/recommendations/<id>` | GET | Strategy for one cluster |
| `/api/predict` | POST | Predict cluster from customer input |

### Predict endpoint example

```bash

  -H "Content-Type: application/json" \
  -d '{
    "Income": 75000,
    "Age": 50,
    "Total_Spending": 1200,
    "Total_Children": 0,
    "Customer_Tenure_Days": 800,
    "Recency": 30,
    "NumWebVisitsMonth": 3,
    "NumWebPurchases": 6,
    "NumCatalogPurchases": 5,
    "NumStorePurchases": 7,
    "NumDealsPurchases": 1,
    "Response": 1,
    "Complain": 0,
    "Education": "Graduate",
    "Living_With": "Partner"
  }'
```

---

## Dashboard Pages

- **Overview** — 4 stat cards, pie chart, cluster breakdown
- **Clusters** — Interactive metric selector, bar charts, profile cards
- **3D PCA** — react-three-fiber scatter (drag=rotate, scroll=zoom)
- **Elbow Method** — WCSS elbow + silhouette line charts
- **Model Comparison** — Side-by-side KMeans/Agglo/DBSCAN
- **Recommendations** — Full marketing strategy per segment
- **Predict** — Input form → real-time segment prediction

---

## Troubleshooting

**"Failed to load" on frontend** → Make sure Flask is running (`python app.py`) before starting React.

**CORS error** → Check Flask has `flask-cors` installed and `CORS(app)` is in app.py.

**npm install fails** → Use Node.js 18+. Check with `node --version`.

**3D PCA page blank** → react-three-fiber needs WebGL. Use Chrome/Firefox (not Safari for best support).
