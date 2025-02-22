import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function ImageScanner() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectedMedicines, setDetectedMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  const VISION_API_KEY = "AIzaSyAVg8GB68-MElDy0ReCin7Qp3Ar8cjT5Pk";
  const GEMINI_API_KEY = "AIzaSyAVg8GB68-MElDy0ReCin7Qp3Ar8cjT5Pk";

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  // Extract text from image using Google Vision API
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
              },
            ],
          }),
        }
      );

      const visionData = await visionResponse.json();
      return visionData?.responses?.[0]?.fullTextAnnotation?.text || "";
    } catch (error) {
      console.error("Error extracting text:", error);
      return "";
    }
  };

  // Call Gemini API to filter only medicine names
  const detectMedicinesUsingGemini = async (text) => {
    try {
      const prompt = `Extract only the medicine names from this prescription text: "${text}". Only return medicine names as a comma-separated list.`;
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      return responseText.split(",").map((med) => med.trim());
    } catch (error) {
      console.error("Error with Gemini API:", error);
      return ["Error detecting medicines"];
    }
  };

  // Main function to scan prescription
  const handleScan = async () => {
    if (!selectedImage) return;
    setLoading(true);

    try {
      const base64Image = selectedImage.replace(/^data:image\/\w+;base64,/, "");
      console.log("🔍 Extracting text from image...");
      const extractedText = await extractTextFromImage(base64Image);

      if (!extractedText) {
        setDetectedMedicines(["No text detected"]);
        setLoading(false);
        return;
      }

      console.log("💊 Detecting Medicines...");
      const medicineNames = await detectMedicinesUsingGemini(extractedText);
      setDetectedMedicines(medicineNames);
    } catch (error) {
      console.error("Error:", error);
      setDetectedMedicines(["Error processing image"]);
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
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
        {loading ? "Scanning..." : "Scan Prescription"}
      </button>
      {detectedMedicines.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <h2 className="font-bold mb-2">Detected Medicines:</h2>
          <ul>
            {detectedMedicines.map((medicine, index) => (
              <li key={index} className="text-green-600">{medicine}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ImageScanner;
