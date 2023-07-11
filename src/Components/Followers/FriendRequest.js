import { baseQueryWithReauth } from "../../app/api/apiSlice"
import { store } from "../../app/store"
import "../../CSS/friendRequest.css"
import red_x from "../../Images/Red_X.png"
import checkmark from "../../Images/checkmark.svg"

const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}

export default function FriendRequest({username, profile_pic, requests, setRequests, setFriends, query, showAccept, message}){
    async function acceptRequest(){
        // Create a new array without the accepted user, optimistically
        const updatedRequests = requests.filter((request) => request.requester !== username);
        setRequests(updatedRequests);
        const response = await baseQueryWithReauth({ url: '/users/follow-request', method: 'POST', body: {requester: username, action:'accept'}}, baseQueryOptions, {})
        //update friends list if status indicates success
        if (response.meta.response.status === 200){
            // Find the index of the requester object in the array
            const index = requests.findIndex((request) => request.requester === username);


            // Get the removed requester object
            const newFriend = requests[index];

            setFriends(prevArray => [...prevArray, newFriend])
        } else {
            setRequests(requests) // revert optimistic update if backend didnt do anything
        }
    }
    async function rejectRequest(){
        // optimstic update
        const updatedRequests = requests.filter((request) => request.requester !== username);
        setRequests(updatedRequests);
        const response = await baseQueryWithReauth({ url: `/users/follow-request${query}`, method: 'POST', body: {requester: username, action:'reject'}}, baseQueryOptions, {})
        //update friends list if status indicates success
        if (response.meta.response.status === 200){
            // Create a new array without the rejected user
            return
        } else{
            setRequests(requests) // revert optimistic update if backend didnt do anything
        }
    }

    return (
        <div className="friend-request-container">
            <img className="user-img" src={profile_pic} alt='user-img'/>
            <div className="user-info">
                <div className="user-name">{username}</div>
                <div className="label">{message}</div>
            </div>
            <div className="buttons-div">
                <img onClick={acceptRequest} className={`accept ${showAccept ? 'show-data' : 'hide-data'}`} src={checkmark} alt="accept-img"/>
                <img onClick={rejectRequest} className="deny" src={red_x} alt="deny-img"/>
            </div>
        </div>
    )
}