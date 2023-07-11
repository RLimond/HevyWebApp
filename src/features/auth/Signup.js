import React, {useState} from "react";
import questionMark from "../../Images/question-mark-tooltip.svg"
import "../../CSS/Auth/Signup.css"

const Signup = ({loading, setLoading}) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState("");
    const [hevyPassword, setHevyPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    //const [loading, setLoading] = useState(false)
    const [Error, setError] = useState(null);

    const handleUserInput = (e) => setUsername(e.target.value)
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
      };
    
    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    };
    
    const handleHevyPasswordChange = (e) => {
        setHevyPassword(e.target.value);
    };
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          setError("Passwords do not match");
        } else {
            const response = await sendAccountInformation()
            console.log(response)
            if (response.status !== 201){
                console.log("error")
                setError("Failed to Create User!")
                return
            }
            setUsername("")
            setConfirmPassword("")
            setPassword("")
            setHevyPassword("")
            setError(null);
        }
      }
      // @desc send fetch request to create new user
      async function sendAccountInformation(){
        const options = {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: username,
              password: password,
              roles: [1],
              hevyPassword: hevyPassword
            })
        }
        setLoading(true)
        const response = await fetch('https://hevy-webapp-api.onrender.com/user', options)
        console.log(response)
        setLoading(false)
        return response
    }
  return (
    <div className="signup">
      {Error ? <p className="error-message">{Error}</p> : null}
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Username (from Hevy)" 
        value={username}
        onChange={handleUserInput}
        autoComplete="off"
        required
        disabled={loading}
        />
        <input
          type="password"
          placeholder="Password for this site"
          value={password}
          onChange={handlePasswordChange}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
          disabled={loading}
        />
        <div className="tooltip-container">
            <div className="tooltip-div">
                <img className='tooltip-img' src={questionMark} alt='tooltop icon'/>
                {<span className="tooltiptext">Used to fetch your Hevy data, it wont be saved</span>}
            </div>
            <input 
                type={"password"} 
                placeholder={"Hevy Account Password"}
                value={hevyPassword}
                onChange={handleHevyPasswordChange}
                required
                disabled={loading}
            />
        </div>
        <button type={"submit"} disabled={loading}>Sign Up
        </button>
      </form>
    </div>
  );
};
export default Signup;
