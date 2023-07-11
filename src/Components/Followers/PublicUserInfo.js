import "../../CSS/friendRequest.css"
import "../../CSS/Followers/publicUserInfo.css"
import DefaultExerciseImg from '../../Images/defaultExercise.svg'
import { useState, useEffect } from "react";
import checkmark from "../../Images/checkmark.svg"
import { baseQueryWithReauth } from "../../app/api/apiSlice"
import { store } from "../../app/store"
const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}

function ConfirmationPopup({ onConfirm, onCancel }) {
    return (
      <div className="confirmation-popup">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }
export default function PublicUserInfo({userData, setRequests, setAccepted}){
    const [showPopup, setShowPopup] = useState(false);
    const [status, setStatus] = useState(null)
    useEffect(() => {
        setStatus(userData.status?.status);
      }, [userData]);

    const displayPopup = () => {
        setShowPopup(true);
      };
    const hidePopup = () => {
        setShowPopup(false);
    };
    async function sendFollowRequest(){
        //const response = await baseQueryWithReauth({url:'/users/send-follow-request', method: 'POST', body: {recipient:{selectedUser}}}, baseQueryOptions, {})
        hidePopup()
        setStatus("loading")
        const response = await baseQueryWithReauth({url:'/users/send-follow-request', method: 'POST', body: {recipient:userData.username}}, baseQueryOptions, {})
        const userObject = {
            requester: userData.username,
            requesterId: userData._id,
            requesterPic: userData.profile_pic
        }
        if (response.meta.response.status === 200){ // request accepted (recipient had public profile)
            setAccepted(
                prevList => [...prevList, userObject]
            )
            setStatus("accepted") //accepted
        } else if (response.meta.response.status === 202){ // request sent
            setRequests(
                prevList => [...prevList, userObject]
            )
            setStatus("sent") //pending
        } else {
            setStatus("err") //error
        }
       }
    return (
        <div className="public-user-info-container">
            <img className="user-img" src={userData?.profile_pic ? userData.profile_pic : DefaultExerciseImg} alt='user-img'/>
            <div className="user-info">
                <div className="user-name">{userData.username}</div>
                <div className="user-display-info">
                    <div className='info-box'>
                        <p className='text-descriptor'>Followers:</p>
                        <p>{userData.numFollowers}</p>
                    </div>
                    <div className='info-box'>
                        <p className='text-descriptor'>Following:</p>
                        <p>{userData.numFollowing}</p>
                    </div>
                </div>
            </div>
            <div className="buttons-div">
                { (showPopup !== true) ?
                (
                    <div className="user-display-info">
                        <div className="info-box">
                            <p className='text-descriptor'>follow:</p>
                            { status ? status :
                                <img onClick={displayPopup} className="accept" src={checkmark} alt="user-img"/>
                            }
                        </div>
                    </div>
                )
                :
                <ConfirmationPopup onConfirm={sendFollowRequest} onCancel={hidePopup}/>
                }
            </div>
        </div>
    )
}