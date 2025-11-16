// SingleParameterReportDownload.js
import React from "react";
import { pdf } from "@react-pdf/renderer";
import SingleParameterReport from "./SingleParameterReport";
import axios from "axios"
import DownloadIcon from '@mui/icons-material/Download';
import AttachEmailIcon from '@mui/icons-material/AttachEmail';
import Button from '@mui/material/Button';

const SingleParameterReportDownload = ({ parameter, user, module }) => {

  const handleSendEmail = async () => {
    try {
      // 1️⃣ Generate the PDF blob
      const doc = <SingleParameterReport parameter={parameter} user={user} module={module} />;
      const blob = await pdf(doc).toBlob();

      // 2️⃣ Convert Blob to Base64
      const arrayBuffer = await blob.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // 3️⃣ Prepare payload
      const payload = {
        recipientEmail: "karanhpadhiyar12345@gmail.com", // replace with dynamic email if needed
        fileName: `parameter_${parameter.id}.pdf`,
        base64Pdf: base64String
      };

      // 4️⃣ Send to API
      const response = await axios.post(
        "http://localhost:5000/api/Users/send-report",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      // 5️⃣ Handle response
      if (response.status === 200) {
        alert("Report emailed successfully!");
      } else {
        alert(`Failed to send email. Status: ${response.status}`);
      }

    } catch (error) {
      console.error("Email sending error:", error);
      alert("An error occurred while sending the email.");
    }
  };

  const handleDownload = async () => {
    const doc = <SingleParameterReport parameter={parameter} user={user} module={module} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `parameter_${parameter.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", gap: "10px", flexDirection: "row"}}>
      <Button
        onClick={handleDownload}
        style={{
          padding: "8px 12px",
          color: "#fff",
          backgroundColor: "#007BFF",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer"
        }}
      >
        <DownloadIcon />
      </Button>

      <Button
        onClick={handleSendEmail}
        style={{
          padding: "8px 12px",
          color: "#fff",
          backgroundColor: "#28A745",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer"
        }}
      >
        <AttachEmailIcon />
      </Button>
    </div>
  );
};

export default SingleParameterReportDownload;
