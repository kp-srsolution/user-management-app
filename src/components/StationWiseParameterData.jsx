import React, { useEffect, useState } from "react"
import axios from "axios";
import EditIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FirstPageIcon from '@mui/icons-material/FirstPage';

const StationWiseParameterData = () => {
    const [modules, setModules] = useState([]);
    const [parameters, setParameters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState(0);
    const [pageIndex, setPageIndex] = useState(0); // current page (0-based)
    const [pageSize, setPageSize] = useState(10); // rows per page
    const [totalRows, setTotalRows] = useState(0); // backend total rows
    const [editEnableArray, setEditEnableArray] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get("http://localhost:5000/api/users/getallmodules");
                console.log(res.data);
                setModules(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        const fetchParameters = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/users/parameter/${selectedModule}`);
                console.log(res.data);
                let temp = [];
                if (res.data != null && res.data.length > 0) {
                    for (let i = 0; i < res.data.length; i++) {
                        temp[res.data[i].id] = false;
                    }
                }
                setEditEnableArray(temp);
                setParameters(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (selectedModule !== 0)
            fetchParameters();
    }, [selectedModule])

    const fetchParameters = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/users/parameter/${selectedModule}`);
            console.log(res.data);
            let temp = [];
            if (res.data != null && res.data.length > 0) {
                for (let i = 0; i < res.data.length; i++) {
                    temp[res.data[i].id] = false;
                }
            }
            setEditEnableArray(temp);
            setParameters(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // const handleSorting = async (name, type) => {
    //     console.log(name, type);

    //     if (type == "asc" || type == "dsc") {
    //         if (name === "id")
    //             setSortBy("Id");
    //         // else if (name === "dateString")
    //         //     setSortBy("Date");
    //         else if (name === "name")
    //             setSortBy("ModuleName");
    //         else {
    //             setSortBy("UserId");
    //         }
    //         setSortingCol(name);
    //         setSortOrder(type);
    //     } else {
    //         setSortingCol("");
    //         setSortOrder("asc");
    //     }
    // }

    const handleSaveParam = async (row) => {
        try {
            setLoading(true);
            const res = await axios.put(`http://localhost:5000/api/users/parameter/${row.id}`, row);
            console.log(res.data);
            alert("Parameter Data saved succefully!");
            let temp = editEnableArray;
            temp[row.id] = false;
            setEditEnableArray(temp);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    const handleDeleteParam = async (row) => {
        try {
            if (!window.confirm("Are you sure you want to delete the selected parameter?")) return;
            setLoading(true);
            const res = await axios.delete(`http://localhost:5000/api/users/parameter/${row.id}`);
            console.log(res.data);
            fetchParameters();
            alert("Selected parameter Data deleted succefully!");
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
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
                moduleId: selectedModule,
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
            let temp = editEnableArray;
            temp[tempParameter.id] = false;
            setEditEnableArray(temp);
            setParameters((prev) => [...prev, tempParameter]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = (id, field, value) => {
        setParameters((prevParams) =>
            prevParams.map((param) =>
                param.id === id ? { ...param, [field]: value } : param
            )
        );
        if (editEnableArray[id] == false) {
            let temp = editEnableArray;
            temp[id] = true;
            setEditEnableArray(temp);
        }
    };

    const handleEditBtnClick = async () => {
        console.log("hello");
        
    }


    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            width: "95%",
            paddingLeft: "20px",
            minHeight: "100%",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <button
                color="primary"
                style={{ position: "fixed", bottom: "60px", right: "25px", width: "230px", padding: "10px 0", backgroundColor: "#3498db", color: "white", display: "flex", justifyContent: "center", alignContent: "center", fontWeight: "700", borderColor: "white" }}
                onClick={() => handleAddParameter()}
            >
                <AddIcon/>ADD PARAMETER
            </button>
            <div className="select-module-container">
                <label htmlFor="module-select">Select Module to View Parameters</label>
                <select
                    name="module-select"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(Number(e.target.value))}
                    className="page-size-select"
                >
                    <option value={0}>
                        Select Station
                    </option>
                    {modules && modules.length > 0 && modules.map((mod) => (
                        !mod.isThisSuper &&
                        <option key={mod.id} value={mod.id}>
                            {mod.name}
                        </option>
                    ))}
                </select>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>
                        </th>
                        <th>
                            <input
                                id={`module-name-filter-User-name`}
                                type="text"
                                placeholder="Search Parameter..."
                                // value={moduleNameFilter}
                                // onChange={(e) => setModuleNameFilter(e.target.value)}
                                className="table-filter-input"
                            />
                        </th>
                        <th>
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <thead>
                    <tr className="data-table-header">
                        <th>ID</th>
                        <th>Parameter Name</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8">Loading...</td>
                        </tr>
                    ) : parameters.length > 0 ? (
                        parameters.map((row) => (
                            <React.Fragment key={row.id}>
                                {/* Normal row */}
                                <tr className="data-table-row">
                                    <td className="data-table-cell">{row.id}</td>
                                    <td className="data-table-cell">
                                        <input type="text" className="input" value={row.name} onChange={(e) => handleEdit(row.id, "name", e.target.value)} /></td>
                                    <td className="data-table-cell">
                                        <input type="text" className="input" value={row.min} onChange={(e) => handleEdit(row.id, "min", e.target.value)} /></td>
                                    <td className="data-table-cell"><input type="text" className="input" value={row.max} onChange={(e) => handleEdit(row.id, "max", e.target.value)} /></td>
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
                                                    background: editEnableArray[row.id] ? "#4CAF5045":"#9d9d9d42",
                                                    color: editEnableArray[row.id] ? "#4CAF50": "#9d9d9d",
                                                    border: editEnableArray[row.id] ? "2px solid #4CAF50" : "2px solid #9d9d9d",
                                                    padding: "5px 10px",
                                                    borderRadius: "4px",
                                                    cursor: editEnableArray[row.id] ? "pointer": "default",
                                                }}
                                                onClick={editEnableArray[row.id] ? () => handleSaveParam(row) : undefined}
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
                                            onClick={() => handleDeleteParam(row)}
                                            >
                                                <DeleteForeverIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8">No records found</td>
                        </tr>
                    )}
                </tbody>
            </table>

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
        </div>
    );
}

export default StationWiseParameterData;