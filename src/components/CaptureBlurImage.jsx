import React, { useState } from "react";
import axios from "axios";

const BlurChecker = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [blurResult, setBlurResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convert file to Base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setBlurResult(null);
    }
  };

  const checkBlur = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const base64 = await toBase64(selectedImage);
      const base64Data = base64.split(",")[1]; // remove "data:image/jpeg;base64,"

      const response = await axios.post("http://localhost:8000/blur-score/", {
        ImageBase64: base64Data,
      });

      setBlurResult(response.data);
    } catch (error) {
      console.error("Error checking blur:", error);
      alert("Failed to check blur. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🔍 Blur Detection</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview && (
        <div style={{ marginTop: "20px" }}>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: "400px", maxHeight: "400px", borderRadius: "10px" }}
          />
        </div>
      )}

      {selectedImage && (
        <button
          onClick={checkBlur}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Check Blur"}
        </button>
      )}

      {blurResult && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result:</h3>
          <p>📊 Blur Score: {blurResult.score.toFixed(2)}</p>
          <p>📝 Classification: {blurResult.blur_level}</p>
        </div>
      )}
    </div>
  );
};

export default BlurChecker;