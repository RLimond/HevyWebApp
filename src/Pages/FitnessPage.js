import UserDropdown from "../Components/UserDropdown";
import WorkoutBox from "../Components/WorkoutBox";
import UserStatistics from "../Components/UserStatistics";
import ExerciseList from "../Components/ExerciseList";
import ReChartsBarGraph from "../Components/ReChartsBarGraph";
import SearchBar from "../Components/SearchBar";
import React, { useEffect, useState } from 'react';
import { useGetUserFollowingQuery} from "../features/auth/usersApiSlice";
import { baseQueryWithReauth } from "../app/api/apiSlice"
import { store } from "../app/store"
import '../CSS/pages/fitnessPage.css'
export default function FitnessPage() {
  // selectedUsername is the username to be passed into queries
  const [selectedUsername, setSelectedUsername] = useState('');
  const [workoutDurationData, setWorkoutDurationData] = useState(prev => prev ? prev:null) //[{weekStartDate: '0', weekEndDate: '0', formattedWeek: '00-00 - 00-00', duration: 0}]
  // stores data from functions that get exercises from database
  const [exercises, setExercises] = useState([]);
  const [displayedWorkouts, setDisplayedWorkouts] = useState([])
  const [workoutOffset, setWorkoutOffset] = useState(0)
  // holds the query which is sent to the server to adjust exercises
  const [selectedQuery, setSelectedQuery] = useState('');
  const queries = ['getTopExercisesbySet', 'getTopExercisesByWorkout']
  // data used to generate progress graph in center column
  const [workoutProgressData, setWorkoutProgressData] = useState(null)
  const [displayedProgressData, setDisplayedProgressData] = useState(null)
  // number of weeks the workoutProgressData should cover
  const [numProgressWeeks, setNumProgressWeeks] = useState(3)
  const [workoutSearched, setWorkoutSearched] = useState('')
  // RTK Query to get users on initial page load
  const { data: retrievedUsers, isLoading } = useGetUserFollowingQuery();
  // users is all users in database
  const [users, setUsers] = useState([]);
  
  // api parameter for baseQueryWithReauth
  const baseQueryOptions = {getState: store.getState, dispatch: store.dispatch}

  // setUsers as soon as possible
  useEffect(() => {
    if (!isLoading && retrievedUsers) {
      setUsers(retrievedUsers);
    }
  }, [isLoading, retrievedUsers]);
  useEffect(() => {
    if (users.length !== 0){
    setSelectedUsername(users[0].username)
    }
  },[users])

  async function getSelectedQuery() {
    try {
      const response = await baseQueryWithReauth(`users/${selectedUsername}/exercises?query=${selectedQuery}`,baseQueryOptions, {});
      setExercises(response.data ? response.data : []); // handle case where no query was selected by returning []
    } catch (error) {
      console.error(error);
    } finally {
    }
  }

  async function getAnyWorkout() {
    try {
      const response = await baseQueryWithReauth(`users/${selectedUsername}/get-any-workout?skip=${workoutOffset}`,
        baseQueryOptions,{})
      setDisplayedWorkouts([...displayedWorkouts, ...response.data])
      setWorkoutOffset(prevOffset => prevOffset + 10);
    } catch (error) {
      console.error(error)
    }
  }

  // useEffect to handle loading new workouts when selectedUser is changed
  useEffect(() => {
    const resetVariablesAsync = async () => {
      // reset workout offset whenever a new user is selected
      // set current Displayed workouts to []
      try {
        setExercises([])
        setWorkoutProgressData(null)
        setDisplayedProgressData(null)
        setWorkoutSearched('')
        setDisplayedWorkouts([])
        setWorkoutOffset(0)
        const weeklyWorkoutDurations = await baseQueryWithReauth(`users/${selectedUsername}/workout-durations`,baseQueryOptions,{});
        // fetches data to be display in workout duration graph
        setWorkoutDurationData(weeklyWorkoutDurations.data)
      } catch (error) { console.error(error) }
    }
    resetVariablesAsync();
  }, [selectedUsername])

  // fetch first batch of 10 workouts once state variables have been reset
  useEffect(() => {
    if (displayedWorkouts.length === 0 && workoutOffset === 0) {
      getAnyWorkout();
    }
  }, [displayedWorkouts])
  
  function filterDataByWeeks(data, numberOfWeeks) {
    const currentDate = new Date();
    const filteredData = [];
  
    for (let i = data.length - 1; i >= 0; i--) {
      const dataItem = data[i];
      const itemDate = new Date(dataItem.weekEndDate);
      const diffInWeeks = Math.ceil((currentDate - itemDate) / (7 * 24 * 60 * 60 * 1000));
  
      if (diffInWeeks <= numberOfWeeks) {
        filteredData.unshift(dataItem);
      } else {
        break;
      }
    }
  
    return filteredData;
  }
  useEffect(() => {
    if (workoutSearched){
      setDisplayedProgressData(filterDataByWeeks(workoutProgressData, numProgressWeeks*4))
    }
  },[numProgressWeeks])

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: '20px' }}>
        <div style={{ width: '300px', marginTop: '10px' }}>
          <UserDropdown options={users.map(user => user.username)} selectedOption={selectedUsername} setSelectedOption={setSelectedUsername}
            defaultText={"Click here to select user"} headerLabel={"Selected: "}/>
        </div>
      </div>
      {/*idea: develop searchBar and jumpto feature for displayed workouts so user can find specific workout and go to its location in displayed list*/}
      <div className='columnContainer'>
        <div className="column">
          {displayedWorkouts.length > 0 ? (
            <div className='workoutsContainer'>
              {displayedWorkouts.map((workout) => {
                return <WorkoutBox key={workout.id} workout={workout} />
              })}
              <button className='view-more-button' onClick={getAnyWorkout}>{!selectedUsername ? 'Select User to Display Workouts' : 'View 10 More'}</button>
            </div>
          ) : (<p>Select a User to Display Workouts</p>)}
        </div>
        <div className="column-background">
          <UserDropdown options={queries} selectedOption={selectedQuery} setSelectedOption={setSelectedQuery}
            defaultText={"Click here to choose a Query"}
          />
          <button style={{borderRadius:'5px', backgroundColor: '#4caf50', border:'none', color: 'white'}} onClick={getSelectedQuery}>Get Results</button>
          <ExerciseList exercises={exercises}/>
          <div className="sticky-bottom">
            <div style={{width:'100%', display:'flex'}}>
              <SearchBar setDataStore={setWorkoutProgressData} search={workoutSearched} setSearch={setWorkoutSearched} timeFrame={numProgressWeeks}
                          setData={setDisplayedProgressData} handleSearch={ async (exercise, username = selectedUsername, timeFrame=numProgressWeeks) =>{
                              const progressRequest = await baseQueryWithReauth(`/users/${username}/${exercise}?query=weightProgress&months=${12}`,baseQueryOptions,{});
                              //const progress = await progressRequest.json();
                              return progressRequest.data
                          }}
              />
              <div>
                <UserDropdown options={[1,2,3,4,5,6,7,8,9,10,11,12]} selectedOption={numProgressWeeks} setSelectedOption={setNumProgressWeeks}
                  defaultText={"weeks"} headerLabel={"Months: "}
                />
              </div>
                <div className="search-results">{workoutSearched} Results:</div>
              </div>
            <div className="graph">
                <div className="graph-graph">
                {displayedProgressData ? <ReChartsBarGraph graphData={displayedProgressData} xKey={"weekStartDate"} yKey={"maxWeight"}/> : <div></div>}
                </div>
            </div>
          </div>
        </div>
        <div className="column">
          <UserStatistics graphData={workoutDurationData} selectedUsername={selectedUsername}
            users={users} nth_workout={displayedWorkouts[0] ? displayedWorkouts[0].nth_workout : null}/>
        </div>
      </div>

      {/*<button onClick={() => { console.log(displayedWorkouts); console.log(workoutOffset) }}>log DisplayedWorkouts</button>*/}
    </>
  );
}