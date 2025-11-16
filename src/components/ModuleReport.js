// import React from "react";
// import {
//   Document,
//   Page,
//   Text,
//   View,
//   StyleSheet,
// } from "@react-pdf/renderer";

// const styles = StyleSheet.create({
//   page: { padding: 20, fontSize: 12 },
//   title: { fontSize: 20, marginBottom: 15, textAlign: "center" },
//   section: { marginBottom: 12 },
//   label: { fontWeight: "bold" },
//   subTitle: { fontSize: 16, marginTop: 10, marginBottom: 5, textDecoration: "underline" },

//   // Table styles
//   table: {
//     display: "table",
//     width: "auto",
//     borderStyle: "solid",
//     borderWidth: 1,
//     borderRightWidth: 0,
//     borderBottomWidth: 0,
//     marginTop: 8,
//     marginBottom: 12,
//   },
//   tableRow: {
//     flexDirection: "row",
//   },
//   tableColHeader: {
//     width: "50%",
//     borderStyle: "solid",
//     borderWidth: 1,
//     borderLeftWidth: 0,
//     borderTopWidth: 0,
//     backgroundColor: "#f0f0f0",
//     padding: 4,
//   },
//   tableCol: {
//     width: "50%",
//     borderStyle: "solid",
//     borderWidth: 1,
//     borderLeftWidth: 0,
//     borderTopWidth: 0,
//     padding: 4,
//   },
//   tableCellHeader: { fontSize: 12, fontWeight: "bold" },
//   tableCell: { fontSize: 12 },

//   // Button
//   button: {
//     backgroundColor: "#1976d2",
//     color: "#fff",
//     padding: "6px 12px",
//     borderRadius: 4,
//     cursor: "pointer",
//     textDecoration: "none",
//     fontSize: 14,
//   },
// });

// // Document Component
// const ModuleReport = ({ user, module, parameters }) => (
//   <Document>
//     <Page style={styles.page}>
//       <Text style={styles.title}>Module Report</Text>

//       {/* User Section */}
//       <View style={styles.section}>
//         <Text><Text style={styles.label}>User ID:</Text> {user.id}</Text>
//         <Text><Text style={styles.label}>User Name:</Text> {user.name}</Text>
//       </View>

//       {/* Module Section */}
//       <View style={styles.section}>
//         <Text><Text style={styles.label}>Module ID:</Text> {module.id}</Text>
//         <Text><Text style={styles.label}>Module Name:</Text> {module.name}</Text>
//         <Text><Text style={styles.label}>No. of Parameters:</Text> {module.parameters.length}</Text>
//       </View>

//       {/* Parameters */}
//       {parameters.map((param) => (
//         <View key={param.id} style={styles.section}>
//           <Text style={styles.subTitle}>Parameter: {param.name}</Text>
//           <Text><Text style={styles.label}>Parameter ID:</Text> {param.id}</Text>
//           <Text><Text style={styles.label}>Value:</Text> {param.value || "-"}</Text>
//           <Text><Text style={styles.label}>Selected Option:</Text> {param.selectedOption || "-"}</Text>
//           <Text><Text style={styles.label}>Option Name:</Text> {param.optionName || "-"}</Text>

//           {/* Options Table */}
//           {param.options && param.options.length > 0 && (
//             <View style={styles.table}>
//               {/* Header Row */}
//               <View style={styles.tableRow}>
//                 <View style={styles.tableColHeader}>
//                   <Text style={styles.tableCellHeader}>Option Name</Text>
//                 </View>
//                 <View style={styles.tableColHeader}>
//                   <Text style={styles.tableCellHeader}>Option Value</Text>
//                 </View>
//               </View>

//               {/* Data Rows */}
//               {param.options.map((opt) => (
//                 <View style={styles.tableRow} key={opt.id}>
//                   <View style={styles.tableCol}>
//                     <Text style={styles.tableCell}>{opt.name}</Text>
//                   </View>
//                   <View style={styles.tableCol}>
//                     <Text style={styles.tableCell}>{opt.value}</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>
//       ))}
//     </Page>
//   </Document>
// );

// export default ModuleReport;

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

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
});

// Document Component
const ModuleReport = ({ parameters, user, module }) => {
    console.log(parameters, user, module);
    return (
        <Document>
            <Page style={styles.page}>
                <Text style={styles.title}>Parameter Report</Text>

                <View style={styles.section}>
                    <Text><Text style={styles.label}>User ID:</Text> {user.id}</Text>
                    <Text><Text style={styles.label}>User name:</Text> {user.firstname + " " + user.lastname}</Text>
                    <Text><Text style={styles.label}>Module ID:</Text> {module.id}</Text>
                    <Text><Text style={styles.label}>Module name:</Text> {module.name}</Text>
                </View>

                {/* Options Table */}
                {parameters.map((param) => (
                    <View key={param.id} style={styles.section}>
                        <Text style={styles.subTitle}>Parameter: {param.name}</Text>
                        <Text><Text style={styles.label}>Parameter ID:</Text> {param.id}</Text>
                        <Text><Text style={styles.label}>Value:</Text> {param.value || "-"}</Text>
                        <Text><Text style={styles.label}>Selected Option:</Text> {param.selectedOption || "-"}</Text>
                        <Text><Text style={styles.label}>Option Name:</Text> {param.optionName || "-"}</Text>

                        {/* {param.options && param.options.length > 0 && (
                        <View style={styles.table}>
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

                            {param.options.map((opt) => (
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
                    )} */}
                    </View>
                ))}
            </Page>
        </Document>
    );
};

export default ModuleReport;