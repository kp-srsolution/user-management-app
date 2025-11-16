import React, { useState } from "react";
import axios from "axios";
import logo from "../logo4.png";
import LogoutIcon from '@mui/icons-material/Logout';

function ImageCompare() {
  const [refFile, setRefFile] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [refPreview, setRefPreview] = useState(null);
  const [testPreview, setTestPreview] = useState(null);
  const [similarity, setSimilarity] = useState(null);

  const handleRefChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRefFile(file);
      setRefPreview(URL.createObjectURL(file)); // preview image
    }
  };

  const handleTestChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTestFile(file);
      setTestPreview(URL.createObjectURL(file)); // preview image
    }
  };

  const handleUpload = async () => {
    if (!refFile || !testFile) return alert("Please select both images!");

    const formData = new FormData();
    formData.append("ref", refFile);
    formData.append("test", testFile);

    try {
      const res = await axios.post("http://localhost:8000/compare/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSimilarity(res.data.similarity_percent);
    } catch (err) {
      console.error("Error:", err);
      alert("Comparison failed!");
    }
  };

  return (
    <>
    <nav className="admin-nav-bar" style={{ position: "fixed", left: 0, top: 0, zIndex: "100" }}>
        <div className="admin-nav-content-container" style={{
          width: "1200px"
        }}>
          <div className="admin-nav-logo-container">
            <img src={logo} alt="Dashboard" style={{
              width: "auto",
              height: "60px",
              borderRadius: "9px"
            }} />
          </div>
          <div className="admin-nav-option-container">
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", color: "red", cursor: "pointer", fontSize: "18px", fontWeight: "600" }} onClick={() => {
              localStorage.clear();
            }}>LOGOUT <LogoutIcon style={{ marginLeft: "5px", fontSize: "17px", fontWeight: "700" }} /></div>
          </div>
        </div>
      </nav>
    <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "100%",
        minHeight: "100vh",
        paddingBottom: "20px",
        marginTop: "70px"
    }}>
      <h2>Compare Reference & Test Image</h2>

      {/* Reference Image Upload */}
      <input type="file" accept="image/*" onChange={handleRefChange} />
      {refPreview && (
        <div>
          <h4>Reference Image:</h4>
          <img
            src={refPreview}
            alt="Reference Preview"
            style={{ width: "100%", maxWidth: "360px" }}
          />
        </div>
      )}

      {/* Test Image Upload */}
      <input type="file" accept="image/*" onChange={handleTestChange} />
      {testPreview && (
        <div>
          <h4>Test Image:</h4>
          <img
            src={testPreview}
            alt="Test Preview"
            style={{ width: "100%", maxWidth: "360px" }}
          />
        </div>
      )}

      <button onClick={handleUpload} style={{ marginTop: "10px" }}>
        Compare
      </button>

      {similarity !== null && (
        <h3>Similarity: {similarity}%</h3>
      )}
    </div>
    </>
  );
}

export default ImageCompare;
