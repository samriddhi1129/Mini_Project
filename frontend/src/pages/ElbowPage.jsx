import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, ComposedChart, Bar
} from 'recharts';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

export default function ElbowPage() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/elbow');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const { k_values, wcss, sil_k_values, silhouette_scores, optimal_k } = data;

  // Build chart data — WCSS for k=1..10
  const wcssData = k_values.map((k, i) => ({ k, wcss: wcss[i] }));

  // Silhouette for k=2..10
  const silData = sil_k_values.map((k, i) => ({ k, silhouette: silhouette_scores[i] }));

  const ttStyle = { background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, color: '#e2e8f0' };

  return (
    <div>
      <PageHeader
        title="Elbow Method & Silhouette Analysis"
        subtitle="Finding optimal number of clusters — KMeans on 3-component PCA features"
      />

      {/* Optimal K highlight */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.75rem' }}>
        <div style={{ background: '#1a1d27', border: '1px solid #60a5fa44', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Optimal K</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>{optimal_k}</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Selected clusters</p>
        </div>
        <div style={{ background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>WCSS at k=4</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa' }}>{wcss[optimal_k-1]?.toFixed(0)}</p>
        </div>
        <div style={{ background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Silhouette at k=4</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>
            {silhouette_scores[optimal_k - 2]?.toFixed(4)}
          </p>
        </div>
      </div>

      {/* WCSS elbow chart */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>WCSS — Elbow Curve</CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={wcssData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="k" label={{ value: 'K (clusters)', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} formatter={v => [v?.toFixed(0), 'WCSS']} />
            <ReferenceLine x={optimal_k} stroke="#60a5fa" strokeDasharray="4 4" label={{ value: `k=${optimal_k}`, fill: '#60a5fa', fontSize: 11 }} />
            <Line type="monotone" dataKey="wcss" stroke="#60a5fa" strokeWidth={2} dot={{ r: 5, fill: '#60a5fa' }} activeDot={{ r: 7 }} name="WCSS" />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12, color: '#4b5563', marginTop: '0.5rem' }}>
          The "elbow" at k=4 marks where WCSS reduction slows — diminishing returns beyond this point.
        </p>
      </Card>

      {/* Silhouette chart */}
      <Card>
        <CardTitle>Silhouette Score by K</CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={silData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="k" label={{ value: 'K (clusters)', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis domain={['auto','auto']} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} formatter={v => [v?.toFixed(4), 'Silhouette']} />
            <ReferenceLine x={optimal_k} stroke="#34d399" strokeDasharray="4 4" label={{ value: `k=${optimal_k}`, fill: '#34d399', fontSize: 11 }} />
            <Line type="monotone" dataKey="silhouette" stroke="#34d399" strokeWidth={2} dot={{ r: 5, fill: '#34d399' }} activeDot={{ r: 7 }} name="Silhouette Score" />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12, color: '#4b5563', marginTop: '0.5rem' }}>
          Higher silhouette = better-defined clusters. Peak near k=2–4 supports choosing k=4 for interpretability.
        </p>
      </Card>
    </div>
  );
}
