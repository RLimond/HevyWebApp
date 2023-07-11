import React, {useState } from 'react';
import '../CSS/workoutBox.css'
import DefaultExerciseImg from '../Images/defaultExercise.svg'
import DownArrowPng from '../Images/down-arrow.png';

function ExerciseImg({src}){
  const defaultImageUrl = DefaultExerciseImg;
  // Check if src is empty then default to defaultImg if necessary
  const imageSrc = src ? src : defaultImageUrl;
  return <img className='Exercise_img' src={imageSrc} alt="img" />;
}
function Exercise({ exercise, img }) {
    const [showSets, setShowSets] = useState(false);
    function convertToLb(weight_kg){
      const weightInLbs = weight_kg * 2.20462;
      const roundedWeightInLbs = Math.round(weightInLbs);
      return roundedWeightInLbs;
    }
    const toggleSets = () => {
      setShowSets(!showSets);
    };
  return (
    <div className='Exercise'>
      <p>
        <ExerciseImg src={img}/>
        {exercise.title}
      <button className={`ShowSetsButton`} onClick={toggleSets}>
        <div className='button-content'>
          <img className={`downArrowpng rotate-button ${showSets ? 'open' : ''}`} src={DownArrowPng} alt='downArrow.png'/>
        </div>
      </button>
      </p>
      {showSets && (
        <ul>
        <div className='workout-box-columnContainer' style={{width:'75%'}}>
            <div>
                  SETS
            </div>
            <div style={{marginLeft: '50px'}}>
                  WEIGHT & REPS
            </div>
          </div>
          {exercise.sets.map((set, index) => (
            <li key={set.id}
            className={index % 2 === 0 ? 'set-item' : 'set-item alternate'}
            >
            <span className='set-number'>{index + 1}</span>
              <p style={{display:'inline-block'}}>{convertToLb(set.weight_kg)} x Reps: {set.reps}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function calculateWorkoutDuration(workout){
  const durationInSeconds = workout.end_time - workout.start_time;

  // Convert duration to hh:mm:ss format
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return(formattedDuration);
}
function WorkoutBox({workout}){
    
    return (
        <div className='WorkoutBox'>
            {/*Display workout title, date created. Then render each exercise and its sets using Exercise component*/}
            <h2>{workout.name}</h2>
            <div style={{width:'60%'}}>
            <div className='workout-box-columnContainer'>
              <div className='workout-box-column'>
                <p className='text-descriptor'>Start Time:</p>
                <p>{new Date(workout.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false})}</p>
              </div>
              <div className='workout-box-column'>
                <p className='text-descriptor'>Duration:</p>
                <p>{calculateWorkoutDuration(workout)}</p>
              </div>
            </div>
            </div>
            <h3>Exercises:</h3>
            {workout.exercises.map((exercise) => (
        <Exercise key={exercise.id} exercise={exercise} img={exercise.custom_exercise_image_thumbnail_url}/>
      ))}
        </div>
    )
}

export default WorkoutBox