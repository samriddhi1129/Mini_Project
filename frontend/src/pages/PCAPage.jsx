import React from 'react';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

const FEATURE_LABELS = {
  Income:              'Income',
  Total_Spending:      'Total Spending',
  Age:                 'Age',
  Total_Children:      'Children',
  NumWebVisitsMonth:   'Web Visits/Month',
  Recency:             'Recency (days)',
  NumStorePurchases:   'Store Purchases',
  NumCatalogPurchases: 'Catalog Purchases',
  NumWebPurchases:     'Web Purchases',
  NumDealsPurchases:   'Deal Purchases',
};

const PC_META = [
  {
    key: 'pc1', label: 'PC1', color: '#60a5fa',
    title: ' Purchasing Power',
    explanation:"This axis represents a customer's income and spending behavior. Customers with higher PC1 scores generally have higher incomes and spend more on shopping." ,
    topFeatures: ['Income', 'Total_Spending', 'NumStorePurchases', 'NumCatalogPurchases'],
  },
  {
    key: 'pc2', label: 'PC2', color: '#a78bfa',
    title: ' Family & Life Stage',
    explanation: "This axis represents a customer's family profile, including factors such as the number of children, marital status (with a partner or living alone), and age.",
    topFeatures: ['Age', 'Total_Children', 'NumWebVisitsMonth'],
  },
  {
    key: 'pc3', label: 'PC3', color: '#34d399',
    title: ' Shopping Behaviour',
    explanation: "This axis reflects a customer's shopping behavior, such as whether they look for deals, spend more time browsing online, or have been recently active.",
    topFeatures: ['NumDealsPurchases', 'Total_Children', 'NumWebVisitsMonth', 'NumWebPurchases'],
  },
];

function WeightBar({ value }) {
  const abs = Math.abs(value);
  const max = 0.5;
  const pct = Math.min((abs / max) * 100, 100);
  // Importance ke hisaab se color — high importance = bright, low = dim
  const color = abs > 0.3 ? '#34d399' : abs > 0.15 ? '#60a5fa' : '#6b7280';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, background: '#1e2130', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 50 }}>
        {abs.toFixed(3)}
      </span>
    </div>
  );
}

export default function PCAPage() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/pca-analysis');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const { features, pc1, pc2, pc3, variance, total_variance } = data;

  const pcData = { pc1, pc2, pc3 };

  return (
    <div>
      <PageHeader
        title="PCA Analysis"
        subtitle="Principal Component Analysis — all customer features compressed into 3 key patterns"
      />

      {/* Variance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.75rem' }}>
        {variance.map((v, i) => (
          <div key={i} style={{ background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 6 }}>PC{i+1} Variance</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: ['#60a5fa','#a78bfa','#34d399'][i] }}>{v}%</p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>of total data explained</p>
          </div>
        ))}
        <div style={{ background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 6 }}>Total Variance</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{total_variance}%</p>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>captured in 3 components</p>
        </div>
      </div>

      {/* Simple explanation */}
      <Card style={{ marginBottom: '1.5rem', borderLeft: '3px solid #60a5fa' }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
         In our dataset, PCA compressed 10+ features into 3 principal components, which together explain 44.95% of the data's variation, making analysis and visualization easier.
          <span style={{ color: '#f59e0b', fontWeight: 600 }}> 3 main patterns</span> mein compress kar diya,
          jo milke data ka <span style={{ color: '#34d399', fontWeight: 600 }}>{total_variance}%</span> explain karte hain.
        </p>
      </Card>

      {/* PC Cards with explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: '1.75rem' }}>
        {PC_META.map((pc) => (
          <Card key={pc.key} style={{ borderTop: `3px solid ${pc.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: pc.color }}>{pc.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{pc.title}</span>
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 10 }}>
              {pc.explanation}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pc.topFeatures.map(f => (
                <span key={f} style={{ background: pc.color + '22', color: pc.color, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                  {FEATURE_LABELS[f] || f}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Feature Weights Table */}
      <Card>
        <CardTitle>Feature Weights </CardTitle>
       
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2130' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#cbd5e1', fontWeight: 600 }}>Feature</th>
                {PC_META.map(pc => (
                  <th key={pc.key} style={{ textAlign: 'left', padding: '8px 12px', color: pc.color, fontWeight: 700 }}>
                    {pc.label} — {pc.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f} style={{ borderBottom: '1px solid #1e213055', background: i % 2 === 0 ? '#13161f' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 600 }}>
                    {FEATURE_LABELS[f] || f}
                  </td>
                  {['pc1','pc2','pc3'].map(pk => (
                    <td key={pk} style={{ padding: '10px 12px' }}>
                      <WeightBar value={pcData[pk][i]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}