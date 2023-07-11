const mongoose = require('mongoose');
const {userSchema, friendRequestSchema} = require('./Schemas.js');
const User = mongoose.model('User', userSchema);
const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

// @desc verifies that the user if following the specified account, used to allow access to data if following is true
async function verifyFollowing(user, target){
  if (user === target){ // if user is requesting their own data bypass other checks
    const userId = await User.findOne({username:user},{_id:1})
    if (!userId){
      return {status: 1}
    }
    return {status: 0, targetId: userId._id}
  }
  // if user if following target return signifier for true and the target _id
  const existingRequest = await User.findOne(
    {
      username: user,
      friends: { $elemMatch: { requester: target } }
    },
    { 'friends.$': 1 }
  );
  //console.log(existingRequest)
  if (!existingRequest){
    return {status: 1}
  }
  // user is following target, return true and target _id (because its indexed it allows fastest lookup)
  if (existingRequest.friends[0].follower === 0){
    return {status: 0, targetId: existingRequest.friends[0].requesterRef}
  }
  return {status:1}

}
// @desc Find exercise with most sets done
async function getTopExercisesbySet(username, limit=5, userToVerify){
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  const exercises = await User.aggregate([
    { $match: { _id: verifiedResult.targetId } },
    { $unwind: '$workouts' },
    { $unwind: '$workouts.exercises' },
    { $group: {
        _id: '$workouts.exercises.title', count: { $sum: { $size: "$workouts.exercises.sets"}}
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  //console.log(exercises);
  return exercises;
}
async function getTopExercisesByWorkout(username, limit=5, userToVerify) {
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  const exercises = await User.aggregate([
    { $match: { _id: verifiedResult.targetId } },
    { $unwind: '$workouts' },
    { $unwind: '$workouts.exercises' },
    { $group: {
        _id: '$workouts.exercises.title',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  return exercises;
}

// @desc returns information for specified user (logged in user)
async function getUser(user){
  const Users = await User.findOne(
     {username: user},{ _id: 1, username: 1, profile_pic: 1, created_at: 1, friends: 1, private_profile: 1}
    );
return Users;
}

// @desc returns public information for a user
async function getUserPublic(user){
  const Users = await User.findOne(
     {username: user},{ _id: 1, username: 1, profile_pic: 1, numFollowers: 1, numFollowing: 1}
    ).lean();
return Users;
}

// @desc returns information on who a user is following
async function getUserFollowing(user) {
  try {
    const friendUsernames = await User.aggregate([
      { $match: { username: user } },
      { $unwind: "$friends" },
      { $match: { "friends.follower": 0 } },
      {
        $lookup: {
          from: "users",
          localField: "friends.requesterRef",
          foreignField: "_id",
          as: "friendUser"
        }
      },
      { $project: { 
          "friendUser.username": 1,
          "friendUser.profile_pic": 1,
          "friendUser.created_at": 1
        } 
      }
    ]);
    const UserInfo = await User.findOne(
      {username: user},{ username: 1, profile_pic: 1, created_at: 1}
     );

    const combinedData = friendUsernames.reduce((result, { _id, friendUser }) => {
      friendUser.forEach((friend) => {
        const { username, profile_pic, created_at } = friend;
        result.push({ _id, username, profile_pic, created_at });
      });
      return result;
    }, []);
    
    return ([UserInfo, ...combinedData]);
  } catch (error) {
    console.error(error);
  }
}

// @desc returns #workouts the given user has completed
async function getUserWorkoutsCount(username, userToVerify) {
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  try {
    const user = await User.findOne({ _id: verifiedResult.targetId });
    if (!user) {
      throw new Error('User not found');
    }
    const workoutCount = user.workouts.length;
    //console.log(`User ${username} has ${workoutCount} workouts`);
    return workoutCount;
  } catch (error) {
    console.error(error);
    return null;
  }
}
// @desc returns the most recent workout a user has done
async function getMostRecentWorkout(username, userToVerify) {
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  try {
    const user = await User.findOne({  _id: verifiedResult.targetId }).sort({ 'workouts.created_at': -1 }).limit(1);
    if (user && user.workouts.length > 0) {
      const mostRecentWorkout = user.workouts[0];
      return mostRecentWorkout;
    } else {
      return null; // No user found or no workouts available
    }
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch the most recent workout.');
  }
}
// @desc find any consecutive workout(s) for a user based on the skip parameter
async function getAnyWorkout(username, limit = 10, skip = 0, userToVerify) {
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  try {
    const pipeline = [
      { $match: {  _id: verifiedResult.targetId } },
      { $unwind: "$workouts" },
      { $sort: { "workouts.created_at": -1 } },
      { $skip: skip },
      { $limit: limit },
      { $group: { _id: "$_id", 
            workouts: { $push: "$workouts" }
        }
      }
    ];

    const user = await User.aggregate(pipeline);

    if (user && user.length > 0) {
      return user[0].workouts;
    } else {
      return []; // No user found or no workouts available
    }
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch the recent workouts.');
  }
}
// @desc get the amount of time (hours) a user has spent in the gym in the past 3 months
async function getDurationPerWeekPast3Months(username, userToVerify) {
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  try {
    const result = await User.aggregate([
      {
        $match: {  _id: verifiedResult.targetId }
      },
      {
        $unwind: "$workouts"
      },
      {
        $match: {
          $and: [
            { "workouts.created_at": { $gte: threeMonthsAgo } },
            { "workouts.end_time": { $exists: true } },
            { "workouts.start_time": { $exists: true } }
          ]
        }
      },
      {
        $group: {
          _id: {
            week: { $week: { $toDate: "$workouts.created_at" } },
            year: { $year: { $toDate: "$workouts.created_at" } }
          },
          totalDuration: { $sum: { $subtract: ["$workouts.end_time", "$workouts.start_time"] } }
        }
      },
      {
        $project: {
          _id: 0,
          weekStartDate: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 1
            }
          },
          weekEndDate: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 7
            }
          },
          formattedWeek: {
              $dateToString: { format: "%m-%d", date: { $dateFromParts: { isoWeekYear: "$_id.year", isoWeek: "$_id.week" } } }
          },
          duration: { $round: [{ $divide: ["$totalDuration", 3600] }, 2] } // Round duration to 4 decimal places
        }
      },
      {
        $sort: { weekStartDate: 1 }
      }
    ]);
    return result;
  } catch (error) {
    console.error(error)
    throw new Error('Failed to fetch workout durations.');
  }
}
// @desc get personal records for a given exercise
async function getExercisePr(username, exercise, userToVerify){
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  // converts the string from url format to a format that the db can use
  // ex: Hammer%20Curl%20(Dumbbell) => Hammer curl (Dumbell)
  const title = exercise.replace(/%20/g, ' ');
  try {
    const pipeline = [
      { $match: {  _id: verifiedResult.targetId } },
      { $unwind: "$workouts" },
      { $unwind: '$workouts.exercises' },
      { $match: {"workouts.exercises.title": title}},
      {
        $group: {
          _id: {
            username: "$username",
            exercise_id: "$workouts.exercises.exercise_id"
          },
          maxWeight: { $max: "$workouts.exercises.sets.weight_kg" }
        }
      },
    ];
    const result = await User.aggregate(pipeline);
    // find most reps done with the highest weight found in previous query
    const pipeline2 = [
      { $match: {  _id: verifiedResult.targetId } },
      { $unwind: "$workouts" },
      { $unwind: '$workouts.exercises' },
      { $match: { "workouts.exercises.title": title } },
      { $match: { "workouts.exercises.sets.weight_kg": Math.max(parseFloat(result[0].maxWeight)) } },
      {
        $group: {
          _id: {
            username: "$username",
          },
          reps: { $max: "$workouts.exercises.sets.reps" }
        }
      }
    ];
    const result2 = await User.aggregate(pipeline2);
    // combine weights and reps => [[225, 8], [225, 6] etc], weights are in kg at this stage
    const combinedArray = result[0].maxWeight.map((value, index) => [value, result2[0].reps[index]]);
    // sort to find set with the most reps done with the highest weight
    const sortedArray = combinedArray.sort((a, b) => {
      if (a[0] !== b[0]) {
        return b[0] - a[0]; // Sort by first number in descending order
      } else {
        return b[1] - a[1]; // Sort by second number in descending order within groups of equal first numbers
      }
    });
    // calculate one rep max using formula (weight (lbs) / [1.0278 - (0.0278 * reps)]), weights are being converted from kg to lb here
    const retVal = {highestWeight: Math.round(sortedArray[0][0] * 2.20462) , reps: sortedArray[0][1], 
        oneRepMax: Math.round((Math.round(sortedArray[0][0] * 2.20462)/ [(1.0278) - (0.0278 * sortedArray[0][1])]))}
    return retVal
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}
// @desc get the highest weight (lb) for a given exercise weekly for the given number of weeks
async function getWeightsUsedForExercise(username, exercise, timeFrame=3, userToVerify) {
  const verifiedResult = await verifyFollowing(userToVerify, username)
  if (verifiedResult.status !== 0){ // failed verification so return to indicate failure
    return -1
  }
  const numMonthsAgo = new Date();
  numMonthsAgo.setMonth(numMonthsAgo.getMonth() - timeFrame);
  // converts the string from url format to a format that the db can use
  // ex: Hammer%20Curl%20(Dumbbell) => Hammer curl (Dumbell)
  function formatString(str){
    return (str.replace(/%20/g, ' ')).replace(/\b\w/g, (char) => char.toUpperCase());
  }
  const title = formatString(exercise);
  try {
    const pipeline = [
      {
        $match: {  _id: verifiedResult.targetId },
      },
      {
        $unwind: "$workouts"
      },
      {
        $match: {
          "workouts.created_at": { $gte: numMonthsAgo }
        }
      },
      {
        $unwind: "$workouts.exercises"
      },
      { $match: { "workouts.exercises.title": title } },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$workouts.created_at" },
            year: { $isoWeekYear: "$workouts.created_at" },
            exerciseId: "$workouts.exercises.exercise_id"
          },
          maxWeight: { $max: { $multiply: [ { $max: "$workouts.exercises.sets.weight_kg" }, 2.20462 ] } }
        }
      },
      {
        $project: {
          _id: 0,
          weekStartDate: {
            $dateToString: {
              format: "%m-%d",
              date: {
                $dateFromParts: {
                  isoWeekYear: "$_id.year",
                  isoWeek: "$_id.week",
                  isoDayOfWeek: 1
                }
              }
            }
          },
          weekEndDate: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 7
            }
          },
          exerciseId: "$_id.exerciseId",
          maxWeight: 1
        }
      },
      {
        $sort: { weekEndDate: 1 }
      }
    ];
    const result = await User.aggregate(pipeline)
    return result;
  } catch (error) {
    //console.error(error)
    throw new Error('Failed to fetch workout weights.');
  }
}
// @desc creates a friendRequest document for the recipient and requester
async function createFriendRequest(recipient, requester){
  const recipientId = await User.findOne({username: recipient}, { id: 1 ,profile_pic: 1}).lean()
  const requesterId = await User.findOne({username: requester}, { id: 1, profile_pic: 1}).lean()
  //console.log(recipientId, requesterId)
  // return failure code if one of the two users does not exist
  if (!recipientId || !requesterId){
    return 1
  }
  const existingRequest = await User.findOne({
    id: recipientId.id,
    'friends.requesterId': requesterId.id
  });

  // Check if a friend request already exists from the requester
  if (existingRequest) {
    return 2; // Return a code to indicate duplicate request
  }
  // construct FriendRequest object for recipient
  const recipientForm = {
    requester: requester,
    requesterId: requesterId.id,
    requesterPic: requesterId.profile_pic,
    recipient: recipient,
    recipientId : recipientId.id,
    recipientPic: recipientId.profile_pic,
    status : 1 //requested
  }
  try {
      await User.findOneAndUpdate(
      { id: recipientId.id },
      { $push: { friends: recipientForm } },
      { upsert: true, new: true }
    );
    // The operation was successful
  } catch (error) {
    // An error occurred during the operation
    return 1
  }
  // construct FriendRequest object for requester
  const requesterForm = {
      requester: recipient,
      requesterId: recipientId.id,
      requesterPic: recipientId.profile_pic,
      recipient: requester,
      recipientId : requesterId.id,
      recipientPic: requesterId.profile_pic,
      status : 2 //awaiting response
  }
  try {
    await User.findOneAndUpdate(
    { id: requesterId.id },
    { $push: { friends: requesterForm } },
    { upsert: true, new: true }
    );
      // The operation was successful
    } catch (error) {
      // An error occurred during the operation
      return 1
    }

  //return 0 on success
  return 0
}
/* 
  Friend requests with a status of 2 indicate that the current user is the requester. A status of 1 indicates the recipient is the current User.
  to display a list of incomming requests, display the requester username of all requests that have a status of 1.
*/
// @desc accept an incomming friend request
async function acceptFriendRequest(recipient, requester){
  const recipientId = await User.findOne({username: recipient}, { id: 1 }).lean()
  const requesterId = await User.findOne({username: requester}, { id: 1 }).lean()
  if (!recipientId || !requesterId){
    return 1
  }
  try {
    await User.findOneAndUpdate(
    {id: recipientId.id, "friends.requesterId": requesterId.id },
    { $set: { "friends.$.status": 3 }  }
  );
  await User.findOneAndUpdate(
    {id: requesterId.id, "friends.requesterId": recipientId.id },
    { $set: { "friends.$.status": 3 }  }
  );
  // The operation was successful
  } catch (error) {
    //console.error(error)
    return 1
  }
  return 0
}
// @desc reject an incomming friend request or remove a friend
async function rejectFriend(recipient, requester){
  const recipientId = await User.findOne({username: recipient}, { id: 1 }).lean()
  const requesterId = await User.findOne({username: requester}, { id: 1 }).lean()
  if (!recipientId || !requesterId){
    return 1
  }
  try {
    await User.findOneAndUpdate(
      { id: recipientId.id },
      { $pull: { friends: { requesterId: requesterId.id } } }
    );
    await User.findOneAndUpdate(
      {id: requesterId.id},
      { $pull: { friends: { requesterId: recipientId.id } }   }
    );
  // The operation was successful
  } catch (error) {
    //console.error(error)
    return 1
  }
  return 0
}

// @desc send a follow request to another user
async function createFollowRequest(recipient, requester){
  const recipientId = await User.findOne({username: recipient}, { id: 1 ,profile_pic: 1, private_profile: 1}).lean()
  const requesterId = await User.findOne({username: requester}, { id: 1, profile_pic: 1}).lean()
  //console.log(recipientId)
  // console.log(recipientId)
  // function to bypass requests recipient has public profile and form already exists
  async function publicProfileHandler(){
      try {
        await User.findOneAndUpdate(
          { id: recipientId.id, "friends.requesterId": requesterId.id },
          { $set: { "friends.$.following": 0 }, $inc: { numFollowers: 1 } }
        );
        await User.findOneAndUpdate(
          {id: requesterId.id, "friends.requesterId": recipientId.id},
          { $set: { "friends.$.follower": 0 },  $inc: { numFollowing: 1 }}
        );
      // The operation was successful
      } catch (error) {
        //console.error(error)
        return 1
      }
    return -1
  }
  let result = 0
  //console.log(recipientId, requesterId)
  // return failure code if one of the two users does not exist
  if (!recipientId || !requesterId){
    return 1
  }
  const existingRequest = await User.findOne({
    id: recipientId.id,
    'friends.requesterId': requesterId.id
  });

  // already following, dont send new request
  if (existingRequest?.friends[0].following === 0 ){
    return 2
  }
  // already sent request
  if (existingRequest?.friends[0].following === 1 ){
    // if profile has become public since last request was sent allow user to resend it
    if(!recipientId.private_profile){
      result = await publicProfileHandler();
      return result
    }
    return 2
  }

  // form already exists and we are retrying a follow request, only need to update value not create a new form
  if (existingRequest?.friends[0].following === 3){
    // handle request differently if profile is public
    if(!recipientId.private_profile){
      result = await publicProfileHandler();
      return result
    }
    try {
      await User.findOneAndUpdate(
      {id: recipientId.id, "friends.requesterId": requesterId.id },
      { $set: { "friends.$.following": 1 }  }
    );
    await User.findOneAndUpdate(
      {id: requesterId.id, "friends.requesterId": recipientId.id },
      { $set: { "friends.$.follower": 1 }  }
    );
    // The operation was successful
    } catch (error) {
      //console.error(error)
      return 1
  }
    return 0
  }
  // increment follower counts accordingly if profile is public
  if (recipientId?.private_profile === false){
    try {
      await User.findOneAndUpdate(
        { id: recipientId.id,},
        { $inc: { numFollowers: 1 } }
      );
      await User.findOneAndUpdate(
        {id: requesterId.id},
        {$inc: { numFollowing: 1 }}
      );
    // The operation was successful
    } catch (error) {
      //console.error(error)
      return 1
    }
  }

  // Construct FriendRequest object for recipient
  let recipientForm = new FriendRequest({
    requesterRef: requesterId._id, // Placeholder for requesterForm reference
    requester: requester,
    requesterId: requesterId.id,
    requesterPic: requesterId.profile_pic,
    recipient: recipient,
    recipientId: recipientId.id,
    recipientPic: recipientId.profile_pic,
    status: 0,
    following: (recipientId?.private_profile === false) ? 0 : 1, // Requester is requesting to follow recipient
    follower: 3
  });

  // Construct FriendRequest object for requester
  const requesterForm = new FriendRequest({
    requesterRef: recipientId._id, // Reference to the recipientForm
    requester: recipient,
    requesterId: recipientId.id,
    requesterPic: recipientId.profile_pic,
    recipient: requester,
    recipientId: requesterId.id,
    recipientPic: requesterId.profile_pic,
    status: 2,
    follower: (recipientId?.private_profile === false) ? 0 : 1, // Request received, pending
    following: 3
  });

  try {
      await User.findOneAndUpdate(
      { id: recipientId.id },
      { $push: { friends: recipientForm } },
      { upsert: true, new: true }
    );
    // The operation was successful
  } catch (error) {
    // An error occurred during the operation
    return 1
  }
  try {
    await User.findOneAndUpdate(
    { id: requesterId.id },
    { $push: { friends: requesterForm } },
    { upsert: true, new: true }
    );
      // The operation was successful
    } catch (error) {
      // An error occurred during the operation
      return 1
    }

  //return 0 or -1 on success. -1 indicates follower is accepted immediately, no request needed
  if (recipientId?.private_profile === false){
    return -1
  }
  return 0
}
// @desc accept a follow request
async function acceptFollowRequest(recipient, requester){
  const recipientId = await User.findOne({username: recipient}, { id: 1 }).lean()
  const requesterId = await User.findOne({username: requester}, { id: 1 }).lean()
  console.log(recipientId._id)
  if (!recipientId || !requesterId){
    return 1
  }
  try {
    const check = await User.findOne(
      { _id: recipientId._id, "friends.requesterId": requesterId.id },
      { "friends.$": 1 }
    );
    const followingValue = check?.friends?.[0]?.following;
    if (followingValue !== 0){ // prevent duplicate requests by ignoring any request after following has been set
    await User.findOneAndUpdate(
      { _id: recipientId._id, "friends.requesterId": requesterId.id },
      { $set: { "friends.$.following": 0 }, $inc: { numFollowers: 1 } }
    );
    await User.findOneAndUpdate(
      {_id: requesterId._id, "friends.requesterId": recipientId.id},
      { $set: { "friends.$.follower": 0 },  $inc: { numFollowing: 1 }}
    );
    }
  // The operation was successful
  } catch (error) {
    //console.error(error)
    return 1
  }
  return 0
}
// @desct reject a follow request or remove a follower
async function rejectFollower(recipient, requester){
  const recipientId = await User.findOne({username: recipient}, { id: 1 }).lean()
  const requesterId = await User.findOne({username: requester}, { id: 1 }).lean()
  if (!recipientId || !requesterId){
    return 1
  }
  const friendForm = await User.findOne(
    { _id: recipientId._id, "friends.requesterId": requesterId.id },
    { "friends.$": 1 }
  );
  // recipient is removing this follower so we must decrement follower count
  if (friendForm?.friends[0].following === 0){
    try {
      await User.findOneAndUpdate( // possible optimization: dont research, just use the friendForm from above
        {_id: recipientId._id, "friends.requesterId": requesterId.id },
        { $set: { "friends.$.following": 3 }, $inc: { numFollowers: -1 }} // decrement the recipients's follower count, a follower was removed
      );
      await User.findOneAndUpdate(
        {_id: requesterId._id, "friends.requesterId": recipientId.id },
        { $set: { "friends.$.follower": 3 }, $inc: { numFollowing: -1 }} // decrement the requester's following count because they no longer follow recipient
      );
    // The operation was successful
    } catch (error) {
      //console.error(error)
      return 1
    }
    return 0
  }
  // recipient is denying request, no need to decrement follower counts
  else {
    try {
      await User.findOneAndUpdate(
        {_id: recipientId._id, "friends.requesterId": requesterId.id },
        { $set: { "friends.$.following": 3 }  }
      );
      await User.findOneAndUpdate(
        {_id: requesterId._id, "friends.requesterId": recipientId.id },
        { $set: { "friends.$.follower": 3 }  }
      );
    // The operation was successful
    } catch (error) {
      //console.error(error)
      return 1
    }
    return 0
  }
}
// @desc update profile privacy (public or private)
async function updateProfilePrivacy(user, status){
  try {
    await User.updateOne(
      {username: user },
      { $set: { private_profile: status }  }
    );
  } catch (error) {
    return 1
  }
  return 0
}
// @desc delete user data, update following/followers
async function deleteUser(user){
  // recalculate the number of followers and following for the friends of the deleted user by checking the length of their friends array with the corresponding following =0/follower=0
    const userToDelete = await User.findOne({ username: user }, { id: 1, friends: 1 });
    if (userToDelete){
      try {
        await Promise.all( // ensure all updates occur before deleting user
          userToDelete.friends.map(async (friend) => { // iterate over every friend and remove the relationship to the deletedUser
            const updatedFriendForm = await User.findOneAndUpdate(
              { id: friend.requesterId },
              { $pull: { friends: { requesterId: userToDelete.id } } },
              { new: true } // Return the updated document
            );
            // update the count of numFollower/numFollowing now that we have changed the friend array
            const numFollowers = updatedFriendForm.friends.filter(
              (friend) => friend.following === 0
            ).length;
            
            const numFollowing = updatedFriendForm.friends.filter(
              (friend) => friend.follower === 0
            ).length;
            
            await User.updateOne(
              { id: friend.requesterId },
              {
                $set: { 
                  'numFollowing': numFollowing,
                  'numFollowers': numFollowers
                }
              }
            );
          })
        );
      
        await User.deleteOne({ id: userToDelete.id });
        return 0;
      } catch (error) {
        return 1;
      }
  }
  return 1
}

//Uncomment main for testing purposes
/*
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(procces.env.DATABASE_URI);
  console.log("connected");
  mongoose.disconnect();
  console.log("disconnected");
}
*/

module.exports = {
  getTopExercisesByWorkout,
  getUser,
  getUserPublic,
  getUserWorkoutsCount,
  getMostRecentWorkout,
  getAnyWorkout,
  getTopExercisesbySet,
  getDurationPerWeekPast3Months,
  getExercisePr,
  getWeightsUsedForExercise,
  createFriendRequest,
  acceptFriendRequest,
  rejectFriend,
  createFollowRequest,
  acceptFollowRequest,
  rejectFollower,
  updateProfilePrivacy,
  deleteUser,
  getUserFollowing


};