import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth/AuthPage';
import MyDecks from './pages/Decks/MyDecks';
import PublicDecks from './pages/Decks/PublicDecks';
import DeckBuilder from './pages/Decks/DeckBuilder';
import Collection from './pages/Collection/Collection';
import DeckDetails from './pages/Decks/DeckDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/decks" element={<MyDecks />} />
          <Route path="/decks/public" element={<PublicDecks />} />
          <Route path="/decks/new" element={<DeckBuilder />} />
          <Route path="/decks/edit/:deckId" element={<DeckBuilder />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/decks/:id" element={<DeckDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;