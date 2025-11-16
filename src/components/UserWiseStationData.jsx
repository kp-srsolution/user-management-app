import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Button from '@mui/material/Button';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import SpinLoader from "../components/SpinLoader.tsx";
import SingleParameterReportDownload from "../components/SingleParameterReportDownload.js";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SaveIcon from '@mui/icons-material/Save';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from "../logo2.png";
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from "react-router-dom";

const UserWiseStationData = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [selectedTab, setSelectedTab] = useState(1);
    const [searchedString, setSearchedString] = useState("");
    const [selectedUser, setSelectedUser] = useState();
    const [parameters, setParameters] = useState([]);
    const [images, setImages] = useState([]);
    const [selectedOptionIdArray, setSelectedOptionIdArray] = useState(new Map());
    const [modules, setModules] = useState([]);
    const [expandedChip, setExpandedChip] = useState(null);
    const [open, setOpen] = useState(false);
    const [moduleName, setModuleName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingParameter, setIsLoadingParameter] = useState(false);
    const [selectedFile, setSelectedFile] = useState();

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '1px solid #000',
        boxShadow: 24,
        p: 4,
    };
    useEffect(() => {
        if (expandedChip !== null) {
            retriveParameters(expandedChip);
            retriveImages(expandedChip);
        }
    }, [isLoadingParameter]);

    const filteredUsers = useMemo(() => {
        if (!searchedString) return [];
        return users.filter((user) =>
            user.firstname.toLowerCase().includes(searchedString) ||
            user.lastname.toLowerCase().includes(searchedString) ||
            user.email.toLowerCase().includes(searchedString)
        );
    }, [users, searchedString]);

    const fetchUsers = async (type) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:5000/api/users/all`, {
                params: { type },
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            setUsers([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers(filter);
    }, [filter]);

    const retriveModuleData = async (user) => {
        try {
            const userId = user.id;
            const res = await axios.get(`http://localhost:5000/api/users/module/${userId}`);
            console.log(res);
            setModules(res.data);
        } catch (error) {
            console.log(error);
        }
    }

    const handleParameterChange = (parameterId, newValue, field) => {
        setParameters((prev) =>
            prev.map((p) =>
                p.id === parameterId ? { ...p, [field]: newValue } : p
            )
        );
    };

    const handleModuleChange = (moduleId, newName) => {
        setModules((prev) =>
            prev.map((p) =>
                p.id === moduleId ? { ...p, name: newName } : p
            )
        );
    };

    const handleAddParameter = async () => {
        let res;
        setIsLoading(true);
        try {
            res = await axios.post("http://localhost:5000/api/Users/parameter", {
                name: "Parameter",
                min: 1,
                max: 5,
                value: "string",
                moduleId: expandedChip,
            });
            console.log(res);
            let tempParameter = {
                id: res.data.parameterId,
                name: "Parameter",
                min: 1,
                max: 5,
                value: "string",
                moduleId: expandedChip,
            }
            setParameters((prev) => [...prev, tempParameter]);
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    }

    const handleApply = async (id) => {
        try {
            const parameter = parameters.find((p) => p.id === id);
            if (!parameter) return;

            const payload = {
                id: parameter.id,
                name: parameter.name,
                value: parameter.value,
                min: parameter.min,
                max: parameter.max,
            };

            await axios.put(
                `http://localhost:5000/api/users/parameter/${id}`,
                payload
            );

            alert("Changes saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save changes.");
        }
    };

    // Apply changes: call backend
    const handleApplyChanges = async (id) => {
        try {
            const module = modules.find((m) => m.id === id);
            if (!module) return;

            const payload = {
                id: module.id,
                name: module.name,
            };

            await axios.put(
                `http://localhost:5000/api/users/module/${id}`,
                payload
            );

            alert("Changes saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save changes.");
        }
    };

    const handleAddModule = async () => {
        try {
            setIsLoading(true);
            // console.log(moduleName, selectedUser.id);
            const res = await axios.post(`http://localhost:5000/api/users/module`, {
                name: moduleName,
                userId: selectedUser.id
            });
            console.log(res);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
            setOpen(false);
        }
    }

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const toggleChip = (chipId) => {
        if (chipId !== expandedChip) {
            retriveParameters(chipId);
            retriveImages(chipId);
        }
        setExpandedChip((prev) => (prev === chipId ? null : chipId));
    };

    useEffect(() => {
        retriveModuleData(selectedUser);
    }, [selectedUser, isLoading])


    const handleSearch = (str) => {
        setSearchedString(str.toLowerCase());
    };

    const handleUserListClick = async (user) => {
        setSearchedString("");
        setSelectedUser(user);
    }

    const handleDeleteParameter = async (paraId) => {
        if (!window.confirm("Are you sure you want to delete selected users?")) return;
        try {
            setIsLoadingParameter(true);
            let res = await axios.delete(`http://localhost:5000/api/users/parameter/${paraId}`);
            console.log(res);
            alert("Parameter deleted successfully!");
        } catch (error) {
            console.log(error);
            alert("There is an error while deleting the parameter, Please try again.");
        } finally {
            setIsLoadingParameter(false);
        }
    };

    const handleDeleteModule = async (modId) => {
        if (!window.confirm("Are you sure you want to delete selected users?")) return;
        try {
            setIsLoading(true);
            let res = await axios.delete(`http://localhost:5000/api/users/module/${modId}`);
            console.log(res);
            alert("Parameter deleted successfully!");
        } catch (error) {
            console.log(error);
            alert("There is an error while deleting the parameter, Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteImage = async (id) => {
        try {
            setIsLoadingParameter(true);
            const res = await axios.delete(`http://localhost:5000/api/Users/image/${id}`);
            console.log(res);
            alert("Selected image succssfully deleted!");
        } catch (err) {
            console.error(err);
            alert("Something is wrong, please perform the task after some time!");
        } finally {
            setIsLoadingParameter(false);
        }
    }

    const retriveParameters = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/users/parameter/${id}`);
            console.log(res);
            setParameters(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const retriveImages = async (moduleId) => {
        // if(moduleId === null || moduleId === 0) return;
        // setLoading(true);
        try {
            console.log("this is it");

            const res = await axios.get(`http://localhost:5000/api/Users/images/${moduleId}`);
            console.log(res);
            setImages(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            // setLoading(false);
        }
    }

    const handleImageUpload = async (e, moduleId) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoadingParameter(true);
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
                setIsLoadingParameter(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="choose-user-container">
            <div className="search-container">
                <input
                    type="text"
                    name="search-bar"
                    id="search-bar"
                    placeholder="Search using name or email address"
                    value={searchedString}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                <div className="search-results-container">
                    {searchedString && filteredUsers.length > 0 ? (
                        <ul>
                            {filteredUsers.map((user) => (
                                <li key={user.id} onClick={() => handleUserListClick(user)} style={{ padding: "6px", borderBottom: "1px solid #ddd", fontSize: "17px" }}>
                                    <strong>{user.firstname} {user.lastname}</strong> - {user.email} - {user.type === 1 ? "User" : user.type === 2 ? "Supervisor" : user.type === 3 ? "Manager" : "Admin"}
                                </li>
                            ))}
                        </ul>
                    ) : searchedString ? (
                        <p style={{ fontSize: "15px" }}>No results found</p>
                    ) : (
                        <ul>
                            {users.map((user) => (
                                <li key={user.id} style={{ listStyle: "none", padding: "6px", borderBottom: "1px solid #ddd", fontSize: "17px" }} onClick={() => handleUserListClick(user)}>
                                    <strong>{user.firstname} {user.lastname}</strong> - {user.email} - {user.type === 1 ? "User" : user.type === 2 ? "Supervisor" : user.type === 3 ? "Manager" : "Admin"}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {
                    selectedUser ? (
                        <>
                            <div style={{ padding: "6px", borderBottom: "1px solid #ddd" }}>
                                <strong>{selectedUser.firstname} {selectedUser.lastname}</strong> - {selectedUser.email} - {selectedUser.type === 1 ? "User" : selectedUser.type === 2 ? "Supervisor" : selectedUser.type === 3 ? "Manager" : "Admin"}
                            </div>
                            <div className="user-content adm-content">
                                <div className="chips-container">
                                    {modules && modules.length > 0 && modules.map((module) => (
                                        <div
                                            key={module.id}
                                            className={`chip adm-chip ${expandedChip === module.id ? "expanded" : ""}`}
                                        >
                                            <div
                                                className="chip-header adm-chip-header"
                                                onClick={() => toggleChip(module.id)}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    margin: "5px 10px"
                                                }}>
                                                    <label htmlFor={`moduleName${module.id}`}>Station Name</label>
                                                    <input
                                                        type="text"
                                                        className="module-name"
                                                        style={{
                                                            margin: "5px 0px",
                                                            zIndex: "100",
                                                        }}
                                                        name={`moduleName${module.id}`}
                                                        id={`moduleName${module.id}`}
                                                        value={module.name}
                                                        onChange={(e) => handleModuleChange(module.id, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}   // 👈 prevent toggle when editing
                                                    />
                                                </div>
                                                <div
                                                    className="open-close-icon"
                                                    style={{
                                                        margin: "10px 10px",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        gap: "10px"
                                                    }}
                                                >
                                                    {/* <ModuleReportDownload user={selectedUser} module={module} parameters={parameters} /> */}
                                                    <Button
                                                        className="delete-module-btn"
                                                        style={{ backgroundColor: "#007BFF", color: "#f7f7f7" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();   // 👈 prevent toggle when clicking button
                                                            handleApplyChanges(module.id);
                                                        }}
                                                    ><SaveIcon /></Button>
                                                    <Button
                                                        className="delete-module-btn"
                                                        style={{
                                                            backgroundColor: "#D32F2F",
                                                            color: "#f8f8f8"
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();   // 👈 prevent toggle when clicking button
                                                            handleDeleteModule(module.id);
                                                        }}
                                                    > <DeleteForeverIcon /></Button>
                                                    {expandedChip === module.id ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                                                </div>
                                            </div>

                                            {expandedChip === module.id && (
                                                <div className="chip-content">
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                        gap: '20px',
                                                        maxWidth: '1100px',
                                                        margin: '10px auto',
                                                    }}>
                                                        {images.map(img => (
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
                                                                    <p style={{ fontSize: '14px', marginBottom: '8px' }}>{img.fileName}</p>
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
                                                        {/* <Form.Label>Default file input example</Form.Label> */}
                                                        <Form.Control type="file" style={{ fontSize: "17px" }} onChange={(e) => handleImageUpload(e, expandedChip)} />
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
                                                                    <label htmlFor={'paramValue' + parameter.id}>Parameter Value</label>
                                                                    <input type="text" name={'paramValue' + parameter.id} id={'paramValue' + parameter.id} value={parameter.value} onChange={(e) =>
                                                                        handleParameterChange(parameter.id, e.target.value, "value")
                                                                    } />
                                                                </div> <div style={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                }}>
                                                                    <label htmlFor={'paramMin' + parameter.id}>Min Value</label>
                                                                    <input type="text" name={'paramMin' + parameter.id} id={'paramMin' + parameter.id} value={parameter.min} onChange={(e) =>
                                                                        handleParameterChange(parameter.id, e.target.value, "min")
                                                                    } />
                                                                </div> <div style={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                }}>
                                                                    <label htmlFor={'paramMax' + parameter.id}>Max value</label>
                                                                    <input type="text" name={'paramMax' + parameter.id} id={'paramMax' + parameter.id} value={parameter.max} onChange={(e) =>
                                                                        handleParameterChange(parameter.id, e.target.value, "max")
                                                                    } />
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
                                                                <Button type="button"
                                                                    onClick={() => {
                                                                        console.log(`Apply clicked for parameter ${parameter.id}`);
                                                                        handleApply(parameter.id);
                                                                    }} style={{ backgroundColor: "#89BF04", color: "#efefef", cursor: "pointer", }}
                                                                >
                                                                    <SaveIcon />
                                                                </Button>
                                                                <Button type="button"
                                                                    onClick={() => {
                                                                        console.log(`Apply clicked for parameter ${parameter.id}`);
                                                                        handleDeleteParameter(parameter.id);
                                                                    }} style={{
                                                                        backgroundColor: "#C62828",
                                                                        color: "#efefef", cursor: "pointer"
                                                                    }}
                                                                >
                                                                    <DeleteForeverIcon />
                                                                </Button>
                                                                <SingleParameterReportDownload parameter={parameter} user={selectedUser} module={module} />
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
                                            )}
                                        </div>
                                    ))}
                                    <input type="button" value="ADD STATION" className="add-module-button" onClick={handleOpen} />
                                </div>
                            </div>
                            <Modal
                                open={open}
                                onClose={handleClose}
                                aria-labelledby="modal-modal-title"
                                aria-describedby="modal-modal-description"
                            >
                                <Box sx={style}>
                                    <Typography id="modal-modal-title" variant="h6" component="h2">
                                        ADD PARAMETER
                                    </Typography>
                                    <div id="modal-modal-description" sx={{ mt: 2 }}>
                                        <div className="add-module-form-container">
                                            <label htmlFor="module-name">Module Name</label>
                                            <input type="text" name="module-name" id="input-module-name" onChange={(e) => setModuleName(e.target.value)} placeholder="Enter module name" />
                                        </div>
                                    </div>
                                    <Button className="input" style={
                                        {
                                            padding: "10px 9px",
                                            margin: "5px 5px 5px 0",
                                            borderRadius: "5px",
                                            border: "1px solid #c1c1c1",
                                        }
                                    } onClick={() => handleAddModule()}>Add Station</Button>
                                </Box>
                            </Modal>
                            <Modal
                                open={isLoading}
                                // onClose={handleClose}
                                aria-labelledby="modal-modal-title"
                                aria-describedby="modal-modal-description"
                            >
                                <Box sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: "auto",
                                    height: "auto",
                                    p: 4,
                                }}>
                                    <SpinLoader />
                                </Box>
                            </Modal>
                        </>
                    ) : (<>
                    </>)
                }
            </div>
        </div>
    );
}

export default UserWiseStationData;