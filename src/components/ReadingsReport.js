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
    },
    stationImage: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "200px",
        backgroundColor: "#1d1d1d"
    },
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: 10,
        marginTop: 10,
    },
    gridItem: {
        width: "30%", // ~3 items per row (adjust as needed)
        marginBottom: 10,
        // padding: 4,
        // border: "1 solid #ccc",
        alignItems: "center",
        textAlign: "center",
    },
    gridImage: {
        width: "100%",
        objectFit: "cover",
    },
});

// Document Component
const ReadingsReport = ({ modules, product }) => (
    <Document>
        <Page style={styles.page}>
            <Text style={styles.title}>Product Reading Report</Text>

            <View style={styles.section}>
                {/* <Image src={img} style={styles.image} /> */}
                <Text><Text style={styles.label}>Product Id:</Text> {product.productId || "-"}</Text>
            </View>

            {modules.map((mod) => (
                <View key={mod.id} style={styles.section}>
                    <Text style={styles.subTitle}>Module Id: {mod.id}</Text>
                    <Text><Text style={styles.label}>Module Name:</Text> {mod.name}</Text>
                    <Text style={styles.label}>Module Image:</Text>
                    {/* <View style={styles.stationImage}>
                        <Text style={{
                            fontSize: "50px",
                            fontWeight: "900",
                            color: "#efefef"
                        }}>{mod.name}</Text>
                    </View> */}
                    {/* Image Grid */}
                    {mod.images && mod.images.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.label}>Module Images:</Text>
                            <View style={styles.imageGrid}>
                                {mod.images.map((img) => (
                                    <View key={img.id} style={styles.gridItem}>
                                        <Image
                                            src={
                                                img.imageData.startsWith("data:image")
                                                  ? img.imageData
                                                  : `data:image/png;base64,${img.imageData}`
                                              }
                                            style={styles.gridImage}
                                        />
                                        {/* <Text>{img.fileName}</Text> */}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    {/* Options Table */}
                    {mod.readings && mod.readings.length > 0 && (
                        <View style={styles.table}>
                            {/* Header Row */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableColHeader, {
                                    width: "20%"
                                }]}>
                                    <Text style={styles.tableCellHeader}>Parameter ID</Text>
                                </View>
                                <View style={styles.tableColHeader}>
                                    <Text style={styles.tableCellHeader}>Parameter Name</Text>
                                </View>
                                <View style={styles.tableColHeader}>
                                    <Text style={styles.tableCellHeader}>Value</Text>
                                </View>
                                <View style={styles.tableColHeader}>
                                    <Text style={styles.tableCellHeader}>Time</Text>
                                </View>
                            </View>

                            {/* Data Rows */}
                            {mod.readings.map((opt, index) => (
                                <View style={styles.tableRow} key={index}>
                                    <View style={[styles.tableCol, {
                                        width: "20%"
                                    }]}>
                                        <Text style={styles.tableCell}>{opt.parameterId}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{opt.parameterName}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{opt.value}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{opt.time}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </Page>
    </Document>
);

export default ReadingsReport;
