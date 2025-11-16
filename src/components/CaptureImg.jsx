import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import logo from "../logo4.png";
import LogoutIcon from '@mui/icons-material/Logout';


const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [pins, setPins] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoConstraints = {
    width: 720*1.10,
    height: 405*1.10,
    facingMode: "user",
  };

  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot(); // Base64 string
    setImgSrc(screenshot);
    setPins(null);
    setLoading(true);

    try {
      // Remove prefix "data:image/jpeg;base64,"
      const base64Data = screenshot.split(",")[1];

      const response = await axios.post(
        "http://localhost:8000/predict-base64/",
        { ImageBase64: base64Data },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      setPins(response.data.pins);
    } catch (error) {
      console.error("Error sending image to backend:", error);
      alert("Detection failed!");
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  const resetCapture = () => {
    setImgSrc(null);
    setPins(null);
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
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        {imgSrc ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <img
              src={imgSrc}
              alt="Captured"
              style={{ width: "100%", maxWidth: "1080px" }}
            />
            <button className="input capture-input" onClick={resetCapture}>Retake</button>

            {loading ? (
              <p>Detecting pins...</p>
            ) : pins !== null ? (
              <h3>Detected Pins: {pins} ({pins === 8 ? <b style={{color: "green"}}>Okay</b>
              : <b style={{color: "red"}}>NG</b>})</h3>
            ) : (
              <p>No detections yet.</p>
            )}
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={videoConstraints.width}
              height={videoConstraints.height}
              videoConstraints={videoConstraints}
            />
            <button className="input capture-input" onClick={captureAndDetect}>Capture & Detect</button>
          </div>
        )}
      </div>
    </>
  );
};

export default WebcamCapture;
