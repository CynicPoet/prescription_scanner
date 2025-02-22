// src/App.jsx
import React from 'react';
import ImageScanner from './ImageScanner';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded p-6">
        <h1 className="text-2xl font-bold mb-4">
          Medicine Prescription Detector
        </h1>
        <ImageScanner />
      </div>
    </div>
  );
}

export default App;
