import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function CardLink({ card }) {
  const [showHover, setShowHover] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX + 20,
      y: e.clientY - 100
    });
  };

  const handleCardClick = async (e) => {
    e.stopPropagation();
    if (showModal) {
      setShowModal(false);
      setCardDetails(null);
    } else {
      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.card_name)}`
        );
        const data = await response.json();
        setCardDetails(data);
        setShowModal(true);
      } catch (error) {
        console.error('Error fetching card details:', error);
      }
    }
  };

  return (
    <div 
      className="relative cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
      onClick={handleCardClick}
    >
      <span className="hover:text-blue-600">{card.quantity}x {card.card_name}</span>
      
      {/* Hover Preview */}
      {showHover && (
        <div 
          className="fixed z-50 shadow-xl rounded-lg"
          style={{ left: position.x, top: position.y }}
        >
          <img
            src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.card_name)}&format=image&version=small`}
            alt={card.card_name}
            className="rounded-lg w-32"
          />
        </div>
      )}

      {/* Click Modal */}
      {showModal && cardDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={() => setShowModal(false)}
        >
          <div className="bg-white p-6 rounded-lg max-w-2xl">
            <div className="flex gap-6">
              <img
                src={cardDetails.image_uris?.normal}
                alt={cardDetails.name}
                className="w-48 rounded-lg"
              />
              <div>
                <h3 className="text-xl font-bold">{cardDetails.name}</h3>
                <p className="text-gray-600">{cardDetails.mana_cost}</p>
                <p className="mt-2">{cardDetails.type_line}</p>
                <p className="mt-4">{cardDetails.oracle_text}</p>
                {cardDetails.power && (
                  <p className="mt-2">Power/Toughness: {cardDetails.power}/{cardDetails.toughness}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}function DeckDetails() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkInput, setBulkInput] = useState('');
  const [cardTypes, setCardTypes] = useState({});

  useEffect(() => {
    fetchDeckDetails();
  }, [id]);

  const fetchDeckDetails = async () => {
    const { data, error } = await supabase
      .from('decks')
      .select('*, deck_cards(*)')
      .eq('id', id)
      .single();

    if (!error) {
      setDeck(data);
      fetchCardTypes(data.deck_cards);
    }
    setLoading(false);
  };

  const fetchCardTypes = async (cards) => {
    const types = {};
    for (const card of cards) {
      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.card_name)}`
        );
        const data = await response.json();
        types[card.card_name] = data.type_line.split('—')[0].trim().split(' ');
      } catch (error) {
        console.error('Error fetching card type:', error);
      }
    }
    setCardTypes(types);
  };

  const cardCategories = deck?.deck_cards ? {
    creatures: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Creature')),
    instants: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Instant')),
    sorceries: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Sorcery')),
    artifacts: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Artifact')),
    enchantments: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Enchantment')),
    planeswalkers: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Planeswalker')),
    lands: deck.deck_cards.filter(card => cardTypes[card.card_name]?.includes('Land')),
  } : {};

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

      if (!error) {
        fetchDeckDetails();
        setBulkInput('');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex gap-8">
        {/* Commander Section */}
        <div className="w-1/3">
          <img 
            src={deck.commander_image} 
            alt={deck.commander}
            className="w-full rounded-lg shadow-lg"
          />
          <h1 className="text-2xl font-bold mt-4">{deck.name}</h1>
          <p className="text-gray-600">{deck.commander}</p>
          
          <div className="mt-4">
            <textarea
              placeholder="Enter cards (format: '1x Card Name' or '1 Card Name')"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full h-32 p-2 border rounded-lg"
            />
            <button 
              onClick={processBulkInput}
              className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Cards
            </button>
            <button
              onClick={deleteEntireDecklist}
              className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Delete Entire Decklist
            </button>
          </div>
        </div>

        {/* Decklist Section */}
        <div className="w-2/3">
          <div className="space-y-6">
            {Object.entries(cardCategories).map(([category, cards]) => (
              cards?.length > 0 && (
                <div key={category}>
                  <h3 className="text-xl font-bold capitalize mb-2">
                    {category} ({cards.reduce((sum, card) => sum + card.quantity, 0)})
                  </h3>
                  <div className="space-y-1">
                    {cards.map(card => (
                      <div key={card.id} className="flex justify-between hover:bg-gray-100 p-2 rounded">
                        <CardLink card={card} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeckDetails;
