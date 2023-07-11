import { useLocation, Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectCurrentToken, selectCurrentUser } from "./authSlice"
// @desc A component which occurs during routing that checks for authentication and will reroute to login if not authenticated
const RequireAuth = () => {
    const token = useSelector(selectCurrentToken)
    const location = useLocation()
    // if token then we have logged in, otherwise navigate to login page
    //console.log(token)
    return (
        token
            ? <Outlet />
            : <Navigate to="/login" state={{ from: location }} replace />
    )
}
export default RequireAuth