// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropDown';
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import { GenerateUniqueProductIds } from "../utils/GenerateUniqueProductIds.js"
import TableComponent from "../components/TableComponentReadings.jsx";
import logo from "../logo4.png";
import { Modal, Box } from "@mui/material";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReadingsReport from "../components/ReadingsReport.js";
import { useNavigate } from "react-router-dom";
import DockIcon from '@mui/icons-material/Dock';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SettingsIcon from '@mui/icons-material/Settings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AllStationTable from "../components/AllStationTable.jsx";
import UserWiseStationData from "../components/UserWiseStationData.jsx"
import ModelTable from "../components/ModelTable.jsx";
import OutdoorGrillIcon from '@mui/icons-material/OutdoorGrill';
import CreateRecipe from "../components/CreateRecipe.jsx";
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import SpinLoader from "../components/SpinLoader.tsx"
import ImageUpload from "../components/ImgUpload.jsx";
import StationWiseParameterData from "../components/StationWiseParameterData.jsx";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedChip, setExpandedChip] = useState(null);
  const [modules, setModules] = useState([]);
  const [products, setProducts] = useState();
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(7);
  const [selectedUser, setSetlectedUser] = useState({
    "id": 11,
  })


  const navigate = useNavigate();

  const style = {
    width: 600,
    p: 4,
  };

  const retriveData = async () => {
    try {
      setLoading(true);
      const userId = await localStorage.getItem("userId");
      const res = await axios.get(`http://localhost:5000/api/users/module/${userId}`);
      console.log(res);
      setModules(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const retriveProducts = async () => {
    const userId = await localStorage.getItem("userId");
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/product/${userId}`
      );
      console.log(res.data);
      setProducts(res.data);
    } catch (e) {
      console.warn("Using mock products due to API error.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found. Please login.");
      setLoading(false);
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/users/verify", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
        if (res.data.user.type === "4") {
          navigate("/admin");
        }
      })
      .catch((err) => {
        setError("Session expired or invalid token. Please login again.");
        setLoading(false);
        localStorage.removeItem("token");
        navigate("/login");
      });

    retriveData();
    retriveProducts();
  }, []);



  if (loading) return <p>Loading dashboard...</p>;

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const handleCreateProduct = async () => {
    // console.log(GenerateUniqueProductIds());
    try {
      const productId = GenerateUniqueProductIds();
      const res = await axios.post(
        "http://localhost:5000/api/Users/product",
        {
          productId: productId,
          userId: user.id,
        }
      )
      console.log(res.data);
      alert("New product Added successfully!");
    } catch (error) {
      console.error(error);
      alert("Error occurred during creating a new product!")
    }
  };

  const retriveDataFromModuleAndProduct = async (value) => {
    if (value == null) return;
    let temp = modules;
    try {
      setLoading(true);
      for (let i = 0; i < modules.length; i++) {
        let res = await axios.get(`http://localhost:5000/api/Users/reading/${value}/${modules[i].id}
`);
        let result = await axios.get(`http://localhost:5000/api/Users/images/${modules[i].id}`);
        console.log(res.data);
        console.log(result.data);
        temp[i].readings = res.data;
        temp[i].images = result.data;
      }
      setModules(temp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }

  }

  const handleTabChange = async (num) => {
    if (num !== activeTab) {
      setActiveTab(num);
    }
  };

  const handleProductChange = async (value) => {
    setSelectedProductId(value);
    setSelectedProduct(products.find((p) => p.productId == value));
    retriveDataFromModuleAndProduct(value)
  }

  const handleOpen = () => {
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  }

  const CreateStation = () => {
    const [stationType, setStationType] = useState("norm");
    const [superModules, setSuperModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [moduleName, setModuleName] = useState("");

    const fatchOnlySuperModules = async () => {
      const res = await axios.get("http://localhost:5000/api/Users/getOnlySuperModules");
      console.log(res.data);
      setSuperModules(res.data);
    };

    const handleAddModule = async () => {
      try {
        setIsLoading(true);
        // console.log(moduleName, selectedUser.id);
        let res;
        if (stationType === "super") {
          res = await axios.post(`http://localhost:5000/api/users/module`, {
            name: moduleName,
            userId: selectedUser.id,
            superModuleId: 0,
            isThisSuper: true
          });
        } else if (stationType === "sub") {
          res = await axios.post(`http://localhost:5000/api/users/module`, {
            name: moduleName,
            userId: selectedUser.id,
            superModuleId: selectedModule,
            isThisSuper: false
          });
        } else {
          res = await axios.post(`http://localhost:5000/api/users/module`, {
            name: moduleName,
            userId: selectedUser.id,
            superModuleId: 0,
            isThisSuper: false
          });
        }
        console.log(res);
        alert("Module Successfully Added!");
        setActiveTab(1);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }


    const handleChange = (event) => {
      console.log(event.target.value);
      setSelectedModule(event.target.value);
    };

    useEffect(() => {
      if (stationType === "sub") {
        fatchOnlySuperModules();
      }
    }, [stationType])

    return (
      <div className="create-station-container">
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2" style={{
            fontWeight: 600,
          }}>
            ADD STATION
          </Typography>
          {
            isLoading ? <SpinLoader /> : (
              <>
              <div id="modal-modal-description" sx={{ mt: 2 }}>
            <FormControl style={{ marginTop: "10px", width: "100%" }}>
              <FormLabel id="demo-radio-buttons-group-label">Enter Station Name</FormLabel>
              <input type="text" name="module-name" value={moduleName} id="input-module-name" onChange={(e) => setModuleName(e.target.value)} placeholder="Enter Station name" />
              <FormLabel id="demo-radio-buttons-group-label">Select Station Type</FormLabel>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue="norm"
                name="radio-buttons-group"
                value={stationType}
                onChange={(e) => {
                  console.log(e.target.value);
                  setStationType(e.target.value);
                }}
              >
                <FormControlLabel value="norm" control={<Radio />} label="Normal Station" />
                <FormControlLabel value="super" control={<Radio />} label="Super Station" />
                <FormControlLabel value="sub" control={<Radio />} label="Sub Station" />
              </RadioGroup>
            </FormControl>
            {
              stationType === "sub" && superModules && superModules.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel id="supermodule-select-label">Super Module</InputLabel>
                  <Select
                    labelId="supermodule-select-label"
                    id="supermodule-select"
                    value={selectedModule}
                    label="Super Module"
                    onChange={handleChange}
                  >
                    {superModules.map((module) => (
                      <MenuItem key={module.id} value={module.id}>
                        {module.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )
            }
          </div>
          {
            stationType === "sub" ?
              <Button variant="contained" className="input" style={
                {
                  padding: "10px 9px",
                  margin: "10px 5px 5px 0",
                  borderRadius: "5px",
                  border: "1px solid #c1c1c1",
                }
              }
                disabled={moduleName === "" || selectedModule === ""}
                onClick={() => handleAddModule()}>Add Station</Button>
              :
              <Button variant="contained" className="input" style={
                {
                  padding: "10px 9px",
                  margin: "10px 5px 5px 0",
                  borderRadius: "5px",
                  border: "1px solid #c1c1c1",
                }
              }
                disabled={moduleName === ""}
                onClick={() => handleAddModule()}>Add Station</Button>
          }</>
            )
          }
        </Box>
      </div>
    );
  }


  return (
    <div className="main-container">
      <div className="user-dashboard-container" style={{
        paddingBottom: "150px"
      }}>
        <nav className="admin-nav-bar" style={{ position: "fixed", left: 0, zIndex: "100" }}>
          <div className="admin-nav-content-container">
            <div className="admin-nav-logo-container">
              <img src={logo} alt="Dashboard" style={{
                width: "auto",
                height: "60px",
                borderRadius: "9px"
              }} />
            </div>
            <div className="admin-nav-option-container">
              <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", color: "red", cursor: "pointer", fontSize: "18px", fontWeight: "600" }} onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}>LOGOUT <LogoutIcon style={{ marginLeft: "5px", fontSize: "17px", fontWeight: "700" }} /></div>
            </div>
          </div>
        </nav>
        <div className="left-sided-tabs-container">
          <div className="left-sided-tabs-label">PRODUCT & MODEL</div>
          <div className={activeTab === 3 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(3)}><PrecisionManufacturingIcon className="left-sided-tab-icon" />Model Data</div>
          <div className={activeTab === 9 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(9)}><OutdoorGrillIcon className="left-sided-tab-icon" />Create New Recipe</div>
          <div className={activeTab === 7 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(7)}><PrecisionManufacturingIcon className="left-sided-tab-icon" />Products' readings</div>
          <div className={activeTab === 8 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(8)}><SummarizeIcon className="left-sided-tab-icon" />Product Wise Data report</div>

          <div className="left-sided-tabs-label">STATION</div>
          <div className={activeTab === 1 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(1)}><DockIcon className="left-sided-tab-icon" />All Stations</div>
          <div className={activeTab === 10 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(10)}><AddBoxIcon className="left-sided-tab-icon" />Create Stations</div>
          <div className={activeTab === 2 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(2)}><ManageAccountsIcon className="left-sided-tab-icon" />User wise Station Data</div>
          <div className={activeTab === 4 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(4)}><SummarizeIcon className="left-sided-tab-icon" />All Station Data Report</div>

          <div className="left-sided-tabs-label">PARAMETER</div>
          <div className={activeTab === 5 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(5)}><SettingsIcon className="left-sided-tab-icon" />Station wise Parameter Data</div>
          <div className={activeTab === 6 ? "left-sided-tab left-sided-active-tab" : "left-sided-tab"} onClick={() => handleTabChange(6)}>< AddBoxIcon style={{ fontSize: "22px" }} className="left-sided-tab-icon" />Add Parameter</div>
        </div>
        <div style={{
          marginTop: "70px"
        }}></div>
        <div className="user-container-dashboard">
          {
            activeTab === 1 ?
              <AllStationTable /> : activeTab === 2 ? (<div style={{
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingLeft: "20px"
              }}><UserWiseStationData /></div>) : activeTab === 8 ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignContent: "flex-start",
                  paddingLeft: "20px",
                  paddingTop: "20px"
                }}>
                  <h3>Download Product Data</h3>
                  <Box mt={2} sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1 }}>
                    {/* Product Dropdown */}
                    <label>
                      Select Product:
                      <select
                        value={selectedProductId || ""}
                        className="report-download-otipn-select"
                        onChange={(e) =>
                          handleProductChange(e.target.value)
                        }
                      >
                        <option value="">Select Product</option>
                        {products && products.length > 0 && products.map((product) => (
                          <option key={product.productId} value={product.productId}>
                            {product.productId}
                          </option>
                        ))}
                      </select>
                    </label>
                    {
                      selectedProductId !== null && !loading ? <PDFDownloadLink
                        document={<ReadingsReport modules={modules} product={selectedProduct} />}
                        fileName={`product_${selectedProduct.productId}_report.pdf`}
                        style={{
                          textDecoration: "none",
                          padding: "8px 12px",
                          color: "#fff",
                          backgroundColor: "#007BFF",
                          borderRadius: "5px"
                        }}
                      >
                        {({ loading }) => (loading ? "Generating report..." : "Download Report")}
                      </PDFDownloadLink> : null
                    }
                    <div style={{ marginBottom: "30px" }}></div>
                  </Box>
                </div>)
                :
                activeTab === 3 ? <ModelTable /> : activeTab === 9 ? <CreateRecipe /> : activeTab === 10 ? <CreateStation /> : activeTab === 5 ? <StationWiseParameterData/> : <TableComponent />
          }
          <Modal open={open} onClose={handleClose}>
            <Box sx={{ p: 3, backgroundColor: "white", width: 300, margin: "100px auto", borderRadius: 2 }}>
              <h3>Download Product Data</h3>
              <Box mt={2} sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1 }}>
                {/* <div className="download-product-report-container">
                <div className="download-product-report-subcontainer"> */}
                {/* Product Dropdown */}
                <label>
                  Select Product:
                  <select
                    value={selectedProductId || ""}
                    className="report-download-otipn-select"
                    onChange={(e) =>
                      handleProductChange(e.target.value)
                    }
                  >
                    <option value="">Select Product</option>
                    {products && products.length > 0 && products.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.productId}
                      </option>
                    ))}
                  </select>
                </label>
                {/* </div>
              </div> */}
                {
                  selectedProductId !== null && !loading ? <PDFDownloadLink
                    document={<ReadingsReport modules={modules} product={selectedProduct} />}
                    fileName={`product_${selectedProduct.productId}_report.pdf`}
                    style={{
                      textDecoration: "none",
                      padding: "8px 12px",
                      color: "#fff",
                      backgroundColor: "#007BFF",
                      borderRadius: "5px"
                    }}
                  >
                    {({ loading }) => (loading ? "Generating report..." : "Download Report")}
                  </PDFDownloadLink> : null
                }
                <div style={{ marginBottom: "30px" }}></div>
                <Button variant="outlined" color="secondary" onClick={handleClose}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Modal>
        </div>
      </div>
    </div>
  );
}