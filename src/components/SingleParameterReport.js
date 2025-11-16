import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import img from "../logo2.png"

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 12 },
  title: { fontSize: 18, marginBottom: 10, textAlign: "center" },
  section: { marginBottom: 10 },
  label: { fontWeight: "bold" },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
    padding: 4,
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  tableCellHeader: { fontSize: 12, fontWeight: "bold" },
  tableCell: { fontSize: 12 },
  button: {
    backgroundColor: "#1976d2",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
    textDecoration: "none",
    fontSize: 14,
  },
  image: {
    width: "100%",
    height: "auto",
  }
});

// Document Component
const SingleParameterReport = ({ parameter, user, module }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.title}>Parameter Report</Text>

      <View style={styles.section}>
        <Image src={img} style={styles.image} />
        <Text><Text style={styles.label}>User ID:</Text> {user.id}</Text>
        <Text><Text style={styles.label}>User name:</Text> {user.firstname + " " + user.lastname}</Text>
        <Text><Text style={styles.label}>Module ID:</Text> {module.id}</Text>
        <Text><Text style={styles.label}>Module name:</Text> {module.name}</Text>
        <Text><Text style={styles.label}>Parameter ID:</Text> {parameter.id}</Text>
        <Text><Text style={styles.label}>Name:</Text> {parameter.name}</Text>
        <Text><Text style={styles.label}>Value:</Text> {parameter.value || "-"}</Text>
        <Text><Text style={styles.label}>Option Name:</Text> {parameter.optionName || "-"}</Text>
        <Text><Text style={styles.label}>Selected Option:</Text> {parameter.selectedOption || "-"}</Text>
      </View>

      {/* Options Table */}
      {parameter.options && parameter.options.length > 0 && (
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, {
                width: "20%"
            }]}>
              <Text style={styles.tableCellHeader}>Option ID</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Option Name</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Option Value</Text>
            </View>
          </View>

          {/* Data Rows */}
          {parameter.options.map((opt) => (
            <View style={styles.tableRow} key={opt.id}>
              <View style={[styles.tableCol, {
                width: "20%"
              }]}>
                <Text style={styles.tableCell}>{opt.id}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{opt.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{opt.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

export default SingleParameterReport;
