import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function PublicDecks() {
  const [publicDecks, setPublicDecks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cardImages, setCardImages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicDecks();
  }, []);

  useEffect(() => {
    fetchCardImages();
  }, [publicDecks]);

  const fetchCardImages = async () => {
    const allCards = publicDecks.flatMap(deck => 
      deck.deck_cards.map(card => card.card_name)
    );
    
    const uniqueCards = [...new Set(allCards)];
    
    const newCardImages = {};
    for (const cardName of uniqueCards) {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
      );
      const data = await response.json();
      if (data.image_uris) {
        newCardImages[cardName] = data.image_uris.normal;
      }
    }
    
    setCardImages(newCardImages);
  };

  const fetchPublicDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('public_decks_with_users')
        .select('*');

      if (error) throw error;
      setPublicDecks(data);
    } catch (error) {
      console.error('Error fetching public decks:', error);
    }
  };

  const filteredDecks = publicDecks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h1>Public Decks</h1>
      
      <button onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>

      <input
        type="text"
        placeholder="Search decks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div>
        {filteredDecks.map(deck => (
          <div key={deck.id}>
            <h3>{deck.name}</h3>
            <p>{deck.description}</p>
            <p>Created by: {deck.creator_email}</p>
            
            <div>
              Total Cards: {deck.deck_cards?.reduce((sum, card) => sum + card.quantity, 0) || 0}
            </div>

            <div>
              <h4>Cards:</h4>
              {deck.deck_cards?.map((card, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  {cardImages[card.card_name] && (
                    <img 
                      src={cardImages[card.card_name]} 
                      alt={card.card_name}
                      style={{ width: '100px', height: 'auto' }}
                    />
                  )}
                  <span>{card.quantity}x {card.card_name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PublicDecks;