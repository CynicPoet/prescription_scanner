import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function ImageScanner() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectedMedicines, setDetectedMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const VISION_API_KEY = "AIzaSyAVg8GB68-MElDy0ReCin7Qp3Ar8cjT5Pk";
  const GEMINI_API_KEY = "AIzaSyAVg8GB68-MElDy0ReCin7Qp3Ar8cjT5Pk";

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const handleImageChange = (e) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractTextFromImage = async (base64Image) => {
    try {
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: "TEXT_DETECTION" }],
                imageContext: { languageHints: ["en"] }
              }
            ]
          })
        }
      );

      const visionData = await visionResponse.json();
      return visionData?.responses?.[0]?.fullTextAnnotation?.text || "";
    } catch (error) {
      console.error("Error extracting text:", error);
      setError("Text extraction failed");
      return "";
    }
  };

  const detectMedicinesUsingGemini = async (text) => {
    try {
      const prompt = `Extract and verify only real medicine names from the prescription text below. 
      Return medicine names as a comma-separated list, correcting misspellings:
      
      "${text}"`;

      const result = await model.generateContent(prompt);
      const responseText = (await result.response.text())
        .replace(/["*]/g, "") 
        .split(/[,\n]/) 
        .map(item => item.trim())
        .filter(Boolean);

      return [...new Set(responseText)]; 
    } catch (error) {
      console.error("Error with Gemini API:", error);
      setError("Medicine detection failed");
      return [];
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");
    setDetectedMedicines([]);

    try {
      const base64Image = selectedImage.replace(/^data:image\/\w+;base64,/, "");
      const extractedText = await extractTextFromImage(base64Image);

      if (!extractedText) {
        setError("No readable text found in image");
        setLoading(false);
        return;
      }

      const medicineNames = await detectMedicinesUsingGemini(extractedText);
      
      if (medicineNames.length === 0) {
        setError("No valid medicines detected");
      } else {
        setDetectedMedicines(medicineNames);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Processing failed - please try again");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Prescription:</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
          disabled={loading}
        />
      </div>

      {selectedImage && (
        <div className="mb-4">
          <img 
            src={selectedImage} 
            alt="Scanned prescription" 
            className="w-full h-64 object-contain"
          />
        </div>
      )}

      <button
        onClick={handleScan}
        className={`w-full py-3 px-6 rounded-lg font-medium ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        } text-white transition-colors`}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Scan Prescription"}
      </button>

      {error && (
        <div className="mt-4 p-3 text-red-600 border border-red-300">
          {error}
        </div>
      )}

      {detectedMedicines.length > 0 && (
        <div className="mt-4 p-4 border border-gray-300">
          <h2 className="text-lg font-semibold mb-3">Detected Medicines:</h2>
          <ul>
            {detectedMedicines.map((medicine, index) => (
              <li key={index} className="mb-1">{medicine}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ImageScanner;
