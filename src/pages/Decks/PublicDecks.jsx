import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function PublicDecks() {
  const [publicDecks, setPublicDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicDecks();
  }, []);

  const fetchPublicDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublicDecks(data);
    } catch (error) {
      console.error('Error fetching public decks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Public Decks</h2>
        <Link
          to="/decks"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to My Decks
        </Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicDecks.map((deck) => (
            <div key={deck.id} className="bg-white rounded-lg shadow-lg p-6">
              {deck.commander_image && (
                <img
                  src={deck.commander_image}
                  alt={deck.commander}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-bold mb-2">{deck.name}</h3>
              <p className="text-gray-600 mb-4">{deck.description}</p>
              <p className="text-sm text-gray-500">Created by: {deck.user_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PublicDecks;