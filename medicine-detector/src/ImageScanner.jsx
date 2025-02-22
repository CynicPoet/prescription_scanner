// src/ImageScanner.jsx
import React, { useState } from 'react';

function ImageScanner() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectedText, setDetectedText] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle image selection (via camera or gallery)
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Call Google Cloud Vision API for text detection
  const handleScan = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      // Remove data URL prefix to get pure base64 string
      const base64Image = selectedImage.replace(/^data:image\/\w+;base64,/, '');

      const requestBody = {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      };

      // Replace YOUR_API_KEY_HERE with your actual API key from Google Cloud
      const API_KEY = 'AIzaSyAVg8GB68-MElDy0ReCin7Qp3Ar8cjT5Pk';
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      if (data && data.responses && data.responses[0]) {
        const text = data.responses[0].fullTextAnnotation
          ? data.responses[0].fullTextAnnotation.text
          : 'No text detected';
        setDetectedText(text);
      } else {
        setDetectedText('No response from API');
      }
    } catch (error) {
      console.error('Error:', error);
      setDetectedText('Error processing image');
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="mb-4"
      />
      {selectedImage && (
        <div className="mb-4">
          <img src={selectedImage} alt="Selected" className="w-full h-auto" />
        </div>
      )}
      <button
        onClick={handleScan}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Scanning...' : 'Scan Prescription'}
      </button>
      {detectedText && (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <h2 className="font-bold mb-2">Detected Text:</h2>
          <pre className="whitespace-pre-wrap">{detectedText}</pre>
        </div>
      )}
    </div>
  );
}

export default ImageScanner;
