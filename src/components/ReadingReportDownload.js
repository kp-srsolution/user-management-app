// SingleParameterReportDownload.js
import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReadingsReport from "./ReadingsReport";

const ReadingReportDownload = ({ modules, product }) => {
    console.log(modules);
    console.log(product);
    
  return (
    <div>
      <PDFDownloadLink
        document={<ReadingsReport modules={modules} product={product}  />}
        fileName={`product_${product.productId}_report.pdf`}
        style={{
          textDecoration: "none",
          padding: "8px 12px",
          color: "#fff",
          backgroundColor: "#007BFF",
          borderRadius: "5px"
        }}
      >
        {({ loading }) => (loading ? "Generating report..." : "Download Report")}
      </PDFDownloadLink>
    </div>
  );
};

export default ReadingReportDownload;