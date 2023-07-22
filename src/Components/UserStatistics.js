import React, { useEffect, useState } from "react";
import ReChartsBarGraph from "./ReChartsBarGraph.js";
import DefaultExerciseImg from '../Images/defaultExercise.svg'
import { baseQueryWithReauth } from "../app/api/apiSlice.js"
import { useQuery } from "@tanstack/react-query"
import { store } from "../app/store.js"
import '../CSS/userStatistics.css'
export default function UserStatistics({graphData, selectedUsername, users, nth_workout}) {
    const [created_date, setCreatedDate] = useState(null);
    const [profile_pic, setProfilePic] = useState(DefaultExerciseImg);
    const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}
    // api parameter for baseQueryWithReauth
    const formatDate = (dateString) => {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = new Date(dateString).toLocaleDateString('en-US', options);
      return formattedDate;
    };

    async function getFavoriteExercise() {
        if (selectedUsername !== '') {
          const response = await baseQueryWithReauth(
            `users/${selectedUsername}/exercises?query=getTopExercisesByWorkout&limit=10`,
            baseQueryOptions,
            {}
          );
          const favExercise = response.data;
          const prRequest = await baseQueryWithReauth(
            `users/${selectedUsername}/${favExercise[0]._id}?query=prs`,
            baseQueryOptions,
            {}
          );
          const prs = prRequest.data;
          const progressRequest = await baseQueryWithReauth(`users/${selectedUsername}/${favExercise[0]._id}?query=weightProgress`, baseQueryOptions,{});
          const progress = progressRequest.data
          return [favExercise[0]._id, prs, progress];
        }
        return ["Loading","Loading",[]];
      }
      
      const { data: userFavoriteExercise } = useQuery({
        queryKey: ['userFavoriteExercise', selectedUsername],
        queryFn: getFavoriteExercise,
      });

    
    useEffect(() => {
      if (selectedUsername) {
        const fetchFavoriteWorkout = async () => {
          const user = users.find((user) => user.username === selectedUsername);
          if (user) {
            setCreatedDate(formatDate(user.created_at));
            setProfilePic(user.profile_pic || DefaultExerciseImg);
          }
        };
        fetchFavoriteWorkout();
      }
    }, [selectedUsername, users]);

    return (
        <>
            <div className="user-statistics-grid">
                <div className="user-statistics-grid-header">
                    <div className="user-statistics-img">
                    <img src={profile_pic} alt="profile_img"/>
                    </div>
                    <div className="user-statistics-name">
                        <h2>User statistics:</h2>
                        <h1>{selectedUsername}</h1>
                    </div>
                </div>
                <div className="top-left">
                    <div className="row-half-height" style={{borderBottom: '1px solid #ccc'}}>
                        <div style={{marginLeft:'15px', textAlign:'center'}}>
                            <p className='text-descriptor'  style={{fontSize:'25px'}}>Created:</p>
                            <p className="bottom-text" style={{fontSize:'25px'}}>{created_date}</p>
                        </div>
                    </div>
                    <div className="row-half-height">
                        <div style={{marginLeft:'15px', textAlign:'center'}}>
                            <p className='text-descriptor' style={{fontSize:'25px'}} ># workouts:</p>
                            <p className="bottom-text" style={{fontSize:'25px'}}>{nth_workout}</p>
                        </div>
                    </div>
                </div>
                <div className="chosen-exercise">
                    <div className="row-half-height">
                        <div style={{textAlign:'center'}}>
                            <p className='text-descriptor'>Favorite Exercise:</p>
                            <p className="bottom-text">{userFavoriteExercise ? userFavoriteExercise[0]: "Loading"}</p>
                        </div>
                    </div>
                    <div style={{marginTop: '-15px'}} >
                        <div className='workout-box-columnContainer'>
                            <div className='exercise-column'>
                                <p className='text-descriptor'>1RM:</p>
                                <p>{userFavoriteExercise ? userFavoriteExercise[1].oneRepMax: "Loading"} Lb</p>
                            </div>
                            <div className='exercise-column'>
                                <p className='text-descriptor'>Best Set:</p>
                                <p>{userFavoriteExercise ? userFavoriteExercise[1].highestWeight: "Loading"} x {userFavoriteExercise ? userFavoriteExercise[1].reps: "Loading"}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="span-bottom">
                    <div className='graph-container' style={{width:'50%'}}>
                        <div className="graph-container-title"> Workout Time (Weekly)</div>
                        <div className="graph-container-graph" style={{height:'300px'}}>
                            {graphData ? <ReChartsBarGraph graphData={graphData} xKey={"formattedWeek"} yKey={"duration"}/> : <div></div>}
                        </div>
                    </div>
                    <div className="graph-container" style={{width:'50%'}}>
                        <div className="graph-container-title"> Progress on Favorite (Weekly)</div>
                        <div className="graph-container-graph" style={{height:'300px'}}>
                            {
                                userFavoriteExercise ? 
                                <ReChartsBarGraph graphData={userFavoriteExercise[2]} xKey={"weekStartDate"} yKey={"maxWeight"} color={"#2a8071"}/> 
                                : <div></div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}