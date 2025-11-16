import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import logo from "../logo4.png";
import LogoutIcon from "@mui/icons-material/Logout";

const CaptureBarcode = () => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [decodedBarcodes, setDecodedBarcodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const videoConstraints = {
    width: 720 * 1.1,
    height: 405 * 1.1,
    facingMode: "environment", // back camera (better for barcodes)
  };

  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot(); // Base64 image
    setImgSrc(screenshot);
    setDecodedBarcodes([]);
    setLoading(true);

    try {
        const base64Data = screenshot.split(",")[1]; // remove prefix
        const res = await axios.post("http://localhost:8000/read-datamatrix/", {
        // const res = await axios.post("http://localhost:8000/blur-score/", {
          ImageBase64: base64Data
        }, {
          headers: { "Content-Type": "application/json" }
        });
        console.log(res.data);
        
      setDecodedBarcodes(res.data.decoded || []);
    } catch (error) {
      console.error("Error decoding barcode:", error);
      alert("Barcode decoding failed!");
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  const resetCapture = () => {
    setImgSrc(null);
    setDecodedBarcodes([]);
  };

  return (
    <>
      <nav
        className="admin-nav-bar"
        style={{ position: "fixed", left: 0, top: 0, zIndex: "100" }}
      >
        <div className="admin-nav-content-container" style={{ width: "1200px" }}>
          <div className="admin-nav-logo-container">
            <img
              src={logo}
              alt="Dashboard"
              style={{ width: "auto", height: "60px", borderRadius: "9px" }}
            />
          </div>
          <div className="admin-nav-option-container">
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                color: "red",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "600",
              }}
              onClick={() => {
                localStorage.clear();
              }}
            >
              LOGOUT{" "}
              <LogoutIcon
                style={{ marginLeft: "5px", fontSize: "17px", fontWeight: "700" }}
              />
            </div>
          </div>
        </div>
      </nav>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        {imgSrc ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={imgSrc}
              alt="Captured"
              style={{ width: "100%", maxWidth: "1080px" }}
            />
            <button className="input capture-input" onClick={resetCapture}>
              Retake
            </button>

            {loading ? (
              <p>Decoding barcode...</p>
            ) : decodedBarcodes.length > 0 ? (
              <div>
                <h3>Decoded Data Matrix: ({decodedBarcodes[0].data})</h3>
                {/* <ul>
                  {decodedBarcodes.map((code, index) => (
                    <li key={index}>{code.data}</li>
                  ))}
                </ul> */}
              </div>
            ) : (
              <p>No barcode detected.</p>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={videoConstraints.width}
              height={videoConstraints.height}
              videoConstraints={videoConstraints}
            />
            <button className="input capture-input" onClick={captureAndDetect}>
              Capture & Decode Barcode
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CaptureBarcode;