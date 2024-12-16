import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function DeckDetails() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    fetchDeckDetails();
  }, [id]);

  const fetchDeckDetails = async () => {
    const { data, error } = await supabase
      .from('decks')
      .select('*, deck_cards(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching deck:', error);
    } else {
      setDeck(data);
    }
    setLoading(false);
  };

  const deleteCard = async (cardId) => {
    const { error } = await supabase
      .from('deck_cards')
      .delete()
      .eq('id', cardId);

    if (!error) {
      fetchDeckDetails();
    }
  };

  const deleteEntireDecklist = async () => {
    const { error } = await supabase
      .from('deck_cards')
      .delete()
      .eq('deck_id', id);

    if (!error) {
      fetchDeckDetails();
    }
  };

  const processBulkInput = async () => {
    const lines = bulkInput.split('\n');
    const cardList = lines.map(line => {
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      return match ? {
        deck_id: id,
        card_name: match[2].trim(),
        quantity: parseInt(match[1])
      } : null;
    }).filter(Boolean);

    if (cardList.length > 0) {
      const { error } = await supabase
        .from('deck_cards')
        .insert(cardList);

      if (error) {
        console.log('Supabase error:', error);
      } else {
        fetchDeckDetails();
        setBulkInput('');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Commander Section */}
        <div className="md:col-span-1">
          <img 
            src={deck.commander_image} 
            alt={deck.commander}
            className="w-full rounded-lg shadow-lg"
          />
          <h1 className="text-3xl font-bold mt-4">{deck.name}</h1>
          <p className="text-xl text-gray-600">{deck.commander}</p>
          <button
            onClick={deleteEntireDecklist}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete Entire Decklist
          </button>
        </div>

        {/* Card Addition Section */}
        <div className="md:col-span-2">
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

          {/* Decklist Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Decklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deck.deck_cards.map((card) => (
                <div 
                  key={card.id} 
                  className="relative group cursor-pointer"
                >
                  <div className="flex justify-between py-1">
                    <span>{card.quantity}x {card.card_name}</span>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeckDetails;