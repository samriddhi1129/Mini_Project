import React from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

export default function ElbowPage() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/elbow');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const { k_values, wcss, sil_k_values, silhouette_scores, optimal_k } = data;

  // Combined data k=2..10 (silhouette starts from k=2)
  const combinedData = sil_k_values.map((k, i) => ({
    k,
    wcss: wcss[k - 1],
    silhouette: silhouette_scores[i],
  }));

  const ttStyle = {
    background: '#1a1d27', border: '1px solid #374151',
    borderRadius: 8, color: '#e2e8f0'
  };

  const wcssAtK4 = wcss[optimal_k - 1]?.toFixed(0);
  const silAtK4 = silhouette_scores[optimal_k - 2]?.toFixed(4);

  return (
    <div>
      <PageHeader
        title="Elbow Method & Silhouette Analysis"
    
      />

      {/* Combined Chart */}
      <Card style={{ marginBottom: '1.75rem' }}>
        <CardTitle>WCSS & Silhouette Score — Combined View</CardTitle>

        {/* Dual Y-axis legend */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, background: '#3b82f6', borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>WCSS (left axis) — lower is better</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, background: '#f87171', borderRadius: 2, borderTop: '2px dashed #f87171' }} />
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>Silhouette Score (right axis) — higher is better</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={combinedData} margin={{ top: 10, right: 40, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis
              dataKey="k"
              label={{ value: 'K (clusters)', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            {/* Left Y axis — WCSS */}
            <YAxis
              yAxisId="wcss"
              orientation="left"
              tick={{ fill: '#3b82f6', fontSize: 11 }}
              label={{ value: 'WCSS', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontSize: 12 }}
            />
            {/* Right Y axis — Silhouette */}
            <YAxis
              yAxisId="sil"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fill: '#f87171', fontSize: 11 }}
              label={{ value: 'Silhouette', angle: 90, position: 'insideRight', fill: '#f87171', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={ttStyle}
              formatter={(v, name) => [
                name === 'WCSS' ? v?.toFixed(0) : v?.toFixed(4),
                name
              ]}
            />
            <ReferenceLine
              yAxisId="wcss"
              x={optimal_k}
              stroke="#60a5fa"
              strokeDasharray="4 4"
              label={{ value: `k=${optimal_k} ★`, fill: '#60a5fa', fontSize: 12, fontWeight: 700 }}
            />
            <Line
              yAxisId="wcss"
              type="monotone"
              dataKey="wcss"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#3b82f6' }}
              activeDot={{ r: 7 }}
              name="WCSS"
            />
            <Line
              yAxisId="sil"
              type="monotone"
              dataKey="silhouette"
              stroke="#f87171"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ r: 5, fill: '#f87171' }}
              activeDot={{ r: 7 }}
              name="Silhouette"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      {/* Analysis explanation */}
      <Card>
        <CardTitle>How to Read This Chart</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#13161f', borderRadius: 8, padding: '1rem', borderLeft: '3px solid #3b82f6' }}>
            <p style={{ fontWeight: 700, color: '#3b82f6', fontSize: 13, marginBottom: 6 }}>📉 WCSS — Elbow Curve</p>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
              WCSS measures how tightly packed each cluster is. As K increases, WCSS always decreases —
              but the key is finding where the curve <strong style={{ color: '#60a5fa' }}>bends like an elbow</strong>.
              At k=4, the curve starts flattening, meaning adding more clusters gives little benefit.
            </p>
          </div>
          <div style={{ background: '#13161f', borderRadius: 8, padding: '1rem', borderLeft: '3px solid #f87171' }}>
            <p style={{ fontWeight: 700, color: '#f87171', fontSize: 13, marginBottom: 6 }}>📈 Silhouette Score</p>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
              Silhouette score measures how well-separated clusters are from each other (0 to 1, higher = better).
              The score <strong style={{ color: '#f87171' }}>peaks near k=4</strong>, confirming that
              4 clusters produce the most distinct and meaningful groups in this dataset.
            </p>
          </div>
          <div style={{ background: '#13161f', borderRadius: 8, padding: '1rem', borderLeft: '3px solid #34d399', gridColumn: '1 / -1' }}>
            <p style={{ fontWeight: 700, color: '#34d399', fontSize: 13, marginBottom: 6 }}>✅ Why k=4?</p>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
              Both methods agree — the elbow in WCSS curve appears at k=4, and silhouette score is strong at k=4.
              Beyond k=4, WCSS improvement is minimal and silhouette stays flat or drops slightly,
              making <strong style={{ color: '#34d399' }}>k=4 the optimal and most interpretable choice</strong> for
              segmenting SmartCart customers into 4 meaningful groups.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}