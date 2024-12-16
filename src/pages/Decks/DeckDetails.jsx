import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = {
  W: '#F8E7B9',
  U: '#2B9AD6',
  B: '#382B3F',
  R: '#E24D4B',
  G: '#427A5B',
  Multi: '#DEB974',
  Colorless: '#9DA5AD'
};

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
    <div className="flex justify-between hover:bg-gray-100 p-2 rounded">
      <span 
        className="cursor-pointer hover:text-blue-600"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
        onClick={handleCardClick}
      >
        {card.quantity}x {card.card_name}
      </span>

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
}

const calculateManaCurve = (cards, cardDetails) => {
  const curve = Array(8).fill(0);
  
  cards.forEach(card => {
    const cmc = cardDetails[card.card_name]?.cmc || 0;
    const index = Math.min(cmc, 7);
    curve[index] += card.quantity;
  });

  return Array(8).fill().map((_, i) => ({
    cmc: i === 7 ? '7+' : i,
    count: curve[i]
  }));
};

const calculateAverageMV = (cards, cardDetails) => {
  let totalMV = 0;
  let totalNonLandCards = 0;
  
  cards.forEach(card => {
    if (!cardDetails[card.card_name]?.type_line.includes('Land')) {
      totalMV += (cardDetails[card.card_name]?.cmc || 0) * card.quantity;
      totalNonLandCards += card.quantity;
    }
  });

  return (totalMV / totalNonLandCards).toFixed(2);
};

const calculateColorDistribution = (cards, cardDetails) => {
  const colors = { W: 0, U: 0, B: 0, R: 0, G: 0, Multi: 0, Colorless: 0 };
  
  cards.forEach(card => {
    const cardColors = cardDetails[card.card_name]?.colors || [];
    if (cardColors.length === 0) {
      colors.Colorless += card.quantity;
    } else if (cardColors.length > 1) {
      colors.Multi += card.quantity;
    } else {
      colors[cardColors[0]] += card.quantity;
    }
  });

  return Object.entries(colors)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value
    }));
};

const calculateTypeDistribution = (cardCategories) => {
  return Object.entries(cardCategories).map(([category, cards]) => ({
    name: category,
    value: cards.reduce((sum, card) => sum + card.quantity, 0)
  })).filter(type => type.value > 0);
};

function DeckDetails() {
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
        types[card.card_name] = {
          type_line: data.type_line.split('—')[0].trim().split(' '),
          cmc: data.cmc,
          colors: data.colors || []
        };
      } catch (error) {
        console.error('Error fetching card type:', error);
      }
    }
    setCardTypes(types);
  };

  const cardCategories = deck?.deck_cards ? {
    creatures: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Creature')),
    instants: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Instant')),
    sorceries: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Sorcery')),
    artifacts: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Artifact')),
    enchantments: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Enchantment')),
    planeswalkers: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Planeswalker')),
    lands: deck.deck_cards.filter(card => cardTypes[card.card_name]?.type_line.includes('Land')),
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
    <div className="max-w-full mx-auto p-6">
      <div className="w-full">
        {/* Commander Section */}
        <div className="w-96 mb-8">
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

        {/* Charts Row */}
        <div style={{ display: 'inline-flex', width: '100%' }}>
          {/* Mana Curve */}
          <div style={{ width: '33%', marginRight: '1rem' }} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Mana Curve</h2>
              <div className="text-sm">
                Avg MV: <span className="font-bold">{calculateAverageMV(deck.deck_cards, cardTypes)}</span>
              </div>
            </div>
            <BarChart width={350} height={200} data={calculateManaCurve(deck.deck_cards, cardTypes)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cmc" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" name="Cards" />
            </BarChart>
          </div>

          {/* Color Distribution */}
          <div style={{ width: '33%', marginRight: '1rem' }} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Colors</h2>
            <PieChart width={350} height={200}>
              <Pie
                data={calculateColorDistribution(deck.deck_cards, cardTypes)}
                cx={175}
                cy={100}
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {calculateColorDistribution(deck.deck_cards, cardTypes).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>

          {/* Type Distribution */}
          <div style={{ width: '33%' }} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Types</h2>
            <PieChart width={350} height={200}>
              <Pie
                data={calculateTypeDistribution(cardCategories)}
                cx={175}
                cy={100}
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {calculateTypeDistribution(cardCategories).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>

        {/* Decklist Grid */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(300px, 1fr))', gap: '2rem'}}>
          {Object.entries(cardCategories).map(([category, cards]) => (
            cards?.length > 0 && (
              <div key={category}>
                <h3 className="text-xl font-bold capitalize mb-2">
                  {category} ({cards.reduce((sum, card) => sum + card.quantity, 0)})
                </h3>
                <div className="space-y-1">
                  {cards.map(card => (
                    <CardLink key={card.id} card={card} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeckDetails;