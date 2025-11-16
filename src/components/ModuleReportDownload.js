// SingleParameterReportDownload.js
import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ModuleReport from "./ModuleReport";

const ModuleReportDownload = ({ parameters, user, module }) => {
  return (
    <div>
      <PDFDownloadLink
        document={<ModuleReport user={user} module={module} parameters={parameters} />}
        fileName={`module_${module.id}_report.pdf`}
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

export default ModuleReportDownload;