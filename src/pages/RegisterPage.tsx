import React, { useState, useEffect } from 'react';
import '../CSS/style.css';
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import SpinLoader from "../components/SpinLoader.tsx"

const RegisterPage = () => {

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(1);
  const [passwordValid, setPasswordValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  const navigate = useNavigate();

  useEffect(
    () => {
      const token = localStorage.getItem("token");

      if (token) {
        navigate("/dashboard");
      }
    }, []);

  const validatePassword = (pw) => {
    // Regex for 8+ characters, mix of letters, numbers, and symbols
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}[\]|:;"'<>,.?/~`]).{8,}$/;
    return regex.test(pw);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordValid(validatePassword(newPassword));
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailValid(validateEmail(newEmail));
  };

  const handleRoles = (count) => {
    if (count === 1) {
      if (role !== count) {
        setRole(count);
      }
    } else if (count === 2) {
      if (role !== count) {
        setRole(count);
      }
    } else if (count === 3) {
      if (count !== role) {
        setRole(count);
      }
    }
  }

  const handleSubmit = async () => {
    console.log(password, passwordValid, role);
    try {
      setLoading(true);
      const result = await axios.post(
        "http://localhost:5000/api/users/register",
        {
          firstname,
          lastname,
          email,
          password,
          type: role,
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      console.log(result);
      navigate("/login");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="main-container">
      <div className="login-container">
        <div className="register-form-box">
          <div className="form-header-container poppins-medium">
            Create an account
            <b style={{ fontSize: "11px", fontWeight: "300", textAlign: "right" }}>
              Already have an account? <Link to="/login">Login</Link> here.
            </b>
          </div>
          <div className="form-inputs-container">
            <div className="form-input-cont">
              <label htmlFor="role">Select your role</label>
              <div className="role-selection-bar">
                <div className="role-container" style={role === 1 ? { color: "#efefef", backgroundColor: "#090909" } : { color: "#090909", backgroundColor: "transparent" }} onClick={() => handleRoles(1)}>User</div>
                <div className="role-container" style={role === 2 ? { color: "#efefef", backgroundColor: "#090909" } : { color: "#090909", backgroundColor: "transparent" }} onClick={() => handleRoles(2)}>Supervisor</div>
                <div className="role-container" style={role === 3 ? { color: "#efefef", backgroundColor: "#090909" } : { color: "#090909", backgroundColor: "transparent" }} onClick={() => handleRoles(3)}>Manager</div>
              </div>
            </div>
            <div className="form-input-cont">
              <label htmlFor="firstname">Enter your first name</label>
              <input type="text" className="form-input" name="firstname" id="firstname" placeholder="Enter firstname" onChange={(e) => setFirstname(e.target.value)} />
            </div>
            <div className="form-input-cont">
              <label htmlFor="lastname">Enter your last name</label>
              <input type="text" className="form-input" name="lastname" id="lastname" placeholder="Enter lastname" onChange={(e) => setLastname(e.target.value)} />
            </div>
            <div className="form-input-cont">
              <label htmlFor="email">Enter your email</label>
              <input type="text" className="form-input" name="email" id="email" placeholder="Enter email" onChange={(e) => handleEmailChange(e)} />
              {!emailValid && email.length > 0 && (
                <b style={{ color: 'red', fontSize: "13px", fontWeight: "500" }}>
                  Enter valid email address.
                </b>
              )}
            </div>
            <div className="form-input-cont">
              <label htmlFor="password">Create your password</label>
              <input type="text" className="form-input" name="password" id="password" placeholder="Enter password" onChange={(e) => handlePasswordChange(e)} />
              {!passwordValid && password.length > 0 && (
                <b style={{ color: 'red', fontSize: "13px", fontWeight: "500" }}>
                  Password must be 8 or more characters with a mix of letters, numbers, and symbols.
                </b>
              )}
            </div>
            <div className="form-input-cont">
              <input type="button" className="login-submit-button" style={!passwordValid || firstname === '' || lastname === '' || email === '' ? { backgroundColor: "grey", cursor: "default" } : { backgroundColor: "#0c82ee", cursor: "pointer", }} value={loading ? "" : "Create an account"} onClick={passwordValid && firstname !== '' && lastname !== '' && email !== '' ? () => handleSubmit() : undefined} />
              <b style={{ fontSize: "13px", fontWeight: "500", textAlign: "center" }}>
                Already have an account? <Link to="/login">Login</Link> here.
              </b>
              {
                loading ? <SpinLoader /> : <></>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default RegisterPage;