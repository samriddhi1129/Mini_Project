import React from 'react';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

const MODEL_COLORS = { KMeans: '#60a5fa', Agglomerative: '#a78bfa', DBSCAN: '#f87171' };
const MODEL_ICONS  = { KMeans: '◈', Agglomerative: '⬡', DBSCAN: '◎' };

export default function ModelComparison() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/compare-models');

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={`Failed to load: ${error}`} />;

  return (
    <div>
      <PageHeader
        title="Algorithm Comparison"
        subtitle="KMeans vs Agglomerative Clustering vs DBSCAN — evaluated on PCA-reduced features"
      />

      {/* Silhouette Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: '1.75rem' }}>
        {data.map(m => {
          const color = MODEL_COLORS[m.model];
          const isBest = m.model === 'Agglomerative';
          const isWorst = m.model === 'DBSCAN';
          return (
            <div key={m.model} style={{
              background: '#1a1d27',
              border: `1px solid ${color}44`,
              borderTop: `3px solid ${color}`,
              borderRadius: 12,
              padding: '1.5rem',
              position: 'relative'
            }}>
              {isBest && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#a78bfa22', color: '#a78bfa',
                  fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20
                }}>✓ BEST</span>
              )}
              {isWorst && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#f8717122', color: '#f87171',
                  fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20
                }}>✗ NOT SUITABLE</span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20, color }}>{MODEL_ICONS[m.model]}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{m.model}</span>
              </div>

              {/* Silhouette Score — big number */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 4 }}>
                  Silhouette Score
                </p>
                <p style={{ fontSize: 36, fontWeight: 800, color }}>
                  {m.silhouette !== null ? m.silhouette : '—'}
                </p>
                {/* Score bar */}
                <div style={{ marginTop: 8, background: '#1e2130', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(0, m.silhouette ?? 0) / 0.5 * 100}%`,
                    background: color, height: '100%', borderRadius: 4,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  Range: −1 (worst) to +1 (best)
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#cbd5e1' }}>Clusters found</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{m.clusters}</span>
                </div>
                {m.noise_pct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>Noise points</span>
                    <span style={{ color: '#f87171', fontWeight: 600 }}>{m.noise_pct}%</span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{m.notes}</p>
            </div>
          );
        })}
      </div>

      {/* Why Agglomerative note */}
      <Card style={{ marginBottom: '1.5rem', borderLeft: '3px solid #f59e0b' }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>📌 Note: </span>
          Silhouette score measures cluster compactness mathematically.
          Agglomerative was selected as the primary algorithm because its clusters are
          <span style={{ color: '#a78bfa', fontWeight: 600 }}> visually better separated </span>
          in 3D PCA space, producing more meaningful and interpretable customer groups.
        </p>
      </Card>

      {/* Verdict */}
      <Card>
        <CardTitle>Verdict & Selection</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Agglomerative ✓ Best', '#a78bfa', 'Visually best-separated clusters in 3D PCA space — 4 clearly distinct groups. Ward linkage ensures compact, meaningful segments. Chosen for all cluster characterization in this project.'],
            ['KMeans', '#60a5fa', 'Slightly lower silhouette score than Agglomerative. Selected for prediction API due to faster inference on new data. k=4 confirmed via elbow method.'],
            ['DBSCAN ✗ Not Suitable', '#f87171', 'Negative silhouette score — worse than random clustering. Found uneven groups with noise points. Customer data is too uniformly spread for density-based approach.'],
          ].map(([name, color, desc]) => (
            <div key={name} style={{
              display: 'flex', gap: 12, background: '#13161f',
              borderRadius: 8, padding: '0.75rem 1rem', borderLeft: `3px solid ${color}`
            }}>
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