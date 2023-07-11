import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setCredentials, logOut } from '../../features/auth/authSlice'

// @desc defines default query url for application and sets up headers with authentication token
export const baseQuery = fetchBaseQuery({
    baseUrl: 'https://hevy-webapp-api.onrender.com', //Change for production
    credentials: 'include', // Change to include when hosting server or same-origin for local testing
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.token
        const user = getState().auth.user
        //console.log("user", user)
        if (token) {
            headers.set("authorization", `Bearer ${token}`)
            headers.set("user", user)
        }
        return headers
    },
})
// @desc if token is expired it will attempt to refresh and recall the api endpoint
export const baseQueryWithReauth = async (args, api, extraOptions) => {
     //console.log(args) // request url, method, body
     //console.log(api) // signal, dispatch, getState()
     //console.log(extraOptions) //custom like {shout: true}
     //console.log("baseQueryWithReath")
    let result = await baseQuery(args, api, extraOptions)
    // If the api returns a 403 try to get a new access token
    if (result?.error?.status === 403) {
        //console.log('sending refresh token')

        // send refresh token to get new access token 
        const refreshResult = await baseQuery('/auth/refresh', api, extraOptions)
        console.log(refreshResult)
        if (refreshResult?.data) {
            const user = api.getState().auth.user
            //console.log("Refreshing token")
            //console.log(`baseQueryWithReauth user is: ${user}`)
            // store the new token 
            api.dispatch(setCredentials({ ...refreshResult.data, user }))

            // retry original query with new access token
            result = await baseQuery(args, api, extraOptions)
        } else {
            // logout?
            // api.dispatch(logOut())
            if (refreshResult?.error?.status === 403) {
                //console.log("baseQuery: login expired")
                refreshResult.error.data.message = "Your login has expired."
            }
            return refreshResult
        }
    }
    return result
}

export const apiSlice = createApi({
    baseQuery: baseQueryWithReauth,
    endpoints: builder => ({})
})