import React, {useState, useEffect} from "react";
import { baseQueryWithReauth } from "../app/api/apiSlice"
import { store } from "../app/store"
import DefaultExerciseImg from '../Images/defaultExercise.svg'
import SwapIcon from '../Images/swapIcon.svg'
import FriendRequest from "../Components/Followers/FriendRequest";
import FriendBox from "../Components/Followers/FriendBox";
import PublicUserInfo from "../Components/Followers/PublicUserInfo";
import ConfirmationPopup from "../Components/ConfirmationPopup";
import UpdateUser from "../Components/UpdateUser";
import { useGetUserQuery, useGetNumWorkoutsQuery} from "../features/auth/usersApiSlice";
import "../CSS/pages/profile.css"
import "../CSS/effects/shake.css"

// api parameter for baseQueryWithReauth
const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}
export default function Profile(){
    const [loggedInUser, setLoggedInUser] = useState(null)
    const [privateProfile, setPrivateProfile] = useState(true)
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedUserInfo, setSelectedUserInfo] = useState(null)
    const [numFollowers, setNumfollowers] = useState(0) // how many people are following the user
    const [numFollowing, setNumFollowing] = useState(0) // how many people the user follows
    const [numWorkouts, setNumWorkouts] = useState(0)
    const [incommingRequests, setIncommingRequests] = useState([])
    const [outgoingRequests, setOutgoingRequests] = useState([])
    const [followers, setFollowers] = useState([])
    const [following, setFollowing] = useState([]) // requester is the user being followed
    const [isShaking, setIsShaking] = useState(false);
    const [PrivacyConfirmation, setPrivacyConfirmation] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState(false)
    const [toggleRequestView, setToggleRequestView] = useState(false)
    const [toggleFollowerView, setToggleFollowerView] = useState(false)

    // RTK Query
    const { data: retrievedUser, isLoading } = useGetUserQuery();
    const { data: numWorkout, numWorkoutsIsLoading} = useGetNumWorkoutsQuery()
    useEffect(() => {
        if (!isLoading && retrievedUser) {
            setLoggedInUser(retrievedUser);
            setPrivateProfile(retrievedUser.private_profile)
            const { followerArray, requests, followingArray, sentRequests} = retrievedUser.friends.reduce(
                (acc, friend) => {
                  if (friend.following === 1) { // incomming request
                    acc.requests.push(friend);
                  } if (friend.following === 0) { // this person follows the current user
                    acc.followerArray.push(friend);
                  }  if (friend.follower === 0) { // the current user follows this person
                    acc.followingArray.push(friend);
                  } if (friend.follower === 1) { // the current user sent a follow request to this user
                    acc.sentRequests.push(friend);
                  }
                  return acc;
                },
                { followerArray: [], requests: [], followingArray: [], sentRequests: []}
              );
            setIncommingRequests(requests)
            setOutgoingRequests(sentRequests)
            setFollowers(followerArray)
            setFollowing(followingArray)
        }
      }, [isLoading, retrievedUser]);
      useEffect(() => {
        if (!numWorkoutsIsLoading && numWorkout){
            setNumWorkouts(numWorkout.numWorkouts)
        }
      }, [numWorkout, numWorkoutsIsLoading])

    useEffect(() => {
        const followerLength = followers.length
        setNumfollowers(followerLength)
    }, [followers])
    
    useEffect(() => {
        const followingLength = following.length
        setNumFollowing(followingLength)
    }, [following])

    // @desc causes form to shake
    function shake(timeout=1000){
        setIsShaking(true); // Trigger the shaking animation
        setTimeout(() => {
            setIsShaking(false); // Reset the shaking animation after a delay
        }, timeout);
    }

   const handleUserInput = (e) => setSelectedUser(e.target.value)

   async function searchUser(e){
       e.preventDefault()
       if (selectedUser === loggedInUser.username){ // selectedUser should not be current user
            shake(1000)
            return
        }
       let status = {status : null}
       const response = await baseQueryWithReauth(`/users/${selectedUser}/public-info`, baseQueryOptions, {})
        if (response.meta.response.status === 200){
        setSelectedUserInfo(response.data)
        const accepted = following.find(friend => friend.requester === response.data.username)
        const pending = outgoingRequests.find(friend => friend.requester === response.data.username)
        if (pending){ // follow request has been sent
            status = {status : "pending"}
            setSelectedUserInfo(prevUser => ({...prevUser, status}))
        } else if (accepted){ // already a follow of this user
            status = {status : "following"}
            setSelectedUserInfo(prevUser => ({...prevUser, status}))
        }
        setSelectedUser("")
        return
    }
        shake(1000) // shake to indicate failure to find user
        return
   }
   function handleRequestSwap(){
        setToggleRequestView(!toggleRequestView)
   }
   function handleFollowerViewSwap(){
        setToggleFollowerView(!toggleFollowerView)
   }
   async function toggleProfilePrivacy(){
    const newProfileState = !privateProfile
    setPrivateProfile(newProfileState) //optimistic update
    setPrivacyConfirmation(false)
    const response = await baseQueryWithReauth({url:'/users/update-privacy', method: 'POST', body: {updatedSetting: newProfileState}}, baseQueryOptions, {})
    if (response.meta.response.status !== 200){
        setPrivateProfile(!newProfileState) // revert displayed profile state to origin if change fails
    }
   }
   async function deleteUser(){
    //const response = 
    await baseQueryWithReauth({url:'/users/delete-account', method: 'POST'}, baseQueryOptions, {})
    //console.log(response)
   }

    return (
        <main>
        <div className="top-container">
            <img src={loggedInUser?.profile_pic ? loggedInUser.profile_pic : DefaultExerciseImg} alt="profile_img"/>
            <div className="top-information">
                <h1>{loggedInUser?.username ? loggedInUser?.username: "loading" }</h1>
                <div className="user-display-info">
                    <div className='info-box'>
                        <p className='text-descriptor'>Followers:</p>
                        <p>{numFollowers}</p>
                    </div>
                    <div className='info-box'>
                        <p className='text-descriptor'>Following:</p>
                        <p>{numFollowing}</p>
                    </div>
                    <div className='info-box hidden-sm-vp'>
                        <p className='text-descriptor'>Workouts:</p>
                        <p>{numWorkouts}</p>
                    </div>
                    <div className='info-box hidden-md-vp'>
                        <p className='text-descriptor'>Privacy:</p>
                        <div style={{display:'flex'}}>
                            { (PrivacyConfirmation !== true) ?
                            (<button className="default-button" onClick={()=>setPrivacyConfirmation(true)}>{privateProfile ? "Private" : "Public"}</button>)
                            :
                            <ConfirmationPopup onConfirm={toggleProfilePrivacy} onCancel={()=>setPrivacyConfirmation(false)} confirmLeft={false}/>
                            }
                        </div>
                    </div>
                    <div className='float-right hidden-md-vp'>
                        <div style={{marginLeft:'50px'}}>
                            { (deleteConfirmation !== true) ?
                                    (<button className="default-button" onClick={()=>setDeleteConfirmation(true)}>Delete</button>)
                                    :
                                    <ConfirmationPopup onConfirm={deleteUser} onCancel={()=>setDeleteConfirmation(false)} confirmLeft={false}/>
                                    }
                        </div>
                            <div style={{marginTop:'20px'}}>
                                <UpdateUser/>
                            </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="sm-container display-md-vp">
            <div className='center-content'>
                            <div style={{display:'flex'}}>
                                { (PrivacyConfirmation !== true) ?
                                (<button className="default-button" style={{width:'100%'}}onClick={()=>setPrivacyConfirmation(true)}>{privateProfile ? "Private" : "Public"}</button>)
                                :
                                <ConfirmationPopup onConfirm={toggleProfilePrivacy} onCancel={()=>setPrivacyConfirmation(false)} confirmLeft={true}/>
                                }
                            </div>

                    { (deleteConfirmation !== true) ?
                            (<button className="default-button" onClick={()=>setDeleteConfirmation(true)}>Delete</button>)
                            :
                            <ConfirmationPopup onConfirm={deleteUser} onCancel={()=>setDeleteConfirmation(false)} confirmLeft={true}/>
                            }
                    <div style={{marginTop:'20px'}}>
                        <UpdateUser/>
                    </div>
            </div>
        </div>

        <div className="middle-container">
            <div className="search-user">
                <h1>Search Users</h1>
                <div className="user-search-form-container">
                    <form onSubmit={searchUser} className={isShaking ? "shake" : ""}>
                        <input type={"text"} placeholder={"Search username"}
                            id="username"
                            value={selectedUser}
                            onChange={handleUserInput}
                            autoComplete="off"
                            required
                        />
                        <button type={"submit"}>Search</button>
                    </form>
                    {
                        selectedUserInfo && (
                            <div className="public-user-info-wrapper">
                            <PublicUserInfo 
                                userData={selectedUserInfo}
                                initalStatus={selectedUserInfo.status?.status}
                                setRequests={setOutgoingRequests} setAccepted={setFollowing}
                            />
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
        <div className="bottom-container">
            <div className="left-container">
                <div className={`${!toggleRequestView ? 'show-data' : 'hide-data'}`}>
                    <div className="box-header">
                        <h1 className="">Follow Requests</h1>
                        <img onClick={handleRequestSwap} src={SwapIcon} alt="swap"/>
                    </div>
                    <div className={`scrolling-container`}>
                        { incommingRequests.map( request => (
                                <FriendRequest 
                                key={request.requesterId} 
                                username={request.requester} 
                                profile_pic={request?.requesterPic ? request.requesterPic: DefaultExerciseImg}
                                requests={incommingRequests}
                                setRequests={setIncommingRequests}
                                setFriends={setFollowers}
                                query={""}
                                message={"Incomming Follow Request"}
                                showAccept={true}
                                />
                            )
                        )}
                    </div>
                </div>
                <div className={`${toggleRequestView ? 'show-data' : 'hide-data'}`}>
                    <div className="box-header">
                        <h1 className="">Sent Requests</h1>
                        <img onClick={handleRequestSwap} src={SwapIcon} alt="swap"/>
                    </div>
                    <div className={`scrolling-container`}>
                        { outgoingRequests.map( request => (
                                <FriendRequest 
                                key={request.requesterId} 
                                username={request.requester} 
                                profile_pic={request?.requesterPic ? request.requesterPic: DefaultExerciseImg}
                                requests={outgoingRequests}
                                setRequests={setOutgoingRequests}
                                setFriends={setFollowers}
                                query={"?remove=true"}
                                message={"Pending Request"}
                                showAccept={false}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
            <div className="right-container">
                <div className={`${!toggleFollowerView ? 'show-data' : 'hide-data'}`}>
                    <div className="box-header">
                            <h1 className="">Followers</h1>
                            <img onClick={handleFollowerViewSwap} src={SwapIcon} alt="swap"/>
                        </div>
                        <div className="scrolling-container">
                            { followers.map( friend => (
                                    <FriendBox 
                                    key={friend.requesterId} 
                                    username={friend.requester} 
                                    profile_pic={friend?.requesterPic ? friend.requesterPic: DefaultExerciseImg}
                                    friends={followers}
                                    setFriends={setFollowers}
                                    query={""}
                                    message={"Follower"}
                                    />
                                )
                            )} 
                        </div>
                </div>
                <div className={`${toggleFollowerView ? 'show-data' : 'hide-data'}`}>
                    <div className="box-header">
                            <h1 className="">Following</h1>
                            <img onClick={handleFollowerViewSwap} src={SwapIcon} alt="swap"/>
                        </div>
                        <div className="scrolling-container">
                            { following.map( friend => (
                                    <FriendBox 
                                    key={friend.requesterId} 
                                    username={friend.requester} 
                                    profile_pic={friend?.requesterPic ? friend.requesterPic: DefaultExerciseImg}
                                    friends={following}
                                    setFriends={setFollowing}
                                    query={"?remove=true"}
                                    message={"Following"}
                                    />
                                )
                            )} 
                        </div>
                </div>
            </div>
        </div>
        </main>
    )
}