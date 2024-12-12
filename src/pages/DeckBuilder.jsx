import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

function DeckBuilder() {
  const { deckId } = useParams();
  const [deckName, setDeckName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [commander, setCommander] = useState(null);
  const [commanderInput, setCommanderInput] = useState('');
  const [cardInput, setCardInput] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cards, setCards] = useState([]);
  const [cardImages, setCardImages] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (deckId) {
      fetchDeckData();
    }
  }, [deckId]);

  useEffect(() => {
    fetchCardImages();
  }, [cards]);

  const fetchCardImages = async () => {
    const newCardImages = { ...cardImages };
    for (const card of cards) {
      if (!newCardImages[card.name]) {
        try {
          const response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`
          );
          const data = await response.json();
          if (data.image_uris) {
            newCardImages[card.name] = data.image_uris.normal;
          }
        } catch (error) {
          console.error('Error fetching card image:', error);
        }
      }
    }
    setCardImages(newCardImages);
  };

  const searchCard = async (input, isCommanderSearch = false) => {
    if (input.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const query = isCommanderSearch 
        ? `${input}+t:legendary+t:creature` 
        : input;
      
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      const results = data.data?.map(card => ({
        name: card.name,
        image: card.image_uris?.normal || (card.card_faces && card.card_faces[0].image_uris.normal)
      })).filter(card => card.image) || [];
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching cards:', error);
    }
  };
  const fetchDeckData = async () => {
    try {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;

      const { data: cards, error: cardsError } = await supabase
        .from('deck_cards')
        .select('*')
        .eq('deck_id', deckId);

      if (cardsError) throw cardsError;

      setDeckName(deck.name);
      setDescription(deck.description || '');
      setIsPublic(deck.is_public);
      setCommander({
        name: deck.commander,
        image: deck.commander_image
      });
      setCards(cards.map(card => ({
        name: card.card_name,
        quantity: card.quantity
      })));
    } catch (error) {
      console.error('Error fetching deck:', error);
    }
  };

  const addCard = () => {
    if (cardInput.trim()) {
      setCards([...cards, { name: cardInput.trim(), quantity }]);
      setCardInput('');
      setQuantity(1);
    }
  };

  const removeCard = (index) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
  };

  const saveDeck = async () => {
    if (!commander) {
      alert('Please select a commander for your deck');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (deckId) {
        const { error: deckError } = await supabase
          .from('decks')
          .update({
            name: deckName,
            description,
            is_public: isPublic,
            commander: commander.name,
            commander_image: commander.image
          })
          .eq('id', deckId);

        if (deckError) throw deckError;

        await supabase
          .from('deck_cards')
          .delete()
          .eq('deck_id', deckId);

        const cardsToInsert = cards.map(card => ({
          deck_id: deckId,
          card_name: card.name,
          quantity: card.quantity
        }));

        const { error: cardsError } = await supabase
          .from('deck_cards')
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      } else {
        const { data: deck, error: deckError } = await supabase
          .from('decks')
          .insert([{
            name: deckName,
            description,
            is_public: isPublic,
            user_id: user.id,
            commander: commander.name,
            commander_image: commander.image
          }])
          .select()
          .single();

        if (deckError) throw deckError;

        const cardsToInsert = cards.map(card => ({
          deck_id: deck.id,
          card_name: card.name,
          quantity: card.quantity
        }));

        const { error: cardsError } = await supabase
          .from('deck_cards')
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving deck:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">{deckId ? 'Edit Deck' : 'Create New Deck'}</h2>
      
      <div className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Deck Name"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <textarea
          placeholder="Deck Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>Make Deck Public</span>
        </label>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Choose Your Commander</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search for a legendary creature..."
            value={commanderInput}
            onChange={(e) => {
              setCommanderInput(e.target.value);
              searchCard(e.target.value, true);
            }}
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {commander && (
          <div className="mt-4 max-w-xs">
            <img 
              src={commander.image}
              alt={commander.name}
              className="w-full rounded-lg shadow-lg"
            />
            <p className="mt-2 text-center font-bold">{commander.name}</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg shadow-lg">
            {searchResults.map((card) => (
              <div
                key={card.name}
                onClick={() => {
                  setCommander(card);
                  setCommanderInput('');
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {card.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Card Name"
            value={cardInput}
            onChange={(e) => {
              setCardInput(e.target.value);
              searchCard(e.target.value);
            }}
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <button 
            onClick={addCard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Card
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4">Cards in Deck</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map((card, index) => (
            <div key={index} className="relative group sticky top-4">
              {cardImages[card.name] && (
                <>
                  <img 
                    src={cardImages[card.name]} 
                    alt={card.name}
                    className="w-full rounded-lg shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg"/>
                  <span className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {card.quantity}x
                  </span>
                  <button 
                    onClick={() => removeCard(index)}
                    className="absolute top-2 right-2 bg-red-500/70 text-white w-6 h-6 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={saveDeck}
        className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Save Deck
      </button>
    </div>
  );
}

export default DeckBuilder;