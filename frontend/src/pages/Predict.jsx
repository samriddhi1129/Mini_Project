import React, { useState } from 'react';
import { PageHeader, Card, CardTitle } from '../components/shared';

const FIELDS = [
  { key: 'Income',               label: 'Annual Income ($)',      type: 'number', default: 50000,  min: 0 },
  { key: 'Age',                  label: 'Age (years)',            type: 'number', default: 45,     min: 18, max: 89 },
  { key: 'Total_Spending',       label: 'Total Spending ($)',     type: 'number', default: 500,    min: 0 },
  { key: 'Total_Children',       label: 'Number of Children',     type: 'number', default: 1,      min: 0, max: 5 },
  { key: 'Customer_Tenure_Days', label: 'Customer Tenure (days)', type: 'number', default: 500,    min: 0 },
  { key: 'Recency',              label: 'Days Since Last Purchase',type: 'number', default: 50,    min: 0 },
  { key: 'NumWebVisitsMonth',    label: 'Web Visits / Month',     type: 'number', default: 5,      min: 0 },
  { key: 'NumWebPurchases',      label: 'Web Purchases',          type: 'number', default: 4,      min: 0 },
  { key: 'NumCatalogPurchases',  label: 'Catalog Purchases',      type: 'number', default: 2,      min: 0 },
  { key: 'NumStorePurchases',    label: 'Store Purchases',        type: 'number', default: 5,      min: 0 },
  { key: 'NumDealsPurchases',    label: 'Deal Purchases',         type: 'number', default: 2,      min: 0 },
  { key: 'Response',             label: 'Responded to Campaign (0/1)', type: 'number', default: 0, min: 0, max: 1 },
  { key: 'Complain',             label: 'Complained (0/1)',       type: 'number', default: 0,      min: 0, max: 1 },
];

const inputStyle = {
  width: '100%', background: '#13161f', border: '1px solid #374151',
  borderRadius: 8, padding: '0.55rem 0.75rem', color: '#e2e8f0',
  fontSize: 14, outline: 'none', appearance: 'none'
};

const selectStyle = { ...inputStyle };

export default function Predict() {
  const defaults = { Education: 'Graduate', Living_With: 'Alone' };
  FIELDS.forEach(f => { defaults[f.key] = f.default; });

  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch('https://mini-project-ve29.onrender.com/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="Predict Customer Segment"
        subtitle="Enter customer details — KMeans model predicts the most likely cluster"
      />

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Form */}
        <Card>
          <CardTitle>Customer Details</CardTitle>

          {/* Education & Living_With selects */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Education</label>
              <select style={selectStyle} value={form.Education} onChange={e => handleChange('Education', e.target.value)}>
                <option value="Graduate">Graduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Undergraduate">Undergraduate</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Living With</label>
              <select style={selectStyle} value={form.Living_With} onChange={e => handleChange('Living_With', e.target.value)}>
                <option value="Alone">Alone</option>
                <option value="Partner">Partner</option>
              </select>
            </div>
          </div>

          {/* Numeric fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form[f.key]}
                  min={f.min}
                  max={f.max}
                  onChange={e => handleChange(f.key, parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: 8, border: 'none',
              background: loading ? '#374151' : '#3b82f6', color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s'
            }}
          >
            {loading ? 'Predicting...' : 'Predict Segment →'}
          </button>

          {error && (
            <p style={{ fontSize: 13, color: '#f87171', marginTop: '0.75rem', background: '#2d1515', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
              Error: {error}. Make sure Flask is running on port 5000.
            </p>
          )}
        </Card>

        {/* Result */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Cluster result */}
            <div style={{
              background: '#1a1d27', border: `2px solid ${result.color}`,
              borderRadius: 12, padding: '1.5rem', textAlign: 'center'
            }}>
              <p style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Predicted Segment
              </p>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: result.color + '22', border: `3px solid ${result.color}`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: result.color, fontWeight: 700 }}>
                {result.cluster}
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: result.color }}>{result.name}</p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: '0.5rem', lineHeight: 1.5 }}>
                {result.description}
              </p>
            </div>

            {/* Strategy */}
            <Card style={{ borderLeft: `4px solid ${result.color}` }}>
              <CardTitle>Recommended Strategy</CardTitle>
              <p style={{ fontSize: 18, fontWeight: 700, color: result.color, marginBottom: '0.75rem' }}>
                {result.strategy}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.tactics.map((t, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#d1d5db' }}>
                    <span style={{ color: result.color, flexShrink: 0 }}>→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Traits */}
            <Card>
              <CardTitle>Segment Characteristics</CardTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.traits.map(t => (
                  <span key={t} style={{ background: result.color + '22', color: result.color, borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
