import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

const MODEL_COLORS = { KMeans: '#60a5fa', Agglomerative: '#a78bfa', DBSCAN: '#f87171' };
const MODEL_ICONS  = { KMeans: '◈', Agglomerative: '⬡', DBSCAN: '◎' };

function ClusterPoints({ points, color }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      positions[i * 3]     = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [points]);
  return (
    <points geometry={geo}>
      <pointsMaterial color={color} size={0.12} sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

function Scene({ pointsByCluster, clusterColors }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15;
  });
  return (
    <group ref={groupRef}>
      {Object.entries(pointsByCluster).map(([cid, pts]) => (
        <ClusterPoints key={cid} points={pts} color={clusterColors[cid]} />
      ))}
      {[[-4,0,0,4,0,0],[0,-4,0,0,4,0],[0,0,-4,0,0,4]].map((coords, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(coords), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#374151" />
        </line>
      ))}
    </group>
  );
}

function Graph3D({ data, title, silhouette, isBest }) {
  const { points, cluster_colors, cluster_names } = data;
  const pointsByCluster = {};
  points.forEach(p => {
    const k = String(p.cluster);
    if (!pointsByCluster[k]) pointsByCluster[k] = [];
    pointsByCluster[k].push(p);
  });
  return (
    <Card style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e2130', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{title}</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Silhouette Score: <span style={{ color: isBest ? '#a78bfa' : '#60a5fa', fontWeight: 700 }}>{silhouette}</span></p>
        </div>
        {isBest && (
          <span style={{ background: '#a78bfa22', color: '#a78bfa', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>✓ BETTER VISUALLY</span>
        )}
      </div>
      {/* 3D Canvas */}
      <div style={{ height: 320, position: 'relative' }}>
        <Canvas camera={{ position: [5, 4, 6], fov: 50 }} style={{ background: '#0d1017' }}>
          <ambientLight intensity={0.5} />
          <Scene pointsByCluster={pointsByCluster} clusterColors={cluster_colors} />
          <OrbitControls makeDefault />
        </Canvas>
        {/* Legend */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(13,16,23,0.85)', border: '1px solid #1e2130',
          borderRadius: 8, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 5
        }}>
          {Object.entries(cluster_names).map(([cid, name]) => (
            <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cluster_colors[cid], display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#d1d5db' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function ModelComparison() {
  const { data: compareData, loading: l1, error: e1 } = useFetch('https://mini-project-ve29.onrender.com/api/compare-models');
  const { data: aggData,     loading: l2, error: e2 } = useFetch('https://mini-project-ve29.onrender.com/api/pca-scatter');
  const { data: kmData,      loading: l3, error: e3 } = useFetch('https://mini-project-ve29.onrender.com/api/kmeans-scatter');

  if (l1 || l2 || l3) return <Spinner />;
  if (e1 || e2 || e3) return <ErrorBox msg="Failed to load comparison data." />;

  return (
    <div>
      <PageHeader
        title="Algorithm Comparison"
        subtitle="KMeans vs Agglomerative Clustering vs DBSCAN — evaluated on PCA-reduced features"
      />

      {/* Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: '1.75rem' }}>
        {compareData.map(m => {
          const color = MODEL_COLORS[m.model];
          const isBest = m.model === 'Agglomerative';
          const isWorst = m.model === 'DBSCAN';
          return (
            <div key={m.model} style={{
              background: '#1a1d27', border: `1px solid ${color}44`,
              borderTop: `3px solid ${color}`, borderRadius: 12, padding: '1.25rem', position: 'relative'
            }}>
              {isBest && <span style={{ position: 'absolute', top: 12, right: 12, background: '#a78bfa22', color: '#a78bfa', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>✓ BEST</span>}
              {isWorst && <span style={{ position: 'absolute', top: 12, right: 12, background: '#f8717122', color: '#f87171', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>✗ NOT SUITABLE</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20, color }}>{MODEL_ICONS[m.model]}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{m.model}</span>
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 4 }}>Silhouette Score</p>
              <p style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 8 }}>{m.silhouette !== null ? m.silhouette : '—'}</p>
              <div style={{ background: '#1e2130', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${Math.max(0, m.silhouette ?? 0) / 0.5 * 100}%`, background: color, height: '100%', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>
                <span>Clusters: <strong style={{ color: '#e2e8f0' }}>{m.clusters}</strong></span>
                {m.noise_pct > 0 && <span style={{ marginLeft: 12 }}>Noise: <strong style={{ color: '#f87171' }}>{m.noise_pct}%</strong></span>}
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{m.notes}</p>
            </div>
          );
        })}
      </div>

      {/* Side by side 3D graphs */}
      <p style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>
        Visual Comparison — Drag to rotate, scroll to zoom
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.75rem' }}>
        <Graph3D
          data={aggData}
          title="Agglomerative Clustering"
          silhouette={compareData.find(m => m.model === 'Agglomerative')?.silhouette}
          isBest={true}
        />
        <Graph3D
          data={kmData}
          title="KMeans Clustering"
          silhouette={compareData.find(m => m.model === 'KMeans')?.silhouette}
          isBest={false}
        />
      </div>

      {/* Note */}
      <Card style={{ borderLeft: '3px solid #f59e0b' }}>
        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>📌 Note: </span>
          Agglomerative clustering produces <span style={{ color: '#a78bfa', fontWeight: 600 }}>visually better separated clusters</span> in 3D PCA space despite a marginally lower silhouette score. This is why it was chosen for cluster characterization in this project.
        </p>
      </Card>
    </div>
  );
}