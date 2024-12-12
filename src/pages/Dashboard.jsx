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
    <div>
      <h1>My Decks</h1>
      
      <button onClick={() => navigate('/deck-builder')}>
        Create New Deck
      </button>
      
      <button onClick={() => navigate('/public-decks')}>
        Browse Public Decks
      </button>

      <div>
        {decks.map(deck => (
          <div key={deck.id}>
            <h3>{deck.name}</h3>
            <p>{deck.description}</p>
            
            <div>
              Total Cards: {deck.deck_cards.reduce((sum, card) => sum + card.quantity, 0)}
            </div>

            <button onClick={() => toggleDeckVisibility(deck.id, deck.is_public)}>
              {deck.is_public ? 'Make Private' : 'Make Public'}
            </button>

            <button onClick={() => navigate(`/deck-builder/${deck.id}`)}>
              Edit
            </button>

            <button onClick={() => deleteDeck(deck.id)}>
              Delete
            </button>

            <div>
              <h4>Cards:</h4>
              {deck.deck_cards.map((card, index) => (
                <div key={index}>
                  {card.quantity}x {card.card_name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
