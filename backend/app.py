"""
SmartCart Flask API
Serves ML results to React frontend.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import pickle, os

from ml_pipeline import (
    run_pipeline, get_cache,
    CLUSTER_NAMES, CLUSTER_COLORS, RECOMMENDATIONS
)

app = Flask(__name__)
CORS(app)  # Allow React dev server to call us

# Run pipeline once at startup
print("[Server] Running ML pipeline...")
run_pipeline()
print("[Server] Pipeline complete. Starting Flask...")


# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────
def safe_float(v):
    """Convert numpy float to Python float safely."""
    if v is None:
        return None
    try:
        return round(float(v), 2)
    except Exception:
        return None


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.route("/api/overview")
def overview():
    """Total customers, avg income, avg spending, segment distribution."""
    c = get_cache()
    df = c["df_encoded"].copy()
    df["cluster"] = c["labels_agg"]

    total = len(df)
    avg_income = safe_float(df["Income"].mean())
    avg_spending = safe_float(df["Total_Spending"].mean())
    avg_age = safe_float(df["Age"].mean())

    # Segment percentages
    counts = df["cluster"].value_counts().to_dict()
    segments = [
        {
            "cluster": int(k),
            "name": CLUSTER_NAMES[k],
            "color": CLUSTER_COLORS[k],
            "count": int(v),
            "pct": round(v / total * 100, 1)
        }
        for k, v in sorted(counts.items())
    ]

    return jsonify({
        "total_customers": total,
        "avg_income": avg_income,
        "avg_spending": avg_spending,
        "avg_age": avg_age,
        "segments": segments,
        "n_clusters": 4
    })


@app.route("/api/cluster-summary")
def cluster_summary():
    """Per-cluster mean stats for bar charts and profile cards."""
    c = get_cache()
    df = c["df_encoded"].copy()
    df["cluster"] = c["labels_agg"]

    summary = df.groupby("cluster").agg(
        Income=("Income", "mean"),
        Total_Spending=("Total_Spending", "mean"),
        Total_Children=("Total_Children", "mean"),
        Age=("Age", "mean"),
        Recency=("Recency", "mean"),
        Customer_Tenure_Days=("Customer_Tenure_Days", "mean"),
        NumWebVisitsMonth=("NumWebVisitsMonth", "mean"),
        NumWebPurchases=("NumWebPurchases", "mean"),
        NumCatalogPurchases=("NumCatalogPurchases", "mean"),
        NumStorePurchases=("NumStorePurchases", "mean"),
        NumDealsPurchases=("NumDealsPurchases", "mean"),
        Response=("Response", "mean"),
        count=("Income", "count")
    ).reset_index()

    result = []
    for _, row in summary.iterrows():
        cid = int(row["cluster"])
        result.append({
            "cluster": cid,
            "name": CLUSTER_NAMES[cid],
            "color": CLUSTER_COLORS[cid],
            "count": int(row["count"]),
            "Income": safe_float(row["Income"]),
            "Total_Spending": safe_float(row["Total_Spending"]),
            "Total_Children": safe_float(row["Total_Children"]),
            "Age": safe_float(row["Age"]),
            "Recency": safe_float(row["Recency"]),
            "Customer_Tenure_Days": safe_float(row["Customer_Tenure_Days"]),
            "NumWebVisitsMonth": safe_float(row["NumWebVisitsMonth"]),
            "NumWebPurchases": safe_float(row["NumWebPurchases"]),
            "NumCatalogPurchases": safe_float(row["NumCatalogPurchases"]),
            "NumStorePurchases": safe_float(row["NumStorePurchases"]),
            "NumDealsPurchases": safe_float(row["NumDealsPurchases"]),
            "Response": safe_float(row["Response"]),
        })

    return jsonify(result)


@app.route("/api/pca-scatter")
def pca_scatter():
    """3D PCA coordinates for scatter plot."""
    c = get_cache()
    X_pca = c["X_pca"]
    labels = c["labels_agg"]

    # Downsample to 500 points for performance
    np.random.seed(42)
    idx = np.random.choice(len(X_pca), min(500, len(X_pca)), replace=False)

    points = [
        {
            "x": round(float(X_pca[i, 0]), 4),
            "y": round(float(X_pca[i, 1]), 4),
            "z": round(float(X_pca[i, 2]), 4),
            "cluster": int(labels[i])
        }
        for i in idx
    ]

    return jsonify({
        "points": points,
        "variance": [round(v * 100, 2) for v in c["variance_ratio"]],
        "cluster_colors": CLUSTER_COLORS,
        "cluster_names": CLUSTER_NAMES
    })


@app.route("/api/elbow")
def elbow():
    """WCSS and silhouette scores for k=1..10."""
    c = get_cache()
    return jsonify({
        "k_values": list(range(1, 11)),
        "wcss": c["wcss"],
        "sil_k_values": list(range(2, 11)),
        "silhouette_scores": c["sil_scores"],
        "optimal_k": 4
    })


@app.route("/api/compare-models")
def compare_models():
    """Silhouette scores for KMeans, Agglomerative, DBSCAN."""
    c = get_cache()
    return jsonify([
        {
            "model": "KMeans",
            "silhouette": c["sil_kmeans"],
            "clusters": 4,
            "noise_pct": 0,
            "notes": "Best overall balance of compactness and separation"
        },
        {
            "model": "Agglomerative",
            "silhouette": c["sil_agg"],
            "clusters": 4,
            "noise_pct": 0,
            "notes": "Ward linkage, hierarchical — used for cluster characterization"
        },
        {
            "model": "DBSCAN",
            "silhouette": c["sil_db"],
            "clusters": c["n_db_clusters"],
            "noise_pct": c["db_noise_pct"],
            "notes": "Density-based; struggles with high-dimensional uniform data"
        }
    ])


@app.route("/api/recommendations/<int:cluster_id>")
def recommendations(cluster_id):
    """Marketing strategy for a cluster."""
    if cluster_id not in RECOMMENDATIONS:
        return jsonify({"error": "Invalid cluster_id"}), 404
    return jsonify(RECOMMENDATIONS[cluster_id])


@app.route("/api/recommendations")
def all_recommendations():
    """All recommendations."""
    return jsonify(RECOMMENDATIONS)


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Predict cluster for a new customer.
    Expects JSON with fields:
      Income, Age, Total_Spending, Total_Children,
      Customer_Tenure_Days, Recency,
      NumWebVisitsMonth, NumWebPurchases,
      NumCatalogPurchases, NumStorePurchases, NumDealsPurchases,
      Response, Complain,
      Education (Graduate/Postgraduate/Undergraduate),
      Living_With (Alone/Partner)
    """
    data = request.get_json()

    c = get_cache()
    scaler = c["scaler"]
    ohe = c["ohe"]
    pca_obj = c["pca_obj"]
    kmeans_model = c["kmeans_model"]
    col_order = c["ohe_cols"]

    try:
        # Build categorical OHE
        education = data.get("Education", "Graduate")
        living_with = data.get("Living_With", "Alone")
        ohe_arr = ohe.transform([[education, living_with]])
        ohe_cols = ohe.get_feature_names_out(["Education", "Living_With"])

        # Numeric features (same order as df_encoded)
        import pandas as pd
        row = {col: 0.0 for col in col_order}
        numeric_map = {
            "Income": float(data.get("Income", 50000)),
            "Recency": float(data.get("Recency", 50)),
            "NumDealsPurchases": float(data.get("NumDealsPurchases", 2)),
            "NumWebPurchases": float(data.get("NumWebPurchases", 4)),
            "NumCatalogPurchases": float(data.get("NumCatalogPurchases", 2)),
            "NumStorePurchases": float(data.get("NumStorePurchases", 5)),
            "NumWebVisitsMonth": float(data.get("NumWebVisitsMonth", 5)),
            "Complain": float(data.get("Complain", 0)),
            "Response": float(data.get("Response", 0)),
            "Age": float(data.get("Age", 45)),
            "Customer_Tenure_Days": float(data.get("Customer_Tenure_Days", 500)),
            "Total_Spending": float(data.get("Total_Spending", 500)),
            "Total_Children": float(data.get("Total_Children", 1)),
        }
        for k, v in numeric_map.items():
            if k in row:
                row[k] = v
        for col, val in zip(ohe_cols, ohe_arr[0]):
            if col in row:
                row[col] = float(val)

        X_input = pd.DataFrame([row])[col_order]
        X_scaled = scaler.transform(X_input)
        X_pca_input = pca_obj.transform(X_scaled)
        cluster = int(kmeans_model.predict(X_pca_input)[0])

        return jsonify({
            "cluster": cluster,
            "name": CLUSTER_NAMES[cluster],
            "color": CLUSTER_COLORS[cluster],
            **RECOMMENDATIONS[cluster]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
