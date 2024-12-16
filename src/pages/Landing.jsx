import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">
            Welcome to MTG Collector
          </h1>
          <p className="text-xl mb-8">
            Build decks, manage your collection, and share with the community
          </p>
          <div className="space-x-4">
            <Link
              to="/decks"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              View My Decks
            </Link>
            <Link
              to="/collection"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Manage Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
