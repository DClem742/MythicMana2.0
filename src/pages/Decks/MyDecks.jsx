import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function MyDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('decks')
        .select('*, deck_cards(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      setDecks(data);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">My Decks</h2>
        <Link
          to="/decks/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New Deck
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {decks.map((deck) => (
          <Link to={`/decks/${deck.id}`} key={deck.id}>
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src={deck.commander_image}
                alt={deck.commander}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg">{deck.name}</h3>
                <p className="text-gray-600">{deck.commander}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MyDecks;
