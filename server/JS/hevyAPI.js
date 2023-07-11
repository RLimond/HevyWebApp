const fetch = require('cross-fetch');
const mongoose = require('mongoose');
const {userSchema} = require('./Schemas.js');
const dbFunctions = require('./dbFunctions.js')

const headers = {
  'Content-Type': 'application/json',
  'accept-encoding': 'gzip',
  'x-api-key': 'with_great_power'
};
// @desc log into hevy and retrieve then store account data and workouts into the database
async function login(username, password, hashedPassword) {
  return new Promise(async (resolve, reject) => {
    const body = {
      'emailOrUsername': username,
      'password': password
    };

    try {
      const loginResponse = await fetch('https://api.hevyapp.com/login', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!loginResponse.ok) {
        reject("Hevy Login Failed")
        return
        //throw new Error('Login to Hevy failed.');
      }

      const loginData = await loginResponse.json();
      headers['auth-token'] = loginData.auth_token;

      const accountResponse = await fetch('https://api.hevyapp.com/account', {
        method: 'GET',
        headers: headers
      });

      if (!accountResponse.ok) {
        throw new Error('Fetching account data failed.');
      }

      const accountData = await accountResponse.json();

      // Await the completion of fetchEachWorkout or other asynchronous operations
      await fetchEachWorkout(accountData.username, accountData, hashedPassword);
      resolve(0); // Resolve the promise with a success value (0 in this case)
    } catch (error) {
      console.error(error);
      reject(error); // Reject the promise with the error
    }
  });
}

// @desc creates or updates a user in the database
// @params takes account data (format: userSchema) and an array of workouts as parameters
async function createUser(data,workouts,hashedPassword){
  // update account information to include the workouts
  data.workouts = workouts; //replace existing workouts in data with new workouts
  data.password = hashedPassword; //set the password field to be the hashed password
  data.numFollowers = 0;
  data.numFollowing = 0;
  //console.log(data);
  const User = mongoose.model('User', userSchema);
  // Find the existing user by their ID, and update the document
  // with the new user information
  const user = new User(data);
  //check if workout exists
  try{
  const res = await User.findOne({id: user.id});
  if (res){
    await User.updateOne({id: data.id}, data);
    //console.log("updated user");
    return;
  }
  //if not found save User
  else{await user.save();}
  } catch (err){
    console.error('Error',err);
    return;
  }
}
// Updates a user in the database with new workouts
async function addWorkoutsToUser(username,newWorkouts){
  const User = mongoose.model('User', userSchema);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    // Filter out duplicate workouts by comparing their unique identifier (e.g., workout ID)
    const uniqueWorkouts = newWorkouts.filter((newWorkout) => {
      return !user.workouts.some((existingWorkout) => existingWorkout.id === newWorkout.id);
    });
    if (uniqueWorkouts.length === 0) { console.log("Nothing to update")}
    user.workouts.push(...uniqueWorkouts);
    await user.save();
    
    //console.log('Workouts added to the user successfully');
  } catch (error) {
    console.error(error);
  }
}

// @desc Takes username and number of workouts and uses an api call to individually fetch each workout
async function fetchEachWorkout(username,data, hashedPassword) {
  //https://api.hevyapp.com/user_workouts_paged?username=user&limit=2&offset=0
  //let apiURL = `https://api.hevyapp.com/user_workouts_paged?username=${username}&limit=1&offset=0`;
  let allData = [];
  let moreDataAvailable = true;
  let i = 0
  while (moreDataAvailable){
    //console.log("calling with i =" + i);
    try{
    let data = await fetchWorkout(`https://api.hevyapp.com/user_workouts_paged?username=${username}&limit=10&offset=${i}`); //offset 0 = most recent workout
    if (data.length < 10){
      console.log("DONE");
      moreDataAvailable = false;
    }
    allData = allData.concat(data);
    i = i + 10;
    } catch (error){
      console.error(error);
      //mongoose.disconnect();
      return;
    }
  }
  await createUser(data,allData,hashedPassword);
}
// used in updateUser
// @desc retrieves given # (finish) of most recent workouts
// @params takes a username (not email), number of workouts to retrieve (finish), headers
async function fetchWorkoutsinRange(username, finish, options){
  let allWorkoutData = [];
  let moreDataAvailable = true;
  let i = 0
  while (moreDataAvailable){
    if (i > finish){
      moreDataAvailable = false;
    }
    try{
    let workout_batch = await fetchWorkoutWithOptions(`https://api.hevyapp.com/user_workouts_paged?username=${username}&limit=3&offset=${i}`,options); //offset 0 = most recent workout
    if (workout_batch.length < 3){
      moreDataAvailable = false;
    }
    allWorkoutData = allWorkoutData.concat(workout_batch);
    i = i + 3;
    } catch (error){
      console.error(error);
      return;
    }
  }
  await addWorkoutsToUser(username,allWorkoutData);
}

// @desc updates missing workouts by adding them to the database, calculate how many workouts are absent from database and fetch that many
// @params updateUser takes an email and a password to log a user into their account
async function updateUser(username, password) {
  return new Promise(async (resolve, reject) => {
  try {
    var account_username;
    const body = {
      'emailOrUsername': username,
      'password': password
    };
    const options = {
      'Content-Type': 'application/json',
      'accept-encoding': 'gzip',
      'x-api-key': 'with_great_power',
    }

    const loginResponse = await fetch('https://api.hevyapp.com/login', {
      method: 'POST',
      headers: options,
      body: JSON.stringify(body)
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed.');
    }

    const loginData = await loginResponse.json();
    options['auth-token'] = loginData.auth_token;

    const accountResponse = await fetch('https://api.hevyapp.com/account', {
      method: 'GET',
      headers: options
    });

    if (!accountResponse.ok) {
      throw new Error('Fetching account data failed.');
    }

    const accountData = await accountResponse.json();
    account_username = accountData.username;

    const workoutCountResponse = await fetch("https://api.hevyapp.com/workout_count", {
      method: 'GET',
      headers: options
    });

    if (!workoutCountResponse.ok) {
      throw new Error('Fetching data failed.');
    }

    const workoutCountData = await workoutCountResponse.json();

    let numWorkoutsInDb = dbFunctions.getUserWorkoutsCount(account_username);
    await fetchWorkoutsinRange(account_username, (workoutCountData.workout_count - numWorkoutsInDb), options);
    resolve(0)

  } catch (error) {
    console.error(error);
    reject(-1)
  }
  })
}

// @desc function to retrieve number of workouts
async function fetchWorkoutCount(){
  const response = await fetch("https://api.hevyapp.com/workout_count", {
    method: 'GET',
    headers: headers
  });
  const data = await response.json();
  console.log(data);
}
//ex: https://api.hevyapp.com/user_workouts_paged?username=limon020&limit=2&offset=0
// for 0 to nworkouts, fetch each workout 1 at a time. offset = i. username = account.username
async function fetchWorkout(apiURL){
  const response = await fetch(apiURL, {
    method: 'GET',
    headers: headers
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data.workouts;
}

// @desc fetches a workout using options param to set headers in fetch request
async function fetchWorkoutWithOptions(apiURL, options){
  const response = await fetch(apiURL, {
    method: 'GET',
    headers: options
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data.workouts;
}
// @desc uses the Hevy api to get prs
async function fetchPR(){
  const response = await fetch('https://api.hevyapp.com/set_personal_records', {
    method: 'GET',
    headers: headers
  });
  const data = await response.json();
  console.log(data);
}
module.exports = {
  login,
  updateUser
};

/*
// Uncomment for testing
main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('process.env.DATABASE_URI');
  console.log("connected");

  /isconnects in login function
  //mongoose.disconnect();
}
*/