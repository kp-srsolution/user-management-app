import React, { useMemo, useState, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import axios from "axios";
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Modal, Box, TextField, Button } from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DownloadIcon from '@mui/icons-material/Download';

const TableComponent = () => {
    const [data, setData] = useState([]); // fetched rows
    const [pageIndex, setPageIndex] = useState(0); // current page (0-based)
    const [pageSize, setPageSize] = useState(10); // rows per page
    const [totalRows, setTotalRows] = useState(0); // backend total rows
    const [loading, setLoading] = useState(false);
    const [productIdFilter, setProductIdFilter] = useState("");
    const [parameterIdFilter, setParameterIdFilter] = useState("");
    const [parameterNameFilter, setParameterNameFilter] = useState("");
    const [moduleIdFilter, setModuleIdFilter] = useState("");
    const [moduleNameFilter, setModuleNameFilter] = useState("");
    const [sortingCol, setSortingCol] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [editData, setEditData] = useState({ srNo: "", barcode: "", engineType: "", modelName: "" });
    const [reportData, setReportData] = useState([]);

    const columnHelper = createColumnHelper();

    const exportReadingsToExcel = async () => {

        try {

            const res = await axios.get("http://localhost:5000/api/Users/readingsall/paged", {
                params: {
                    moduleIdFilter: moduleIdFilter || null,
                    parameterIdFilter: parameterIdFilter || null,
                    parameterNameFilter: parameterNameFilter || null,
                    moduleNameFilter: moduleNameFilter || null,
                    productIdFilter: productIdFilter || null,
                    sortBy: sortBy || null,
                    sortOrder: (sortOrder === "dsc" ? "desc" : "asc") || null,
                },
            });
            console.log(res.data);
            
            // Prepare data for Excel
            let data = [];
            if (res.data !== null) {
                res.data.data.forEach((reading) => {
                    data.push({
                        "Id": reading.id,
                        "Date": reading.timeString,
                        "Product ID": reading.productId,
                        "Station ID": reading.moduleId,
                        "Station Name": reading.moduleName,
                        "Parameter Id": reading.parameterId,
                        "Parameter Name": reading.parameterName,
                        "Value": reading.value,
                    });
                });

            // Convert JSON to sheet

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Product Readings");

            // Write workbook and trigger download
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
            const time = new Date();
            saveAs(blob, `Product_readings_${time}.xlsx`);
            } else {
                alert("No data arrived through filters!");
            }
        } catch (Err) {
            console.error(Err);
        }
    };

    // Fetch data from API whenever pageIndex or pageSize changes
    useEffect(() => {
        const fetchData = async () => {
            console.log(moduleNameFilter, parameterNameFilter);

            setLoading(true);
            try {
                const res = await axios.get("http://localhost:5000/api/Users/readings/paged", {
                    params: {
                        page: pageIndex + 1, // API is 1-based
                        pageSize: pageSize,
                        moduleIdFilter: moduleIdFilter || null,
                        parameterIdFilter: parameterIdFilter || null,
                        parameterNameFilter: parameterNameFilter || null,
                        moduleNameFilter: moduleNameFilter || null,
                        productIdFilter: productIdFilter || null,
                        sortBy: sortBy || null,
                        sortOrder: (sortOrder === "dsc" ? "desc" : "asc") || null,
                    },
                });

                setData(res.data.data); // rows
                setTotalRows(res.data.totalRecords); // backend count
            } catch (err) {
                console.error("Error fetching paginated data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pageIndex, pageSize, productIdFilter, parameterIdFilter, moduleIdFilter, sortOrder, sortBy, parameterNameFilter, moduleNameFilter]);

    // Edit handler
    // const handleEdit = (row) => {
    //     console.log(row);

    //     alert(`Edit clicked for Model ID: ${row.original.id}`);
    //     // You can navigate to edit page or open a modal here
    // };

    // Delete handler
    const handleDelete = async (row) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete Model ID: ${row.original.id}?`);
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:5000/api/model/ModelData/${row.original.id}`);
            alert("Deleted successfully!");
            // Refresh data after deletion
            setData((prevData) => prevData.filter((item) => item.id !== row.original.id));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete. Please try again.");
        }
    };

    // 🔹 Rewritten onUpdate function
    const onUpdate = async (rowId) => {
        try {
            await axios.put(
                `http://localhost:5000/api/model/ModelData/edit/${rowId}`,
                editData
            );
            alert("Changes saved successfully!");

            // Update table locally without refetch
            setData((prevData) =>
                prevData.map((item) =>
                    item.id === rowId ? { ...item, ...editData } : item
                )
            );

            handleClose(); // close modal after saving
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("Failed to save changes. Try again.");
        }
    };


    const columns = useMemo(
        () => [
            columnHelper.accessor("id", {
                header: "ID",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("timeString", {
                header: "Date",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("productId", {
                header: "Product ID",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("moduleId", {
                header: "Station ID",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("moduleName", {
                header: "Station Name",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("parameterId", {
                header: "Parameter ID",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("parameterName", {
                header: "Parameter Name",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("value", {
                header: "Value",
                cell: (info) => info.getValue(),
            }),
            columnHelper.display({
                id: "status",
                header: "Status",
                cell: ({ row }) => (
                    <div className="flex gap-2" style={{
                        padding: "0",
                    }}>
                        {/* <button
                            className="btn-edit"
                            style={{
                                background: "#4CAF50",
                                color: "white",
                                border: "none",
                                padding: "5px 10px",
                                marginRight: "10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onClick={() => handleOpen(row.original)}
                        >
                            <EditIcon />
                        </button>
                        <button
                            className="btn-delete"
                            style={{
                                background: "#F44336",
                                color: "white",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            onClick={() => handleDelete(row)}
                        >
                            <DeleteForeverIcon />
                        </button> */}
                        {
                            (row.original.value >= 2 && row.original.value <= 8) ? (
                                <div style={{
                                    color: "green",
                                    fontWeight: "600",
                                    textAlign: "left"
                                }}> In range </div>
                            ) : (
                                <div style={{
                                    color: "red",
                                    fontWeight: "600",
                                    textAlign: "left"
                                }}> Out of Range </div>
                            )
                        }
                    </div>
                ),
            }),
            // columnHelper.display({
            //     id: "actions",
            //     header: "Actions",
            //     cell: ({ row }) => (
            //         <div className="flex gap-2" style={{
            //             padding: "0 20px",
            //         }}>
            //             <button
            //                 className="btn-edit"
            //                 style={{
            //                     background: "#4CAF50",
            //                     color: "white",
            //                     border: "none",
            //                     padding: "5px 10px",
            //                     marginRight: "10px",
            //                     borderRadius: "4px",
            //                     cursor: "pointer",
            //                 }}
            //                 onClick={() => handleOpen(row.original)}
            //             >
            //                 <EditIcon />
            //             </button>
            //             <button
            //                 className="btn-delete"
            //                 style={{
            //                     background: "#F44336",
            //                     color: "white",
            //                     border: "none",
            //                     padding: "5px 10px",
            //                     borderRadius: "4px",
            //                     cursor: "pointer",
            //                 }}
            //                 onClick={() => handleDelete(row)}
            //             >
            //                 <DeleteForeverIcon />
            //             </button>
            //         </div>
            //     ),
            // }),
        ],
        []
    );

    const handleOpen = (row) => {
        setSelectedRow(row);
        setEditData({
            srNo: row.srNo,
            barcode: row.barcode,
            engineType: row.engineType,
            modelName: row.modelName
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedRow(null);
    };

    // const handleSave = () => {
    //     if (onUpdate) onUpdate(selectedRow.id, editData);
    //     handleClose();
    // };

    const handleChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const table = useReactTable({
        data,
        columns,
        pageCount: Math.ceil(totalRows / pageSize), // total pages from backend
        state: {
            pagination: { pageIndex, pageSize },
        },
        onPaginationChange: (updater) => {
            const newState =
                typeof updater === "function"
                    ? updater({ pageIndex, pageSize })
                    : updater;

            setPageIndex(newState.pageIndex);
            setPageSize(newState.pageSize);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true, // ✅ important for server-side
    });

    const handleSorting = async (name, type) => {
        console.log(name, type);

        if (type == "asc" || type == "dsc") {
            if (name === "moduleId")
                setSortBy("ModuleId");
            else if (name === "moduleName")
                setSortBy("ModuleName");
            // else if (name === "dateString")
            //     setSortBy("Date");
            else if (name === "parameterId")
                setSortBy("ParameterId");
            else if (name === "parameterName")
                setSortBy("ParameterId");
            else if (name === "productName")
                setSortBy("ProductId");
            else if (name === "value")
                setSortBy("Value");
            else {
                setSortBy("Id");
            }
            setSortingCol(name);
            setSortOrder(type);
        } else {
            setSortingCol("");
            setSortOrder("asc");
        }
    }

    return (
        <div className="table-container">
            {/* <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%"
            }}>
                <button onClick={() => exportReadingsToExcel()} className="input" >
                    Donwload filtered report
                </button>
            </div> */}
            <Button
                    variant="contained"
                    color="primary"
                    style={{ position: "fixed", bottom: "60px", right: "25px", width: "230px", padding: "10px 0" }}
                    onClick={() => exportReadingsToExcel()}
                  >
                    <DownloadIcon style={{ marginRight: "5px" }} /> Filtered Report
                  </Button>
            {/* Table */}
            <table className="data-table">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="data-table-row">
                            {table.getHeaderGroups()[0].headers.map((header) => (
                                <th key={header.id} className="data-table-header">
                                    {/* Render input box only if the column is filterable */}
                                    {/* {header.column.id === "dateString" && (
                                        <input
                                            type="text"
                                            placeholder="Search date..."
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="table-filter-input"
                                        />
                                    )} */}
                                    {header.column.id === "productId" && (
                                        <input
                                            id={`product-filter-${header.column.id}`}
                                            type="text"
                                            placeholder="Search model..."
                                            value={productIdFilter}
                                            onChange={(e) => setProductIdFilter(e.target.value)}
                                            className="table-filter-input"
                                        />
                                    )}
                                    {header.column.id === "parameterId" && (
                                        <input
                                            id={`para-filter-${header.column.id}`}
                                            type="text"
                                            placeholder="Search engine..."
                                            value={parameterIdFilter}
                                            onChange={(e) => setParameterIdFilter(e.target.value)}
                                            className="table-filter-input"
                                        />
                                    )}
                                    {header.column.id === "parameterName" && (
                                        <input
                                            id={`para-name-filter-${header.column.id}`}
                                            type="text"
                                            placeholder="Search engine..."
                                            value={parameterNameFilter}
                                            onChange={(e) => setParameterNameFilter(e.target.value)}
                                            className="table-filter-input"
                                        />
                                    )}
                                    {header.column.id === "moduleName" && (
                                        <input
                                            id={`module-name-filter-${header.column.id}`}
                                            type="text"
                                            placeholder="Search engine..."
                                            value={moduleNameFilter}
                                            onChange={(e) => setModuleNameFilter(e.target.value)}
                                            className="table-filter-input"
                                        />
                                    )}
                                    {header.column.id === "moduleId" && (
                                        <input
                                            id={`module-filter-${header.column.id}`}
                                            type="text"
                                            placeholder="Search barcode..."
                                            value={moduleIdFilter}
                                            onChange={(e) => setModuleIdFilter(e.target.value)}
                                            className="table-filter-input"
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="data-table-row">
                            {headerGroup.headers.map((header) => {
                                const currentSort = header.column.id === sortingCol ? sortOrder : null;

                                return (
                                    <th
                                        key={header.id}
                                        className="data-table-header"
                                        onClick={() => {
                                            // toggle sort direction
                                            let nextOrder = "asc";
                                            if (currentSort === "asc") nextOrder = "dsc";
                                            else if (currentSort === "dsc") nextOrder = null;

                                            handleSorting(header.column.id, nextOrder);
                                        }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: " 🔼 ",
                                            dsc: " 🔽 ",
                                        }[currentSort] ?? null}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="data-table-row">
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="data-table-cell">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}

                    {/* Empty rows while loading */}
                    {loading && (
                        <tr>
                            <td colSpan={columns.length}>Loading data...</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="table-pagination">
                <button
                    onClick={() => setPageIndex(0)}
                    disabled={pageIndex === 0}
                    className="pagination-button"
                    style={{
                        borderRadius: "50px"
                    }}
                >
                    <FirstPageIcon />
                </button>
                <button
                    onClick={() => setPageIndex((old) => Math.max(old - 1, 0))}
                    disabled={pageIndex === 0}
                    className="pagination-button"
                    style={{
                        borderRadius: "50px"
                    }}
                >
                    <ArrowBackIosNewIcon style={{ fontSize: "18px" }} />
                </button>
                <span className="pagination-info">
                    Page {pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                    onClick={() =>
                        setPageIndex((old) => (old < table.getPageCount() - 1 ? old + 1 : old))
                    }
                    disabled={pageIndex >= table.getPageCount() - 1}
                    className="pagination-button"
                    style={{
                        borderRadius: "50px"
                    }}
                >
                    <ArrowBackIosNewIcon style={{
                        rotate: "180deg",
                        fontSize: "18px"
                    }} />
                </button>
                <button
                    onClick={() => setPageIndex(table.getPageCount() - 1)}
                    disabled={pageIndex >= table.getPageCount() - 1}
                    className="pagination-button"
                    style={{
                        borderRadius: "50px"
                    }}
                >
                    <FirstPageIcon style={{
                        rotate: "180deg"
                    }} />
                </button>

                {/* Rows per page */}
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="page-size-select"
                >
                    {[5, 10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>
                            Show {size}
                        </option>
                    ))}
                </select>
            </div>
            {/* MUI Modal for Editing */}
            {/* <Modal open={open} onClose={handleClose}>
                <Box sx={{ p: 3, backgroundColor: "white", width: 400, margin: "100px auto", borderRadius: 2 }}>
                    <h3>Edit Model Data</h3>
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Sr No"
                        name="srNo"
                        value={editData.srNo}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Barcode"
                        name="barcode"
                        value={editData.barcode}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Engine Type"
                        name="engineType"
                        value={editData.engineType}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Model Name"
                        name="modelName"
                        value={editData.modelName}
                        onChange={handleChange}
                    />

                    <Box mt={2} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button variant="contained" color="primary" onClick={handleSave}>
                            Save
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal> */}
        </div>
    );
};

export default TableComponent;