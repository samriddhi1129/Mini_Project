import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

const MODEL_COLORS = { KMeans: '#60a5fa', Agglomerative: '#a78bfa', DBSCAN: '#f87171' };
const MODEL_ICONS = { KMeans: '◈', Agglomerative: '⬡', DBSCAN: '◎' };

export default function ModelComparison() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/compare-models');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const chartData = data.map(m => ({
    ...m,
    silhouette_display: m.silhouette ?? 0,
    color: MODEL_COLORS[m.model]
  }));

  return (
    <div>
      <PageHeader
        title="Algorithm Comparison"
        subtitle="KMeans vs Agglomerative Clustering vs DBSCAN — evaluated on PCA-reduced features"
      />

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: '1.75rem' }}>
        {data.map(m => (
          <div key={m.model} style={{
            background: '#1a1d27', border: `1px solid ${MODEL_COLORS[m.model]}44`,
            borderRadius: 12, padding: '1.25rem 1.5rem',
            borderTop: `3px solid ${MODEL_COLORS[m.model]}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: 18, color: MODEL_COLORS[m.model] }}>{MODEL_ICONS[m.model]}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{m.model}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Silhouette</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {m.silhouette !== null ? m.silhouette : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Clusters found</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{m.clusters}</span>
              </div>
              {m.noise_pct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Noise %</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>{m.noise_pct}%</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#4b5563', marginTop: '0.75rem', lineHeight: 1.5 }}>
              {m.notes}
            </p>
          </div>
        ))}
      </div>

      {/* Silhouette bar chart */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Silhouette Score Comparison</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
            <XAxis type="number" domain={[0, 0.35]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis type="category" dataKey="model" tick={{ fill: '#9ca3af', fontSize: 13 }} width={110} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, color: '#e2e8f0' }}
              formatter={v => [v || 'N/A', 'Silhouette']}
            />
            <Bar dataKey="silhouette_display" radius={[0,4,4,0]} label={{ position: 'right', fill: '#9ca3af', fontSize: 12, formatter: (v, _, idx) => data[idx]?.silhouette ?? 'N/A' }}>
              {chartData.map(d => <Cell key={d.model} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Verdict */}
      <Card>
        <CardTitle>Verdict & Selection</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['KMeans', '#60a5fa', 'Selected for prediction API — fast, interpretable, best CH score. k=4 chosen via elbow method on WCSS.'],
            ['Agglomerative', '#a78bfa', 'Used for cluster characterization (matching notebook). Ward linkage gives compact, well-separated clusters without needing centroid assumptions.'],
            ['DBSCAN', '#f87171', 'Not suitable here — customer data is high-dimensional and uniformly distributed. DBSCAN found only 1 meaningful cluster with noise points scattered throughout.'],
          ].map(([name, color, desc]) => (
            <div key={name} style={{ display: 'flex', gap: 12, background: '#13161f', borderRadius: 8, padding: '0.75rem 1rem', borderLeft: `3px solid ${color}` }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 13.5, color: '#f1f5f9', marginBottom: 3 }}>{name}</p>
                <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
