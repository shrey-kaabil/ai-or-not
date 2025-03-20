import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Lobby from './pages/Lobby';
import Match from './pages/Match';
import Results from './pages/Results';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/match/:matchId" element={<Match />} />
          <Route path="/results/:matchId" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
