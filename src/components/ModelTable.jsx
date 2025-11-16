import React, { useMemo, useState, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    createColumnHelper,
} from "@tanstack/react-table";
import axios from "axios";
import { Modal, Box, TextField, Button } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FirstPageIcon from '@mui/icons-material/FirstPage';


const ModelTable = () => {
    const [data, setData] = useState([]); // fetched rows
    const [pageIndex, setPageIndex] = useState(0); // current page (0-based)
    const [pageSize, setPageSize] = useState(10); // rows per page
    const [totalRows, setTotalRows] = useState(0); // backend total rows
    const [loading, setLoading] = useState(false);
    const [userIdFilter, setUserIdFilter] = useState("");
    const [moduleIdFilter, setModuleIdFilter] = useState("");
    const [moduleNameFilter, setModuleNameFilter] = useState("");
    const [idFilter, setIdFilter] = useState("");
    const [modelNameFilter, setModelNameFilter] = useState("");
    const [modelSrNoFilter, setModelSrNoFilter] = useState("");
    const [sortingCol, setSortingCol] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [editData, setEditData] = useState({ srNo: "", barcode: "", engineType: "", modelName: "" });
    const [parameters, setParameters] = useState(null);
    const [issuedModel, setIssuedModel] = useState(11);
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(5);
    const [count, setCount] = useState(1);
    const [modelName, setModelName] = useState("");
    const [userName, setUserName] = useState("");
    const [id, setId] = useState(0);

    const columnHelper = createColumnHelper();

    // Fetch data from API whenever pageIndex or pageSize changes
    useEffect(() => {
        const fetchData = async () => {
            console.log(moduleNameFilter);

            setLoading(true);
            try {
                const res = await axios.get("http://localhost:5000/api/Users/productmodels/paged", {
                    params: {
                        page: pageIndex + 1, // API is 1-based
                        pageSize: pageSize,
                        modelSrNoFilter: modelSrNoFilter || null,
                        modelNameFilter: modelNameFilter || null,
                        idFilter: idFilter || null,
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
    }, [pageIndex, pageSize, idFilter, sortOrder, sortBy, modelNameFilter, modelSrNoFilter, open]);

    useEffect(() => {
        const fetchIssued = async () => {
            setLoading(true);
            try {
                const result = await axios.get("http://localhost:5000/api/Users/selectedModel");
                setIssuedModel(result.data[0].modelId);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchIssued();
    }, []);

    // Edit handler
    const handleEdit = (row) => {
        setSelectedRow(row.original);
        setOpen(true);

        // alert(`Edit clicked for Model ID: ${row.original.id}`);
        // You can navigate to edit page or open a modal here
    };

    const handleIssueChange = async (id) => {
        setLoading(true);
        try {
            const result = await axios.post(`http://localhost:5000/api/Users/selectedModel/${id}`);
            console.log(result.data);
            setIssuedModel(id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // Delete handler
    const handleDelete = async (row) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete Model ID: ${row.original.id}?`);
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:5000/api/Users/model/${row.original.id}`);
            alert("Deleted successfully!");
            // Refresh data after deletion
            setData((prevData) => prevData.filter((item) => item.id !== row.original.id));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete. Please try again.");
        }
    };


    const columns = useMemo(
        () => [
            columnHelper.accessor("id", {
                header: "Model ID",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("modelSrNo", {
                header: "Model Sr No",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("modelName", {
                header: "Model Name",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("userName", {
                header: "User Name",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("min", {
                header: "Min",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("max", {
                header: "Max",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("noOfSrNoAtTime", {
                header: "No of Serial",
                cell: (info) => info.getValue(),
            }),
            columnHelper.display({
                id: "action",
                header: "Action",
                cell: ({ row }) => (
                    <div className="flex gap-2" style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: "0",
                        gap: "10px",
                    }}>
                        {
                            15 === row.original.id ?
                                <button
                                    className="btn-edit"
                                    style={
                                        {
                                            background: "#1976D245",
                                            color: "#1976D2",
                                            border: "none",
                                            padding: "3px 7px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            border: "2px solid #1976D2",
                                            fontWeight: "700"
                                        }
                                    }
                                    disabled={row.original.id == issuedModel}
                                    onClick={() => setIssuedModel(row.original.id)}
                                >
                                    {

                                        "ISSUED"
                                    }
                                </button>
                                : <button
                                    className="btn-edit"
                                    style={{
                                        opacity: "40%",
                                        cursor: "default",
                                        background: "#5d5d5d45",
                                        color: "#5d5d5d",
                                        border: "none",
                                        padding: "3px 7px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        border: "2px solid #5d5d5d",
                                        fontWeight: "700"
                                    }
                                    }
                                    disabled={row.original.id == issuedModel}
                                    onClick={() => setIssuedModel(row.original.id)}
                                >
                                    {

                                        "ISSUE"
                                    }
                                </button>
                        }
                        <button
                            className="btn-edit"
                            style={10 === row.original.id ? {
                                background: "#c6ac0045",
                                color: "#c6ac00",
                                border: "none",
                                padding: "3px 7px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "2px solid #c6ac00",
                                fontWeight: "700"
                            } : {
                                opacity: "40%",
                                background: "#5d5d5d45",
                                color: "#5d5d5d",
                                border: "none",
                                padding: "3px 7px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "2px solid #5d5d5d",
                                fontWeight: "700"
                            }
                            }
                            disabled={true}
                            onClick={() => console.log(row.original)}
                        >
                            STOP
                        </button>
                        <button
                            className="btn-edit"
                            style={{
                                background: "#4CAF50",
                                background: "#4CAF5055",
                                color: "#4CAF50",
                                border: "none",
                                padding: "3px 7px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "2px solid #4CAF50",
                                fontWeight: "700"
                            }}
                            onClick={() => handleOpen(row)}
                        >
                            EDIT
                        </button>
                        <button
                            className="btn-delete"
                            style={{
                                background: "#F4433655",
                                color: "#F44336",
                                border: "none",
                                padding: "3px 7px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                border: "2px solid #F44336",
                                fontWeight: "700"
                            }}
                            onClick={() => handleDelete(row)}
                        >
                            DELETE
                        </button>
                        {/* {
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
                        } */}

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
        setId(row.original.id);
        setMin(row.original.min);
        setMax(row.original.max);
        setCount(row.original.noOfSrNoAtTime);
        setUserName(row.original.userName);
        setModelName(row.original.modelName);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setParameters([]);
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
            if (name === "id")
                setSortBy("Id");
            // else if (name === "dateString")
            //     setSortBy("Date");
            else if (name === "name")
                setSortBy("ModuleName");
            else {
                setSortBy("UserId");
            }
            setSortingCol(name);
            setSortOrder(type);
        } else {
            setSortingCol("");
            setSortOrder("asc");
        }
    }

    // const exportFilteredModulesToExcel = async () => {

    //     try {
    //         const res = await axios.get("http://localhost:5000/api/Users/getallmodules/paged", {
    //             params: {
    //                 moduleIdFilter: moduleIdFilter || null,
    //                 moduleNameFilter: moduleNameFilter || null,
    //                 userIdFilter: userIdFilter || null,
    //                 sortBy: sortBy || null,
    //                 sortOrder: (sortOrder === "dsc" ? "desc" : "asc") || null,
    //             },
    //         });
    //         res.data.data.forEach((module) => {
    //             // Add module header row
    //             data.push({
    //                 "Module ID": module.id,
    //                 "Module Name": module.name,
    //                 "User ID": module.userId,
    //                 "Parameter ID": "",
    //                 "Parameter Name": "",
    //                 "Value": "",
    //                 "Min": "",
    //                 "Max": ""
    //             });

    //             // Add parameters rows
    //             module.parameters.forEach((param) => {
    //                 data.push({
    //                     "Module ID": "",
    //                     "Module Name": "",
    //                     "User ID": "",
    //                     "Parameter ID": param.id,
    //                     "Parameter Name": param.name,
    //                     "Value": param.value,
    //                     "Min": param.min,
    //                     "Max": param.max
    //                 });
    //             });

    //             // Empty row for spacing between modules
    //             data.push({});
    //         });

    //         // Convert JSON to sheet
    //         const worksheet = XLSX.utils.json_to_sheet(data);
    //         const workbook = XLSX.utils.book_new();
    //         XLSX.utils.book_append_sheet(workbook, worksheet, "Modules Report");

    //         // Write workbook and trigger download
    //         const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    //         const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    //         saveAs(blob, "Modules_Report.xlsx");
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    const handleSubmit = async () => {
        if (modelName === "" || userName === "" || min <= 0 || count <= 0) {
            alert("Plase fill all details correctly!");
        }
        try {
            setLoading(true);
            const res = await axios.put(`http://localhost:5000/api/Users/model/${id}`, {
                UserName: userName,
                ModelName: modelName,
                Min: min,
                Max: max,
                NoOfSrNoAtTime: count,
            });
            console.log(res.data);
            alert("Changes made to the selected recipe!!");
            // navigate("/dashboard");
            // window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <div className="table-container" style={{
            width: "100%"
        }}>
            {/* <Button
                variant="contained"
                color="primary"
                style={{ position: "fixed", bottom: "60px", right: "25px", width: "230px", padding: "10px 0" }}
                onClick={() => exportFilteredModulesToExcel()}
            >
                <DownloadIcon style={{ marginRight: "5px" }} /> Filtered Report
            </Button> */}
            {/* Table */}
            {
                issuedModel === 0 ? <></> : (
                    // <table className="data-table">
                    //     <thead>
                    //         {table.getHeaderGroups().map((headerGroup) => (
                    //             <tr key={headerGroup.id} className="data-table-row">
                    //                 {table.getHeaderGroups()[0].headers.map((header) => (
                    //                     <th key={header.id} className="data-table-header">
                    //                         {/* Render input box only if the column is filterable */}
                    //                         {/* {header.column.id === "dateString" && (
                    //                     <input
                    //                         type="text"
                    //                         placeholder="Search date..."
                    //                         value={dateFilter}
                    //                         onChange={(e) => setDateFilter(e.target.value)}
                    //                         className="table-filter-input"
                    //                     />
                    //                 )} */}
                    //                         {header.column.id === "modelSrNo" && (
                    //                             <input
                    //                                 id={`product-filter-${header.column.id}`}
                    //                                 type="text"
                    //                                 placeholder="Search model..."
                    //                                 value={modelSrNoFilter}
                    //                                 onChange={(e) => setModelSrNoFilter(e.target.value)}
                    //                                 className="table-filter-input"
                    //                             />
                    //                         )}
                    //                         {header.column.id === "modelName" && (
                                                // <input
                                                //     id={`module-name-filter-${header.column.id}`}
                                                //     type="text"
                                                //     placeholder="Search engine..."
                                                //     value={modelNameFilter}
                                                //     onChange={(e) => setModelNameFilter(e.target.value)}
                                                //     className="table-filter-input"
                                                // />
                    //                         )}
                    //                         {header.column.id === "id" && (
                    //                             <input
                    //                                 id={`module-filter-${header.column.id}`}
                    //                                 type="text"
                    //                                 placeholder="Search barcode..."
                    //                                 value={idFilter}
                    //                                 onChange={(e) => setIdFilter(e.target.value)}
                    //                                 className="table-filter-input"
                    //                             />
                    //                         )}
                    //                     </th>
                    //                 ))}
                    //             </tr>
                    //         ))}
                    //     </thead>
                    //     <thead>
                    //         {table.getHeaderGroups().map((headerGroup) => (
                    //             <tr key={headerGroup.id} className="data-table-row">
                    //                 {headerGroup.headers.map((header) => {
                    //                     const currentSort = header.column.id === sortingCol ? sortOrder : null;

                    //                     return (
                    //                         <th
                    //                             key={header.id}
                    //                             className="data-table-header"
                    //                             onClick={() => {
                    //                                 // toggle sort direction
                    //                                 let nextOrder = "asc";
                    //                                 if (currentSort === "asc") nextOrder = "dsc";
                    //                                 else if (currentSort === "dsc") nextOrder = null;

                    //                                 handleSorting(header.column.id, nextOrder);
                    //                             }}
                    //                         >
                    //                             {flexRender(header.column.columnDef.header, header.getContext())}
                    //                             {{
                    //                                 asc: " 🔼 ",
                    //                                 dsc: " 🔽 ",
                    //                             }[currentSort] ?? null}
                    //                         </th>
                    //                     );
                    //                 })}
                    //             </tr>
                    //         ))}
                    //     </thead>
                    //     <tbody>
                    //         {table.getRowModel().rows.map((row) => (
                    //             <tr key={row.id} className="data-table-row">
                    //                 {row.getVisibleCells().map((cell) => (
                    //                     <td key={cell.id} className="data-table-cell">
                    //                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    //                     </td>
                    //                 ))}
                    //             </tr>
                    //         ))}

                    //         {/* Empty rows while loading */}
                    //         {(loading || issuedModel === 0) && (
                    //             <tr>
                    //                 <td colSpan={columns.length}>Loading data...</td>
                    //             </tr>
                    //         )}
                    //     </tbody>
                    // </table>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th onClick={() => {
                                    let nextOrder = "asc";
                                    if (sortOrder === "asc") nextOrder = "dsc";
                                    else if (sortOrder === "dsc") nextOrder = null;
                                    handleSorting("id", nextOrder);
                                }}>
                                </th>
                                <th>
                                    <input
                                        id={`product-filter-model-sr-no-id}`}
                                        type="text"
                                        placeholder="Search model..."
                                        value={modelSrNoFilter}
                                        onChange={(e) => setModelSrNoFilter(e.target.value)}
                                        className="table-filter-input"
                                    />
                                </th>
                                <th>
                                <input
                                                    id={`module-name-filter-model-name`}
                                                    type="text"
                                                    placeholder="Search engine..."
                                                    value={modelNameFilter}
                                                    onChange={(e) => setModelNameFilter(e.target.value)}
                                                    className="table-filter-input"
                                                />
                                </th>
                                <th>
                                <input
                                                    id={`module-name-filter-user-name`}
                                                    type="text"
                                                    placeholder="Search engine..."
                                                    value={modelNameFilter}
                                                    onChange={(e) => setModelNameFilter(e.target.value)}
                                                    className="table-filter-input"
                                                />
                                </th>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <thead>
                            <tr className="data-table-header">
                                <th onClick={() => {
                                    let nextOrder = "asc";
                                    if (sortOrder === "asc") nextOrder = "dsc";
                                    else if (sortOrder === "dsc") nextOrder = null;
                                    handleSorting("id", nextOrder);
                                }}>Model ID</th>
                                <th>Model Sr No</th>
                                <th>Model Name</th>
                                <th>User Name</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>No of Serial</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8">Loading...</td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((row) => (
                                    <tr key={row.id} className="data-table-row">
                                        <td className="data-table-cell">{row.id}</td>
                                        <td className="data-table-cell">{row.modelSrNo}</td>
                                        <td className="data-table-cell">{row.modelName}</td>
                                        <td className="data-table-cell">{row.userName}</td>
                                        <td className="data-table-cell">{row.min}</td>
                                        <td className="data-table-cell">{row.max}</td>
                                        <td className="data-table-cell">{row.noOfSrNoAtTime}</td>
                                        <td className="data-table-cell">
                                            <div className="flex gap-2" style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                                padding: "0",
                                                gap: "10px",
                                            }}>
                                                {
                                                    (issuedModel === row.id || issuedModel === 0 || issuedModel === -1) ?
                                                        <button
                                                            className="btn-edit"
                                                            style={
                                                                {
                                                                    background: issuedModel === row.id ?"#5d5d5d45" : "#1976D245",
                                                                    color: issuedModel === row.id ? "#5d5d5d" : "#1976D2",
                                                                    padding: "3px 7px",
                                                                    borderRadius: "4px",
                                                                    cursor: issuedModel === row.id ? "default" : "pointer",
                                                                    border: issuedModel === row.id ? "2px solid #5d5d5d" : "2px solid #1976D2",
                                                                    fontWeight: "700",
                                                                    width: "70px",
                                                                    opacity: issuedModel == row.id ? "60%" : "100%",
                                                                }
                                                            }
                                                            // disabled={row.id === issuedModel}
                                                            onClick={issuedModel === row.id ? () => undefined : () => handleIssueChange(row.id)}
                                                        >
                                                            {

issuedModel === row.id ?
                                                                "ISSUED" : "ISSUE"
                                                            }
                                                        </button>
                                                        : <button
                                                            className="btn-edit"
                                                            style={{
                                                                opacity: "40%",
                                                                cursor: "default",
                                                                background: "#5d5d5d45",
                                                                color: "#5d5d5d",
                                                                border: "none",
                                                                padding: "3px 7px",
                                                                borderRadius: "4px",
                                                                cursor: "pointer",
                                                                border: "2px solid #5d5d5d",
                                                                fontWeight: "700",
                                                                cursor: "default",
                                                                    width: "70px"
                                                            }
                                                            }
                                                            disabled={row.id == issuedModel}
                                                        >
                                                            {
                                                            issuedModel === row.id ?
                                                                "ISSUED" : "ISSUE"
                                                            }
                                                        </button>
                                                }
                                                <button
                                                    className="btn-edit"
                                                    style={issuedModel === row.id ? {
                                                        background: "#c6ac0045",
                                                        color: "#c6ac00",
                                                        border: "none",
                                                        padding: "3px 7px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        border: "2px solid #c6ac00",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
                                                    } : {
                                                        opacity: "40%",
                                                        background: "#5d5d5d45",
                                                        color: "#5d5d5d",
                                                        border: "none",
                                                        padding: "3px 7px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        border: "2px solid #5d5d5d",
                                                        fontWeight: "700",
                                                        cursor: "default",
                                                    }
                                                    }
                                                    onClick={issuedModel === row.id ? () => setIssuedModel(-1) : () => undefined}
                                                >
                                                    STOP
                                                </button>
                                                <button
                                                    className="btn-edit"
                                                    style={{
                                                        background: "#4CAF50",
                                                        background: "#4CAF5055",
                                                        color: "#4CAF50",
                                                        border: "none",
                                                        padding: "3px 7px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        border: "2px solid #4CAF50",
                                                        fontWeight: "700"
                                                    }}
                                                    onClick={() => handleOpen(row)}
                                                >
                                                    EDIT
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    style={{
                                                        background: "#F4433655",
                                                        color: "#F44336",
                                                        border: "none",
                                                        padding: "3px 7px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        border: "2px solid #F44336",
                                                        fontWeight: "700"
                                                    }}
                                                    onClick={() => handleDelete(row)}
                                                >
                                                    DELETE
                                                </button>
                                                {/* {
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
                        } */}

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8">No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )
            }

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
            <Modal open={open} onClose={handleClose}>
                <Box sx={{ p: 3, backgroundColor: "white", width: 800, margin: "10px auto", borderRadius: 2, translate: "translate(-50%, -50%)" }}>
                    <h3>Edit Product Model</h3>
                    {/* <input type="text" name="" id={selectedRow.id + ""} value={selectedRow.modelSrNo} /> */}
                    <Box mt={2} sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1 }}>
                        <div className="createRecipeFormContainer">
                            <div className="createRecipeInputsContainer">
                                <div className="createRecipeInputContainer">
                                    <label htmlFor="username">User name</label>
                                    <input type="text" name="username" className="createRecipeInput" placeholder="Enter Product name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                                    <b style={{ color: userName === "" ? 'red' : "transparent", fontSize: "13px", fontWeight: "500", userSelect: "none" }}>
                                        User name must not be empty
                                    </b>
                                </div>
                                <div className="createRecipeInputContainer">
                                    <label htmlFor="modelname">Product name</label>
                                    <input type="text" name="modelname" className="createRecipeInput" placeholder="Enter Product name" value={modelName} onChange={(e) => setModelName(e.target.value)} />
                                    <b style={{ color: modelName === "" ? 'red' : "transparent", fontSize: "13px", fontWeight: "500", userSelect: "none" }}>
                                        Product name must not be empty
                                    </b>
                                </div>
                            </div>
                            <div className="createRecipeInputsContainer">
                                <div className="createRecipeInputContainer">
                                    <label htmlFor="max">Max Serial Number</label>
                                    <input type="number" name="max" className="createRecipeInput" placeholder="Enter Product name" value={max} onChange={(e) => setMax(e.target.value)} />
                                    <b style={{ color: max <= 0 ? 'red' : "transparent", fontSize: "13px", fontWeight: "500", userSelect: "none" }}>
                                        Enter valid MAX value between (3, 99999999999)
                                    </b>
                                </div>
                                <div className="createRecipeInputContainer">
                                    <label htmlFor="count">Serial numbers at a time</label>
                                    <input type="number" name="count" className="createRecipeInput" placeholder="Enter Product name" value={count} onChange={(e) => setCount(e.target.value)} />
                                    <b style={{ color: count <= 0 || count > 99 ? 'red' : "transparent", fontSize: "13px", fontWeight: "500", userSelect: "none" }}>
                                        Enter valid value between (1, 99)
                                    </b>
                                </div>
                                {/* <div className="form-input-cont create-new-recipe-button">
                                    <input type="button" className="login-submit-button" style={(userName == "" || modelName == '' || min <= 0 || max <= 0) ? { backgroundColor: "grey", cursor: "default" } : { backgroundColor: "#0c82ee", cursor: "pointer", }} value={loading ? "" : "Create a new recipe"} onClick={(userName == "" || modelName == '' || min <= 0 || max <= 0) ? () =>
                                        undefined : () => handleSubmit()
                                    } />
                                    {
                                        loading ? <SpinLoader /> : <></>
                                    }
                                </div> */}
                            </div>
                        </div>
                        <Button variant="outlined" color="primary" onClick={() => handleSubmit()}>
                            Submit
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleClose}>
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
};

export default ModelTable;