import { createSlice } from "@reduxjs/toolkit";
import jwt_decode from 'jwt-decode';

const authSlice = createSlice({
    name: 'auth',
    initialState: {user:null, token:null},
    reducers: {
        setCredentials: (state, action) => {
            const {username, accessToken} = action.payload
            const decodedToken = jwt_decode(accessToken);
            state.user = username ? username : decodedToken.UserInfo.username
            state.token = accessToken
            //console.log("access token in authSlice", accessToken)
        },
        logOut: (state, action) => {
            state.user = null
            state.token = null
        }
    },
})

export const { setCredentials, logOut} = authSlice.actions

export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentToken = (state) => state.auth.token