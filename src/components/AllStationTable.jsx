import React, { useState, useEffect } from "react";
import axios from "axios";
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Modal, Box, TextField, Button } from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import Table from "react-bootstrap/Table";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from "@mui/icons-material/Add"
import FormLabel from '@mui/material/FormLabel';
import SaveIcon from '@mui/icons-material/Save';
import Form from 'react-bootstrap/Form';


const AllStationTable = () => {
    const [data, setData] = useState([]); // fetched rows
    const [pageIndex, setPageIndex] = useState(0); // current page (0-based)
    const [pageSize, setPageSize] = useState(10); // rows per page
    const [totalRows, setTotalRows] = useState(0); // backend total rows
    const [loading, setLoading] = useState(false);
    const [userIdFilter, setUserIdFilter] = useState("");
    const [moduleIdFilter, setModuleIdFilter] = useState("");
    const [moduleNameFilter, setModuleNameFilter] = useState("");
    const [sortingCol, setSortingCol] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [open, setOpen] = useState(false);
    const [parameters, setParameters] = useState(null);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [isUpdate, setIsUpdate] = useState(false);
    const [images, setImages] = useState(null);
    const [imageUpdate, setImageUpdate] = useState(false);

    const toggleExpand = (rowId) => {
        setExpandedRowId((prev) => (prev === rowId ? null : rowId));
    };

    // Fetch data from API whenever pageIndex or pageSize changes
    useEffect(() => {
        const fetchData = async () => {
            console.log(moduleNameFilter);

            setLoading(true);
            try {
                const res = await axios.get("http://localhost:5000/api/Users/modules/paged", {
                    params: {
                        page: pageIndex + 1, // API is 1-based
                        pageSize: pageSize,
                        moduleIdFilter: moduleIdFilter || null,
                        moduleNameFilter: moduleNameFilter || null,
                        userIdFilter: userIdFilter || null,
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
    }, [pageIndex, pageSize, moduleIdFilter, sortOrder, sortBy, moduleNameFilter, userIdFilter, isUpdate]);

    const retriveImagesOutside = async (row) => {
        if (row === null || row.id === null || row.id === 0) return;
        setLoading(true);
        try {
            console.log("this is it");

            const res = await axios.get(`http://localhost:5000/api/Users/images/${row.id}`);
            console.log(res);
            setImages(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const retriveImages = async () => {
            if (selectedModule.id === null || selectedModule.id === 0) return;
            setLoading(true);
            try {
                console.log("this is it");

                const res = await axios.get(`http://localhost:5000/api/Users/images/${selectedModule.id}`);
                console.log(res);
                setImages(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (selectedModule !== null && selectedModule.id != null) {
            retriveImages();
        }
    }, [imageUpdate, selectedModule])

    const handleOpen = (row) => {
        setSelectedModule(row);
        retriveImagesOutside(row);
        setParameters(row.parameters || []);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setParameters([]);
    };

    // const handleEdit = async () => {
    //     try {
    //         setLoading(true);
    //         const res = await axios.put(`http://localhost:5000/api/Users/module/${selectedModule.id}`, {
    //             name: selectedModule.name
    //         })
    //         alert("Station data success saved.");
    //         setIsUpdate(true);
    //     } catch (e) {
    //         console.error(e);
    //     } finally {
    //         setLoading(false);
    //         handleClose();
    //     }
    // }

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

    const exportFilteredModulesToExcel = async () => {

        try {
            const res = await axios.get("http://localhost:5000/api/Users/getallmodules/paged", {
                params: {
                    moduleIdFilter: moduleIdFilter || null,
                    moduleNameFilter: moduleNameFilter || null,
                    userIdFilter: userIdFilter || null,
                    sortBy: sortBy || null,
                    sortOrder: (sortOrder === "dsc" ? "desc" : "asc") || null,
                },
            });
            res.data.data.forEach((module) => {
                // Add module header row
                data.push({
                    "Module ID": module.id,
                    "Module Name": module.name,
                    "User ID": module.userId,
                    "Parameter ID": "",
                    "Parameter Name": "",
                    "Value": "",
                    "Min": "",
                    "Max": ""
                });

                // Add parameters rows
                module.parameters.forEach((param) => {
                    data.push({
                        "Module ID": "",
                        "Module Name": "",
                        "User ID": "",
                        "Parameter ID": param.id,
                        "Parameter Name": param.name,
                        "Value": param.value,
                        "Min": param.min,
                        "Max": param.max
                    });
                });

                // Empty row for spacing between modules
                data.push({});
            });

            // Convert JSON to sheet
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Modules Report");

            // Write workbook and trigger download
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(blob, "Modules_Report.xlsx");
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (row) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete Station ID: ${row.id}?`);
        if (!confirmDelete) return;
        setLoading(true);
        try {
            const res = await axios.delete(`http://localhost:5000/api/Users/deleteSuperModule/${row.id}`);
            console.log(res);
            setIsUpdate((prev) => !prev);
            alert("Selected Station is deleted.");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleParameterChange = (parameterId, newValue, field) => {
        setParameters((prev) =>
            prev.map((p) =>
                p.id === parameterId ? { ...p, [field]: newValue } : p
            )
        );
    };

    const saveWholeModule = async () => {
        if (selectedModule === null) {
            handleClose();
            return;
        }

        // save changes of module
        try {
            setLoading(true);
            const res = await axios.put(`http://localhost:5000/api/Users/module/${selectedModule.id}`, {
                name: selectedModule.name
            })
            alert("Station name successfully edited.");
            setIsUpdate(true);
        } catch (e) {
            console.error(e);
        }

        if (selectedModule.parameters === null || selectedModule.parameters == []) {
            setLoading(false);
            handleClose();
            return;
        }
        // save change of all the Parameters
        try {
            let tempParameters = parameters;
            for (let i = 0; i < tempParameters.length; i++) {
                const tempParameter = tempParameters[i];

                const payload = {
                    id: tempParameter.id,
                    name: tempParameter.name,
                    value: tempParameter.value,
                    min: tempParameter.min,
                    max: tempParameter.max,
                };

                await axios.put(
                    `http://localhost:5000/api/users/parameter/${tempParameter.id}`,
                    payload
                );
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setIsUpdate((prev) => !prev);
            handleClose();
        }
    }

    const handleAddParameter = async () => {
        let res;
        setLoading(true);
        try {
            res = await axios.post("http://localhost:5000/api/Users/parameter", {
                name: "Parameter",
                min: 1,
                max: 5,
                value: "string",
                moduleId: selectedModule.id,
            });
            console.log(res);
            let tempParameter = {
                id: res.data.parameterId,
                name: "Parameter",
                min: 1,
                max: 5,
                value: "string",
                moduleId: selectedModule.id,
            }
            setParameters((prev) => [...prev, tempParameter]);
        } catch (e) {
            console.log(e);
        } finally {
            setIsUpdate((prev) => !prev);
            setLoading(false);

        }
    }

    const handleDeleteParameter = async (paraId) => {
        if (!window.confirm("Are you sure you want to delete selected users?")) return;
        try {
            setLoading(true);
            let res = await axios.delete(`http://localhost:5000/api/users/parameter/${paraId}`);
            console.log(res);
            alert("Parameter deleted successfully!");
        } catch (error) {
            console.log(error);
            alert("There is an error while deleting the parameter, Please try again.");
        } finally {
            setIsUpdate((prev) => !prev);
            handleClose();
            setLoading(false);
        }
    };
    const handleImageUpload = async (e, moduleId) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64String = reader.result.split(",")[1]; // remove metadata prefix
            const payload = {
                fileName: file.name,
                base64Data: base64String,
                moduleId,
            };

            try {
                await axios.post("http://localhost:5000/api/Users/upload", payload, {
                    headers: { "Content-Type": "application/json" },
                });
                alert("Base64 image uploaded successfully!");
                e.target.value = "";
            } catch (error) {
                console.error("Upload error:", error);
                alert("Failed to upload Base64 image.");
            } finally {
                retriveImagesOutside(selectedModule);
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteImage = async (id) => {
        try {
            setLoading(true);
            const res = await axios.delete(`http://localhost:5000/api/Users/image/${id}`);
            console.log(res);
            alert("Selected image succssfully deleted!");
        } catch (err) {
            console.error(err);
            alert("Something is wrong, please perform the task after some time!");
        } finally {
            retriveImagesOutside(selectedModule);
            setLoading(false);
        }
    }

    return (
        <div className="table-container" style={{
            width: "100%"
        }}>
            <Button
                variant="contained"
                color="primary"
                style={{ position: "fixed", bottom: "60px", right: "25px", width: "230px", padding: "10px 0" }}
                onClick={() => exportFilteredModulesToExcel()}
            >
                <DownloadIcon style={{ marginRight: "5px" }} /> Filtered Report
            </Button>
            <Button
                variant="contained"
                color="primary"
                style={{ position: "fixed", bottom: "115px", right: "25px", width: "230px", padding: "10px 0" }}
                onClick={() => console.log(12)}
            >
                <AddIcon style={{ marginRight: "5px" }} /> Create Station
            </Button>

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
                                id={`module-name-filter-User-name`}
                                type="text"
                                placeholder="Search engine..."
                                value={moduleNameFilter}
                                onChange={(e) => setModuleNameFilter(e.target.value)}
                                className="table-filter-input"
                            />
                        </th>
                        <th>
                            <input
                                id={`product-filter-user-id`}
                                type="text"
                                placeholder="Search model..."
                                value={userIdFilter}
                                onChange={(e) => setUserIdFilter(e.target.value)}
                                className="table-filter-input"
                            />
                        </th>
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
                        }}>ID</th>
                        <th>Station Name</th>
                        <th>User Id</th>
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
                            <React.Fragment key={row.id}>
                                {/* Normal row */}
                                <tr className={row.isThisSuper === true ? "data-table-super-row data-table-row" : "data-table-row"} style={
                                    row.isThisSuper === true ? {
                                        backgroundColor: "#f7edff",

                                    } : {}
                                }>
                                    <td className="data-table-cell">{row.id}</td>
                                    <td className="data-table-cell">{row.name}</td>
                                    <td className="data-table-cell">{row.userId}</td>
                                    <td className="data-table-cell">
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            {/* Always available */}
                                            {/* <button
                                                style={{
                                                    background: "#4CAF50",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "5px 10px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => handleOpen(row)}
                                            >
                                                Parameter Details
                                            </button> */}
                                            <button
                                                style={{
                                                    background: "#4CAF5045",
                                                    color: "#4CAF50",
                                                    border: "2px solid #4CAF50",
                                                    padding: "5px 10px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => handleOpen(row)}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                style={{
                                                    background: "#E6191C45",
                                                    color: "#E6191C",
                                                    border: "2px solid #E6191C",
                                                    padding: "5px 10px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => handleDelete(row)}
                                            >
                                                <DeleteForeverIcon />
                                            </button>

                                            {/* Only show if superModule */}
                                            {row.subModules && row.subModules.length > 0 && (
                                                <button
                                                    style={{
                                                        background: "#2196F345",
                                                        border: "2px solid #2196f3",
                                                        color: "#2196f3",
                                                        padding: "5px 10px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontWeight: "700"
                                                    }}
                                                    onClick={() => toggleExpand(row.id)}
                                                >
                                                    {expandedRowId === row.id ? "Hide Substations" : "View Substations"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded submodule table */}
                                {expandedRowId === row.id && row.subModules && (
                                    <tr>
                                        <td colSpan="4">
                                            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                                                <thead>
                                                    <tr style={{ background: "#f2f2f2" }}>
                                                        <th>Submodule ID</th>
                                                        <th>Submodule Name</th>
                                                        <th>User ID</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {row.subModules.map((sub) => (
                                                        <tr key={sub.id}>
                                                            <td>{sub.id}</td>
                                                            <td>{sub.name}</td>
                                                            <td>{sub.userId}</td>
                                                            <td>
                                                                <button
                                                                    style={{
                                                                        background: "#4CAF5045",
                                                                        color: "#4CAF50",
                                                                        border: "2px solid #4CAF50",
                                                                        padding: "5px 10px",
                                                                        borderRadius: "4px",
                                                                        cursor: "pointer",
                                                                        marginRight: "10px",
                                                                    }}
                                                                    onClick={() => handleOpen(sub)}
                                                                >
                                                                    <EditIcon />
                                                                </button>
                                                                <button
                                                                    style={{
                                                                        background: "#E6191C45",
                                                                        color: "#E6191C",
                                                                        border: "2px solid #E6191C",
                                                                        padding: "5px 10px",
                                                                        borderRadius: "4px",
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleDelete(sub)}
                                                                >
                                                                    <DeleteForeverIcon />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8">No records found</td>
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
                    Page {pageIndex + 1} of {Math.ceil(totalRows / pageSize)}
                </span>
                <button
                    onClick={() =>
                        setPageIndex((old) => (old < Math.ceil(totalRows / pageSize) - 1 ? old + 1 : old))
                    }
                    disabled={pageIndex >= Math.ceil(totalRows / pageSize) - 1}
                    className="pagination-button"
                    style={{ borderRadius: "50px" }}
                >
                    <ArrowBackIosNewIcon style={{ rotate: "180deg", fontSize: "18px" }} />
                </button>
                <button
                    onClick={() => setPageIndex(Math.ceil(totalRows / pageSize) - 1)}
                    disabled={pageIndex >= Math.ceil(totalRows / pageSize) - 1}
                    className="pagination-button"
                    style={{ borderRadius: "50px" }}
                >
                    <FirstPageIcon style={{ rotate: "180deg" }} />
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
                <Box sx={{ p: 3, backgroundColor: "white", width: 625, margin: "40px auto", borderRadius: 2, translate: "translate(-50%, -50%)", display: "flex", flexDirection: "column" }}>
                    <h2>Edit Station</h2>
                    {/* <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Parameter Id</th>
                                <th>Parameter Name</th>
                                <th>Value</th>
                                <th>Min</th>
                                <th>Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parameters && parameters.length > 0 && parameters.map((param) => (
                                <tr key={param.id}>
                                    <td>{param.id}</td>
                                    <td>{param.name}</td>
                                    <td>{param.value}</td>
                                    <td>{param.min}</td>
                                    <td>{param.max}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table> */}
                    <FormLabel id="demo-radio-buttons-group-label">Edit Station Name</FormLabel>
                    {
                        selectedModule ?
                            <input
                                type="text"
                                value={selectedModule.name || ""}
                                onChange={(e) => {
                                    setSelectedModule({
                                        ...selectedModule,
                                        name: e.target.value
                                    });
                                }}
                            /> : undefined
                    }
                    {
                        selectedModule && selectedModule.isThisSuper === true ?
                            <div className="chip-content">
                                Images
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                                    gap: '20px',
                                    maxWidth: '700px',
                                    margin: '10px auto',
                                }}>
                                    {images && images.map(img => (
                                        <div key={img.id} style={{
                                            border: '1px solid #ddd',
                                            padding: '10px',
                                            textAlign: 'left',
                                            borderRadius: '8px',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                gap: "10px",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                width: "100%",
                                            }}>
                                                <p style={{ fontSize: '12px', marginBottom: '8px' }}>{img.fileName.slice(0, 10) + "..." + img.fileName.slice(-4)}</p>
                                                <DeleteForeverIcon onClick={() => handleDeleteImage(img.id)} />
                                            </div>
                                            <img
                                                src={img.imageData}
                                                alt={img.fileName}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: '6px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Form.Group controlId="formFile" className="mb-3">
                                    <Form.Label>Default file input example</Form.Label>
                                    <Form.Control type="file" style={{ fontSize: "17px" }} onChange={(e) => handleImageUpload(e, selectedModule.id)} />
                                </Form.Group>
                            </div> :
                            <div className="chip-content">
                                Images
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                                    gap: '20px',
                                    maxWidth: '700px',
                                    margin: '10px auto',
                                }}>
                                    {images && images.map(img => (
                                        <div key={img.id} style={{
                                            border: '1px solid #ddd',
                                            padding: '10px',
                                            textAlign: 'left',
                                            borderRadius: '8px',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                gap: "10px",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                width: "100%",
                                            }}>
                                                <p style={{ fontSize: '12px', marginBottom: '8px' }}>{img.fileName.slice(0, 10) + "..." + img.fileName.slice(-4)}</p>
                                                <DeleteForeverIcon onClick={() => handleDeleteImage(img.id)} />
                                            </div>
                                            <img
                                                src={img.imageData}
                                                alt={img.fileName}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    borderRadius: '6px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Form.Group controlId="formFile" className="mb-3">
                                    <Form.Label>Default file input example</Form.Label>
                                    <Form.Control type="file" style={{ fontSize: "17px" }} onChange={(e) => handleImageUpload(e, selectedModule.id)} />
                                </Form.Group>
                                {parameters && parameters.length > 0 && parameters.map((parameter) => (
                                    <div
                                        key={parameter.id}
                                        className='parameter-container adm-parameter-container'
                                    >
                                        {/* Header */}
                                        <div className="parameter-header adm-parameter-header" style={{
                                            margin: "10px 10px",
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}>
                                                <label htmlFor={'parameter' + parameter.id}>Parameter Name</label>
                                                <input type="text" name={'parameter' + parameter.id} id={'parameter' + parameter.id} value={parameter.name} onChange={(e) =>
                                                    handleParameterChange(parameter.id, e.target.value, "name")
                                                } />
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}>
                                                <label htmlFor={'paramValue' + parameter.id}>Value</label>
                                                <input type="number" name={'paramValue' + parameter.id} id={'paramValue' + parameter.id} value={parameter.value} onChange={(e) =>
                                                    handleParameterChange(parameter.id, e.target.value, "value")
                                                } style={{
                                                    width: "85px"
                                                }} />
                                            </div> <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}>
                                                <label htmlFor={'paramMin' + parameter.id}>Min Value</label>
                                                <input type="number" name={'paramMin' + parameter.id} id={'paramMin' + parameter.id} value={parameter.min} onChange={(e) =>
                                                    handleParameterChange(parameter.id, e.target.value, "min")
                                                } style={{
                                                    width: "85px"
                                                }} />
                                            </div> <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}>
                                                <label htmlFor={'paramMax' + parameter.id}>Max value</label>
                                                <input type="number" name={'paramMax' + parameter.id} id={'paramMax' + parameter.id} value={parameter.max} onChange={(e) =>
                                                    handleParameterChange(parameter.id, e.target.value, "max")
                                                } style={{
                                                    width: "85px"
                                                }} />
                                            </div>
                                        </div>

                                        {/* <div className="parameter-body adm-parameter-body" style={{
                                        margin: "10px 0px 10px 50px"
                                      }}>
                                        {parameter.options && parameter.options.length > 0 && parameter.options.map((opt) => (
                                          <div key={opt.id} className="option-input-data-container">
                                            <input type="text" name="option-name" id={"name" + opt.id} value={opt.name} onChange={(e) =>
                                              handleOptionChange(parameter.id, opt.id, "name", e.target.value)
                                            } />
                                            <input type="text" name="option-value" id={"value" + opt.id} value={opt.value} onChange={(e) =>
                                              handleOptionChange(parameter.id, opt.id, "value", e.target.value)
                                            } />
                                            <input type="button" style={{ backgroundColor: "#C62828", color: "#efefef" }} value="DELETE" onClick={() => handleDeleteOption(opt.id)} />
                                          </div>
                                        ))}
                                        <input type="button" value="ADD OPTION" className="add-option-btn" onClick={() => handleAddOption(parameter.id)} />
                                      </div> */}
                                        {/* Tail: Apply button */}
                                        <div className="parameter-tail adm-parameter-tail">
                                            {/* <Button type="button"
                                        onClick={() => {
                                            // console.log(`Apply clicked for parameter ${parameter.id}`);
                                            console.log(`Apply clicked for parameter`);
                                            // handleApply(parameter.id);
                                        }} style={{ backgroundColor: "#89BF04", color: "#efefef", cursor: "pointer", }}
                                    >
                                        <SaveIcon />
                                    </Button> */}
                                            <button type="button"
                                                onClick={() => {
                                                    console.log(`Apply clicked for parameter ${parameter.id}`);
                                                    handleDeleteParameter(parameter.id);
                                                }} style={{
                                                    background: "#DC143C45",
                                                    border: "2px solid #DC143C",
                                                    color: "#DC143C",
                                                    padding: "5px 10px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontWeight: "700",
                                                    width: "50px",
                                                    height: "50px",
                                                }}
                                            >
                                                <DeleteForeverIcon />
                                            </button>
                                            {/* <SingleParameterReportDownload parameter={parameter} user={selectedUser} module={module} /> */}
                                        </div>
                                    </div>
                                ))}
                                <input type="button" value="ADD PARAMETER"
                                    onClick={() => handleAddParameter()}
                                    className="add-module-button" style={{
                                        margin: "10px 0 20px 0",
                                        width: "70%",
                                        cursor: "pointer",
                                        backgroundColor: "#3d3d3d",
                                        color: "#eee",
                                    }} />
                            </div>
                    }
                    <Box mt={2} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button variant="contained" color="primary" onClick={() => saveWholeModule()}>
                            {
                                selectedModule && selectedModule.isThisSuper ? "Save Changes" : "Save All Changes"
                            }
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

export default AllStationTable;