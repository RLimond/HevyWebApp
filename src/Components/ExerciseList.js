import React from 'react';
import '../CSS/exerciseList.css'

const ExerciseList = ({ exercises }) => {
  return (
    <div className="exercise-list">
      {exercises.length > 0 && (
        <ul>
          {exercises.map((exercise, index) => (
            <li key={exercise._id} className={index % 2 === 0 ? 'highlighted' : ''}>
              <div className="exercise-box">
                <span className="exercise-name">{exercise._id}</span>
                <span className="exercise-count">{exercise.count}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExerciseList;
