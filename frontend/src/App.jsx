import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Overview from './pages/Overview';
import Clusters from './pages/Clusters';
import PCAPage from './pages/PCAPage';
import ElbowPage from './pages/ElbowPage';
import ModelComparison from './pages/ModelComparison';
import Recommendations from './pages/Recommendations';
import Predict from './pages/Predict';
import './styles.css'; // 

const NAV = [
  { path: '/', label: 'Overview', icon: '◈' },
  { path: '/clusters', label: 'Clusters', icon: '⬡' },
  { path: '/pca', label: '3D PCA', icon: '◉' },
  { path: '/elbow', label: 'Elbow Method', icon: '〜' },
  { path: '/compare', label: 'Model Comparison', icon: '⊞' },
  { path: '/recommendations', label: 'Recommendations', icon: '★' },
  { path: '/predict', label: 'Predict Segment', icon: '→' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            SmartCart
            <span className="logoSub">Customer Segmentation</span>
          </div>

          <nav className="nav">
            {NAV.map(({ path, label, icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  isActive ? 'navLink active' : 'navLink'
                }
              >
                <span className="icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/clusters" element={<Clusters />} />
            <Route path="/pca" element={<PCAPage />} />
            <Route path="/elbow" element={<ElbowPage />} />
            <Route path="/compare" element={<ModelComparison />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/predict" element={<Predict />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}