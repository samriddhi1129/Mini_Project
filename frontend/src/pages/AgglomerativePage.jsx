import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PageHeader, Card, Spinner, ErrorBox, useFetch } from '../components/shared';

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

export default function AgglomerativePage() {
  const { data, loading, error } = useFetch('https://mini-project-ve29.onrender.com/api/pca-scatter');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={`Failed to load: ${error}`} />;

  const { points, variance, cluster_colors, cluster_names } = data;

  const pointsByCluster = {};
  points.forEach(p => {
    const k = String(p.cluster);
    if (!pointsByCluster[k]) pointsByCluster[k] = [];
    pointsByCluster[k].push(p);
  });

  return (
    <div>
      <PageHeader
        title="Agglomerative Clustering — 3D View"
        subtitle="Ward linkage clustering on PCA features — drag to rotate, scroll to zoom"
      />
  
   {/* 3D Canvas */}
      <Card style={{ padding: 0, overflow: 'hidden', height: 480, position: 'relative' }}>
        <Canvas camera={{ position: [5, 4, 6], fov: 50 }} style={{ background: '#0d1017' }}>
          <ambientLight intensity={0.5} />
          <Scene pointsByCluster={pointsByCluster} clusterColors={cluster_colors} />
          <OrbitControls makeDefault />
        </Canvas>
        {/* Legend */}
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
      </Card>
    </div>
  );
}