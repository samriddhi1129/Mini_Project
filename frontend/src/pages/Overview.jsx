import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StatCard, PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

export default function Overview() {
  const { data, loading, error } = useFetch('/api/overview');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}. Is Flask running on port 5000?`} />;

  const { total_customers, avg_income, avg_spending, avg_age, segments } = data;

  return (
    <div>
      <PageHeader
        title="SmartCart Overview"
        subtitle="Customer segmentation dashboard — 4 clusters via Agglomerative Clustering on PCA features"
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: '1.75rem' }}>
        <StatCard label="Total Customers" value={total_customers.toLocaleString()} color="#60a5fa" />
        <StatCard label="Avg Income" value={`$${avg_income?.toLocaleString()}`} color="#34d399" />
        <StatCard label="Avg Spending" value={`$${avg_spending?.toLocaleString()}`} color="#a78bfa" />
        <StatCard label="Avg Age" value={`${Math.round(avg_age)} yrs`} color="#f59e0b" />
        <StatCard label="Clusters" value={data.n_clusters} color="#f87171" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pie chart */}
        <Card>
          <CardTitle>Segment Distribution</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={segments} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, pct }) => `${pct}%`}>
                {segments.map((s) => (
                  <Cell key={s.cluster} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n, p) => [`${v} customers (${p.payload.pct}%)`, p.payload.name]}
                contentStyle={{ background: '#1a1d27', border: '1px solid #374151', borderRadius: 8, color: '#e2e8f0' }}
              />
              <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 13 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Segment cards */}
        <Card>
          <CardTitle>Cluster Breakdown</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {segments.map((s) => (
              <div key={s.cluster} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#13161f', borderRadius: 8, padding: '0.75rem 1rem',
                borderLeft: `3px solid ${s.color}`
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{s.name}</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{s.count} customers</p>
                </div>
                <div style={{
                  background: s.color + '22', color: s.color,
                  borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 700
                }}>
                  {s.pct}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
