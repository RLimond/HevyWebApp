import { apiSlice } from "../../app/api/apiSlice";

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getMostRecentWorkout: builder.query({
            query: (user) => `users/${user}/most-recent-workout`
        }),
        getAnyWorkout: builder.query({
            query: (args) => `users/${args.user}/get-any-workout?skip=10`
        }),
        getUserFollowing: builder.query({
            query: () => `users/get-user-following`
        }),
        getUser: builder.query({
            query: () => '/users/get-user'
        }),
        getNumWorkouts: builder.query({
            query: () => '/users/num-workouts'
        }),
    }),
})

export const {
    useGetMostRecentWorkoutQuery,
    useGetAnyWorkoutQuery,
    useGetUserFollowingQuery,
    useGetUserQuery,
    useGetNumWorkoutsQuery,
} = usersApiSlice