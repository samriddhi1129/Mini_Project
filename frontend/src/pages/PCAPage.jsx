import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PageHeader, Card, CardTitle, Spinner, ErrorBox, useFetch } from '../components/shared';

// Individual cluster points rendered as a single BufferGeometry for performance
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

// Auto-rotate scene
function Scene({ pointsByCluster, clusterColors, clusterNames }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={groupRef}>
      {Object.entries(pointsByCluster).map(([cid, pts]) => (
        <ClusterPoints key={cid} points={pts} color={clusterColors[cid]} />
      ))}
      {/* Axis lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-4,0,0, 4,0,0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#374151" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0,-4,0, 0,4,0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#374151" />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0,0,-4, 0,0,4]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#374151" />
      </line>
    </group>
  );
}

export default function PCAPage() {
  const { data, loading, error } = useFetch('/api/pca-scatter');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const { points, variance, cluster_colors, cluster_names } = data;

  // Group points by cluster
  const pointsByCluster = {};
  points.forEach(p => {
    const k = String(p.cluster);
    if (!pointsByCluster[k]) pointsByCluster[k] = [];
    pointsByCluster[k].push(p);
  });

  return (
    <div>
      <PageHeader
        title="3D PCA Scatter Plot"
        subtitle="3-component PCA projection — drag to rotate, scroll to zoom, right-click to pan"
      />

      {/* Variance explained */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {variance.map((v, i) => (
          <div key={i} style={{ background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>PC{i+1} Variance</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: ['#60a5fa','#a78bfa','#34d399'][i] }}>{v}%</p>
          </div>
        ))}
      </div>

      {/* 3D Canvas */}
      <Card style={{ padding: 0, overflow: 'hidden', height: 480, position: 'relative' }}>
        <Canvas
          camera={{ position: [5, 4, 6], fov: 50 }}
          style={{ background: '#0d1017' }}
        >
          <ambientLight intensity={0.5} />
          <Scene
            pointsByCluster={pointsByCluster}
            clusterColors={cluster_colors}
            clusterNames={cluster_names}
          />
          <OrbitControls makeDefault />
        </Canvas>
        {/* Overlay legend */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(13,16,23,0.85)', border: '1px solid #1e2130',
          borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 6
        }}>
          {Object.entries(cluster_names).map(([cid, name]) => (
            <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: cluster_colors[cid], display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#d1d5db' }}>{name}</span>
            </div>
          ))}
        </div>
        {/* Axis labels overlay */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 12 }}>
          {['PC1','PC2','PC3'].map((ax, i) => (
            <span key={ax} style={{ fontSize: 11, color: ['#60a5fa','#a78bfa','#34d399'][i], fontWeight: 600 }}>
              {ax} ({variance[i]}%)
            </span>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 12, color: '#4b5563', marginTop: '0.75rem' }}>
        Showing {points.length} sampled points (of 2,200+). PCA used for both clustering and 3D visualization, matching notebook implementation.
      </p>
    </div>
  );
}
