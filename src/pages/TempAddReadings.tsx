import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import SpinLoader from "../components/SpinLoader.tsx";
import { useNavigate } from "react-router-dom";

const TempAddReading = () => {
  const [user, setUser] = useState();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  // Mock fallback if API fails
  const mockModules = [
    { id: 1, name: "Temperature Module" },
    { id: 2, name: "Pressure Module" },
  ];

  const mockProducts = [
    { id: 1, name: "Product A" },
    { id: 2, name: "Product B" },
  ];

  const mockParameters = [
    { id: 101, name: "Temperature" },
    { id: 102, name: "Humidity" },
  ];

  // Fetch user and initialize data
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/users/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log(res.data);
        setUser(res.data.user);
        if (res.data.user.type === "4") {
          navigate("/admin");
        }
      })
      .catch((err) => {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/login");
      });
    retriveData();
    retriveProducts();
  }, []);

  useEffect(() => {
    if (selectedModule?.id) {
      retriveParameters(selectedModule.id);
    }
  }, [selectedModule]);

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

  const retriveParameters = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/parameter/${id}`
      );
      setParameters(res.data);
    } catch (error) {
      console.warn("Using mock parameters due to API error.");
      setParameters(mockParameters);
    } finally {
      setLoading(false);
    }
  };

  const retriveData = async () => {
    setLoading(true);
    try {
    //   if (!user?.id) return;
    const userId = await localStorage.getItem("userId");
      const res = await axios.get(
        `http://localhost:5000/api/users/module/${userId}`
      );
      console.log(res.data);
      
      setModules(res.data);
    } catch (error) {
      console.warn("Using mock modules due to API error.");
      console.error(error);
      
      setModules(mockModules);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedModule || !selectedParameter || !selectedProduct || !value) {
      alert("Please fill all fields!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/users/reading", {
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        parameterId: selectedParameter.id,
        parameterName: selectedParameter.name,
        productId: selectedProduct.productId,
        value: value.toString(),
      });
      console.log(res);
      alert("Success!");
    } catch (e) {
      console.error(e);
      alert("Submission failed. Check console for errors.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = async (value) => {
    setSelectedProductId(value);
    setSelectedProduct(products.find((p) => p.productId == value));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "600px",
          gap: "20px",
        }}
      >
        {/* Product Dropdown */}
        <label>
          Product:
          <select
            value={selectedProductId || ""}
            onChange={(e) =>
              handleProductChange(e.target.value)
            }
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product.productId} value={product.productId}>
                {product.productId}
              </option>
            ))}
          </select>
        </label>

        {/* Module Dropdown */}
        <label>
          Module:
          <select
            value={selectedModule?.id || ""}
            onChange={(e) =>
              setSelectedModule(modules.find((m) => m.id == e.target.value))
            }
          >
            <option value="">Select Module</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
        </label>

        {/* Parameter Dropdown */}
        <label>
          Parameter:
          <select
            value={selectedParameter?.id || ""}
            onChange={(e) =>
              setSelectedParameter(
                parameters.find((param) => param.id == e.target.value)
              )
            }
            disabled={!selectedModule}
          >
            <option value="">Select Parameter</option>
            {parameters.map((param) => (
              <option key={param.id} value={param.id}>
                {param.name}
              </option>
            ))}
          </select>
        </label>

        {/* Value Input */}
        <label>
          Value:
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
          />
        </label>

        <button
          onClick={handleSubmit}
          style={{
            padding: "10px",
            backgroundColor: "blue",
            color: "white",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </div>

      {/* Loader */}
      <Modal open={loading} aria-labelledby="modal-modal-title">
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "auto",
            height: "auto",
            backgroundColor: "transparent",
            p: 4,
          }}
        >
          <SpinLoader />
        </Box>
      </Modal>
    </div>
  );
};

export default TempAddReading;