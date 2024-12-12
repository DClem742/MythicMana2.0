import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserDecks();
  }, []);

  const fetchUserDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('decks')
        .select(`
          *,
          deck_cards (
            card_name,
            quantity
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setDecks(data);
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const deleteDeck = async (deckId) => {
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;
      fetchUserDecks();
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  const toggleDeckVisibility = async (deckId, currentVisibility) => {
    try {
      const { error } = await supabase
        .from('decks')
        .update({ is_public: !currentVisibility })
        .eq('id', deckId);

      if (error) throw error;
      fetchUserDecks();
    } catch (error) {
      console.error('Error updating deck visibility:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Decks</h1>
        <div className="space-x-4">
          <button 
            onClick={() => navigate('/deck-builder')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Deck
          </button>
          <button 
            onClick={() => navigate('/public-decks')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Browse Public Decks
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map(deck => (
          <div key={deck.id} className="border rounded-lg shadow-lg overflow-hidden">
            {deck.commander_image && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={deck.commander_image} 
                  alt={deck.commander}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-xl font-bold text-white">{deck.name}</h3>
                  <p className="text-white/80">Commander: {deck.commander}</p>
                </div>
              </div>
            )}
            
            <div className="p-4">
              <p className="text-gray-600 mb-2">{deck.description}</p>
              <p className="text-sm text-gray-500 mb-4">
                Total Cards: {deck.deck_cards.reduce((sum, card) => sum + card.quantity, 0)}
              </p>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => toggleDeckVisibility(deck.id, deck.is_public)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  {deck.is_public ? 'Make Private' : 'Make Public'}
                </button>
                <button 
                  onClick={() => navigate(`/deck-builder/${deck.id}`)}
                  className="px-3 py-1 text-sm bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteDeck(deck.id)}
                  className="px-3 py-1 text-sm bg-red-100 rounded hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;