import React, { useState, useRef } from "react";
import Login from "../features/auth/Login"
import Signup from "../features/auth/Signup";
import "../CSS/pages/LoginSignupContainer.css";
const LoginSignup = () => {
  const [login, setLogin] = useState(true);
  const [loading, setLoading] = useState(false)

  const loginSignupContainerRef = useRef(null);

  const handleClick = () => {
    setLogin(!login);
    // if login is clicked, focus on login-signup-container
    loginSignupContainerRef.current.classList.toggle("active");
  };
  return (
    <div className="login-signup-container" ref={loginSignupContainerRef}>
      {loading ? <div className="spinner"></div> : <Login />}
      <div className="side-div">
        <button type="button" disabled={loading} onClick={handleClick}>
          {" "}
          {login ? "Signup" : "Login"}
        </button>
      </div>
      {<Signup loading={loading} setLoading={setLoading}/>}
    </div>
  );
};

export default LoginSignup;