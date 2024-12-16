import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

function DeckBuilder() {
  const { deckId } = useParams();
  const [deckName, setDeckName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [commander, setCommander] = useState(null);
  const [commanderInput, setCommanderInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [cards, setCards] = useState([]);
  const [cardImages, setCardImages] = useState({});
  const [cardTypes, setCardTypes] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const cardCategories = {
    creatures: cards.filter(card => cardTypes[card.name]?.includes('Creature')),
    instants: cards.filter(card => cardTypes[card.name]?.includes('Instant')),
    sorceries: cards.filter(card => cardTypes[card.name]?.includes('Sorcery')),
    artifacts: cards.filter(card => cardTypes[card.name]?.includes('Artifact')),
    enchantments: cards.filter(card => cardTypes[card.name]?.includes('Enchantment')),
    planeswalkers: cards.filter(card => cardTypes[card.name]?.includes('Planeswalker')),
    battles: cards.filter(card => cardTypes[card.name]?.includes('Battle')),
    lands: cards.filter(card => cardTypes[card.name]?.includes('Land')),
    kindred: cards.filter(card => cardTypes[card.name]?.includes('Kindred'))
  };

  useEffect(() => {
    if (deckId) {
      fetchDeckData();
    }
  }, [deckId]);

  useEffect(() => {
    fetchCardDetails();
  }, [cards]);

  const fetchCardDetails = async () => {
    const newCardImages = { ...cardImages };
    const newCardTypes = { ...cardTypes };
    
    for (const card of cards) {
      if (!cardImages[card.name] || !cardTypes[card.name]) {
        try {
          const response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`
          );
          const data = await response.json();
          if (data.image_uris) {
            newCardImages[card.name] = data.image_uris.normal;
          }
          newCardTypes[card.name] = data.type_line.split('—')[0].trim().split(' ');
        } catch (error) {
          console.error('Error fetching card details:', error);
        }
      }
    }
    
    setCardImages(newCardImages);
    setCardTypes(newCardTypes);
  };

  const searchCard = async (input, isCommanderSearch = false) => {
    if (input.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const query = isCommanderSearch 
        ? `"${input}" (t:legendary t:creature)` 
        : `"${input}"`;
      
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
      setSearchResults([]);
    }
  };

  const processBulkInput = async () => {
    const lines = bulkInput.split('\n');
    const cardList = lines.map(line => {
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      return match ? { name: match[2].trim(), quantity: parseInt(match[1]) } : null;
    }).filter(Boolean);

    setCards([...cards, ...cardList]);
    setBulkInput('');
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
      if (deck.commander) {
        setCommander({
          name: deck.commander,
          image: deck.commander_image
        });
      }
      setCards(cards.map(card => ({
        name: card.card_name,
        quantity: card.quantity
      })));
    } catch (error) {
      console.error('Error fetching deck:', error);
    }
  };

  const removeCard = (cardName) => {
    setCards(cards.filter(card => card.name !== cardName));
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

  const CardSection = ({ title, cards }) => (
    cards.length > 0 && (
      <div className="mb-8">
        <h4 className="text-xl font-semibold mb-4">
          {title} ({cards.reduce((sum, card) => sum + card.quantity, 0)})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map((card) => (
            <div key={card.name} className="relative group">
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
                    onClick={() => removeCard(card.name)}
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
    )
  );

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
        
        <label className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>Make Deck Public</span>
        </label>
      </div>
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">Command Zone</span>
          {commander && (
            <span className="text-sm font-normal text-green-600">
              ✓ Commander Selected
            </span>
          )}
        </h3>
        
        <div className="flex gap-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search for your commander..."
              value={commanderInput}
              onChange={(e) => {
                setCommanderInput(e.target.value);
                searchCard(e.target.value, true);
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg shadow-lg bg-white">
                {searchResults.map((card) => (
                  <div
                    key={card.name}
                    onClick={() => {
                      setCommander(card);
                      setCommanderInput('');
                      setSearchResults([]);
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <img 
                      src={card.image} 
                      alt={card.name} 
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span>{card.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {commander && (
            <div className="w-48">
              <img 
                src={commander.image}
                alt={commander.name}
                className="w-full rounded-lg shadow-lg"
              />
              <p className="mt-2 text-center font-medium">{commander.name}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Bulk Add Cards</h3>
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

      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-6">Deck Contents</h3>
        
        <CardSection title="Creatures" cards={cardCategories.creatures} />
        <CardSection title="Instants" cards={cardCategories.instants} />
        <CardSection title="Sorceries" cards={cardCategories.sorceries} />
        <CardSection title="Artifacts" cards={cardCategories.artifacts} />
        <CardSection title="Enchantments" cards={cardCategories.enchantments} />
        <CardSection title="Planeswalkers" cards={cardCategories.planeswalkers} />
        <CardSection title="Battles" cards={cardCategories.battles} />
        <CardSection title="Lands" cards={cardCategories.lands} />
        <CardSection title="Kindred" cards={cardCategories.kindred} />
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
