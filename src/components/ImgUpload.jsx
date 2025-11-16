import React, { useState } from "react";
import axios from "axios";

function ImageUpload() {
  const [fileBase64, setFileBase64] = useState(null);
  const [pins, setPins] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result.split(",")[1]); // remove "data:image/xxx;base64,"
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileBase64) return alert("Please select an image first!");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/Yolo/detect-base64/",
        { ImageBase64: fileBase64 },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      setPins(response.data.pins); // matches your C# backend response
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Prediction failed!");
    }
  };

  return (
    <div>
      <h2>Upload Image for Pin Detection</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload & Predict</button>

      {pins !== null && <h3>Detected Pins: {pins}</h3>}
    </div>
  );
}

export default ImageUpload;
