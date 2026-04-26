import React, { useState } from 'react';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

function RecommCard({ data: rec }) {
  return (
    <Card style={{ borderTop: `3px solid ${rec.color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <span style={{
            background: rec.color + '22', color: rec.color,
            borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700
          }}>{rec.name}</span>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.5 }}>
            {rec.description}
          </p>
        </div>
      </div>

      {/* Traits */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Segment Traits
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {rec.traits.map(t => (
            <span key={t} style={{
              background: '#13161f', border: '1px solid #1e2130',
              borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#9ca3af'
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div style={{ background: rec.color + '11', border: `1px solid ${rec.color}33`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Recommended Strategy
        </p>
        <p style={{ fontSize: 16, fontWeight: 700, color: rec.color }}>
          {rec.strategy}
        </p>
      </div>

      {/* Tactics */}
      <div>
        <p style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Marketing Tactics
        </p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rec.tactics.map((t, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#d1d5db' }}>
              <span style={{ color: rec.color, flexShrink: 0, marginTop: 1 }}>→</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default function Recommendations() {
  const { data, loading, error } = useFetch('/api/recommendations');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const recs = Object.values(data);

  return (
    <div>
      <PageHeader
        title="Marketing Recommendations"
        subtitle="Segment-specific strategies derived from cluster profiles and handwritten analysis notes"
      />

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, marginBottom: '1.75rem' }}>
        {recs.map(r => (
          <div key={r.name} style={{ background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 10, padding: '1rem', borderLeft: `3px solid ${r.color}` }}>
            <p style={{ fontWeight: 600, fontSize: 13.5, color: '#f1f5f9', marginBottom: 4 }}>{r.name}</p>
            <p style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.strategy}</p>
          </div>
        ))}
      </div>

      {/* Full cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 16 }}>
        {recs.map(r => <RecommCard key={r.name} data={r} />)}
      </div>
    </div>
  );
}
