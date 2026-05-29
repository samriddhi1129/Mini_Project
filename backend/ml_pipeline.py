"""
SmartCart ML Pipeline
Matches exactly the logic from the Jupyter notebook:
- Feature engineering (Age, Total_Spending, Total_Children, Customer_Tenure_Days)
- OHE encoding for Education, Living_With
- StandardScaler
- PCA (3 components) for both clustering AND visualization
- KMeans (k=4), Agglomerative (k=4), DBSCAN
- Cluster characterization using Agglomerative labels (notebook uses labels_agg)
"""

import pandas as pd
import numpy as np
import pickle, os
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import silhouette_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "smartcart_customers.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── cached results (populated by run_pipeline) ───
_cache = {}


def run_pipeline():
    """Run full ML pipeline and cache results. Call once on startup."""
    global _cache

    # ── 1. Load ──
    df = pd.read_csv(DATA_PATH)

    # ── 2. Missing values ──
    df["Income"] = df["Income"].fillna(df["Income"].median())

    # ── 3. Feature Engineering ──
    df["Age"] = 2026 - df["Year_Birth"]

    df["Dt_Customer"] = pd.to_datetime(df["Dt_Customer"], dayfirst=True)
    reference_date = df["Dt_Customer"].max()
    df["Customer_Tenure_Days"] = (reference_date - df["Dt_Customer"]).dt.days

    df["Total_Spending"] = (
        df["MntWines"] + df["MntFruits"] + df["MntMeatProducts"]
        + df["MntFishProducts"] + df["MntSweetProducts"] + df["MntGoldProds"]
    )
    df["Total_Children"] = df["Kidhome"] + df["Teenhome"]

    # ── 4. Education & Marital grouping ──
    df["Education"] = df["Education"].replace({
        "Basic": "Undergraduate", "2n Cycle": "Undergraduate",
        "Graduation": "Graduate",
        "Master": "Postgraduate", "PhD": "Postgraduate"
    })
    df["Living_With"] = df["Marital_Status"].replace({
        "Married": "Partner", "Together": "Partner",
        "Single": "Alone", "Divorced": "Alone",
        "Widow": "Alone", "Absurd": "Alone", "YOLO": "Alone"
    })

    # ── 5. Drop original columns ──
    cols_to_drop = (
        ["ID", "Year_Birth", "Marital_Status", "Kidhome", "Teenhome", "Dt_Customer"]
        + ["MntWines", "MntFruits", "MntMeatProducts", "MntFishProducts",
           "MntSweetProducts", "MntGoldProds"]
    )
    df_cleaned = df.drop(columns=cols_to_drop)

    # ── 6. Remove outliers ──
    df_cleaned = df_cleaned[df_cleaned["Age"] < 90]
    df_cleaned = df_cleaned[df_cleaned["Income"] < 600_000]
    df_cleaned = df_cleaned.reset_index(drop=True)

    # ── 7. OHE Encoding ──
    ohe = OneHotEncoder(sparse_output=False)
    cat_cols = ["Education", "Living_With"]
    enc_arr = ohe.fit_transform(df_cleaned[cat_cols])
    enc_df = pd.DataFrame(
        enc_arr,
        columns=ohe.get_feature_names_out(cat_cols),
        index=df_cleaned.index
    )
    df_encoded = pd.concat([df_cleaned.drop(columns=cat_cols), enc_df], axis=1)

    # ── 8. Scaling ──
    X = df_encoded.copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── 9. PCA (3 components) — used for clustering too, matching notebook ──
    pca = PCA(n_components=3)
    X_pca = pca.fit_transform(X_scaled)
    variance_ratio = pca.explained_variance_ratio_.tolist()

    # ── 10. Elbow & Silhouette ──
    wcss, sil_scores = [], []
    for k in range(1, 11):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit_predict(X_pca)
        wcss.append(round(km.inertia_, 2))
    for k in range(2, 11):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        lbl = km.fit_predict(X_pca)
        sil_scores.append(round(silhouette_score(X_pca, lbl), 4))

    # ── 11. Clustering ──
    # KMeans k=4
    kmeans_final = KMeans(n_clusters=4, random_state=42, n_init=10)
    labels_kmeans = kmeans_final.fit_predict(X_pca)

    # Agglomerative k=4 (notebook uses these labels for characterization)
    agg_clf = AgglomerativeClustering(n_clusters=4, linkage="ward")
    labels_agg = agg_clf.fit_predict(X_pca)

    # DBSCAN
    db = DBSCAN(eps=0.5, min_samples=5)
    labels_dbscan = db.fit_predict(X_pca)
    n_db_clusters = len(set(labels_dbscan)) - (1 if -1 in labels_dbscan else 0)
    db_noise_pct = round((labels_dbscan == -1).sum() / len(labels_dbscan) * 100, 1)

    # ── 12. Model comparison silhouette scores ──
    sil_kmeans = round(silhouette_score(X_pca, labels_kmeans), 4)
    sil_agg = round(silhouette_score(X_pca, labels_agg), 4)
    mask_db = labels_dbscan != -1
    sil_db = (
        round(silhouette_score(X_pca[mask_db], labels_dbscan[mask_db]), 4)
        if mask_db.sum() > 1 and len(set(labels_dbscan[mask_db])) > 1
        else None
    )

    # ── 13. Cluster characterization (using Agglomerative labels, matching notebook) ──
    X_char = df_encoded.copy()
    X_char["cluster"] = labels_agg

    cluster_summary = X_char.groupby("cluster").mean(numeric_only=True).round(2)

    # ── 14. Save models for predict endpoint ──
    with open(os.path.join(MODEL_DIR, "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    with open(os.path.join(MODEL_DIR, "ohe.pkl"), "wb") as f:
        pickle.dump(ohe, f)
    with open(os.path.join(MODEL_DIR, "pca.pkl"), "wb") as f:
        pickle.dump(pca, f)
    with open(os.path.join(MODEL_DIR, "kmeans.pkl"), "wb") as f:
        pickle.dump(kmeans_final, f)

    # ── 15. Cache everything ──
    _cache = {
        "df_encoded": df_encoded,
        "X_pca": X_pca,
        "labels_kmeans": labels_kmeans,
        "labels_agg": labels_agg,
        "labels_dbscan": labels_dbscan,
        "variance_ratio": variance_ratio,
        "wcss": wcss,
        "sil_scores": sil_scores,
        "cluster_summary": cluster_summary,
        "sil_kmeans": sil_kmeans,
        "sil_agg": sil_agg,
        "sil_db": sil_db,
        "n_db_clusters": n_db_clusters,
        "db_noise_pct": db_noise_pct,
        "ohe_cols": list(df_encoded.columns),
        "scaler": scaler,
        "ohe": ohe,
        "pca_obj": pca,
        "kmeans_model": kmeans_final,
    }
    print(f"[Pipeline] Done. Customers: {len(df_encoded)}, "
          f"KMeans silhouette: {sil_kmeans}, Agg silhouette: {sil_agg}")
    return _cache


def get_cache():
    if not _cache:
        run_pipeline()
    return _cache


# ─── Cluster Names (from notebook/notes image) ───
CLUSTER_NAMES = {
    0: "Family Shoppers",     # Red  — low income, low spending, more children
    1: "Premium Customers",   # Blue — high income, high spending, fewer children
    2: "Digital Browsers",    # Yellow — low income, low spending, live alone
    3: "High Value Singles",  # Green — moderate-high income, best response, live alone
}

CLUSTER_COLORS = {0: "#ef4444", 1: "#3b82f6", 2: "#eab308", 3: "#22c55e"}

# ─── Marketing Recommendations (from notes image) ───
RECOMMENDATIONS = {
    0: {
        "name": "Family Shoppers",
        "color": "#ef4444",
        "description": (
            "Low to moderate income with low/moderate spending. "
            "Have more children, live with partners. "
            "High web visits but low purchases across all channels."
        ),
        "traits": [
            "Low/Moderate Income",
            "Low/Moderate Spending",
            "More Children",
            "Poor Campaign Response",
            "Live with Partners",
            "High Web Visits",
            "Website/Catalog/Store purchases low"
        ],
        "strategy": "Discounts & Coupons",
        "tactics": [
            "Flash sales and family bundle deals",
            "Coupon campaigns via email/push",
            "Free shipping on family essentials",
            "Festival/seasonal offers targeting parents",
            "Referral bonus: Refer a friend, both save"
        ]
    },
    1: {
        "name": "Premium Customers",
        "color": "#3b82f6",
        "description": (
            "High income and high spending segment. "
            "Fewer children, slightly higher age, live with partners. "
            "Low web visits but high store and catalog purchases."
        ),
        "traits": [
            "High Income, High Spending",
            "Fewer Children",
            "Slightly Higher Age",
            "Average Campaign Response",
            "Live with Partners",
            "Low Web Visits",
            "Store/Catalog Purchases HIGH"
        ],
        "strategy": "Loyalty Program",
        "tactics": [
            "Exclusive VIP membership with early access",
            "Premium catalog campaigns with curated bundles",
            "Personalised concierge support",
            "Subscription boxes (wine, gourmet, gold products)",
            "Invite to referral programs — high social reach"
        ]
    },
    2: {
        "name": "Digital Browsers",
        "color": "#eab308",
        "description": (
            "Low income with low spending. More children, live alone or single parent. "
            "Very high web visits but all purchase channels low — high browse-to-buy gap."
        ),
        "traits": [
            "Low Income, Low Spending",
            "More Children",
            "Average Campaign Response",
            "Live Alone / Single Parent",
            "High Web Visits",
            "All purchases low"
        ],
        "strategy": "Flash Sales & Heavy Discounts",
        "tactics": [
            "Retargeting ads: 'You were looking at…'",
            "First-purchase cashback or voucher",
            "Flash sale popups triggered on web visit",
            "Free shipping threshold just above current avg order",
            "Affordable product recommendations (fruits, sweets)"
        ]
    },
    3: {
        "name": "High Value Singles",
        "color": "#22c55e",
        "description": (
            "Moderate to high income with high spending. Fewer children, slightly higher age, "
            "live alone. Best response to all advertisements. Store/catalog/web purchases all high."
        ),
        "traits": [
            "Moderate–High Income",
            "High Spending",
            "Fewer Children",
            "Slightly Higher Age",
            "Best Response from ALL Advertisements",
            "Live Alone",
            "Low Web Visits",
            "Store/Catalog HIGH, Web Purchases High"
        ],
        "strategy": "Premium Services",
        "tactics": [
            "Multi-channel targeted campaigns (all channels work well)",
            "Premium tier upsell — they convert across all channels",
            "Exclusive early-access product launches",
            "Personalised product recommendations via email",
            "Loyalty rewards with premium experiences"
        ]
    }
}
