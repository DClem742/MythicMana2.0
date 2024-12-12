import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function PublicDecks() {
  const [publicDecks, setPublicDecks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicDecks();
  }, []);

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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Public Decks</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <input
        type="text"
        placeholder="Search decks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map(deck => (
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
              <p className="text-sm text-gray-500">Created by: {deck.creator_email}</p>
              <p className="text-sm text-gray-500 mb-4">
                Total Cards: {deck.deck_cards?.reduce((sum, card) => sum + card.quantity, 0) || 0}
              </p>

              <div className="mt-4">
                <h4 className="font-bold mb-2">Cards:</h4>
                <div className="max-h-48 overflow-y-auto">
                  {deck.deck_cards?.map((card, index) => (
                    <div key={index} className="flex items-center py-1">
                      <span className="text-sm">
                        {card.quantity}x {card.card_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PublicDecks;