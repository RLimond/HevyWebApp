const express = require('express')
const router = express.Router()
const dbFunctions = require('../JS/dbFunctions');
const verifyJWT = require('../middleware/verifyJWT')
const hevyAPI = require('../JS/hevyAPI')

router.use(verifyJWT) //apply middleware to all routes
// @desc get user data
router.get(`/get-user`, (req, res) => {
  const username = req.user
  dbFunctions.getUser(username)
    .then(function (foundUser) {
      if (foundUser) {
        return res.status(200).send(foundUser);
      } else {
        return res.status(404).send({ message: 'User not found' });
      }
    })
    .catch(function (error) {
      //console.error(error);
      return res.status(500).send({ error: 'Failed to fetch the user data' });
    });
});
// @desc get followers of user
router.get('/get-user-following', (req, res) => {
  const username = req.user
  dbFunctions.getUserFollowing(username)
  .then(function (foundUsers) {
    if (foundUsers) {
      return res.status(200).send(foundUsers);
    } else {
      return res.status(404).send({ message: 'User not found' });
    }
  })
  .catch(function (error) {
    //console.error(error);
    return res.status(500).send({ error: 'Failed to fetch the user data' });
  });
})
// @desc get the public information for a user
router.get(`/:user/public-info`, (req, res) => {
  const username = req.params.user
  dbFunctions.getUserPublic(username)
    .then(function (foundUser) {
      if (foundUser) {
        return res.status(200).send(foundUser);
      } else {
        return res.status(404).send({ message: 'User not found' });
      }
    })
    .catch(function (error) {
      //console.error(error);
      return res.status(500).send({ error: 'Failed to fetch the user data' });
    });
});
// @desc get most recent workout for a given user
router.get('/:username/most-recent-workout', async (req, res) => {
  const userToVerify = req.user
  const username = req.params.username;
  try {
    const mostRecentWorkout = await dbFunctions.getMostRecentWorkout(username,userToVerify);
    if (mostRecentWorkout) {
      if (mostRecentWorkout === -1){
        return res.status(401).send({message: 'Unauthorized'})
      }
      res.status(200).json(mostRecentWorkout);
    } else {
      return res.status(404).send({ message: 'Not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).send({ error: 'Failed to fetch the most recent workout.' });
  }
});
// @desc handle requests for exercises
router.get('/:username/exercises', async (req, res) => {
  const userToVerify = req.user
  const username = req.params.username;
  const query = req.query.query;
  let exercises_to_return;
  try {
    switch (query) {
      case 'getTopExercisesbySet':
        exercises_to_return = await dbFunctions.getTopExercisesbySet(username, 5, userToVerify);
        break;
      case 'getTopExercisesByWorkout':
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        exercises_to_return = await dbFunctions.getTopExercisesByWorkout(username, limit, userToVerify);
        break;
      default:
        return res.status(404).send({ message: 'Not found' });
    }

    if (exercises_to_return) {
      if (exercises_to_return === -1){
        res.status(401).send({message: 'Unauthorized'})
      }
      return res.status(200).send(exercises_to_return);
    } else {
      return res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).send({ message: 'Failed to fetch the exercises', error: error.message });
  }
});
// @desc get batches of workouts from a user
router.get('/:username/get-any-workout', async (req, res) => {
  const userToVerify = req.user
  const username = req.params.username;
  const skip = parseInt(req.query.skip);
  try {
    const mostRecentWorkout = await dbFunctions.getAnyWorkout(username, 10, skip, userToVerify);
    if (mostRecentWorkout) {
      if (mostRecentWorkout === -1){
        return res.status(401).send({message: 'Unauthorized'})
      }
      return res.status(200).json(mostRecentWorkout);
    } else {
      return res.status(404).send({ message: 'Not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).send({ error: 'Failed to fetch the workout.' });
  }
});
// @desc get a users time spent exercising weekly in past 3 months
router.get('/:username/workout-durations', async (req, res) => {
  const userToVerify = req.user
  const username = req.params.username;
  //console.log('duration request received');
  try {
    const results = await dbFunctions.getDurationPerWeekPast3Months(username,userToVerify);
    if (results) {
      if (results === -1){
        return res.status(401).send({message: 'Unauthorized'})
      }
      return res.status(200).send(results);
    } else {
      return res.status(404).send({ message: 'Not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});
// @desc handle requests for given user and exercise
router.get('/:username/:exercise', async (req, res) => {
  const userToVerify = req.user
  const exercise = req.params.exercise;
  const username = req.params.username;
  const query = req.query.query;
  let result;
  try {
    switch (query) {
      case 'prs':
        result = await dbFunctions.getExercisePr(username, exercise, userToVerify);
        break;
      case 'weightProgress':
        const timeFrame = req.query.months ? req.query.months : 12;
        result = await dbFunctions.getWeightsUsedForExercise(username, exercise, timeFrame, userToVerify);
        break;
      default:
        return res.status(404).send({ message: 'Not found' });
    }
    if (result) {
      if (result === -1){
        return res.status(401).send({message: 'Unauthorized'})
      }
      return res.status(200).send(result);
    } else {
      return res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});
// @desc get number of workouts a user has completed
router.get('/num-workouts', async (req, res) => {
  const userToVerify = req.user
  const username = req.user
  try{
    const numWorkouts = await dbFunctions.getUserWorkoutsCount(username, userToVerify)
    if (numWorkouts === -1){
      return res.status(401).send({message: 'Unauthorized'})
    }
    return res.status(200).send({numWorkouts})
  } catch (error) {
    return res.status(404).json({message : "does not exist"})
  }
})
// @desc send a friend request
router.post('/send-friend-request', async (req, res) => {
  try {
    // Extract necessary data from the request
    const requester = req.user // user is the logged in user assigned in baseQuery. Ensures requester is always the logged in user
    const { recipient } = req.body;
    if (requester === recipient){
      return res.status(400).json({message: 'Requester cannot also be Recipient'}) // incase someone tries to add themselves as a friend
    }
    // Validate the data
    if (!recipient || !requester) {
      return res.status(400).json({message: 'All fields are required'})
  }
    // Process the friend request (create a new FriendRequest document)
    const status = await dbFunctions.createFriendRequest(recipient, requester)
    // Send a response indicating success
    if (status === 0){
      res.status(200).json({ message: 'Friend request sent successfully' });
    } else if (status === 2){ 
      res.status(409).json({ message: 'Friend request already exists' });
    } else {
      res.status(400).json({ message: 'Friend request could not be sent' });
    }
  } catch (error) {
    // Handle any errors that occur during the request processing
    //console.error(error);
    res.status(500).json({ error: 'An error occurred while sending friend request' });
  }
});

// @desc handles accepting or rejecting friend request
router.post('/friend-request', async (req, res) => {
  try {
    const recipient = req.user; // Logged-in user who received the friend request
    const { requester, action } = req.body; // User who sent the friend request and the action (accept/reject)
    
    if (requester === recipient) {
      return res.status(400).json({ message: 'Requester cannot also be the Recipient' });
    }
    
    // Validate the data
    if (!recipient || !requester || !action) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    let status;
    if (action === 'accept') {
      status = await dbFunctions.acceptFriendRequest(recipient, requester);
    } else if (action === 'reject') {
      status = await dbFunctions.rejectFriend(recipient, requester);
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
    
    if (status === 0) {
      res.status(200).json({ message: 'Friend request processed successfully' });
    } else if (status === 2) { 
      res.status(409).json({ message: 'Friend already exists' });
    } else {
      res.status(400).json({ message: 'Friend request could not be processed' });
    }
  } catch (error) {
    //console.error(error);
    res.status(500).json({ error: 'An error occurred while processing friend request' });
  }
});
// @desc send a follow request
router.post('/send-follow-request', async (req, res) => {
  try {
    // Extract necessary data from the request
    const requester = req.user // user is the logged in user assigned in baseQuery. Ensures requester is always the logged in user
    const { recipient } = req.body;
    if (requester === recipient){
      return res.status(400).json({message: 'Requester cannot also be Recipient'}) // incase someone tries to add themselves as a friend
    }
    // Validate the data
    if (!recipient || !requester) {
      return res.status(400).json({message: 'All fields are required'})
  }
    // Process the Follow request (create a new FriendRequest document)
    const status = await dbFunctions.createFollowRequest(recipient, requester)
    // Send a response indicating success
    if (status === 0){
      res.status(202).json({ message: 'Follow request sent successfully' });
    } else if (status === -1){
        res.status(200).json({ message: 'Accepted' });
    } else if (status === 2){ 
        res.status(409).json({ message: 'Follow request already exists' });
    } else {
        res.status(400).json({ message: 'Follow request could not be sent' });
    }
  } catch (error) {
    // Handle any errors that occur during the request processing
    //console.error(error);
    res.status(500).json({ error: 'An error occurred while sending Follow request' });
  }
});

// @desc handles accepting or rejecting follow request
router.post('/follow-request', async (req, res) => {
  const removeFollower = req.query.remove
  try {
    const recipient = req.user; // Logged-in user who received the friend request
    const { requester, action } = req.body; // User who sent the friend request and the action (accept/reject)
    
    if (requester === recipient) {
      return res.status(400).json({ message: 'Requester cannot also be the Recipient' });
    }
    
    // Validate the data
    if (!recipient || !requester || !action) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    let status;
    if (action === 'accept') {
      status = await dbFunctions.acceptFollowRequest(recipient, requester);
    } else if (action === 'reject') {
        if (removeFollower === "true"){
          //console.log("removing follower")
          status = await dbFunctions.rejectFollower(requester, recipient);
        } else {
          status = await dbFunctions.rejectFollower(recipient, requester);
        }
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
    
    if (status === 0) {
      res.status(200).json({ message: 'request processed successfully' });
    } else if (status === 2) { 
      res.status(409).json({ message: 'Follower already exists' });
    } else {
      res.status(400).json({ message: 'request could not be processed' });
    }
  } catch (error) {
    //console.error(error);
    res.status(500).json({ error: 'An error occurred while processing follow request' });
  }
});
// @desc update profile privacy (private or public)
router.post('/update-privacy', async (req, res) => {
  const user = req.user; // Logged-in user
  const {updatedSetting} = req.body
  if (!user || updatedSetting === null){
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const result = await dbFunctions.updateProfilePrivacy(user, updatedSetting)
    if (result === 0){
      res.status(200).json({ message: 'privacy setting updated' });
    } else {
      res.status(500)
    }
  } catch (error) {
    return res.status(500)
  }
})
// @desc remove a users account
router.post('/delete-account', async (req, res) => {
  const userToDelete = req.user
  if (!userToDelete){
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (userToDelete === 'guest'){
    return res.status(403).json({message: 'Guest account is not allowed to delete itself'})
  }
  try {
    const result = await dbFunctions.deleteUser(userToDelete)
    if (result === 0){
      res.status(200).json({ message: 'account deleted' });
    } else {
      res.status(500)
    }
  } catch (error) {
    return res.status(500)
  }
})

// @desc update user in db with new workouts
router.post('/update', async (req, res) => {
  const userToUpdate = req.user
  try{
      await hevyAPI.updateUser(userToUpdate,req.body.password)
      res.status(200).send({message: 'Successful update' })
  } catch (error) {
      //console.error(error)
      res.status(400).send({message:error})
  }
})

module.exports = router;