import React, { use, useState } from "react"
import SpinLoader from "./SpinLoader.tsx"
import axios from "axios";
import { useNavigate } from "react-router-dom";


const CreateRecipe = () => {
    const [loading, setLoading] = useState(false);
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(5);
    const [count, setCount] = useState(1);
    const [modelName, setModelName] = useState("");
    const [userName, setUserName] = useState("");


  const navigate = useNavigate();


    const getSrNo = () => {
        const now = new Date();
  
        // Format date and time
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear()).slice(-2); // last two digits of year
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
      
        // Convert seconds + milliseconds into 3 alphabetic characters
        const seconds = now.getSeconds();
        return `${year}${month}${day}${hours}${minutes}${seconds}`
    }

    const handleSubmit = async () => {
        if(modelName === "" || userName === "" || min <=0 || count <= 0 ) {
            alert("Plase fill all details correctly!");
        }
        try {
            setLoading(true);
            const res = await axios.post("http://localhost:5000/api/Users/model", {
                UserName: userName,
                ModelName: modelName,
                LastSrNo: min,
                Min: min,
                Max: max,
                NoOfSrNoAtTime: count,
                ModelSrNo: getSrNo().toString(),
            });
            console.log(res.data);
            alert("New recipe successfully added!");
            // navigate("/dashboard");
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="createRecipeContainer">
            <div className="createRecipeTitle">Create a new recipe</div>
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
                        <label htmlFor="min">Min Serial Number</label>
                        <input type="number" name="min" className="createRecipeInput" placeholder="Enter Product name" value={min} onChange={(e) => setMin(e.target.value)} />
                        <b style={{ color: min <= 0 ? 'red' : "transparent", fontSize: "13px", fontWeight: "500", userSelect: "none" }}>
                            Enter valid MIN value between (1, 99999999997)
                        </b>
                    </div>
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
                    <div className="form-input-cont create-new-recipe-button">
                    <input type="button" className="login-submit-button" style={ (userName == "" || modelName == '' || min <= 0 || max <= 0) ? { backgroundColor: "grey", cursor: "default" } : { backgroundColor: "#0c82ee", cursor: "pointer", }} value={loading ? "" : "Create a new recipe"} onClick={(userName == "" || modelName == '' || min <= 0 || max <= 0) ? () =>
                         undefined : () => handleSubmit()
                    } />
                    {
                        loading ? <SpinLoader /> : <></>
                    }
                </div>
                </div>
            </div>
        </div>
    )
}

export default CreateRecipe;