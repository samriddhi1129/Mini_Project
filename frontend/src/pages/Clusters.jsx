import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, Legend
} from 'recharts';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

const METRICS = [
  { key: 'Income',             label: 'Avg Income ($)',        color: '#60a5fa' },
  { key: 'Total_Spending',     label: 'Avg Spending ($)',      color: '#a78bfa' },
  { key: 'Age',                label: 'Avg Age (yrs)',         color: '#f59e0b' },
  { key: 'Recency',            label: 'Recency (days)',        color: '#f87171' },
  { key: 'NumWebVisitsMonth',  label: 'Web Visits/Month',      color: '#34d399' },
  { key: 'NumStorePurchases',  label: 'Store Purchases',       color: '#fb923c' },
  { key: 'NumWebPurchases',    label: 'Web Purchases',         color: '#38bdf8' },
  { key: 'NumCatalogPurchases',label: 'Catalog Purchases',     color: '#e879f9' },
  { key: 'Total_Children',     label: 'Avg Children',          color: '#4ade80' },
  { key: 'Response',           label: 'Campaign Response Rate',color: '#facc15' },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, padding: '0.75rem 1rem' }}>
      <p style={{ fontWeight: 600, color: d.color, marginBottom: 4 }}>{d.name}</p>
      <p style={{ color: '#e2e8f0', fontSize: 14 }}>{payload[0].name}: <strong>{payload[0].value?.toFixed(1)}</strong></p>
    </div>
  );
}

export default function Clusters() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/cluster-summary');
  const [activeMetric, setActiveMetric] = useState('Income');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const metric = METRICS.find(m => m.key === activeMetric);

  return (
    <div>
      <PageHeader
        title="Cluster Profiles"
        subtitle="Mean statistics per segment — clusters from Agglomerative Clustering (Ward linkage, k=4)"
      />

      {/* Metric selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            style={{
              background: activeMetric === m.key ? m.color + '22' : '#1a1d27',
              color: activeMetric === m.key ? m.color : '#9ca3af',
              border: `1px solid ${activeMetric === m.key ? m.color : '#1e2130'}`,
              borderRadius: 20, padding: '4px 14px', fontSize: 12.5,
              cursor: 'pointer', fontWeight: activeMetric === m.key ? 600 : 400,
              transition: 'all 0.15s'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>{metric.label} by Cluster</CardTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey={activeMetric} name={metric.label} radius={[4,4,0,0]}>
              {data.map(d => <Cell key={d.cluster} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Cluster profile cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 14 }}>
        {data.map(c => (
          <Card key={c.cluster} style={{ borderTop: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{c.name}</p>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Cluster {c.cluster} · {c.count} customers</p>
              </div>
              <span style={{ background: c.color + '22', color: c.color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                C{c.cluster}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Income', `$${c.Income?.toLocaleString()}`],
                ['Spending', `$${c.Total_Spending?.toLocaleString()}`],
                ['Age', `${c.Age?.toFixed(1)} yrs`],
                ['Recency', `${c.Recency?.toFixed(0)} days`],
                ['Web Visits', `${c.NumWebVisitsMonth?.toFixed(1)}/mo`],
                ['Children', c.Total_Children?.toFixed(2)],
                ['Response', `${(c.Response * 100).toFixed(1)}%`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
