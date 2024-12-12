import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DeckBuilder from './pages/DeckBuilder';
import PublicDecks from './pages/PublicDecks';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/deck-builder/:deckId" element={<DeckBuilder />} />
        <Route path="/public-decks" element={<PublicDecks />} />
      </Routes>
    </Router>
  );
}
export default App;