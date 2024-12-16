import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

function Collection() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardImages, setCardImages] = useState({});
  const [filters, setFilters] = useState({
    set: '',
    color: '',
    type: ''
  });
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    fetchCollection();
  }, []);

  useEffect(() => {
    fetchCardDetails();
  }, [collection]);

  const fetchCollection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('user_collection')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCollection(data);
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCardDetails = async () => {
    const newCardImages = { ...cardImages };
    
    for (const card of collection) {
      if (!cardImages[card.card_name]) {
        try {
          const response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.card_name)}`
          );
          const data = await response.json();
          if (data.image_uris) {
            newCardImages[card.card_name] = data.image_uris.normal;
          }
        } catch (error) {
          console.error('Error fetching card details:', error);
        }
      }
    }
    
    setCardImages(newCardImages);
  };

  const processBulkInput = async () => {
    const lines = bulkInput.split('\n');
    const cardList = lines.map(line => {
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      return match ? { card_name: match[2].trim(), quantity: parseInt(match[1]) } : null;
    }).filter(Boolean);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const cardsToInsert = cardList.map(card => ({
        user_id: user.id,
        card_name: card.card_name,
        quantity: card.quantity
      }));

      const { error } = await supabase
        .from('user_collection')
        .insert(cardsToInsert);

      if (error) throw error;
      
      fetchCollection();
      setBulkInput('');
    } catch (error) {
      console.error('Error adding cards:', error);
    }
  };

  const removeCard = async (cardName) => {
    try {
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('card_name', cardName);

      if (error) throw error;
      
      setCollection(collection.filter(card => card.card_name !== cardName));
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">My Collection</h2>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Add Cards</h3>
        <textarea
          placeholder="Enter cards (format: '1x Card Name' or '1 Card Name')"
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          className="w-full h-48 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button 
          onClick={processBulkInput}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Cards
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {collection.map((card) => (
            <div key={card.card_name} className="relative group">
              {cardImages[card.card_name] && (
                <>
                  <img 
                    src={cardImages[card.card_name]} 
                    alt={card.card_name}
                    className="w-full rounded-lg shadow-lg transition-all duration-200 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {card.quantity}x
                  </span>
                  <button 
                    onClick={() => removeCard(card.card_name)}
                    className="absolute top-2 right-2 bg-red-500/70 text-white w-6 h-6 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Collection;
