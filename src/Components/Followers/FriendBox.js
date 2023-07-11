import "../../CSS/friendRequest.css"
import { baseQueryWithReauth } from "../../app/api/apiSlice"
import { store } from "../../app/store"
import ConfirmationPopup from "../ConfirmationPopup"
import red_x from "../../Images/Red_X.png"
//import checkmark from "../../Images/checkmark.svg"
import { useState } from "react"
const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}

export default function FriendBox({username, profile_pic, friends, setFriends, query, message}){
    const [showPopup, setShowPopup] = useState(false);
    async function removeFriend(){
         // Create a new array without the rejected user
        const updatedFriends = friends.filter((request) => request.requester !== username);
        setFriends(updatedFriends)
        const response = await baseQueryWithReauth({ url: `/users/follow-request${query}`, method: 'POST', body: {requester: username, action:'reject'}}, baseQueryOptions, {})
        //update friends list if status indicates success
        if (response.meta.response.status === 200){
           return
        } else {
            setFriends(friends)
        }
    }
    const displayPopup = () => {
        setShowPopup(true);
      };
    const hidePopup = () => {
        setShowPopup(false);
    };
    return (
        <div className="friend-request-container">
            <img className="user-img" src={profile_pic} alt='user-img'/>
            <div className="user-info">
                <div className="user-name">{username}</div>
                <div className="label">{message}</div>
            </div>
            <div className="buttons-div">
                { (showPopup !== true) ?
                (<img onClick={displayPopup} className="deny" src={red_x} alt="deny-img"/>)
                :
                <ConfirmationPopup onConfirm={removeFriend} onCancel={hidePopup}/>
                }
            </div>
        </div>
    )
}