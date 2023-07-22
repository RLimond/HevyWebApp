import UserDropdown from "../Components/UserDropdown";
import WorkoutBox from "../Components/WorkoutBox";
import UserStatistics from "../Components/UserStatistics";
import ExerciseList from "../Components/ExerciseList";
import ReChartsBarGraph from "../Components/ReChartsBarGraph";
import SearchBar from "../Components/SearchBar";
import React, { useEffect, useState } from 'react';
import { useGetUserFollowingQuery} from "../features/auth/usersApiSlice";
import { baseQueryWithReauth } from "../app/api/apiSlice"
import { useQuery } from "@tanstack/react-query"
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
  
  const { data: queryResults } = useQuery(
    // Use selectedQuery and selectedUsername as the query key
    ['selectedQueryResults', selectedQuery, selectedUsername],
    // Define the query function, which will be called when data is not in cache or refetch is requested
    async () => {
      if (selectedQuery !== ''){
        try {
          const response = await baseQueryWithReauth(
            `users/${selectedUsername}/exercises?query=${selectedQuery}`,
            baseQueryOptions,
            {}
          );
          return response.data ? response.data : [];
        } catch (error) {
          console.error(error);
          return [];
        }
      }
      return []
    }
  );

  // Whenever queryResults changes (data is fetched or updated), update the exercises state
  useEffect(() => {
    if (queryResults) {
      setExercises(queryResults);
    }
  }, [queryResults]);
  

  async function getUserDurationData(){
    if (selectedUsername !== ''){
    const weeklyWorkoutDurations = await baseQueryWithReauth(
      `users/${selectedUsername}/workout-durations`,
      baseQueryOptions,
      {}
    );
    return weeklyWorkoutDurations.data;
    } else {
      return []
    }
  }
  // cache workout duration data
  const {data: weeklyWorkoutDurations } = useQuery({
    queryKey: ['userDurationData', selectedUsername],
    queryFn: getUserDurationData
  })
  
  // user workouts
  async function getAnyWorkout() {
    if (selectedUsername !== ''){
    const response = await baseQueryWithReauth(
      `users/${selectedUsername}/get-any-workout?skip=${workoutOffset}`,
      baseQueryOptions,
      {}
    );
    return response.data;
    } else {
      return []
    }
  }

  // caching user workouts
  const {data: userWorkouts} = useQuery({
    queryKey: ["userWorkouts", selectedUsername, workoutOffset], // setting a unique key for each user and batch of workouts (offset)
    queryFn: getAnyWorkout,
  })

  useEffect(() => {
    // Update user dependent variables when new user is selected
    // load cached workout duration data
    const resetVariablesAsync = async () => {
      try {
        setExercises([]);
        setWorkoutProgressData(null);
        setDisplayedProgressData(null);
        setWorkoutSearched('');
        setWorkoutOffset(0);
        setSelectedQuery('')
        //setDisplayedWorkouts([])
        // Use the data fetched by useQuery
        if (weeklyWorkoutDurations) {
          setWorkoutDurationData(weeklyWorkoutDurations);
        }
      } catch (error) {
        console.error(error);
      }
    };
    resetVariablesAsync();
  }, [selectedUsername, weeklyWorkoutDurations]);

  // Update the displayed workouts
  useEffect(() => {
    if (userWorkouts && userWorkouts.length > 0){
      if (workoutOffset === 0){ // This ensures displayed data resets when a new user is selected
        setDisplayedWorkouts(userWorkouts)
      } else {
        setDisplayedWorkouts([...displayedWorkouts, ...userWorkouts])
      }
  }
  }, [userWorkouts])

  // displays the data for the number of weeks that the user selected
  function filterDataByWeeks(data, numberOfWeeks) {
    const currentDate = new Date();
    const filteredData = [];
    if (data){
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
    }
  
    return filteredData;
  }
  useEffect(() => {
    if (workoutSearched){
      setDisplayedProgressData(filterDataByWeeks(workoutProgressData, numProgressWeeks*4))
    }
  },[numProgressWeeks, workoutProgressData, workoutSearched])

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
          {(displayedWorkouts.length > 0) ? (
            <div className='workoutsContainer'>
              {displayedWorkouts.map((workout) => {
                return <WorkoutBox key={workout.id} workout={workout} />
              })}
              <button className='view-more-button' onClick={() => {setWorkoutOffset((prevOffset) => prevOffset + 10);}}>
                {!selectedUsername ? 'Select User to Display Workouts' : 'View 10 More'}
              </button>
            </div>
          ) : (<p>Select a User to Display Workouts</p>)}
        </div>
        <div className="column-background">
          <UserDropdown options={queries} selectedOption={selectedQuery} setSelectedOption={setSelectedQuery}
            defaultText={"Click here to choose a Query"}
          />
          <ExerciseList exercises={exercises}/>
          <div className="sticky-bottom">
            <div style={{width:'100%', display:'flex'}}>
              <SearchBar setDataStore={setWorkoutProgressData} search={workoutSearched} setSearch={setWorkoutSearched} timeFrame={numProgressWeeks}
                          setData={setDisplayedProgressData} selectedUsername={selectedUsername} handleSearch={ async (exercise, username = selectedUsername, timeFrame=numProgressWeeks) =>{
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