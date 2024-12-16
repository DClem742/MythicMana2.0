import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Navbar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold">
              MTG Collector
            </Link>
            <Link to="/decks" className="hover:text-gray-300">
              My Decks
            </Link>
            <Link to="/decks/public" className="hover:text-gray-300">
              Public Decks
            </Link>
            <Link to="/collection" className="hover:text-gray-300">
              Collection
            </Link>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
