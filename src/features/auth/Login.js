import { useRef, useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'
import { useLoginMutation } from './authApiSlice'

import usePersist from '../../hooks/usePersist'
import "../../CSS/Auth/Login.css"

const Login = () =>{
    const userRef = useRef()
    const errRef = useRef()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errMsg, setErrMsg] = useState('')
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [persist, setPersist] = usePersist(true)
    const [login, { isLoading }] = useLoginMutation()

    useEffect(() => {
        userRef.current.focus()
    }, [])

    useEffect(() => {
        setErrMsg('')
    }, [username, password])

    const handleSubmit = async (e) => {
        e.preventDefault() // prevent reload
        try {
            const lowerCaseUsername = username.toLowerCase();
            const userData = await login({ username, password }).unwrap()
            dispatch(setCredentials({ ...userData, lowerCaseUsername }))
            setUsername('') // resetting form
            setPassword('')
            navigate('/welcome') // navigate to welcome page
        } catch (err) {
            if (!err.status) {
                setErrMsg('No Server Response');
            } else if (err.status === 400) {
                setErrMsg('Missing Username or Password');
            } else if (err.status === 401) {
                setErrMsg('Unauthorized');
            } else {
                setErrMsg(err.data?.message);
            }
            errRef.current.focus();
        }
    }

    const handleUserInput = (e) => setUsername(e.target.value)
    const handlePwdInput = (e) => setPassword(e.target.value)
    // const handleToggle = () => setPersist(prev => !prev)
    const content = isLoading ? <h1>Loading...</h1> : (
        <section className="loginSection">
            <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
            <div className="login">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <input type={"text"} placeholder={"username"}
                        id="username"
                        ref={userRef}
                        value={username}
                        onChange={handleUserInput}
                        autoComplete="off"
                        required
                    />
                    <input type={"password"} placeholder={"Password"}
                        id="password"
                        onChange={handlePwdInput}
                        value={password}
                        required
                    />
                    <button type={"submit"}>Login</button>
                </form>
                <div> Guest account:</div>
                <div>username: guest</div><div>password: guest</div>
            </div>
        </section>
    )

    return (
        content
    )
}

export default Login