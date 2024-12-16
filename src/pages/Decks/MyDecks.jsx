import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function MyDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('decks')
        .select('*, deck_cards(*)')  // Changed from 'decklist' to 'deck_cards'
        .eq('user_id', user.id);

      if (error) throw error;
      setDecks(data);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeckVisibility = async (deckId, currentVisibility) => {
    try {
      const { error } = await supabase
        .from('decks')
        .update({ is_public: !currentVisibility })
        .eq('id', deckId);

      if (error) throw error;
      fetchDecks();
    } catch (error) {
      console.error('Error updating deck visibility:', error);
    }
  };

  const handleDeckClick = (deck) => {
    setSelectedDeck(deck);
  };

  return (
    <>
      {/* Main deck grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">My Decks</h2>
          <Link
            to="/decks/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create New Deck
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {decks.map((deck) => (
              <Link 
                to={`/decks/${deck.id}`}
                key={deck.id} 
                className="relative group"
              >
                <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer">
                  <img
                    src={deck.commander_image}
                    alt={deck.commander}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-200 rounded-lg flex flex-col justify-center items-center opacity-0 group-hover:opacity-100">
                  <h3 className="text-white text-xl font-bold mb-2">{deck.name}</h3>
                  <p className="text-white text-sm">{deck.commander}</p>
                </div>
              </Link>
            ))}
          </div>
      </div>

      {/* Modal Overlay */}
      {selectedDeck && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDeck(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedDeck.name}</h2>
              <button 
                onClick={() => setSelectedDeck(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4">Decklist</h3>
              <div className="space-y-2">
                {selectedDeck.deck_cards?.map((card, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{card.quantity}x {card.name}</span>
                    <span className="text-gray-500">{card.card_type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}export default MyDecks;