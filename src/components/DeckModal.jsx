import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

function DeckModal({ deck, onClose, onToggleVisibility }) {
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{deck.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-shrink-0">
            <img
              src={deck.commander_image}
              alt={deck.commander}
              className="w-48 rounded-lg"
            />
          </div>
          <div className="flex-grow">
            <p className="text-gray-600 mb-2">{deck.description}</p>
            <p className="text-sm text-gray-500">Commander: {deck.commander}</p>
            <div className="mt-4 space-x-2">
              <Link
                to={`/decks/edit/${deck.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Deck
              </Link>
              <button
                onClick={() => onToggleVisibility(deck.id, deck.is_public)}
                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                {deck.is_public ? 'Make Private' : 'Make Public'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeckModal;