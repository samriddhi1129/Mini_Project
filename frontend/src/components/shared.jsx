import React from 'react';

// ── Reusable stat card ──
export function StatCard({ label, value, sub, color = '#60a5fa' }) {
  return (
    <div style={{
      background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 12,
      padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: '#6b7280' }}>{sub}</span>}
    </div>
  );
}

// ── Page header ──
export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 13.5, color: '#6b7280' }}>{subtitle}</p>
      )}
    </div>
  );
}

// ── Card wrapper ──
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 12,
      padding: '1.25rem 1.5rem', ...style
    }}>
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </p>
  );
}

// ── Loading spinner ──
export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#6b7280' }}>
      <span style={{ fontSize: 14 }}>Loading...</span>
    </div>
  );
}

// ── Error box ──
export function ErrorBox({ msg }) {
  return (
    <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: 8, padding: '1rem', color: '#fca5a5', fontSize: 13 }}>
      {msg}
    </div>
  );
}

// ── Custom hook for fetching ──
export function useFetch(url) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('API error'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [url]);

  return { data, loading, error };
}
